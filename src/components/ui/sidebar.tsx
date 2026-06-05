"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  GraduationCap,
  Trophy,
  FileText,
  Settings,
  LogOut,
  School,
  ClipboardList,
  BarChart3,
  UserCircle,
  UserCheck,
  ChevronLeft,
  Menu,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

interface SidebarProps {
  role: "admin" | "teacher" | "parent";
  schoolName?: string;
  userEmail?: string;
  userName?: string;
  onLogout?: () => void;
}

const navItems: Record<string, NavItem[]> = {
  admin: [
    { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { label: "Students", href: "/admin/students", icon: Users },
    { label: "Parents", href: "/admin/parents", icon: UserCheck },
    { label: "Classes", href: "/admin/classes", icon: GraduationCap },
    { label: "Subjects", href: "/admin/subjects", icon: BookOpen },
    { label: "Teachers", href: "/admin/teachers", icon: UserCircle },
    { label: "Assessments", href: "/admin/assessments", icon: ClipboardList },
    { label: "Terms", href: "/admin/terms", icon: BookOpen },
    { label: "Reports", href: "/admin/reports", icon: FileText },
    { label: "Settings", href: "/admin/settings", icon: Settings },
  ],
  teacher: [
    { label: "Dashboard", href: "/teacher", icon: LayoutDashboard },
    { label: "My Students", href: "/teacher/students", icon: Users },
    { label: "Assessments", href: "/teacher/assessments", icon: ClipboardList },
    { label: "CBC Tracking", href: "/teacher/cbc", icon: BarChart3 },
    { label: "Co-Curricular", href: "/teacher/cocurricular", icon: Trophy },
    { label: "Attendance", href: "/teacher/attendance", icon: UserCheck },
    { label: "Reports", href: "/teacher/reports", icon: FileText },
  ],
  parent: [
    { label: "Dashboard", href: "/parent", icon: LayoutDashboard },
    { label: "My Children", href: "/parent/children", icon: Users },
    { label: "Academic Progress", href: "/parent/academic", icon: BookOpen },
    { label: "Reports", href: "/parent/reports", icon: FileText },
  ],
};

export function Sidebar({ role, schoolName, userName, onLogout }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const items = navItems[role] || [];

  return (
    <>
      {/* Mobile overlay */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/50 lg:hidden",
          collapsed ? "hidden" : "lg:hidden"
        )}
        onClick={() => setCollapsed(true)}
      />

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 flex h-full flex-col border-r border-zinc-200 bg-white transition-all duration-300 dark:border-zinc-800 dark:bg-zinc-950 lg:static lg:z-auto",
          collapsed ? "-translate-x-full lg:translate-x-0 lg:w-16" : "w-64 translate-x-0"
        )}
      >
        {/* Logo area */}
        <div className="flex h-16 items-center justify-between border-b border-zinc-200 px-4 dark:border-zinc-800">
          <Link href={`/${role}`} className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600">
              <School className="h-5 w-5 text-white" />
            </div>
            {!collapsed && (
              <div className="flex flex-col">
                <span className="text-sm font-bold text-zinc-900 dark:text-white">
                  SchoolTracker
                </span>
                {schoolName && (
                  <span className="text-xs text-zinc-500 truncate max-w-[140px]">
                    {schoolName}
                  </span>
                )}
              </div>
            )}
          </Link>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 lg:block"
          >
            <ChevronLeft className={cn("h-4 w-4 transition-transform", collapsed && "rotate-180")} />
          </button>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {items.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                  isActive
                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300"
                    : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100",
                  collapsed && "justify-center lg:px-2"
                )}
                title={collapsed ? item.label : undefined}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* User info */}
        <div className="border-t border-zinc-200 p-3 dark:border-zinc-800">
          {!collapsed && userName && (
            <div className="mb-2 px-3">
              <p className="text-sm font-medium text-zinc-900 dark:text-white truncate">
                {userName}
              </p>
              <p className="text-xs text-zinc-500 capitalize">{role}</p>
            </div>
          )}
          {onLogout && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-3 text-zinc-600 dark:text-zinc-400"
              onClick={onLogout}
            >
              <LogOut className="h-4 w-4" />
              {!collapsed && <span>Sign Out</span>}
            </Button>
          )}
        </div>
      </aside>
    </>
  );
}
