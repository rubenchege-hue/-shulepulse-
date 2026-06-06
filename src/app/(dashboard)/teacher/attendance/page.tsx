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
  Save,
  Loader2,
  CalendarDays,
  CheckCircle2,
  UserCheck,
  UserX,
  Clock,
  HelpCircle,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import type { Class } from "@/lib/types/database";

type AttendanceStatus = "present" | "absent" | "late" | "excused";

const statusOptions: { value: AttendanceStatus; label: string; icon: typeof UserCheck; color: string; activeColor: string }[] = [
  {
    value: "present",
    label: "Present",
    icon: UserCheck,
    color: "text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800",
    activeColor: "bg-emerald-500 text-white ring-2 ring-emerald-300",
  },
  {
    value: "absent",
    label: "Absent",
    icon: UserX,
    color: "text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800",
    activeColor: "bg-red-500 text-white ring-2 ring-red-300",
  },
  {
    value: "late",
    label: "Late",
    icon: Clock,
    color: "text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800",
    activeColor: "bg-amber-500 text-white ring-2 ring-amber-300",
  },
  {
    value: "excused",
    label: "Excused",
    icon: HelpCircle,
    color: "text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800",
    activeColor: "bg-blue-500 text-white ring-2 ring-blue-300",
  },
];

const statusColors: Record<AttendanceStatus, "success" | "danger" | "warning" | "primary"> = {
  present: "success",
  absent: "danger",
  late: "warning",
  excused: "primary",
};

const statusLabels: Record<AttendanceStatus, string> = {
  present: "Present",
  absent: "Absent",
  late: "Late",
  excused: "Excused",
};

