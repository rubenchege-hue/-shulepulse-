"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loading } from "@/components/ui/loading";
import { BookOpen, School, Trophy, FileText, ArrowLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getInitials } from "@/lib/utils";
import type { Student, Class } from "@/lib/types/database";

export default function ChildOverviewPage() {
  const { id } = useParams<{ id: string }>();
  const [child, setChild] = useState<(Student & { classes?: Class }) | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("students")
        .select("*, classes(*)")
        .eq("id", id)
        .single();
      if (data) setChild(data as any);
      setLoading(false);
    }
    load();
  }, [supabase, id]);

  if (loading) return <Loading size="lg" text="Loading student info..." />;
  if (!child) return <div className="text-center py-12 text-zinc-500">Student not found</div>;

  const sections = [
    { href: `/parent/children/${id}/academic`, icon: BookOpen, label: "Academic Progress", desc: "Exam scores, grades, and term performance", color: "bg-blue-100 text-blue-600 dark:bg-blue-900/30" },
    { href: `/parent/children/${id}/cbc`, icon: School, label: "CBC Competencies", desc: "Competency ratings across all strands", color: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30" },
    { href: `/parent/children/${id}/cocurricular`, icon: Trophy, label: "Co-Curricular Activities", desc: "Sports, clubs, music, and other activities", color: "bg-amber-100 text-amber-600 dark:bg-amber-900/30" },
    { href: `/parent/children/${id}/reports`, icon: FileText, label: "Report Cards", desc: "Downloadable term reports", color: "bg-purple-100 text-purple-600 dark:bg-purple-900/30" },
  ];

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-4">
        <Link href="/parent">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-lg font-bold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
            {getInitials(child.first_name, child.last_name)}
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {child.first_name} {child.last_name}
            </h1>
            <p className="text-sm text-zinc-500">
              {child.classes?.name || "No class"} · {child.admission_number}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4">
        {sections.map((section) => (
          <Link key={section.href} href={section.href}>
            <Card className="transition-all hover:shadow-md hover:border-emerald-200 dark:hover:border-emerald-800">
              <CardContent className="p-5">
                <div className="flex items-center gap-4">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${section.color}`}>
                    <section.icon className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">{section.label}</h3>
                    <p className="text-sm text-zinc-500">{section.desc}</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-zinc-400" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
