"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loading } from "@/components/ui/loading";
import { Plus, ClipboardList, ChevronRight } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface AssessmentWithSubject {
  id: string;
  name: string;
  type: string;
  max_score: number;
  date: string;
  subjects?: { name: string; code: string } | null;
  classes?: { name: string; section: string | null } | null;
  assessment_scores?: { id: string }[];
}

export default function TeacherAssessmentsPage() {
  const [assessments, setAssessments] = useState<AssessmentWithSubject[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .single();

      if (!profile) return;

      const { data } = await supabase
        .from("assessments")
        .select("*, subjects(name, code), classes(name, section), assessment_scores(id)")
        .eq("created_by", profile.id)
        .order("date", { ascending: false });

      if (data) setAssessments(data as AssessmentWithSubject[]);
      setLoading(false);
    }
    load();
  }, [supabase]);

  if (loading) return <Loading size="lg" text="Loading assessments..." />;

  const typeColors: Record<string, "primary" | "secondary" | "warning" | "danger" | "default"> = {
    endterm: "danger",
    midterm: "warning",
    cat: "primary",
    quiz: "secondary",
    assignment: "default",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Assessments</h1>
          <p className="text-sm text-zinc-500">{assessments.length} assessments created</p>
        </div>
        <Link href="/teacher/assessments/new">
          <Button>
            <Plus className="h-4 w-4" />
            New Assessment
          </Button>
        </Link>
      </div>

      <div className="space-y-3">
        {assessments.map((assessment) => (
          <Link key={assessment.id} href={`/teacher/assessments/${assessment.id}`}>
            <Card className="transition-all hover:shadow-md hover:border-emerald-200 dark:hover:border-emerald-800">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30">
                    <ClipboardList className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{assessment.name}</p>
                    <p className="text-xs text-zinc-500">
                      {(assessment as any).subjects?.name || "All Subjects"}
                      {(assessment as any).classes && ` · ${(assessment as any).classes.name}`}
                      {" · "}{formatDate(assessment.date)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={typeColors[assessment.type] || "default"}>
                      {assessment.type}
                    </Badge>
                    <span className="text-xs text-zinc-500">
                      {assessment.assessment_scores?.length || 0} scores
                    </span>
                  </div>
                  <ChevronRight className="h-5 w-5 text-zinc-400" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
        {assessments.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <ClipboardList className="mx-auto h-12 w-12 text-zinc-300" />
              <p className="mt-4 text-sm text-zinc-500">No assessments yet</p>
              <Link href="/teacher/assessments/new">
                <Button className="mt-4" variant="outline">
                  Create your first assessment
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
