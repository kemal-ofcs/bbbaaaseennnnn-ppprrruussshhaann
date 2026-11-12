"use client";

import { useRouter } from "next/navigation";
import { Suspense, useEffect } from "react";
import { HrisWorkspace } from "@/components/hris/HrisWorkspace";
import { MobileAppShell } from "@/components/MobileAppShell";
import { canAccessArea } from "@/lib/auth/access";
import { useAuth } from "@/lib/context/AuthContext";
import { useHydrated } from "@/lib/hooks/useHydrated";

// HRIS untuk HRD di HP (fase 10, §25.3). Komponennya sama dengan Web/Desktop;
// tiap tab memeriksa izinnya sendiri dan backend memeriksa ulang.
export default function MobileHrisPage() {
  const isHydrated = useHydrated();
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const allowed = canAccessArea(user, "hris");

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
          <h1 className="text-base font-bold text-white">HRIS</h1>
          <p className="text-xs text-slate-400">
            Data karyawan, struktur, kinerja, keluar, rekrutmen, dan pelatihan.
            Data pribadi, keuangan, dan dokumen butuh koneksi ke database.
          </p>
        </div>
        {isAuthenticated && allowed ? (
          // `useSearchParams` di dalamnya butuh Suspense untuk static export.
          <Suspense fallback={null}>
            <HrisWorkspace />
          </Suspense>
        ) : null}
      </div>
    </MobileAppShell>
  );
}
