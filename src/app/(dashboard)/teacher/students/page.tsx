"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loading } from "@/components/ui/loading";
import { Search, ChevronRight, GraduationCap } from "lucide-react";
import { getInitials } from "@/lib/utils";
import { useProfile } from "@/lib/use-profile";
import type { Student, Class } from "@/lib/types/database";

export default function TeacherStudentsPage() {
  const [students, setStudents] = useState<(Student & { classes?: Class })[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const supabase = createClient();
  const { userId } = useProfile();

  useEffect(() => {
    if (!userId) return;

    async function load() {
      const { data: myClasses } = await supabase
        .from("classes")
        .select("id")
        .eq("teacher_id", userId);
      const classIds = myClasses?.map((c) => c.id) || [];

      // Load assigned classes for the filter dropdown
      const { data: classesData } = await supabase
        .from("classes")
        .select("*")
        .in("id", classIds)
        .order("name");
      if (classesData) setClasses(classesData);

      // Load students in those classes
      if (classIds.length > 0) {
        const { data: studentsData } = await supabase
          .from("students")
          .select("*, classes(*)")
          .in("class_id", classIds)
          .eq("status", "active")
          .order("first_name");
        if (studentsData) setStudents(studentsData as any);
      }

      setLoading(false);
    }
    load();
  }, [userId, supabase]);

  const filtered = students.filter((s) => {
    const matchesSearch =
      s.first_name.toLowerCase().includes(search.toLowerCase()) ||
      s.last_name.toLowerCase().includes(search.toLowerCase());
    const matchesClass = !classFilter || s.class_id === classFilter;
    return matchesSearch && matchesClass;
  });

  if (loading) return <Loading size="lg" text="Loading students..." />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Students</h1>
        <p className="text-sm text-zinc-500">{students.length} active students</p>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <Input
            placeholder="Search students..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <select
          value={classFilter}
          onChange={(e) => setClassFilter(e.target.value)}
          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
        >
          <option value="">All Classes</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}{c.section ? ` - ${c.section}` : ""}
            </option>
          ))}
        </select>
      </div>

      <Card>
        <CardContent className="p-0 divide-y divide-zinc-200 dark:divide-zinc-800">
          {filtered.map((student) => (
            <Link
              key={student.id}
              href={`/teacher/students/${student.id}`}
              className="flex items-center gap-4 px-6 py-4 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-sm font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                {getInitials(student.first_name, student.last_name)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">
                  {student.first_name} {student.last_name}
                </p>
                <p className="text-sm text-zinc-500">
                  {student.admission_number}
                  {(student as any).classes?.name && ` · ${(student as any).classes.name}`}
                </p>
              </div>
              <ChevronRight className="h-5 w-5 text-zinc-400" />
            </Link>
          ))}
          {filtered.length === 0 && (
            <div className="px-6 py-12 text-center text-sm text-zinc-500">
              No students found
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
