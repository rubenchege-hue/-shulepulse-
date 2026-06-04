import Link from "next/link";
import { School } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-col">
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <Link href="/" className="inline-flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 shadow-lg shadow-emerald-200 dark:shadow-emerald-900/30">
                <School className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-bold">ShulePulse</span>
            </Link>
          </div>
          {children}
        </div>
      </div>
      <p className="pb-4 text-center text-sm text-zinc-500">
        &copy; {new Date().getFullYear()} ShulePulse. Built for Kenyan schools.
      </p>
    </div>
  );
}
