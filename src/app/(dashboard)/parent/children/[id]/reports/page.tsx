"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loading } from "@/components/ui/loading";
import { ArrowLeft, FileText, Download, Eye } from "lucide-react";
import { formatDate } from "@/lib/utils";

export default function ChildReportsPage() {
  const { id } = useParams<{ id: string }>();
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("reports")
        .select(`
          id, template_type, status, created_at, pdf_url,
          academic_term:academic_terms!inner(name, academic_year)
        `)
        .eq("student_id", id)
        .eq("status", "published")
        .order("created_at", { ascending: false });

      if (data) setReports(data as any[]);
      setLoading(false);
    }
    load();
  }, [supabase, id]);

  if (loading) return <Loading size="lg" text="Loading reports..." />;

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-4">
        <Link href={`/parent/children/${id}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Report Cards</h1>
          <p className="text-sm text-zinc-500">Downloadable term reports</p>
        </div>
      </div>

      {reports.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="mx-auto h-12 w-12 text-zinc-300 dark:text-zinc-600" />
            <h3 className="mt-4 text-lg font-semibold">No reports yet</h3>
            <p className="mt-2 text-sm text-zinc-500">
              Report cards will appear here once published by teachers.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {reports.map((report) => (
            <Card key={report.id} className="transition-all hover:shadow-md">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30">
                      <FileText className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="font-semibold">
                        {report.academic_term?.name} {report.academic_term?.academic_year}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant={report.template_type === "cbc" ? "primary" : report.template_type === "8-4-4" ? "secondary" : "purple"}>
                          {report.template_type === "combined" ? "Combined" : report.template_type.toUpperCase()}
                        </Badge>
                        <span className="text-xs text-zinc-500">
                          Published: {formatDate(report.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {report.pdf_url ? (
                      <a href={report.pdf_url} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4" />
                          Download PDF
                        </Button>
                      </a>
                    ) : (
                      <Button variant="outline" size="sm" disabled>
                        <Eye className="h-4 w-4" />
                        View Online
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
