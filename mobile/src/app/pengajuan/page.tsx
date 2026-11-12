"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { PengajuanWorkspace } from "@/components/hris/PengajuanWorkspace";
import { PenilaianKinerja } from "@/components/hris/PenilaianKinerja";
import { MobileAppShell } from "@/components/MobileAppShell";
import { canAccessArea, hasPermission } from "@/lib/auth/access";
import { useAuth } from "@/lib/context/AuthContext";
import { useHydrated } from "@/lib/hooks/useHydrated";

type Tab = "pengajuan" | "penilaian";

// `useSearchParams` butuh Suspense untuk static export.
export default function MobilePengajuanPage() {
  return (
    <Suspense fallback={null}>
      <HalamanPengajuan />
    </Suspense>
  );
}

function HalamanPengajuan() {
  const isHydrated = useHydrated();
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const allowed = canAccessArea(user, "pengajuan");
  // Area `pengajuan` juga terbuka untuk penilai kinerja (§21.8); tiap tab
  // memeriksa izinnya sendiri dan backend memeriksa ulang.
  const bolehPengajuan =
    hasPermission(user, "hr.request.view") ||
    hasPermission(user, "reimburse.decide");
  const bolehPenilaian =
    hasPermission(user, "hr.performance.assess") ||
    hasPermission(user, "hr.performance.view");
  // `?tab=penilaian` dari kartu "Perlu perhatian" di /dashboard (§24.5).
  const tabUrl = useSearchParams().get("tab");
  const [pilihan, setPilihan] = useState<Tab | null>(
    tabUrl === "penilaian" ? "penilaian" : null,
  );
  const tab: Tab = pilihan ?? (bolehPengajuan ? "pengajuan" : "penilaian");

  // Static export Mobile tidak punya rute /forbidden.
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
    }
    if (isHydrated && isAuthenticated && !allowed) {
      router.replace("/dashboard");
    }
  }, [isLoading, isAuthenticated, isHydrated, allowed, router]);

  return (
    <MobileAppShell>
      <div className="space-y-4 pb-16">
        <div>
          <h1 className="text-base font-bold text-white">Cuti & Izin</h1>
          <p className="text-xs text-slate-400">
            Ajukan dan putuskan cuti, izin, dan sakit karyawan, serta nilai
            kinerja bawahan
          </p>
        </div>
        {isAuthenticated && allowed && bolehPengajuan && bolehPenilaian ? (
          <div
            className="flex flex-wrap gap-2"
            role="tablist"
            aria-label="Bagian pengajuan"
          >
            {(
              [
                ["pengajuan", "Cuti & Izin"],
                ["penilaian", "Penilaian"],
              ] as Array<[Tab, string]>
            ).map(([id, label]) => (
              <button
                key={id}
                id={`pengajuan-tab-${id}`}
                type="button"
                role="tab"
                aria-selected={tab === id}
                onClick={() => setPilihan(id)}
                className={`min-h-10 rounded-xl px-4 text-sm font-bold ${tab === id ? "bg-sky-500 text-white" : "bg-slate-900 text-slate-300"}`}
              >
                {label}
              </button>
            ))}
          </div>
        ) : null}
        {isAuthenticated && allowed && tab === "pengajuan" && bolehPengajuan ? (
          <PengajuanWorkspace />
        ) : null}
        {isAuthenticated && allowed && tab === "penilaian" && bolehPenilaian ? (
          <PenilaianKinerja modeHp />
        ) : null}
      </div>
    </MobileAppShell>
  );
}
