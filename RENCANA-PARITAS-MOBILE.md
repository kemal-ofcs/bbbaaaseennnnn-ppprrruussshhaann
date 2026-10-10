# Rencana Paritas Fitur Mobile — absensi-sppg & proyek sekolah

Disusun 2026-09-11. Tujuan: fitur yang ada di Web/Desktop tetapi belum ada di
aplikasi Android, untuk **dua proyek sekaligus**:

- **SPPG** — `E:\Freelance\absensi-sppg-app`
- **Proyek sekolah** — repo aplikasi sekolah (turunan SPPG, domain sekolah)

Legenda status: `[x]` selesai · `[~]` sedang dikerjakan · `[ ]` belum ·
`[-]` tidak berlaku · `⏸` menunggu keputusan User

> Berkas ini ada di root `absensi-sppg-app`, yang BUKAN repo git (repo-nya
> `web-desktop/` dan `mobile/` masing-masing). Ia tidak ikut ter-commit kecuali
> dipindahkan.

---

## A. Aturan kerja (disepakati 2026-09-11)

1. **Tulis sekali dengan standar paling ketat.** Kode di SPPG pun ditulis
   mengikuti 9 audit tambahan proyek sekolah, supaya porting tinggal menyesuaikan
   komponen, bukan menulis ulang logika:
   - `page-guard` — halaman privat menolak pengguna yang tidak BERHAK, bukan
     hanya yang belum login.
   - `ui-guard` — setiap mutasi gateway dijaga `isSubmittingRef = useRef(false)`.
   - `a11y` — setiap `input`/`select`/`textarea` punya label (`htmlFor`,
     `aria-label`, atau label pembungkus). `placeholder` bukan label.
   - `dialog` — memakai `<Modal>`, bukan overlay `fixed inset-0` buatan tangan.
   - `confirm` — tidak ada `window.confirm`/`alert`/`prompt`.
   - `silent-catch` — `catch` yang mendiamkan error wajib memberi alasan tertulis.
   - `list-bound` — daftar dari tabel yang tumbuh harian wajib dibatasi.
   - `sql`, `route-guard` — relevan bila menyentuh SQL/route handler.
2. **Urutan per butir:** SPPG → `bun run check:quick` SPPG → uji di HP →
   port ke proyek sekolah → `bun run check:quick` proyek sekolah → uji di HP.
3. **Saat porting ke proyek sekolah, pakai halaman proyek sekolah sendiri sebagai dasar**, bukan
   salinan berkas SPPG. Berkas yang sudah menyimpang: `Modal` mobile (punya prop
   `footer`), `access.ts`, `rbac/catalog.ts`, Pengaturan mobile, Riwayat web,
   `lib.rs`/`commands.rs` mobile. proyek sekolah juga punya `useConfirmDialog` dan
   `assertTersediaDiMobile` yang tidak ada di SPPG.
4. **Hanya berkas milik mobile** (`mobile/src/app`, `mobile/src/components`).
   Bila `src/lib` harus berubah: edit asli di `web-desktop`, lalu jalankan
   `sync-frontend-lib.ts` / `sync-rust-modules.ts`. Salinan tidak diedit langsung.
5. **Tanpa perubahan skema, tabel snapshot, atau rute sync kanonik** kecuali
   butirnya menyebut sebaliknya.
6. **Command Rust baru** hanya bila tertulis di butirnya: awalan `mobile_`,
   ditaruh di modul di luar daftar salin (`share.rs` dst.), dipanggil di dalam
   `if (isMobileRuntime()) { … }` (guard POSITIF).
7. **Commit dilakukan User.** proyek sekolah punya perubahan belum di-commit
   (time-policy, skema, migrasi, sync — ±15 berkas). Jangan menimpa atau
   merapikan berkas-berkas itu; butir yang harus menyentuhnya ditunda dan
   dilaporkan dulu.
8. Pemeriksaan izin mengikuti Web persis; backend Rust tetap memeriksa ulang.
   Izin di `SENSITIVE_MUTATION_PERMISSIONS` ditandai 🔒 di bawah.

---

## B. Ringkasan status

| # | Fitur | SPPG | proyek sekolah | Rust baru? | Risiko |
|---|---|:-:|:-:|:-:|---|
| 0.1 | Riwayat: edit absensi harian + hapus log scan | [x] | [x] | – | sedang |
| 0.2 | Master Operator (operator, role, reset 2FA) | [x] | [x] | – | sedang |
| 1.1 | Hari Libur + Whitelist Shift/Divisi | [x] | [x] | – | rendah |
| 1.2 | Hapus massal Foto Absensi & Riwayat Reset Password | [x] | [x] | – | sedang |
| 1.3 | Dashboard: rekap bulanan + 10 terajin | [x] | [x] | – | rendah |
| 1.4 | Pengaturan: profil perusahaan, nama aplikasi, keamanan scanner, sinkron ulang | [x] | [x] | – | sedang |
| 1.5 | Karyawan: generate token massal + impor Excel | [x] | [x] | – | sedang |
| 2.1 | Simpan berkas lewat dialog SAF Android | [x] | [x] | **ya** | sedang |
| 2.2 | Ekspor CSV/Excel di Riwayat | [x] | [x] | (pakai 2.1) | rendah |
| 3.1 | ID Card (tab daftar & status cetak) | [x] | [x] | – | sedang |
| 3.2 | Admin Payroll (diputuskan: ADMIN PENUH) | [x] | [x] | **ya** | tinggi |
| 4.1 | Desktop: kunci Kode Operator & Username saat edit | [x] | [x] | – | rendah |
| 5.1 | Akademik: CRUD master akademik | [-] | [x] | – | sedang |
| 5.2 | Bimbingan Konseling: kelola kasus & sesi | [-] | [x] | – | **tinggi** |
| 5.3 | Presensi Kelas: detail & hapus sesi | [-] | [x] | – | sedang |
| 5.4 | Notifikasi WA: konfigurasi & batalkan antrean | [-] | [-] dibatalkan User | **ya** | tinggi |

Urutan yang disarankan: uji 0.x → 1.1 → 1.2 → 1.3 → 1.4 → 1.5 → 2.1 → 2.2 →
5.3 → 5.1 → 5.2 → 4.1 → keputusan 3.x & 5.4.

---

## C. Rincian per butir

Semua command di bawah **sudah diperiksa terdaftar** di `mobile/src-tauri/src/lib.rs`
proyek yang bersangkutan, kecuali ditulis sebaliknya.

### Fase 0 — Sudah dikerjakan di SPPG

