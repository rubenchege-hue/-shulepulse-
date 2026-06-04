"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loading } from "@/components/ui/loading";
import { Plus, BookOpen } from "lucide-react";

interface SubjectWithStrands {
  id: string;
  name: string;
  code: string | null;
  category: string;
  curriculum_type: string;
  is_compulsory: boolean;
  strands: { id: string; name: string }[];
}

export default function AdminSubjectsPage() {
  const [subjects, setSubjects] = useState<SubjectWithStrands[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newSubject, setNewSubject] = useState({
    name: "",
    code: "",
    category: "academic",
    curriculum_type: "both",
  });
  const supabase = createClient();

  async function loadSubjects() {
    const { data } = await supabase
      .from("subjects")
      .select("*, cbc_strands(id, name)")
      .order("name");
    if (data) setSubjects(data as SubjectWithStrands[]);
    setLoading(false);
  }

  useEffect(() => {
    loadSubjects();
  }, [supabase]);

  const handleCreate = async () => {
    if (!newSubject.name) return;
    const { data: profile } = await supabase.from("profiles").select("school_id").single();
    await supabase.from("subjects").insert({
      name: newSubject.name,
      code: newSubject.code || null,
      category: newSubject.category,
      curriculum_type: newSubject.curriculum_type,
      school_id: profile?.school_id,
    });
    setNewSubject({ name: "", code: "", category: "academic", curriculum_type: "both" });
    setShowForm(false);
    loadSubjects();
  };

  if (loading) return <Loading size="lg" text="Loading subjects..." />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Subjects & Strands</h1>
          <p className="text-sm text-zinc-500">{subjects.length} subjects</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4" />
          Add Subject
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap items-end gap-3">
              <div className="flex-1 min-w-[150px]">
                <label className="block text-xs font-medium mb-1">Subject Name</label>
                <Input
                  placeholder="e.g., Mathematics"
                  value={newSubject.name}
                  onChange={(e) => setNewSubject({ ...newSubject, name: e.target.value })}
                />
              </div>
              <div className="w-[100px]">
                <label className="block text-xs font-medium mb-1">Code</label>
                <Input
                  placeholder="MATH"
                  value={newSubject.code}
                  onChange={(e) => setNewSubject({ ...newSubject, code: e.target.value })}
                />
              </div>
              <div className="w-[130px]">
                <label className="block text-xs font-medium mb-1">Category</label>
                <Select
                  value={newSubject.category}
                  onChange={(e) => setNewSubject({ ...newSubject, category: e.target.value })}
                  options={[
                    { value: "academic", label: "Academic" },
                    { value: "co-curricular", label: "Co-Curricular" },
                  ]}
                />
              </div>
              <div className="w-[120px]">
                <label className="block text-xs font-medium mb-1">Curriculum</label>
                <Select
                  value={newSubject.curriculum_type}
                  onChange={(e) => setNewSubject({ ...newSubject, curriculum_type: e.target.value })}
                  options={[
                    { value: "cbc", label: "CBC" },
                    { value: "8-4-4", label: "8-4-4" },
                    { value: "both", label: "Both" },
                  ]}
                />
              </div>
              <Button onClick={handleCreate} size="sm">Create</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {subjects.map((subject) => (
          <Card key={subject.id}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                    <BookOpen className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold">{subject.name}</p>
                    <p className="text-xs text-zinc-500">
                      {subject.code && `${subject.code} · `}
                      {subject.category}
                    </p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Badge variant={subject.curriculum_type === "cbc" ? "primary" : subject.curriculum_type === "8-4-4" ? "secondary" : "purple"}>
                    {subject.curriculum_type}
                  </Badge>
                </div>
              </div>
              {(subject as any).cbc_strands?.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {(subject as any).cbc_strands.map((strand: any) => (
                    <Badge key={strand.id} variant="default" className="text-xs">
                      {strand.name}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
