"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loading } from "@/components/ui/loading";
import { Users, GraduationCap, BookOpen, TrendingUp } from "lucide-react";

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function loadStats() {
      const { data: students } = await supabase
        .from("students")
        .select("id, status");

      const { data: classes } = await supabase.from("classes").select("id");

      const { data: teachers } = await supabase
        .from("profiles")
        .select("id")
        .eq("role", "teacher");

      const activeStudents =
        students?.filter((s) => s.status === "active").length || 0;

      setStats({
        totalStudents: students?.length || 0,
        activeStudents,
        totalClasses: classes?.length || 0,
        totalTeachers: teachers?.length || 0,
      });
      setLoading(false);
    }
    loadStats();
  }, [supabase]);

  if (loading) return <Loading size="lg" text="Loading dashboard..." />;

  const statCards = [
    {
      title: "Total Students",
      value: stats.totalStudents,
      icon: Users,
      color: "text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400",
    },
    {
      title: "Active Students",
      value: stats.activeStudents,
      icon: GraduationCap,
      color:
        "text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400",
    },
    {
      title: "Classes",
      value: stats.totalClasses,
      icon: BookOpen,
      color:
        "text-purple-600 bg-purple-100 dark:bg-purple-900/30 dark:text-purple-400",
    },
    {
      title: "Teachers",
      value: stats.totalTeachers,
      icon: TrendingUp,
      color:
        "text-amber-600 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Overview of your school&apos;s data
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                    {stat.title}
                  </p>
                  <p className="mt-1 text-3xl font-bold">{stat.value}</p>
                </div>
                <div className={`rounded-lg p-3 ${stat.color}`}>
                  <stat.icon className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <a
              href="/admin/students/new"
              className="flex items-center gap-3 rounded-lg border border-zinc-200 p-3 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900 transition-colors"
            >
              <Users className="h-5 w-5 text-emerald-600" />
              Enroll a new student
            </a>
            <a
              href="/admin/classes"
              className="flex items-center gap-3 rounded-lg border border-zinc-200 p-3 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900 transition-colors"
            >
              <GraduationCap className="h-5 w-5 text-blue-600" />
              Manage classes & streams
            </a>
            <a
              href="/admin/subjects"
              className="flex items-center gap-3 rounded-lg border border-zinc-200 p-3 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900 transition-colors"
            >
              <BookOpen className="h-5 w-5 text-purple-600" />
              Configure subjects & CBC strands
            </a>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm">
              <div className="flex items-center gap-3">
                <Badge variant="success">New</Badge>
                <span className="text-zinc-600 dark:text-zinc-400">
                  5 students enrolled this week
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="primary">Updated</Badge>
                <span className="text-zinc-600 dark:text-zinc-400">
                  Term 2 assessments created for Grade 4
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="warning">Pending</Badge>
                <span className="text-zinc-600 dark:text-zinc-400">
                  3 pending report cards to review
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
