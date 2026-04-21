import Link from "next/link";
import type { ReactNode } from "react";

const NAV = [
  { href: "/admin/api-settings", label: "🔑 API Settings" },
  { href: "/admin/brand-voice",  label: "📝 Brand Voice" },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-56 bg-white border-r border-gray-200 flex flex-col py-8 px-4 gap-2">
        <Link href="/" className="text-xs text-gray-400 hover:text-gray-600 mb-6 flex items-center gap-1">
          ← Compose
        </Link>
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2 px-2">Admin</p>
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-amber-50 hover:text-amber-800 transition-colors"
          >
            {item.label}
          </Link>
        ))}
      </aside>

      {/* Main content */}
      <main className="flex-1 p-8 max-w-3xl">{children}</main>
    </div>
  );
}
