# Laporan Audit — Provisioning, Login, Sinkronisasi, RBAC (Desktop + Android)

Tanggal: 27 Agustus 2026
Cakupan: jalur provisioning database, login, sinkronisasi push/pull, konsistensi
skema empat lapis, dan RBAC — pada build Desktop maupun Android.

Metode: pembacaan kode langsung pada `web-desktop/src-tauri/src/desktop/*.rs`,
`web-desktop/src/lib/**`, padanan Mobile-nya, ditambah pembandingan DDL otomatis
antara `storage.rs` (SQLite lokal) dan `turso.rs` (LibSQL cloud) pada level
constraint — lapisan yang tidak diperiksa oleh `bun run audit:schema`.

Status akhir seluruh gerbang kualitas setelah perbaikan: `bun run check:quick`
keluar dengan kode 0 (audit skema, audit kontrak sync, Biome, TypeScript, dan
test Bun di kedua workspace), ditambah `cargo check --all-targets` bersih tanpa
warning di kedua workspace.

---

## 1. Ringkasan

| No | Temuan | Area | Tingkat | Status |
| :- | :----- | :--- | :------ | :----- |
| A1 | Password plaintext dikirim ke host database lewat fallback login HTTP legacy | Login / Keamanan | Tinggi | Diperbaiki |
| A2 | Sesi Desktop/Android tidak pernah dicabut saat role atau status operator berubah | RBAC | Tinggi | Diperbaiki |
| A3 | Nilai `sumber`/`sumber_data` hanya dijaga CHECK di cloud; lolos di tiga lapis lain | Skema / Sync | Tinggi | Diperbaiki |
| A4 | Daftar nilai `sumberData` dieja ulang di tiga berkas dan sudah saling berbeda | Kontrak | Sedang | Diperbaiki |
| A5 | Konflik outbox didorong ulang setiap siklus tanpa backoff | Sync / Performa | Sedang | Diperbaiki |
| A6 | Loop push outbox tidak berbatas | Sync | Sedang | Diperbaiki |
| A7 | Token vault dibuang karena URL dibandingkan sebagai string mentah | Provisioning | Sedang | Diperbaiki |
| A8 | Pemulihan konfigurasi gagal bila baris `turso_auth_token` tidak pernah ada | Provisioning | Sedang | Diperbaiki |
| A9 | `desktop_clear_turso_config` meninggalkan `server_origin` basi | Provisioning | Rendah | Dilaporkan |
| A10 | `bpjs_rules.wage_cap`: `REAL` di cloud vs `INTEGER` di lokal | Skema / Payroll | Sedang | Dilaporkan |
| A11 | Kolom `created_at` hanya ada di cloud pada tiga tabel tarif | Skema | Rendah | Dilaporkan |
| A12 | `AUTOINCREMENT` hanya di cloud pada `tbl_shift` dan `import_offline` | Skema | Rendah | Dilaporkan |
| A13 | Retry konflik bergantung pada pencocokan teks pesan error server | Sync | Sedang | Dilaporkan |
| A14 | `sync::status()` melakukan 15 `COUNT(*)` penuh pada setiap panggilan | Performa | Sedang | Dilaporkan |
| A15 | Dokumen aturan menyebut 26 route / 12 tabel snapshot, kenyataannya 34 / 20 | Dokumentasi | Rendah | Dilaporkan |

Yang diperiksa dan terbukti **sudah benar**: siklus kamera Android (rule 4.7),
`isMinifyEnabled = false` dan aturan ProGuard (rule 4.4), guard `delete_missing`
terhadap cloud kosong, aturan "kunci payload absen berarti tidak berubah" pada
pull inkremental, pemisahan kegagalan push dari pull, guard `SYNC_IN_FLIGHT`,
serta tipe kolom uang pada `payroll_items` yang konsisten `INTEGER`.

---

## 2. Temuan yang Sudah Diperbaiki

### A1 — Password plaintext dikirim ke host database (Tinggi)

**Berkas:** `src-tauri/src/desktop/commands.rs` (`desktop_login`), `remote.rs`

`desktop_login` mencoba tiga jalur berurutan: Turso, lalu login HTTP legacy,
lalu snapshot offline. Jalur kedua memanggil `remote::login`, yang mem-POST
`{"username": ..., "password": ...}` ke `<server_origin>/api/auth/login`.

Masalahnya, ketika database sudah dikonfigurasi, `config.rs` menetapkan
`server_origin` dari URL database itu sendiri. Jadi jalur kedua mengirim
kredensial pengguna ke host database — bukan ke server aplikasi.

