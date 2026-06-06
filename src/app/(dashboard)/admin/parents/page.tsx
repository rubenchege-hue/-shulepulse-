"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loading } from "@/components/ui/loading";
import {
  Users,
  Search,
  Link2,
  Loader2,
  CheckCircle2,
  UserPlus,
  X,
  Star,
  UserCheck,
  Pencil,
  Power,
} from "lucide-react";
import { getInitials } from "@/lib/utils";
import type { Profile, Student, StudentParent } from "@/lib/types/database";

interface ParentWithChildren extends Profile {
  children: (StudentParent & {
    student?: Pick<Student, "id" | "first_name" | "last_name" | "admission_number">;
  })[];
}



export default function AdminParentsPage() {
  const supabase = createClient();
  const [parents, setParents] = useState<ParentWithChildren[]>([]);
  const [students, setStudents] = useState<
    { id: string; first_name: string; last_name: string; admission_number: string; classes?: { name: string } | null }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  // Add parent modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [addSaving, setAddSaving] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [addForm, setAddForm] = useState({
    first_name: "",
    last_name: "",
    phone: "",
  });

  // Edit parent modal state
  const [editingParent, setEditingParent] = useState<Profile | null>(null);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    first_name: "",
    last_name: "",
    phone: "",
  });

  // Link modal state
  const [linkModal, setLinkModal] = useState<{
    open: boolean;
    parentId: string;
    parentName: string;
  }>({ open: false, parentId: "", parentName: "" });
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [selectedRelationship, setSelectedRelationship] = useState("other");
  const [selectedPrimary, setSelectedPrimary] = useState(false);
  const [studentSearch, setStudentSearch] = useState("");
  const [linkError, setLinkError] = useState<string | null>(null);

  async function loadData() {
    const { data: profile } = await supabase
      .from("profiles")
      .select("school_id")
      .single();

    if (!profile?.school_id) {
      setLoading(false);
      return;
    }

    // Get all parent profiles
    const { data: parentProfiles } = await supabase
      .from("profiles")
      .select("*")
      .eq("role", "parent")
      .eq("school_id", profile.school_id)
      .order("first_name");

    if (!parentProfiles) {
      setLoading(false);
      return;
    }

    // Get all students for this school
    const { data: studentsData } = await supabase
      .from("students")
      .select("id, first_name, last_name, admission_number, classes!left(name)")
      .eq("school_id", profile.school_id)
      .eq("status", "active")
      .order("first_name");

    if (studentsData) setStudents(studentsData as any[]);

    // Get all links for these parents
    const parentIds = parentProfiles.map((p) => p.id);
    const { data: links } = await supabase
      .from("student_parents")
      .select("*, student:students!inner(id, first_name, last_name, admission_number)")
      .in("parent_id", parentIds)
      .order("created_at", { ascending: false });

    // Group links by parent
    const linkMap = new Map<string, any[]>();
    (links || []).forEach((link: any) => {
      if (!linkMap.has(link.parent_id)) linkMap.set(link.parent_id, []);
      linkMap.get(link.parent_id)!.push(link);
    });

    const parentsWithChildren: ParentWithChildren[] = parentProfiles.map((p) => ({
      ...p,
      children: linkMap.get(p.id) || [],
    }));

    setParents(parentsWithChildren);
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, [supabase]);

  const filteredParents = parents.filter((p) => {
    const name = `${p.first_name} ${p.last_name}`.toLowerCase();
    const phone = (p.phone || "").toLowerCase();
    const query = search.toLowerCase();
    return name.includes(query) || phone.includes(query);
  });

  const handleOpenLinkModal = (parentId: string, parentName: string) => {
    setLinkModal({ open: true, parentId, parentName });
    setSelectedStudentId("");
    setSelectedRelationship("other");
    setSelectedPrimary(false);
    setStudentSearch("");
    setLinkError(null);
  };

  const handleLinkStudent = async () => {
    if (!selectedStudentId) {
      setLinkError("Please select a student.");
      return;
    }

    setSaving(true);
    setLinkError(null);

    const { error: err } = await supabase.from("student_parents").insert({
      parent_id: linkModal.parentId,
      student_id: selectedStudentId,
      relationship: selectedRelationship,
      is_primary_contact: selectedPrimary,
    });

    if (err) {
      if (err.code === "23505") {
        setLinkError("This student is already linked to this parent.");
      } else {
        setLinkError(err.message);
      }
      setSaving(false);
      return;
    }

    setLinkModal({ open: false, parentId: "", parentName: "" });
    setSaving(false);
    loadData();
  };

  const handleUnlink = async (parentId: string, studentId: string) => {
    if (!confirm("Are you sure you want to remove this parent-student link?")) return;

    await supabase
      .from("student_parents")
      .delete()
      .eq("parent_id", parentId)
      .eq("student_id", studentId);

    loadData();
  };

  const handleOpenAddModal = () => {
    setAddForm({ first_name: "", last_name: "", phone: "" });
    setAddError(null);
    setShowAddModal(true);
  };

  const handleAddParent = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddSaving(true);
    setAddError(null);

    const { data: profile } = await supabase
      .from("profiles")
      .select("school_id")
      .single();

    if (!profile?.school_id) {
      setAddError("Could not determine your school. Please log in again.");
      setAddSaving(false);
      return;
    }

    const { error: err } = await supabase.from("profiles").insert({
      id: crypto.randomUUID(),
      school_id: profile.school_id,
      role: "parent",
      first_name: addForm.first_name,
      last_name: addForm.last_name,
      phone: addForm.phone || null,
      is_active: true,
    });

    if (err) {
      setAddError(err.message);
      setAddSaving(false);
      return;
    }

    setShowAddModal(false);
    setAddSaving(false);
    loadData();
  };

  const handleOpenEdit = (parent: Profile) => {
    setEditForm({
      first_name: parent.first_name,
      last_name: parent.last_name,
      phone: parent.phone || "",
    });
    setEditError(null);
    setEditingParent(parent);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingParent) return;
    setEditSaving(true);
    setEditError(null);

    const { error: err } = await supabase
      .from("profiles")
      .update({
        first_name: editForm.first_name,
        last_name: editForm.last_name,
        phone: editForm.phone || null,
        is_active: editingParent.is_active,
      })
      .eq("id", editingParent.id);

    if (err) {
      setEditError(err.message);
      setEditSaving(false);
      return;
    }

    setEditingParent(null);
    setEditSaving(false);
    loadData();
  };

  const handleToggleActive = async (parent: Profile) => {
    const { error: err } = await supabase
      .from("profiles")
      .update({ is_active: !parent.is_active })
      .eq("id", parent.id);

    if (!err) loadData();
  };

  const handleUpdateRelationship = async (
    parentId: string,
    studentId: string,
    relationship: string
  ) => {
    await supabase
      .from("student_parents")
      .update({ relationship })
      .eq("parent_id", parentId)
      .eq("student_id", studentId);

    loadData();
  };

  const handleTogglePrimary = async (
    parentId: string,
    studentId: string,
    current: boolean
  ) => {
    await supabase
      .from("student_parents")
      .update({ is_primary_contact: !current })
      .eq("parent_id", parentId)
      .eq("student_id", studentId);

    loadData();
  };

  // Filtered students for link modal
  const filteredStudents = students.filter((s) => {
    const name = `${s.first_name} ${s.last_name}`.toLowerCase();
    const adm = s.admission_number.toLowerCase();
    const query = studentSearch.toLowerCase();
    return name.includes(query) || adm.includes(query);
  });

  // Students already linked to this parent
  const currentParent = parents.find((p) => p.id === linkModal.parentId);
  const linkedStudentIds = new Set(
    currentParent?.children.map((c) => c.student_id) || []
  );
  const availableStudents = filteredStudents.filter(
    (s) => !linkedStudentIds.has(s.id)
  );

  const totalLinks = parents.reduce((sum, p) => sum + p.children.length, 0);
  const parentsWithLinks = parents.filter((p) => p.children.length > 0).length;

  if (loading) return <Loading size="lg" text="Loading parents..." />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Parents</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {parents.length} parent{parents.length !== 1 ? "s" : ""} ·{" "}
            {totalLinks} link{totalLinks !== 1 ? "s" : ""} ·{" "}
            {parentsWithLinks} parent{parentsWithLinks !== 1 ? "s" : ""} with
            children
          </p>
        </div>
        <Button onClick={handleOpenAddModal}>
          <UserPlus className="h-4 w-4" />
          Add Parent
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4 text-center">
            <Users className="mx-auto h-6 w-6 text-zinc-400" />
            <p className="mt-1 text-2xl font-bold">{parents.length}</p>
            <p className="text-xs text-zinc-500">Total Parents</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Link2 className="mx-auto h-6 w-6 text-emerald-500" />
            <p className="mt-1 text-2xl font-bold text-emerald-600">
              {totalLinks}
            </p>
            <p className="text-xs text-zinc-500">Student Links</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <UserCheck className="mx-auto h-6 w-6 text-blue-500" />
            <p className="mt-1 text-2xl font-bold text-blue-600">
              {parentsWithLinks}
            </p>
            <p className="text-xs text-zinc-500">Active Parents</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
        <Input
          placeholder="Search parents by name or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Parents List */}
      {filteredParents.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Users className="mx-auto h-16 w-16 text-zinc-200 dark:text-zinc-700" />
            <h3 className="mt-4 text-lg font-semibold">No parents found</h3>
            <p className="mt-2 text-sm text-zinc-500 max-w-sm mx-auto">
              {parents.length === 0
                ? "Add parents to the system and link them to students so they can track their children&apos;s progress."
                : "Try adjusting your search."}
            </p>
            {parents.length === 0 && (
              <Button onClick={handleOpenAddModal} className="mt-4">
                <UserPlus className="h-4 w-4" />
                Add Parent
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredParents.map((parent) => (
            <Card key={parent.id} className="overflow-hidden">
              <CardContent className="p-0">
                {/* Parent header */}
                <div className="flex items-center justify-between bg-zinc-50 px-5 py-4 dark:bg-zinc-800/50">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                      {getInitials(parent.first_name, parent.last_name)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold truncate">
                        {parent.first_name} {parent.last_name}
                      </p>
                      <p className="text-xs text-zinc-500 truncate">
                        {parent.phone || "No contact"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={parent.is_active ? "success" : "warning"}>
                      {parent.is_active ? "Active" : "Inactive"}
                    </Badge>
                    <button
                      onClick={() => handleOpenEdit(parent)}
                      className="rounded-md p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300 transition-colors"
                      title="Edit parent"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleToggleActive(parent)}
                      className={`rounded-md p-2 transition-colors ${
                        parent.is_active
                          ? "text-emerald-500 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
                          : "text-zinc-300 hover:bg-emerald-50 hover:text-emerald-500 dark:hover:bg-emerald-900/20 dark:text-zinc-600"
                      }`}
                      title={parent.is_active ? "Deactivate parent" : "Activate parent"}
                    >
                      <Power className="h-4 w-4" />
                    </button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        handleOpenLinkModal(
                          parent.id,
                          `${parent.first_name} ${parent.last_name}`
                        )
                      }
                    >
                      <UserPlus className="h-4 w-4" />
                      <span className="hidden sm:inline ml-1">Link Child</span>
                    </Button>
                  </div>
                </div>

                {/* Linked children */}
                {parent.children.length === 0 ? (
                  <div className="px-5 py-6 text-center text-sm text-zinc-500">
                    No children linked yet. Click &quot;Link Child&quot; to add one.
                  </div>
                ) : (
                  <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {parent.children.map((child) => (
                      <div
                        key={child.id}
                        className="flex items-center gap-4 px-5 py-3 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/30"
                      >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                          {getInitials(
                            child.student?.first_name || "",
                            child.student?.last_name || ""
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {child.student?.first_name}{" "}
                            {child.student?.last_name}
                          </p>
                          <p className="text-xs text-zinc-500">
                            {child.student?.admission_number}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {/* Relationship selector */}
                          <select
                            value={child.relationship}
                            onChange={(e) =>
                              handleUpdateRelationship(
                                parent.id,
                                child.student_id,
                                e.target.value
                              )
                            }
                            className="rounded-md border border-zinc-200 bg-white px-2 py-1 text-xs dark:border-zinc-700 dark:bg-zinc-800"
                          >
                            <option value="father">Father</option>
                            <option value="mother">Mother</option>
                            <option value="guardian">Guardian</option>
                            <option value="other">Other</option>
                          </select>

                          {/* Primary contact toggle */}
                          <button
                            onClick={() =>
                              handleTogglePrimary(
                                parent.id,
                                child.student_id,
                                child.is_primary_contact
                              )
                            }
                            className={`rounded-md p-1.5 transition-colors ${
                              child.is_primary_contact
                                ? "bg-amber-100 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400"
                                : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                            }`}
                            title={
                              child.is_primary_contact
                                ? "Primary contact"
                                : "Set as primary contact"
                            }
                          >
                            <Star
                              className={`h-4 w-4 ${
                                child.is_primary_contact ? "fill-current" : ""
                              }`}
                            />
                          </button>

                          {/* Unlink */}
                          <button
                            onClick={() =>
                              handleUnlink(parent.id, child.student_id)
                            }
                            className="rounded-md p-1.5 text-zinc-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400 transition-colors"
                            title="Unlink student"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Parent Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Add Parent / Guardian</CardTitle>
              <button
                onClick={() => setShowAddModal(false)}
                className="rounded-lg p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
              >
                <X className="h-5 w-5" />
              </button>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddParent} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    First Name
                  </label>
                  <Input
                    required
                    value={addForm.first_name}
                    onChange={(e) =>
                      setAddForm({ ...addForm, first_name: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Last Name
                  </label>
                  <Input
                    required
                    value={addForm.last_name}
                    onChange={(e) =>
                      setAddForm({ ...addForm, last_name: e.target.value })
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
                    value={addForm.phone}
                    onChange={(e) =>
                      setAddForm({ ...addForm, phone: e.target.value })
                    }
                  />
                </div>
                {addError && (
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {addError}
                  </p>
                )}
                <div className="flex gap-3 pt-2">
                  <Button type="submit" disabled={addSaving}>
                    {addSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      <>
                        <UserPlus className="h-4 w-4" />
                        Add Parent
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowAddModal(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Edit Parent Modal */}
      {editingParent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>
                Edit {editingParent.first_name} {editingParent.last_name}
              </CardTitle>
              <button
                onClick={() => setEditingParent(null)}
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
                      checked={editingParent.is_active}
                      onChange={() => {
                        setEditingParent({
                          ...editingParent,
                          is_active: !editingParent.is_active,
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
                    onClick={() => setEditingParent(null)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Link Modal */}
      {linkModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-lg">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>
                Link Child to {linkModal.parentName}
              </CardTitle>
              <button
                onClick={() => setLinkModal({ open: false, parentId: "", parentName: "" })}
                className="rounded-lg p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
              >
                <X className="h-5 w-5" />
              </button>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Student search */}
              <div>
                <label className="block text-xs font-medium mb-1">
                  Search Student
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                  <Input
                    placeholder="Search by name or admission..."
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              {/* Student select */}
              <div>
                <label className="block text-xs font-medium mb-1">
                  Select Student
                </label>
                <div className="max-h-40 overflow-y-auto rounded-lg border border-zinc-200 dark:border-zinc-700">
                  {availableStudents.length === 0 ? (
                    <div className="p-3 text-center text-xs text-zinc-500">
                      {students.length === 0
                        ? "No students available. Enroll students first."
                        : "All students are already linked to this parent."}
                    </div>
                  ) : (
                    availableStudents.map((student) => (
                      <button
                        key={student.id}
                        onClick={() => setSelectedStudentId(student.id)}
                        className={`flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800 ${
                          selectedStudentId === student.id
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300"
                            : ""
                        }`}
                      >
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-100 text-[10px] font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                          {getInitials(student.first_name, student.last_name)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {student.first_name} {student.last_name}
                          </p>
                          <p className="text-xs text-zinc-500">
                            {student.admission_number}
                            {(student as any).classes?.name &&
                              ` · ${(student as any).classes.name}`}
                          </p>
                        </div>
                        {selectedStudentId === student.id && (
                          <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                        )}
                      </button>
                    ))
                  )}
                </div>
              </div>

              {/* Relationship */}
              <div>
                <label className="block text-xs font-medium mb-1">
                  Relationship
                </label>
                <Select
                  value={selectedRelationship}
                  onChange={(e) => setSelectedRelationship(e.target.value)}
                  options={[
                    { value: "father", label: "Father" },
                    { value: "mother", label: "Mother" },
                    { value: "guardian", label: "Guardian" },
                    { value: "other", label: "Other" },
                  ]}
                />
              </div>

              {/* Primary contact */}
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedPrimary}
                  onChange={(e) => setSelectedPrimary(e.target.checked)}
                  className="h-4 w-4 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-sm font-medium">
                  Primary contact for this student
                </span>
              </label>

              {linkError && (
                <p className="text-sm text-red-600 dark:text-red-400">
                  {linkError}
                </p>
              )}

              <div className="flex gap-3 pt-2">
                <Button onClick={handleLinkStudent} disabled={saving || !selectedStudentId}>
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Linking...
                    </>
                  ) : (
                    <>
                      <Link2 className="h-4 w-4" />
                      Link Student
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() =>
                    setLinkModal({ open: false, parentId: "", parentName: "" })
                  }
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
