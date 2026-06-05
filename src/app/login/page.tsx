"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DevAuthProvider, useDevAuth, type DevUserRole } from "@/lib/dev-auth";
import { School, Shield, Users, GraduationCap, Loader2 } from "lucide-react";

const roles: {
  id: DevUserRole;
  label: string;
  description: string;
  userName: string;
  icon: typeof Shield;
  color: string;
}[] = [
  {
    id: "admin",
    label: "Administrator",
    description: "Full access to manage school, students, teachers, classes, and reports",
    userName: "Jane Kamau",
    icon: Shield,
    color: "from-emerald-500 to-emerald-700",
  },
  {
    id: "teacher",
    label: "Teacher",
    description: "Manage assessments, CBC tracking, co-curricular, and attendance",
    userName: "John Mwangi",
    icon: GraduationCap,
    color: "from-blue-500 to-blue-700",
  },
  {
    id: "parent",
    label: "Parent / Guardian",
    description: "View your children's academic progress, CBC ratings, reports, and activities",
    userName: "Grace Kimani",
    icon: Users,
    color: "from-purple-500 to-purple-700",
  },
];

function LoginForm() {
  const [loading, setLoading] = useState<DevUserRole | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { login } = useDevAuth();
  const router = useRouter();

  const handleLogin = async (role: DevUserRole) => {
    setLoading(role);
    setError(null);
    try {
      await login(role);
      router.push(`/${role}`);
    } catch (err) {
      console.error("Login failed:", err);
      setError("Something went wrong. Please make sure the database is set up properly.");
      setLoading(null);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-zinc-50 via-white to-zinc-50 p-4 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="mb-10 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-600 shadow-lg shadow-emerald-200 dark:shadow-emerald-900/30">
            <School className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">SchoolTracker</h1>
          <p className="mt-2 text-zinc-500 dark:text-zinc-400">
            School Management System — Demo Login
          </p>
        </div>

        {/* Role cards */}
        <div className="grid gap-4">
          {roles.map((role) => {
            const Icon = role.icon;
            const isLoading = loading === role.id;

            return (
              <button
                key={role.id}
                onClick={() => handleLogin(role.id)}
                disabled={loading !== null}
                className="group relative flex items-start gap-5 rounded-xl border border-zinc-200 bg-white p-5 text-left shadow-sm transition-all hover:shadow-md hover:border-zinc-300 disabled:cursor-wait disabled:opacity-70 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
              >
                {/* Gradient accent bar */}
                <div
                  className={`absolute left-0 top-0 h-full w-1 rounded-l-xl bg-gradient-to-b ${role.color}`}
                />

                {/* Icon */}
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${role.color} shadow-sm`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-semibold">{role.label}</h3>
                    <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                      {role.userName}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                    {role.description}
                  </p>
                </div>

                {/* Loading state */}
                {isLoading && (
                  <div className="flex items-center">
                    <Loader2 className="h-5 w-5 animate-spin text-zinc-400" />
                  </div>
                )}

                {/* Arrow */}
                {!isLoading && (
                  <div className="flex items-center text-zinc-300 transition-colors group-hover:text-zinc-500 dark:text-zinc-600 dark:group-hover:text-zinc-400">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Footer */}
        {error && (
          <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </div>
        )}

        <p className="mt-8 text-center text-xs text-zinc-400 dark:text-zinc-600">
          Demo mode — no password required. Select a role to enter the dashboard.
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <DevAuthProvider>
      <LoginForm />
    </DevAuthProvider>
  );
}
