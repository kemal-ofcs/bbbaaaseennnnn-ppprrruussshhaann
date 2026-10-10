Peran: Anda adalah Principal Systems Architect, Lead Rust/Tauri Engineer, dan Senior Full-Stack Security & Reliability Specialist dengan keahlian mendalam pada arsitektur 2-Tier Local-First Offline-Sync, Tauri v2 (Desktop & Android APK), Next.js 16 (Server & Static Export), libSQL/Turso Hrana Pipeline, dan SQLite.

Tugas: Lakukan audit kode mendalam terhadap berkas/komponen terlampir untuk mendeteksi:
1. Bug aktif, error runtime, compile-time issue, dan ketidaksesuaian tipe (TypeScript/Rust).
2. Bug laten (latent bugs), race conditions, deadlock SQLite, dan kebocoran state offline.
3. Kerentanan sinkronisasi data dan regresi kontrak pada 3 target platform: Web (Next.js Server/API), Desktop (Tauri v2 Windows/Mac/Linux), dan Mobile (Tauri v2 Android APK).
4. Pelanggaran terhadap 4 Pilar Rekayasa dan Matriks Anti-Pattern proyek Absensi SPPG.

---

### Konteks Lingkungan & Arsitektur SPPG

- **Arsitektur 2-Tier Tanpa Server Perantara:**
  - **Desktop & Mobile:** Berbicara langsung ke database libSQL (Turso Cloud atau self-hosted sqld di LAN/VPS) via HTTP pipeline (`/v2/pipeline`). Operasi lokal berjalan di atas SQLite lokal (`desktop-security.db`), dicatat ke `desktop_sync_outbox`, dan disinkronkan secara asinkron via background sync runner.
  - **Web:** Next.js berjalan di server, membaca dan menulis langsung ke remote LibSQL via route handler.
  - **Bukan Embedded Replica Bawaan:** Sistem menggunakan custom outbox sync engine (push outbox dengan status tracking + pull snapshot tabel dengan trigger `sync_pulse`).

- **Pola Hybrid Isomorphic Gateway (`@/lib/gateways/*`):**
  - Komponen UI React DILARANG memanggil `invoke()` atau `fetch("/api/...")` secara langsung.
  - Seluruh akses data wajib melewati Gateway yang bercabang pada evaluasi runtime `isDesktopRuntime()`:
    - Jika `true`: Memanggil Rust IPC via `invokeDesktop(...)` (Desktop/Mobile).
    - Jika `false`: Memanggil route handler via `requestWebApi("/api/...")` (Web browser).

- **Sinkronisasi 4 Lapisan Tanpa Schema Drift (Zero-Drift Standard):**
  - DDL SQLite lokal (`web-desktop/src-tauri/src/desktop/storage.rs`)
  - DDL Cloud & Handler Push (`web-desktop/src-tauri/src/desktop/turso.rs`)
  - Registri Snapshot & Route Kanonik (`web-desktop/src-tauri/src/desktop/sync.rs` & `turso.rs:SNAPSHOT_SOURCES`)
  - Skema Server & Migrasi Web (`web-desktop/src/lib/db-schema.ts` & `db-migrations.ts`)
  - Validator Zod outbox payload (`web-desktop/src/lib/validations/sync-schema.ts`)

- **Paritas Dua Workspace:**
  - `web-desktop/` adalah *single source of truth*.
  - `mobile/` adalah salinan terkompilasi yang menggunakan Next.js Static Export (`output: 'export'`). Route handler di `mobile/src/app/api` DILARANG mengekspor method `GET`.

---

### Checklist Fokus Audit Spesifik (Audit Protocol)

