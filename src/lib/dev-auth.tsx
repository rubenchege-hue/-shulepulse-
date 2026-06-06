"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { useRouter } from "next/navigation";

export type DevUserRole = "admin" | "teacher" | "parent";

export interface DevUser {
  id: string;
  role: DevUserRole;
  firstName: string;
  lastName: string;
  schoolName: string;
  schoolId: string;
}

interface DevAuthContextType {
  user: DevUser | null;
  isLoading: boolean;
  login: (role: DevUserRole) => Promise<void>;
  logout: () => void;
}

const STORAGE_KEY = "dev-auth-user";

// Maps DevUserRole -> seed data values
const ROLE_CONFIG: Record<DevUserRole, { id: string; firstName: string; lastName: string }> = {
  admin: {
    id: "00000000-0000-0000-0000-000000000000",
    firstName: "Jane",
    lastName: "Kamau",
  },
  teacher: {
    // We'll query the DB for the teacher UUID dynamically
    id: "",
    firstName: "John",
    lastName: "Mwangi",
  },
  parent: {
    id: "00000000-0000-0000-0000-000000000001",
    firstName: "Grace",
    lastName: "Kimani",
  },
};

const DevAuthContext = createContext<DevAuthContextType>({
  user: null,
  isLoading: true,
  login: async () => {},
  logout: () => {},
});

export function DevAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<DevUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as DevUser;
        setUser(parsed);
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (role: DevUserRole) => {
    const config = ROLE_CONFIG[role];
    let userId = config.id;

    // For teacher, fetch the actual UUID from the database
    if (role === "teacher") {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { data } = await supabase
        .from("profiles")
        .select("id")
        .eq("role", "teacher")
        .limit(1)
        .maybeSingle();

      if (data?.id) {
        userId = data.id;
      } else {
        // Fallback: generate a placeholder
        userId = "00000000-0000-0000-0000-000000000002";
      }
    }

    // Fetch school info
    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();
    const { data: school } = await supabase
      .from("schools")
      .select("id, name")
      .limit(1)
      .maybeSingle();

    const devUser: DevUser = {
      id: userId,
      role,
      firstName: config.firstName,
      lastName: config.lastName,
      schoolName: school?.name || "My School",
      schoolId: school?.id || "",
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(devUser));
    setUser(devUser);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
  }, []);

  return (
    <DevAuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </DevAuthContext.Provider>
  );
}

export function useDevAuth() {
  const context = useContext(DevAuthContext);
  if (!context) {
    throw new Error("useDevAuth must be used within a DevAuthProvider");
  }
  return context;
}

export function useRequireAuth() {
  const { user, isLoading, logout } = useDevAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login");
    }
  }, [user, isLoading, router]);

  return { user, isLoading, logout };
}
