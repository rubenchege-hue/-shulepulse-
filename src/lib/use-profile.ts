"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useDevAuth } from "@/lib/dev-auth";
import type { Profile } from "@/lib/types/database";

export function useProfile() {
  const { user: devUser } = useDevAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    if (!devUser) {
      setLoading(false);
      return;
    }

    async function fetchProfile() {
      if (!devUser) return;
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", devUser.id)
        .single();

      if (data) {
        setProfile(data as Profile);
      }
      setLoading(false);
    }

    fetchProfile();
  }, [devUser, supabase]);

  return { profile, loading, userId: devUser?.id, schoolId: profile?.school_id };
}
