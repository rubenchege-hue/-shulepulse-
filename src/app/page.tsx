"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Loading } from "@/components/ui/loading";

export default function DashboardRedirect() {
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function redirect() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      const role = profile?.role || "teacher";
      router.push(`/${role}`);
    }
    redirect();
  }, [supabase, router]);

  return (
    <div className="flex h-full items-center justify-center">
      <Loading size="lg" text="Redirecting to your dashboard..." />
    </div>
  );
}
