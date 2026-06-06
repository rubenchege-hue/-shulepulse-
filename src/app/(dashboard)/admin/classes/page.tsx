"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useProfile } from "@/lib/use-profile";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loading } from "@/components/ui/loading";
import { Plus, GraduationCap, User } from "lucide-react";
import type { Class } from "@/lib/types/database";

export default function AdminClassesPage() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [studentCounts, setStudentCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newClass, setNewClass] = useState({ name: "", section: "", curriculum_type: "cbc", capacity: 45 });
  const supabase = createClient();
  const { schoolId } = useProfile();

  async function loadClasses() {
    // Fetch classes with their assigned teacher
    const { data } = await supabase
      .from("classes")
      .select("*, teacher:profiles!teacher_id(first_name, last_name)")
      .order("name");
    if (data) setClasses(data as any);

    // Get student counts per class
    const { data: students } = await supabase.from("students").select("class_id");
    if (students) {
      const counts: Record<string, number> = {};
      students.forEach((s) => {
        if (s.class_id) counts[s.class_id] = (counts[s.class_id] || 0) + 1;
      });
      setStudentCounts(counts);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadClasses();
  }, [supabase]);

  const handleCreate = async () => {
    if (!newClass.name) return;
    await supabase.from("classes").insert({
      name: newClass.name,
      section: newClass.section || null,
      curriculum_type: newClass.curriculum_type,
      capacity: newClass.capacity,
      school_id: schoolId,
    });
    setNewClass({ name: "", section: "", curriculum_type: "cbc", capacity: 45 });
    setShowForm(false);
    loadClasses();
  };

  if (loading) return <Loading size="lg" text="Loading classes..." />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Classes</h1>
          <p className="text-sm text-zinc-500">{classes.length} classes</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4" />
          Add Class
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap items-end gap-3">
              <div className="flex-1 min-w-[150px]">
                <label className="block text-xs font-medium mb-1">Class Name</label>
                <Input
                  placeholder="e.g., Grade 1, Form 2"
                  value={newClass.name}
                  onChange={(e) => setNewClass({ ...newClass, name: e.target.value })}
                />
              </div>
              <div className="w-[120px]">
                <label className="block text-xs font-medium mb-1">Section</label>
                <Input
                  placeholder="e.g., East"
                  value={newClass.section}
                  onChange={(e) => setNewClass({ ...newClass, section: e.target.value })}
                />
              </div>
              <div className="w-[130px]">
                <label className="block text-xs font-medium mb-1">Curriculum</label>
                <Select
                  value={newClass.curriculum_type}
                  onChange={(e) => setNewClass({ ...newClass, curriculum_type: e.target.value })}
                  options={[
                    { value: "cbc", label: "CBC" },
                    { value: "8-4-4", label: "8-4-4" },
                    { value: "both", label: "Both" },
                  ]}
                />
              </div>
              <div className="w-[100px]">
                <label className="block text-xs font-medium mb-1">Capacity</label>
                <Input
                  type="number"
                  value={newClass.capacity}
                  onChange={(e) => setNewClass({ ...newClass, capacity: parseInt(e.target.value) || 45 })}
                />
              </div>
              <Button onClick={handleCreate} size="sm">Create</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {classes.map((cls) => (
          <Card key={cls.id}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                    <GraduationCap className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold">
                      {cls.name}
                      {cls.section && <span className="text-zinc-500"> - {cls.section}</span>}
                    </p>
                    <p className="text-xs text-zinc-500">{cls.curriculum_type.toUpperCase()}</p>
                  </div>
                </div>
                <Badge variant={cls.curriculum_type === "cbc" ? "primary" : "secondary"}>
                  {cls.curriculum_type}
                </Badge>
              </div>
              {/* Assigned teacher */}
              {(cls as any).teacher && (
                <div className="mt-3 flex items-center gap-2 text-sm">
                  <User className="h-3.5 w-3.5 text-zinc-400" />
                  <span className="text-zinc-600 dark:text-zinc-400">
                    {(cls as any).teacher.first_name} {(cls as any).teacher.last_name}
                  </span>
                </div>
              )}
              <div className="mt-3 flex items-center justify-between text-sm">
                <span className="text-zinc-500">
                  {studentCounts[cls.id] || 0} / {cls.capacity} students
                </span>
                <div className="h-2 flex-1 mx-3 rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all"
                    style={{
                      width: `${Math.min(((studentCounts[cls.id] || 0) / cls.capacity) * 100, 100)}%`,
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
