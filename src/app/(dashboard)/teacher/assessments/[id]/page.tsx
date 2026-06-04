"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loading } from "@/components/ui/loading";
import { ArrowLeft, Save, CheckCircle2, Loader2 } from "lucide-react";
import { formatDate, computeGrade } from "@/lib/utils";

export default function AssessmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const supabase = createClient();
  const [assessment, setAssessment] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [scores, setScores] = useState<Record<string, string>>({});
  const [savedScores, setSavedScores] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      // Get assessment details
      const { data: assessmentData } = await supabase
        .from("assessments")
        .select("*, subjects(name, code), classes(name, section), academic_terms(name, academic_year)")
        .eq("id", id)
        .single();
      if (!assessmentData) return;
      setAssessment(assessmentData);

      // Get the class students
      const classId = assessmentData.class_id;
      let studentsData: any[] = [];
      if (classId) {
        const { data } = await supabase
          .from("students")
          .select("id, first_name, last_name, admission_number")
          .eq("class_id", classId)
          .eq("status", "active")
          .order("first_name");
        if (data) studentsData = data;
      } else {
        // If no class filter, get all active students
        const { data: profile } = await supabase.from("profiles").select("school_id").single();
        const { data } = await supabase
          .from("students")
          .select("id, first_name, last_name, admission_number")
          .eq("school_id", profile?.school_id)
          .eq("status", "active")
          .order("first_name");
        if (data) studentsData = data;
      }
      setStudents(studentsData);

      // Load existing scores
      const { data: existingScores } = await supabase
        .from("assessment_scores")
        .select("student_id, score")
        .eq("assessment_id", id);
      if (existingScores) {
        const scoreMap: Record<string, string> = {};
        const savedSet = new Set<string>();
        existingScores.forEach((s) => {
          scoreMap[s.student_id] = s.score.toString();
          savedSet.add(s.student_id);
        });
        setScores(scoreMap);
        setSavedScores(savedSet);
      }

      setLoading(false);
    }
    load();
  }, [supabase, id]);

  const handleScoreChange = (studentId: string, value: string) => {
    setScores((prev) => ({ ...prev, [studentId]: value }));
    setSavedScores((prev) => {
      const next = new Set(prev);
      next.delete(studentId);
      return next;
    });
  };

  const handleSaveScore = async (studentId: string) => {
    const scoreValue = parseFloat(scores[studentId]);
    if (isNaN(scoreValue)) return;

    setSaving(true);
    const maxScore = assessment.max_score || 100;
    const grade = computeGrade(scoreValue, maxScore);

    const { error } = await supabase.from("assessment_scores").upsert({
      assessment_id: id,
      student_id: studentId,
      score: scoreValue,
      grade,
    }, {
      onConflict: "assessment_id, student_id",
    });

    if (!error) {
      setSavedScores((prev) => new Set(prev).add(studentId));
    }
    setSaving(false);
  };

  const handleSaveAll = async () => {
    setSaving(true);
    const maxScore = assessment.max_score || 100;
    const entries = Object.entries(scores).map(([studentId, scoreStr]) => {
      const scoreValue = parseFloat(scoreStr);
      if (isNaN(scoreValue)) return null;
      return {
        assessment_id: id,
        student_id: studentId,
        score: scoreValue,
        grade: computeGrade(scoreValue, maxScore),
      };
    }).filter(Boolean);

    for (const entry of entries) {
      await supabase.from("assessment_scores").upsert(entry as any, {
        onConflict: "assessment_id, student_id",
      });
    }

    setSavedScores(new Set(Object.keys(scores)));
    setSaving(false);
  };

  if (loading) return <Loading size="lg" text="Loading assessment..." />;
  if (!assessment) return <div className="text-center py-12 text-zinc-500">Assessment not found</div>;

  const typeColors: Record<string, any> = {
    endterm: "danger", midterm: "warning", cat: "primary", quiz: "secondary", assignment: "default",
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <Link href="/teacher/assessments">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">{assessment.name}</h1>
          <div className="flex items-center gap-2 mt-1 text-sm text-zinc-500">
            <Badge variant={typeColors[assessment.type] || "default"}>{assessment.type}</Badge>
            <span>{assessment.subjects?.name} · {assessment.classes?.name} · {formatDate(assessment.date)}</span>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Score Entry</CardTitle>
          <div className="flex items-center gap-3">
            <span className="text-sm text-zinc-500">
              {Object.keys(scores).length} / {students.length} entered
            </span>
            <Button onClick={handleSaveAll} disabled={saving} size="sm">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-zinc-50 dark:bg-zinc-800">
                  <th className="px-4 py-3 text-left font-medium text-zinc-500">#</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-500">Student</th>
                  <th className="px-4 py-3 text-left font-medium text-zinc-500">Admission No.</th>
                  <th className="px-4 py-3 text-center font-medium text-zinc-500">
                    Score / {assessment.max_score}
                  </th>
                  <th className="px-4 py-3 text-center font-medium text-zinc-500">Grade</th>
                  <th className="px-4 py-3 text-center font-medium text-zinc-500">Status</th>
                  <th className="px-4 py-3 text-center font-medium text-zinc-500"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
                {students.map((student, idx) => {
                  const scoreVal = parseFloat(scores[student.id] || "");
                  const grade = isNaN(scoreVal) ? "-" : computeGrade(scoreVal, assessment.max_score);
                  const isSaved = savedScores.has(student.id);
                  const hasValue = student.id in scores && scores[student.id] !== "";

                  return (
                    <tr key={student.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                      <td className="px-4 py-3 text-zinc-400">{idx + 1}</td>
                      <td className="px-4 py-3 font-medium">{student.first_name} {student.last_name}</td>
                      <td className="px-4 py-3 text-zinc-500">{student.admission_number}</td>
                      <td className="px-4 py-3">
                        <Input
                          type="number"
                          min={0}
                          max={assessment.max_score}
                          step={0.5}
                          placeholder="Score"
                          value={scores[student.id] || ""}
                          onChange={(e) => handleScoreChange(student.id, e.target.value)}
                          className="w-24 mx-auto text-center"
                        />
                      </td>
                      <td className="px-4 py-3 text-center font-semibold">{grade}</td>
                      <td className="px-4 py-3 text-center">
                        {isSaved && <CheckCircle2 className="h-4 w-4 text-emerald-500 mx-auto" />}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={!hasValue || saving}
                          onClick={() => handleSaveScore(student.id)}
                        >
                          Save
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
