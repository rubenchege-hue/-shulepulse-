"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loading } from "@/components/ui/loading";
import { Plus, ClipboardList, ChevronRight, Filter } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface AssessmentRow {
  id: string;
  name: string;
  type: string;
  max_score: number;
  date: string;
  subjects?: { name: string; code: string } | null;
  classes?: { name: string; section: string | null } | null;
  academic_terms?: { name: string; academic_year: number } | null;
  profiles?: { first_name: string; last_name: string } | null;
  assessment_scores?: { id: string }[];
}

export default function AdminAssessmentsPage() {
  const [assessments, setAssessments] = useState<AssessmentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("assessments")
        .select("*, subjects(name, code), classes(name, section), academic_terms(name, academic_year), profiles(first_name, last_name), assessment_scores(id)")
        .order("date", { ascending: false });

      if (data) setAssessments(data as AssessmentRow[]);
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

  const types = ["all", "endterm", "midterm", "cat", "quiz", "assignment"];
  const filtered = typeFilter === "all"
    ? assessments
    : assessments.filter((a) => a.type === typeFilter);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">All Assessments</h1>
          <p className="text-sm text-zinc-500">{assessments.length} total assessments</p>
        </div>
        <Link href="/teacher/assessments/new">
          <Button>
            <Plus className="h-4 w-4" />
            New Assessment
          </Button>
        </Link>
      </div>

      {/* Type filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="h-4 w-4 text-zinc-400" />
        {types.map((t) => (
          <button
            key={t}
            onClick={() => setTypeFilter(t)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              typeFilter === t
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
            }`}
          >
            {t === "all" ? "All" : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map((assessment) => (
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
                      {assessment.subjects?.name || "All Subjects"}
                      {assessment.classes && ` · ${assessment.classes.name}`}
                      {" · "}{formatDate(assessment.date)}
                      {assessment.profiles && ` · by ${assessment.profiles.first_name} ${assessment.profiles.last_name}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {assessment.academic_terms && (
                      <span className="text-xs text-zinc-400 hidden sm:inline">
                        {assessment.academic_terms.name} {assessment.academic_terms.academic_year}
                      </span>
                    )}
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
        {filtered.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <ClipboardList className="mx-auto h-12 w-12 text-zinc-300" />
              <p className="mt-4 text-sm text-zinc-500">No assessments found</p>
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
