"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loading } from "@/components/ui/loading";
import {
  Users, GraduationCap, BookOpen, TrendingUp,
  BarChart3, PieChart, Activity, ArrowRight, School
} from "lucide-react";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart as RePieChart, Pie, Cell,
} from "recharts";

const COLORS = ["#10b981", "#3b82f6", "#8b5cf6", "#f59e0b", "#ef4444", "#06b6d4", "#ec4899"];

interface ClassDist {
  name: string;
  students: number;
}

interface GenderDist {
  name: string;
  value: number;
}

interface ClassPerf {
  name: string;
  students: number;
  assessments: number;
  avgScore: number | null;
}

interface ActivityItem {
  id: string;
  type: "assessment" | "enrollment" | "cbc" | "report";
  label: string;
  detail: string;
  date: string;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [classDist, setClassDist] = useState<ClassDist[]>([]);
  const [genderDist, setGenderDist] = useState<GenderDist[]>([]);
  const [classPerf, setClassPerf] = useState<ClassPerf[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function loadAll() {
      // --- Stat cards ---
      const { data: students } = await supabase.from("students").select("id, status, gender, class_id");
      const { data: classes } = await supabase.from("classes").select("id, name, section");
      const { data: teachers } = await supabase.from("profiles").select("id").eq("role", "teacher");
      const { data: assessments } = await supabase.from("assessments").select("id, class_id");
      const { data: scores } = await supabase.from("assessment_scores").select("score, assessment_id");
      const { data: reports } = await supabase.from("reports").select("id, status");

      const activeStudents = students?.filter((s) => s.status === "active").length || 0;
      const draftReports = reports?.filter((r) => r.status === "draft").length || 0;

      setStats({
        totalStudents: students?.length || 0,
        activeStudents,
        totalClasses: classes?.length || 0,
        totalTeachers: teachers?.length || 0,
        totalAssessments: assessments?.length || 0,
        draftReports,
      });

      // --- Class distribution ---
      const distMap = new Map<string, number>();
      classes?.forEach((c) => {
        const key = c.section ? `${c.name} - ${c.section}` : c.name;
        distMap.set(key, 0);
      });
      students?.forEach((s) => {
        if (s.class_id) {
          const cls = classes?.find((c) => c.id === s.class_id);
          if (cls) {
            const key = cls.section ? `${cls.name} - ${cls.section}` : cls.name;
            distMap.set(key, (distMap.get(key) || 0) + 1);
          }
        }
      });
      setClassDist(Array.from(distMap.entries()).map(([name, students]) => ({ name, students })));

      // --- Gender distribution ---
      const genderCount: Record<string, number> = {};
      students?.forEach((s) => {
        if (s.gender) {
          genderCount[s.gender] = (genderCount[s.gender] || 0) + 1;
        }
      });
      setGenderDist([
        { name: "Male", value: genderCount["male"] || 0 },
        { name: "Female", value: genderCount["female"] || 0 },
        { name: "Other", value: genderCount["other"] || 0 },
      ].filter((g) => g.value > 0));

      // --- Class performance ---
      const perfMap = new Map<string, { students: number; assessments: number; totalScore: number; scoreCount: number }>();
      classes?.forEach((c) => {
        const key = c.section ? `${c.name} - ${c.section}` : c.name;
        perfMap.set(key, { students: 0, assessments: 0, totalScore: 0, scoreCount: 0 });
      });
      students?.forEach((s) => {
        if (s.class_id) {
          const cls = classes?.find((c) => c.id === s.class_id);
          if (cls) {
            const key = cls.section ? `${cls.name} - ${cls.section}` : cls.name;
            const entry = perfMap.get(key);
            if (entry) entry.students++;
          }
        }
      });
      // Count assessments per class
      assessments?.forEach((a) => {
        if (a.class_id) {
          const cls = classes?.find((c) => c.id === a.class_id);
          if (cls) {
            const key = cls.section ? `${cls.name} - ${cls.section}` : cls.name;
            const entry = perfMap.get(key);
            if (entry) entry.assessments++;
          }
        }
      });
      // Compute average scores per class
      if (scores && assessments) {
        const assessmentClassMap = new Map<string, string>();
        assessments.forEach((a) => {
          if (a.class_id) {
            const cls = classes?.find((c) => c.id === a.class_id);
            if (cls) {
              const key = cls.section ? `${cls.name} - ${cls.section}` : cls.name;
              assessmentClassMap.set(a.id, key);
            }
          }
        });
        scores.forEach((s) => {
          const className = assessmentClassMap.get(s.assessment_id);
          if (className) {
            const entry = perfMap.get(className);
            if (entry) {
              entry.totalScore += s.score;
              entry.scoreCount++;
            }
          }
        });
      }
      setClassPerf(Array.from(perfMap.entries()).map(([name, data]) => ({
        name,
        students: data.students,
        assessments: data.assessments,
        avgScore: data.scoreCount > 0 ? Math.round((data.totalScore / data.scoreCount) * 10) / 10 : null,
      })));

      // --- Recent activity ---
      const activityItems: ActivityItem[] = [];

      // Recent assessments
      const { data: recentAssessments } = await supabase
        .from("assessments")
        .select("id, name, type, created_at, subjects(name)")
        .order("created_at", { ascending: false })
        .limit(4);
      recentAssessments?.forEach((a) => {
        activityItems.push({
          id: `assess-${a.id}`,
          type: "assessment",
          label: (a as any).subjects?.name || a.type,
          detail: a.name,
          date: a.created_at,
        });
      });

      // Recent students
      const { data: recentStudents } = await supabase
        .from("students")
        .select("id, first_name, last_name, admission_number, created_at")
        .order("created_at", { ascending: false })
        .limit(4);
      recentStudents?.forEach((s) => {
        activityItems.push({
          id: `student-${s.id}`,
          type: "enrollment",
          label: "New Student",
          detail: `${s.first_name} ${s.last_name} (${s.admission_number})`,
          date: s.created_at,
        });
      });

      // Recent reports
      const { data: recentReports } = await supabase
        .from("reports")
        .select("id, status, created_at")
        .order("created_at", { ascending: false })
        .limit(3);
      recentReports?.forEach((r) => {
        activityItems.push({
          id: `report-${r.id}`,
          type: "report",
          label: `Report ${r.status}`,
          detail: `Report card ${r.status === "published" ? "published" : "in draft"}`,
          date: r.created_at,
        });
      });

      // Sort all activity by date descending
      activityItems.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setActivities(activityItems.slice(0, 8));

      setLoading(false);
    }
    loadAll();
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
      color: "text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400",
    },
    {
      title: "Classes",
      value: stats.totalClasses,
      icon: BookOpen,
      color: "text-purple-600 bg-purple-100 dark:bg-purple-900/30 dark:text-purple-400",
    },
    {
      title: "Teachers",
      value: stats.totalTeachers,
      icon: TrendingUp,
      color: "text-amber-600 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400",
    },
    {
      title: "Assessments",
      value: stats.totalAssessments,
      icon: BarChart3,
      color: "text-rose-600 bg-rose-100 dark:bg-rose-900/30 dark:text-rose-400",
    },
    {
      title: "Draft Reports",
      value: stats.draftReports,
      icon: PieChart,
      color: "text-cyan-600 bg-cyan-100 dark:bg-cyan-900/30 dark:text-cyan-400",
    },
  ];

  const activityBadge = (type: string) => {
    switch (type) {
      case "assessment": return <Badge variant="primary">Assessment</Badge>;
      case "enrollment": return <Badge variant="success">New</Badge>;
      case "report": return <Badge variant="warning">Report</Badge>;
      case "cbc": return <Badge variant="secondary">CBC</Badge>;
      default: return <Badge>{type}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          School overview and performance analytics
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-6">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 truncate">
                    {stat.title}
                  </p>
                  <p className="mt-1 text-2xl sm:text-3xl font-bold">{stat.value}</p>
                </div>
                <div className={`rounded-lg p-2 sm:p-3 shrink-0 ${stat.color}`}>
                  <stat.icon className="h-4 w-4 sm:h-6 sm:w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Class distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-emerald-500" />
              Student Distribution by Class
            </CardTitle>
          </CardHeader>
          <CardContent>
            {classDist.length > 0 ? (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={classDist} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-zinc-200 dark:stroke-zinc-700" />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 12 }}
                      className="text-zinc-500"
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fontSize: 12 }}
                      className="text-zinc-500"
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: "8px",
                        border: "1px solid #e4e4e7",
                        fontSize: "13px",
                      }}
                    />
                    <Bar dataKey="students" fill="#10b981" radius={[4, 4, 0, 0]} name="Students" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-sm text-zinc-500 py-8 text-center">No class data available</p>
            )}
          </CardContent>
        </Card>

        {/* Gender breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5 text-purple-500" />
              Gender Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            {genderDist.length > 0 ? (
              <div className="flex items-center justify-center h-72">
                <div className="w-48 h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <RePieChart>
                      <Pie
                        data={genderDist}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={4}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {genderDist.map((_, idx) => (
                          <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </RePieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ) : (
              <p className="text-sm text-zinc-500 py-8 text-center">No gender data available</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Class Performance Table + Activity Feed */}
      <div className="grid gap-6 lg:grid-cols-7">
        {/* Class performance */}
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <School className="h-5 w-5 text-blue-500" />
              Class Performance Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50">
                    <th className="px-4 py-3 text-left font-medium text-zinc-500">Class</th>
                    <th className="px-4 py-3 text-center font-medium text-zinc-500">Students</th>
                    <th className="px-4 py-3 text-center font-medium text-zinc-500">Assessments</th>
                    <th className="px-4 py-3 text-center font-medium text-zinc-500">Avg Score</th>
                    <th className="px-4 py-3 text-center font-medium text-zinc-500">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
                  {classPerf.map((c) => (
                    <tr key={c.name} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                      <td className="px-4 py-3 font-medium">{c.name}</td>
                      <td className="px-4 py-3 text-center text-zinc-600">{c.students}</td>
                      <td className="px-4 py-3 text-center text-zinc-600">{c.assessments}</td>
                      <td className="px-4 py-3 text-center font-semibold">
                        {c.avgScore !== null ? (
                          <span className={c.avgScore >= 70 ? "text-emerald-600" : c.avgScore >= 50 ? "text-amber-600" : "text-red-600"}>
                            {c.avgScore}%
                          </span>
                        ) : (
                          <span className="text-zinc-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {c.assessments > 0 ? (
                          <Badge variant="success">Active</Badge>
                        ) : c.students > 0 ? (
                          <Badge variant="warning">No Data</Badge>
                        ) : (
                          <Badge variant="secondary">Empty</Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                  {classPerf.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-zinc-500">
                        No class data available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Activity Feed */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-amber-500" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activities.length > 0 ? (
              <div className="space-y-4">
                {activities.map((item) => (
                  <div key={item.id} className="flex items-start gap-3">
                    <div className="mt-0.5 shrink-0">{activityBadge(item.type)}</div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-zinc-600 dark:text-zinc-400 truncate">
                        {item.detail}
                      </p>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        {formatDate(item.date)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-zinc-500 py-4">No recent activity</p>
            )}
            <div className="mt-4 pt-3 border-t border-zinc-200 dark:border-zinc-700">
              <Link
                href="/admin/assessments"
                className="flex items-center justify-between text-sm text-emerald-600 hover:text-emerald-700 font-medium"
              >
                View all assessments
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
