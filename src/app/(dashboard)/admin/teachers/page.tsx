"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useProfile } from "@/lib/use-profile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loading } from "@/components/ui/loading";
import { getInitials } from "@/lib/utils";
import {
  UserPlus,
  X,
  Loader2,
  GraduationCap,
  Pencil,
  Power,
  BookOpen,
  CheckCircle2,
} from "lucide-react";
import type { Profile, Class } from "@/lib/types/database";

export default function AdminTeachersPage() {
  const [teachers, setTeachers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    phone: "",
  });
  const supabase = createClient();
  const { schoolId } = useProfile();

  // Class assignment state
  const [classes, setClasses] = useState<Class[]>([]);
  const [assigningTeacher, setAssigningTeacher] = useState<Profile | null>(null);
  const [selectedClassIds, setSelectedClassIds] = useState<Set<string>>(new Set());
  const [assignSaving, setAssignSaving] = useState(false);
  const [assignError, setAssignError] = useState<string | null>(null);

  // Edit modal state
  const [editingTeacher, setEditingTeacher] = useState<Profile | null>(null);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    first_name: "",
    last_name: "",
    phone: "",
  });

  async function loadTeachers() {
    const [teachersRes, classesRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("role", "teacher").order("first_name"),
      schoolId
        ? supabase.from("classes").select("*").eq("school_id", schoolId).order("name")
        : Promise.resolve({ data: null, error: null }),
    ]);
    if (teachersRes.data) setTeachers(teachersRes.data);
    if (classesRes.data) setClasses(classesRes.data);
    setLoading(false);
  }

  useEffect(() => {
    loadTeachers();
  }, [supabase]);

  const handleOpenModal = () => {
    setForm({ first_name: "", last_name: "", phone: "" });
    setError(null);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    if (!schoolId) {
      setError("Could not determine your school. Please log in again.");
      setSaving(false);
      return;
    }

    const { error: err } = await supabase.from("profiles").insert({
      id: crypto.randomUUID(),
      school_id: schoolId,
      role: "teacher",
      first_name: form.first_name,
      last_name: form.last_name,
      phone: form.phone || null,
      is_active: true,
    });

    if (err) {
      setError(err.message);
      setSaving(false);
      return;
    }

    setShowModal(false);
    setSaving(false);
    loadTeachers();
  };

  const handleOpenEdit = (teacher: Profile) => {
    setEditForm({
      first_name: teacher.first_name,
      last_name: teacher.last_name,
      phone: teacher.phone || "",
    });
    setEditError(null);
    setEditingTeacher(teacher);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTeacher) return;
    setEditSaving(true);
    setEditError(null);

    const { error: err } = await supabase
      .from("profiles")
      .update({
        first_name: editForm.first_name,
        last_name: editForm.last_name,
        phone: editForm.phone || null,
        is_active: editingTeacher.is_active,
      })
      .eq("id", editingTeacher.id);

    if (err) {
      setEditError(err.message);
      setEditSaving(false);
      return;
    }

    setEditingTeacher(null);
    setEditSaving(false);
    loadTeachers();
  };

  const handleToggleActive = async (teacher: Profile) => {
    const { error: err } = await supabase
      .from("profiles")
      .update({ is_active: !teacher.is_active })
      .eq("id", teacher.id);

    if (!err) loadTeachers();
  };

  const handleOpenAssign = (teacher: Profile) => {
    const assigned = new Set(
      classes.filter((c) => c.teacher_id === teacher.id).map((c) => c.id)
    );
    setSelectedClassIds(assigned);
    setAssignError(null);
    setAssigningTeacher(teacher);
  };

  const handleToggleClass = (classId: string) => {
    const next = new Set(selectedClassIds);
    if (next.has(classId)) {
      next.delete(classId);
    } else {
      next.add(classId);
    }
    setSelectedClassIds(next);
  };

  const handleSaveAssignments = async () => {
    if (!assigningTeacher) return;
    setAssignSaving(true);
    setAssignError(null);

    // Unassign this teacher from all classes they were assigned to
    const { error: unassignErr } = await supabase
      .from("classes")
      .update({ teacher_id: null })
      .eq("teacher_id", assigningTeacher.id);

    if (unassignErr) {
      setAssignError(unassignErr.message);
      setAssignSaving(false);
      return;
    }

    // Assign to selected classes
    if (selectedClassIds.size > 0) {
      const { error: assignErr } = await supabase
        .from("classes")
        .update({ teacher_id: assigningTeacher.id })
        .in("id", Array.from(selectedClassIds));

      if (assignErr) {
        setAssignError(assignErr.message);
        setAssignSaving(false);
        return;
      }
    }

    setAssigningTeacher(null);
    setAssignSaving(false);
    loadTeachers();
  };

  const getTeacherClasses = (teacherId: string) =>
    classes.filter((c) => c.teacher_id === teacherId);

  if (loading) return <Loading size="lg" text="Loading teachers..." />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Teachers</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {teachers.length} teacher{teachers.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button onClick={handleOpenModal}>
          <UserPlus className="h-4 w-4" />
          Add Teacher
        </Button>
      </div>

      <Card>
        <CardContent className="p-0 divide-y divide-zinc-200 dark:divide-zinc-800">
          {teachers.map((teacher) => (
            <div key={teacher.id} className="px-6 py-4">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 text-sm font-semibold text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                  {getInitials(teacher.first_name, teacher.last_name)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium">
                    {teacher.first_name} {teacher.last_name}
                  </p>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    {teacher.phone || "No contact"}
                  </p>
                </div>
                <Badge variant={teacher.is_active ? "success" : "warning"}>
                  {teacher.is_active ? "Active" : "Inactive"}
                </Badge>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenAssign(teacher)}
                    className="rounded-md p-2 text-zinc-400 hover:bg-zinc-100 hover:text-emerald-600 dark:hover:bg-zinc-800 dark:hover:text-emerald-400 transition-colors"
                    title="Assign classes"
                  >
                    <BookOpen className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleOpenEdit(teacher)}
                    className="rounded-md p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300 transition-colors"
                    title="Edit teacher"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleToggleActive(teacher)}
                    className={`rounded-md p-2 transition-colors ${
                      teacher.is_active
                        ? "text-emerald-500 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
                        : "text-zinc-300 hover:bg-emerald-50 hover:text-emerald-500 dark:hover:bg-emerald-900/20 dark:text-zinc-600"
                    }`}
                    title={teacher.is_active ? "Deactivate teacher" : "Activate teacher"}
                  >
                    <Power className="h-4 w-4" />
                  </button>
                </div>
              </div>
              {/* Assigned classes */}
              {(() => {
                const assignedClasses = getTeacherClasses(teacher.id);
                return assignedClasses.length > 0 ? (
                  <div className="mt-3 ml-14 flex flex-wrap gap-1.5">
                    {assignedClasses.map((c) => (
                      <span
                        key={c.id}
                        className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300"
                      >
                        {c.name}
                        {c.section && <span>({c.section})</span>}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="mt-3 ml-14">
                    <span className="text-xs text-zinc-400 dark:text-zinc-600">
                      No classes assigned
                    </span>
                  </div>
                );
              })()}
            </div>
          ))}
          {teachers.length === 0 && (
            <div className="px-6 py-16 text-center">
              <GraduationCap className="mx-auto h-16 w-16 text-zinc-200 dark:text-zinc-700" />
              <h3 className="mt-4 text-lg font-semibold">No teachers yet</h3>
              <p className="mt-2 text-sm text-zinc-500 max-w-sm mx-auto">
                Add your first teacher to get started. They&apos;ll be able to manage
                assessments, track CBC competencies, and record attendance.
              </p>
              <Button
                onClick={handleOpenModal}
                className="mt-4"
              >
                <UserPlus className="h-4 w-4" />
                Add Teacher
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Teacher Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Add Teacher</CardTitle>
              <button
                onClick={() => setShowModal(false)}
                className="rounded-lg p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
              >
                <X className="h-5 w-5" />
              </button>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    First Name
                  </label>
                  <Input
                    required
                    value={form.first_name}
                    onChange={(e) =>
                      setForm({ ...form, first_name: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Last Name
                  </label>
                  <Input
                    required
                    value={form.last_name}
                    onChange={(e) =>
                      setForm({ ...form, last_name: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Phone (optional)
                  </label>
                  <Input
                    type="tel"
                    placeholder="+254 7XX XXX XXX"
                    value={form.phone}
                    onChange={(e) =>
                      setForm({ ...form, phone: e.target.value })
                    }
                  />
                </div>
                {error && (
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {error}
                  </p>
                )}
                <div className="flex gap-3 pt-2">
                  <Button type="submit" disabled={saving}>
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      <>
                        <UserPlus className="h-4 w-4" />
                        Add Teacher
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowModal(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Assign Classes Modal */}
      {assigningTeacher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-lg">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>
                Assign Classes — {assigningTeacher.first_name} {assigningTeacher.last_name}
              </CardTitle>
              <button
                onClick={() => setAssigningTeacher(null)}
                className="rounded-lg p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
              >
                <X className="h-5 w-5" />
              </button>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
                Select the classes this teacher will be homeroom teacher for.
              </p>
              <div className="max-h-60 overflow-y-auto rounded-lg border border-zinc-200 dark:border-zinc-700 divide-y divide-zinc-100 dark:divide-zinc-800">
                {classes.length === 0 ? (
                  <div className="p-4 text-center text-sm text-zinc-500">
                    No classes available. Create classes first.
                  </div>
                ) : (
                  classes.map((cls) => {
                    const isSelected = selectedClassIds.has(cls.id);
                    const isAssignedElsewhere =
                      cls.teacher_id && cls.teacher_id !== assigningTeacher.id;
                    return (
                      <button
                        key={cls.id}
                        type="button"
                        disabled={!!isAssignedElsewhere}
                        onClick={() => handleToggleClass(cls.id)}
                        className={`flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800 ${
                          isSelected
                            ? "bg-emerald-50 dark:bg-emerald-900/10"
                            : ""
                        } ${isAssignedElsewhere ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
                      >
                        <div
                          className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                            isSelected
                              ? "bg-emerald-500 text-white"
                              : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
                          }`}
                        >
                          {isSelected ? (
                            <CheckCircle2 className="h-4 w-4" />
                          ) : (
                            <GraduationCap className="h-3.5 w-3.5" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {cls.name}
                            {cls.section && (
                              <span className="text-zinc-400">
                                {" "}— {cls.section}
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-zinc-500">
                            {cls.curriculum_type.toUpperCase()}
                            {isAssignedElsewhere && (
                              <span className="ml-2 text-amber-500">
                                (assigned to another teacher)
                              </span>
                            )}
                          </p>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
              {assignError && (
                <p className="mt-3 text-sm text-red-600 dark:text-red-400">
                  {assignError}
                </p>
              )}
              <div className="flex gap-3 mt-4">
                <Button onClick={handleSaveAssignments} disabled={assignSaving}>
                  {assignSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <BookOpen className="h-4 w-4" />
                      Save Assignments
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setAssigningTeacher(null)}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Edit Teacher Modal */}
      {editingTeacher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>
                Edit {editingTeacher.first_name} {editingTeacher.last_name}
              </CardTitle>
              <button
                onClick={() => setEditingTeacher(null)}
                className="rounded-lg p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
              >
                <X className="h-5 w-5" />
              </button>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    First Name
                  </label>
                  <Input
                    required
                    value={editForm.first_name}
                    onChange={(e) =>
                      setEditForm({ ...editForm, first_name: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Last Name
                  </label>
                  <Input
                    required
                    value={editForm.last_name}
                    onChange={(e) =>
                      setEditForm({ ...editForm, last_name: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Phone (optional)
                  </label>
                  <Input
                    type="tel"
                    placeholder="+254 7XX XXX XXX"
                    value={editForm.phone}
                    onChange={(e) =>
                      setEditForm({ ...editForm, phone: e.target.value })
                    }
                  />
                </div>
                <div className="flex items-center gap-3 pt-2 pb-2">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingTeacher.is_active}
                      onChange={() => {
                        setEditingTeacher({
                          ...editingTeacher,
                          is_active: !editingTeacher.is_active,
                        });
                      }}
                      className="h-4 w-4 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-sm font-medium">Active</span>
                  </label>
                </div>
                {editError && (
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {editError}
                  </p>
                )}
                <div className="flex gap-3 pt-2">
                  <Button type="submit" disabled={editSaving}>
                    {editSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Pencil className="h-4 w-4" />
                        Save Changes
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEditingTeacher(null)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
