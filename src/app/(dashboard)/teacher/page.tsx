"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useProfile } from "@/lib/use-profile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loading } from "@/components/ui/loading";
import { Users, ClipboardList, BarChart3, Trophy, ArrowRight } from "lucide-react";

export default function TeacherDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const { userId } = useProfile();

  useEffect(() => {
    if (!userId) return;

    async function loadStats() {
      const { data: students } = await supabase
        .from("students")
        .select("id, status")
        .eq("status", "active");

      const { data: assessments } = await supabase
        .from("assessments")
        .select("id")
        .eq("created_by", userId);

      setStats({
        totalStudents: students?.length || 0,
        totalAssessments: assessments?.length || 0,
      });
      setLoading(false);
    }
    loadStats();
  }, [userId, supabase]);

  if (loading) return <Loading size="lg" text="Loading dashboard..." />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Teacher Dashboard</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Manage your students&apos; progress
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "My Students", value: stats.totalStudents, icon: Users, href: "/teacher/students", color: "text-blue-600 bg-blue-100" },
          { label: "Assessments", value: stats.totalAssessments, icon: ClipboardList, href: "/teacher/assessments", color: "text-emerald-600 bg-emerald-100" },
          { label: "CBC Tracking", value: "Active", icon: BarChart3, href: "/teacher/cbc", color: "text-purple-600 bg-purple-100" },
          { label: "Co-Curricular", value: "Active", icon: Trophy, href: "/teacher/cocurricular", color: "text-amber-600 bg-amber-100" },
        ].map((item) => (
          <Link key={item.label} href={item.href}>
            <Card className="transition-all hover:shadow-md hover:border-emerald-200 dark:hover:border-emerald-800">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-zinc-500">{item.label}</p>
                    <p className="mt-1 text-3xl font-bold">{item.value}</p>
                  </div>
                  <div className={`rounded-lg p-3 ${item.color}`}>
                    <item.icon className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/teacher/students" className="flex items-center justify-between rounded-lg border p-3 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors">
              <span className="text-sm font-medium">View my students</span>
              <ArrowRight className="h-4 w-4 text-zinc-400" />
            </Link>
            <Link href="/teacher/assessments/new" className="flex items-center justify-between rounded-lg border p-3 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors">
              <span className="text-sm font-medium">Create new assessment</span>
              <ArrowRight className="h-4 w-4 text-zinc-400" />
            </Link>
            <Link href="/teacher/cbc" className="flex items-center justify-between rounded-lg border p-3 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors">
              <span className="text-sm font-medium">Record CBC competencies</span>
              <ArrowRight className="h-4 w-4 text-zinc-400" />
            </Link>
            <Link href="/teacher/cocurricular" className="flex items-center justify-between rounded-lg border p-3 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors">
              <span className="text-sm font-medium">Log co-curricular progress</span>
              <ArrowRight className="h-4 w-4 text-zinc-400" />
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <Badge variant="primary">Assessment</Badge>
                <span className="text-zinc-600">End Term 1 exams finalized</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="success">CBC</Badge>
                <span className="text-zinc-600">Grade 4 - Mathematics competencies updated</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="purple">Sports</Badge>
                <span className="text-zinc-600">Inter-house athletics results recorded</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
