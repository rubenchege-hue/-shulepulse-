import Link from "next/link";
import {
  BarChart3,
  BookOpen,
  GraduationCap,
  Mail,
  School,
  Shield,
  Trophy,
  Users,
} from "lucide-react";

const features = [
  {
    icon: BookOpen,
    title: "Dual Curriculum Support",
    description:
      "Seamlessly track progress for both CBC (Competency Based Curriculum) and 8-4-4 systems in one platform.",
  },
  {
    icon: BarChart3,
    title: "Competency Tracking",
    description:
      "Record and monitor CBC competencies with strand-based assessments and rubric evaluations (E/B/A/P).",
  },
  {
    icon: Trophy,
    title: "Co-Curricular Tracking",
    description:
      "Log student participation and achievements in sports, music, drama, debate, clubs, and more.",
  },
  {
    icon: Users,
    title: "Parent Portal",
    description:
      "Give parents real-time visibility into their child's academic progress, CBC competencies, and co-curricular growth.",
  },
  {
    icon: Shield,
    title: "Role-Based Access",
    description:
      "Secure dashboards for administrators, teachers, and parents — each seeing what matters to them.",
  },
  {
    icon: GraduationCap,
    title: "Automated Reports",
    description:
      "Generate comprehensive report cards combining academic scores, CBC ratings, and co-curricular achievements.",
  },
];

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-zinc-200 bg-white/80 backdrop-blur-lg dark:border-zinc-800 dark:bg-zinc-950/80">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600">
              <School className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold">ShulePulse</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="inline-flex h-9 items-center justify-center rounded-lg bg-emerald-600 px-4 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative mt-16 flex min-h-[calc(100vh-4rem)] items-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-white to-blue-50 dark:from-emerald-950/20 dark:via-zinc-950 dark:to-blue-950/20" />
        <div className="absolute top-20 left-10 h-72 w-72 rounded-full bg-emerald-200/30 blur-3xl dark:bg-emerald-500/5" />
        <div className="absolute bottom-20 right-10 h-96 w-96 rounded-full bg-blue-200/30 blur-3xl dark:bg-blue-500/5" />

        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:py-32">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1.5 text-sm font-medium text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300">
              <School className="h-4 w-4" />
              Built for Kenyan Schools
            </div>
            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
              Track Every Student&apos;s{" "}
              <span className="bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
                Journey to Success
              </span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-zinc-600 dark:text-zinc-400 sm:text-xl">
              ShulePulse helps Kenyan schools document student progress across
              academics and co-curricular activities. From CBC competencies to
              8-4-4 exams — keep parents informed and students on track.
            </p>
            <div className="mt-10 flex items-center justify-center gap-4">
              <Link
                href="/register"
                className="inline-flex h-12 items-center justify-center rounded-xl bg-emerald-600 px-8 text-base font-semibold text-white shadow-lg shadow-emerald-200 hover:bg-emerald-700 hover:shadow-xl transition-all dark:shadow-emerald-900/30"
              >
                Start Free Trial
              </Link>
              <Link
                href="/login"
                className="inline-flex h-12 items-center justify-center rounded-xl border border-zinc-300 bg-white px-8 text-base font-semibold text-zinc-900 shadow-sm hover:bg-zinc-50 transition-colors dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:hover:bg-zinc-700"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="relative border-t border-zinc-200 bg-white py-24 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Everything your school needs
            </h2>
            <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">
              One platform to manage academic records, CBC competencies,
              co-curricular activities, and parent communication.
            </p>
          </div>

          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group rounded-xl border border-zinc-200 bg-white p-6 shadow-sm transition-all hover:shadow-md hover:border-emerald-200 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-emerald-800"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-t border-zinc-200 bg-emerald-600 py-16 dark:border-zinc-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid gap-8 sm:grid-cols-3">
            {[
              { value: "CBC + 8-4-4", label: "Curriculum Support" },
              { value: "3-in-1", label: "Academic, CBC, Co-Curricular" },
              { value: "Real-time", label: "Parent Updates" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl font-bold text-white">{stat.value}</div>
                <div className="mt-1 text-sm text-emerald-200">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-200 bg-white py-8 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
              <School className="h-5 w-5 text-emerald-600" />
              <span className="text-sm font-semibold">ShulePulse</span>
            </div>
            <p className="text-sm text-zinc-500">
              &copy; {new Date().getFullYear()} ShulePulse. Built for Kenyan
              schools.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
