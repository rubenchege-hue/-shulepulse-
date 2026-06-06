"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useDevAuth } from "@/lib/dev-auth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loading } from "@/components/ui/loading";
import { Input } from "@/components/ui/input";
import {
  Users,
  BookOpen,
  School,
  Trophy,
  FileText,
  Search,
  ChevronRight,
  UserPlus,
} from "lucide-react";
import { getInitials } from "@/lib/utils";
import type { Student, Class } from "@/lib/types/database";

interface ChildWithClass extends Student {
  classes?: Class;
}

export default function ParentChildrenPage() {
  const { user: devUser } = useDevAuth();
  const [children, setChildren] = useState<ChildWithClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function loadChildren() {
      const supabase = createClient();
      const parentId = devUser?.id ?? '00000000-0000-0000-0000-000000000001';

      const { data: links } = await supabase
        .from("student_parents")
        .select("student_id")
        .eq("parent_id", parentId);

      if (!links || links.length === 0) {
        setLoading(false);
        return;
      }

      const studentIds = links.map((l) => l.student_id);
      const { data: students } = await supabase
        .from("students")
        .select("*, classes(*), student_parents!inner(relationship, is_primary_contact)")
        .in("id", studentIds)
        .order("first_name");

      if (students) setChildren(students as ChildWithClass[]);
      setLoading(false);
    }
    loadChildren();
  }, [devUser]);

  const filtered = children.filter((child) => {
    const name =
      `${child.first_name} ${child.last_name}`.toLowerCase();
    const admission = (child.admission_number || "").toLowerCase();
    const query = search.toLowerCase();
    return name.includes(query) || admission.includes(query);
  });

  if (loading) return <Loading size="lg" text="Loading your children..." />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Children</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {children.length === 1
            ? "1 child linked to your account"
            : `${children.length} children linked to your account`}
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
        <Input
          placeholder="Search by name or admission number..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Children List */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            {children.length === 0 ? (
              <>
                <UserPlus className="mx-auto h-16 w-16 text-zinc-200 dark:text-zinc-700" />
                <h3 className="mt-4 text-lg font-semibold">
                  No children linked
                </h3>
                <p className="mt-2 text-sm text-zinc-500 max-w-sm mx-auto">
                  Your account hasn&apos;t been linked to any students yet.
                  Please contact your school administrator to get your children
                  added.
                </p>
              </>
            ) : (
              <>
                <Search className="mx-auto h-16 w-16 text-zinc-200 dark:text-zinc-700" />
                <h3 className="mt-4 text-lg font-semibold">
                  No results found
                </h3>
                <p className="mt-2 text-sm text-zinc-500">
                  Try a different search term.
                </p>
              </>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filtered.map((child) => {
            const isPrimary = (child as any).student_parents?.is_primary_contact;
            const relationship = (child as any).student_parents?.relationship;

            return (
              <Card
                key={child.id}
                className="transition-all hover:shadow-md hover:border-emerald-200 dark:hover:border-emerald-800"
              >
                <CardContent className="p-0">
                  {/* Main row — clickable to child overview */}
                  <Link
                    href={`/parent/children/${child.id}`}
                    className="block p-5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-lg font-bold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                          {getInitials(child.first_name, child.last_name)}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-semibold truncate">
                              {child.first_name} {child.last_name}
                            </h3>
                            {isPrimary && (
                              <Badge variant="primary" className="shrink-0 text-[10px]">
                                Primary
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-zinc-500">
                            {child.classes?.name || "No class assigned"}
                            {child.admission_number &&
                              ` · ${child.admission_number}`}
                            {relationship && ` · ${relationship}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <Badge
                          variant={
                            child.status === "active" ? "success" : "warning"
                          }
                          className="hidden sm:inline-flex"
                        >
                          {child.status}
                        </Badge>
                        <ChevronRight className="h-5 w-5 text-zinc-400" />
                      </div>
                    </div>
                  </Link>

                  {/* Quick links */}
                  <div className="border-t border-zinc-100 px-5 py-3 dark:border-zinc-800">
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/parent/children/${child.id}/academic`}
                        className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 px-2.5 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800 transition-colors"
                      >
                        <BookOpen className="h-3.5 w-3.5 text-blue-500" />
                        Academic
                      </Link>
                      <Link
                        href={`/parent/children/${child.id}/cbc`}
                        className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 px-2.5 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800 transition-colors"
                      >
                        <School className="h-3.5 w-3.5 text-emerald-500" />
                        CBC
                      </Link>
                      <Link
                        href={`/parent/children/${child.id}/cocurricular`}
                        className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 px-2.5 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800 transition-colors"
                      >
                        <Trophy className="h-3.5 w-3.5 text-amber-500" />
                        Co-Curricular
                      </Link>
                      <Link
                        href={`/parent/children/${child.id}/reports`}
                        className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 px-2.5 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800 transition-colors"
                      >
                        <FileText className="h-3.5 w-3.5 text-purple-500" />
                        Reports
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
