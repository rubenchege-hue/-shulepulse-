"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Loading } from "@/components/ui/loading";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Printer,
  Download,
  School,
  GraduationCap,
  Star,
  AlertTriangle,
  Trophy,
  BookOpen,
  CalendarDays,
  Sparkles,
} from "lucide-react";
import type { ReportContent } from "@/lib/report-generator";

const cbcRatingColors: Record<string, string> = {
  E: "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700",
  B: "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700",
  A: "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700",
  P: "bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700",
};

const levelColors: Record<string, string> = {
  beginner: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  developing: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  competent: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  excellent: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  outstanding: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
};

function getGradeBadgeColor(grade: string): string {
  if (grade.startsWith("A")) return "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-300";
  if (grade.startsWith("B")) return "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-300";
  if (grade.startsWith("C")) return "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/30 dark:text-amber-300";
  if (grade.startsWith("D")) return "bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900/30 dark:text-orange-300";
  return "bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-300";
}

export default function ReportPreviewPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const supabase = createClient();
  const [report, setReport] = useState<any>(null);
  const [content, setContent] = useState<ReportContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const { data, error: err } = await supabase
        .from("reports")
        .select("*, student:students!inner(id, first_name, last_name, admission_number, gender, class_id, classes!left(name, section)), academic_term:academic_terms!inner(name, academic_year)")
        .eq("id", id)
        .single();

      if (err || !data) {
        setError("Report not found");
        setLoading(false);
        return;
      }

      setReport(data);

      // Parse content
      if (data.content && Object.keys(data.content).length > 0 && JSON.stringify(data.content) !== "{}") {
        setContent(data.content as unknown as ReportContent);
      } else {
        setError("Report content has not been generated yet. Please generate content first.");
      }

      setLoading(false);
    }
    load();
  }, [supabase, id]);

  // Set document title for PDF filename
  useEffect(() => {
    if (report && content) {
      const studentName = `${report.student?.first_name || ""} ${report.student?.last_name || ""}`.trim();
      const termName = `${report.academic_term?.name || ""} ${report.academic_term?.academic_year || ""}`.trim();
      document.title = `Report_Card_${studentName}_${termName}`.replace(/\s+/g, "_");
    }
    return () => {
      document.title = "ShulePulse - School Management System";
    };
  }, [report, content]);

  const handlePrint = () => {
    window.print();
  };

  const handleGoBack = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push("/dashboard");
    }
  };

  if (loading) return <Loading size="lg" text="Loading report..." />;

  if (error || !report) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 p-4 dark:bg-zinc-950">
        <div className="max-w-md text-center">
          <School className="mx-auto h-16 w-16 text-zinc-300 dark:text-zinc-600" />
          <h1 className="mt-4 text-xl font-bold text-zinc-900 dark:text-white">
            {error || "Report not found"}
          </h1>
          <p className="mt-2 text-sm text-zinc-500">
            {error?.includes("generated")
              ? "Go back to the reports list, click \"Generate\" to populate the content, then view again."
              : "The report you're looking for doesn't exist or you don't have access to it."}
          </p>
          <button
            onClick={handleGoBack}
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const isCombined = report.template_type === "combined" || report.template_type === "cbc";
  const is844 = report.template_type === "combined" || report.template_type === "8-4-4";

  return (
    <div className="min-h-screen bg-zinc-100 dark:bg-zinc-950 print:bg-white">
      {/* Toolbar (hidden when printing) */}
      <div className="sticky top-0 z-40 border-b border-zinc-200 bg-white/80 backdrop-blur-lg dark:border-zinc-800 dark:bg-zinc-950/80 print:hidden">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4">
          <button
            onClick={handleGoBack}
            className="flex items-center gap-2 text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-400 dark:text-zinc-500 hidden sm:inline">
              {report.status === "published" ? "Published" : "Draft"}
            </span>
            <Button variant="outline" size="sm" onClick={handlePrint} title="Save as PDF (choose 'Save as PDF' in print dialog)">
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Download PDF</span>
            </Button>
            <Button variant="default" size="sm" onClick={handlePrint}>
              <Printer className="h-4 w-4" />
              <span className="hidden sm:inline">Print</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Report Card Content */}
      <div className="mx-auto max-w-4xl px-4 py-8 print:px-0 print:py-0">
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900 print:rounded-none print:border-none print:shadow-none">
          {/* ===== HEADER ===== */}
          <div className="border-b border-zinc-200 bg-gradient-to-r from-emerald-600 to-emerald-700 px-8 py-6 text-white dark:border-zinc-700 print:bg-emerald-700 print:text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/20 backdrop-blur">
                  <School className="h-8 w-8" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold tracking-tight">
                    Student Progress Report
                  </h1>
                  <p className="mt-0.5 text-sm text-emerald-100">
                    {report.academic_term?.name} {report.academic_term?.academic_year}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-emerald-200">
                  Template: {report.template_type === "combined" ? "Combined (CBC + 8-4-4)" : `${report.template_type.toUpperCase()} Only`}
                </p>
                <p className="text-xs text-emerald-200">
                  {content?.generatedAt
                    ? `Generated ${new Date(content.generatedAt).toLocaleDateString("en-KE", { dateStyle: "long" })}`
                    : ""}
                </p>
              </div>
            </div>
          </div>

          {/* ===== STUDENT INFO ===== */}
          <div className="border-b border-zinc-200 px-8 py-5 dark:border-zinc-700">
            <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
              <div className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-zinc-400" />
                <span className="text-zinc-500">Student:</span>
                <span className="font-semibold">
                  {report.student?.first_name} {report.student?.last_name}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-zinc-400" />
                <span className="text-zinc-500">Admission:</span>
                <span className="font-medium">
                  {report.student?.admission_number || "—"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-zinc-400" />
                <span className="text-zinc-500">Class:</span>
                <span className="font-medium">
                  {report.student?.classes?.name || "—"}
                  {report.student?.classes?.section ? ` - ${report.student.classes.section}` : ""}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-zinc-400" />
                <span className="text-zinc-500">Gender:</span>
                <span className="font-medium capitalize">
                  {report.student?.gender || "—"}
                </span>
              </div>
            </div>
          </div>

          {/* ===== ACADEMIC SCORES (8-4-4) ===== */}
          {is844 && content?.academic.subjects && content.academic.subjects.length > 0 && (
            <div className="report-section border-b border-zinc-200 px-8 py-6 dark:border-zinc-700">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-zinc-900 dark:text-white">
                <BookOpen className="h-5 w-5 text-blue-500" />
                Academic Performance (8-4-4)
              </h2>

              {content.academic.subjects.map((subject) => (
                <div key={subject.name} className="mb-4 last:mb-0">
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                      {subject.name}
                    </h3>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-zinc-500">
                        Avg:{" "}
                        <span
                          className={`font-bold ${
                            subject.average >= 70
                              ? "text-emerald-600"
                              : subject.average >= 50
                                ? "text-amber-600"
                                : "text-red-600"
                          }`}
                        >
                          {subject.average.toFixed(0)}%
                        </span>
                      </span>
                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold ${getGradeBadgeColor(subject.grade)}`}
                      >
                        {subject.grade}
                      </span>
                    </div>
                  </div>

                  {subject.scores.length > 0 && (
                    <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-700">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="bg-zinc-50 dark:bg-zinc-800">
                            <th className="px-3 py-2 text-left font-medium text-zinc-500">
                              Assessment
                            </th>
                            <th className="px-3 py-2 text-center font-medium text-zinc-500">
                              Type
                            </th>
                            <th className="px-3 py-2 text-center font-medium text-zinc-500">
                              Score
                            </th>
                            <th className="px-3 py-2 text-center font-medium text-zinc-500">
                              Grade
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                          {subject.scores.map((score, i) => (
                            <tr key={i} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                              <td className="px-3 py-2 font-medium text-zinc-800 dark:text-zinc-200">
                                {score.assessmentName}
                              </td>
                              <td className="px-3 py-2 text-center capitalize text-zinc-500">
                                {score.type}
                              </td>
                              <td className="px-3 py-2 text-center font-semibold">
                                {score.score}/{score.maxScore}
                              </td>
                              <td className="px-3 py-2 text-center">
                                <span
                                  className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold ${getGradeBadgeColor(score.grade)}`}
                                >
                                  {score.grade}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ))}

              {/* Overall Summary */}
              <div className="mt-4 flex items-center justify-between rounded-lg bg-zinc-50 p-3 dark:bg-zinc-800">
                <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                  Overall Average
                </span>
                <div className="flex items-center gap-3">
                  <span
                    className={`text-lg font-bold ${
                      content.academic.overallAverage >= 70
                        ? "text-emerald-600"
                        : content.academic.overallAverage >= 50
                          ? "text-amber-600"
                          : "text-red-600"
                    }`}
                  >
                    {content.academic.overallAverage.toFixed(0)}%
                  </span>
                  <span
                    className={`inline-flex items-center rounded-full border px-3 py-0.5 text-sm font-bold ${getGradeBadgeColor(content.academic.overallGrade)}`}
                  >
                    {content.academic.overallGrade}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* ===== CBC COMPETENCIES ===== */}
          {isCombined && content?.cbc.subjects && content.cbc.subjects.length > 0 && (
            <div className="report-section border-b border-zinc-200 px-8 py-6 dark:border-zinc-700">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-zinc-900 dark:text-white">
                <Sparkles className="h-5 w-5 text-emerald-500" />
                CBC Competency Ratings
              </h2>

              {/* Legend */}
              <div className="mb-4 flex flex-wrap gap-2 text-[10px]">
                <span className="inline-flex items-center rounded-md border border-emerald-300 bg-emerald-50 px-2 py-0.5 font-medium text-emerald-700 dark:border-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300">
                  E — Exceeding
                </span>
                <span className="inline-flex items-center rounded-md border border-blue-300 bg-blue-50 px-2 py-0.5 font-medium text-blue-700 dark:border-blue-700 dark:bg-blue-900/20 dark:text-blue-300">
                  B — Meeting
                </span>
                <span className="inline-flex items-center rounded-md border border-amber-300 bg-amber-50 px-2 py-0.5 font-medium text-amber-700 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-300">
                  A — Approaching
                </span>
                <span className="inline-flex items-center rounded-md border border-red-300 bg-red-50 px-2 py-0.5 font-medium text-red-700 dark:border-red-700 dark:bg-red-900/20 dark:text-red-300">
                  P — Below
                </span>
              </div>

              {content.cbc.subjects.map((subject) => (
                <div key={subject.name} className="mb-4 last:mb-0">
                  <h3 className="mb-2 text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                    {subject.name}
                  </h3>
                  <div className="space-y-2">
                    {subject.strands.map((strand) => (
                      <div
                        key={strand.name}
                        className="rounded-lg border border-zinc-200 p-3 dark:border-zinc-700"
                      >
                        <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                          {strand.name}
                        </p>
                        <div className="mt-1.5 space-y-1">
                          {strand.subStrands.map((sub) => (
                            <div
                              key={sub.name}
                              className="flex items-center justify-between"
                            >
                              <span className="text-xs text-zinc-700 dark:text-zinc-300">
                                {sub.name}
                              </span>
                              <div className="flex items-center gap-2">
                                <span
                                  className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold ${cbcRatingColors[sub.rating] || ""}`}
                                >
                                  {sub.rating} — {sub.ratingLabel}
                                </span>
                                {sub.notes && (
                                  <span className="max-w-[200px] truncate text-[10px] text-zinc-400">
                                    {sub.notes}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ===== CO-CURRICULAR ===== */}
          {content?.cocurricular.activities && content.cocurricular.activities.length > 0 && (
            <div className="report-section border-b border-zinc-200 px-8 py-6 dark:border-zinc-700">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-zinc-900 dark:text-white">
                <Trophy className="h-5 w-5 text-amber-500" />
                Co-Curricular Activities
              </h2>

              <div className="space-y-3">
                {content.cocurricular.activities.map((activity, i) => (
                  <div
                    key={i}
                    className="flex items-start justify-between rounded-lg border border-zinc-200 p-3 dark:border-zinc-700"
                  >
                    <div>
                      <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                        {activity.name}
                      </p>
                      <p className="text-xs capitalize text-zinc-500">
                        {activity.category?.replace("_", " ")}
                      </p>
                      {activity.achievements && (
                        <p className="mt-0.5 text-xs text-amber-600 dark:text-amber-400">
                          🏆 {activity.achievements}
                        </p>
                      )}
                      {activity.notes && (
                        <p className="mt-0.5 text-[10px] text-zinc-400">
                          {activity.notes}
                        </p>
                      )}
                    </div>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold ${levelColors[activity.progressLevel] || ""}`}
                    >
                      {activity.levelLabel}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ===== SUMMARY ===== */}
          {content?.summary && (
            <div className="report-section px-8 py-6">
              <h2 className="mb-4 text-lg font-bold text-zinc-900 dark:text-white">
                Summary
              </h2>

              <div className="mb-4 grid grid-cols-3 gap-3">
                <div className="rounded-lg border border-zinc-200 p-3 text-center dark:border-zinc-700">
                  <p className="text-lg font-bold text-blue-600">
                    {content.summary.totalAssessments}
                  </p>
                  <p className="text-[10px] text-zinc-500">Assessments</p>
                </div>
                <div className="rounded-lg border border-zinc-200 p-3 text-center dark:border-zinc-700">
                  <p className="text-lg font-bold text-emerald-600">
                    {content.summary.cbcRatingsCount}
                  </p>
                  <p className="text-[10px] text-zinc-500">CBC Ratings</p>
                </div>
                <div className="rounded-lg border border-zinc-200 p-3 text-center dark:border-zinc-700">
                  <p className="text-lg font-bold text-amber-600">
                    {content.summary.coCurricularCount}
                  </p>
                  <p className="text-[10px] text-zinc-500">Activities</p>
                </div>
              </div>

              {/* Strengths */}
              {content.summary.strengths.length > 0 && (
                <div className="mb-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-800 dark:bg-emerald-900/10">
                  <div className="flex items-center gap-2 mb-2">
                    <Star className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                      Strengths
                    </span>
                  </div>
                  <ul className="space-y-0.5">
                    {content.summary.strengths.map((s, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 text-xs text-emerald-700 dark:text-emerald-300"
                      >
                        <span className="mt-0.5">•</span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Areas for Improvement */}
              {content.summary.areasForImprovement.length > 0 && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-900/10">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    <span className="text-xs font-bold text-amber-700 dark:text-amber-300">
                      Areas for Improvement
                    </span>
                  </div>
                  <ul className="space-y-0.5">
                    {content.summary.areasForImprovement.map((a, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 text-xs text-amber-700 dark:text-amber-300"
                      >
                        <span className="mt-0.5">•</span>
                        <span>{a}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="border-t border-zinc-200 px-8 py-4 text-center text-xs text-zinc-400 dark:border-zinc-700">
            <p>
              ShulePulse — Student Progress Report
              {content?.generatedAt && (
                <> · Generated {new Date(content.generatedAt).toLocaleDateString("en-KE", { dateStyle: "long" })}</>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
