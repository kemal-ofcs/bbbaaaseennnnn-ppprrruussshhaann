import { cpSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";

const desktopSrc = join(__dirname, "../../web-desktop/src");
const mobileSrc = join(__dirname, "../src");

const desktopIcons = join(__dirname, "../../web-desktop/src-tauri/icons");
const mobileIcons = join(__dirname, "../src-tauri/icons");

if (existsSync(desktopIcons)) {
  mkdirSync(mobileIcons, { recursive: true });
  cpSync(desktopIcons, mobileIcons, { recursive: true });
  console.log("Copied icons to src-tauri/icons");
}

const filesToCopy = [
  // Dropdown dengan kotak cari dan dialog konfirmasi: bergantung pada `Modal`
  // dan `components/inventory/gaya.ts` yang juga disalin.
  "components/ui/PilihCari.tsx",
  "components/ui/KonfirmasiData.tsx",
  "lib/db.ts",
  "lib/db-schema.ts",
  "lib/db-migrations.ts",
  // UI lisensi: identik di kedua build supaya layar aktivasi, nama dan kode
  // perangkat, serta mode baca-saja tidak pernah berbeda antara PC dan HP.
  "components/license/LicenseActivationPanel.tsx",
  "components/license/LicenseBootstrapField.tsx",
  "components/license/LicenseCard.tsx",
  "components/license/LicenseNotice.tsx",
  // Pendaftaran wajah (verifikasi 1:1): hanya bergantung pada `Modal` dan
  // gateway tersinkron, jadi satu komponen dipakai kedua build.
  "components/wajah/WajahWorkspace.tsx",
  // Ekspor laporan kehadiran per karyawan × tanggal dari dasbor.
  "components/dashboard/EksporLaporanKehadiran.tsx",
  "components/dashboard/laporanKehadiranExcel.ts",
  // UI inventaris: satu komponen untuk ketiga build. Hanya bergantung pada
  // kontrak `Modal` yang sama dan gateway tersinkron; pesan sukses/galat ditulis
  // di dalamnya karena `FeedbackBanner` kedua workspace berbeda props.
  "components/inventory/InventarisWorkspace.tsx",
  "components/inventory/PanelPemantauan.tsx",
  "components/inventory/gaya.ts",
  "components/inventory/beritaAcara.ts",
  "components/inventory/ekspor.ts",
  // Dialog ekspor Excel berkolom pilihan, misalnya lembar validasi stok.
  "components/inventory/DialogEkspor.tsx",
  // Pemindai label (kamera + pemindai USB) dan dialog cetak label QR.
  "components/inventory/LabelQr.tsx",
  // Registri aset per unit: daftarkan unit dan ubah nomor seri.
  "components/inventory/UnitAset.tsx",
  // Kolom tambahan barang (v25): tambah, ganti nama, nonaktifkan.
  "components/inventory/KolomTambahan.tsx",
  // Servis aset (v29): tab Servis, rincian barang, dan dialognya.
  "components/inventory/Servis.tsx",
  // Pengajuan pembelian (v30): tab Pengajuan dan bagian persetujuan di Keuangan.
  "components/inventory/Pengajuan.tsx",
  // Pembelian cicilan (v31): isian syarat di pengajuan dan tab Cicilan.
  "components/inventory/SyaratCicilan.tsx",
  // Pembukuan: satu UI untuk kedua build, bergantung pada `Modal` dan gaya
  // `components/inventory/gaya.ts` yang juga disalin.
  "components/keuangan/KeuanganWorkspace.tsx",
  "components/keuangan/LaporanKeuangan.tsx",
  "components/keuangan/eksporKeuangan.ts",
  "components/keuangan/KasbonWorkspace.tsx",
  // Pemilih akun Kas/Bank: dipakai Kasbon dan detail proses gaji.
  "components/keuangan/PilihAkunBayar.tsx",
  // Tab Cicilan di Keuangan (v31).
  "components/keuangan/CicilanWorkspace.tsx",
  "components/keuangan/TutupBukuPanel.tsx",
  // Jurnal pengadaan dan hibah inventaris (v28), tab "Dari Inventaris".
  "components/keuangan/JurnalInventaris.tsx",
  // Hari kerja shift dan tambah hari libur massal.
  "components/shift/PilihHariKerja.tsx",
  "components/holiday/LiburMassalDialog.tsx",
  // Pemilih karyawan halaman Operasional dan bilah "Ubah massal" Karyawan.
  "components/operational/PilihPersonil.tsx",
  "components/operational/aturanPilihPersonil.ts",
  "components/personnel/UbahMassal.tsx",
  "components/personnel/aturanUbahMassal.ts",
];

for (const file of filesToCopy) {
  const src = join(desktopSrc, file);
  const dest = join(mobileSrc, file);
  if (existsSync(src)) {
    mkdirSync(dirname(dest), { recursive: true });
    cpSync(src, dest);
    console.log(`Copied ${file} to mobile`);
  }
}

const dirsToCopy = [
  "lib/attendance",
  "lib/auth",
  "lib/client",
  "lib/constants",
  "lib/context",
  "lib/contracts",
  "lib/gateways",
  "lib/hooks",
  "lib/license",
  // Konfigurasi pengirim email sistem dan mesin liveness "Lupa Password":
  // keduanya murni logika lintas platform dan WAJIB identik di kedua workspace
  // karena Web menghitung ulang vonis liveness dengan modul yang sama.
  "lib/mail",
  "lib/operators",
  "lib/rbac",
  "lib/runtime",
  "lib/security",
  "lib/server",
  "lib/services",
  "lib/utils",
  "lib/validations",
  "types",
];

for (const dir of dirsToCopy) {
  const src = join(desktopSrc, dir);
  const dest = join(mobileSrc, dir);
  if (existsSync(src)) {
    mkdirSync(dest, { recursive: true });
    cpSync(src, dest, { recursive: true });
    console.log(`Copied ${dir} to mobile`);
  }
}