#### 0.1 Riwayat: edit absensi harian + hapus log scan
- SPPG: [mobile/src/app/history/page.tsx](mobile/src/app/history/page.tsx)
- Command: `desktop_update_attendance`, `desktop_delete_log_scan`
- Izin: `history.edit` 🔒, `history.delete` 🔒
- Uji HP: edit jam shift biasa & shift malam; ubah status ke Sakit/Izin (jam
  harus dikosongkan backend); hapus log; pastikan perubahan sampai ke
  Desktop/Web setelah sinkron; akun tanpa izin tidak melihat tombolnya.
- Catatan port proyek sekolah: kolom tanggal & pencarian di halaman Riwayat mobile SPPG
  belum berlabel — di proyek sekolah pakai halaman Riwayat mobile proyek sekolah sebagai dasar
  agar lolos `a11y`.

#### 0.2 Master Operator
- SPPG: [mobile/src/app/operators/page.tsx](mobile/src/app/operators/page.tsx) +
  kartu tautan di Pengaturan
- Command: `desktop_get_master_operators`, `desktop_create_operator`,
  `desktop_update_operator`, `desktop_delete_operator`, `desktop_get_roles`,
  `desktop_create_role`, `desktop_update_role`, `desktop_set_role_permissions`,
  `desktop_delete_role`, `desktop_admin_disable_two_factor`,
  `desktop_get_scan_security`
- Izin: hanya Superadmin (sama dengan Web); reset 2FA butuh `two_factor.reset` 🔒
- Uji HP: tambah/edit/hapus operator; buat role + centang permission; edit role
  Superadmin (hanya dua sakelar absensi yang tersimpan); login non-Superadmin
  tidak melihat kartunya.
- Catatan: Kode Operator & Username dikunci saat edit karena jalur Tauri memang
  tidak menyimpannya (lihat 4.1).

### Fase 1 — Hanya UI, backend sudah ada

#### 1.1 Hari Libur + Whitelist Shift/Divisi
- Baru: `mobile/src/app/holidays/page.tsx`, `mobile/src/components/HolidayWhitelistPanel.tsx`
  (komponen Web tidak ikut disalin sync); tautan di Pengaturan.
- Sumber Web: `web-desktop/src/app/holidays/page.tsx` (668 baris SPPG / 684 proyek sekolah),
  `HolidayWhitelistPanel.tsx` (identik di kedua proyek).
- Command: `desktop_get_holidays`, `desktop_create_holiday`,
  `desktop_update_holiday`, `desktop_delete_holiday`,
  `desktop_get_holiday_whitelist`, `desktop_create_holiday_whitelist`,
  `desktop_update_holiday_whitelist`, `desktop_delete_holiday_whitelist`
- Izin: `holidays.view`, `holidays.manage`
- Aturan domain yang wajib dijaga UI: whitelist disimpan sebagai `kode_shift` &
  NAMA divisi (bukan `id_shift`); daftar KOSONG = semua scan di hari libur
  ditolak; `tanggal_libur` kosong = berlaku untuk semua hari libur.
- Uji HP: tambah libur → scan ditolak; tambah whitelist shift → scan shift itu
  diterima; sinkron ke Desktop.

#### 1.2 Hapus massal Foto Absensi & Riwayat Reset Password
- Ubah: `mobile/src/app/foto-absensi/page.tsx`, `mobile/src/app/riwayat-reset-password/page.tsx`
- Command: `desktop_purge_attendance_photos`, `desktop_purge_password_reset_history`
- Izin: `attendance_photo.delete` 🔒, `password_reset.delete` 🔒
- Wajib: dialog konfirmasi yang menyebut batas umur data (`PURGE_DAYS` Web) dan
  apa yang TETAP ada (baris `absensi_harian`/`log_scan` tidak tersentuh).

#### 1.3 Dashboard: rekap bulanan + 10 karyawan terajin
- Ubah: `mobile/src/app/dashboard/page.tsx` (SPPG 282 / proyek sekolah 324 baris)
- Command: `desktop_get_dashboard_data` jenis `monthly` & `top` (didukung
  `administration.rs` mobile)
- Izin: `dashboard.view`
- Tampilan 2D saja. Tidak memasang kanvas WebGL (aturan satu konteks WebGL &
  perangkat Android kelas menengah).
- Kegagalan muat WAJIB tampil sebagai pesan, bukan daftar kosong (`silent-catch`).

#### 1.4 Pengaturan: profil perusahaan, nama aplikasi, keamanan scanner, sinkron ulang
- Baru: komponen terpisah di `mobile/src/components/settings/*` (halaman
  Pengaturan mobile sudah 1.483 baris SPPG / 1.697 proyek sekolah).
- Command: `desktop_get_company_profile`, `desktop_update_company_profile`,
  `desktop_get_app_display_name`, `desktop_update_app_display_name`,
  `desktop_get_scanner_settings`, `desktop_update_scanner_settings`,
  `desktop_force_resync_settings`
- Izin: `branding.manage`, `settings.manage` (mengikuti Web)
- Profil perusahaan punya 5 bagian (info utama, logo & TTD, kontak & alamat,
  pimpinan, ketentuan kartu) dengan unggah gambar — uji pemilih berkas di
  WebView Android.
- Periksa dulu: apakah proyek sekolah sudah memindahkan sebagian dari ini ke Pengaturan
  mobile-nya (berkasnya +214 baris dibanding SPPG).

#### 1.5 Karyawan: generate token massal + impor Excel
- Ubah: `mobile/src/app/karyawan/page.tsx`
- Command: `desktop_generate_employee_tokens`, `desktop_import_employees`
- Helper sudah ada di mobile: `readEmployeeWorkbook`, `downloadEmployeeTemplate`
  (`src/lib/client/employee-workbook.ts`)
- Izin: `employees.manage`
- Wajib: konfirmasi sebelum menulis massal, ringkasan hasil (berhasil/gagal per
  baris). Unduh template bergantung pada 2.1 — sebelum 2.1 selesai, tombol
  template disembunyikan di Android.

### Fase 2 — Command Rust baru khusus Mobile

#### 2.1 Simpan berkas lewat dialog "Simpan ke…" Android (SAF)
- Baru: `mobile_save_file_to_device(filename, base64Data, mime)` di
  `mobile/src-tauri/src/mobile/share.rs`, memakai ulang `simpan_ke_perangkat`
  (dijadikan generik: mime & kode error). Daftarkan di `lib.rs`.
- Ubah: `web-desktop/src/lib/client/download.ts` → cabang
  `if (isMobileRuntime()) { … }` sebelum jalur `desktop_save_file`; salin ke
  mobile lewat sync.
- Alasan: jalur sekarang (`desktop_save_file`) menulis ke folder Unduhan, yang
  ditolak Android 10+.
