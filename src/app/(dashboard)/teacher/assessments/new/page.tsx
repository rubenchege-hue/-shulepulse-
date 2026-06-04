"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ArrowLeft, Plus, X } from "lucide-react";
import type { Class, Subject, AcademicTerm } from "@/lib/types/database";

export default function NewAssessmentPage() {
  const router = useRouter();
  const supabase = createClient();
  const [classes, setClasses] = useState<Class[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [terms, setTerms] = useState<AcademicTerm[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    type: "endterm",
    class_id: "",
    subject_id: "",
    academic_term_id: "",
    max_score: 100,
    date: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    async function load() {
      const { data: profile } = await supabase.from("profiles").select("school_id").single();
      if (!profile?.school_id) return;

      const [classesRes, subjectsRes, termsRes] = await Promise.all([
        supabase.from("classes").select("*").eq("school_id", profile.school_id).order("name"),
        supabase.from("subjects").select("*").eq("school_id", profile.school_id).eq("category", "academic").order("name"),
        supabase.from("academic_terms").select("*").eq("school_id", profile.school_id).order("academic_year", { ascending: false }),
      ]);

      if (classesRes.data) setClasses(classesRes.data);
      if (subjectsRes.data) setSubjects(subjectsRes.data);
      if (termsRes.data) setTerms(termsRes.data);
    }
    load();
  }, [supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data: profile } = await supabase.from("profiles").select("id, school_id").single();
    if (!profile) {
      setError("Profile not found");
      setLoading(false);
      return;
    }

    const { error: err } = await supabase.from("assessments").insert({
      school_id: profile.school_id,
      class_id: form.class_id || null,
      subject_id: form.subject_id || null,
      academic_term_id: form.academic_term_id || null,
      name: form.name,
      type: form.type,
      max_score: form.max_score,
      date: form.date,
      created_by: profile.id,
    });

    if (err) {
      setError(err.message);
      setLoading(false);
      return;
    }

    router.push("/teacher/assessments");
    router.refresh();
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-4">
        <Link href="/teacher/assessments">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Create Assessment</h1>
          <p className="text-sm text-zinc-500">Set up a new exam, test, or assignment</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Assessment Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Assessment Name</label>
              <Input
                required
                placeholder="e.g., End Term 1 Mathematics 2025"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Type</label>
                <Select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  options={[
                    { value: "endterm", label: "End Term Exam" },
                    { value: "midterm", label: "Mid Term Exam" },
                    { value: "cat", label: "Continuous Assessment (CAT)" },
                    { value: "quiz", label: "Quiz" },
                    { value: "assignment", label: "Assignment" },
                  ]}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Max Score</label>
                <Input
                  type="number"
                  required
                  value={form.max_score}
                  onChange={(e) => setForm({ ...form, max_score: parseInt(e.target.value) || 100 })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Class</label>
                <Select
                  value={form.class_id}
                  onChange={(e) => setForm({ ...form, class_id: e.target.value })}
                  options={classes.map((c) => ({
                    value: c.id,
                    label: `${c.name}${c.section ? ` - ${c.section}` : ""}`,
                  }))}
                  placeholder="All classes"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Subject</label>
                <Select
                  value={form.subject_id}
                  onChange={(e) => setForm({ ...form, subject_id: e.target.value })}
                  options={subjects.map((s) => ({ value: s.id, label: `${s.name} (${s.code || ""})` }))}
                  placeholder="All subjects"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Academic Term</label>
                <Select
                  value={form.academic_term_id}
                  onChange={(e) => setForm({ ...form, academic_term_id: e.target.value })}
                  options={terms.map((t) => ({
                    value: t.id,
                    label: `${t.name} ${t.academic_year}`,
                  }))}
                  placeholder="Select term"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Date</label>
                <Input
                  type="date"
                  required
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                />
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            )}

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Creating...</>
                ) : (
                  "Create Assessment"
                )}
              </Button>
              <Link href="/teacher/assessments">
                <Button type="button" variant="outline">Cancel</Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
