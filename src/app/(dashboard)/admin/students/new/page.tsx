"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useProfile } from "@/lib/use-profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { Class } from "@/lib/types/database";

export default function NewStudentPage() {
  const router = useRouter();
  const supabase = createClient();
  const { schoolId } = useProfile();
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    admission_number: "",
    date_of_birth: "",
    gender: "",
    class_id: "",
  });

  useEffect(() => {
    supabase
      .from("classes")
      .select("*")
      .order("name")
      .then(({ data }) => {
        if (data) setClasses(data);
      });
  }, [supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!schoolId) {
      setError("Could not determine your school. Please log in again.");
      setLoading(false);
      return;
    }

    const { error: err } = await supabase.from("students").insert({
      first_name: form.first_name,
      last_name: form.last_name,
      admission_number: form.admission_number,
      date_of_birth: form.date_of_birth || null,
      gender: form.gender || null,
      class_id: form.class_id || null,
      school_id: schoolId,
      status: "active",
    });

    if (err) {
      setError(err.message);
      setLoading(false);
      return;
    }

    router.push("/admin/students");
    router.refresh();
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-4">
        <Link href="/admin/students">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Enroll Student</h1>
          <p className="text-sm text-zinc-500">Add a new student to the school</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Student Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">First Name</label>
                <Input
                  required
                  value={form.first_name}
                  onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Last Name</label>
                <Input
                  required
                  value={form.last_name}
                  onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Admission Number</label>
              <Input
                required
                placeholder="e.g., 2025/001"
                value={form.admission_number}
                onChange={(e) => setForm({ ...form, admission_number: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Date of Birth</label>
                <Input
                  type="date"
                  value={form.date_of_birth}
                  onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Gender</label>
                <Select
                  value={form.gender}
                  onChange={(e) => setForm({ ...form, gender: e.target.value })}
                  options={[
                    { value: "male", label: "Male" },
                    { value: "female", label: "Female" },
                  ]}
                  placeholder="Select gender"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Class</label>
              <Select
                value={form.class_id}
                onChange={(e) => setForm({ ...form, class_id: e.target.value })}
                options={classes.map((c) => ({
                  value: c.id,
                  label: `${c.name}${c.section ? ` - ${c.section}` : ""}`,
                }))}
                placeholder="Select class"
              />
            </div>
            {error && (
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            )}
            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Enrolling...
                  </>
                ) : (
                  "Enroll Student"
                )}
              </Button>
              <Link href="/admin/students">
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