Pemicunya nyata: bila Auth Token salah atau kedaluwarsa,
`authenticate_operator` gagal dengan `TURSO_AUTH_FAILED` (bukan
`LOGIN_REJECTED`), sehingga eksekusi jatuh ke jalur kedua sementara host
database justru sedang hidup dan menerima request. Pada Turso hasilnya hanya
404, tetapi pada server libSQL milik pengguna sendiri — yang lazim berada di
belakang Nginx/Caddy — body request bisa ikut tercatat di log akses.

**Perbaikan:** jalur HTTP legacy kini hanya dijalankan bila
`state.turso_config().is_none()`, yaitu instalasi yang memang memakai server
aplikasi. Instalasi 2-tier langsung turun ke snapshot offline.

### A2 — Sesi Desktop/Android tidak pernah dicabut saat RBAC berubah (Tinggi)

**Berkas:** `commands.rs` (`require_permission`), `sync.rs`, `turso.rs`

`require_permission` membaca operator dan daftar permission dari
`state.session` — snapshot yang diambil sekali saat login dan hidup di memori
sampai aplikasi ditutup. Tidak ada satu pun jalur yang memvalidasinya ulang.

Akibatnya, operator yang baru saja dinonaktifkan (`status != 'Aktif'`) atau
dicabut permission-nya oleh Superadmin tetap memegang akses penuh di
perangkatnya sampai aplikasi di-restart. Ini bertentangan langsung dengan
standar yang tertulis di `references/01-bootstrap-and-security.md` §4:
"Operator yang dinonaktifkan langsung ditolak pada request berikutnya."

Yang membuatnya menonjol: infrastrukturnya sudah ada dan sudah dipakai — sisi
**web** memeriksa `setting_gex_system.rbac_revision` pada setiap request
(`src/lib/auth/session-store.ts`, `src/lib/server/auth/authenticate.ts`), dan
`turso.rs` sudah menaikkan `rbac_revision` di tiga tempat saat role atau
permission diubah. `OperatorUser` bahkan sudah membawa field
`permission_revision`. Hanya sisi perangkat yang tidak pernah membandingkannya.

**Perbaikan:** fungsi baru `sync::enforce_rbac_revision`, dipanggil sekali di
akhir setiap siklus `synchronize`:

1. Membaca `rbac_revision` dari SQLite **lokal** — nilai itu ikut tersinkronisasi
   lewat `setting_gex_system`, jadi kasus normal (tidak ada perubahan role) tidak
   menambah satu pun round-trip jaringan.
2. Bila berbeda dari `permission_revision` sesi, memuat ulang operator dari cloud
   lewat `TursoClient::reload_operator` yang baru.
3. Operator masih aktif: permission sesi diperbarui di tempat. Operator sudah
   tidak aktif atau terhapus: sesi dikosongkan dan dicatat ke audit lokal sebagai
   `session-revoked-rbac-change`.
4. Kegagalan jaringan **tidak** mencabut sesi — perangkat lapangan tidak boleh
   terlempar keluar setiap kali sinyal terputus.

Pembangunan `OperatorUser` diekstrak menjadi `TursoClient::hydrate_operator` dan
dipakai bersama oleh login dan pemuatan ulang, supaya keduanya tidak bisa drift.

### A3 — Nilai `sumber`/`sumber_data` hanya dijaga di satu dari empat lapis (Tinggi)

**Berkas:** `turso.rs`, `storage.rs`, `sync-schema.ts`, `contracts/scanner.ts`

DDL cloud memasang CHECK constraint:

```sql
sumber TEXT NOT NULL
  CHECK (sumber IN ('Scanner','Koreksi Admin','Import Offline','Import Manual','Generate Sistem'))
```

Tiga lapis lainnya tidak:

- SQLite lokal (`storage.rs`): `TEXT NOT NULL` polos, tanpa CHECK.
- Validator Zod (`sync-schema.ts`): `optionalShortText` — string apa pun ≤255.
- Kontrak TS (`contracts/scanner.ts`): union tipe, hanya berlaku saat kompilasi.

Sebuah nilai di luar daftar akan tersimpan mulus di perangkat, lolos validator,
masuk antrean outbox, lalu **ditolak permanen** oleh cloud. Event-nya macet di
outbox dan dicoba ulang tanpa pernah bisa berhasil. Ini persis kelas kegagalan
yang dulu terjadi pada seed tarif payroll (lihat referensi §4.1.2).

**Perbaikan:** validator Zod kini `z.enum(ATTENDANCE_SOURCE_VALUES)`, sehingga
nilai salah ditolak di batas sinkronisasi — sebelum sempat masuk antrean.

