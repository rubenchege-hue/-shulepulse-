"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loading } from "@/components/ui/loading";
import { ArrowLeft, BookOpen, School, Trophy, Edit2, Save, Loader2 } from "lucide-react";
import { getInitials, formatDate, formatScore, computeGrade, getCbcRatingLabel, getProgressLevelLabel } from "@/lib/utils";
import type { Student, Class, StudentStatus, Gender } from "@/lib/types/database";

const ratingColors: Record<string, any> = { E: "success", B: "primary", A: "warning", P: "danger" };
const levelColors: Record<string, any> = { outstanding: "success", excellent: "primary", competent: "default", developing: "warning", beginner: "danger" };

export default function AdminStudentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const supabase = createClient();
  const [student, setStudent] = useState<(Student & { classes?: Class }) | null>(null);
  const [classes, setClasses] = useState<Class[]>([]);
  const [scores, setScores] = useState<any[]>([]);
  const [cbcRecords, setCbcRecords] = useState<any[]>([]);
  const [cocurricularRecords, setCocurricularRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [activeTab, setActiveTab] = useState<"academic" | "cbc" | "cocurricular">("academic");
  const [editForm, setEditForm] = useState({
    first_name: "",
    last_name: "",
    admission_number: "",
    date_of_birth: "",
    gender: "",
    class_id: "",
    status: "active",
  });

  useEffect(() => {
    async function load() {
      const { data: studentData } = await supabase
        .from("students")
        .select("*, classes(*)")
        .eq("id", id)
        .single();
      if (!studentData) { setLoading(false); return; }
      setStudent(studentData as any);
      setEditForm({
        first_name: studentData.first_name,
        last_name: studentData.last_name,
        admission_number: studentData.admission_number,
        date_of_birth: studentData.date_of_birth || "",
        gender: studentData.gender || "",
        class_id: studentData.class_id || "",
        status: studentData.status,
      });

      const { data: classesData } = await supabase.from("classes").select("*").order("name");
      if (classesData) setClasses(classesData);

      const [scoresRes, cbcRes, cocurRes] = await Promise.all([
        supabase.from("assessment_scores")
          .select("id, score, grade, assessment:assessments!inner(name, type, date, max_score, subjects(name))")
          .eq("student_id", id)
          .order("date", { ascending: false, referencedTable: "assessments" }),
        supabase.from("cbc_competency_records")
          .select("id, rating, notes, date, sub_strand:cbc_sub_strands!inner(name, strand:cbc_strands!inner(name, subjects!inner(name)))")
          .eq("student_id", id)
          .order("date", { ascending: false }),
        supabase.from("co_curricular_records")
          .select("id, progress_level, achievements, notes, date, activity:co_curricular_activities!inner(name, category)")
          .eq("student_id", id)
          .order("date", { ascending: false }),
      ]);

      if (scoresRes.data) setScores(scoresRes.data as any[]);
      if (cbcRes.data) setCbcRecords(cbcRes.data as any[]);
      if (cocurRes.data) setCocurricularRecords(cocurRes.data as any[]);
      setLoading(false);
    }
    load();
  }, [supabase, id]);

  const handleSaveProfile = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("students")
      .update({
        first_name: editForm.first_name,
        last_name: editForm.last_name,
        admission_number: editForm.admission_number,
        date_of_birth: editForm.date_of_birth || null,
        gender: editForm.gender || null,
        class_id: editForm.class_id || null,
        status: editForm.status,
      })
      .eq("id", id);

    if (!error) {
      setStudent((prev) => prev ? {
        ...prev,
        first_name: editForm.first_name,
        last_name: editForm.last_name,
        admission_number: editForm.admission_number,
        date_of_birth: editForm.date_of_birth || null,
        gender: (editForm.gender || null) as Gender | null,
        class_id: editForm.class_id || null,
        status: editForm.status as StudentStatus,
      } : prev);
      setEditMode(false);
    }
    setSaving(false);
  };

  const tabs = [
    { id: "academic" as const, label: "Academic (8-4-4)", icon: BookOpen, count: scores.length },
    { id: "cbc" as const, label: "CBC Competencies", icon: School, count: cbcRecords.length },
    { id: "cocurricular" as const, label: "Co-Curricular", icon: Trophy, count: cocurricularRecords.length },
  ];

  if (loading) return <Loading size="lg" text="Loading student profile..." />;
  if (!student) return <div className="text-center py-12 text-zinc-500">Student not found</div>;

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/students">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-lg font-bold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
            {getInitials(student.first_name, student.last_name)}
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{student.first_name} {student.last_name}</h1>
            <p className="text-sm text-zinc-500">
              {student.admission_number} · {student.classes?.name || "No class"} · {student.gender || "N/A"} · Enrolled {formatDate(student.enrollment_date)}
            </p>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Badge variant={student.status === "active" ? "success" : student.status === "graduated" ? "primary" : "warning"}>
            {student.status}
          </Badge>
          <Button variant="outline" size="sm" onClick={() => setEditMode(!editMode)}>
            <Edit2 className="h-4 w-4" />
            {editMode ? "Cancel" : "Edit"}
          </Button>
        </div>
      </div>

      {/* Edit Profile Card */}
      {editMode && (
        <Card>
          <CardHeader>
            <CardTitle>Edit Student Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium mb-1">First Name</label>
                <Input value={editForm.first_name} onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Last Name</label>
                <Input value={editForm.last_name} onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Admission No.</label>
                <Input value={editForm.admission_number} onChange={(e) => setEditForm({ ...editForm, admission_number: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Date of Birth</label>
                <Input type="date" value={editForm.date_of_birth} onChange={(e) => setEditForm({ ...editForm, date_of_birth: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Gender</label>
                <Select value={editForm.gender} onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })} options={[
                  { value: "male", label: "Male" },
                  { value: "female", label: "Female" },
                ]} placeholder="Select" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Class</label>
                <Select value={editForm.class_id} onChange={(e) => setEditForm({ ...editForm, class_id: e.target.value })} options={classes.map((c) => ({
                  value: c.id, label: `${c.name}${c.section ? ` - ${c.section}` : ""}`,
                }))} placeholder="Select class" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Status</label>
                <Select value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })} options={[
                  { value: "active", label: "Active" },
                  { value: "transferred", label: "Transferred" },
                  { value: "graduated", label: "Graduated" },
                  { value: "withdrawn", label: "Withdrawn" },
                ]} />
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <Button onClick={handleSaveProfile} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save Changes
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-3">
        <Card><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{scores.length}</p>
          <p className="text-xs text-zinc-500">Assessments</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold text-emerald-600">{cbcRecords.length}</p>
          <p className="text-xs text-zinc-500">CBC Ratings</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold text-amber-600">{cocurricularRecords.length}</p>
          <p className="text-xs text-zinc-500">Activities</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold text-purple-600">{student.classes?.name || "-"}</p>
          <p className="text-xs text-zinc-500">Current Class</p>
        </CardContent></Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-zinc-200 pb-2 dark:border-zinc-700">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              activeTab === tab.id
                ? "bg-white text-emerald-600 border-b-2 border-emerald-600 dark:bg-zinc-900 dark:text-emerald-400"
                : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
            <Badge variant="default" className="ml-1">{tab.count}</Badge>
          </button>
        ))}
      </div>

      {/* Academic Tab */}
      {activeTab === "academic" && (
        <div className="space-y-3">
          {scores.map((s: any) => {
            const assessment = s.assessment;
            const grade = s.grade || computeGrade(s.score, assessment?.max_score || 100);
            const gradeColor = grade.startsWith("A") ? "success" : grade.startsWith("B") ? "primary" : grade.startsWith("C") ? "warning" : "danger";
            return (
              <Card key={s.id}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium">{assessment?.name}</p>
                    <p className="text-xs text-zinc-500">{assessment?.subjects?.name} · {assessment?.type} · {formatDate(assessment?.date)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold">{formatScore(s.score, assessment?.max_score)}</span>
                    <Badge variant={gradeColor}>{grade}</Badge>
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {scores.length === 0 && <p className="text-center text-zinc-500 py-8">No academic records</p>}
        </div>
      )}

      {/* CBC Tab */}
      {activeTab === "cbc" && (
        <div className="space-y-3">
          {cbcRecords.map((r: any) => (
            <Card key={r.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium">{r.sub_strand?.strand?.subjects?.name} - {r.sub_strand?.strand?.name}</p>
                    <p className="text-sm text-zinc-500">{r.sub_strand?.name}</p>
                    {r.notes && <p className="text-xs text-zinc-400 mt-1">{r.notes}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={ratingColors[r.rating]}>{r.rating} - {getCbcRatingLabel(r.rating)}</Badge>
                    <span className="text-xs text-zinc-400">{formatDate(r.date)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {cbcRecords.length === 0 && <p className="text-center text-zinc-500 py-8">No CBC records</p>}
        </div>
      )}

      {/* Co-Curricular Tab */}
      {activeTab === "cocurricular" && (
        <div className="space-y-3">
          {cocurricularRecords.map((r: any) => (
            <Card key={r.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium">{r.activity?.name}</p>
                    <p className="text-xs text-zinc-500 capitalize">{r.activity?.category}</p>
                    {r.achievements && <p className="text-sm text-amber-600 mt-1">🏆 {r.achievements}</p>}
                    {r.notes && <p className="text-xs text-zinc-400 mt-0.5">{r.notes}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={levelColors[r.progress_level]}>{getProgressLevelLabel(r.progress_level)}</Badge>
                    <span className="text-xs text-zinc-400">{formatDate(r.date)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {cocurricularRecords.length === 0 && <p className="text-center text-zinc-500 py-8">No co-curricular records</p>}
        </div>
      )}
    </div>
  );
}
