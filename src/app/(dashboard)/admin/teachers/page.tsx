"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loading } from "@/components/ui/loading";
import { getInitials } from "@/lib/utils";
import type { Profile } from "@/lib/types/database";

export default function AdminTeachersPage() {
  const [teachers, setTeachers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    supabase
      .from("profiles")
      .select("*")
      .eq("role", "teacher")
      .order("first_name")
      .then(({ data }) => {
        if (data) setTeachers(data);
        setLoading(false);
      });
  }, [supabase]);

  if (loading) return <Loading size="lg" text="Loading teachers..." />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Teachers</h1>
        <p className="text-sm text-zinc-500">{teachers.length} teachers</p>
      </div>
      <Card>
        <CardContent className="p-0 divide-y divide-zinc-200 dark:divide-zinc-800">
          {teachers.map((teacher) => (
            <div key={teacher.id} className="flex items-center gap-4 px-6 py-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 text-sm font-semibold text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                {getInitials(teacher.first_name, teacher.last_name)}
              </div>
              <div className="flex-1">
                <p className="font-medium">
                  {teacher.first_name} {teacher.last_name}
                </p>
                <p className="text-sm text-zinc-500">{teacher.phone || "No contact"}</p>
              </div>
              <Badge variant={teacher.is_active ? "success" : "warning"}>
                {teacher.is_active ? "Active" : "Inactive"}
              </Badge>
            </div>
          ))}
          {teachers.length === 0 && (
            <div className="px-6 py-12 text-center text-sm text-zinc-500">
              No teachers added yet. Teachers will appear here once they create accounts.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