export default function TeacherAttendancePage() {
  const supabase = createClient();
  const [classes, setClasses] = useState<Class[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [selectedClass, setSelectedClass] = useState("");
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  // attendance[studentId] = status
  const [attendance, setAttendance] = useState<Record<string, AttendanceStatus>>({});
  const [remarks, setRemarks] = useState<Record<string, string>>({});
  const [savedRecords, setSavedRecords] = useState<Set<string>>(new Set());
  const [summary, setSummary] = useState<Record<AttendanceStatus, number> | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const { data: profile } = await supabase
        .from("profiles")
        .select("id, school_id")
        .single();

      if (!profile?.school_id || !profile?.id) {
        setLoading(false);
        return;
      }

      // Only show classes assigned to this teacher
      const { data: classesData } = await supabase
        .from("classes")
        .select("*")
        .eq("school_id", profile.school_id)
        .eq("teacher_id", profile.id)
        .order("name");

      if (classesData) setClasses(classesData);
      setLoading(false);
    }
    load();
  }, [supabase]);

  // Load students when class changes
  useEffect(() => {
    if (!selectedClass) {
      setStudents([]);
      setAttendance({});
      setRemarks({});
      setSavedRecords(new Set());
      setSummary(null);
      return;
    }

    async function loadStudents() {
      const { data } = await supabase
        .from("students")
        .select("id, first_name, last_name, admission_number")
        .eq("class_id", selectedClass)
        .eq("status", "active")
        .order("first_name");

      if (data) {
        setStudents(data);
        // Reset attendance state
        setAttendance({});
        setRemarks({});
        setSavedRecords(new Set());
        setSummary(null);
        setError(null);
      }
    }
    loadStudents();
  }, [selectedClass, supabase]);

  // Load existing attendance for selected date + class
  useEffect(() => {
    if (!selectedClass || !selectedDate) return;

    async function loadAttendance() {
      const { data } = await supabase
        .from("attendance")
        .select("student_id, status, remarks")
        .eq("class_id", selectedClass)
        .eq("date", selectedDate);

      if (data) {
        const newAttendance: Record<string, AttendanceStatus> = {};
        const newRemarks: Record<string, string> = {};
        const saved = new Set<string>();

        data.forEach((r) => {
          newAttendance[r.student_id] = r.status as AttendanceStatus;
          if (r.remarks) newRemarks[r.student_id] = r.remarks;
          saved.add(r.student_id);
        });

        setAttendance(newAttendance);
        setRemarks(newRemarks);
        setSavedRecords(saved);

        // Compute summary
        if (data.length > 0) {
          const counts: Record<string, number> = { present: 0, absent: 0, late: 0, excused: 0 };
          data.forEach((r) => {
            counts[r.status] = (counts[r.status] || 0) + 1;
          });
          setSummary(counts as Record<AttendanceStatus, number>);
        } else {
          setSummary(null);
        }
        setError(null);
      }
    }
    loadAttendance();
  }, [selectedClass, selectedDate, supabase]);

  const handleSaveAll = async () => {
    if (!selectedClass || !selectedDate) {
      setError("Please select a class and date.");
      return;
    }

    if (Object.keys(attendance).length === 0) {
      setError("No attendance records to save. Mark at least one student.");
      return;
    }

    setSaving(true);
    setError(null);

    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .single();

    const saved = new Set<string>();

    for (const student of students) {
      const status = attendance[student.id];
      if (!status) continue;

      const { error: err } = await supabase.from("attendance").upsert(
        {
          student_id: student.id,
          class_id: selectedClass,
          date: selectedDate,
          status,
          remarks: remarks[student.id] || null,
          marked_by: profile?.id,
        },
        {
          onConflict: "student_id, date",
        }
      );

      if (!err) saved.add(student.id);
    }

    setSavedRecords(saved);

    // Update summary
    const counts: Record<string, number> = { present: 0, absent: 0, late: 0, excused: 0 };
    Object.values(attendance).forEach((s) => {
      counts[s] = (counts[s] || 0) + 1;
    });
    setSummary(counts as Record<AttendanceStatus, number>);

    setSaving(false);
  };

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setAttendance((prev) => ({ ...prev, [studentId]: status }));
    setSavedRecords((prev) => {
      const next = new Set(prev);
      next.delete(studentId);
      return next;
    });
    setError(null);
  };

  const handleRemarkChange = (studentId: string, value: string) => {
    setRemarks((prev) => ({ ...prev, [studentId]: value }));
    setSavedRecords((prev) => {
      const next = new Set(prev);
      next.delete(studentId);
      return next;
    });
  };

  // Quick-fill all unmarked students with "present"
  const handleMarkAllPresent = () => {
    const newAttendance = { ...attendance };
    students.forEach((s) => {
      if (!newAttendance[s.id]) {
        newAttendance[s.id] = "present";
      }
    });
    setAttendance(newAttendance);
    setError(null);
  };

  if (loading) return <Loading size="lg" text="Loading attendance module..." />;

  const totalMarked = Object.keys(attendance).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Daily Attendance
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Record student attendance by class and date
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1">
                Class
              </label>
              <Select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                options={classes.map((c) => ({
                  value: c.id,
                  label: `${c.name}${c.section ? ` - ${c.section}` : ""}`,
                }))}
                placeholder="Select class"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Date</label>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>
            <div className="flex items-end gap-2">
              <Button
                onClick={handleMarkAllPresent}
                variant="outline"
                size="sm"
                disabled={!selectedClass}
                title="Mark all unmarked students as Present"
              >
                <UserCheck className="h-4 w-4" />
                Mark All Present
              </Button>
              <Button
                onClick={handleSaveAll}
                disabled={saving || !selectedClass || totalMarked === 0}
                size="sm"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Save Attendance
              </Button>
            </div>
          </div>

          {error && (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400">
              {error}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Summary */}
      {summary && (
        <div className="grid grid-cols-4 gap-3">
          {(
            [
              { status: "present" as const, label: "Present", color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20" },
              { status: "absent" as const, label: "Absent", color: "text-red-600 bg-red-50 dark:bg-red-900/20" },
              { status: "late" as const, label: "Late", color: "text-amber-600 bg-amber-50 dark:bg-amber-900/20" },
              { status: "excused" as const, label: "Excused", color: "text-blue-600 bg-blue-50 dark:bg-blue-900/20" },
            ] as const
          ).map(({ status, label, color }) => (
            <Card key={status}>
              <CardContent className={`p-4 text-center ${color}`}>
                <p className="text-2xl font-bold">{summary[status] || 0}</p>
                <p className="text-xs font-medium">{label}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Student List */}
      {selectedClass ? (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-zinc-400" />
              {formatDate(selectedDate)}
              <span className="text-sm font-normal text-zinc-500 ml-2">
                — {students.length} students · {totalMarked} marked
              </span>
            </CardTitle>
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              {savedRecords.size > 0 && (
                <span className="flex items-center gap-1 text-emerald-600">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {savedRecords.size} saved
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {students.length === 0 ? (
              <div className="py-8 text-center text-sm text-zinc-500">
                No active students in this class
              </div>
            ) : (
              students.map((student) => {
                const currentStatus = attendance[student.id];
                const isSaved = savedRecords.has(student.id);

                return (
                  <div
                    key={student.id}
                    className={`rounded-lg border p-3 transition-all ${
                      currentStatus
                        ? currentStatus === "present"
                          ? "border-emerald-200 bg-emerald-50/30 dark:border-emerald-800 dark:bg-emerald-900/10"
                          : currentStatus === "absent"
                            ? "border-red-200 bg-red-50/30 dark:border-red-800 dark:bg-red-900/10"
                            : currentStatus === "late"
                              ? "border-amber-200 bg-amber-50/30 dark:border-amber-800 dark:bg-amber-900/10"
                              : "border-blue-200 bg-blue-50/30 dark:border-blue-800 dark:bg-blue-900/10"
                        : "border-zinc-200 dark:border-zinc-700"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      {/* Student info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">
                          {student.first_name} {student.last_name}
                        </p>
                        <p className="text-xs text-zinc-500">
                          {student.admission_number}
                        </p>
                      </div>

                      {/* Status buttons */}
                      <div className="flex gap-1.5">
                        {statusOptions.map((opt) => {
                          const isActive = currentStatus === opt.value;
                          const Icon = opt.icon;
                          return (
                            <button
                              key={opt.value}
                              onClick={() =>
                                handleStatusChange(student.id, opt.value)
                              }
                              className={`flex h-9 w-9 items-center justify-center rounded-lg text-xs font-bold transition-all ${
                                isActive ? opt.activeColor : opt.color
                              }`}
                              title={opt.label}
                            >
                              <Icon className="h-4 w-4" />
                            </button>
                          );
                        })}
                      </div>

                      {/* Saved indicator */}
                      {isSaved && (
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                      )}
                    </div>

                    {/* Remarks (shown when absent/late/excused) */}
                    {currentStatus && currentStatus !== "present" && (
                      <div className="mt-2 pl-0">
                        <input
                          type="text"
                          placeholder="Reason (optional)..."
                          value={remarks[student.id] || ""}
                          onChange={(e) =>
                            handleRemarkChange(student.id, e.target.value)
                          }
                          className="w-full rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-xs placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:placeholder:text-zinc-500"
                        />
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <CalendarDays className="mx-auto h-12 w-12 text-zinc-300 dark:text-zinc-600" />
            <p className="mt-4 text-sm text-zinc-500">
              Select a class and date to begin recording attendance
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
