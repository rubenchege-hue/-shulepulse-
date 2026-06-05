"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useProfile } from "@/lib/use-profile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loading } from "@/components/ui/loading";
import { Plus, Save, Loader2, CheckCircle2, Calendar } from "lucide-react";
import { formatDate } from "@/lib/utils";
import type { AcademicTerm } from "@/lib/types/database";

export default function AdminTermsPage() {
  const supabase = createClient();
  const { schoolId } = useProfile();
  const [terms, setTerms] = useState<AcademicTerm[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newTerm, setNewTerm] = useState({
    name: "Term 1",
    academic_year: new Date().getFullYear(),
    start_date: "",
    end_date: "",
  });

  async function loadTerms() {
    if (!schoolId) { setLoading(false); return; }

    const { data } = await supabase
      .from("academic_terms")
      .select("*")
      .eq("school_id", schoolId)
      .order("academic_year", { ascending: false })
      .order("name", { ascending: false });
    if (data) setTerms(data);
    setLoading(false);
  }

  useEffect(() => {
    loadTerms();
  }, [supabase]);

  const handleCreate = async () => {
    if (!newTerm.start_date || !newTerm.end_date) {
      setError("Start and end dates are required");
      return;
    }
    setSaving(true);
    setError(null);

    if (!schoolId) { setSaving(false); return; }

    const { error: err } = await supabase.from("academic_terms").insert({
      school_id: schoolId,
      name: newTerm.name,
      academic_year: newTerm.academic_year,
      start_date: newTerm.start_date,
      end_date: newTerm.end_date,
      is_current: false,
    });

    if (err) {
      setError(err.message);
    } else {
      setNewTerm({ name: "Term 1", academic_year: new Date().getFullYear(), start_date: "", end_date: "" });
      setShowForm(false);
      loadTerms();
    }
    setSaving(false);
  };

  const handleSetCurrent = async (termId: string) => {
    setSaving(true);
    if (!schoolId) { setSaving(false); return; }

    // Unset all terms for this school, then set the selected one
    await supabase
      .from("academic_terms")
      .update({ is_current: false })
      .eq("school_id", schoolId);

    await supabase
      .from("academic_terms")
      .update({ is_current: true })
      .eq("id", termId);

    loadTerms();
    setSaving(false);
  };

  const handleDelete = async (termId: string) => {
    if (!confirm("Are you sure you want to delete this term? This cannot be undone.")) return;
    await supabase.from("academic_terms").delete().eq("id", termId);
    loadTerms();
  };

  if (loading) return <Loading size="lg" text="Loading terms..." />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Academic Terms</h1>
          <p className="text-sm text-zinc-500">Manage school terms and academic years</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4" />
          Add Term
        </Button>
      </div>

      {/* Create Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>New Academic Term</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
              <div>
                <label className="block text-xs font-medium mb-1">Term</label>
                <select
                  value={newTerm.name}
                  onChange={(e) => setNewTerm({ ...newTerm, name: e.target.value })}
                  className="flex h-10 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
                >
                  <option value="Term 1">Term 1</option>
                  <option value="Term 2">Term 2</option>
                  <option value="Term 3">Term 3</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Academic Year</label>
                <Input
                  type="number"
                  value={newTerm.academic_year}
                  onChange={(e) => setNewTerm({ ...newTerm, academic_year: parseInt(e.target.value) || 2025 })}
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Start Date</label>
                <Input
                  type="date"
                  value={newTerm.start_date}
                  onChange={(e) => setNewTerm({ ...newTerm, start_date: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">End Date</label>
                <Input
                  type="date"
                  value={newTerm.end_date}
                  onChange={(e) => setNewTerm({ ...newTerm, end_date: e.target.value })}
                />
              </div>
              <div className="flex items-end gap-2">
                <Button onClick={handleCreate} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Create
                </Button>
                <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </div>
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
          </CardContent>
        </Card>
      )}

      {/* Terms List */}
      <div className="space-y-3">
        {terms.map((term) => (
          <Card
            key={term.id}
            className={`transition-all hover:shadow-md ${
              term.is_current ? "ring-2 ring-emerald-500 dark:ring-emerald-400" : ""
            }`}
          >
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                    term.is_current
                      ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
                      : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                  }`}>
                    <Calendar className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-lg">{term.name} {term.academic_year}</p>
                      {term.is_current && (
                        <Badge variant="success" className="gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          Current
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-zinc-500">
                      {formatDate(term.start_date)} — {formatDate(term.end_date)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!term.is_current && (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={saving}
                      onClick={() => handleSetCurrent(term.id)}
                    >
                      Set as Current
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                    onClick={() => handleDelete(term.id)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {terms.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <Calendar className="mx-auto h-12 w-12 text-zinc-300" />
              <p className="mt-4 text-sm text-zinc-500">No terms created yet</p>
              <Button className="mt-4" variant="outline" onClick={() => setShowForm(true)}>
                Create your first term
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
