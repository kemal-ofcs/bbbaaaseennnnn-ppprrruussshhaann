"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { MobileAppShell } from "@/components/MobileAppShell";
import { Icon } from "@/components/ui/Icon";
import { type AccessSubject, canAccessArea } from "@/lib/auth/access";
import { triggerHaptic } from "@/lib/client/haptics";
import {
  NAVIGATION_GROUPS,
  type NavigationItem,
} from "@/lib/constants/navigation";
import { useAuth } from "@/lib/context/AuthContext";

/** Sudah ada di navigasi bawah, jadi tidak diulang di sini. */
const BOTTOM_NAV_HREFS = new Set([
  "/",
  "/dashboard",
  "/scanner",
  "/history",
  "/karyawan",
]);

function canSeeItem(
  user: AccessSubject | null | undefined,
  item: NavigationItem,
) {
  // Pengaturan Mobile memuat password, 2FA, tema, dan keluar: milik semua operator.
  if (item.area === "settings") return true;
  // Halaman Operator Mobile hanya untuk Superadmin (lihat operators/page.tsx).
  if (item.area === "operators") return Boolean(user?.isSuperadmin);
  return canAccessArea(user, item.area);
}

export default function MenuPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace("/login");
  }, [isLoading, isAuthenticated, router]);

  const needle = query.trim().toLowerCase();
  const groups = NAVIGATION_GROUPS.map((group) => ({
    label: group.label,
    items: group.items.filter(
      (item) =>
        !BOTTOM_NAV_HREFS.has(item.href) &&
        canSeeItem(user, item) &&
        (!needle ||
          item.label.toLowerCase().includes(needle) ||
          group.label.toLowerCase().includes(needle)),
    ),
  })).filter((group) => group.items.length > 0);

  if (!user) return null;

  return (
    <MobileAppShell>
      <h1 className="mb-3 text-lg font-black leading-tight text-white">Menu</h1>

      <label htmlFor="menu-search-input" className="sr-only">
        Cari menu
      </label>
      <input
        id="menu-search-input"
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Cari menu, misalnya gaji atau stok"
        className="mb-5 h-11 w-full rounded-2xl border border-white/10 bg-slate-900 px-4 text-sm text-white placeholder:text-slate-500 focus:border-sky-400 focus:outline-none"
      />

      {groups.length === 0 ? (
        <p className="rounded-2xl border border-white/10 bg-slate-900/60 p-4 text-center text-sm text-slate-400">
          {needle
            ? `Tidak ada menu yang cocok dengan "${query.trim()}".`
            : "Akun ini belum punya akses ke menu lain."}
        </p>
      ) : (
        <div className="flex flex-col gap-5">
          {groups.map((group) => (
            <section key={group.label} aria-label={group.label}>
              <h2 className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                {group.label}
              </h2>
              <div className="grid grid-cols-3 gap-2">
                {group.items.map((item) => (
                  <Link
                    key={item.href}
                    id={`menu-${item.area}`}
                    href={item.href}
                    onClick={() => triggerHaptic("light")}
                    className="flex min-h-24 flex-col items-center justify-center gap-2 rounded-2xl border border-white/10 bg-slate-900/70 p-2 text-center transition active:scale-95"
                  >
                    <span className="grid size-10 place-items-center rounded-xl bg-sky-500/15 text-sky-300">
                      <Icon name={item.icon} className="size-5" />
                    </span>
                    <span className="text-xs font-semibold leading-tight text-slate-200">
                      {item.label}
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </MobileAppShell>
  );
}
