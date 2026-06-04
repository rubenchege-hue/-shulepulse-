"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loading } from "@/components/ui/loading";
import { ArrowLeft, BookOpen, School, Trophy, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getInitials, formatDate, formatScore, computeGrade, getCbcRatingLabel, getProgressLevelLabel } from "@/lib/utils";
import type { Student, Class } from "@/lib/types/database";

const ratingColors: Record<string, any> = { E: "success", B: "primary", A: "warning", P: "danger" };
const levelColors: Record<string, any> = { outstanding: "success", excellent: "primary", competent: "default", developing: "warning", beginner: "danger" };

export default function TeacherStudentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const supabase = createClient();
  const [student, setStudent] = useState<(Student & { classes?: Class }) | null>(null);
  const [scores, setScores] = useState<any[]>([]);
  const [cbcRecords, setCbcRecords] = useState<any[]>([]);
  const [cocurricularRecords, setCocurricularRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"academic" | "cbc" | "cocurricular">("academic");

  useEffect(() => {
    async function load() {
      const { data: studentData } = await supabase
        .from("students")
        .select("*, classes(*)")
        .eq("id", id)
        .single();
      if (!studentData) { setLoading(false); return; }
      setStudent(studentData as any);

      const [scoresRes, cbcRes, cocurRes] = await Promise.all([
        supabase.from("assessment_scores")
          .select("id, score, grade, assessment:assessments!inner(name, type, date, max_score, subjects(name))")
          .eq("student_id", id)
          .order("date", { ascending: false, referencedTable: "assessments" }),
        supabase.from("cbc_competency_records")
          .select("id, rating, notes, date, sub_strand:cbc_sub_strands!inner(name, strand:cbc_strands!inner(name, subjects!inner(name)))")
          .eq("student_id", id)
          .order("date", { ascending: false }),
        supabase.from("co_curricular_records")
          .select("id, progress_level, achievements, notes, date, activity:co_curricular_activities!inner(name, category)")
          .eq("student_id", id)
          .order("date", { ascending: false }),
      ]);

      if (scoresRes.data) setScores(scoresRes.data as any[]);
      if (cbcRes.data) setCbcRecords(cbcRes.data as any[]);
      if (cocurRes.data) setCocurricularRecords(cocurRes.data as any[]);
      setLoading(false);
    }
    load();
  }, [supabase, id]);

  if (loading) return <Loading size="lg" text="Loading student profile..." />;
  if (!student) return <div className="text-center py-12 text-zinc-500">Student not found</div>;

  const tabs = [
    { id: "academic" as const, label: "Academic (8-4-4)", icon: BookOpen, count: scores.length },
    { id: "cbc" as const, label: "CBC Competencies", icon: School, count: cbcRecords.length },
    { id: "cocurricular" as const, label: "Co-Curricular", icon: Trophy, count: cocurricularRecords.length },
  ];

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/teacher/students">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-lg font-bold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
            {getInitials(student.first_name, student.last_name)}
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{student.first_name} {student.last_name}</h1>
            <p className="text-sm text-zinc-500">
              {student.admission_number} · {student.classes?.name || "No class"} · {student.gender} · Enrolled {formatDate(student.enrollment_date)}
            </p>
          </div>
        </div>
        <Badge variant={student.status === "active" ? "success" : "warning"} className="ml-auto">
          {student.status}
        </Badge>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{scores.length}</p>
          <p className="text-xs text-zinc-500">Assessments</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold text-emerald-600">{cbcRecords.length}</p>
          <p className="text-xs text-zinc-500">CBC Ratings</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold text-amber-600">{cocurricularRecords.length}</p>
          <p className="text-xs text-zinc-500">Activities</p>
        </CardContent></Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-zinc-200 pb-2 dark:border-zinc-700">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              activeTab === tab.id
                ? "bg-white text-emerald-600 border-b-2 border-emerald-600 dark:bg-zinc-900 dark:text-emerald-400"
                : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
            <Badge variant="default" className="ml-1">{tab.count}</Badge>
          </button>
        ))}
      </div>

      {/* Academic Tab */}
      {activeTab === "academic" && (
        <div className="space-y-3">
          {scores.map((s: any) => {
            const assessment = s.assessment;
            const grade = s.grade || computeGrade(s.score, assessment?.max_score || 100);
            const gradeColor = grade.startsWith("A") ? "success" : grade.startsWith("B") ? "primary" : grade.startsWith("C") ? "warning" : "danger";
            return (
              <Card key={s.id}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium">{assessment?.name}</p>
                    <p className="text-xs text-zinc-500">
                      {assessment?.subjects?.name} · {assessment?.type} · {formatDate(assessment?.date)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold">{formatScore(s.score, assessment?.max_score)}</span>
                    <Badge variant={gradeColor}>{grade}</Badge>
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {scores.length === 0 && <p className="text-center text-zinc-500 py-8">No academic records yet</p>}
        </div>
      )}

      {/* CBC Tab */}
      {activeTab === "cbc" && (
        <div className="space-y-3">
          {cbcRecords.map((r: any) => (
            <Card key={r.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium">{r.sub_strand?.strand?.subjects?.name} - {r.sub_strand?.strand?.name}</p>
                    <p className="text-sm text-zinc-500">{r.sub_strand?.name}</p>
                    {r.notes && <p className="text-xs text-zinc-400 mt-1">{r.notes}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={ratingColors[r.rating]}>{r.rating} - {getCbcRatingLabel(r.rating)}</Badge>
                    <span className="text-xs text-zinc-400">{formatDate(r.date)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {cbcRecords.length === 0 && <p className="text-center text-zinc-500 py-8">No CBC records yet</p>}
        </div>
      )}

      {/* Co-Curricular Tab */}
      {activeTab === "cocurricular" && (
        <div className="space-y-3">
          {cocurricularRecords.map((r: any) => (
            <Card key={r.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium">{r.activity?.name}</p>
                    <p className="text-xs text-zinc-500 capitalize">{r.activity?.category}</p>
                    {r.achievements && <p className="text-sm text-amber-600 mt-1">🏆 {r.achievements}</p>}
                    {r.notes && <p className="text-xs text-zinc-400 mt-0.5">{r.notes}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={levelColors[r.progress_level]}>{getProgressLevelLabel(r.progress_level)}</Badge>
                    <span className="text-xs text-zinc-400">{formatDate(r.date)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {cocurricularRecords.length === 0 && <p className="text-center text-zinc-500 py-8">No co-curricular records yet</p>}
        </div>
      )}
    </div>
  );
}