- **Dampak luas** — seluruh unduhan di Android ikut pindah jalur: PNG ID card,
  QR fullscreen, template Excel karyawan, ekspor Excel. Semuanya diuji ulang.
- Pengguna menutup dialog = PEMBATALAN (`cancelled: true`), bukan kegagalan.
- Uji: `cargo test` (jalur non-Android mengembalikan error "tidak didukung"),
  `audit:contract`, uji di HP.

#### 2.2 Ekspor CSV/Excel di Riwayat
- Ubah: `mobile/src/app/history/page.tsx` — tombol ekspor memakai
  `exportToCsv`/`exportToExcel` (sudah ada di `lib/client/excel-export.ts`).
- Bergantung pada 2.1.

### Fase 3 — Menunggu keputusan User

#### 3.1 ID Card ⏸
- Web: 3 tab (daftar & cetak; visual template builder; layout kertas & cetak).
- Usulan: port hanya **daftar kartu + ubah status cetak + bagikan per kartu**.
  Template builder & tata letak kertas tetap Desktop.
- Command: `desktop_get_id_cards`, `desktop_update_id_card`
- proyek sekolah: sertakan **backfill kartu pelajar** (`desktop_backfill_id_cards`,
  sudah terdaftar di mobile proyek sekolah).

#### 3.2 Admin Payroll — RENCANA TEKNIS (keputusan User: admin penuh)

Fakta hasil riset (SPPG, 2026-09-11):
- Data payroll (`salary_configs`, `payroll_components`, `overtime_tier_rules`,
  `tax_rules`, `bpjs_rules`, `payroll_runs`, `payroll_items`,
  `payroll_audit_logs`) SUDAH ada di `SNAPSHOT_TABLES` → sudah tersinkron ke HP.
- Command admin desktop (23 buah, `desktop/payroll/{commands,engine,models}.rs`,
  ±2.200 baris) menulis SQLite lokal + outbox dengan rute kanonik `payroll/*`
  yang SUDAH dipahami `sync.rs` mobile. Dependensinya hanya `config`, `models`,
  `storage`, `sync` — semuanya ada padanannya di mobile.
- 10 modul Rust bersama SPPG saat ini SINKRON sempurna dengan salinannya.
- `mobile/payroll.rs` (baca-saja, `mobile_*`) punya salinan `PayrollCalculator`
  sendiri — drift yang sudah ada, TIDAK disentuh di butir ini.

Pendekatan: **satu sumber kebenaran untuk uang** — modul desktop DISALIN oleh
skrip, tidak ditulis ulang tangan.
- A1. Perluas `mobile/scripts/sync-rust-modules.ts`: salin
  `desktop/payroll/{mod,commands,engine,models}.rs` → `mobile/payroll_admin/`
  dengan transformasi yang sama (`Desktop*`→`Mobile*`, `crate::desktop`→
  `crate::mobile`). Nama `payroll_admin` karena `payroll.rs` mobile sudah dipakai.
- A2. `mobile/mod.rs`: `pub mod payroll_admin;` — daftarkan 23 command di
  `lib.rs`, `build.rs`, `capabilities/default.json`. Gateway `payroll.ts` tidak
  berubah (sudah memanggil `desktop_*`).
- A3. Hapus 23 nama dari `expectedMobileOnlyUnregisteredCommands` di
  `audit-sync-contract.ts` (audit menolak daftar pengecualian yang basi).
- A4. `cargo test` + `cargo check --target aarch64-linux-android`.
- B1. Halaman Payroll mobile: tombol "Buat payroll run" (izin `payroll.run.create`).
- B2. Daftar payroll run + detail, termasuk transisi status review/approve/
  disburse sesuai izin, dan jejak audit.
- B3. Konfigurasi gaji per karyawan + komponen payroll (`payroll.config.manage`).
- B4. Aturan lembur, pajak (PPh 21), dan BPJS (`payroll.config.manage`).
- C. Dokumen: CLAUDE.md & referensi aturan masih menyebut "mobile tidak punya
  command administrasi payroll" — diperbarui.
- D. Port ke proyek sekolah: modul payroll proyek sekolah & berkas Rust proyek sekolah yang sedang Anda
  kerjakan diperiksa paritasnya dulu sebelum skrip dijalankan di sana.

Status (2026-09-11): A, B1–B4, C selesai di SPPG; D (port proyek sekolah) selesai.
- Rute mobile baru: `/payroll/runs`, `/payroll/runs/detail?id=…`,
  `/payroll/config`, `/payroll/config/overtime-rules`, `/payroll/config/tax-rules`,
  `/payroll/config/bpjs-rules` — jalurnya sama dengan Web.
- Komponen: `mobile/src/components/payroll/RunStatusBadge.tsx`,
  `mobile/src/components/payroll/ConfigShared.tsx`.
- Pintu masuk: bagian "Administrasi Payroll" di `/payroll` (izin `payroll.view`;
  tautan konfigurasi hanya untuk `payroll.config.manage`).
- Uji HP: buat batch (estimasi → DRAFT) → ajukan → review → setujui → bayar
  dengan akun berbeda sesuai izin; tolak lalu kembalikan ke DRAFT; buka slip
  dari rincian batch; atur rate gaji (termasuk rate tanggal berlaku yang sama),
  komponen, tier lembur, lapisan PPh 21, program BPJS; pastikan semuanya
  tersinkron ke Desktop dan angka batch yang dibuat di HP = di Desktop.

Temuan backend saat mengerjakan 3.2 — **SEMUA sudah diperbaiki** (lihat log
"temuan #1–#8"); daftar dipertahankan sebagai catatan:
1. `mobile_get_payroll_slip_detail` (`mobile/payroll.rs`) tidak memeriksa izin
   apa pun; satu-satunya penghalang adalah penjaga halaman di UI.
2. Web menampilkan tombol Tolak untuk pemegang `payroll.run.approve`, padahal
   backend menuntut `payroll.run.review` — tombolnya gagal saat ditekan.
3. `save_salary_config` & `save_bpjs_rule` (Rust) memakai `ON CONFLICT` pada
   kunci alami (karyawan+tanggal / kode) tetapi mengantrekan sinkronisasi
   dengan id BARU → id di perangkat dan di cloud bisa berbeda untuk baris yang
   sama. Mobile menghindarinya di UI; Desktop/Web belum.
4. Id baru dibuat dari detik epoch (`sc-…`, `comp-…`, `ot-…`, `tax-…`,
   `bpjs-…`): dua perangkat yang menyimpan pada detik yang sama menghasilkan id
   sama dan saling menimpa saat sinkron.
