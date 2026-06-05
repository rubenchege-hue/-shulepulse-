"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loading } from "@/components/ui/loading";
import {
  FileText,
  Download,
  Eye,
  ChevronRight,
  Users,
  Calendar,
} from "lucide-react";
import { formatDate, getInitials } from "@/lib/utils";

interface ChildReport {
  childId: string;
  childName: string;
  admissionNumber: string;
  className: string | null;
  reports: {
    id: string;
    template_type: string;
    status: string;
    created_at: string;
    pdf_url: string | null;
    termName: string;
    termYear: number;
  }[];
}

export default function ParentReportsPage() {
  const [childrenReports, setChildrenReports] = useState<ChildReport[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      const parentId = user?.id ?? '00000000-0000-0000-0000-000000000001';

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

      // Get students and their reports
      const { data: students } = await supabase
        .from("students")
        .select("id, first_name, last_name, admission_number, classes!left(name)")
        .in("id", studentIds)
        .order("first_name");

      if (!students) {
        setLoading(false);
        return;
      }

      const { data: reportsData } = await supabase
        .from("reports")
        .select(`
          id, template_type, status, created_at, pdf_url, student_id,
          academic_term:academic_terms!inner(name, academic_year)
        `)
        .in("student_id", studentIds)
        .eq("status", "published")
        .order("created_at", { ascending: false });

      // Group reports by child
      const grouped: ChildReport[] = students.map((s) => {
        const childReports = (reportsData || [])
          .filter((r: any) => r.student_id === s.id)
          .map((r: any) => ({
            id: r.id,
            template_type: r.template_type,
            status: r.status,
            created_at: r.created_at,
            pdf_url: r.pdf_url,
            termName: r.academic_term?.name || "",
            termYear: r.academic_term?.academic_year || 0,
          }));

        return {
          childId: s.id,
          childName: `${s.first_name} ${s.last_name}`,
          admissionNumber: s.admission_number,
          className: (s as any).classes?.name || null,
          reports: childReports,
        };
      });

      setChildrenReports(grouped);
      setLoading(false);
    }
    load();
  }, [supabase]);

  // Count stats
  const totalReports = childrenReports.reduce((sum, c) => sum + c.reports.length, 0);
  const childrenWithReports = childrenReports.filter((c) => c.reports.length > 0).length;

  if (loading) return <Loading size="lg" text="Loading report cards..." />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Report Cards</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {totalReports} published report{totalReports !== 1 ? "s" : ""}
          {childrenWithReports > 0 &&
            ` across ${childrenWithReports} child${childrenWithReports !== 1 ? "ren" : ""}`}
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4 text-center">
            <FileText className="mx-auto h-6 w-6 text-zinc-400" />
            <p className="mt-1 text-2xl font-bold">{totalReports}</p>
            <p className="text-xs text-zinc-500">Total Report Cards</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Users className="mx-auto h-6 w-6 text-blue-500" />
            <p className="mt-1 text-2xl font-bold text-blue-600">
              {childrenWithReports}
            </p>
            <p className="text-xs text-zinc-500">Children with Reports</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Calendar className="mx-auto h-6 w-6 text-emerald-500" />
            <p className="mt-1 text-2xl font-bold text-emerald-600">
              {childrenReports.length}
            </p>
            <p className="text-xs text-zinc-500">Total Children</p>
          </CardContent>
        </Card>
      </div>

      {/* Reports by child */}
      {totalReports === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <FileText className="mx-auto h-16 w-16 text-zinc-200 dark:text-zinc-700" />
            <h3 className="mt-4 text-lg font-semibold">No reports yet</h3>
            <p className="mt-2 text-sm text-zinc-500 max-w-sm mx-auto">
              Report cards will appear here once published by teachers and
              administrators.
            </p>
            {childrenReports.length > 0 ? (
              <p className="mt-1 text-sm text-zinc-400">
                {childrenReports.length === 1
                  ? "Your child is linked but hasn't received any reports yet."
                  : "Your children are linked but haven't received any reports yet."}
              </p>
            ) : (
              <p className="mt-1 text-sm text-zinc-400">
                Your account hasn&apos;t been linked to any students yet.
                Please contact your school administrator.
              </p>
            )}
            {childrenReports.length > 0 && (
              <Link href="/parent/children">
                <Button className="mt-6" variant="outline">
                  <Users className="h-4 w-4" />
                  View My Children
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {childrenReports.map((child) => {
            // Skip children with no reports
            if (child.reports.length === 0) return null;

            return (
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
                        href={`/parent/children/${child.childId}/reports`}
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
                  <Badge variant="success" className="shrink-0">
                    {child.reports.length} report{child.reports.length !== 1 ? "s" : ""}
                  </Badge>
                </div>

                {/* Reports list */}
                <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {child.reports.map((report) => (
                    <div
                      key={report.id}
                      className="flex items-center justify-between px-5 py-3 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/30"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30">
                          <FileText className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">
                            {report.termName} {report.termYear}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Badge
                              variant={
                                report.template_type === "cbc"
                                  ? "primary"
                                  : report.template_type === "8-4-4"
                                    ? "secondary"
                                    : "purple"
                              }
                              className="text-[10px]"
                            >
                              {report.template_type === "combined"
                                ? "Combined"
                                : report.template_type.toUpperCase()}
                            </Badge>
                            <span className="text-xs text-zinc-400">
                              Published {formatDate(report.created_at)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {report.pdf_url ? (
                          <a
                            href={report.pdf_url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Button variant="outline" size="sm">
                              <Download className="h-4 w-4" />
                              <span className="hidden sm:inline ml-1">PDF</span>
                            </Button>
                          </a>
                        ) : (
                          <Button variant="outline" size="sm" disabled>
                            <Eye className="h-4 w-4" />
                            <span className="hidden sm:inline ml-1">View</span>
                          </Button>
                        )}
                        <Link
                          href={`/parent/children/${child.childId}/reports`}
                        >
                          <Button variant="ghost" size="icon">
                            <ChevronRight className="h-4 w-4 text-zinc-400" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            );
          })}

          {/* Children without reports */}
          {childrenReports.filter((c) => c.reports.length === 0).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-zinc-500">
                  Children without reports
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  {childrenReports
                    .filter((c) => c.reports.length === 0)
                    .map((child) => (
                      <Link
                        key={child.childId}
                        href={`/parent/children/${child.childId}`}
                        className="flex items-center gap-3 rounded-lg border border-zinc-200 p-3 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800 transition-colors"
                      >
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 text-xs font-semibold text-zinc-500 dark:bg-zinc-800">
                          {getInitials(
                            child.childName.split(" ")[0],
                            child.childName.split(" ")[1] || ""
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {child.childName}
                          </p>
                          <p className="text-xs text-zinc-500">
                            {child.admissionNumber}
                          </p>
                        </div>
                        <span className="text-xs text-zinc-400">
                          No reports yet
                        </span>
                        <ChevronRight className="h-4 w-4 text-zinc-400" />
                      </Link>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