**Catatan:** menambahkan CHECK yang sama ke `storage.rs` akan lebih baik lagi,
tetapi SQLite tidak bisa menambah CHECK lewat `ALTER TABLE`; itu memerlukan
migrasi tabel penuh melalui `desktop_schema_migration`. Saya tidak melakukannya
tanpa persetujuan Anda karena menyentuh tabel berisi data produksi.

### A4 — Daftar nilai yang sama dieja di tiga berkas dan sudah berbeda (Sedang)

Daftar nilai sumber dieja ulang di `contracts/scanner.ts`,
`services/attendance-processor.ts`, dan (setelah A3) validator Zod. Ketiganya
sudah tidak sinkron: **dua di antaranya kehilangan `"Import Manual"`** yang
justru diizinkan database. Artinya jalur impor manual tidak punya cara menandai
asal datanya dengan benar.

**Perbaikan:** satu sumber kebenaran `ATTENDANCE_SOURCE_VALUES` dan tipe
`AttendanceSource` di `contracts/scanner.ts`; dua berkas lain mengimpornya.
`"Import Manual"` ditambahkan sehingga kode aplikasi kini selaras dengan
database.

### A5 — Konflik outbox didorong ulang tanpa henti (Sedang)

**Berkas:** `sync.rs` (`pending_events`, `apply_push_results`)

`pending_events` sengaja mengambil ulang baris berstatus `conflict` untuk
konflik UNIQUE pada shift dan karyawan — itu benar, karena baris kembarannya
biasanya direkonsiliasi oleh pull berikutnya. Tetapi `apply_push_results` tidak
pernah menuliskan `next_retry_at` untuk status `conflict`, sehingga tidak ada
backoff sama sekali.

Konflik yang memang tidak akan pernah selesai (`kode_shift` yang betul-betul
dobel) karenanya didorong ulang ke cloud **setiap siklus 30 detik selamanya** —
menghabiskan kuota data dan baterai perangkat lapangan.

**Perbaikan:** `conflict` kini menaikkan `attempt_count` dan menjadwalkan
`next_retry_at` dengan backoff eksponensial yang sama seperti `failed`
(5 detik × 2^percobaan, dibatasi pada 2^8). `pending_events` menghormati jadwal
itu.

### A6 — Loop push outbox tidak berbatas (Sedang)

**Berkas:** `sync.rs` (`push_outbox`)

Loop push berhenti hanya ketika satu batch berisi kurang dari 50 event. Bila
seluruh 50 event dalam satu batch berakhir sebagai `conflict` yang layak dicoba
ulang, `pending_events` mengembalikan 50 baris yang sama persis pada putaran
berikutnya — loop tidak pernah berhenti dan siklus sinkronisasi menggantung.

**Perbaikan:** loop dibatasi `MAX_PUSH_BATCHES_PER_CYCLE = 40` batch per siklus
(2000 event). Sisa antrean ikut siklus berikutnya. Diterapkan pada jalur Turso
maupun jalur HTTP legacy.

### A7 — Token vault dibuang karena URL dibandingkan sebagai string mentah (Sedang)

**Berkas:** `commands.rs` (`resolve_bootstrap_turso_config`,
`desktop_test_turso_connection`)

Kedua fungsi memutuskan "apakah token vault boleh dipakai" dengan
`config.database_url.trim() == url` — perbandingan string mentah. Sementara itu
`config.rs::set_turso_config` sudah membandingkan URL **ternormalisasi**.

Akibatnya, pengguna yang mengetik `https://db-saya.turso.io` untuk vault yang
menyimpan `libsql://db-saya.turso.io` — dua ejaan untuk database yang sama —
kehilangan token yang sebenarnya masih berlaku, dan mendapat pesan "Auth Token
wajib diisi" pada database yang sudah terhubung.

**Perbaikan:** helper `TursoConfig::matches_url` yang menormalkan kedua sisi
sebelum membandingkan, dipakai di seluruh titik keputusan.

### A8 — Pemulihan konfigurasi gagal tanpa baris token (Sedang)

**Berkas:** `config.rs` (`DesktopState::initialize`)

Jalur pemulihan dari tabel setting memakai
`if let (Some(u), Some(t)) = (db_turso_url, db_turso_token)`. Karena menuntut
`Some(_)` untuk **token**, perangkat yang punya `turso_database_url` tetapi tidak
pernah punya baris `turso_auth_token` gagal memulihkan URL-nya sama sekali —
padahal token memang sengaja dikosongkan dari tabel setelah dipindahkan ke vault,
dan pada server libSQL LAN token boleh tidak ada sejak awal.

