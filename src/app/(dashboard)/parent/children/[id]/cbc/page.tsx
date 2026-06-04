"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loading } from "@/components/ui/loading";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDate, getCbcRatingLabel } from "@/lib/utils";

const ratingColors: Record<string, "success" | "primary" | "warning" | "danger"> = {
  E: "success",
  B: "primary",
  A: "warning",
  P: "danger",
};

export default function ChildCbcPage() {
  const { id } = useParams<{ id: string }>();
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("cbc_competency_records")
        .select(`
          id, rating, notes, date,
          sub_strand:cbc_sub_strands!inner(id, name, description, strand:cbc_strands!inner(id, name, subjects!inner(name)))
        `)
        .eq("student_id", id)
        .order("date", { ascending: false });

      if (data) setRecords(data as any[]);
      setLoading(false);
    }
    load();
  }, [supabase, id]);

  if (loading) return <Loading size="lg" text="Loading CBC records..." />;

  // Group by subject then strand
  const bySubject: Record<string, any[]> = {};
  records.forEach((r) => {
    const subject = r.sub_strand?.strand?.subjects?.name || "General";
    if (!bySubject[subject]) bySubject[subject] = [];
    bySubject[subject].push(r);
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
          <h1 className="text-2xl font-bold tracking-tight">CBC Competency Progress</h1>
          <p className="text-sm text-zinc-500">
            Competency ratings: E=Exceeding, B=Meeting, A=Approaching, P=Below
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        <Badge variant="success">E - Exceeding Expectations</Badge>
        <Badge variant="primary">B - Meeting Expectations</Badge>
        <Badge variant="warning">A - Approaching Expectations</Badge>
        <Badge variant="danger">P - Below Expectations</Badge>
      </div>

      {Object.entries(bySubject).length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-zinc-500">
            No CBC competency records yet
          </CardContent>
        </Card>
      ) : (
        Object.entries(bySubject).map(([subject, subjectRecords]) => (
          <Card key={subject}>
            <CardHeader>
              <CardTitle>{subject}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {subjectRecords.map((r: any) => (
                <div
                  key={r.id}
                  className="rounded-lg border border-zinc-200 p-3 dark:border-zinc-700"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        {r.sub_strand?.strand?.name} - {r.sub_strand?.name}
                      </p>
                      {r.notes && (
                        <p className="mt-1 text-xs text-zinc-500">{r.notes}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={ratingColors[r.rating] || "default"}>
                        {r.rating} - {getCbcRatingLabel(r.rating)}
                      </Badge>
                    </div>
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
