"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loading } from "@/components/ui/loading";
import { Users, BookOpen, Trophy, FileText, ArrowRight, School } from "lucide-react";
import { getInitials, getCbcRatingLabel } from "@/lib/utils";
import type { Student, Class } from "@/lib/types/database";

interface ChildWithClass extends Student {
  classes?: Class;
}

export default function ParentDashboard() {
  const [children, setChildren] = useState<ChildWithClass[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function loadChildren() {
      const { data: { user } } = await supabase.auth.getUser();
      const parentId = user?.id ?? '00000000-0000-0000-0000-000000000001';

      const { data: links } = await supabase
        .from("student_parents")
        .select("student_id")
        .eq("parent_id", parentId);

      if (!links || links.length === 0) {
        setLoading(false);
        return;
      }

      const studentIds = links.map((l) => l.student_id);
      const { data: students } = await supabase
        .from("students")
        .select("*, classes(*)")
        .in("id", studentIds);

      if (students) setChildren(students as ChildWithClass[]);
      setLoading(false);
    }
    loadChildren();
  }, [supabase]);

  if (loading) return <Loading size="lg" text="Loading your dashboard..." />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Parent Dashboard</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Track your child&apos;s progress across academics and activities
        </p>
      </div>

      {children.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="mx-auto h-12 w-12 text-zinc-300 dark:text-zinc-600" />
            <h3 className="mt-4 text-lg font-semibold">No children linked</h3>
            <p className="mt-2 text-sm text-zinc-500">
              Your account hasn&apos;t been linked to any students yet. Please contact your school administrator.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {children.map((child) => (
            <Card key={child.id} className="transition-all hover:shadow-md">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-lg font-bold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                      {getInitials(child.first_name, child.last_name)}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">
                        {child.first_name} {child.last_name}
                      </h3>
                      <p className="text-sm text-zinc-500">
                        {child.classes?.name || "No class assigned"}
                        {child.admission_number && ` · ${child.admission_number}`}
                      </p>
                    </div>
                  </div>
                  <Badge variant={child.status === "active" ? "success" : "warning"}>
                    {child.status}
                  </Badge>
                </div>

                <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <Link
                    href={`/parent/children/${child.id}/academic`}
                    className="flex items-center gap-2 rounded-lg border border-zinc-200 p-3 text-sm hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800 transition-colors"
                  >
                    <BookOpen className="h-4 w-4 text-blue-600" />
                    <span>Academic</span>
                  </Link>
                  <Link
                    href={`/parent/children/${child.id}/cbc`}
                    className="flex items-center gap-2 rounded-lg border border-zinc-200 p-3 text-sm hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800 transition-colors"
                  >
                    <School className="h-4 w-4 text-emerald-600" />
                    <span>CBC Progress</span>
                  </Link>
                  <Link
                    href={`/parent/children/${child.id}/cocurricular`}
                    className="flex items-center gap-2 rounded-lg border border-zinc-200 p-3 text-sm hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800 transition-colors"
                  >
                    <Trophy className="h-4 w-4 text-amber-600" />
                    <span>Co-Curricular</span>
                  </Link>
                  <Link
                    href={`/parent/children/${child.id}/reports`}
                    className="flex items-center gap-2 rounded-lg border border-zinc-200 p-3 text-sm hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800 transition-colors"
                  >
                    <FileText className="h-4 w-4 text-purple-600" />
                    <span>Reports</span>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
