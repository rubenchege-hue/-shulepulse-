"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useDevAuth } from "@/lib/dev-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loading } from "@/components/ui/loading";
import {
  BookOpen,
  TrendingUp,
  TrendingDown,
  ChevronRight,
  Users,
} from "lucide-react";
import { formatDate, formatScore, computeGrade, getInitials } from "@/lib/utils";

interface ChildAcademic {
  childId: string;
  childName: string;
  admissionNumber: string;
  className: string | null;
  subjects: {
    name: string;
    scores: {
      id: string;
      score: number;
      grade: string | null;
      maxScore: number;
      assessmentName: string;
      assessmentType: string;
      date: string;
    }[];
    average: number;
    latestTrend: "up" | "down" | "stable";
  }[];
  overallAverage: number;
}

export default function ParentAcademicPage() {
  const { user: devUser } = useDevAuth();
  const [childrenAcademics, setChildrenAcademics] = useState<ChildAcademic[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const parentId = devUser?.id ?? '00000000-0000-0000-0000-000000000001';

      // Get linked children
      const { data: links } = await supabase
        .from("student_parents")
        .select("student_id")
        .eq("parent_id", parentId);

      if (!links || links.length === 0) {
        setLoading(false);
        return;
      }

      const studentIds = links.map((l) => l.student_id);

      // Get students
      const { data: students } = await supabase
        .from("students")
        .select("id, first_name, last_name, admission_number, classes!left(name)")
        .in("id", studentIds)
        .order("first_name");

      if (!students || students.length === 0) {
        setLoading(false);
        return;
      }

      // Get all assessment scores for these students
      const { data: scores } = await supabase
        .from("assessment_scores")
        .select(
          "id, score, grade, student_id, assessment:assessments!inner(name, type, date, max_score, subjects(name))"
        )
        .in("student_id", studentIds)
        .order("date", { ascending: false, referencedTable: "assessments" });

      // Group by child
      const grouped: ChildAcademic[] = students.map((student) => {
        const childScores = (scores || []).filter(
          (s: any) => s.student_id === student.id
        );

        // Group by subject
        const subjectMap: Record<string, ChildAcademic["subjects"][0]> = {};

        childScores.forEach((s: any) => {
          const subjectName =
            (s.assessment as any).subjects?.name || "General";

          if (!subjectMap[subjectName]) {
            subjectMap[subjectName] = {
              name: subjectName,
              scores: [],
              average: 0,
              latestTrend: "stable",
            };
          }

          subjectMap[subjectName].scores.push({
            id: s.id,
            score: s.score,
            grade: s.grade || computeGrade(s.score, (s.assessment as any).max_score || 100),
            maxScore: (s.assessment as any).max_score || 100,
            assessmentName: (s.assessment as any).name,
            assessmentType: (s.assessment as any).type,
            date: (s.assessment as any).date,
          });
        });

        const subjects = Object.values(subjectMap).map((subj) => {
          const avg =
            subj.scores.reduce((sum, sc) => sum + (sc.score / sc.maxScore) * 100, 0) /
            subj.scores.length;

          // Determine trend from last two scores
          let latestTrend: "up" | "down" | "stable" = "stable";
          if (subj.scores.length >= 2) {
            const sorted = [...subj.scores].sort(
              (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
            );
            const pct1 = (sorted[0].score / sorted[0].maxScore) * 100;
            const pct2 = (sorted[1].score / sorted[1].maxScore) * 100;
            latestTrend = pct1 > pct2 + 2 ? "up" : pct2 > pct1 + 2 ? "down" : "stable";
          }

          return { ...subj, average: avg, latestTrend };
        });

        const overallAvg =
          subjects.length > 0
            ? subjects.reduce((sum, s) => sum + s.average, 0) / subjects.length
            : 0;

        return {
          childId: student.id,
          childName: `${student.first_name} ${student.last_name}`,
          admissionNumber: student.admission_number,
          className: (student as any).classes?.name || null,
          subjects,
          overallAverage: overallAvg,
        };
      });

      setChildrenAcademics(grouped);
      setLoading(false);
    }
    load();
  }, [devUser]);

  if (loading) return <Loading size="lg" text="Loading academic records..." />;

  const totalChildren = childrenAcademics.length;
  const childrenWithData = childrenAcademics.filter(
    (c) => c.subjects.length > 0
  ).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Academic Progress
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Assessment scores and term performance across all children
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4 text-center">
            <Users className="mx-auto h-6 w-6 text-zinc-400" />
            <p className="mt-1 text-2xl font-bold">{totalChildren}</p>
            <p className="text-xs text-zinc-500">Children</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <BookOpen className="mx-auto h-6 w-6 text-blue-500" />
            <p className="mt-1 text-2xl font-bold text-blue-600">
              {childrenWithData}
            </p>
            <p className="text-xs text-zinc-500">With Academic Data</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <TrendingUp className="mx-auto h-6 w-6 text-emerald-500" />
            <p className="mt-1 text-2xl font-bold text-emerald-600">
              {childrenAcademics.reduce(
                (sum, c) =>
                  sum +
                  c.subjects.filter((s) => s.latestTrend === "up").length,
                0
              )}
            </p>
            <p className="text-xs text-zinc-500">Improving Subjects</p>
          </CardContent>
        </Card>
      </div>

      {childrenAcademics.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <BookOpen className="mx-auto h-16 w-16 text-zinc-200 dark:text-zinc-700" />
            <h3 className="mt-4 text-lg font-semibold">No data yet</h3>
            <p className="mt-2 text-sm text-zinc-500 max-w-sm mx-auto">
              {childrenAcademics.length === 0
                ? "Your account hasn't been linked to any students yet. Please contact your school administrator."
                : "No academic records found for your children. Assessment scores will appear here once entered by teachers."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {childrenAcademics.map((child) => (
            <Card key={child.childId} className="overflow-hidden">
              {/* Child header */}
              <div className="flex items-center justify-between bg-zinc-50 px-5 py-3 dark:bg-zinc-800/50">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-sm font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                    {getInitials(
                      child.childName.split(" ")[0],
                      child.childName.split(" ")[1] || ""
                    )}
                  </div>
                  <div>
                    <Link
                      href={`/parent/children/${child.childId}/academic`}
                      className="font-semibold hover:text-emerald-600 transition-colors"
                    >
                      {child.childName}
                    </Link>
                    <p className="text-xs text-zinc-500">
                      {child.admissionNumber}
                      {child.className && ` · ${child.className}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {child.subjects.length > 0 && (
                    <span className="text-sm text-zinc-500">
                      Avg:{" "}
                      <span
                        className={`font-bold ${
                          child.overallAverage >= 70
                            ? "text-emerald-600"
                            : child.overallAverage >= 50
                              ? "text-amber-600"
                              : "text-red-600"
                        }`}
                      >
                        {child.overallAverage.toFixed(0)}%
                      </span>
                    </span>
                  )}
                  <Badge variant={child.subjects.length > 0 ? "success" : "warning"}>
                    {child.subjects.length} subject{child.subjects.length !== 1 ? "s" : ""}
                  </Badge>
                </div>
              </div>

              {/* Subjects */}
              {child.subjects.length === 0 ? (
                <div className="px-5 py-8 text-center text-sm text-zinc-500">
                  No assessment records yet
                </div>
              ) : (
                <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {child.subjects.map((subject) => (
                    <div key={subject.name} className="px-5 py-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold">
                            {subject.name}
                          </span>
                          <Badge variant="default" className="text-[10px]">
                            {subject.scores.length} assessment
                            {subject.scores.length !== 1 ? "s" : ""}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-sm font-bold ${
                              subject.average >= 70
                                ? "text-emerald-600"
                                : subject.average >= 50
                                  ? "text-amber-600"
                                  : "text-red-600"
                            }`}
                          >
                            {subject.average.toFixed(0)}%
                          </span>
                          {subject.latestTrend === "up" && (
                            <TrendingUp className="h-4 w-4 text-emerald-500" />
                          )}
                          {subject.latestTrend === "down" && (
                            <TrendingDown className="h-4 w-4 text-red-500" />
                          )}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {subject.scores.slice(0, 5).map((score) => {
                          const gradeColor =
                            score.grade?.startsWith("A")
                              ? "success"
                              : score.grade?.startsWith("B")
                                ? "primary"
                                : score.grade?.startsWith("C")
                                  ? "warning"
                                  : "danger";

                          return (
                            <div
                              key={score.id}
                              className="flex items-center gap-1.5 rounded-md border border-zinc-200 px-2 py-1 dark:border-zinc-700"
                            >
                              <span className="text-xs text-zinc-500">
                                {score.assessmentType}
                              </span>
                              <span className="text-xs font-medium">
                                {formatScore(score.score, score.maxScore)}
                              </span>
                              <Badge variant={gradeColor as any} className="text-[10px] px-1.5">
                                {score.grade}
                              </Badge>
                            </div>
                          );
                        })}
                        {subject.scores.length > 5 && (
                          <span className="text-xs text-zinc-400 self-center">
                            +{subject.scores.length - 5} more
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Footer link */}
              <Link
                href={`/parent/children/${child.childId}/academic`}
                className="flex items-center justify-between border-t border-zinc-100 px-5 py-2.5 text-xs font-medium text-zinc-500 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/50 transition-colors"
              >
                View full details
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
