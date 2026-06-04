"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loading } from "@/components/ui/loading";
import { ArrowLeft, TrendingUp, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDate, formatScore, computeGrade } from "@/lib/utils";

interface ScoreWithAssessment {
  id: string;
  score: number;
  grade: string | null;
  assessment: { name: string; type: string; date: string; max_score: number; subjects?: { name: string } | null };
}

export default function ChildAcademicPage() {
  const { id } = useParams<{ id: string }>();
  const [scores, setScores] = useState<ScoreWithAssessment[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("assessment_scores")
        .select("id, score, grade, assessment:assessments!inner(name, type, date, max_score, subjects(name))")
        .eq("student_id", id)
        .order("date", { ascending: false, referencedTable: "assessments" });

      if (data) setScores(data as unknown as ScoreWithAssessment[]);
      setLoading(false);
    }
    load();
  }, [supabase, id]);

  if (loading) return <Loading size="lg" text="Loading academic records..." />;

  // Group by subject
  const bySubject: Record<string, ScoreWithAssessment[]> = {};
  scores.forEach((s) => {
    const subject = (s.assessment as any).subjects?.name || "General";
    if (!bySubject[subject]) bySubject[subject] = [];
    bySubject[subject].push(s);
  });

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <Link href={`/parent/children/${id}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Academic Progress (8-4-4)</h1>
          <p className="text-sm text-zinc-500">Assessment scores and grades</p>
        </div>
      </div>

      {Object.entries(bySubject).length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-zinc-500">
            No assessment records yet
          </CardContent>
        </Card>
      ) : (
        Object.entries(bySubject).map(([subject, subjectScores]) => {
          const avg = subjectScores.reduce((sum, s) => sum + s.score, 0) / subjectScores.length;
          const latest = subjectScores[0];
          const trend = subjectScores.length > 1 && subjectScores[0].score > subjectScores[1].score;

          return (
            <Card key={subject}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{subject}</CardTitle>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-zinc-500">Avg: {avg.toFixed(0)}%</span>
                    {trend ? (
                      <TrendingUp className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {subjectScores.map((s) => {
                    const computedGrade = s.grade || computeGrade(s.score, (s.assessment as any).max_score);
                    const gradeColor =
                      computedGrade.startsWith("A") ? "success" :
                      computedGrade.startsWith("B") ? "primary" :
                      computedGrade.startsWith("C") ? "warning" : "danger";

                    return (
                      <div
                        key={s.id}
                        className="flex items-center justify-between rounded-lg border border-zinc-200 p-3 dark:border-zinc-700"
                      >
                        <div>
                          <p className="text-sm font-medium">{s.assessment.name}</p>
                          <p className="text-xs text-zinc-500">
                            {formatDate(s.assessment.date)} · {s.assessment.type}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-semibold">
                            {s.score}/{s.assessment.max_score}
                          </span>
                          <Badge variant={gradeColor as any}>{computedGrade}</Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
}