5. Desktop: mengubah tanggal berlaku rate yang sudah ada selalu gagal
   (`SAVE_FAILED`) — konflik di PK `id`, bukan di target `ON CONFLICT`.
   Mobile mengunci kolomnya.
6. Web BPJS menandai kode berisi "PEKERJA" sebagai potongan pekerja, sedangkan
   engine hanya mengenali akhiran `_EMP` — labelnya bisa berkebalikan dengan
   hitungan.
7. `mobile/payroll.rs` masih punya salinan `PayrollCalculator` sendiri (drift).
8. **SPPG tertinggal dari proyek sekolah di modul payroll Desktop** (ditemukan saat D):
   proyek sekolah sudah (a) menyaring `tax_rules`/`bpjs_rules` berdasarkan
   `effective_date` yang berlaku di akhir periode — SPPG membaca seluruh tabel,
   sehingga tarif bertanggal masa depan atau generasi tarif ganda ikut
   terpakai; dan (b) menghitung upah pokok dari MENIT mentah
   (`wage_from_minutes`) — SPPG membaca ulang jam `f64`, sehingga angka yang
   dibekukan batch bisa selisih Rp1 dari pratinjau pada nilai tengah
   pembulatan. Karena Mobile menyalin modul Desktop, perbaikan di
   `web-desktop` SPPG otomatis ikut ke HP setelah skrip dijalankan.

#### 3.2 (catatan awal, sebelum keputusan)
- Mobile tidak punya command konfigurasi gaji, aturan pajak/BPJS/lembur, dan
  payroll run. Menambahkannya = perubahan arsitektur (wajib persetujuan).
- Usulan: tetap khusus Desktop; paling jauh daftar payroll run read-only.

### Fase 4 — Perbaikan Desktop

#### 4.1 Kunci Kode Operator & Username saat edit (Desktop)
- Masalah: di Desktop kedua kolom bisa diketik, tetapi `update_operator` (Rust)
  tidak menyimpannya — perubahan dibuang diam-diam. Web menyimpannya.
- Usulan: kunci kolomnya bila `isDesktopRuntime()` di
  `web-desktop/src/app/operators/page.tsx`. Mengubah backend lebih berisiko
  karena `kode_operator` juga tercatat di `log_scan` & `koreksi_admin`.

### Fase 5 — Khusus proyek sekolah (fitur sekolah)

Halaman-halamannya SUDAH ada di mobile proyek sekolah, tetapi hanya bisa membaca.

#### 5.1 Akademik: CRUD master akademik
- Ubah: `mobile/src/app/akademik/page.tsx` (338 baris; Web 1.305)
- Sekarang mobile hanya: daftar tahun ajaran/jurusan/rombel/mapel + aktifkan
  tahun ajaran.
- Ditambah: simpan & hapus tahun ajaran, jurusan, rombel, mapel; daftar, simpan
  & hapus penugasan guru.
- Command: `desktop_save_academic_year|department|class|subject|assignment`,
  `desktop_delete_academic_*`, `desktop_get_academic_assignments`
- Izin: `academic.manage`
- Risiko: data master dipakai Presensi Kelas & Jurnal. Pastikan pesan penolakan
  backend (data masih dipakai) tampil jelas.

#### 5.2 Bimbingan Konseling: kelola kasus & sesi
- Ubah: `mobile/src/app/bimbingan-konseling/page.tsx` (471 baris; Web 1.527)
- Sekarang mobile: daftar kasus, detail, tambah sesi.
- Ditambah: buat kasus, ubah status kasus, hapus kasus, hapus sesi.
- Command: `desktop_create_counseling_case`, `desktop_update_counseling_case`,
  `desktop_delete_counseling_case`, `desktop_delete_counseling_session`
- Izin: `counseling.manage`, `counseling.delete` 🔒
- **Cloud-only** (`bk_kasus`/`bk_sesi` tidak pernah ada di SQLite). Tanpa
  jaringan harus tampil pesan yang menjelaskan, bukan daftar kosong. JANGAN
  menambahkan cache lokal — catatan kedisiplinan anak tidak boleh tersimpan di
  perangkat.

#### 5.3 Presensi Kelas: detail & hapus sesi
- Ubah: `mobile/src/app/presensi-kelas/page.tsx` (890 baris; Web 1.465)
- Ditambah: lihat detail sesi (per siswa), hapus sesi.
- Command: `desktop_get_class_attendance_detail`, `desktop_delete_class_attendance`
- Izin: `class_attendance.delete` 🔒

#### Temuan backend proyek sekolah saat Fase 5 — **sudah diperbaiki** (log "temuan A–C")
1. Tabel `akademik_*` tidak punya foreign key; `delete_academic_*` menghapus
   baris yang masih dipakai siswa/penugasan/sesi presensi tanpa penolakan.
   Mobile memeriksa pemakaian dulu; Web belum.
2. Web membuat tahun ajaran baru dengan `is_aktif: 1` sebagai bawaan →
   "Tambah" diam-diam mengganti tahun ajaran aktif seluruh sekolah.
3. Menghapus sesi presensi kelas meninggalkan `jurnal_mengajar` yatim (tidak
   tampil lagi karena daftar jurnal memakai JOIN ke `presensi_mapel`).

#### 5.4 Notifikasi WA: konfigurasi gateway & batalkan antrean ⏸
- Command `desktop_get_wa_config`, `desktop_save_wa_config`,
  `desktop_cancel_wa_notification` **TIDAK terdaftar** di mobile proyek sekolah, dan
  `getWaConfigGateway` sengaja dijaga `assertTersediaDiMobile`.
- Bisa dibuka hanya dengan command `mobile_*` baru yang membaca/menulis CLOUD
  (pola `mobile_list_wa_notifications`). Konfigurasi menyimpan kunci API
  penyedia — sama sensitifnya dengan `app_mail_config`.
- Izin: `notification.manage`, `notification.delete` 🔒
- Usulan: tunda; bila diperlukan, mulai dari "batalkan antrean" saja.

---

## D. Sengaja tidak dikerjakan

- `/forbidden` — mobile menampilkan "Akses Dibatasi" langsung di tiap halaman.
- `exportDatabase` biasa — mobile memakai `exportDatabaseToDevice` (SAF).
- Hapus absensi harian — Web juga tidak menampilkan tombolnya.
- `getWebProvisioningHint` (proyek sekolah) — khusus Web; Desktop/Mobile punya layar
  provisioning sendiri.

## E. Log pengerjaan

