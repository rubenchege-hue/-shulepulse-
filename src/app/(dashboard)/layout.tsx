"use client";

import { DevAuthProvider, useRequireAuth } from "@/lib/dev-auth";
import { Sidebar } from "@/components/ui/sidebar";
import { Loading } from "@/components/ui/loading";
import { useRouter } from "next/navigation";

function DashboardShell({ children }: { children: React.ReactNode }) {
  const { user, isLoading, logout } = useRequireAuth();
  const router = useRouter();

  if (isLoading) {
    return <Loading size="lg" text="Loading..." />;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar
        role={user.role}
        schoolName={user.schoolName}
        userName={`${user.firstName} ${user.lastName}`}
        onLogout={() => {
          logout();
          router.push("/login");
        }}
      />
      <main className="flex-1 overflow-y-auto p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <DevAuthProvider>
      <DashboardShell>{children}</DashboardShell>
    </DevAuthProvider>
  );
}