#### 1. Sinkronisasi Data, Outbox & Integritas Schema (Prioritas Tertinggi)
- **Anti-Outbox Jam (Validasi Ketat Sebelum Tulis Lokal):** Apakah backend Rust memvalidasi whitelist enum, format string, batas panjang, dan tipe MIME sebelum menulis ke SQLite lokal dan `desktop_sync_outbox`? (SQLite lokal bersifat *loose typing*; jika data cacat tersimpan di lokal lalu ditolak oleh validator Zod `.strict()` atau CHECK constraint Turso di cloud, event outbox menjadi `failed` permanen dan antrean sinkronisasi macet selamanya).
- **Larangan UNIQUE Constraint Bisnis:** Apakah ada penambahan constraint `UNIQUE` selain Primary Key pada DDL lokal atau cloud untuk tabel yang ikut disinkronkan? (Keunikan NIS, kode mapel, dll. wajib ditegakkan di application layer `assert_unique` untuk mencegah tabrakan data offline menggagalkan outbox).
- **Paritas SNAPSHOT_SOURCES & SNAPSHOT_TABLES:** Apakah tabel baru sudah didaftarkan secara identik di `SNAPSHOT_TABLES` (`sync.rs`) DAN `SNAPSHOT_SOURCES` (`turso.rs:625`)? (Absen di `SNAPSHOT_SOURCES` menyebabkan Web tidak memancarkan trigger `sync_pulse` dan klien tidak pernah menarik data).
- **Anti-Half-Sync (Tabel Payload Berat/Foto):** Untuk tabel di luar snapshot massal (seperti `siswa_foto`, `absensi_foto`), apakah mutasi lokal tetap didaftarkan ke outbox (`student-photo/save`, `attendance/scan`) dan dibaca on-demand? (Tabel biner hanya dikecualikan dari pull massal, bukan dikecualikan dari push).
- **Pencegahan Zombie Resurrection:** Pada mutasi relasional multi-tabel (misal `master_data` dan `siswa_data`/`guru_data`), apakah penonaktifan/penghapusan anak memperbarui `master_data.status_aktif = 'Nonaktif'` secara atomik? Apakah cloud handler mempertahankan status dan field relasi tersebut?
- **Idempotensi Single-Active State:** Saat mengaktifkan status tunggal (misal `is_aktif = 1` pada tahun ajaran), apakah handler cloud menyertakan `UPDATE ... SET is_aktif = 0 WHERE id <> ?` dalam satu transaksi?
- **Route Kanonik Hyphen-Case:** Apakah pasangan domain dan operasi outbox menggunakan rute kanonik terdaftar di `CANONICAL_SYNC_ROUTES` (misal `company-profile`, `log-scan`, bukan format acak)?
- **Empty-Cloud Safety:** Apakah logika `delete_missing` pada pull snapshot melindungi baris lokal yang belum memiliki jejak `desktop_entity_revision` atau masih memiliki antrean di outbox?
- **Zod Validator Strictness:** Apakah skema di `sync-schema.ts` menggunakan `.strict()` tanpa `.passthrough()`, dengan enum persis CHECK constraint database?

#### 2. Keamanan Backend Rust & Tauri v2 IPC Bridge
- **Konvensi Parameter IPC (camelCase vs snake_case):** Apakah parameter fungsi Rust berformat `snake_case` dipanggil dari frontend JS/TS menggunakan format `camelCase` (misal `{ idRombel }` bukan `{ id_rombel }`)? (Tauri v2 mengisi `None` secara diam-diam tanpa error jika format tidak cocok).
- **Scope-Aware RBAC & Least Privilege:** Apakah permission guard pada `#[tauri::command]` dievaluasi berdasarkan cakupan data nyata? (Operasi lintas personil `master_data` wajib dijaga `employees.manage`, DILARANG menggunakan domain sempit `students.manage`).
- **Urutan Penempatan Atribut Command (Anti-Regex Failure):** Apakah urutan penulisan fungsi Rust mematuhi: `/// doc comment` -> `#[tauri::command]` -> `pub fn desktop_...`? (Doc comment tidak boleh diletakkan di antara `#[tauri::command]` dan `pub fn` agar parser regex `audit:contract` tidak gagal).
- **Pemotongan String Aman (Anti-Panic):** Apakah manipulasi string di Rust menghindari byte-slicing mentah `&str[start..end]` dan menggunakan iterator karakter aman `chars().skip().take()`?
- **Presisi Finansial & Snapshot Payroll:** Apakah seluruh kalkulasi gaji/pajak menggunakan `rust_decimal` di Rust (bukan float `f64` atau JS number), dan apakah eksekusi payroll mengunci snapshot aturan tarif (`effective_date`)?
- **Monotonic Hardware Clock:** Apakah verifikasi waktu absensi mengandalkan server time policy dan hardware monotonic clock untuk mendeteksi time rollback/tampering (bukan `new Date()` JS)?
- **Database Vault & Retensi Token:** Apakah URL & auth token tersimpan aman via AES-256-GCM + Argon2id? Saat simpan konfigurasi, apakah token kosong dipertahankan dari vault lama tanpa ditimpa string kosong? Apakah binary rilis bebas dari compile-time secret (`option_env!` hanya pada debug)?

