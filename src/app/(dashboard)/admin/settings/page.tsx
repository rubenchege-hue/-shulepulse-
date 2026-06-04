"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loading } from "@/components/ui/loading";
import { Save, Loader2, School as SchoolIcon, Building2, Phone, Mail, Hash } from "lucide-react";
import type { School } from "@/lib/types/database";

export default function AdminSettingsPage() {
  const supabase = createClient();
  const [school, setSchool] = useState<School | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    address: "",
    phone: "",
    email: "",
    code: "",
  });

  useEffect(() => {
    async function load() {
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*, schools(*), school_id")
        .single();

      if (!profileData) {
        setLoading(false);
        return;
      }

      setProfile(profileData);

      if (profileData.schools) {
        const s = profileData.schools as School;
        setSchool(s);
        setForm({
          name: s.name || "",
          address: s.address || "",
          phone: s.phone || "",
          email: s.email || "",
          code: s.code || "",
        });
      }
      setLoading(false);
    }
    load();
  }, [supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!school?.id) return;

    setSaving(true);
    setSaved(false);
    setError(null);

    const { error: err } = await supabase
      .from("schools")
      .update({
        name: form.name,
        address: form.address || null,
        phone: form.phone || null,
        email: form.email || null,
        code: form.code || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", school.id);

    if (err) {
      setError(err.message);
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
    setSaving(false);
  };

  if (loading) return <Loading size="lg" text="Loading settings..." />;

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">School Settings</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Manage your school&apos;s profile information
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SchoolIcon className="h-5 w-5 text-emerald-600" />
            School Profile
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                School Name
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                <Input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="pl-9"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Address</label>
              <Input
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="e.g., 123 Kenyatta Avenue, Nairobi"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Phone</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                  <Input
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="+254 712 345 678"
                    className="pl-9"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="info@school.ac.ke"
                    className="pl-9"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                School Code
              </label>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                <Input
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                  placeholder="e.g., MEC001"
                  className="pl-9"
                />
              </div>
              <p className="mt-1 text-xs text-zinc-500">
                Unique registration code used for identifying your school
              </p>
            </div>

            {error && (
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            )}

            <div className="flex items-center gap-3 pt-2">
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Save Changes
              </Button>
              {saved && (
                <span className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">
                  Settings saved successfully
                </span>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* School Info Card */}
      {school && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-zinc-500">
              School Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-zinc-500">Code</dt>
                <dd className="font-medium">{school.code || "—"}</dd>
              </div>
              <div>
                <dt className="text-zinc-500">Created</dt>
                <dd className="font-medium">
                  {new Date(school.created_at).toLocaleDateString("en-KE", {
                    dateStyle: "medium",
                  })}
                </dd>
              </div>
              <div>
                <dt className="text-zinc-500">Last Updated</dt>
                <dd className="font-medium">
                  {new Date(school.updated_at).toLocaleDateString("en-KE", {
                    dateStyle: "medium",
                  })}
                </dd>
              </div>
              <div>
                <dt className="text-zinc-500">Your Role</dt>
                <dd className="font-medium capitalize">{profile?.role || "—"}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
