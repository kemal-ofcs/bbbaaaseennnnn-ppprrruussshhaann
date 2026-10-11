# Pemetaan Berkas & Arsitektur Fitur Penggajian (Payroll Engine)

Dokumen ini memetakan seluruh berkas kode sumber yang menyusun fitur dan sistem **Penggajian (Payroll Engine)** pada aplikasi Absensi SPPG / Perusahaan, yang mencakup antarmuka web, aplikasi desktop (Tauri v2 + Rust), aplikasi mobile (Android), serta skema database dan sinkronisasi.

---

## 1. Halaman Web & Tampilan Pengguna (`web-desktop/src/app/payroll`)

| Berkas | Deskripsi & Fungsi |
| :--- | :--- |
| [`page.tsx`](file:///c:/fr/Absensi%20Perusahaan/web-desktop/src/app/payroll/page.tsx) | **Dashboard Utama Penggajian** — Filter rentang tanggal periode, kalkulasi rekapitulasi jam kerja & estimasi gaji, preview tabel karyawan (`VirtualPayrollTable`), dan modal pembuatan periode penggajian (*generate payroll run*). |
| [`runs/page.tsx`](file:///c:/fr/Absensi%20Perusahaan/web-desktop/src/app/payroll/runs/page.tsx) | **Riwayat Periode Gaji** — Menampilkan daftar histori periode penggajian beserta status siklusnya (`DRAFT → SUBMITTED → REVIEWED → APPROVED → PAID`, plus `REJECTED → DRAFT`). |
| [`runs/detail/page.tsx`](file:///c:/fr/Absensi%20Perusahaan/web-desktop/src/app/payroll/runs/detail/page.tsx) | Server wrapper halaman detail periode penggajian. |
| [`runs/detail/RunDetailClient.tsx`](file:///c:/fr/Absensi%20Perusahaan/web-desktop/src/app/payroll/runs/detail/RunDetailClient.tsx) | **Detail Periode Gaji (Client View)** — Daftar rincian slip per personil, workflow approval/transisi status, audit trail, serta dialog cetak slip gaji massal/individual. |
| [`config/page.tsx`](file:///c:/fr/Absensi%20Perusahaan/web-desktop/src/app/payroll/config/page.tsx) | **Pengaturan Gaji & Komponen** — Konfigurasi tarif per jam (*hourly rate*) per karyawan serta komponen tunjangan (*allowance*) dan potongan (*deduction*). |
| [`config/overtime-rules/page.tsx`](file:///c:/fr/Absensi%20Perusahaan/web-desktop/src/app/payroll/config/overtime-rules/page.tsx) | **Aturan Lembur Bertingkat** — Konfigurasi tier lembur hari kerja vs hari libur dan multiplier pengali upah per jam sesuai regulasi Depnaker. |
| [`config/tax-rules/page.tsx`](file:///c:/fr/Absensi%20Perusahaan/web-desktop/src/app/payroll/config/tax-rules/page.tsx) | **Aturan Pajak PPh 21 TER** — Konfigurasi tabel tarif efektif rata-rata (TER A, TER B, TER C) dan tarif progresif Pasal 17. |
| [`config/bpjs-rules/page.tsx`](file:///c:/fr/Absensi%20Perusahaan/web-desktop/src/app/payroll/config/bpjs-rules/page.tsx) | **Aturan BPJS** — Konfigurasi persentase iuran BPJS Ketenagakerjaan (JKK, JKM, JHT, JP) dan BPJS Kesehatan beserta batas atas upah (*wage cap*). |

---

## 2. Komponen Antarmuka Pengguna (`web-desktop/src/components/payroll`)

| Berkas | Deskripsi & Fungsi |
| :--- | :--- |
| [`VirtualPayrollTable.tsx`](file:///c:/fr/Absensi%20Perusahaan/web-desktop/src/components/payroll/VirtualPayrollTable.tsx) | Komponen tabel virtualisasi untuk menampilkan ratusan baris rekapitulasi gaji karyawan secara cepat dan lancar tanpa lag render. |
| [`SlipGajiPrintView.tsx`](file:///c:/fr/Absensi%20Perusahaan/web-desktop/src/components/payroll/SlipGajiPrintView.tsx) | Format dan tata letak cetak (*print/PDF ready*) Slip Gaji resmi karyawan. |
| [`RunStatusBadge.tsx`](file:///c:/fr/Absensi%20Perusahaan/web-desktop/src/components/payroll/RunStatusBadge.tsx) | Komponen lencana warna penanda status siklus penggajian (`DRAFT` / `SUBMITTED` / `REVIEWED` / `APPROVED` / `PAID` / `REJECTED`). |
| [`AuditTrailTimeline.tsx`](file:///c:/fr/Absensi%20Perusahaan/web-desktop/src/components/payroll/AuditTrailTimeline.tsx) | Linimasa pencatatan jejak audit (*who, when, what*) setiap terjadi perubahan status atau persetujuan penggajian. |

---

## 3. Gateway Komunikasi & Layanan Logika Bisnis (`web-desktop/src/lib`)

| Berkas | Deskripsi & Fungsi |
| :--- | :--- |
| [`gateways/payroll.ts`](file:///c:/fr/Absensi%20Perusahaan/web-desktop/src/lib/gateways/payroll.ts) | **Hybrid Isomorphic Gateway** — Modul tunggal perantara UI. Otomatis bercabang ke Rust IPC (`invokeDesktop`) pada mode Desktop/Mobile dan Route Handler HTTP (`requestWebApi`) pada mode Web Browser. |
| [`services/payroll-calculator.ts`](file:///c:/fr/Absensi%20Perusahaan/web-desktop/src/lib/services/payroll-calculator.ts) | Mesin kalkulasi penggajian sisi TypeScript: perhitungan upah pokok, lembur tier bertingkat, tunjangan, potongan, BPJS perusahaan/karyawan, dan PPh 21 TER. |
| [`services/payroll-calculator.test.ts`](file:///c:/fr/Absensi%20Perusahaan/web-desktop/src/lib/services/payroll-calculator.test.ts) | Unit test otomatis untuk memvalidasi akurasi perhitungan angka dan aturan pajak/BPJS. |
| [`services/payroll-recap.ts`](file:///c:/fr/Absensi%20Perusahaan/web-desktop/src/lib/services/payroll-recap.ts) | Layanan rekapitulasi absensi: menghitung total kehadiran, keterlambatan, pulang awal, serta jam lembur berbasis log absensi harian. |
| [`rbac/catalog.ts`](file:///c:/fr/Absensi%20Perusahaan/web-desktop/src/lib/rbac/catalog.ts) | Registri izin hak akses (*RBAC permissions*): `payroll.view`, `payroll.config.manage`, `payroll.run.create`, `payroll.run.review`, `payroll.run.approve`, `payroll.run.disburse`, `payroll.export`. |

---

## 4. Route Handler Web API (`web-desktop/src/app/api/payroll`)

*Jalur backend HTTP yang dieksekusi saat aplikasi diakses melalui Web Browser:*

| Berkas | Endpoint & Fungsi |
| :--- | :--- |
| [`runs/route.ts`](file:///c:/fr/Absensi%20Perusahaan/web-desktop/src/app/api/payroll/runs/route.ts) | `POST /api/payroll/runs` — Ambil daftar run, detail item slip per run, pembuatan run baru, dan transisi status siklus. |
| [`recap/route.ts`](file:///c:/fr/Absensi%20Perusahaan/web-desktop/src/app/api/payroll/recap/route.ts) | `POST /api/payroll/recap` — Agregasi rekap jam kerja dan estimasi gaji untuk dashboard penggajian. |
| [`config/salary/route.ts`](file:///c:/fr/Absensi%20Perusahaan/web-desktop/src/app/api/payroll/config/salary/route.ts) | `POST /api/payroll/config/salary` — Pengambilan dan penyimpanan konfigurasi tarif gaji pokok karyawan. |
| [`config/components/route.ts`](file:///c:/fr/Absensi%20Perusahaan/web-desktop/src/app/api/payroll/config/components/route.ts) | `POST /api/payroll/config/components` — CRUD komponen tunjangan dan potongan gaji. |
| [`config/overtime/route.ts`](file:///c:/fr/Absensi%20Perusahaan/web-desktop/src/app/api/payroll/config/overtime/route.ts) | `POST /api/payroll/config/overtime` — Pengambilan dan penyimpanan aturan lembur bertingkat. |
| [`config/tax/route.ts`](file:///c:/fr/Absensi%20Perusahaan/web-desktop/src/app/api/payroll/config/tax/route.ts) | `POST /api/payroll/config/tax` — Pengambilan dan pembaharuan tabel aturan tarif PPh 21 TER. |
| [`config/bpjs/route.ts`](file:///c:/fr/Absensi%20Perusahaan/web-desktop/src/app/api/payroll/config/bpjs/route.ts) | `POST /api/payroll/config/bpjs` — Pengambilan dan pembaharuan aturan persentase iuran BPJS. |

---

## 5. Backend Native Rust / Tauri (`web-desktop/src-tauri/src/desktop/payroll`)

*Jalur backend offline-first berkecepatan tinggi yang dieksekusi saat aplikasi berjalan sebagai Desktop:*

| Berkas | Deskripsi & Fungsi |
| :--- | :--- |
| [`engine.rs`](file:///c:/fr/Absensi%20Perusahaan/web-desktop/src-tauri/src/desktop/payroll/engine.rs) | Mesin kalkulasi angka presisi di Rust dengan pustaka `rust_decimal` (mencegah *floating-point error*). |
| [`commands.rs`](file:///c:/fr/Absensi%20Perusahaan/web-desktop/src-tauri/src/desktop/payroll/commands.rs) | Kumpulan perintah Tauri IPC (`#[tauri::command]`): `desktop_get_payroll_recap`, `desktop_create_payroll_run`, `desktop_list_payroll_runs`, `desktop_get_payroll_run_detail`, `desktop_transition_payroll_status`, dll. |
| [`models.rs`](file:///c:/fr/Absensi%20Perusahaan/web-desktop/src-tauri/src/desktop/payroll/models.rs) | Definisi tipe struktur data (*structs*) entitas penggajian di Rust. |
| [`payroll_seed.rs`](file:///c:/fr/Absensi%20Perusahaan/web-desktop/src-tauri/src/desktop/payroll_seed.rs) | Seeder inisialisasi awal aturan BPJS dan tabel PPh 21 TER standar regulasi Indonesia ke database lokal. |

---

## 6. Skema Database & Sinkronisasi Cloud

Sistem penggajian menggunakan **8 Tabel Terdistribusi** yang disinkronkan secara dua arah (*two-way sync*):
1. `salary_configs` (Konfigurasi tarif gaji pokok karyawan)
2. `overtime_tier_rules` (Aturan tier lembur)
3. `payroll_components` (Master tunjangan & potongan)
4. `tax_rules` (Tabel bracket PPh 21)
5. `bpjs_rules` (Aturan tarif BPJS)
6. `payroll_runs` (Header periode proses gaji)
7. `payroll_items` (Detail slip gaji per karyawan per periode)
8. `payroll_audit_logs` (Catatan riwayat status/audit)

| Berkas | Deskripsi & Fungsi |
| :--- | :--- |
| [`db-schema.ts`](file:///c:/fr/Absensi%20Perusahaan/web-desktop/src/lib/db-schema.ts) | Definisi DDL skema database LibSQL cloud untuk kedelapan tabel penggajian. |
| [`db-migrations.ts`](file:///c:/fr/Absensi%20Perusahaan/web-desktop/src/lib/db-migrations.ts) | Skrip migrasi DDL penambahan tabel dan indeks penggajian. |
| [`storage.rs`](file:///c:/fr/Absensi%20Perusahaan/web-desktop/src-tauri/src/desktop/storage.rs) | Definisi DDL SQLite lokal Desktop untuk kedelapan tabel penggajian. |
| [`sync.rs`](file:///c:/fr/Absensi%20Perusahaan/web-desktop/src-tauri/src/desktop/sync.rs) | Registrasi 8 tabel penggajian ke dalam `SNAPSHOT_TABLES` (*pull*), rute kanonik `("payroll", …)`, dan `ensure_unsynced_payroll_data_enqueued` (mengantre ulang baris lokal yang belum pernah di-push — payload-nya disusun per kolom). |
| [`turso.rs`](file:///c:/fr/Absensi%20Perusahaan/web-desktop/src-tauri/src/desktop/turso.rs) | Registrasi `SNAPSHOT_SOURCES` cloud dan handler push outbox mutasi penggajian ke LibSQL. |

---

## 7. Aplikasi Mobile Android (`mobile`)

| Berkas | Deskripsi & Fungsi |
| :--- | :--- |
| [`slip/[id]/page.tsx`](file:///c:/fr/Absensi%20Perusahaan/mobile/src/app/payroll/slip/%5Bid%5D/page.tsx) & [`SlipDetailClient.tsx`](file:///c:/fr/Absensi%20Perusahaan/mobile/src/app/payroll/slip/%5Bid%5D/SlipDetailClient.tsx) | **Slip Gaji Mandiri Karyawan** — Halaman aplikasi Android agar personil/karyawan dapat melihat dan mengunduh slip gaji mereka sendiri. |
| [`mobile/src/app/payroll/*`](file:///c:/fr/Absensi%20Perusahaan/mobile/src/app/payroll) | Halaman admin penggajian versi mobile. **BUKAN salinan `sync:mobile`** — berkasnya terpisah dan sudah menyimpang dari `web-desktop` (mis. `page.tsx` 844 vs 406 baris), jadi setiap perubahan UI payroll wajib diterapkan manual di sini juga. |
| [`payroll.rs`](file:///c:/fr/Absensi%20Perusahaan/mobile/src-tauri/src/mobile/payroll.rs) | Tauri command khusus mobile: `mobile_get_my_payroll_slips` dan `mobile_get_payroll_slip_detail`. |

---
---


# PRODUCT REQUIREMENT DOCUMENT (PRD)
## Skema Penggajian Harian Tetap Tanpa Lembur (`FLAT_DAILY`)

- **Status Dokumen:** SIAP REVIEW (seluruh pertanyaan terbuka sudah diputuskan)
- **Versi:** 1.1 (MVP) — revisi v1.0 setelah dicocokkan dengan kode
- **Tanggal revisi:** 2026-10-11

### Riwayat Revisi

| Versi | Perubahan |
| :-- | :-- |
| 1.0 | Draf awal. |
| 1.1 | Nama kolom/status/permission disamakan dengan kode; `late_deduction` dan `GATE_SUMMARY_SUBQUERY` dihapus (tidak pernah ada); seluruh Open Questions diputuskan; komponen per-orang masuk MVP; penerapan massal masuk MVP; cakupan berkas dilengkapi (handler push, re-enqueue, Mobile yang bukan salinan, perhitungan ganda di Rust). |

---

### 1. Problem Statement

Engine payroll hari ini hanya mengenal upah **per jam**:

- `basic_salary = menit jam_kerja × rate_per_hour / 60` — pekerja yang pulang lebih awal otomatis menerima lebih sedikit. Tidak ada kolom "potongan telat"; potongannya *implisit* dari menit yang lebih sedikit.
- `overtime_salary` dihitung dari menit `lembur` melalui jenjang `overtime_tier_rules` (`HARI_KERJA`), dan **seluruh** jam pada tanggal libur aktif melalui jenjang `HARI_LIBUR`.
- BPJS karyawan dan PPh21 TER dipotong dari gross semua karyawan.

Perusahaan dengan kontrak "hadir = Rp 150.000 bersih, tanpa lembur" tidak bisa memakai sistem ini tanpa mengoreksi hasilnya manual setiap periode.

### 2. Persona

- **Pemilik usaha** — 60 pekerja harian. Kontrak: hadir sehari dibayar Rp 150.000 bersih, tanpa lembur. Pengeluaran wajib tepat `hari hadir × tarif`.
- **HRD/Payroll** — menekan *Generate Payroll Run* dan langsung mendapat angka siap transfer, tanpa Excel.

---

### 3. Goals & Non-Goals

#### Goals
- **G-1:** Tipe gaji baru `FLAT_DAILY` pada `salary_configs`, berdampingan dengan `HOURLY` (default, perilaku lama).
- **G-2:** `basic_salary = hari_hadir × daily_rate`. Durasi kerja tidak berpengaruh sama sekali.
- **G-3:** Untuk `FLAT_DAILY`: `overtime_salary = 0`, BPJS karyawan & perusahaan = 0, PPh21 = 0.
- **G-4:** *Zero regression* — angka karyawan `HOURLY` identik dengan sebelum perubahan.
- **G-5:** Slip menampilkan "N Hari × Rp X", tanpa baris lembur/BPJS/PPh.
- **G-6:** HRD bisa menerapkan `FLAT_DAILY` ke banyak karyawan sekaligus (semua / per divisi).

#### Non-Goals
- **NG-1:** Scanner tidak berubah. Jam masuk/pulang, `jam_kerja`, `lembur` tetap tercatat untuk audit disiplin.
- **NG-2:** Fitur lembur `HOURLY` tidak dihapus/dinonaktifkan.
- **NG-3:** Tidak ada BPJS/PPh21 untuk `FLAT_DAILY` di MVP. **Batasan yang disadari:** PPh21 pegawai tidak tetap harian bernilai 0 selama upah ≤ Rp 450.000/hari; tarif di atas itu secara aturan terkena PPh21 dan berada di luar cakupan MVP.
- **NG-4:** Tidak ada permission baru — memakai `payroll.config.manage` dan izin run yang sudah ada.
- **NG-5:** Tidak ada tabel, domain outbox, atau rute kanonik baru.

---

### 4. Keputusan Bisnis (dulu "Open Questions")

| # | Pertanyaan | Keputusan |
| :-- | :-- | :-- |
| D-1 | Sakit / Izin / Dispen dibayar? | **Tidak.** Hanya `status_kehadiran = 'Hadir'` (dan alias lama `'PRESENT'`) yang dibayar. Sakit, Izin, Dispen, Alfa = Rp 0. |
| D-2 | Batas minimum durasi? | **Tidak ada.** Berapa pun jamnya, termasuk lupa tap pulang (`jam_pulang` kosong, status tetap `Hadir`), dibayar 1 × tarif. |
| D-3 | Tunjangan digabung ke tarif atau terpisah? | **Terpisah.** Komponen yang `applies_to = id karyawan itu` tetap berlaku (kasbon, uang makan per orang). Komponen `applies_to = 'ALL'` **tidak** berlaku untuk `FLAT_DAILY`. |
| D-4 | BPJS & PPh21? | **Dilewati** (lihat NG-3). |
| D-5 | Dua sesi di tanggal yang sama (shift sendiri + sesi `PENGGANTI`)? | **Tetap 1 hari.** Dihitung per tanggal unik. |
| D-6 | Pengaturan 60 karyawan? | **Penerapan massal** di halaman Pengaturan Gaji (FR-05). |
| D-7 | Hadir di tanggal libur aktif? | 1 hari biasa × `daily_rate`, tanpa pengali `HARI_LIBUR`. |

---

### 5. Rumus

Untuk karyawan dengan konfigurasi `FLAT_DAILY`:

```
hari_hadir      = COUNT(DISTINCT ah.tanggal)
                  WHERE ah.status_kehadiran IN ('Hadir','PRESENT')
                    AND ah.tanggal BETWEEN period_start AND period_end
basic_salary    = hari_hadir × daily_rate                 -- integer × integer, tanpa pembulatan
overtime_salary = 0
allowance       = Σ komponen ALLOWANCE dengan applies_to = id_karyawan
deduction       = Σ komponen DEDUCTION dengan applies_to = id_karyawan
                  (PERCENTAGE dihitung dari basic_salary, pembulatan sama seperti HOURLY)
gross_salary    = basic_salary + allowance
bpjs_employee   = 0,  bpjs_company = 0,  pph21 = 0
net_salary      = max(0, gross_salary − deduction)
```

Konfigurasi yang dipakai adalah baris `salary_configs` dengan `effective_date` **terbesar yang ≤ `period_end`** (aturan yang sudah berlaku hari ini untuk `HOURLY`). Karyawan tanpa konfigurasi tetap `HOURLY` dengan tarif 0.

`total_regular_hours`, `total_overtime_hours`, dan jam libur tetap dihitung dan disimpan apa adanya untuk audit — hanya tidak dikonversi menjadi uang.

---

### 6. Functional Requirements

#### FR-01: Konfigurasi gaji per karyawan
- **FR-01.1:** Form menyediakan pilihan `salary_type`: `HOURLY` (Per Jam + Lembur) atau `FLAT_DAILY` (Harian Tetap).
- **FR-01.2:** `FLAT_DAILY` → input `daily_rate` wajib, bilangan bulat **1.000 – 10.000.000**; input `rate_per_hour` dinonaktifkan dan disimpan `0`.
- **FR-01.3:** `HOURLY` → `daily_rate` disimpan `0`; `rate_per_hour` bilangan bulat ≥ 0 (perilaku lama).
- **FR-01.4:** Validasi identik di Rust (`desktop_save_salary_config`) dan route Web (`config/salary`, skema Zod `.strict()` — hari ini route ini belum memakai Zod sama sekali). Yang divalidasi: `salary_type` enum persis, rentang `daily_rate`, `rate_per_hour ≥ 0`, `ptkp_status` ∈ 8 nilai CHECK, `effective_date` format `YYYY-MM-DD`. Nilai di luar itu ditolak **sebelum** menulis ke SQLite/outbox (aturan 43 — mencegah outbox macet permanen).

#### FR-02: Kalkulasi rekap
- **FR-02.1:** Query rekap (Rust `desktop_get_payroll_recap`, TS `computePayrollRecap`) menambah `sc.salary_type`, `sc.daily_rate`, dan `hari_hadir` (rumus §5).
- **FR-02.2:** Cabang `FLAT_DAILY` ditulis **satu kali per bahasa**:
  - Rust: satu fungsi di `engine.rs` yang dipanggil oleh rekap **dan** oleh `desktop_create_payroll_run` (yang hari ini menghitung ulang seluruh gaji secara terpisah).
  - TS: di `payroll-recap.ts`; route `runs` sudah memakai hasil rekap langsung.
- **FR-02.3:** Satu vektor uji yang sama dieja di `engine.rs` dan `payroll-calculator.test.ts` (pola `VEKTOR` yang sudah ada).
- **FR-02.4:** Jalur `HOURLY` tidak diubah sedikit pun.

#### FR-03: Pembekuan run (`payroll_items`)
- **FR-03.1:** Item `FLAT_DAILY` diisi: `salary_type='FLAT_DAILY'`, `daily_rate`, `days_present = hari_hadir`, `rate_per_hour=0`, `basic_salary`, `overtime_salary=0`, `total_overtime_index=0`, `total_holiday_overtime_index=0`, `total_allowances`, `total_deductions`, `bpjs_employee_total=0`, `bpjs_company_total=0`, `pph21_amount=0`, `gross_salary`, `net_salary` (rumus §5).
- **FR-03.2:** `breakdown_snapshot` memuat `salary_type`, `daily_rate`, `days_present`, dan komponen per-orang yang terpakai; `bpjs` dan `tax` kosong.
- **FR-03.3:** Alur status tidak berubah: `DRAFT → SUBMITTED → REVIEWED → APPROVED → PAID` (dan `REJECTED → DRAFT`).

#### FR-04: Tampilan
- **FR-04.1 Dashboard rekap & detail run** (`payroll/page.tsx`, `RunDetailClient.tsx`, `VirtualPayrollTable.tsx`): untuk baris `FLAT_DAILY`, kolom tarif tampil `Rp X / hari`, kolom jam tampil `N hari hadir` (jam aktual boleh tetap sebagai info sekunder), kolom lembur `–`.
- **FR-04.2 Slip** (`SlipGajiPrintView.tsx`, slip Mobile `SlipDetailClient.tsx`): baris "Upah Harian: N Hari × Rp X"; sembunyikan tarif per jam, lembur, BPJS, PPh21; komponen per-orang tetap tampil; **Total Diterima = `net_salary`**.
- **FR-04.3 Mobile:** halaman admin `mobile/src/app/payroll/*` adalah berkas terpisah (bukan salinan `sync:mobile`) dan wajib menerima perubahan FR-01, FR-04.1, FR-05 secara manual.

#### FR-05: Penerapan massal
- **FR-05.1:** Di halaman Pengaturan Gaji, aksi "Terapkan Flat Harian" dengan input: cakupan (**semua karyawan aktif** atau **satu divisi**), `daily_rate`, `effective_date`.
- **FR-05.2:** Sebelum menyimpan, tampilkan konfirmasi berisi jumlah karyawan yang terdampak.
- **FR-05.3:** Untuk setiap karyawan aktif dalam cakupan: upsert `salary_configs` pada `(id_karyawan, effective_date)` dengan `salary_type='FLAT_DAILY'`, `daily_rate`, `rate_per_hour=0`, dan `ptkp_status` **dipertahankan** dari konfigurasi terakhir karyawan itu (`'TK/0'` bila belum ada). Idempoten bila diulang.
- **FR-05.4:** Desktop/Mobile: seluruh baris + seluruh event outbox dalam **satu transaksi SQLite**, satu event per baris lewat rute kanonik yang **sudah ada** `("payroll","salary-config")`. Command baru wajib `require_permission(..., "payroll.config.manage")`. Web: satu `db.batch()`.
- **FR-05.5:** Hanya ke arah `FLAT_DAILY`. Mengembalikan karyawan ke `HOURLY` dilakukan per karyawan (tarif per jam berbeda tiap orang).

---

### 7. Data Model

#### 7.1 `salary_configs` — kolom baru
```sql
salary_type TEXT    NOT NULL DEFAULT 'HOURLY' CHECK (salary_type IN ('HOURLY','FLAT_DAILY'))
daily_rate  INTEGER NOT NULL DEFAULT 0        CHECK (daily_rate >= 0)
```
Kunci karyawan adalah `id_karyawan → master_data.id_unik`.

#### 7.2 `payroll_items` — kolom baru
```sql
salary_type  TEXT    NOT NULL DEFAULT 'HOURLY' CHECK (salary_type IN ('HOURLY','FLAT_DAILY'))
daily_rate   INTEGER NOT NULL DEFAULT 0 CHECK (daily_rate >= 0)
days_present INTEGER NOT NULL DEFAULT 0 CHECK (days_present >= 0)
```
Nama kolom yang sudah ada (bukan nama di v1.0): `payroll_run_id`, `overtime_salary`, `total_allowances`, `total_deductions`, `total_regular_hours`, `total_overtime_hours`.

Baris lama otomatis `HOURLY` lewat `DEFAULT` — tidak perlu backfill. Tidak ada `UNIQUE` baru (aturan 32).

#### 7.3 Titik sentuh skema & sinkronisasi (semuanya dalam satu perubahan)

| # | Lokasi | Yang dilakukan |
| :-- | :-- | :-- |
| 1 | `storage.rs` | Kolom di `CREATE TABLE` + `ensure_column` untuk database lama. |
| 2 | `turso.rs` — DDL | Kolom di `CREATE TABLE` + daftar `ensure_column`; sentinel `schema_migration` **-2013 → -2014** (INSERT dan `ensure_schema_current`). |
| 3 | `turso.rs` — handler push `("payroll","salary-config")` | Ikut menulis `salary_type`, `daily_rate` (termasuk di `ON CONFLICT DO UPDATE`). |
| 4 | `turso.rs` — handler push `("payroll","create-run")` | Ikut menulis `salary_type`, `daily_rate`, `days_present`. **Sekalian perbaiki bug lama:** handler ini tidak menulis `total_holiday_hours` & `total_holiday_overtime_index`, sehingga run dari Desktop kehilangan jam libur di cloud. |
| 5 | `sync.rs` — `ensure_unsynced_payroll_data_enqueued` | Payload `salary-config` & `create-run` disusun per kolom; kolom baru wajib ikut, kalau tidak konfigurasi flat terdorong ulang sebagai `HOURLY`. |
| 6 | `db-schema.ts` + `db-migrations.ts` | Kolom di `CREATE TABLE` + migrasi `hasColumn`/`ALTER TABLE`. |
| 7 | `payroll/models.rs` + `gateways/payroll.ts` + tipe TS | `SalaryConfig`, `PayrollRecapRow`, item run membawa kolom baru (IPC `camelCase`, aturan 38). |
| 8 | `mobile/src-tauri/src/mobile/payroll.rs` | Query slip pribadi membawa `salary_type`, `daily_rate`, `days_present`. |
| 9 | `bun run sync:mobile` | Menyalin bagian bersama (`src/lib`, modul Rust di daftar salin). |

`SNAPSHOT_SOURCES` memakai `SELECT *`, jadi kolom baru ikut ditarik tanpa perubahan daftar.

---

### 8. Edge Case

| Kasus | Perilaku |
| :-- | :-- |
| **EC-1** Lupa tap pulang | Status tetap `Hadir` dengan `jam_pulang` kosong → dibayar 1 hari (D-2). |
| **EC-2** Kerja 14 jam | `total_regular_hours`/`total_overtime_hours` tercatat untuk audit, `overtime_salary = 0`. |
| **EC-3** Dua baris di tanggal yang sama (sesi `PENGGANTI`, koreksi ganda) | `COUNT(DISTINCT tanggal)` → 1 hari (D-5). Catatan: `absensi_harian` **tidak** punya keunikan per (tanggal, karyawan); kuncinya `id_sesi`. |
| **EC-4** Pindah skema di tengah periode | Dipakai konfigurasi dengan `effective_date` terbesar ≤ `period_end` untuk **seluruh** periode. Rekomendasi operasional: ganti skema di awal periode. Prorata dua skema = di luar MVP. |
| **EC-5** Potongan per-orang > gaji | `net_salary = 0` (dibatasi `max(0, …)`, sama seperti `HOURLY`; CHECK `net_salary >= 0`). |
| **EC-6** Hari hadir 0 | `basic_salary = 0`; tunjangan FIXED per-orang tetap terhitung (perilaku sama dengan `HOURLY`). |
| **EC-7** Hadir di tanggal libur | 1 hari × `daily_rate` (D-7). |
| **FS-1** `salary_type` typo / `daily_rate` di luar rentang | Ditolak Rust & Zod sebelum menyentuh SQLite/outbox (FR-01.4). |
| **FS-2** Database lama belum punya kolom baru | `ensure_column` lokal & cloud menambahkannya; sentinel yang naik memaksa cloud lama ikut dimigrasi. |

---

### 9. Kriteria Penerimaan

1. Karyawan `FLAT_DAILY`, 20 tanggal `Hadir`, tarif 150.000, tanpa komponen per-orang → `basic = gross = net = 3.000.000`, lembur/BPJS/PPh = 0 — di Web, Desktop, dan Mobile.
2. Kasus 1 + tunjangan per-orang FIXED 200.000 + kasbon per-orang 500.000 → `gross = 3.200.000`, `net = 2.700.000`.
3. Komponen `applies_to='ALL'` tidak muncul pada slip `FLAT_DAILY`.
4. Satu tanggal dengan dua baris `Hadir` (NORMAL + PENGGANTI) → dihitung 1 hari.
5. Sakit/Izin/Dispen/Alfa → tidak menambah `days_present`.
6. Seluruh vektor uji `HOURLY` yang sudah ada tetap lulus tanpa diubah.
7. Penerapan massal ke satu divisi berisi N karyawan menghasilkan N baris `salary_configs` dan N event outbox dalam satu transaksi; diulang tidak menambah baris.
8. Konfigurasi & run `FLAT_DAILY` yang dibuat di Desktop terbaca identik di Web setelah sinkron, termasuk jam libur run `HOURLY` (perbaikan bug 7.3 #4).
9. `bun run check` penuh hijau (`audit:schema`, `audit:contract`, `audit:docs`, lint, typecheck, test, `cargo test` kedua workspace).

---

### 10. Fase Berikutnya (di luar MVP)

| Fitur | Fase |
| :-- | :-- |
| Filter dashboard berdasarkan tipe gaji | v2 |
| Komponen harian otomatis (uang makan × hari hadir) | v2 |
| PPh21 harian untuk tarif > Rp 450.000/hari | v2 |
| Prorata saat pindah skema di tengah periode | v2 |
| Upah setengah hari (*half-day rate*) | v3 |
