"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loading } from "@/components/ui/loading";
import { ArrowLeft, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDate, getProgressLevelLabel } from "@/lib/utils";

const levelColors: Record<string, "success" | "primary" | "warning" | "danger" | "default"> = {
  outstanding: "success",
  excellent: "primary",
  competent: "default",
  developing: "warning",
  beginner: "danger",
};

export default function ChildCocurricularPage() {
  const { id } = useParams<{ id: string }>();
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("co_curricular_records")
        .select(`
          id, progress_level, achievements, notes, date,
          activity:co_curricular_activities!inner(id, name, category)
        `)
        .eq("student_id", id)
        .order("date", { ascending: false });

      if (data) setRecords(data as any[]);
      setLoading(false);
    }
    load();
  }, [supabase, id]);

  if (loading) return <Loading size="lg" text="Loading co-curricular records..." />;

  const byCategory: Record<string, any[]> = {};
  records.forEach((r) => {
    const cat = r.activity?.category || "other";
    if (!byCategory[cat]) byCategory[cat] = [];
    byCategory[cat].push(r);
  });

  const categoryLabels: Record<string, string> = {
    sports: "Sports",
    music: "Music",
    drama: "Drama & Theatre",
    debate: "Debate & Public Speaking",
    scouts: "Scouts & Guides",
    clubs: "Clubs & Societies",
    arts: "Arts & Craft",
    community_service: "Community Service",
    other: "Other Activities",
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <Link href={`/parent/children/${id}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Co-Curricular Activities</h1>
          <p className="text-sm text-zinc-500">
            Sports, clubs, music, and other activities
          </p>
        </div>
      </div>

      {Object.entries(byCategory).length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Trophy className="mx-auto h-12 w-12 text-zinc-300" />
            <p className="mt-4 text-sm text-zinc-500">No co-curricular records yet</p>
          </CardContent>
        </Card>
      ) : (
        Object.entries(byCategory).map(([category, categoryRecords]) => (
          <Card key={category}>
            <CardHeader>
              <CardTitle>{categoryLabels[category] || category}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {categoryRecords.map((r: any) => (
                <div
                  key={r.id}
                  className="rounded-lg border border-zinc-200 p-3 dark:border-zinc-700"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium">{r.activity?.name}</p>
                      {r.achievements && (
                        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                          🏆 {r.achievements}
                        </p>
                      )}
                      {r.notes && (
                        <p className="mt-0.5 text-xs text-zinc-500">{r.notes}</p>
                      )}
                    </div>
                    <Badge variant={levelColors[r.progress_level] || "default"}>
                      {getProgressLevelLabel(r.progress_level)}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-zinc-400">{formatDate(r.date)}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