**Perbaikan:** URL dipulihkan berdasarkan keberadaan URL saja; token kosong
diperlakukan sebagai nilai sah.

---

## 3. Temuan yang Dilaporkan (belum diubah)

### A9 — `desktop_clear_turso_config` meninggalkan `server_origin` basi (Rendah)

Perintah reset menghapus vault, baris setting, dan konfigurasi di memori, tetapi
tidak mengembalikan `state.server_origin` ke nilai default. Sesi dan snapshot
kredensial diikat ke `server_origin`, sehingga setelah reset perangkat masih
mengklaim origin database lama sampai aplikasi di-restart.

Dampak praktisnya kecil (layar provisioning tetap muncul karena
`turso_config` sudah `None`), tetapi `ensure_client_id` akan tetap memakai
`client_id` milik origin lama. Perbaikan yang disarankan: kembalikan
`server_origin` ke `DEFAULT_FALLBACK_URL` di dalam perintah yang sama.

### A10 — `bpjs_rules.wage_cap`: `REAL` di cloud, `INTEGER` di lokal (Sedang)

```
cloud  : wage_cap REAL
lokal  : wage_cap INTEGER
```

`wage_cap` adalah batas upah dalam rupiah — nilai moneter. Rule 4.23 melarang
tipe float untuk perhitungan gaji/pajak, dan sisa tabel payroll konsisten memakai
`INTEGER` (`basic_salary`, `gross_salary`, `net_salary`, dan seterusnya).

SQLite tidak akan menolak nilainya, tetapi afinitas tipe yang berbeda di dua sisi
berarti nilai yang sama bisa tersimpan sebagai REAL di satu sisi dan INTEGER di
sisi lain, dan pembandingan `payload_hash` per baris pada `apply_table` bisa
menganggap baris identik sebagai berubah — menimbulkan penulisan berulang.

Rekomendasi: samakan keduanya menjadi `INTEGER`. Perlu migrasi terkendali di
kedua sisi, jadi saya tidak melakukannya tanpa persetujuan Anda.

### A11 — Kolom `created_at` hanya ada di cloud (Rendah)

`bpjs_rules`, `tax_rules`, dan `payroll_components` memiliki
`created_at TEXT NOT NULL DEFAULT (datetime('now'))` di cloud yang tidak ada di
SQLite lokal. Karena ada DEFAULT, INSERT dari perangkat tetap berhasil — jadi
ini drift yang tidak merusak. Tetapi nilai `created_at` tidak pernah sampai ke
perangkat, sehingga laporan berbasis tanggal pembuatan tarif tidak bisa dibuat
secara offline.

### A12 — `AUTOINCREMENT` hanya di cloud (Rendah)

`tbl_shift.id_shift` dan `import_offline.id_import` memakai `AUTOINCREMENT` di
cloud tetapi tidak di lokal. Bedanya: tanpa `AUTOINCREMENT`, SQLite boleh memakai
ulang rowid bekas baris yang dihapus. Pada tabel yang id-nya dipakai sebagai
kunci rekonsiliasi lintas perangkat, pemakaian ulang id bisa membuat dua entitas
berbeda memakai id yang sama di dua perangkat sebelum sinkronisasi menyatukannya.

Risikonya rendah karena `reconcile_shift_ids` memakai `kode_shift` sebagai kunci
sebenarnya, tetapi menyamakannya akan menghilangkan kelas masalah ini.

### A13 — Retry konflik bergantung pada teks pesan error server (Sedang)

`pending_events` memilih baris konflik dengan:

```sql
last_error LIKE '%UNIQUE constraint failed: tbl_shift.kode_shift%'
```

Ini mencocokkan **teks pesan error** yang diproduksi server. Dengan dukungan
server libSQL self-hosted yang baru, teks itu tidak lagi dijamin: versi SQLite
yang berbeda atau lapisan proxy di depannya bisa memformat pesan secara berbeda,
dan rekonsiliasi shift/karyawan diam-diam berhenti bekerja.

Rekomendasi: bawa kode konflik terstruktur dari `turso.rs` (misalnya
`conflict_kind = 'unique_kode_shift'`) ke kolom tersendiri di outbox, dan
gunakan kolom itu untuk seleksi retry.

### A14 — `sync::status()` menjalankan 15 `COUNT(*)` penuh (Sedang)

`status()` menghitung `SELECT COUNT(*)` untuk 15 tabel snapshot, ditambah empat
hitungan status outbox. Fungsi ini dipanggil pada **setiap** siklus sinkronisasi
— termasuk siklus yang tidak menarik satu baris pun — dan siklus itu berjalan
setiap 30 detik lewat `AutoSyncRunner`, plus setiap kali window kembali fokus.

