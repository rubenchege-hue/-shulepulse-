"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useProfile } from "@/lib/use-profile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loading } from "@/components/ui/loading";
import {
  FileText,
  Search,
  Download,
  Eye,
  Plus,
  Loader2,
  CheckCircle2,
  Clock,
  Sparkles,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { generateReportContent } from "@/lib/report-generator";
import type { Report, Student, Class, AcademicTerm } from "@/lib/types/database";

interface ReportWithDetails extends Report {
  student?: Pick<Student, "id" | "first_name" | "last_name" | "admission_number" | "class_id"> & {
    classes?: Pick<Class, "id" | "name" | "section"> | null;
  };
  academic_term?: Pick<AcademicTerm, "id" | "name" | "academic_year"> | null;
}

const templateLabels: Record<string, string> = {
  cbc: "CBC Report",
  "8-4-4": "8-4-4 Report",
  combined: "Combined Report",
};

const templateColors: Record<string, "primary" | "secondary" | "purple"> = {
  cbc: "primary",
  "8-4-4": "secondary",
  combined: "purple",
};

export default function TeacherReportsPage() {
  const supabase = createClient();
  const { profile, schoolId, userId } = useProfile();
  const [reports, setReports] = useState<ReportWithDetails[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [terms, setTerms] = useState<AcademicTerm[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [templateFilter, setTemplateFilter] = useState<string>("");
  const [termFilter, setTermFilter] = useState<string>("");

  // Generate form
  const [showGenerate, setShowGenerate] = useState(false);
  const [genStudentId, setGenStudentId] = useState("");
  const [genTermId, setGenTermId] = useState("");
  const [genTemplate, setGenTemplate] = useState("combined");

  async function loadReports(pid: string) {
    if (!schoolId) return;
    const { data } = await supabase
      .from("reports")
      .select(`
        *,
        student:students!inner(id, first_name, last_name, admission_number, class_id, classes!left(id, name, section)),
        academic_term:academic_terms!inner(id, name, academic_year)
      `)
      .eq("generated_by", pid)
      .order("created_at", { ascending: false });

    if (data) setReports(data as unknown as ReportWithDetails[]);

    // Load students and terms for generate form
    const [studentsRes, termsRes] = await Promise.all([
      supabase
        .from("students")
        .select("id, first_name, last_name, admission_number, classes!left(name, section)")
        .eq("school_id", schoolId)
        .eq("status", "active")
        .order("first_name"),
      supabase
        .from("academic_terms")
        .select("*")
        .eq("school_id", schoolId)
        .order("academic_year", { ascending: false }),
    ]);

    if (studentsRes.data) setStudents(studentsRes.data);
    if (termsRes.data) setTerms(termsRes.data);

    setLoading(false);
  }

  useEffect(() => {
    if (userId && schoolId) {
      loadReports(userId);
    } else if (!schoolId) {
      setLoading(false);
    }
  }, [userId, schoolId, supabase]);

  const filtered = reports.filter((r) => {
    const studentName =
      `${r.student?.first_name || ""} ${r.student?.last_name || ""}`.toLowerCase();
    const admission = (r.student?.admission_number || "").toLowerCase();
    const query = search.toLowerCase();
    const matchesSearch = !search || studentName.includes(query) || admission.includes(query);
    const matchesStatus = !statusFilter || r.status === statusFilter;
    const matchesTemplate = !templateFilter || r.template_type === templateFilter;
    const matchesTerm = !termFilter || r.academic_term_id === termFilter;
    return matchesSearch && matchesStatus && matchesTemplate && matchesTerm;
  });

  const handleGenerate = async () => {
    if (!genStudentId || !genTermId) {
      setError("Please select a student and term");
      return;
    }
    setGenerating(true);
    setError(null);

    const { error: err } = await supabase.from("reports").insert({
      student_id: genStudentId,
      academic_term_id: genTermId,
      generated_by: userId,
      template_type: genTemplate,
      status: "draft",
      content: {} as Record<string, unknown>,
    });

    if (err) {
      if (err.code === "23505") {
        setError("A report with this template already exists for this student and term.");
      } else {
        setError(err.message);
      }
      setGenerating(false);
      return;
    }

    setGenStudentId("");
    setGenTermId("");
    setGenTemplate("combined");
    setShowGenerate(false);
    setGenerating(false);

    // Reload
    if (userId) loadReports(userId);
  };

  const handleDelete = async (reportId: string) => {
    if (!confirm("Are you sure you want to delete this report? This cannot be undone."))
      return;
    await supabase.from("reports").delete().eq("id", reportId);
    // Reload
    if (userId) loadReports(userId);
  };

  const handlePublish = async (reportId: string) => {
    await supabase
      .from("reports")
      .update({ status: "published" })
      .eq("id", reportId);

    if (userId) loadReports(userId);
  };

  const [generatingContent, setGeneratingContent] = useState<Set<string>>(new Set());

  function hasContent(content: Record<string, unknown> | null | undefined): boolean {
    return content !== null && content !== undefined && Object.keys(content).length > 0 && JSON.stringify(content) !== "{}";
  }

  async function handleGenerateContent(reportId: string, studentId: string, termId: string) {
    if (generatingContent.has(reportId)) return;
    setGeneratingContent((prev) => new Set(prev).add(reportId));

    try {
      const content = await generateReportContent(studentId, termId);
      const { error: err } = await supabase
        .from("reports")
        .update({ content: content as unknown as Record<string, unknown> })
        .eq("id", reportId);

      if (!err && userId) {
        loadReports(userId);
      }
    } catch {
      // Silently handle
    }

    setGeneratingContent((prev) => {
      const next = new Set(prev);
      next.delete(reportId);
      return next;
    });
  }

  const totalPublished = reports.filter((r) => r.status === "published").length;
  const totalDraft = reports.filter((r) => r.status === "draft").length;
  const uniqueStudents = new Set(reports.map((r) => r.student_id)).size;

  if (loading) return <Loading size="lg" text="Loading reports..." />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Report Cards</h1>
          <p className="text-sm text-zinc-500">
            {reports.length} report{reports.length !== 1 ? "s" : ""} generated
            {totalPublished > 0 && ` · ${totalPublished} published`}
          </p>
        </div>
        <Button onClick={() => setShowGenerate(!showGenerate)}>
          <Plus className="h-4 w-4" />
          Generate Report
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4 text-center">
            <FileText className="mx-auto h-6 w-6 text-zinc-400" />
            <p className="mt-1 text-2xl font-bold">{reports.length}</p>
            <p className="text-xs text-zinc-500">Total Reports</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <CheckCircle2 className="mx-auto h-6 w-6 text-emerald-500" />
            <p className="mt-1 text-2xl font-bold text-emerald-600">{totalPublished}</p>
            <p className="text-xs text-zinc-500">Published</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Clock className="mx-auto h-6 w-6 text-amber-500" />
            <p className="mt-1 text-2xl font-bold text-amber-600">{totalDraft}</p>
            <p className="text-xs text-zinc-500">Drafts</p>
          </CardContent>
        </Card>
      </div>

      {/* Generate Form */}
      {showGenerate && (
        <Card>
          <CardHeader>
            <CardTitle>Generate New Report Card</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium mb-1">Student</label>
                <Select
                  value={genStudentId}
                  onChange={(e) => setGenStudentId(e.target.value)}
                  options={students.map((s) => ({
                    value: s.id,
                    label: `${s.first_name} ${s.last_name} (${s.admission_number})${
                      s.classes?.name ? ` - ${s.classes.name}` : ""
                    }`,
                  }))}
                  placeholder="Select student"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Term</label>
                <Select
                  value={genTermId}
                  onChange={(e) => setGenTermId(e.target.value)}
                  options={terms.map((t) => ({
                    value: t.id,
                    label: `${t.name} ${t.academic_year}`,
                  }))}
                  placeholder="Select term"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Template</label>
                <Select
                  value={genTemplate}
                  onChange={(e) => setGenTemplate(e.target.value)}
                  options={[
                    { value: "combined", label: "Combined (CBC + 8-4-4)" },
                    { value: "cbc", label: "CBC Only" },
                    { value: "8-4-4", label: "8-4-4 Only" },
                  ]}
                />
              </div>
              <div className="flex items-end gap-2">
                <Button onClick={handleGenerate} disabled={generating}>
                  {generating ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Generating...</>
                  ) : (
                    "Generate"
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => { setShowGenerate(false); setError(null); }}
                >
                  Cancel
                </Button>
              </div>
            </div>
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <Input
            placeholder="Search by student name or admission..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="w-[140px]">
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: "", label: "All Status" },
              { value: "published", label: "Published" },
              { value: "draft", label: "Draft" },
            ]}
          />
        </div>
        <div className="w-[160px]">
          <Select
            value={templateFilter}
            onChange={(e) => setTemplateFilter(e.target.value)}
            options={[
              { value: "", label: "All Templates" },
              { value: "combined", label: "Combined" },
              { value: "cbc", label: "CBC" },
              { value: "8-4-4", label: "8-4-4" },
            ]}
          />
        </div>
        <div className="w-[180px]">
          <Select
            value={termFilter}
            onChange={(e) => setTermFilter(e.target.value)}
            options={[
              { value: "", label: "All Terms" },
              ...terms.map((t) => ({
                value: t.id,
                label: `${t.name} ${t.academic_year}`,
              })),
            ]}
          />
        </div>
      </div>

      {/* Reports List */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <FileText className="mx-auto h-16 w-16 text-zinc-200 dark:text-zinc-700" />
            <h3 className="mt-4 text-lg font-semibold">No reports found</h3>
            <p className="mt-2 text-sm text-zinc-500 max-w-sm mx-auto">
              {reports.length === 0
                ? "Generate your first report card by clicking the button above."
                : "Try adjusting your filters or search query."}
            </p>
            {reports.length === 0 && (
              <Button className="mt-6" onClick={() => setShowGenerate(true)}>
                <Plus className="h-4 w-4" />
                Generate First Report
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((report) => (
            <Card
              key={report.id}
              className={`transition-all hover:shadow-md ${
                report.status === "draft"
                  ? "border-amber-200 dark:border-amber-800"
                  : ""
              }`}
            >
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  {/* Left: report info */}
                  <div className="flex items-center gap-4 min-w-0">
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                        report.status === "published"
                          ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
                          : "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
                      }`}
                    >
                      {report.status === "published" ? (
                        <CheckCircle2 className="h-6 w-6" />
                      ) : (
                        <Clock className="h-6 w-6" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold truncate">
                        {report.student?.first_name} {report.student?.last_name}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {report.student?.admission_number}
                        {report.student?.classes?.name &&
                          ` · ${report.student.classes.name}${report.student.classes.section ? ` - ${report.student.classes.section}` : ""}`}
                      </p>
                      <p className="text-xs text-zinc-400 mt-1">
                        {report.academic_term?.name} {report.academic_term?.academic_year}
                        {" · "}
                        Created {formatDate(report.created_at)}
                        {report.updated_at !== report.created_at &&
                          ` · Updated ${formatDate(report.updated_at)}`}
                      </p>
                    </div>
                  </div>

                  {/* Right: badges + actions */}
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="hidden sm:flex flex-col items-end gap-1">
                      <Badge variant={templateColors[report.template_type] || "default"}>
                        {templateLabels[report.template_type] || report.template_type}
                      </Badge>
                      <Badge
                        variant={report.status === "published" ? "success" : "warning"}
                      >
                        {report.status === "published" ? "Published" : "Draft"}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-1">
                      {report.status === "draft" && (
                        <>
                          {!hasContent(report.content) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={generatingContent.has(report.id)}
                              onClick={() =>
                                handleGenerateContent(
                                  report.id,
                                  report.student_id,
                                  report.academic_term_id
                                )
                              }
                              title="Generate report content"
                            >
                              {generatingContent.has(report.id) ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Sparkles className="h-4 w-4" />
                              )}
                              <span className="hidden sm:inline ml-1">
                                {generatingContent.has(report.id)
                                  ? "Generating..."
                                  : "Generate"}
                              </span>
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handlePublish(report.id)}
                            title="Publish report"
                          >
                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                            <span className="hidden sm:inline ml-1">Publish</span>
                          </Button>
                        </>
                      )}

                      {hasContent(report.content) ? (
                        <Link href={`/reports/${report.id}`}>
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4" />
                            <span className="hidden sm:inline ml-1">View</span>
                          </Button>
                        </Link>
                      ) : report.pdf_url ? (
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
                          <span className="hidden sm:inline ml-1">No PDF</span>
                        </Button>
                      )}

                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                        onClick={() => handleDelete(report.id)}
                      >
                        <span className="sr-only sm:not-sr-only sm:inline text-xs">
                          Delete
                        </span>
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Mobile badges */}
                <div className="mt-3 flex gap-2 sm:hidden">
                  <Badge variant={templateColors[report.template_type] || "default"}>
                    {templateLabels[report.template_type] || report.template_type}
                  </Badge>
                  <Badge
                    variant={report.status === "published" ? "success" : "warning"}
                  >
                    {report.status === "published" ? "Published" : "Draft"}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