| Tanggal | Proyek | Butir | Catatan |
|---|---|---|---|
| 2026-09-11 | SPPG | 0.1, 0.2 | Selesai; `check:quick` lolos. Belum diuji di HP. |
| 2026-09-11 | SPPG | 0.2 | Tambah `isSubmittingRef` di 4 aksi halaman Operator; lint + tsc lolos. |
| 2026-09-11 | SPPG | 1.1 | Baru: `mobile/src/app/holidays/page.tsx`, `mobile/src/components/HolidayWhitelistPanel.tsx`; kartu "Hari Libur & Whitelist" di Pengaturan (izin `holidays.view`). `check:quick` lolos. Belum diuji di HP. |
| 2026-09-11 | SPPG | 0.1, 0.2 | Diseragamkan dengan proyek sekolah: penjaga halaman berbentuk redirect (`router.replace`) di Riwayat (→ `/dashboard`) dan Operator (→ `/settings`); `aria-label` pada kolom tanggal & cari di Riwayat. |
| 2026-09-11 | SPPG | 1.2 | Tombol "Bersihkan > 90 hari" + konfirmasi (menyebut apa yang TETAP ada) di `foto-absensi` & `riwayat-reset-password` mobile. Ikut dibawa perbaikan yang sudah ada di proyek sekolah: `isSubmittingRef` (hapus, setujui, bersihkan), penjaga redirect ke `/dashboard`, dan 3 overlay buatan tangan di Riwayat Reset Password diganti `<Modal>` (tombol di badan dialog karena Modal SPPG belum punya prop `footer`). 7 audit proyek sekolah bersih; `check:quick` lolos. Belum diuji di HP. Catatan port proyek sekolah: kedua halaman proyek sekolah sudah punya perbaikan itu — cukup tambahkan tombol + dialog bersihkan (pakai `footer`). |
| 2026-09-11 | SPPG | 1.3 | Baru: `mobile/src/components/dashboard/DashboardInsights.tsx` (tab "Rekap Bulan Ini" dengan ringkasan + cari/urut + kartu bertahap 20-an, dan "Peringkat Terajin" 10 teratas, 2D tanpa WebGL), dipasang di dasbor untuk izin `dashboard.view`. Perbaikan ikut: `catch` diam di dasbor kini menampilkan pesan (dibawa dari proyek sekolah); riwayat scan terbaru hanya dimuat/tampil untuk `home.view` (izin yang dituntut backend) supaya akun tanpa izin itu tidak melihat pesan error. Peringkat dihitung dari SELURUH riwayat, sama dengan Web — labelnya menyebut itu. 7 audit proyek sekolah bersih; `check:quick` lolos. Belum diuji di HP. Catatan port proyek sekolah: dasbor proyek sekolah sudah punya `loadError`; tambahkan `DashboardInsights` + gating `home.view`. |
| 2026-09-11 | SPPG | 1.4 | Baru: `mobile/src/components/settings/CompanyProfileCard.tsx` (izin `settings.manage`; ringkasan + Modal formulir 5 bagian: nama aplikasi, instansi, logo & TTD dengan optimasi gambar yang sama dengan Web, kontak, pimpinan, ketentuan kartu; memperbarui cache nama/logo) dan `ScannerSafetyCard.tsx` (khusus Superadmin). Logo cukup satu tempat karena "Logo aplikasi" Web menulis kolom yang sama (`company_profile.logo_url`). Tombol "Kirim ulang pengaturan lokal" ditaruh di `/sync` (izin `sync.view`); teksnya menyebut isi sebenarnya dari `force_enqueue_settings` (Shift, Profil Instansi, Template ID Card, Hari Libur, Pengaturan Sistem) — tooltip Web hanya menyebut dua. Perbaikan dari proyek sekolah ikut dibawa: `/sync` dijaga `sync.view` + 3 `catch` diam diberi pesan; kartu pintasan `/sync` di Pengaturan dijaga `sync.view`; Pengaturan: `isSubmittingRef` di 5 handler, sakelar geofence dikembalikan bila simpan gagal, alasan tertulis di `catch` geofence, `aria-label` textarea IP & radius. 7 audit proyek sekolah bersih; `check:quick` lolos. Belum diuji di HP. Catatan port proyek sekolah: Pengaturan & `/sync` proyek sekolah sudah punya perbaikan itu (proyek sekolah memakai area `sync` di `access.ts`); cukup pasang 2 kartu + tombol kirim ulang. |
| 2026-09-11 | SPPG | 1.5 | Baru: `mobile/src/components/karyawan/EmployeeBulkActions.tsx` di halaman Karyawan (izin `employees.manage`). Impor menerima .xlsx/.csv, berkas divalidasi penuh di perangkat lebih dulu (kolom wajib, format baris, duplikat, maks 500) lalu tampil pratinjau + konfirmasi sebelum ditulis; baris yang ID/kodenya sudah ada dilewati, tidak ditimpa. Generate QR Massal pakai konfirmasi yang menjelaskan token yang sudah ada tidak berubah (dicek di `generate_employee_tokens`: hanya yang kosong/belum Generated). Unduh template & ekspor Excel sengaja ditunda ke 2.1; sebagai gantinya ada petunjuk format kolom. Ikut: `aria-label` kolom cari (dari proyek sekolah) dan teks kosong yang tidak lagi menyuruh ke Desktop. 7 audit proyek sekolah bersih; `check:quick` lolos. Belum diuji di HP (terutama pemilih berkas .xlsx di WebView Android). |
| 2026-09-11 | SPPG | 2.1 | Command baru `mobile_save_file_to_device(filename, base64Data, mimeType?)` di `mobile/src-tauri/src/mobile/share.rs`: di Android membuka dialog "Simpan ke…" (SAF, `android_fs_async`), balasan `savedToDevice:false` = dibatalkan; di non-Android (iOS/host) tetap diteruskan ke `save_desktop_file` seperti sebelumnya. Inti dialog dijadikan satu fungsi (`tulis_lewat_dialog`) yang juga dipakai cadangan database — perilaku cadangan tidak berubah (mime & kode error sama). Didaftarkan di `lib.rs`, `build.rs` (MOBILE_COMMANDS) dan `capabilities/default.json` (ACL — ditangkap `audit:contract`). `web-desktop/src/lib/client/download.ts`: cabang `if (isMobileRuntime())` di `downloadDataUrl` (satu-satunya pemanggil `desktop_save_file`), disalin ke mobile lewat `sync-frontend-lib.ts` (lib kedua workspace dicek identik dulu; hanya berkas ini yang berubah). Pembatalan kini ditangani di pratinjau ID Card, layar QR, dan cadangan `shareDataUrl` (sebelumnya menutup dialog akan tampil "berhasil"; QR juga tidak lagi menulis "Tersimpan di Download!"). Tes Rust baru: `mime_berkas`, `nama_berkas_aman`. `cargo check --target aarch64-linux-android` bersih (sempat menangkap error lifetime `&'static str` yang tidak terlihat di build host). |
| 2026-09-11 | SPPG | 2.2 + 1.5 | Riwayat mobile: tombol Ekspor CSV/Excel untuk tab aktif sesuai filter; kolom disalin setia dari `getExportData` Web (`mobile/src/app/history/history-export.ts`). Karyawan: "Unduh template" & "Ekspor Excel (N)" kini aktif di `EmployeeBulkActions`. `bun run check` (termasuk cargo test kedua workspace) lolos; 7 audit proyek sekolah bersih. Belum diuji di HP. Catatan port proyek sekolah: `share.rs` proyek sekolah berbeda isinya — tambahkan command dengan pola yang sama + daftarkan di `lib.rs`/`build.rs`/capabilities; `download.ts` proyek sekolah identik dengan SPPG sebelum perubahan ini. |
| 2026-09-11 | SPPG | 0.1/2.2 perbaikan | Riwayat mobile hanya memuat 200 log scan terbaru per hari (bawaan `limit` backend 200, maks 500) — daftar DAN ekspor terpotong diam-diam di instansi besar. Kini tab log scan mengambil semua halaman (500/permintaan, pagar 40 halaman). Rekap harian SPPG tanpa batas untuk satu tanggal, jadi tidak terdampak. `check:quick` lolos. |
| 2026-09-11 | proyek sekolah | port 0.1–2.2 | Baseline `check:quick` proyek sekolah dijalankan DULU (hijau semua) sebelum port. Berkas baru disalin (operators, holidays, HolidayWhitelistPanel, DashboardInsights, CompanyProfileCard, ScannerSafetyCard, EmployeeBulkActions, history-export). Halaman yang sudah punya kekhasan proyek sekolah disunting tertarget: riwayat-reset-password (dialog bersihkan memakai prop `footer` Modal proyek sekolah), sync (hanya tombol kirim ulang; penjaga area `sync` proyek sekolah dipertahankan), dashboard (tautan Jurnal Mengajar dipertahankan), settings (4 kartu baru + pintasan `/sync` dijaga area `sync`). Riwayat: tab rekap harian JUGA mengambil semua halaman karena backend proyek sekolah membatasinya (2.000/permintaan). `share.rs` proyek sekolah = versi SPPG + nama `mobile_share_file`; didaftarkan di `lib.rs`/`build.rs`/capabilities. `download.ts` diganti di web-desktop lalu disalin via `sync-frontend-lib.ts` proyek sekolah (hanya berkas itu yang berubah). Placeholder email operator mengikuti web proyek sekolah (`operator@sppg.id`). Tidak ada berkas dari pekerjaan Anda yang belum di-commit yang tersentuh. `check:quick` proyek sekolah lolos (9 audit hijau, 169 command mobile). Belum diuji di HP. |
| 2026-09-11 | proyek sekolah | perbaikan | APK proyek sekolah tidak bisa dipasang ("paket tidak valid"): build release TANPA tanda tangan (`app-universal-release-unsigned.apk`, `apksigner`: DOES NOT VERIFY). Penyebab: `gen/android` dibuat ulang oleh `tauri android init` setelah identifier diganti; template Tauri tidak memasang `signingConfig`, dan `scripts/patch-android-release.ts` hanya menjaga R8. Perbaikan: skrip itu kini juga memasang `signingConfig = signingConfigs.getByName("debug")` (sama dengan SPPG) bila belum ada, lalu memverifikasinya; `gen/android` sudah ditambal. APK 10/09 ditandatangani ulang → `app-universal-release-signed-debug.apk` (lolos verifikasi v2/v3) — versi LAMA, belum memuat 47 berkas yang berubah sesudahnya. Catatan: SPPG belum punya skrip penjaga ini; `gen/android` SPPG aman selama tidak dibuat ulang. Beda lain yang belum disentuh: `usesCleartextTraffic` default proyek sekolah `false`, SPPG `true`. |
| 2026-09-11 | SPPG+proyek sekolah | 3.1 | Keputusan User: cakupan 'Daftar + status'. Baru: `mobile/src/app/id-cards/page.tsx` (area `idcards`): daftar kartu + status cetak & token QR, cari/filter, mode pilih + 'Tandai Tercetak' massal, tandai/kembalikan per kartu, pratinjau yang otomatis menandai Tercetak saat PNG BENAR-BENAR tersimpan (prop baru `onSaved` di `DigitalIdCardPreview`; pemakai lama tak terpengaruh). Baris ID Card digabung dengan data karyawan karena daftar dari backend tidak membawa `jabatan_status`. proyek sekolah: + tombol 'Sinkronkan Siswa & Guru' (`desktop_backfill_id_cards`). Kartu tautan di Pengaturan kedua proyek. `check:quick` SPPG & proyek sekolah lolos. **BUG DITEMUKAN (belum diperbaiki, di luar mobile):** query daftar ID Card Rust (`list_id_cards`) DAN TypeScript (`services/idcard.ts`) tidak mengambil `jabatan_status`; halaman ID Card Desktop/Web mengirim baris itu langsung ke renderer → jabatan di grid tampil '-' dan kartu yang dicetak dari halaman ID Card berjabatan bawaan 'Staff' untuk semua orang. Berlaku di SPPG dan proyek sekolah. |
| 2026-09-11 | SPPG | 3.2 A | `sync-rust-modules.ts` direfaktor (`adaptToMobile()`) dan kini juga menyalin `desktop/payroll/{mod,commands,engine,models}.rs` → `mobile/src-tauri/src/mobile/payroll_admin/`; 23 command `desktop_*` didaftarkan di `lib.rs`, `build.rs`, capabilities; `expectedMobileOnlyUnregisteredCommands` dikosongkan. Paritas 10 modul Rust bersama dicek SINKRON sebelum skrip dijalankan. Mobile 144 command; `cargo test` 169 lolos; `cargo check` Android bersih. |
| 2026-09-11 | SPPG | 3.2 B1+B2 | Baru: `/payroll/runs` (filter status, dialog "Buat Batch" dengan preset bulan + estimasi dari rekap, lalu `desktop_create_payroll_run`) dan `/payroll/runs/detail` (Suspense; transisi mengikuti izin BACKEND: ajukan=`run.create`, review=`run.review`, setujui=`run.approve`, bayar=`run.disburse`, tolak=`run.review` saat SUBMITTED/REVIEWED; kartu rincian ke slip; jejak audit). `RunStatusBadge`. Perbaikan dari proyek sekolah ikut dibawa ke `/payroll` & slip: penjaga area `payroll` (redirect `/dashboard`) — sebelumnya semua akun login bisa membuka slip siapa pun; 2 `catch` diam diberi pesan/alasan. |
| 2026-09-11 | SPPG | 3.2 B3+B4 | Baru: `/payroll/config` (tab rate gaji + komponen, 3 tautan aturan) dan `/payroll/config/{overtime,tax,bpjs}-rules`, semua dijaga `payroll.config.manage` (redirect `/payroll`, sama dengan Web). Validasi di perangkat mengikuti tipe Rust (`rate_per_hour`/`bracket_*`/`wage_cap`/`tier_order` = i64 → wajib bilangan bulat), tier lembur `end ≤ start` ditolak (engine melewatinya diam-diam), nomor tier ganda ditolak, kode BPJS ganda ditolak, rate dengan (karyawan, tanggal berlaku) yang sama memakai ulang id baris lama (lihat temuan backend di bawah). Karyawan & tanggal rate dan kode BPJS dikunci saat ubah. Label "ditanggung pekerja" BPJS memakai aturan engine (`_EMP`), bukan tebakan dari nama. 7 audit proyek sekolah: 0 temuan payroll; `check:quick` lolos; `build:mobile` (static export, 28 halaman) lolos. Belum diuji di HP. |
| 2026-09-11 | SPPG | 3.2 C | CLAUDE.md (kalimat "mobile has no payroll administration commands" diganti penjelasan `payroll_admin`), `mobile/AGENTS.md`, referensi 02 (`models.rs` akar vs `payroll/models.rs`). Komentar alasan `catch` di `web-desktop/src/lib/gateways/payroll.ts` dibawa dari proyek sekolah lalu disalin ke mobile. |
| 2026-09-11 | proyek sekolah | 3.2 D | Baseline `check:quick` proyek sekolah hijau dulu. Paritas 16 modul Rust yang disalin skrip dicek (baca-saja, dua kali — terakhir tepat sebelum menulis): semuanya SINKRON, jadi skrip tidak menimpa pekerjaan Anda; `git status` mobile Rust sesudahnya sama dengan sebelumnya kecuali `payroll_admin/` baru. `sync-rust-modules.ts` proyek sekolah diperluas (kepala "BERKAS HASIL SALIN" & mekanisme `dead_code` proyek sekolah dipertahankan; `payroll_admin` tidak dikecualikan dari `dead_code`). 23 command didaftarkan di `lib.rs`/`build.rs`/capabilities; `mod.rs` + `pub mod payroll_admin`. Daftar pengecualian di `.agents/.../audit-sync-contract.ts` dikosongkan; audit yang benar-benar dijalankan proyek sekolah (`scripts/audit-sync-contract.ts`) kini membaca modul mobile SECARA REKURSIF — sebelumnya subfolder tidak terbaca sehingga 23 command dituduh "fungsinya tidak ada". Frontend: 9 berkas SPPG disalin (halaman Web proyek sekolah hanya berbeda di penguatan yang sudah ada di versi mobile), lalu semua dialog aksi memakai prop `footer` Modal proyek sekolah (tombol Simpan tetap terlihat saat badan dialog bergulir; submit form lewat atribut `form`). Bagian "Administrasi Payroll" di `/payroll` proyek sekolah. Dokumen: CLAUDE.md (satu kalimat, tertarget), `mobile/AGENTS.md`, referensi 02. Hasil: `cargo test` mobile 211 lolos, 0 peringatan; `cargo check --target aarch64-linux-android` bersih; `check:quick` lolos (mobile 192 command); `build:mobile` lolos. Belum diuji di HP. |
| 2026-09-11 | SPPG+proyek sekolah | 4.1 | Dicek dulu: `update_operator` (`turso.rs`, dipakai Desktop DAN Mobile) memang tidak pernah menulis `kode_operator`/`username` di kedua proyek, sedangkan jalur Web (`lib/operators/operator-admin.ts`) menyimpannya. `web-desktop/src/app/operators/page.tsx`: kedua kolom `disabled` saat EDIT bila `isDesktopRuntime()` + kalimat penjelasan (buat akun baru lalu nonaktifkan yang lama); menambah operator dan jalur Web tidak berubah. Backend sengaja tidak diubah (kode operator tercatat di `log_scan`/`koreksi_admin`). `check:quick` SPPG & proyek sekolah lolos. Belum diuji di Desktop. |
| 2026-09-11 | proyek sekolah | 5.3 | `mobile/src/app/presensi-kelas/page.tsx`: Riwayat kini punya "Sunting" (izin `class_attendance.manage`; tanpa izin itu tombolnya "Lihat Rincian" dan status siswa terkunci) yang memuat status per siswa TERSIMPAN ke tab Input dan menyimpan ulang dengan `id_presensi_mapel` (padanan Web), serta Hapus (`class_attendance.delete`, lewat `useConfirmDialog`). Dalam mode sunting rombel & tanggal dikunci (rosternya milik sesi itu), tombol "Tampilkan Roster" disembunyikan, dan memuat roster baru keluar dari mode sunting. **Kolom "Catatan umum sesi" ditambahkan**: tanpa itu, menyunting sesi dari HP menulis `catatan = null` dan menghapus catatan yang dibuat di Web/Desktop. Dialog hapus menyebut bahwa jurnal mengajar yang tertaut ikut tak tampil (daftar jurnal memakai JOIN `presensi_mapel`). Riwayat menampilkan materi & jumlah Dispensasi. |
| 2026-09-11 | proyek sekolah | 5.1 | `mobile/src/app/akademik/page.tsx` ditulis ulang + `mobile/src/components/akademik/AkademikForm.tsx`: 5 tab (Tahun Ajaran, Rombel, Mapel, Jurusan, Penugasan) dengan Tambah/Ubah/Hapus untuk `academic.manage`, filter tahun ajaran (bawaan: aktif) & rombel, validasi rentang sesuai formulir Web (kapasitas 1–60, beban 1–10 JP, KKM 50–100). Dua perbedaan yang DISENGAJA dari Web: (1) tabel akademik TANPA foreign key — backend menerima penghapusan baris yang masih dipakai — jadi hapus diperiksa dulu (`findUsage`: siswa aktif, penugasan, sesi presensi, rombel, tahun ajaran aktif) dan ditolak dengan saran menonaktifkan (sakelar Aktif di formulir Ubah); (2) tahun ajaran baru TIDAK otomatis aktif (Web mengirim `is_aktif: 1`, yang menonaktifkan tahun ajaran lain di seluruh sekolah); mengaktifkan selalu lewat konfirmasi. |
| 2026-09-11 | proyek sekolah | 5.2 | `mobile/src/app/bimbingan-konseling/page.tsx`: "Catat Kasus Baru" (`counseling.manage`; siswa dengan saringan nama/NIS, kategori, status awal, ringkasan, kronologi; tahun ajaran = yang aktif, ditolak bila belum ada), ubah status langsung dari detail, hapus kasus & hapus sesi (`counseling.delete`, `useConfirmDialog`). Tetap cloud-only: tidak ada cache lokal; setiap kegagalan menyebut bahwa fitur ini butuh koneksi. Semua dialog aksi memakai `footer` Modal. |
| 2026-09-11 | proyek sekolah | 5.1–5.3 | 6 audit UI proyek sekolah bersih per butir; `check:quick` proyek sekolah lolos; `build:mobile` lolos. Belum diuji di HP. 5.4 (Notifikasi WA) tetap ⏸ — butuh keputusan Anda. |
| 2026-09-11 | – | 5.4 | Dibatalkan User ("5.4 batalkan saja"). |
| 2026-09-11 | SPPG+proyek sekolah | temuan #1 | Keempat command `mobile_*` payroll di `mobile/payroll.rs` tidak memeriksa sesi maupun izin sama sekali (bukan hanya slip): kini dua yang tersisa dijaga `payroll.view` (= area `payroll`). |
| 2026-09-11 | SPPG+proyek sekolah | temuan #7 | `getPayrollRecap` di gateway tidak lagi bercabang ke `mobile_get_payroll_recap`; HP memakai `desktop_get_payroll_recap` (salinan persis Desktop, termasuk jam hari libur). `mobile_get_payroll_recap`, `mobile_get_employee_payroll_estimate` (tidak dipanggil siapa pun), salinan `PayrollCalculator`, dan loader-nya dihapus dari `mobile/payroll.rs` (800 → 170 baris) serta dari `lib.rs`/`build.rs`/capabilities/izin autogenerated. |
| 2026-09-11 | SPPG+proyek sekolah | temuan #2, #6 | Tombol Tolak Web kini hanya untuk `payroll.run.review` (kedua backend menuntutnya). Label BPJS Web memakai aturan engine (`_EMP` saja). |
| 2026-09-11 | SPPG+proyek sekolah | temuan #3–#5 | `new_payroll_id` (`<awalan>-<detik>-<48 bit acak>`) menggantikan SEMUA id berbasis detik di `payroll/commands.rs` — termasuk dua masalah yang lebih parah dari temuan awal: fungsi simpan MASSAL (`save_*_rules`) memberi id sama ke tiap baris baru dalam satu loop (baris berikutnya menimpa yang pertama), dan id `payroll_audit_logs` bentrok bila dua transisi terjadi dalam satu detik. Simpan rate/BPJS baru kini memakai ulang id baris lama bila kunci alaminya sudah ada. Catatan: #3 ternyata ringan (cloud juga upsert lewat kunci alami); #4 yang berbahaya (PK bentrok antar-perangkat → push macet). #5 diselesaikan di UI Web/Desktop: karyawan & tanggal rate serta kode BPJS dikunci saat ubah (backend Web & Desktop sama-sama tidak bisa mengubahnya). Tes Rust baru: 2 di `payroll/commands.rs`. |
| 2026-09-11 | SPPG | temuan #8 | Perbaikan payroll proyek sekolah dibawa ke SPPG: tarif pajak/BPJS disaring ke generasi yang berlaku di akhir periode (Rust `load_tax_rules`/`load_bpjs_rules` + TS `payroll-recap.ts`), upah pokok dari menit bulat (`wage_from_minutes` + cerminan TS), jam lembur batch dari menit mentah. `engine.rs`/`models.rs`/`payroll-recap.ts` disalin dari proyek sekolah (diff-nya murni tambahan), `commands.rs` disunting tertarget. Ikut: tes vektor bersama (`engine.rs` + `payroll-calculator.test.ts`) dan `assertSameOriginMutation` di `POST /api/payroll/recap`. `cargo test` desktop 169 / mobile 173 lolos; Android bersih; `check:quick` lolos. |
| 2026-09-11 | proyek sekolah | temuan A–C | A: `delete_academic_{year,department,class,subject}` (Rust) dan padanan TS di `services/academic.ts` menolak (409 / `ACADEMIC_IN_USE`) bila masih dipakai rombel/siswa/penugasan/sesi presensi, atau bila tahun ajaran aktif — daftar pemeriksaannya dieja identik di kedua sisi. B: Web tidak lagi membuat tahun ajaran baru dalam keadaan aktif; ada centang eksplisit. C: menghapus sesi presensi yang punya jurnal mengajar ditolak di Rust & TS dengan pesan yang sama. Teks dialog mobile disesuaikan. |
| 2026-09-11 | SPPG+proyek sekolah | temuan 3.1 | Daftar ID Card kini membawa `m.jabatan_status` di Rust (`list_id_cards`, indeks kolom 14) dan TS (`getDaftarIdCard`) — kartu yang dicetak dari halaman ID Card Desktop/Web tidak lagi berjabatan "Staff" untuk semua orang. Komentar halaman ID Card mobile diluruskan. |
| 2026-09-11 | SPPG | temuan Android | `mobile/scripts/patch-android-release.ts` dibawa dari proyek sekolah dan dirangkai ke `tauri:android:init` & ketiga `tauri:android:build*` (`android:patch`). Dijalankan: menambah `isShrinkResources = false`, lari kedua "sudah benar". |
| 2026-09-11 | – | temuan cleartext | TIDAK diubah. `usesCleartextTraffic` hanya berlaku untuk stack HTTP Java/WebView; klien libSQL berjalan di Rust (soket native) dan WebView memuat lewat protokol kustom Tauri, jadi `false` di proyek sekolah kemungkinan bukan bug (malah lebih ketat). Perlu satu uji di HP: proyek sekolah release + server libSQL self-hosted lewat `http://` di LAN. |
| 2026-09-11 | SPPG+proyek sekolah | verifikasi | Setelah semua perbaikan backend: `bun run check` (termasuk cargo test) lolos di KEDUA proyek — SPPG desktop 169 / mobile 173, proyek sekolah desktop 209 / mobile 213 — dan `cargo check --target aarch64-linux-android` bersih tanpa peringatan di keduanya. Paritas modul Rust proyek sekolah dicek sebelum setiap sinkronisasi; hanya berkas yang saya sunting yang berbeda. Belum diuji di HP/Desktop. |
| 2026-09-11 | SPPG | alat | 7 audit proyek sekolah (ui-guard, page-guard, a11y, dialog, confirm, silent-catch, list-bound) dijalankan terhadap SPPG dari salinan di scratchpad: 4 berkas mobile yang disentuh bersih. Temuan lama di berkas lain SPPG (mis. Pengaturan mobile: catch "// Handled", textarea IP tanpa label) belum disentuh. |