Pada instalasi yang sudah berjalan setahun, `log_scan` dan `absensi_harian` bisa
berisi ratusan ribu baris; setiap `COUNT(*)` memindai indeks terkecil secara
penuh. Ini pemborosan I/O yang paling mudah dihilangkan di seluruh jalur sync.

Rekomendasi: pisahkan `table_counts` dari `status()` menjadi perintah tersendiri
yang hanya dipanggil oleh halaman yang benar-benar menampilkannya, atau simpan
cache hitungan yang di-invalidasi oleh `changed_rows`.

### A15 — Dokumen aturan tidak lagi cocok dengan kode (Rendah)

`SKILL.md` §4.8 dan `references/02` menyebut "26 Route Kanonik" dan "12 tabel
snapshot". Keluaran `bun run audit:contract` yang sebenarnya:

```
- 34 route kanonik konsisten.
- 20 tabel snapshot konsisten.
```

Dokumen tertinggal dari kode. Karena `SKILL.md` adalah rujukan wajib sebelum
setiap perubahan, angka yang salah berisiko membuat pekerjaan berikutnya menolak
route yang sah. Skrip audit sudah menjadi sumber kebenaran yang benar; teks
dokumennya perlu disamakan.

---

## 4. Yang Diverifikasi Aman

- **Siklus kamera Android** (`ScannerView.tsx`): cleanup unmount berada di
  `useEffect` terpisah tanpa dependency state, dan listener `visibilitychange`
  hanya bergantung pada `[stopCamera]`. Sesuai rule 4.7.
- **Konfigurasi R8/ProGuard**: `isMinifyEnabled = false` pada kedua build type,
  aturan `-keep` untuk `app.tauri.**` dan `id.sppg.absensi.mobile.**` lengkap.
- **`usesCleartextTraffic="true"`** sudah aktif di manifest, sehingga mode server
  LAN ber-HTTP langsung berfungsi di Android. Membatasinya lewat
  `network_security_config.xml` tidak praktis di sini karena alamat LAN pengguna
  tidak diketahui saat build — Android tidak mendukung wildcard rentang IP.
  Pembatasan sebenarnya ditegakkan di `normalize_database_url`.
- **Guard cloud kosong**: `delete_missing` hanya menghapus baris yang terbukti
  punya jejak `desktop_entity_revision`, dan melewati baris yang masih punya
  antrean outbox. Hanya `tbl_shift` dan `tbl_hari_libur` yang mengaktifkannya,
  keduanya tabel kecil.
- **Pull inkremental**: kunci payload yang absen ditangani dengan `return Ok(0)`
  lebih awal, termasuk melewatkan blok `delete_missing`. Cursor pulse disimpan
  dari nilai **sebelum** pull, sehingga penulisan yang datang di tengah siklus
  akan ditarik ulang pada siklus berikutnya, bukan terlewat.
- **Kegagalan push tidak mematikan pull**, dan dilaporkan lewat
  `DesktopSyncStatus.push_error`.
- **Tipe kolom uang** pada `payroll_items`, `payroll_runs`, dan `salary_configs`
  konsisten `INTEGER` di kedua sisi, sesuai rule 4.23.

---

## 5. Rekomendasi Berikutnya (berdampak, belum dikerjakan)

1. **A14** — pisahkan `table_counts` dari `status()`. Ini perbaikan performa
   dengan rasio manfaat/risiko terbaik di seluruh laporan ini.
2. **A13** — ganti pencocokan teks error dengan kode konflik terstruktur, karena
   dukungan server self-hosted membuat teks error tidak lagi dapat diandalkan.
3. **A10** — samakan tipe `wage_cap` menjadi `INTEGER` di kedua sisi lewat
   migrasi terkendali.
4. **A3 lanjutan** — tambahkan CHECK constraint yang sama ke `storage.rs` melalui
   `desktop_schema_migration`, supaya nilai salah ditolak di titik pembuatannya.
5. **A15** — samakan angka di `SKILL.md` dan `references/02` dengan keluaran
   `bun run audit:contract`.
6. **Sertifikat self-signed untuk server sendiri** — klien Mobile memverifikasi
   TLS dengan `webpki-roots`, sehingga server libSQL ber-HTTPS wajib memakai
   sertifikat dari CA publik. Bila pelanggan ingin HTTPS internal dengan CA
   sendiri, perlu opsi menyimpan sertifikat CA (PEM) di konfigurasi dan
   membangun ulang klien `reqwest` dengan `add_root_certificate`. Saat ini
   jalurnya adalah HTTP di LAN, atau TLS ber-CA publik (misalnya Caddy).
