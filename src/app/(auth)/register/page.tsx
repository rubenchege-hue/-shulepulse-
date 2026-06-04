"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Loader2, AlertCircle } from "lucide-react";

export default function RegisterPage() {
  const [step, setStep] = useState<"account" | "school">("account");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [role, setRole] = useState("admin");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
          role,
          school_name: schoolName,
        },
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      // Create profile and school will be handled by a database trigger or edge function
      router.push("/login?registered=true");
    }
    setLoading(false);
  };

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold">Get started with ShulePulse</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Create your school&apos;s account
        </p>
      </div>

      <form onSubmit={handleRegister} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="firstName"
              className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              First Name
            </label>
            <Input
              id="firstName"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              className="mt-1"
            />
          </div>
          <div>
            <label
              htmlFor="lastName"
              className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Last Name
            </label>
            <Input
              id="lastName"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
              className="mt-1"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="schoolName"
            className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            School Name
          </label>
          <Input
            id="schoolName"
            placeholder="e.g., Moi High School, St. Mary's Primary"
            value={schoolName}
            onChange={(e) => setSchoolName(e.target.value)}
            required
            className="mt-1"
          />
        </div>

        <div>
          <label
            htmlFor="role"
            className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Your Role
          </label>
          <Select
            id="role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            options={[
              { value: "admin", label: "School Administrator" },
              { value: "teacher", label: "Teacher" },
            ]}
            className="mt-1"
          />
        </div>

        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Email
          </label>
          <Input
            id="email"
            type="email"
            placeholder="you@school.ac.ke"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="mt-1"
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Password
          </label>
          <Input
            id="password"
            type="password"
            placeholder="At least 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            className="mt-1"
          />
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <Button type="submit" className="w-full" size="lg" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Creating account...
            </>
          ) : (
            "Create Account"
          )}
        </Button>
      </form>

      <div className="mt-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
        >
          Sign in
        </Link>
      </div>
    </div>
  );
}
