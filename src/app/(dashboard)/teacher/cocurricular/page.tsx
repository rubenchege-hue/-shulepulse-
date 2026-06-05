"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useProfile } from "@/lib/use-profile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loading } from "@/components/ui/loading";
import { Save, Loader2, Trophy, CheckCircle2, Plus } from "lucide-react";

const progressLevels = [
  { value: "beginner", label: "Beginner" },
  { value: "developing", label: "Developing" },
  { value: "competent", label: "Competent" },
  { value: "excellent", label: "Excellent" },
  { value: "outstanding", label: "Outstanding" },
];

const levelColors: Record<string, "danger" | "warning" | "default" | "primary" | "success"> = {
  beginner: "danger",
  developing: "warning",
  competent: "default",
  excellent: "primary",
  outstanding: "success",
};

export default function TeacherCocurricularPage() {
  const supabase = createClient();
  const { schoolId, userId } = useProfile();
  const [students, setStudents] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [terms, setTerms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [selectedActivity, setSelectedActivity] = useState("");
  const [selectedTerm, setSelectedTerm] = useState("");
  const [showNewActivity, setShowNewActivity] = useState(false);
  const [newActivityName, setNewActivityName] = useState("");
  const [newActivityCategory, setNewActivityCategory] = useState("sports");

  const [records, setRecords] = useState<Record<string, { level: string; achievements: string; notes: string }>>({});
  const [savedRecords, setSavedRecords] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!schoolId) { setLoading(false); return; }

    async function load() {
      const [studentsRes, activitiesRes, termsRes] = await Promise.all([
        supabase.from("students").select("id, first_name, last_name, admission_number").eq("school_id", schoolId).eq("status", "active").order("first_name"),
        supabase.from("co_curricular_activities").select("*").eq("school_id", schoolId).eq("is_active", true).order("name"),
        supabase.from("academic_terms").select("*").eq("school_id", schoolId).order("academic_year", { ascending: false }),
      ]);

      if (studentsRes.data) setStudents(studentsRes.data);
      if (activitiesRes.data) setActivities(activitiesRes.data);
      if (termsRes.data) {
        setTerms(termsRes.data);
        const current = termsRes.data.find((t: any) => t.is_current);
        if (current) setSelectedTerm(current.id);
      }

      setLoading(false);
    }
    load();
  }, [schoolId, supabase]);

  const handleLoadExisting = async () => {
    if (!selectedActivity || !selectedTerm) return;

    const { data } = await supabase
      .from("co_curricular_records")
      .select("student_id, progress_level, achievements, notes")
      .eq("activity_id", selectedActivity)
      .eq("academic_term_id", selectedTerm);

    if (data) {
      const newRecords: Record<string, { level: string; achievements: string; notes: string }> = {};
      const saved = new Set<string>();
      data.forEach((r) => {
        newRecords[r.student_id] = {
          level: r.progress_level,
          achievements: r.achievements || "",
          notes: r.notes || "",
        };
        saved.add(r.student_id);
      });
      setRecords(newRecords);
      setSavedRecords(saved);
    }
  };

  useEffect(() => {
    if (selectedActivity) handleLoadExisting();
  }, [selectedActivity, selectedTerm]);

  const handleCreateActivity = async () => {
    if (!newActivityName) return;
    if (!schoolId) return;

    await supabase.from("co_curricular_activities").insert({
      name: newActivityName,
      category: newActivityCategory,
      school_id: schoolId,
    });

    setNewActivityName("");
    setShowNewActivity(false);

    // Reload activities
    const { data } = await supabase
      .from("co_curricular_activities")
      .select("*")
      .eq("school_id", schoolId)
      .eq("is_active", true)
      .order("name");
    if (data) setActivities(data);
  };

  const handleSaveAll = async () => {
    if (!selectedActivity || !selectedTerm) return;
    setSaving(true);

    for (const student of students) {
      const record = records[student.id];
      if (!record?.level) continue;

      await supabase.from("co_curricular_records").upsert({
        student_id: student.id,
        activity_id: selectedActivity,
        academic_term_id: selectedTerm,
        teacher_id: userId,
        progress_level: record.level,
        achievements: record.achievements || null,
        notes: record.notes || null,
        date: new Date().toISOString().split("T")[0],
      }, {
        onConflict: "student_id, activity_id, academic_term_id",
      });
    }

    setSavedRecords(new Set(Object.keys(records)));
    setSaving(false);
  };

  const updateRecord = (studentId: string, field: string, value: string) => {
    setRecords((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], [field]: value },
    }));
    setSavedRecords((prev) => {
      const next = new Set(prev);
      next.delete(studentId);
      return next;
    });
  };

  if (loading) return <Loading size="lg" text="Loading co-curricular module..." />;

  const categoryLabels: Record<string, string> = {
    sports: "Sports", music: "Music", drama: "Drama & Theatre", debate: "Debate & Public Speaking",
    scouts: "Scouts & Guides", clubs: "Clubs & Societies", arts: "Arts & Craft",
    community_service: "Community Service", other: "Other Activities",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Co-Curricular Tracking</h1>
        <p className="text-sm text-zinc-500">Record student participation and progress in activities</p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1">Activity</label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <Select
                    value={selectedActivity}
                    onChange={(e) => setSelectedActivity(e.target.value)}
                    options={activities.map((a) => ({
                      value: a.id,
                      label: `${a.name} (${categoryLabels[a.category] || a.category})`,
                    }))}
                    placeholder="Select activity"
                  />
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setShowNewActivity(!showNewActivity)}
                  title="Add new activity"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
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

          {showNewActivity && (
            <div className="mt-3 flex flex-wrap items-end gap-2 border-t border-zinc-200 pt-3 dark:border-zinc-700">
              <div className="flex-1 min-w-[200px]">
                <label className="block text-xs font-medium mb-1">New Activity Name</label>
                <Input
                  placeholder="e.g., Football, Drama Club"
                  value={newActivityName}
                  onChange={(e) => setNewActivityName(e.target.value)}
                />
              </div>
              <div className="w-[180px]">
                <label className="block text-xs font-medium mb-1">Category</label>
                <Select
                  value={newActivityCategory}
                  onChange={(e) => setNewActivityCategory(e.target.value)}
                  options={Object.entries(categoryLabels).map(([value, label]) => ({ value, label }))}
                />
              </div>
              <Button onClick={handleCreateActivity} size="sm">
                <Plus className="h-4 w-4" /> Create
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Student Records */}
      {selectedActivity ? (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Student Records</CardTitle>
            <Button onClick={handleSaveAll} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save All
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {students.map((student) => {
              const record = records[student.id];
              return (
                <div
                  key={student.id}
                  className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-700"
                >
                  <div className="flex items-center gap-4 mb-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{student.first_name} {student.last_name}</p>
                      <p className="text-xs text-zinc-500">{student.admission_number}</p>
                    </div>
                    {savedRecords.has(student.id) && (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium mb-1">Progress Level</label>
                      <div className="flex gap-1">
                        {progressLevels.map((pl) => (
                          <button
                            key={pl.value}
                            onClick={() => updateRecord(student.id, "level", pl.value)}
                            className={`h-8 flex-1 rounded-md text-xs font-medium transition-all ${
                              record?.level === pl.value
                                ? "bg-emerald-500 text-white ring-2 ring-emerald-300"
                                : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400"
                            }`}
                          >
                            {pl.label.slice(0, 4)}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">Achievements</label>
                      <Input
                        placeholder="e.g., 1st place, Best player"
                        value={record?.achievements || ""}
                        onChange={(e) => updateRecord(student.id, "achievements", e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">Notes</label>
                      <Input
                        placeholder="Additional notes"
                        value={record?.notes || ""}
                        onChange={(e) => updateRecord(student.id, "notes", e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <Trophy className="mx-auto h-12 w-12 text-zinc-300" />
            <p className="mt-4 text-sm text-zinc-500">Select an activity and term to start recording</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