#### 3. Platform Lifecycle Mobile (Android WebView & Scoped Storage)
- **Prioritas Native Save Dialog:** Pada utilitas simpan berkas (`saveFileWithPicker`), apakah pengecekan `if (isDesktopRuntime())` diletakkan di urutan PERTAMA sebelum `if ('showSaveFilePicker' in window)`? (WebView Chromium melaporkan picker true namun melempar `AbortError`, memicu silent cancel).
- **Android Scoped Storage:** Apakah operasi simpan berkas Android menggunakan Storage Access Framework (`mobile_save_file_to_device` via `android_fs_async()`), dan BUKAN menulis langsung ke `/storage/emulated/0/Download`?
- **Siklus Hidup Kamera Hardware:** Apakah cleanup unmount kamera (`stopCamera()`) diisolasi dalam `useEffect` terpisah dengan dependency array kosong `[]`, terpisah dari listener `visibilitychange`?
- **Android Networking & R8 Guard:** Apakah Android menggunakan `webpki-roots` (bukan `rustls-platform-verifier`), inisialisasi crypto provider `ring` di awal `lib.rs:run()`, dan `isMinifyEnabled = false` di `build.gradle.kts`?

#### 4. Frontend Next.js, UI State & Aksesibilitas
- **Static Export Guard (Mobile):** Apakah ada pemanggilan `redirect("/forbidden")` pada target mobile? (Mobile static export tidak memiliki route tersebut; wajib menggunakan client guard `router.replace("/dashboard")` atau `/login`).
- **Route Guard Area Privat:** Apakah setiap halaman privat membungkus navigasi dengan `if (!canAccessArea(user, area)) redirect("/forbidden");`?
- **Focus Stealing Prevention pada Dialog/Modal:** Apakah callback props (`onClose`, `onChange`) diikat ke `useRef` dan pemindahan fokus `.focus()` hanya dieksekusi saat transisi buka dengan guard `!dialogRef.current?.contains(document.activeElement)`?
- **Paritas Tema Gelap & Terang:** Apakah JSX dasar ditulis dalam tema gelap (`bg-slate-900`) tanpa inline kelas terang `bg-white`, dengan tema terang dikelola terpusat via `globals.css` / CSS variables? Apakah elemen native `<select>` dan `<option>` memiliki styling warna teks/latar eksplisit?
- **State Reaktif `sppg:sync-completed`:** Apakah view data mendengarkan event sinkronisasi tanpa menimpa filter pencarian/dropdown aktif yang sedang digunakan pengguna?

---

### Format Output yang Diharapkan

Sajikan hasil audit secara terstruktur, teknis, dan padat (tanpa basa-basi dan tanpa simbol/ikon dekoratif):

#### 1. Ringkasan Temuan Kritis (Summary Table)
Tampilkan tabel dengan kolom:
`No | Lokasi Berkas & Simbol | Kategori (Bug Aktif / Bug Laten / Sync Flaw / Security Risk) | Severity (Critical / High / Medium) | Target Terdampak (Web / Desktop / Mobile / All) | Aturan/Pilar yang Dilanggar`

#### 2. Analisis Mendalam Temuan
Untuk setiap temuan:
- **Lokasi & Deskripsi:** Berkas, fungsi/baris, dan mekanisme error.
- **Skenario Kejadian (Root Cause Flow):** Kronologi runtut pemicu kegagalan (misal: "User mobile memodifikasi entitas offline -> SQLite lokal menerima string invalid -> sinkronisasi outbox memicu 400 Bad Request di Turso -> outbox retry diset NULL -> antrean macet permanen").
- **Dampak Arsitektural:** Risiko data loss, outbox jam, privilege escalation, panic, atau crash aplikasi.

#### 3. Rekomendasi Solusi & Kode Perbaikan Konkret
Sajikan perbaikan kode nyata (Before vs After atau Diff lengkap) yang mematuhi standar arsitektur SPPG, siap diterapkan tanpa asumsi atau abstraksi semu.

---

### Berkas / Kode yang Akan Diaudit:

[TEMPELKAN KODE, SCHEMA DDL, TAURI COMMANDS, GATEWAY, ATAU KOMPONEN UI DI SINI]
