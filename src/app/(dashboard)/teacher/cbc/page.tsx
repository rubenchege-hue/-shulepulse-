"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useProfile } from "@/lib/use-profile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loading } from "@/components/ui/loading";
import { Save, Loader2, School, CheckCircle2 } from "lucide-react";
import { getCbcRatingLabel } from "@/lib/utils";

export default function TeacherCbcPage() {
  const supabase = createClient();
  const { schoolId, userId } = useProfile();
  const [students, setStudents] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [strands, setStrands] = useState<any[]>([]);
  const [subStrands, setSubStrands] = useState<any[]>([]);
  const [terms, setTerms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedStrand, setSelectedStrand] = useState("");
  const [selectedSubStrand, setSelectedSubStrand] = useState("");
  const [selectedTerm, setSelectedTerm] = useState("");

  // ratings[studentId] = rating value
  const [ratings, setRatings] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [savedRecords, setSavedRecords] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!schoolId || !userId) { setLoading(false); return; }

    async function load() {
      // Get teacher's assigned class IDs
      const { data: myClasses } = await supabase
        .from("classes")
        .select("id")
        .eq("school_id", schoolId)
        .eq("teacher_id", userId);
      const classIds = myClasses?.map((c) => c.id) || [];

      const [studentsRes, subjectsRes, strandsRes, termsRes] = await Promise.all([
        classIds.length > 0
          ? supabase.from("students").select("id, first_name, last_name, admission_number").in("class_id", classIds).eq("status", "active").order("first_name")
          : Promise.resolve({ data: [], error: null }),
        supabase.from("subjects").select("id, name, code").eq("school_id", schoolId).eq("curriculum_type", "cbc").order("name"),
        supabase.from("cbc_strands").select("id, name, subject_id").eq("school_id", schoolId).order("name"),
        supabase.from("academic_terms").select("id, name, academic_year, is_current").eq("school_id", schoolId).order("academic_year", { ascending: false }),
      ]);

      if (studentsRes.data) setStudents(studentsRes.data);
      if (subjectsRes.data) setSubjects(subjectsRes.data);
      if (strandsRes.data) setStrands(strandsRes.data);
      if (termsRes.data) setTerms(termsRes.data);

      // Auto-select current term
      const current = termsRes.data?.find((t) => t.is_current);
      if (current) setSelectedTerm(current.id);

      setLoading(false);
    }
    load();
  }, [supabase]);

  // Filter strands by selected subject
  const filteredStrands = strands.filter((s) => !selectedSubject || s.subject_id === selectedSubject);

  const handleSubjectChange = (subjectId: string) => {
    setSelectedSubject(subjectId);
    setSelectedStrand("");
    setSelectedSubStrand("");
    setRatings({});
    setNotes({});
  };

  const handleStrandChange = async (strandId: string) => {
    setSelectedStrand(strandId);
    setSelectedSubStrand("");
    setRatings({});
    setNotes({});

    if (strandId) {
      const { data } = await supabase
        .from("cbc_sub_strands")
        .select("id, name")
        .eq("strand_id", strandId)
        .order("name");
      if (data) setSubStrands(data);
    } else {
      setSubStrands([]);
    }
  };

  // Load existing records for the selected sub-strand and term
  const handleLoadExisting = async () => {
    if (!selectedSubStrand || !selectedTerm) return;

    const { data } = await supabase
      .from("cbc_competency_records")
      .select("student_id, rating, notes")
      .eq("sub_strand_id", selectedSubStrand)
      .eq("academic_term_id", selectedTerm);

    if (data) {
      const newRatings: Record<string, string> = {};
      const newNotes: Record<string, string> = {};
      const saved = new Set<string>();
      data.forEach((r) => {
        newRatings[r.student_id] = r.rating;
        if (r.notes) newNotes[r.student_id] = r.notes;
        saved.add(r.student_id);
      });
      setRatings(newRatings);
      setNotes(newNotes);
      setSavedRecords(saved);
    }
  };

  useEffect(() => {
    if (selectedSubStrand) handleLoadExisting();
  }, [selectedSubStrand, selectedTerm]);

  const handleSaveAll = async () => {
    if (!selectedSubStrand || !selectedTerm) return;
    setSaving(true);

    for (const student of students) {
      const rating = ratings[student.id];
      if (!rating) continue;

      await supabase.from("cbc_competency_records").upsert({
        student_id: student.id,
        sub_strand_id: selectedSubStrand,
        academic_term_id: selectedTerm,
        teacher_id: userId,
        rating,
        notes: notes[student.id] || null,
        date: new Date().toISOString().split("T")[0],
      }, {
        onConflict: "student_id, sub_strand_id, academic_term_id",
      });
    }

    setSavedRecords(new Set(Object.keys(ratings)));
    setSaving(false);
  };

  if (loading) return <Loading size="lg" text="Loading CBC module..." />;

  const ratingOptions = [
    { value: "E", label: "E - Exceeding Expectations" },
    { value: "B", label: "B - Meeting Expectations" },
    { value: "A", label: "A - Approaching Expectations" },
    { value: "P", label: "P - Below Expectations" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">CBC Competency Tracking</h1>
        <p className="text-sm text-zinc-500">Record student competency ratings across strands and sub-strands</p>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-2">
        <Badge variant="success">E - Exceeding Expectations</Badge>
        <Badge variant="primary">B - Meeting Expectations</Badge>
        <Badge variant="warning">A - Approaching Expectations</Badge>
        <Badge variant="danger">P - Below Expectations</Badge>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1">Subject</label>
              <Select
                value={selectedSubject}
                onChange={(e) => handleSubjectChange(e.target.value)}
                options={subjects.map((s) => ({ value: s.id, label: s.name }))}
                placeholder="Select subject"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Strand</label>
              <Select
                value={selectedStrand}
                onChange={(e) => handleStrandChange(e.target.value)}
                options={filteredStrands.map((s) => ({ value: s.id, label: s.name }))}
                placeholder="Select strand"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Sub-Strand</label>
              <Select
                value={selectedSubStrand}
                onChange={(e) => setSelectedSubStrand(e.target.value)}
                options={subStrands.map((s) => ({ value: s.id, label: s.name }))}
                placeholder="Select sub-strand"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Term</label>
              <Select
                value={selectedTerm}
                onChange={(e) => setSelectedTerm(e.target.value)}
                options={terms.map((t) => ({
                  value: t.id,
                  label: `${t.name} ${t.academic_year}${t.is_current ? " (Current)" : ""}`,
                }))}
                placeholder="Select term"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Student List */}
      {selectedSubStrand ? (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Student Ratings</CardTitle>
            <Button onClick={handleSaveAll} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save All Ratings
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {students.map((student) => (
                <div
                  key={student.id}
                  className="flex items-center gap-4 rounded-lg border border-zinc-200 p-3 dark:border-zinc-700"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{student.first_name} {student.last_name}</p>
                    <p className="text-xs text-zinc-500">{student.admission_number}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {ratingOptions.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setRatings((prev) => ({ ...prev, [student.id]: opt.value }))}
                        className={`h-9 w-9 rounded-lg text-xs font-bold transition-all ${
                          ratings[student.id] === opt.value
                            ? opt.value === "E" ? "bg-emerald-500 text-white ring-2 ring-emerald-300"
                              : opt.value === "B" ? "bg-blue-500 text-white ring-2 ring-blue-300"
                              : opt.value === "A" ? "bg-amber-500 text-white ring-2 ring-amber-300"
                              : "bg-red-500 text-white ring-2 ring-red-300"
                            : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400"
                        }`}
                        title={getCbcRatingLabel(opt.value)}
                      >
                        {opt.value}
                      </button>
                    ))}
                  </div>
                  {savedRecords.has(student.id) && (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <School className="mx-auto h-12 w-12 text-zinc-300" />
            <p className="mt-4 text-sm text-zinc-500">
              Select a subject, strand, sub-strand, and term to begin recording competencies
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
