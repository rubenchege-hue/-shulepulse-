"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loading } from "@/components/ui/loading";
import { Plus, Search, ChevronRight } from "lucide-react";
import { getInitials } from "@/lib/utils";
import type { StudentWithClass } from "@/lib/types/database";

export default function AdminStudentsPage() {
  const [students, setStudents] = useState<StudentWithClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const supabase = createClient();

  useEffect(() => {
    async function loadStudents() {
      const { data } = await supabase
        .from("students")
        .select("*, classes(name, section)")
        .order("first_name");
      if (data) setStudents(data as StudentWithClass[]);
      setLoading(false);
    }
    loadStudents();
  }, [supabase]);

  const filtered = students.filter(
    (s) =>
      s.first_name.toLowerCase().includes(search.toLowerCase()) ||
      s.last_name.toLowerCase().includes(search.toLowerCase()) ||
      s.admission_number.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <Loading size="lg" text="Loading students..." />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Students</h1>
          <p className="text-sm text-zinc-500">
            {students.length} students enrolled
          </p>
        </div>
        <Link href="/admin/students/new">
          <Button>
            <Plus className="h-4 w-4" />
            Add Student
          </Button>
        </Link>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
        <Input
          placeholder="Search by name or admission number..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {filtered.map((student) => (
              <Link
                key={student.id}
                href={`/admin/students/${student.id}`}
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
                    {(student as any).classes?.name &&
                      ` · ${(student as any).classes.name}${(student as any).classes.section ? ` - ${(student as any).classes.section}` : ""}`}
                  </p>
                </div>
                <Badge
                  variant={
                    student.status === "active"
                      ? "success"
                      : student.status === "graduated"
                        ? "primary"
                        : "warning"
                  }
                >
                  {student.status}
                </Badge>
                <ChevronRight className="h-5 w-5 text-zinc-400" />
              </Link>
            ))}
            {filtered.length === 0 && (
              <div className="px-6 py-12 text-center text-sm text-zinc-500">
                No students found
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
