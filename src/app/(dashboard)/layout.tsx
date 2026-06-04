"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Sidebar } from "@/components/ui/sidebar";
import { Loading } from "@/components/ui/loading";
import { Menu, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { UserRole } from "@/lib/types/database";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  useEffect(() => {
    async function loadUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      // Get profile with role
      const { data: profile } = await supabase
        .from("profiles")
        .select("*, schools(name)")
        .eq("id", user.id)
        .single();

      setUser(user);
      setProfile(profile);
      setLoading(false);
    }
    loadUser();
  }, [supabase, router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loading size="lg" text="Loading ShulePulse..." />
      </div>
    );
  }

  const role = (profile?.role || "teacher") as UserRole;
  const schoolName = profile?.schools?.name;
  const userName = `${profile?.first_name || ""} ${profile?.last_name || ""}`.trim();

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        role={role === "admin" ? "admin" : role === "parent" ? "parent" : "teacher"}
        schoolName={schoolName}
        userName={userName}
        onLogout={handleLogout}
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex h-16 items-center gap-4 border-b border-zinc-200 bg-white px-4 dark:border-zinc-800 dark:bg-zinc-950 lg:px-6">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex-1" />
          <button className="relative rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800">
            <Bell className="h-5 w-5" />
            <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-white">
              3
            </span>
          </button>
        </header>
        {/* Main content */}
        <main className="flex-1 overflow-y-auto bg-zinc-50 p-4 dark:bg-zinc-950 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
