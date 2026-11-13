# CLAUDE.md

Panduan untuk AI agent yang bekerja di repositori ini.

## Ringkasan arsitektur

Aplikasi 2-tier offline-first di tiga target dari satu basis kode:

- **Web** — Next.js berjalan di server (Vercel/Node), menulis langsung ke
  database LibSQL lewat route handler.
- **Desktop & Android** — Tauri v2 + Rust. TIDAK ada server aplikasi perantara:
  perangkat berbicara langsung ke database LibSQL lewat HTTP pipeline
  (`/v2/pipeline`), dengan cache SQLite lokal yang disinkronkan dua arah.

Endpoint database boleh **Turso Cloud** atau **server libSQL milik pengguna
sendiri** (`sqld`) di LAN, NAS, atau VPS. Provider disimpan eksplisit pada
`TursoConfig.provider`, **tidak pernah ditebak dari bentuk URL** — menebaknya
membuat satu salah ketik `http://` melonggarkan aturan transport.

`web-desktop/` adalah **satu-satunya sumber kebenaran** untuk kode bersama.
`mobile/src/lib`, `mobile/src/types`, dan sebagian `mobile/src-tauri/src/mobile`
adalah salinan yang dihasilkan `bun run sync:mobile` dan akan ditimpa tanpa
peringatan. Jangan pernah mengeditnya langsung.

## Perintah

```bash
bun run setup             # pasang dependensi kedua workspace
bun run sync:mobile       # salin kode bersama web-desktop -> mobile
bun run check:quick       # audit + lint + typecheck + test, kedua workspace
bun run check             # + cargo test

bun run audit:schema      # JALANKAN DDL keempat lapisan, bandingkan hasilnya
bun run audit:contract    # route kanonik, tabel snapshot, permission, command
bun run verify:template   # semua gerbang sekaligus; --rust ikut cargo test

bun run image:build --versi 1.0.0   # image Docker Web self-hosted -> rilis/ (butuh Docker)
bun run paket:build --versi 1.0.0   # paket Windows tanpa Docker -> rilis/*.zip (Windows 64-bit)

# Playwright E2E (web-desktop/ saja)
cd web-desktop
bun run test:e2e          # jalankan semua E2E test (butuh dev server & .env.test)
bun run test:e2e:ui       # mode interaktif dengan UI Playwright
bun run test:e2e:report   # buka HTML report setelah test selesai
bun run test:e2e:install  # install Chromium browser (sekali saja)
```

## Pengujian End-to-End dengan Playwright

Playwright dipakai untuk menguji **Web path** di `web-desktop/` — lapisan UI,
alur bisnis, validasi form, dan penjagaan akses (80% coverage target).

### Batas yang Tegas

| Yang Diuji Playwright | Yang TIDAK Diuji Playwright |
| :-- | :-- |
| Login/logout form, redirect, error message | Logika Rust (tugas `cargo test`) |
| `canAccessArea` guard → redirect `/forbidden` | IPC `invoke()` ke Tauri backend |
| Validasi form (field kosong, enum, format HP) | Push outbox ke Turso Cloud |
| Filter search, filter status, sync-completed event | SQLite lokal (tugas `cargo test`) |
| Responsivitas viewport mobile (simulasi) | QR scan kamera (tugas Maestro APK) |

### Aturan Penulisan Test Playwright

1. **Credential via `.env.test` saja** — DILARANG hardcode username/password di file test.
   Gunakan `process.env.PLAYWRIGHT_SUPERADMIN_USERNAME` dan selalu tambahkan
   `test.skip(!username, "Set .env.test dulu")` jika bergantung pada credential real.

2. **Selector via ID elemen** — Gunakan `#username-input`, `#password-input` (bukan CSS class
   yang bisa berubah sewaktu-waktu). Elemen yang tidak punya ID wajib diberi `id` yang unik
   dan deskriptif sebelum menulis test (sesuai aturan SEO & aksesibilitas).

3. **storageState untuk session** — Login hanya dilakukan sekali di `setup-superadmin.ts`
   dan `setup-limited.ts`. Test individual menggunakan `storageState` dari file JSON.
   DILARANG login ulang di setiap test (lambat dan tidak perlu).

4. **Route mock untuk API berbayar** — Test yang menguji flow seperti password reset
   atau 2FA WAJIB menggunakan `page.route(...)` untuk mock response, bukan menghit
   endpoint real yang bisa terkena rate limit.

5. **`test:e2e` TERPISAH dari `check` pipeline** — Playwright membutuhkan dev server aktif
   dan database cloud real. Jangan pernah masukkan `test:e2e` ke `bun run check` atau
   `bun run check:quick`. Jalankan manual: `cd web-desktop && bun run test:e2e`.

6. **Akun test khusus** — Buat akun superadmin dan operator terbatas KHUSUS untuk testing,
   berbeda dari akun production. Gunakan `bun run bootstrap:superadmin` untuk membuat
   superadmin test pertama.

Jalankan `bun run check` **sekali di akhir**, setelah perubahan selesai utuh.
Menjalankannya berulang di tengah penulisan hanya membuang waktu.

`audit:schema` tidak membandingkan teks — ia menjalankan DDL-nya ke SQLite
sementara lalu membandingkan tabel dan kolom yang benar-benar terbentuk. Versi
berbasis teks sebelumnya pernah melaporkan "konsisten" sambil memeriksa NOL
tabel. `verify:template` menjalankan seluruh gerbang tanpa berhenti di
kegagalan pertama, untuk dipakai saat MEMERIKSA template — bukan saat menulis.

## Empat lapisan yang wajib identik

Menambah atau mengubah tabel yang ikut sinkronisasi berarti menyentuh keempatnya
dalam satu perubahan:

| Lapisan | Berkas |
| :-- | :-- |
| SQLite lokal | `web-desktop/src-tauri/src/desktop/storage.rs` |
| DDL cloud + handler push | `web-desktop/src-tauri/src/desktop/turso.rs` |
| Registri snapshot + route kanonik | `web-desktop/src-tauri/src/desktop/sync.rs` |
| Skema jalur Web | `web-desktop/src/lib/db-schema.ts` |

Satu nama kolom yang berbeda ejaan membuat tabel itu gagal disinkronkan secara
permanen — baris tersimpan mulus di perangkat, masuk antrean, lalu ditolak cloud
dan dicoba ulang selamanya.

Kolom yang hanya diketahui satu jalur wajib punya dua tempat: `CREATE TABLE`
untuk database baru, dan `ALTER TABLE` (`ensure_column` di Rust,
`db-migrations.ts` di TS) untuk database yang sudah ada.

## Aturan yang tidak boleh dilanggar

1. UI tidak pernah memanggil `invoke()` atau `fetch("/api/...")` langsung —
   selalu lewat `src/lib/gateways/*` yang bercabang pada `isDesktopRuntime()`.
2. Route handler di `src/app/api/**` DILARANG mengekspor `GET`; build Tauri
   memakai `output: "export"`. Pakai `POST /api/<domain>/query` untuk pembacaan.
3. Mutasi lokal dan pendaftaran outbox WAJIB berada dalam satu transaksi SQLite.
4. Hanya pasangan `(domain, operation)` di `CANONICAL_SYNC_ROUTES` yang boleh
   diproduksi outbox; daftarnya wajib sama dengan `canonical_sync_route` di
   `turso.rs`.
5. Event yang tidak menghasilkan statement mutasi WAJIB menjadi konflik, bukan
   `applied`.
6. Kunci payload yang absen dari snapshot berarti "tabel tidak berubah", bukan
   "tabel kosong" — termasuk melewatkan `delete_missing`.
7. `delete_missing` hanya boleh menghapus baris yang punya jejak
   `desktop_entity_revision` dan tidak sedang mengantre di outbox.
8. Kunci koneksi perangkat (`DEVICE_LOCAL_SETTING_KEYS`) tidak ikut sinkronisasi.
9. Kegagalan push TIDAK boleh membatalkan pull.
10. Setiap `#[tauri::command]` wajib memeriksa permission lewat
    `require_permission`. Menyembunyikan tombol di UI bukan guard.
11. Kredensial tidak pernah disimpan sebagai teks biasa dan tidak pernah dikirim
    balik ke frontend. Token kosong pada penyimpanan berarti "pertahankan yang
    lama", bukan "kosongkan".
12. Android: `isMinifyEnabled = false`; pakai `webpki-roots`, bukan
    `rustls-platform-verifier`; pasang provider kripto `ring` di awal `run()`.
13. Nilai uang disimpan sebagai `INTEGER`, tidak pernah float.
14. Siklus hidup kamera Android: cleanup unmount di `useEffect` terpisah dengan
    dependency array kosong, terpisah dari listener `visibilitychange`.
15. Aset visual (`.glb`, `.splinecode`, `.riv`, `.wasm`, decoder, benchmark) WAJIB
    di-bundle di `public/3d/` dan dirujuk path relatif. Aplikasi ini offline-first:
    tidak boleh ada satu pun request keluar untuk dekorasi.
16. Komponen 3D wajib `"use client"` + `dynamic(..., { ssr: false })`. Jangan
    pernah mengimpor `three`/R3F/Spline/Rive dari server component atau dari
    `src/lib/**` — direktori itu disalin apa adanya ke mobile.
17. Kemampuan GPU dideteksi, tidak ditebak: `detect-gpu` sekali saat start,
    guard WebGL nyata, fallback 2D, satu konteks WebGL aktif, dan `dispose()` +
    `gl.dispose()` + `forceContextLoss()` saat unmount.
18. Preferensi kualitas visual disimpan device-local di `localStorage`, tidak
    pernah di tabel yang ikut sinkronisasi, dan tidak pernah menambah kolom,
    domain outbox, atau route kanonik baru.
19. Seluruh stempel waktu dan perbandingan kedaluwarsa pada alur pemulihan
    password dan 2FA WAJIB dihitung database (`datetime('now')`,
    `strftime('%s','now')`) — tidak pernah `new Date()` di TypeScript maupun
    jam perangkat di Rust. Satu baris bisa ditulis Rust dan dibaca TypeScript,
    dan `new Date("2026-08-29 10:15:00")` diparsing sebagai waktu lokal.
20. Indeks yang memakai kolom hasil migrasi dibuat SETELAH kolomnya dipastikan
    ada: setelah loop `ensure_column` di `turso.rs`, dan di `INDEX_MIGRATIONS`
    (bukan DDL awal) di `db-migrations.ts`. Satu statement DDL yang gagal
    membatalkan seluruh pipeline, termasuk `ensure_column` yang justru akan
    menambahkan kolomnya — database lama terkunci selamanya.
21. Menambah kolom atau tabel WAJIB menaikkan sentinel schema Rust DAN angka
    yang diperiksa `ensure_schema_current`. Sentinel terakhir menentukan kapan
    `ensure_schema` dilewati.
22. `TOTP_REQUIRED`, `TOTP_INVALID`, dan `TOTP_ENROLLMENT_REQUIRED` dikembalikan
    langsung dari `desktop_login`, tidak boleh jatuh ke lengan error umum:
    lengan itu meneruskan login ke fallback offline yang hanya memeriksa
    username + password, sehingga 2FA terlewati seluruhnya.
23. Menghapus operator ditolak selama riwayat reset passwordnya masih ada —
    `password_reset_request` ber-CASCADE ke `master_operator`, jadi menghapus
    akun ikut memusnahkan foto bukti. Aturannya ada di jalur Web
    (`operator-admin.ts`) dan Rust (`delete_operator`), dan keduanya wajib sama.
24. `password_reset_request` dan `app_mail_config` cloud-only: tidak pernah
    masuk `SNAPSHOT_TABLES`. Daftar riwayat juga tidak pernah membawa
    `photo_base64` — foto diambil satu per satu lewat endpoint terpisah.
25. MENGAJUKAN reset password dan MENGAKTIFKAN 2FA untuk akun sendiri tidak
    butuh izin apa pun: yang pertama memang terbuka tanpa sesi, yang kedua hak
    setiap operator atas akunnya. Yang di-RBAC adalah `password_reset.view`,
    `password_reset.approve`, `password_reset.delete`, dan
    `two_factor.reset` — tiga terakhir masuk
    `SENSITIVE_MUTATION_PERMISSIONS`. Menyetujui pemulihan berarti menyerahkan
    kendali sebuah akun kepada orang yang berdiri di depan layar, jadi
    peninjaunya wajib memikul itu secara sadar.
26. Memulihkan cadangan database MENIMPA seluruh data perangkat, bukan
    menggabungkannya — `database_backup.restore` karena itu juga masuk
    `SENSITIVE_MUTATION_PERMISSIONS`. Database lama tetap disimpan
    berdampingan, sehingga salah pilih berkas masih bisa dibatalkan manual.
27. Perintah yang HANYA ada di biner Mobile ditulis di modul di luar daftar
    salin `sync-rust-modules.ts` (`device_storage.rs`) dan namanya WAJIB
    berawalan `mobile_`. Awalan itu yang dipakai `audit:contract` untuk
    membedakan "command hantu" dari "command khusus Mobile"; tanpa awalannya,
    gateway bersama yang memanggilnya akan dilaporkan sebagai cacat. Di sisi
    gateway, panggilannya wajib berada di dalam blok
    `if (isMobileRuntime()) { … }` — guard positif, bukan
    `if (!isMobileRuntime()) throw`, karena bentuk itulah yang dikenali audit.
28. Android TIDAK boleh menulis ke `/storage/emulated/0/Download`. Sejak
    Android 10 (scoped storage) penulisan itu ditolak, dan yang paling berbahaya
    adalah bentuk kegagalannya: berkas tetap dibuat di folder privat, pemanggil
    melaporkan sukses, dan pengguna tidak pernah menemukan hasilnya. Pakai
    dialog Storage Access Framework (`tauri-plugin-android-fs`) — pengguna yang
    memilih tujuannya, dan tidak ada permission manifest yang perlu diminta.
    Pemakainya WAJIB memakai `android_fs_async()`, bukan `android_fs()`:
    dialognya menunggu manusia, dan memblokir thread runtime selama itu
    membekukan seluruh antarmuka termasuk dialog yang sedang ditunggu.
29. `company_profile` adalah tabel PLATFORM, bukan domain contoh. Bentuknya
    baris tunggal ber-kunci konstanta `'default_company'`, dan barisnya
    SENGAJA tidak di-seed saat provisioning: menyeednya berarti setiap perangkat
    baru mendorong "Nama Perusahaan" ke cloud lewat outbox, dan perangkat yang
    sinkron belakangan menimpa identitas asli yang sudah diisi orang lain. Ia
    dibuat saat pertama kali DISUNTING, bukan saat pertama kali dibaca.
30. `SNAPSHOT_SOURCES` di `turso.rs` WAJIB identik dan lengkap dengan `SNAPSHOT_TABLES` di `sync.rs`.
    `SNAPSHOT_SOURCES` adalah sumber tunggal untuk menyusun query SELECT snapshot DAN memasang
    trigger `sync_pulse` di cloud. Tabel yang absen dari `SNAPSHOT_SOURCES` tidak akan pernah
    ditarik oleh perangkat lain dan mutasi dari Web tidak akan pernah memicu pulsa sinkronisasi.
31. Kontrak payload QR Scanner mewajibkan format `id|token`. Scanner memeriksa token absensi
    terhadap `master_data.token_absensi`. Setiap pembuatan guru, siswa, atau personil baru WAJIB
    menghasilkan token acak dan menyimpan `qr_code = format!("{id}|{token}")`. DILARANG membuat QR
    hanya berisi `id` tanpa token, karena terminal pemindai dijamin menolaknya.
32. DILARANG menambahkan `UNIQUE` constraint pada kolom bisnis di tabel lokal/cloud yang ikut
    disinkronkan (selain Primary Key). Tabrakan data offline pada constraint unik akan menggagalkan
    push outbox secara PERMANEN (`next_retry_at = NULL`). Penegakan keunikan (seperti NIS, NISN,
    kode jurusan/mapel) WAJIB dilakukan di lapisan aplikasi (`assert_unique`), bukan skema database.
33. Mutasi multi-tabel relasional (seperti `master_data` dan tabel profil `siswa_data`/`guru_data`)
    WAJIB atomik dan sinkron statusnya. Menghapus/menonaktifkan personil wajib memperbarui `master_data.status_aktif = 'Nonaktif'`.
    Handler cloud DILARANG meng-hardcode `status_aktif = 'Aktif'` atau mengabaikan field relasi (`id_shift`, `no_hp`, `lp`),
    karena pull snapshot berikutnya akan membangkitkan personil nonaktif kembali aktif ("zombie resurrection").
34. Toggle status aktif tunggal (seperti tahun ajaran aktif) WAJIB idempoten di cloud.
    Saat mengaktifkan satu baris (`is_aktif = 1`), handler cloud WAJIB mematikan baris aktif lainnya:
    `UPDATE ... SET is_aktif = 0 WHERE id <> ?` dalam satu transaksi atomik.
35. DILARANG KERAS memodifikasi, me-whitelist, atau melonggarkan skrip audit integritas
    (`audit-sync-contract.ts`, `schema-audit.ts`) demi membuat pengujian lewat secara semu.
    Jika audit gagal, masalahnya ada pada pemanggil (misal: bungkus perintah mobile dengan `if (isMobileRuntime())`),
    bukan pada skrip auditnya.
36. Setiap halaman privat/dashboard WAJIB memasang guard area level halaman:
    `if (!canAccessArea(user, area)) redirect("/forbidden");`. Backend `require_permission` adalah
    jaring pengaman akhir, tetapi UI tetap wajib mencegah navigasi ke area yang tidak diizinkan.
37. Skema Zod di route API WAJIB memakai `.strict()`, DILARANG memakai `.passthrough()`. (Validator sync `sync-schema.ts` dihapus bersama jalur server aplikasi; payload sync kini divalidasi Rust di `apply_event_to_turso`.)
    Nilai enum wajib divalidasi presisi terhadap CHECK constraint cloud, dan objek bersarang
    wajib divalidasi secara rekursif agar data cacat tidak pernah lolos ke antrean sinkronisasi.
38. Pemanggilan IPC Tauri v2 dari frontend WAJIB menggunakan penamaan parameter `camelCase`
    untuk parameter Rust berformat `snake_case` (contoh: `id_rombel: Option<String>` di Rust
    dipanggil dengan `{ idRombel }` di JS). Mengirim `snake_case` membuat Tauri v2 mengisi `None`
    secara diam-diam tanpa melempar error.
39. Pemotongan string di Rust DILARANG menggunakan byte slicing mentah `&str[start..end]` yang rawan
    panic jika string kurang panjang atau indeks memotong karakter multi-byte UTF-8.
    Gunakan iterator karakter yang aman: `s.chars().skip(offset).take(count).collect::<String>()`.
40. Normalisasi nomor telepon dan kontak WAJIB menggunakan modul terpusat `src/lib/operators/contact.ts`
    (format kanonik `+62...`). DILARANG membuat regex atau pembersih manual ad-hoc di komponen UI.
41. Verifikasi fase selesai WAJIB menjalankan `bun run check` penuh (mencakup `cargo test` kedua workspace).
    `bun run check:quick` tidak mengompilasi Rust dan tidak memvalidasi perintah Tauri baru.
42. Pembedaan tegas "di luar SNAPSHOT_TABLES" (Selective / Heavy Payload) vs "Tabel Cloud-Only" vs "Tidak Ikut Sinkronisasi":
    Tabel dengan payload biner/media/foto (seperti `siswa_foto`, `absensi_foto`) sengaja ditempatkan di luar `SNAPSHOT_TABLES`
    semata-mata agar siklus pull snapshot rutin (`apply_table`) tidak membengkak dan memperlambat startup perangkat.
    "Di luar snapshot" HANYA berarti tidak ikut ditarik secara massal (pull). Setiap mutasi lokal (insert/update) pada tabel
    tersebut WAJIB didaftarkan ke `desktop_sync_outbox` dalam transaksi atomik yang sama dan memiliki rute kanonik push
    (`student-photo/save`, `attendance/scan`) ke database cloud, lalu dibaca on-demand jika lokal belum memilikinya.
    Sebaliknya, tabel "Cloud-Only" (`password_reset_request`, `app_mail_config`, `master_operator`) tidak pernah ditulis
    via SQLite lokal melainkan langsung ke cloud via route API. Dan tabel "Device-Local Only" (`desktop_sync_outbox`,
    `desktop_sync_receipt`, `desktop_entity_revision`, `desktop_schema_migration`, `device_id`) tidak pernah didorong
    maupun ditarik. DILARANG menerapkan aturan setengah jalan yang memutus aliran push dari lokal ke cloud ("half-sync").
43. Validasi ketat format, enum, dan MIME type di Rust backend sebelum menulis ke SQLite & outbox (Anti-Outbox Jam):
    SQLite lokal bersifat *loose typing*, sehingga string cacat atau MIME type sembarang (misal `image/bmp`, `text/plain`,
    typo string) dapat tersimpan mulus di perangkat lokal. Namun saat baris tersebut didorong ke LibSQL cloud, validator
    Zod `.strict()` atau CHECK constraint cloud Turso akan menolaknya. Penolakan push outbox di cloud langsung menandai
    event sebagai `failed` permanen dengan `next_retry_at = NULL`. Seluruh antrean outbox sinkronisasi perangkat macet
    selamanya! Backend Rust (`tauri::command` dan fungsi domain) WAJIB memvalidasi format, panjang karakter, batas ukuran
    (base64 foto siswa maks 500 KB, foto absensi maks 2 MB), dan whitelist enum/MIME type secara presisi (contoh:
    `image/jpeg`, `image/png`, `image/webp`) SESUAI PERSIS dengan CHECK constraint cloud SEBELUM menulis ke SQLite
    lokal dan outbox.
44. Scoping hak akses RBAC presisi berdasarkan cakupan nyata data (Scope-Aware RBAC & Least Privilege):
    Jangan menentukan permission guard pada `#[tauri::command]` hanya berdasarkan nama form atau lokasi tombol di UI.
    Analisis cakupan query SQL dan mutasi data yang dieksekusi: jika suatu command menyentuh seluruh personil aktif di
    `master_data` (mencakup siswa, guru, dan karyawan/pegawai — contoh: `desktop_backfill_id_cards`), DILARANG menggunakan
    permission parsial domain tunggal (`students.manage`). Menggunakan `students.manage` pada operasi multi-entitas
    menciptakan celah eskalasi hak akses (*privilege escalation*), di mana pemegang izin kelola siswa dapat memicu
    penerbitan atau manipulasi data kartu guru dan staf kantor. Gunakan permission yang mencakup domain seluruh personil
    (`employees.manage`) atau izin infrastruktur yang berwenang.
45. Urutan kanonik dokumen Rust dan penempatan atribut `#[tauri::command]` (Anti-Regex Audit Failure):
    Skrip audit integritas (`audit-sync-contract.ts`) mengekstrak command menggunakan regex parser terikat
    (`/#\[tauri::command\][\s\S]{0,200}?\bfn\s+([a-z_][a-z0-9_]*)/g`).
    Urutan penulisan di Rust WAJIB mengikuti urutan standar:
    1. Doc comments (`/// ...`)
    2. Atribut `#[tauri::command]`
    3. Deklarasi fungsi `pub fn desktop_...`
    DILARANG meletakkan komentar dokumentasi `///` di antara `#[tauri::command]` dan nama fungsi `pub fn ...`.
    Komentar panjang (>200 karakter) di sela atribut mematahkan regex audit dan membuat command dilaporkan tidak
    terdefinisi (*missing defined command*), menggagalkan seluruh gerbang kualitas.
46. Prioritas Native Save Dialog sebelum Web File System Access API (Anti-Silent Abort pada WebView & Browser):
    Pengecekan runtime native `if (isDesktopRuntime())` WAJIB ditaruh di urutan PERTAMA pada fungsi penyimpanan berkas
    (`saveFileWithPicker`), SEBELUM pengecekan API browser `if ('showSaveFilePicker' in window)`.
    Penyebab: WebView Android modern (Chromium) mengekspos properti `window.showSaveFilePicker === true`, namun WebView
    TIDAK mengimplementasikan dialog pemilih berkas bawaan browser desktop secara penuh sehingga pemanggilannya langsung
    melempar `AbortError`. Blok catch yang menganggap `AbortError` sebagai pembatalan oleh pengguna (`cancelled: true`)
    menyebabkan proses ekspor/unduh berkas berhenti diam-diam (*silent return*) tanpa pernah memanggil command Rust native
    (`mobile_save_file_to_device` via SAF di Android atau `desktop_save_file` di Desktop).
    Selain itu, di browser laptop (Web), pemanggilan `showSaveFilePicker` wajib dilakukan langsung tanpa didahului operasi
    asinkron berat/FileReader yang dapat mematikan token *transient user activation* (gesture klik mouse), agar dialog simpan
    browser laptop tidak diblokir oleh browser security policy.

## Pemulihan password & verifikasi dua langkah

Alur "Lupa Password" punya langkah inti `lookup` → `confirm` → `verify` →
`inspect-token` → `complete`, ditambah `route` dan `recover-with-code` —
dilayani `POST /api/password-reset` di Web dan command
`desktop_password_reset_*` di Desktop/Mobile. Seluruhnya tanpa sesi login,
dijaga rate limit `auth_login_rate_limit`, urutan tantangan acak yang hanya
diketahui database, dan token sekali-pakai berumur 30 menit.

**Tokennya punya DUA jalur penyerahan, dan setiap implementasi wajib sepakat.**
`password_reset_route` / `resolvePasswordResetRoute` memilihnya: nilai
eksplisit di `setting_gex_system` menang lebih dulu, baru
`app_mail_config.is_active` dipakai sebagai bawaan — email bila aktif,
`in_app` bila tidak. Urutan itu tidak boleh dibalik: satu database bisa
dilayani Web dan Desktop bergantian, dan bila keduanya menyimpulkan jalur
berbeda sebuah permintaan akan menunggu persetujuan yang tidak pernah diminta.

Pada jalur `in_app`, `verify` **tidak membuat token sama sekali** — barisnya
tetap `Menunggu Verifikasi` dengan `delivery_status = 'Menunggu Persetujuan'`,
dan tokennya baru lahir di layar peninjau saat `approve`. Kalau token dibuat
lebih dulu, bentuk aslinya harus disimpan sampai disetujui, sedangkan database
hanya boleh memegang hash-nya. Cabang ini ADA karena sebelumnya email yang belum
dikonfigurasi membuat pengiriman selalu gagal, dan kegagalan itu
**membatalkan** permintaannya — "Lupa Password" mati total di setiap pemasangan
tanpa penyedia email.

Jalur ketiga, **kode pemulihan cetak**, tidak menunggu siapa pun: delapan kode
diterbitkan saat provisioning Superadmin (dan bisa diterbitkan ulang dari
Pengaturan), disimpan hanya sebagai hash SHA-256, dihapus begitu dipakai.
`generateRecoveryCodes`/`normalizeRecoveryCode` (`src/lib/security/totp.ts`)
dan padanan Rust-nya di `turso.rs` **wajib tetap identik**, termasuk membuang
setiap karakter non-alfanumerik: kode yang dicetak di satu build dipakai untuk
masuk lewat build yang lain, jadi kode yang sama harus menghasilkan hash yang
sama di kedua sisi.

Verifikasi wajah (`src/lib/security/face-liveness.ts`) sengaja tanpa dependensi
dan tanpa berkas model: ia bekerja pada grid piksel RGB mentah. Web mengirim
frame mentah itu ke server dan server **menghitung ulang vonisnya sendiri**
dengan modul yang sama; Desktop/Mobile menghitung vonis di aplikasi (di sana
tidak ada server aplikasi) dan Rust memverifikasi urutan tantangannya terhadap
database. Menggantinya dengan library ML berarti membundel model beberapa MB dan
melonggarkan CSP Desktop yang hari ini `ipc:`-only.

**Verifikasi wajah 1:1 saat scan (schema versi 19)** adalah fitur TERPISAH dan
memang memakai library ML: `@vladmandic/human` 3.3.6 (backend WebGL, tanpa WASM)
di `src/lib/client/face-engine.ts`. Kartu QR menyatakan identitas, wajah
memastikan: terminal menghitung vektor wajah dari frame kamera foto dan
mengirimnya sebagai `wajahModel`/`wajahVektor` di event `attendance/scan`;
backend membandingkannya dengan vektor terdaftar yang dibaca dari DATABASE,
tidak pernah dari payload. Vektor terdaftar hidup di tabel tersinkron
`personil_wajah` (`SNAPSHOT_TABLES`, `delete_missing: true`, rute
`face-template/save|delete`, ikut rencana promosi) supaya terminal offline tetap
bisa memeriksa; isinya int8 base64 (±1,4 KB per karyawan), bukan foto. Vektor
hasil scan TIDAK disimpan, hanya vonis dan skornya di
`absensi_foto.wajah_vonis`/`wajah_skor`. Aturannya dieja kembar dan diuji dengan
vektor yang sama: `validations/face-match.ts` ↔ `desktop/face_match.rs`, dan
blok penegakannya `scanner.rs` ↔ `attendance-processor.ts`. Empat vonis:
`Cocok`, `Tidak Cocok`, `Belum Terdaftar`, `Tidak Diperiksa`. Fitur ini
menumpang foto bukti: berlaku hanya bila foto wajib DAN `scan_face_verify_enabled`
hidup (bawaan mati). Mode `scan_face_mode` bawaan `pantau`; `tolak` hanya menolak
`Tidak Cocok`, karena kamera murah atau model yang gagal dimuat tidak boleh
menahan karyawan di gerbang. Ambang `scan_face_threshold` (0,30–0,95, bawaan
0,55) dikalibrasi dari skor di `/foto-absensi`; mode dan ambang yang tidak sah
ditolak saat disimpan. Mengganti versi library WAJIB mengganti `FACE_MODEL_ID`.
Model (±9 MB) disalin dari `node_modules` ke `public/models/wajah/` oleh
`postinstall` (`scripts/copy-face-models.ts`, di-gitignore); Dockerfile
menjalankannya sesudah `COPY . .` karena `bun install` di tahap deps memakai
`--ignore-scripts`, dan `next.config.ts` mengarahkan `@vladmandic/human` ke
bundel browser karena graf SSR memilih `human.node.js` yang menuntut
`@tensorflow/tfjs-node`. Pendaftaran di `/wajah` (`WajahWorkspace`, di
`filesToCopy`): lewat kamera atau massal dari `personil_foto`, dengan izin
sensitif `face_template.manage`. Kamera foto memakai kamera yang sama dengan
kamera pemindai QR (`liveCameraId`), dan pilihan kamera diingat per perangkat
(`kos.scanner.kamera`). Ini bukan anti-spoofing; foto bukti tetap pengamannya.

2FA memakai TOTP RFC 6238 dengan SHA-1 — bukan pilihan gaya: Google
Authenticator mengabaikan parameter `algorithm` pada URI otpauth dan selalu
memakai SHA-1. Implementasi TypeScript (`src/lib/security/totp.ts`) dan Rust
(`turso.rs`) menguji vektor RFC yang sama, karena keduanya memverifikasi rahasia
yang sama dari database yang sama.

Email dikirim lewat HTTP API (Resend atau Brevo), tidak pernah SMTP, dan
kuncinya dikonfigurasi dari dalam aplikasi lewat tabel `app_mail_config` — bukan
variabel lingkungan, supaya pemilik aplikasi bisa menggantinya tanpa build ulang.

## Dropdown dan konfirmasi data

`components/ui/PilihCari.tsx` menggantikan `<select>` untuk daftar yang isinya
dari data atau panjang (barang, tempat, akun, personil, divisi, shift): satu
baris kotak cari + tombol daftar, tinggi daftar dibatasi, paling banyak 200
baris dirender. Props dan anak `<option>`-nya sama dengan `<select>`, jadi
cukup ganti nama tag; `e.target.value` tetap berlaku. Enum tetap yang pendek
(Kondisi, Tipe, Status) sengaja tetap `<select>` native. Daftarnya lewat portal
karena panel Modal memotong anak ber-`position: fixed`.

`konfirmasiData(rincian)` (`components/ui/KonfirmasiData.tsx`) adalah dialog
"Apakah data yang dicatat sudah benar?" sebelum data manual disimpan, dipasang
di form data manual semua modul. Panggil setelah validasi lokal dan SEBELUM
`isSubmittingRef.current = true`. Keduanya di `filesToCopy`. Halaman Web dan
Mobile yang kodenya terpisah wajib dipasangi keduanya. Sengaja tidak dipasang
pada scan QR, alur masuk (login, lupa password, setup, aktivasi), filter,
ekspor, impor berkas, dan aksi yang sudah punya konfirmasi sendiri. Password,
token, dan API key tidak pernah tampil di ringkasan, cukup "Diubah".

## Lisensi offline Ed25519 (Desktop, Mobile, Web)

Memakai format `LIS1` yang sama dengan aplikasi KOS lain, tetapi dengan
produk dan kunci sendiri: `kos-absensi-perusahaan`,
public key di `PRODUCT_PUBLIC_KEY_HEX` (`desktop/license.rs`, tersalin ke
Mobile) dan `server/license.ts`. Penerbitnya di luar repo (`C:\dev\lisensi`).
Lisensi produk lain ditolak ("diterbitkan untuk produk lain"), dan kode
perangkat PC yang sama berbeda dengan kode untuk aplikasi KOS lain karena nama
produk ikut di-hash.

- Gerbang Desktop/Mobile: `gate_login` di awal `desktop_login` (menutup jalur
  database dan offline sekaligus), `enforce_any` di `require_any_permission`.
  `payroll/commands.rs` memakai `require_permission` milik `commands.rs`, tidak
  punya salinan sendiri.
- Jalur server aplikasi (`remote.rs`, `/api/sync/push`, `/api/sync/snapshot`,
  `sync-push.ts`, `sync-schema.ts`, `snapshot.ts`, `desktop_get/set_server_url`)
  SUDAH DIHAPUS. Perangkat tanpa database terkonfigurasi mendapat
  `TURSO_NOT_CONFIGURED` dan outbox-nya tetap `pending`; jangan menghidupkan
  kembali transport sync lewat HTTP.
- Layar aktivasi dan kartu Lisensi menampilkan NAMA perangkat (nama komputer,
  merek + model HP lewat `getprop`) di samping kodenya. Nama hanya untuk dibaca;
  lisensi tidak pernah mengikatnya.
- Vektor uji (`VECTOR_V1..V3` di `license.rs` dan `license.test.ts`) dibuat
  `tandaTangani` alat penerbit dengan kunci uji seed `0x01×32` untuk produk ini;
  buat ulang lewat alat itu, jangan diketik.
- Web: `KOS_LICENSE_ENFORCED` DITANAM saat build (`next.config.ts`). Menyala di
  image Docker, paket Windows, DAN project Vercel milik klien SEWA (isi env
  project sebelum build; ini wajib, bukan opsional). Project demo milik sendiri
  dibiarkan mati. Gerbangnya `requireWebPermission`/`requireWebSession`, route
  login, dan route bootstrap. Di Vercel kode instance `S-…` tetap terikat ke
  database klien, dan kolom `website` lisensi diisi domain produksi saja.
- `/setup` + `KOS_SETUP_TOKEN` (min. 32 karakter) adalah satu-satunya jalan
  membuat Superadmin pertama dari browser; tanpa token jawabannya 404.
- Paket self-hosted (`deploy/`) hanya satu aplikasi: database, aplikasi, Caddy.
  Paket Windows memakai port internal 3100 dan tugas Windows "Absensi
  Perusahaan" supaya bisa berdampingan dengan paket aplikasi KOS lain.
- Vault token database Desktop memakai SPPGTV3 (kunci di Credential Manager,
  layanan `id.absensi.perusahaan.turso-vault`); Mobile tetap SPPGTV2.

## Stack visual 3D & animasi

Hanya delapan kategori ini yang disetujui; selebihnya butuh persetujuan pemilik
repositori.

| Kategori | Tools | Beban GPU/RAM | Peran |
| :-- | :-- | :-- | :-- |
| 3D Rendering | React Three Fiber (v9+) + Drei | Menengah (dapat diturunkan) | Objek 3D penuh, interaksi model, visualisasi data |
| No-Code 3D | Spline (`@splinetool/react-spline`) | Menengah | Kartu hero & maskot interaktif siap pakai |
| Pseudo-3D & Animasi UI | Motion (Framer Motion) | Sangat rendah | Tilt 3D, parallax hover, transisi layout |
| Animasi Mikro / Status | Rive (`@rive-app/react-canvas`) | Sangat rendah (`.riv` < 50 KB) | Ikon interaktif & indikator status sinkronisasi |
| Komponen Visual Modern | Aceternity UI & Magic UI (di-vendor) | Rendah | Spotlight, bento grid, glowing border, glassmorphism |
| Deteksi Hardware | `detect-gpu` | Nol (sekali di awal) | Menentukan tier kualitas sesuai spek laptop/HP |
| Kompresi Aset | Draco / GLTF-Transform (devDependency) | Menghemat RAM & CPU | Memperkecil model hingga 80% |
| State Bridge | Zustand | Sangat rendah | Menjembatani data SQLite ke canvas tanpa re-render berlebih |

Empat hal yang paling sering menjebak di basis kode ini:

- **Default library menembak CDN.** Rive (runtime WASM), `detect-gpu` (berkas
  benchmark), decoder Draco, dan Spline (scene) semuanya mengunduh dari internet
  bila dibiarkan default. Semuanya wajib ditimpa ke berkas lokal.
- **CSP aset lokal.** `connect-src` pada `web-desktop` sejak v19 adalah
  `'self' ipc: http://ipc.localhost` (disetujui untuk model wajah); WASM
  butuh `script-src` dengan `'wasm-unsafe-eval'`. Melonggarkan CSP adalah
  perubahan keamanan — minta persetujuan pemilik repositori lebih dulu, dan
  jangan pernah menambahkan host eksternal atau `'unsafe-eval'`.
- **Kamera dan WebGL berebut GPU.** Jangan pernah memount canvas 3D di halaman
  pemindai selama stream kamera aktif; itu memicu panas, frame drop, dan pada
  sebagian perangkat Android mematikan kamera — persis kegagalan yang dicegah
  aturan 14. Halaman pemindai cukup efek Motion/CSS 2D.
- **Tailwind v4, tanpa berkas konfigurasi.** Dokumentasi Aceternity/Magic UI
  menyuruh menambah `keyframes` di `tailwind.config.js`; di sini definisikan via
  `@theme` di `globals.css` dan jangan membuat `tailwind.config.ts`.

Selebihnya: hormati `prefers-reduced-motion`, pakai `frameloop="demand"` untuk
scene statis, hentikan render loop saat aplikasi tidak terlihat, dan pasang paket
visual di kedua workspace dengan versi pinned yang sama. Komponen bersama ditulis
di `web-desktop/src/components/visual/` dengan store di
`web-desktop/src/lib/stores/`; keduanya wajib didaftarkan ke `dirsToCopy` pada
`mobile/scripts/sync-frontend-lib.ts` karena script itu tidak menyalin
`src/components` secara default.

## Inventaris (schema versi 20)

Diport dari aplikasi manajemen sekolah (`inventory-prd.md` di repo itu),
lalu disesuaikan untuk perusahaan. Tiga tabel tersinkron (`inventory_barang`,
`inventory_mutasi`, `inventory_unit`) dan view `inventory_saldo`; logika di
`desktop/inventory.rs` (disalin ke Mobile) dan kembarannya
`validations/inventory.ts` + `services/inventory.ts`.

- **Stok tidak pernah disimpan.** Stok = jumlah mutasi. Kolom stok yang ikut
  sync ditimpa siapa terakhir menang saat dua perangkat offline.
- **Mutasi append-only.** Koreksi lewat `Pembatalan` berid `batal-<id>`, jadi
  dua perangkat yang membatalkan mutasi yang sama menghasilkan PK yang sama.
- **Cloud tidak pernah menolak karena stok.** Saldo minus diterima dan muncul
  sebagai peringatan "Stok minus"; opname yang membetulkannya.
- **Penerima `Divisi`** menggantikan `Rombel` milik versi sekolah. Tidak ada
  tabel master divisi: namanya diambil dari `master_data.divisi` personil
  aktif, disimpan di `penerima_nama` dengan ejaan yang ada di data personil,
  dan `penerima_id` kosong. Aturannya kembar di Rust dan TS.
- `inventory.adjust` (opname, pembatalan, Rusak/Hilang/Kedaluwarsa) sensitif
  dan tidak ikut paket bawaan Admin. `dicatat_oleh` selalu dari sesi.
- Mutasi ditarik utuh setiap ada pulsa (tanpa tarikan inkremental seperti
  versi sekolah). Bila suatu saat terasa lambat, tambahkan cache saldo lokal
  yang tidak ikut sync, jangan kolom stok.

### Impor Excel dan kolom tambahan barang (schema versi 25)

Diport dari versi sekolah (v53 di sana).

- **Impor** (`validations/inventory-import.ts`, tombol di tab Barang, juga di
  tampilan kosong) menyimpan per baris lewat `simpanBarangInventaris` dan, untuk
  barang BARU bersaldo, `catatMutasiInventaris` Masuk "Saldo Awal". Tidak ada
  command atau rute kedua. Kode yang cocok dengan barang lama mengubah barang
  itu dan TIDAK PERNAH menambah stok (impor ulang berkas yang sama akan
  menggandakan saldo). Judul kolom yang tidak ada di file = nilai lama
  dipertahankan, sel kosong = dikosongkan; judul asing diabaikan dan dilaporkan.
- **Pembaca Excel** satu-satunya: `lib/client/xlsx.ts` (`readWorkbookTable`),
  dipakai impor barang DAN impor karyawan. XML dibaca dengan pola, bukan
  `DOMParser`, supaya teruji di `bun test`. Sheet pertama dari urutan tab
  `xl/workbook.xml`; CSV menerima BOM, pemisah titik koma, dan kutip ganda;
  `selAngka` menandai sel bertipe Angka (titik = desimal). Penulisan tetap di
  `excel-export.ts`, yang menyimpan semua sel sebagai teks.
- **Kolom tambahan**: tabel tersinkron `inventory_kolom` (rute
  `inventory-column/save`, `delete_missing: false`, ikut dibuang saat pindah
  database) menyimpan definisi; isinya di `inventory_barang.atribut` (JSON objek
  teks berkunci `id_kolom`). Tidak ada hapus: nonaktif menyembunyikan kolom
  tanpa menyentuh isinya. Tipe `Teks`/`Angka` terkunci sejak dibuat; nama unik
  di aplikasi (DB tanpa UNIQUE, kembaran offline ditandai `nama_ganda`) dan tidak
  boleh sama dengan `NAMA_KOLOM_BAWAAN`; maksimal 20 kolom aktif.
- **Angka** disimpan sebagai teks baku (`is_angka_kanonik` ↔ `isAngkaKanonik`),
  bukan float. Ketikan dan sel Teks dibaca berformat Indonesia (koma desimal,
  titik ribuan, `2.5` DITOLAK bukan ditebak).
- Handler cloud hanya menimpa `atribut` bila payload membawa kuncinya dan
  isinya objek teks (`payload_atribut`), karena perangkat lama tidak mengenal
  kolom itu. Sentinel skema cloud Rust kini `-2021`.
- **Hapus permanen (schema versi 26)**: kolom ditandai `dihapus_pada`, BUKAN
  dibuang barisnya (snapshot `delete_missing: false` tidak menyebarkan baris
  yang hilang). Cloud memakai `dihapus_pada = COALESCE(lama, baru)` dan memaksa
  `is_aktif = 0`, jadi perangkat yang belum sinkron tidak bisa menghidupkannya.
  `delete_column` ↔ `deleteColumn` membuang isinya dari setiap barang di
  transaksi yang sama; isi yang masih terkirim dari perangkat lain dibuang
  `validate_atribut` saat barang disimpan. Izin sensitif `inventory.column.delete`
  (di `NOT IN` seed Admin Rust dan `SENSITIVE_MUTATION_PERMISSIONS`); UI meminta
  mengetik `Hapus Permanen`. Sentinel kini `-2022`.
- **Jumlah desimal per barang (schema versi 27)**: `inventory_barang.desimal`
  (0/1, hanya Habis Pakai) berarti SETIAP jumlah barang itu (mutasi, saldo,
  opname, stok minimum) tersimpan ×100 (`SKALA_DESIMAL`): 10,25 kg = 1025.
  Kolom `INTEGER` dan data lama tidak berubah; kontrak TS ↔ Rust tetap bilangan
  bulat, konversi hanya di UI dan Excel (`jumlahDariKetikan`,
  `jumlahDariSelAngka`, `formatJumlah`; isian jumlah selalu teks lewat
  `isianJumlah`/`bacaJumlah` di `gaya.ts`). Terkunci sejak mutasi pertama
  (`punya_mutasi`); impor mempertahankan nilai lama barang bermutasi dan
  melaporkannya. Harga satuan per 1 satuan, jadi nilai = `NILAI_MUTASI_SQL`
  (dibagi 100, dibulatkan ke rupiah terdekat per baris). Cloud hanya menimpa
  `desimal` bila payload membawa kuncinya. Ekspor inventaris menulis sel Angka
  sungguhan lewat penanda opt-in `AngkaExcel` di `lib/client/excel-export.ts`;
  pemanggil lain tetap teks. Sentinel kini `-2023`.
- **Hapus barang (schema versi 32)**: `inventory_barang.dihapus_pada`, pola
  kolom tambahan: baris ditandai + `status_aktif = 0`, tidak dibuang, ikut
  outbox `inventory-item/save` tanpa rute baru; cloud memakai
  `dihapus_pada = COALESCE(lama, baru)` dan memaksa `status_aktif = 0`.
  `BARANG_BISA_DIHAPUS_SQL` (dieja kembar `inventory.rs` ↔
  `services/inventory.ts`) = salah input (`BARANG_SALAH_INPUT_SQL`: tanpa unit,
  setiap mutasi bukan-`Pembatalan` punya `'batal-' || id_mutasi`) ATAU barang
  nonaktif yang habis dipakai (setiap `inventory_saldo` = 0, tanpa Peminjaman
  yang belum kembali penuh, tanpa `inventory_servis` terbuka). Riwayatnya tetap
  terbaca di laporan karena kueri `JOIN inventory_barang` tanpa saring
  `dihapus_pada`; pemilih kartu stok tidak memuatnya. Barang terhapus hilang
  dari daftar kecuali masih bermutasi dari perangkat yang offline
  (`WHERE dihapus_pada IS NULL OR NOT bisa_dihapus`); `save_item_tx` menolaknya.
  Kode barang salah input bebas dipakai lagi, kode barang terhapus lainnya
  dicadangkan (`kode_dipakai` ↔ `kodeDipakai`). Izin sensitif
  `inventory.item.delete` (di `NOT IN` seed Admin Rust dan
  `SENSITIVE_MUTATION_PERMISSIONS`); panel aksi di rincian barang
  (Nonaktifkan/Aktifkan, Hapus dengan ketik `KONFIRMASI_HAPUS_PERMANEN`).
  Sentinel kini `-2028`.

## Pembukuan (schema versi 21)

Fase 1 dari port modul Keuangan sekolah (`nilai-keuangan-prd.md` di repo itu),
disesuaikan ke standar perusahaan: kelompok `Ekuitas` (bukan `Aset Neto`),
laporan Laba Rugi, Neraca, dan Arus Kas. Tabel tersinkron `keu_akun`,
`keu_jurnal`, `keu_jurnal_baris`; logika di `desktop/accounting.rs` (disalin ke
Mobile) dan kembarannya `validations/accounting.ts` + `services/accounting.ts`.

- **Bagan akun bawaan** hanya di `src/lib/validations/akun-bawaan.json`, dibaca
  Rust lewat `include_str!` dan TS lewat import. Seed `INSERT OR IGNORE` di
  ketiga lapis, jadi akun yang diganti nama tidak ditimpa. Akun `sistem`
  dipakai jurnal otomatis (kasbon dan payroll, Fase 2): boleh diganti nama,
  tidak boleh dinonaktifkan. Akun tidak pernah dihapus; menonaktifkan adalah
  "hapus"-nya, karena jurnal lama tetap merujuknya.
- **Saldo tidak pernah disimpan**, jurnal append-only, pembatalan = jurnal
  pembalik `batal-<id>` (`accounting.reverse`, sensitif).
- Header dan seluruh baris jurnal dikirim dalam SATU event
  `accounting-journal/post`; `keu_jurnal_baris` punya domain snapshot sendiri
  (`accounting-journal-line`) tanpa rute push.
- Rumus laporan belum mendukung akun kontra (misalnya Akumulasi Penyusutan):
  akun seperti itu akan menambah, bukan mengurangi, total kelompoknya.
- Belum ada: ekspor PDF (butuh `jspdf` + `jspdf-autotable`, belum disetujui).
- **Tutup buku (schema versi 23, `desktop/tutup_buku.rs`, `services/tutup-buku.ts`).**
  Hanya kunci periode, TANPA jurnal penutup ke Laba Ditahan (keputusan
  pengguna). Gerbangnya satu: `accounting::tulis_jurnal_tx` /
  `assertPeriodeTerbuka`, jadi jurnal manual, kasbon, dan gaji ikut terkunci;
  cloud tidak pernah menolak jurnal karena tanggal. Tahap 2 ikut: dua
  perangkat yang menutup tanggal sama dengan potret saldo berbeda menghasilkan
  versi `Menunggu` untuk diputuskan; jurnal telat menandai tutup buku "perlu
  ditinjau". `diterima_cloud` selalu jam database cloud. Pemberitahuan WA versi
  sekolah TIDAK diport (modul WA tidak ada). `accounting.close` sensitif.

## Jurnal pengadaan inventaris (schema versi 28)

Port Fase A `inventaris-lanjutan-prd.md` dari repo sekolah (di sana v62).
Sumber jurnal baru `Inventaris`; CHECK `keu_jurnal.sumber` dibangun ulang di
keempat lapis (`ensure_journal_source_values`, blok v28 `db-migrations.ts`).
Indeks dan trigger tabel dipasang ulang dari definisinya sendiri di
`sqlite_master` SETELAH baris disalin: trigger pulse cloud hanya dibuat Rust,
dan rebuild dari Web tanpa ini membuat perangkat tidak tahu ada jurnal baru.

- Satu baris Masuk `Pengadaan`/`Hibah` berharga = satu jurnal
  `jrn-inv-<id_mutasi>`, bertanggal tanggal mutasi. "Sudah dijurnal" tidak
  disimpan di mutasi, diturunkan dari keberadaan id itu
  (`SYARAT_JURNAL_INVENTARIS_SQL`, kembar `inventory.rs` ↔ `services/inventory.ts`).
- Penjurnalan hanya dari tab "Dari Inventaris" di Keuangan
  (`components/keuangan/JurnalInventaris.tsx`, di `filesToCopy`; daftar
  `accounting.view`, catat `accounting.manage`). Nilai dihitung ulang dari
  mutasi; semua baris satu transaksi, jadi satu baris di periode tertutup
  menolak seluruh tekan. Akun bawaan: Aset → Peralatan, Habis Pakai → Beban
  ATK, Pengadaan dibayar dari Kas, Hibah → Pendapatan Lain-lain (bagan akun
  perusahaan tidak punya Sumbangan).
- `cancel_mutation` ↔ `cancelMutation` membalik jurnalnya di transaksi yang
  sama. Jurnal yang mutasinya dibatalkan perangkat lain sebelum jurnalnya
  tertarik muncul sebagai "perlu dibalik". Jurnal `Inventaris` tidak bisa
  dibatalkan dari layar Keuangan; akun salah dikoreksi jurnal manual.
- Perangkat lama (CHECK lama) gagal menarik snapshot begitu ada jurnal
  `Inventaris`; semua perangkat wajib diperbarui.

## Servis aset (schema versi 29)

Port Fase B `inventaris-lanjutan-prd.md` dari repo sekolah (di sana v63).
Tabel tersinkron `inventory_servis` (rute `inventory-service/save|close|cancel`,
`delete_missing: false`, ikut dibuang saat pindah database). Hanya barang Aset;
barang yang dilacak per unit wajib memilih `id_unit` (tempat dan kondisinya
diturunkan dari `inventory_saldo`), barang lain per tempat × kondisi dengan
jumlah dibatasi saldo dikurangi servis yang masih terbuka di posisi itu.

- Status TIDAK disimpan: `Dibatalkan` dari `dibatalkan_pada`, `Selesai` dari
  `tanggal_selesai`. Selama servis stok tidak berubah.
- Menutup servis dengan kondisi lain menulis mutasi Pindah `Perubahan Kondisi`
  berid tetap `<id_servis>-kondisi` di transaksi yang sama; mutasi itu tidak
  bisa dibatalkan (`is_mutasi_servis` ↔ `isMutasiServis`). "Tidak Bisa
  Diperbaiki" tidak mengubah stok; afkir tetap lewat Keluar ber-izin
  `inventory.adjust`. Servis yang ditutup final; selama terbuka hanya tanggal
  dibawa, penyedia, dan keluhan yang bisa diubah.
- Handler cloud menulis hanya selama servis masih terbuka, jadi penutupan atau
  pembatalan yang pertama sampai di cloud yang berlaku; event yang kalah
  dilewati, tidak ditolak.
- Servis terbuka ikut `list_inventory` (`servis`) untuk tanda di rincian barang,
  Catat Mutasi (diperingatkan, tidak ditolak), Ringkasan, dan opname (unit yang
  sedang diservis tidak ikut "dicatat tidak ditemukan").
- Biaya servis > 0 masuk tab "Dari Inventaris" sebagai jurnal `jrn-<id_servis>`
  (bawaan Beban Pemeliharaan / Kas), bertanggal tanggal selesai.
- Beda dari sekolah: perusahaan tidak punya hapus barang, jadi pemeriksaan
  barang hanya `status_aktif` (tidak ada `inventory_barang.dihapus_pada`).

## Pengajuan pembelian (schema versi 30)

Port `inventaris-pengajuan-prd.md` dari repo sekolah (di sana v64). Modul
`desktop/inventory_pengajuan.rs` ↔ `validations/services/gateways
inventory-pengajuan.ts`, UI `components/inventory/Pengajuan.tsx` (di
`filesToCopy`). Tabel tersinkron `inventory_pengajuan`,
`inventory_pengajuan_baris`, `inventory_penerimaan`; foto
`inventory_penerimaan_foto` di luar snapshot (pola `absensi_foto`, didorong per
foto, ditarik per id). Rute `inventory-request/save|approve|reject|cancel|close`,
`inventory-receipt/create`, `inventory-receipt-photo/save`. Sentinel `-2026`.

- Status TIDAK disimpan: berurutan Dibatalkan, Ditolak, Menunggu, Selesai
  (ditutup atau semua baris diterima penuh), Diterima sebagian, Disetujui.
  "Diterima" = Masuk `Pengadaan` ber-`id_ref` = id baris tanpa `batal-<id>`.
- ACC hanya atas isi yang dilihat: `sidik_baris` (SHA-256 baris kanonik, kembar
  Rust ↔ TS) harus sama di cloud; suntingan offline yang lebih dulu sampai
  menggugurkan ACC versi lama tanpa event ditolak. Pengaju tidak memutuskan
  pengajuannya sendiri kecuali Superadmin (`validate_pemutus` ↔
  `validatePemutus`).
- Penerimaan memakai inti yang sudah ada dalam satu transaksi: barang baru lewat
  `save_item_tx` ↔ `saveItemTx` berid tetap `brg-<id_baris>` (nama dan satuannya boleh
  dirapikan saat diterima; baris pengajuan tetap ejaan aslinya), Masuk lewat
  `record_mutation_tx`. Jumlah tidak boleh melebihi sisa ACC, hanya diperiksa
  di perangkat. Foto 1–5, MIME sesuai CHECK, maks 600.000 karakter base64,
  diperiksa juga oleh handler cloud.
- Beda dari sekolah: perusahaan tidak punya tombstone, jadi baris pengajuan
  `delete_missing: true` dan `PendingGuard::induk_tertunda` melindunginya di
  upsert DAN di blok hapus selama event header belum terkirim. Tidak ada
  `APPEND_ONLY_TABLES`, jadi penerimaan tabel snapshot biasa. Daftar butuh
  `inventory.view` atau `accounting.view` (`requireAnyWebPermission`, dinilai
  lisensinya sekali memakai izin yang dipegang).

## Pembelian cicilan (schema versi 31)

Port dari Manajemen Sekolah v65 (`inventaris-cicilan-prd.md` di repo sekolah).
Logika `desktop/cicilan.rs` (disalin ke Mobile) dan kembarannya
`validations/cicilan.ts` + `services/cicilan.ts`, UI
`components/keuangan/CicilanWorkspace.tsx` (tab Cicilan di Keuangan) dan
`components/inventory/SyaratCicilan.tsx` (isian syarat di pengajuan dan
penerimaan), keduanya di `filesToCopy`. Kontrak selalu lahir dari pengajuan
v30 bercara bayar `Cicilan` (`inventory_pengajuan.cara_bayar`, bawaan
`Tunai`), berid `cil-<id_pengajuan>`. Tabel tersinkron `keu_cicilan`,
`keu_cicilan_jadwal` (ke-0 = DP), `keu_cicilan_bayar`,
`keu_cicilan_bayar_batal`. Rute `installment/activate|reapprove|close`,
`installment-payment/create`, `installment-payment-cancel/create`; syarat Draf
dan ACC menumpang `inventory-request/save|approve`. Sentinel `-2027`.

- Status, sisa, dan angsuran ke berapa TIDAK disimpan (`status_cicilan` ↔
  `statusCicilan`): Dibatalkan, Ditutup, Draf, Menunggu barang, Menunggu ACC
  ulang, Lunas, Menunggak, Berjalan. "Tertutup" = nominal + potongan
  pembayaran `Bayar` yang tidak dibatalkan, dialokasikan dari `ke` terkecil.
- Bunga tidak pernah dari persen: total bayar − harga tunai (nilai barang yang
  diterima). Pokok/bunga dibagi proporsional dengan pembulatan kumulatif
  (`bunga_kumulatif`, i128 ↔ BigInt); potongan mengurangi bunga dulu, sisanya
  Pendapatan Lain-lain (`susun_jurnal_cicilan` ↔ `susunJurnalCicilan`).
- ACC pengajuan kini juga mensyaratkan `cara_bayar` dan `sidik_syarat` yang
  dilihat; akuntansi memilih akun utang/bunga/denda kontrak (bawaan
  `akun-utang-cicilan` 2-1600, `akun-beban-bunga` 5-1700, `akun-beban-denda`
  5-1800, `sistem: false`; kode sekolah 5-1500/5-1600 sudah dipakai di sini).
- Penerimaan Cicilan wajib penuh dan membawa syarat final (event
  `installment/activate`); total bayar final > yang di-ACC → ACC ulang
  (`validate_pemutus`). Cloud menimpa syarat final hanya selama kontrak belum
  punya pembayaran, jadi mutasi penerimaan yang dibatalkan sebelum ada
  pembayaran mengembalikan kontrak ke Menunggu barang.
- Jurnal penerimaan di tab Dari Inventaris berkredit tetap akun utang kontrak.
  Pembayaran (satu jurnal `jrn-<id_bayar>` bersumber baru `Cicilan`) baru bisa
  dicatat setelah semua mutasi penerimaan berharga dijurnal, ditolak di
  perangkat bila melebihi sisa jadwal, dan tidak pernah ditolak cloud;
  pelunasan kembar tampil "lebih bayar" di bagian Perlu ditinjau.
- `installment.cancel` sensitif: membatalkan pembayaran (Bayar hanya yang
  terakhir, denda kapan saja) dan menutup kontrak. `cancel_mutation` menolak
  mutasi penerimaan yang kontraknya sudah punya pembayaran.
- Beda dari sekolah: tanpa tombstone, jadi `keu_cicilan_jadwal`
  `delete_missing: true` dan `PendingGuard::induk_tertunda` melindungi kontrak
  serta jadwal selama event `inventory-request`/`installment` induknya
  tertunda; tanpa `APPEND_ONLY_TABLES`. CHECK `keu_jurnal.sumber` di semua
  lapis kini `Manual, Kasbon, Payroll, Inventaris, Cicilan, Pembatalan` (DDL
  rebuild v28 sebelumnya ikut memuat `Pembayaran`/`Tagihan` sisa sekolah).

## Label box dan draf opname (tanpa perubahan skema)

Port dari repo sekolah (di sana disebut "dus"). Pengguna melihat kata "Box";
nama di kode (`isiLabelDus`, `aksi "dus-ganda"`, `dusTerhitung`) sengaja sama
dengan sekolah supaya perubahan berikutnya mudah diport. Tanpa tabel, rute
sync, atau Rust: aturan murninya hanya di `validations/inventory.ts` karena
hanya UI yang membaca label, dan `record_opname` tetap menerima angka akhir.

- Label box berisi `INV:<id_barang>#<isi>#<kode cetak>-<nomor>`, hanya untuk
  barang tanpa kedaluwarsa dan bukan per unit, karena box tidak menunjuk batch
  atau unit. Isi tersimpan apa adanya (barang desimal ×100) dan tetap tanpa
  `|`, sehingga terminal absensi menolaknya. Kode cetak acak per sekali cetak:
  tanpa itu "Box 7" dari cetakan baru ditolak sebagai box yang sudah terhitung.
- Pindai box langsung menambah isinya; pindaian pertama mulai dari isi, kecuali
  barisnya sudah diketik (box terbuka), lalu ditambahkan. Box yang sama ditolak
  dalam satu draf, tidak antarperangkat. Barang yang tidak tercatat di tempat
  itu tetap dihitung sebagai baris di luar catatan (`fisik_awal` kosong). Isi
  label bisa salah setelah box dibuka: label dilepas dan sisanya diketik, ini
  prosedur petugas, bukan sesuatu yang bisa dicegah aplikasi.
- Label rak membuka `IsianPindai` di dialog pindai tanpa menutup kamera. Pindaian
  lain ditolak selama isian terbuka supaya ketikan tidak hilang, dan teks `INV:`
  di kolom jumlah ditolak karena pemindai USB mengetik ke elemen yang fokus.
- Draf otomatis di `localStorage` (`kos.inventaris.opname-draf:<id pengguna>:<tempat>`),
  tidak pernah menyentuh stok, outbox, atau tabel tersinkron, dan hanya memuat
  baris yang disentuh supaya baris lain mengikuti saldo terbaru. Dibuang setelah
  simpan berhasil. Draf dari tanggal lain tetap bisa dilanjutkan dengan
  peringatan: saldo sistem dihitung ulang saat disimpan, sehingga mutasi sesudah
  hitungan bisa menjadi selisih palsu.
- Beda dari sekolah: layar cek ulang (`Periksa hasil`) menggantikan
  `konfirmasiData` untuk opname, karena sudah termasuk "aksi yang punya
  konfirmasi sendiri"; jangan dipasang lagi di sana.

## Kasbon karyawan (schema versi 22)

Fase 2 port Keuangan. Tabel tersinkron `keu_pinjaman`, `keu_pinjaman_mutasi`
(append-only), `keu_pinjaman_tunda`; logika `desktop/loan.rs` (disalin ke
Mobile) dan kembarannya `validations/loan.ts` + `services/loan.ts`.

- **Cicilan adalah jatah per BULAN**, bukan per proses gaji seperti versi
  sekolah, karena di sini ada gaji harian/mingguan. `pinjaman_aktif` /
  `pinjamanAktif` mengembalikan sisa jatah bulan itu (`TERPOTONG_BULAN_SQL`):
  proses gaji kedua di bulan yang sama hanya memotong kekurangan proses
  sebelumnya, dan proses yang `REJECTED` mengembalikan jatahnya. Bulan sebuah
  proses gaji = bulan `period_start` (sama dengan `mulai_potong` dan penundaan).
- Kasbon dipotong TERAKHIR dari gaji bersih (`potong_kasbon` / `potongKasbon`),
  jadi gaji bersih tidak pernah negatif; kekurangannya ditandai "dipotong
  sebagian". Titik kaitnya: rekap dan pembekuan di `payroll/commands.rs`, dan
  `computePayrollRecap` di Web. Rumus gaji, pajak, dan BPJS tidak disentuh.
- Saat proses gaji menjadi `PAID`, angsuran (`ang-<item>-<pinjaman>`) dan satu
  jurnal gaji (`pay-<run>`) ditulis di transaksi yang SAMA dengan perubahan
  status, di Rust (`catat_pembayaran_payroll_tx`) dan di PATCH
  `/api/payroll/runs`. Akun sumber pembayaran (Kas/Bank) dipilih di dialog
  Dibayar; parameter `idAkunBayar` opsional dan bawaannya `akun-kas`.
- `loan.approve` sensitif: menyetujui berarti mencairkan uang.

## Hari kerja shift dan hari libur massal (schema versi 24)

Diport dari aplikasi sekolah (`hari_kerja.rs` / `validations/hari-kerja.ts`,
kembar dengan vektor uji yang sama).

- **Libur mingguan adalah ATURAN, bukan baris `tbl_hari_libur`.** Kolom
  `tbl_shift.hari_kerja` menyimpan teks kanonik `"1,2,3,4,5"` (1 = Senin);
  kosong atau rusak berarti tujuh hari, dan bawaan kolomnya tujuh hari supaya
  shift lama tidak tiba-tiba punya hari libur.
- `wajib_masuk` / `wajibMasuk` dipakai Generate Alfa dan audit absensi di
  Rust dan Web. Pada tanggal libur aktif, karyawan yang masuk
  `hari_libur_whitelist` DIJADWALKAN masuk dan bisa kena Alfa; whitelist
  kosong berarti tidak ada yang dijadwalkan. Audit absensi tidak menilai
  tanggal libur sama sekali.
- Rekap payroll (Rust dan `payroll-recap.ts`): jam di luar hari kerja shift
  baris absensinya dihitung jam hari libur (tarif HARI_LIBUR, PP 35/2021).
  Gaji harian (FLAT_DAILY) tidak terpengaruh. Bila tidak ada jenjang
  HARI_LIBUR yang aktif, `apply_holiday_fallback` / `applyHolidayFallback`
  membayar jam hari libur seperti hari biasa; tanpa itu jamnya tidak dibayar.
- Tambah hari libur massal hanya lewat rentang tanggal
  (`desktop_create_holidays_bulk`, `POST /api/holidays/bulk`), memakai rute
  `holiday/create` yang sudah ada per tanggal; tanggal yang sudah terdaftar
  dilewati. Data libur nasional bawaan versi sekolah sengaja TIDAK diport.

## Notifikasi grup Telegram (schema versi 33)

Bot SATU ARAH ke lima grup internal per bidang (`inventaris`, `keuangan`,
`pimpinan`, `armada`, `hrd`); tidak ada perintah dari Telegram yang bisa mengubah data. Dua tabel
KHUSUS CLOUD (sentinel `-2029`): `app_telegram_setting` (key/value: `bot_token`,
`aktif`, `aktif_sejak` UTC, `grup:<bidang>`, `kirim:<kejadian>`; token tidak
pernah dikembalikan ke UI dan tidak pernah disimpan di SQLite perangkat) dan
antrean `notifikasi_telegram` (`kejadian` sengaja tanpa CHECK). Keduanya ikut
`PROMOTION_PLAN`, supaya pesan yang sudah terkirim tidak dikirim ulang dari
database tujuan.

Kejadian TIDAK dikaitkan ke jalur simpan. Pengirim (`desktop/telegram.rs` ↔
`services/telegram.ts`, SQL dan isi pesan kembar di `validations/telegram.ts`)
membaca datanya tiap siklus dan mencatatnya dengan id deterministik
(`pgj-baru:`, `pgj-putus:`, `stok:<tanggal WIB>`, `kasbon:`, `tutup:`, `buka:`,
`buka-pimpinan:`, `gaji:<id log>`), lalu mengirim dengan klaim atomik
(`klaim_oleh`/`klaim_sampai`), coba ulang 3 kali (`statusSetelahGagal`). Tujuh
kejadian: pengajuan baru → Keuangan; ACC/tolak dan ringkasan stok harian (mulai
07.00 WIB) → Inventaris; kasbon (tanpa nama karyawan) dan tutup/buka buku →
Keuangan; status gaji REVIEWED/APPROVED/PAID/REJECTED dan buku dibuka kembali →
Pimpinan. Gaji hanya jumlah pegawai dan total bersih dari `payroll_runs`, dan
totalnya disembunyikan bila pegawainya < 3 (`MIN_PEGAWAI_NOMINAL_GAJI`);
`payroll_items` tidak pernah dibaca. Kejadian sebelum `aktif_sejak` atau lebih
dari 7 hari tidak dikirim. Menambah kejadian = satu SQL sumber + fungsi pesan
kembar + entri `BIDANG_KEJADIAN`/`bidang_kejadian`. Enam kejadian perjalanan
ke grup Armada ada di subbagian "Notifikasi armada" di bawah, dan tiga belas
kejadian HR ke grup HRD di "HRIS fase 8" dan "HRIS fase 9"; seluruhnya 26
kejadian.

**Perangkat lama membatalkan kejadian yang tidak dikenalnya.** Semua build
menguras antrean yang sama, dan `bidang_kejadian` = `None` membuat baris itu
`Dibatalkan`. Sentinel tidak bisa mencegahnya karena sentinel lama tetap ada
di cloud, jadi kejadian baru baru boleh dinyalakan setelah semua perangkat
diperbarui. Sejak fase 8 kejadian baru juga bisa diparkir (lihat "HRIS fase 8"),
yang menyembunyikannya dari build lama tanpa perubahan skema.

`AutoTelegramRunner` berjalan untuk setiap sesi login (`desktop_drain_telegram`
cukup sesi, hasilnya hanya hitungan). Konfigurasi hanya Superadmin
(`settings.manage` + `is_superadmin`), kartunya di tab Pengaturan "Notifikasi",
Web/Desktop saja.

## Perjalanan driver / surat jalan (schema versi 34)

Rincian lengkap dan keputusan pemilik ada di `prd-driver.md`. Logika
`desktop/driver.rs` (disalin ke Mobile) dan kembarannya `validations/driver.ts`
+ `services/driver.ts`, diuji dengan vektor yang sama. UI di
`components/perjalanan/` (di `filesToCopy`): `/perjalanan` untuk dispatcher,
`/driver` untuk driver (Mobile/Desktop; Web hanya pesan). Sentinel `-2030`.

- Delapan tabel tersinkron `drv_*` (`delete_missing: false`, kecuali
  `drv_muatan` yang dilindungi `PendingGuard::induk_tertunda` lewat event
  `trip/save`). Foto `drv_laporan_foto` di luar snapshot, didorong per foto dan
  ditarik per id. Rute: `vehicle-type`, `trip-destination`, `vehicle`,
  `trip-place`, `trip` (`save`), `trip-report/create`, `trip-report-photo/save`.
- **Status, driver, dan kendaraan yang bertugas TIDAK disimpan**: diturunkan
  dari `drv_laporan` yang append-only (`status_perjalanan`, `penugasan`).
  Ganti `Langsung`/`Darurat` berlaku seketika, `Minta Izin` hanya setelah
  `Disetujui`; keputusan adalah laporan baru ber-`id_ref`.
- **Cloud tidak pernah menolak laporan karena urutan atau penugasan**; urutan
  diperiksa di perangkat (`periksa_urutan`) dan kejanggalan menjadi tanda tinjau
  (`tanda_tinjau`), tidak ada yang ditolak otomatis.
- Waktu laporan UTC `YYYY-MM-DD HH:MM:SS` (bentuk `datetime('now')`),
  `diterima_cloud` selalu jam database cloud. Tanggal laporan = tanggal WIB.
- Nomor `<awalan>-<YYMM>-<seri perangkat>-<urut>` (`seri_perangkat`, Web `WEB`),
  jadi dua perangkat offline tidak pernah berebut nomor. Awalan di
  `setting_gex_system.sj_prefix`. Tarif dikunci saat surat jalan dibuat.
- Driver: akun `master_operator` ber-`id_karyawan` (role bawaan `driver`, hanya
  `trip.report`). Laporan driver memakai personil SESI, tidak pernah payload,
  dan hanya di surat jalan yang sedang ditugaskan kepadanya (kecuali ambil
  alih lewat `Ganti Driver` atas namanya). Personil nonaktif = login, sesi Web,
  dan laporannya ditolak. `trip.cancel` dan `trip.tariff` sensitif.
- **Absensi dan gaji**: laporan perjalanan ber-`id_karyawan` pada tanggal WIB D
  = bekerja pada D: tidak di-Alfa-kan, tidak dinilai audit absensi, dan dihitung
  hari hadir FLAT_DAILY (`PELAPOR_PERJALANAN_SQL`, `HARI_HADIR_SQL`, kembar).
- Foto 960 px JPEG ±100 KB (maks 200.000 karakter base64, `image/jpeg` saja),
  hanya dari kamera, berstempel; `foto_sha256` = SHA-256 isi JPEG. Dihapus
  setelah 90 hari jam database (`AutoFotoCleanupRunner`, lokal + cloud, tanpa
  outbox) dengan peringatan 7 hari di layar dispatcher; baris laporan tetap.
- Upah surat jalan dibayar terpisah dari gaji, lihat bagian berikut.

### Pembayaran upah dan lokasi palsu (schema versi 35)

Fase 2 `prd-driver.md` (§14). Sentinel `-2031`. Pemeriksaan jam GPS (§6.1)
SENGAJA ditunda sampai uji HP membuktikan `position.timestamp` bukan jam sistem.

- Dua tabel tersinkron append-only: `drv_upah_bayar` (`Bayar` atau
  `Pembatalan`) dan `drv_upah_bayar_baris` (`<id_bayar>:<id_perjalanan>`,
  menyalin upah saat dibayar). Satu rute `trip-payment/create` (header + baris
  satu event, pembatalan juga), `delete_missing: false`, ikut promosi dan
  dibuang saat pindah database. Pembatalan = baris berid `batal-<id_bayar>`,
  jadi dua perangkat yang membatalkan yang sama menghasilkan PK yang sama.
- **Status bayar tidak disimpan**: `bayar_aktif` ↔ `bayarAktif` = pembayaran
  `Bayar` yang memuat surat jalan itu dan belum dibatalkan. Total tidak dari
  isian, selalu jumlah upah surat jalan saat dicatat.
- **Satu surat jalan satu pembayaran hanya ditegakkan di perangkat**
  (`periksa_bayar_upah` ↔ `periksaBayarUpah`: Selesai, penerima = driver
  pembayaran, belum dibayar). Cloud tidak pernah menolak; bayar ganda dari
  perangkat offline menjadi tanda `dibayar_ganda`, dan status/penerima/upah
  yang berubah setelah dibayar menjadi `upah_berubah` (`tanda_upah` ↔
  `tandaUpah`, ber-`id` surat jalan, ikut `tanda` di daftar surat jalan).
- Surat jalan yang sudah dibayar terkunci dari pindah upah dan dari
  `Disetujui` atas ganti driver (`tolak_bila_dibayar` ↔ `tolakBilaDibayar`,
  `PESAN_SUDAH_DIBAYAR`). Laporan lain sudah ditolak karena surat jalannya
  tertutup, dan tarif hanya bisa diubah selama Direncanakan.
- `trip.pay` sensitif (di `SENSITIVE_MUTATION_PERMISSIONS` dan `NOT IN` seed
  Admin Rust). Rekap (`desktop_trip_wage_recap`, batas `MAKS_REKAP_UPAH` 5.000)
  dan riwayat (`desktop_trip_payments`) cukup `trip.view` atau `trip.pay`;
  halaman `/perjalanan` tetap dijaga area `trip.view`.
- Pembukuan tetap jurnal manual (Q-28): tidak ada sumber jurnal baru, CHECK
  `keu_jurnal.sumber` tidak disentuh.
- Tab **Upah** (`UpahPanel.tsx`, `rekapUpah.ts`, `cetakTandaTerimaUpah.ts`, di
  `filesToCopy`): rekap per driver (penerima upah), per kendaraan AWAL, dan per
  tanggal surat jalan (Q-32), Excel lima sheet, tanda terima A4 tanpa nomor
  (disembunyikan di Mobile).
- **Lokasi palsu**: `drv_laporan.lokasi_palsu` (0/1, kosong = tidak
  diperiksa), tanda `lokasi_palsu`. Command khusus Mobile
  `mobile_location_is_mock` di `mobile/src-tauri/src/mobile/device_location.rs`
  (di luar daftar salin) memakai JNI lewat `with_webview` →
  `jni_handle().exec`; dependensi `jni` WAJIB versi yang sama dengan wry
  (0.21.1), karena `JNIEnv` dari `exec` bertipe crate itu. Tidak ada Kotlin:
  `mobile/src-tauri/gen/` di-gitignore. Hanya laporan dari HP driver yang
  membawa nilainya; cloud mengubah nilai selain 0/1 menjadi kosong, tidak
  pernah menolak.

### Notifikasi armada (fase 3, tanpa perubahan skema)

Fase 3 `prd-driver.md` (§15). Memakai modul Telegram v33 apa adanya: bidang
`armada` dan sakelar `kirim:trip_*` hanya baris baru di `app_telegram_setting`,
jadi versi skema tetap 35 dan sentinel tetap `-2031`.

- Enam kejadian, semuanya ke Armada: `trip_kendala`, `trip_ganti_izin`
  (Darurat/Minta Izin yang belum diputuskan), `trip_lokasi_palsu` (id per
  laporan: `drv-kendala:`, `drv-ganti:`, `drv-palsu:`), serta `trip_selesai`,
  `trip_tidak_jalan`, `trip_dibatalkan` (id per surat jalan lewat `TRIP_TUTUP`,
  jadi laporan penutup kembar dari dua perangkat menjadi satu pesan).
- SQL sumber menyaring `diterima_cloud` (jam cloud), bukan jam perangkat:
  laporan offline yang telat tetap dikirim selama sampai dalam 7 hari, dengan
  baris "Dikirim terlambat (offline)." bila selisihnya > `MENIT_TERLAMBAT` (30).
  Laporan yang surat jalannya belum ada di cloud menunggu siklus berikutnya.
  Teks SQL diperiksa identik Rust ↔ TS oleh `validations/telegram.test.ts`.
- Driver dan kendaraan di pesan = `penugasan` atas laporan SEBELUM kejadian
  (`tugas_sebelum` ↔ `tugasSebelum`); driver = pelapor bila dari HP driver.
  Isinya nama driver dan `<jenis> <plat>` saja: koordinat, foto, upah, dan
  muatan tidak pernah ikut (Q-37). Lokasi palsu ditulis "Perlu ditinjau",
  bukan vonis.
- Tes kembar `catat_armada_dari_data_cloud` (Rust, `TursoClient::local_file`)
  ↔ "kejadian armada" (`services/telegram.test.ts`), data dan pesan sama.

## HRIS fase 1: organisasi, kontrak, profil, dokumen (schema versi 36)

Rincian dan keputusan pemilik di `prd-hris.md` §16. Logika `desktop/hris.rs`
(disalin ke Mobile) ↔ `validations/hris.ts` + `services/hris.ts`, diuji dengan
vektor yang sama; SQL kembar diperiksa harfiah oleh `hris.test.ts`. Sentinel
`-2032`, `REQUIRED_TABLE_COUNT` 79.

- **Tersinkron** (`delete_missing: false`, tidak ada baris yang dihapus):
  `hr_cabang`, `hr_divisi`, `hr_divisi_nama` (setiap nama yang pernah dipakai,
  menumpang `hr-division/save`), `hr_jabatan`, `hr_kontrak` (append-only,
  pembatalan `batal-<id>`). Rute `hr-branch|hr-division|hr-position/save`,
  `hr-contract/create`. `master_data` + `id_cabang/id_divisi/id_jabatan/id_atasan`.
- **Khusus cloud** (Q-30, Q-45): `hr_profil`, `hr_dokumen_jenis`, `hr_dokumen`,
  `hr_dokumen_berkas`. Tidak pernah di SQLite perangkat, tanpa outbox; command
  `desktop_hr_profile*`/`desktop_hr_document*` lewat `TursoClient`, Web lewat
  `/api/hris`. Berkas maks 1 MB, MIME harus cocok dengan tanda tangan bita.
- **`master_data.divisi`/`jabatan_status` tetap teks nama SEKARANG**: scanner,
  kartu ID, dan kueri lama tidak berubah. Simpan divisi/jabatan memperbarui teks
  data kini karyawannya dan menautkan teks yang belum punya master
  (`SELARASKAN_*_SQL`); riwayat tidak ditulis ulang dan tampil lewat
  `DIVISI_KINI_SQL` (laporan bulanan, riwayat, log scan, koreksi, backup).
  Nama divisi lama dicadangkan. Migrasi teks → master hanya di cloud, id dari
  hex nama (`MIGRASI_ORGANISASI_SQL`).
- **Payload `employee/*`**: kunci organisasi absen atau `null` = tidak dibawa
  (perangkat lama, atau yang belum menarik migrasi), `""` = dikosongkan.
  Tanpa `id_divisi`, cloud memetakan teks divisi lewat `hr_divisi_nama` dan
  menormalkannya, jadi event lama tidak mengembalikan nama lama. Impor dan
  form menolak teks divisi/jabatan yang tidak dikenal (Q-44).
- `tanggal_daftar` = Tanggal Masuk (Q-41); handler cloud `employee/update`
  kini menulisnya. `jenis_personil` mengikuti kontrak tidak dibatalkan
  terakhir (`JENIS_DARI_KONTRAK_SQL`, Q-40), isiannya terkunci bila berkontrak.
  Status kerja dan tanda kontrak (`percobaan_lewat`, `pkwt_lewat`,
  `harian_perlu_pkwtt`) diturunkan, angkanya dari `setting_gex_system hr_*`.
- RBAC: `hr.*` (fase 1), `hr.finance.manage` sensitif, `CONFIDENTIAL_PERMISSIONS`
  (pribadi, keuangan, dokumen) tidak ikut paket Admin. Role bawaan `hrd` dan
  `atasan`. Halaman `/hris` memuat Karyawan, Struktur, dan Organisasi, di
  ketiga versi sejak fase 10; isian organisasi di form karyawan Mobile
  (`IsianOrganisasi.tsx`, di `filesToCopy`).

## HRIS fase 2: pengajuan cuti, izin, sakit (schema versi 37)

Rincian dan keputusan pemilik di `prd-hris.md` §17. Logika
`desktop/hr_pengajuan.rs` (disalin ke Mobile) ↔ `validations/hr-pengajuan.ts`
+ `services/hr-pengajuan.ts`, diuji dengan vektor yang sama; SQL kembar
diperiksa harfiah oleh `hr-pengajuan.test.ts`. Sentinel `-2033`,
`REQUIRED_TABLE_COUNT` 84.

- **Tersinkron** (`delete_missing: false`): `hr_jenis_pengajuan` (bawaan dari
  `validations/hr-jenis-bawaan.json`, `INSERT OR IGNORE` di ketiga lapis tanpa
  outbox), `hr_pengajuan` (salinan `kelompok`/`potong_jatah`/`dampak_gaji`
  saat diajukan + `sidik`), `hr_pengajuan_keputusan` dan `hr_cuti_penyesuaian`
  (append-only). Rute `hr-request-type/save`, `hr-request/save`,
  `hr-request-decision/create`, `hr-leave-adjustment/create`. Lampiran
  `hr_pengajuan_berkas` KHUSUS CLOUD (Q-51).
- **Status dan jatah tidak disimpan.** Status = keputusan final pertama
  (`diterima_cloud`, lalu jam perangkat) yang sidiknya cocok dengan isi
  sekarang; `Batal` menang. Satu predikat SQL `PENGAJUAN_BERLAKU_SQL`
  (Rust: makro `berlaku_sql!`) dipakai Generate Alfa, audit, laporan
  kehadiran (kode C/I/S), rekap bulanan, gaji, dan jatah. Cloud tidak pernah
  menolak keputusan; keputusan ganda, isi yang berubah, dan diputus sendiri
  (Q-28) menjadi tanda.
- **A-3**: pengajuan berlaku menutup tanggal itu dari Alfa dan audit, tanpa
  menulis `absensi_harian`; Alfa yang sudah ada kalah di laporan. **A-4**:
  `cuti_dibayar` ↔ `cutiDibayar` di baris agregat rekap gaji: FLAT_DAILY
  +1 hari, HOURLY + `jam_kerja_normal_menit` shift kini (½ untuk setengah
  hari), kecuali tanggal hadir. `Potong Gaji` tanpa kait (tidak ada tipe gaji
  bulanan, Q-48).
- Ditolak di perangkat, tidak di cloud: bertumpuk, melebihi `maks_hari`
  (`satuan_maks`), rentang tanpa hari kerja, dan tanggal di proses gaji
  `PAID`. "Tidak untuk diri sendiri" (urgent, memutus, membatalkan yang
  berlaku) memakai `master_operator.id_karyawan`, juga untuk Superadmin.
- Jatah: periode `ulang_tahun_kerja` berpangkal di tanggal berhak, atau
  `kalender`; dibawa diturunkan tanpa baris; diuangkan dicatat HRD sebagai
  `uang:<karyawan>:<periode>` dan dibayar manual sampai kait fase 4.
- RBAC: `hr.request.view`/`submit` biasa; `hr.request.urgent`,
  `hr.request.decide`, `hr.leave.adjust` sensitif (urgent sama dengan
  menyetujui). HRD: view, submit, decide; Atasan: view, submit, urgent.
  Halaman `/pengajuan` (area `pengajuan`) di Web, Desktop, dan Mobile; tab Cuti
  di rincian karyawan dan jenis + aturan cuti di tab Organisasi `/hris`.

## HRIS fase 3: lembur (SPL), tukar shift, dinas luar (schema versi 38)

Rincian dan keputusan pemilik di `prd-hris.md` §18 (Q-55 sampai Q-58). Tanpa
tabel, rute, command, atau izin baru: lima kolom di `hr_pengajuan`
(`jam_mulai`, `jam_selesai`, `id_karyawan_tukar`, `id_shift_asal`,
`id_shift_tukar`, tanpa CHECK, `ensure_column`/`hasColumn`, indeks
`idx_hr_pengajuan_tukar` sesudahnya) dan tiga jenis bawaan. Sentinel `-2034`,
`REQUIRED_TABLE_COUNT` tetap 84. Kolomnya terdaftar di `SNAPSHOT_TABLES`
`hr_pengajuan`; tanpa itu perangkat tidak pernah menarik isiannya.

- **Saringan kelompok.** `PENGAJUAN_RENTANG_SQL` dan `LAPORAN_PENGAJUAN_SQL`
  hanya membaca `KELOMPOK_TIDAK_HADIR` (Cuti, Izin, Sakit, Dinas Luar): Lembur
  dan Tukar Shift tidak pernah menutup Alfa, audit, atau `cuti_dibayar`.
  Keduanya dipaksa `Tidak Berpengaruh` di `validasi_jenis`, supaya perangkat v37
  yang belum diperbarui tidak membayarnya sebagai cuti.
- **Sidik** sembilan bagian fase 2 tetap; Lembur menambah jam, Tukar Shift
  menambah pasangan dan kedua shift. Keputusan lama tidak gugur.
- **Bertumpuk** lewat matriks `bentrok_pengajuan` ↔ `bentrokPengajuan`, kedua
  karyawan tukar ikut dicocokkan (`baca_pengajuan` membaca `id_karyawan_tukar`).
  Tukar ditolak bila salah satu punya `backup_karyawan` Aktif di tanggal itu.
  "Tidak untuk diri sendiri" berlaku untuk kedua karyawan tukar.
- **Tukar shift dibaca dari pengajuan, bukan `backup_karyawan`** (Q-55):
  `TUKAR_RENTANG_SQL` / `muat_tukar` ↔ `muatTukar`. Scanner mengganti shift
  dasar di SATU titik (`shift_tukar_scan` ↔ `shiftTukarScan`, sebelum
  `base_shift`/`baseShiftRow`), Generate Alfa menilai tanggal tukar kemarin dan
  hari ini terpisah dengan shift tukarnya, audit mengganti shift tanggal itu,
  laporan kehadiran membaca `LAPORAN_TUKAR_SQL`. Rekap gaji tanpa kait.
- **Lembur `hr_lembur_mode`** (`otomatis` bawaan / `spl`):
  `lembur_spl` ↔ `lemburSpl` di baris agregat rekap gaji, SEBELUM
  `apply_holiday_fallback`. Per tanggal kerja dibayar `min(SPL, jam)`; di hari
  libur atau libur mingguan seluruh jam hari itu butuh SPL, dipotong dari bagian
  lembur dulu (Q-56). Mode dibaca saat rekap dihitung, termasuk pembekuan (Q-57).
  `LEMBUR_HARIAN_SQL` memakai definisi libur rekap yang sama. FLAT_DAILY tidak
  pernah membayar lembur. Batas `hr_lembur_maks_harian`/`_mingguan` (jam) hanya
  tanda `lembur_lewat_batas`.
- **Dinas luar** lewat jalur fase 2 apa adanya (Q-58): `cuti_dibayar` menurut
  `dampak_gaji`, tanpa setengah hari; `HARI_HADIR_SQL` tidak diubah. Laporan
  kode **DL**, total `dinas` ikut persen hadir; rekap bulanan `totalDinas`.
- **Semua perangkat wajib diperbarui** sebelum Lembur atau Tukar Shift dipakai:
  perangkat v37 memakai `PENGAJUAN_RENTANG_SQL` lama dan melewatkan Alfa
  karyawannya.

## HRIS fase 4: reimbursement (schema versi 39)

Rincian dan keputusan pemilik di `prd-hris.md` §19 (Q-59 sampai Q-62). Logika
di `desktop/hr_pengajuan.rs` (disalin ke Mobile) ↔ `validations/hr-pengajuan.ts`
+ `services/hr-pengajuan.ts`, vektor sama (`hr-pengajuan-reimburse.test.ts` ↔
`fase4_*`), SQL kembar diperiksa harfiah oleh `hr-pengajuan.test.ts`. Sentinel
`-2035`, `REQUIRED_TABLE_COUNT` 86.

- **Klaim = baris `hr_pengajuan` berkelompok `Reimburse`**, kategori = jenis
  pengajuan (lima bawaan `jns-rmb-*`, pemutus `reimburse.decide`, wajib nota).
  Kolom baru tanpa CHECK: `hr_jenis_pengajuan.batas_bulanan`,
  `hr_pengajuan.nominal`, `hr_pengajuan_keputusan.nominal_disetujui`; ketiganya
  di `SNAPSHOT_TABLES.columns`. Seed jenis kini menulis `batas_bulanan`, jadi di
  ketiga lapis seed berjalan SESUDAH kolomnya dipastikan ada (`storage.rs` kedua
  workspace, `db-migrations.ts`). Handler `hr-request-type/save` menimpa
  `batas_bulanan` hanya bila payload membawa kuncinya (perangkat v38).
- **Isian**: satu tanggal biaya (tidak di masa depan), nominal 1–1.000.000.000,
  tanpa urgent (dipaksa 0 saat jenis disimpan), sidik + nominal. Klaim tidak
  pernah bertumpuk (`bentrok_pengajuan` cabang pertama) dan tidak diperiksa
  periode gaji `PAID`.
- **Setujui** Reimburse wajib `nominal_disetujui` 1–nominal (lebih kecil = alasan
  wajib); nominal berlaku = nominal disetujui keputusan yang berlaku, kosong =
  diajukan (`KLAIM_BERLAKU_SQL`). Batal ditolak bila klaim sudah dibayar atau ada
  di proses gaji tidak ditolak. Tanda: `lewat_batas` (peringatan batas bulanan),
  `dibayar_ganda`, `dibayar_batal`; nota kosong tampil di rincian.
- **Status bayar tidak disimpan** (`status_bayar` ↔ `statusBayar`): Dibayar
  (pembayaran terpisah aktif atau `breakdown_snapshot.reimburse` run `PAID`),
  Dalam proses gaji, Belum dibayar. Pembayaran terpisah `hr_reimburse_bayar` +
  `_baris` (rute `hr-reimburse-payment/create`, pola `drv_upah_bayar`, pembatalan
  `batal-<id_bayar>`) selalu tersedia, juga untuk cuti diuangkan (`uang:`,
  Q-62); total dari nominal berlaku, satu karyawan per pembayaran. Penyesuaian
  `uang:` yang sudah dibayar tidak bisa dibatalkan. Pembukuannya jurnal manual.
- **Mode `hr_reimburse_bayar`** (`terpisah` bawaan / `gaji`, lewat aksi aturan
  cuti): `reimburse_gaji` ↔ `reimburseGaji` di rekap DAN pembekuan, ditambahkan
  SESUDAH kasbon (`net = pay.net − kasbon + reimburse`), bruto/PPh/BPJS tidak
  berubah. Saat `PAID`, `periksa_reimburse_run` ↔ `periksaReimburseRun` (di
  `catat_pembayaran_payroll_tx` ↔ `catatPembayaranPayrollTx`) menolak klaim yang
  tidak berlaku, berubah nominal, atau sudah dibayar di tempat lain; jurnal
  `pay-<run>` mendebit `akun-beban-reimburse` (5-1650, akun sistem baru).
- RBAC: `reimburse.decide` sensitif (memutus jenisnya, mencatat dan membatalkan
  pembayaran, membaca ringkasan), tidak ikut paket Admin. Daftar, rincian, dan
  lampiran juga terbuka untuk `reimburse.decide` tanpa `hr.request.view`, tetapi
  hanya klaim Reimburse; area `pengajuan` menerima keduanya. Lampiran boleh
  diubah pemegang pemutus jenisnya. Command baru `desktop_hr_reimburse_overview`,
  `desktop_hr_reimburse_pay`, `desktop_hr_reimburse_pay_cancel`; Web aksi
  `bayar-ringkasan`, `bayar`, `batal-bayar` di `/api/hris/requests`.
- Layar: saringan Reimburse dan tab Pembayaran (`PembayaranReimburse.tsx`) di
  `/pengajuan`; pemutus, batas, dan cara bayar di Organisasi
  `/hris`; baris "Reimburse" di sel Gaji Bersih dan bagian reimbursement di slip.
- **Semua perangkat wajib diperbarui** sebelum klaim dipakai: perangkat v38
  menolak cuti di tanggal berklaim dan bisa memutus klaim tanpa nominal.

## HRIS fase 5: surat peringatan dan karyawan keluar (schema versi 40)

Rincian dan keputusan pemilik di `prd-hris.md` §20 (Q-63 sampai Q-70). Logika
`desktop/hr_keluar.rs` (disalin ke Mobile) ↔ `validations/hr-keluar.ts` +
`services/hr-keluar.ts`, vektor sama; SQL kembar diperiksa harfiah oleh
`hr-keluar.test.ts`. Sentinel `-2036`, `REQUIRED_TABLE_COUNT` 90.

- **Khusus cloud** (Q-63): `hr_sp`, `hr_keluar`, `hr_keluar_rincian`,
  `hr_keluar_alasan` (alasan bawaan dari `validations/hr-keluar-alasan-bawaan.json`,
  `INSERT OR IGNORE` hanya di `turso.rs` dan `db-migrations.ts`). Tidak ada
  rute outbox. Yang tersinkron hanya kolom `master_data.id_keluar`, yang
  **hanya** ditulis transaksi cloud Berlakukan/Batalkan (`BERLAKUKAN_SQL`,
  `BATALKAN_SQL`, kembar) dan tidak pernah ditulis handler `employee/*`.
- **Status SP dan keluar tidak disimpan** (`status_sp`, `status_keluar`).
  Pencabutan SP dan pembatalan keluar adalah kolom yang diisi sekali, bukan
  baris `batal-<id>` (tabelnya khusus cloud). Masa SP `hr_sp_masa_bulan`
  (entri `BATAS_PENGATURAN`, bawaan 6) dibekukan per SP.
- **Berlakukan** terbuka sejak `tanggal_terakhir` (jam database WIB), satu batch:
  `hr_keluar.berlaku_*` + potret checklist, `master_data` Nonaktif +
  `tanggal_selesai_aktif` + `id_keluar`, `master_operator.status` Nonaktif, dan
  sesi Web akun itu dicabut. Ditolak untuk diri sendiri dan untuk karyawan yang
  tertaut ke Superadmin aktif terakhir. **Batalkan** mengembalikan
  `master_data`, tidak pernah mengaktifkan akun.
- **Anti-zombie** (aturan 33): selama `id_keluar` terisi, handler cloud
  `employee/create|update|status` dan Web `services/employee.ts` memaksa
  `Nonaktif` dan mempertahankan `tanggal_selesai_aktif`
  (`STATUS_AKTIF_KELUAR_SQL`, `TANGGAL_SELESAI_KELUAR_SQL`); lokal
  `update_employee`/`set_employee_status` menolak mengaktifkan
  (`PESAN_SUDAH_KELUAR`). Normalisasi ada di biner pengirim, jadi **semua
  perangkat wajib diperbarui sebelum fitur keluar dipakai**.
- **Sesi personil nonaktif** (Q-70): `require_any_permission` dan login offline
  menolak akun yang `id_karyawan`-nya menunjuk personil tidak Aktif di SQLite
  lokal (`tolak_personil_nonaktif`), untuk semua akun termasuk Superadmin.
- **Gaji terakhir** (Q-67): rekap Rust dan `computePayrollRecap` memakai
  `KARYAWAN_REKAP_SQL` (Aktif, atau `id_keluar` terisi dan
  `tanggal_selesai_aktif` ≥ awal periode).
- **Pesangon** (§20.5): usulan bilangan bulat, dibulatkan ke rupiah terdekat.
  Upah sebulan FLAT_DAILY = 30 × harian, HOURLY = tarif × 173, tunjangan tetap
  diisi HRD; UP/UPMK menurut tahun masa kerja dari `tanggal_daftar` × pengali
  persen per alasan; UPH Cuti = sisa cuti periode berjalan × `upah_harian`;
  kompensasi PKWT = upah × bulan / 12. Nominal dan upah yang berbeda dari usulan
  wajib beralasan; rincian beku sejak berlaku. Kasbon dan klaim belum dibayar
  hanya checklist (Q-68); pembayaran pesangon jurnal manual.
- Checklist dibaca dari SQLite lokal di Desktop (`muat_lokal`) dan dari cloud di
  Web: pinjaman barang (`PINJAMAN_PERSONIL_SQL`), sisa kasbon
  (`sisa_kasbon_karyawan`), klaim/`uang:` belum dibayar, pengajuan sesudah hari
  terakhir (`PENGAJUAN_SESUDAH_SQL`), akun tertaut, kartu ID (centang).
- RBAC (Q-69): `hr.warning.view`, `hr.warning.manage`, `hr.offboard.view`
  rahasia (`CONFIDENTIAL_PERMISSIONS`, paket HRD); `hr.warning.cancel` dan
  `hr.offboard.manage` sensitif tanpa paket. Command `desktop_hr_warnings`,
  `desktop_hr_warning_save`, `desktop_hr_warning_revoke`,
  `desktop_hr_offboardings`, `desktop_hr_offboarding`,
  `desktop_hr_offboarding_save`, `desktop_hr_offboarding_apply`,
  `desktop_hr_offboarding_cancel`, `desktop_hr_exit_reasons_save`; Web
  `POST /api/hris/offboarding`.
- Layar: tab SP di rincian karyawan (`SuratPeringatanPanel.tsx`, cetak A4
  `cetakSuratPeringatan.ts` hanya Web/Desktop) dan tab Keluar di `/hris`
  (`KeluarWorkspace.tsx`, termasuk alasan dan pengali). Halaman Karyawan Web
  menampilkan "Keluar <tanggal>".

## HRIS fase 6: penilaian kinerja (schema versi 41)

Rincian dan keputusan pemilik di `prd-hris.md` §21 (Q-71 sampai Q-85). Logika
`desktop/hr_kinerja.rs` (disalin ke Mobile) ↔ `validations/hr-kinerja.ts` +
`services/hr-kinerja.ts`, vektor sama; SQL kembar (masukan disiplin, tulis
cloud, baca) diperiksa harfiah oleh `hr-kinerja.test.ts`. Sentinel `-2037`,
`REQUIRED_TABLE_COUNT` 96.

- **Tersinkron semua** (Q-71), termasuk ke terminal scanner: `hr_kinerja_template`,
  `hr_kinerja_aspek`, `hr_kinerja_jabatan` (PK `id_jabatan` = satu template per
  jabatan tanpa `UNIQUE`), `hr_kinerja_penilaian`, `hr_kinerja_nilai`,
  `hr_kinerja_keputusan`. Rute `hr-performance-template/save` (template +
  aspek + pemetaan yang berubah), `hr-performance/save` (header + semua
  nilai), `hr-performance-decision/create`. Hanya `hr_kinerja_nilai`
  `delete_missing: true`, dilindungi `PendingGuard::induk_tertunda` (id
  `<id_penilaian>:<id_aspek>`). Tanpa seed template.
- **Status, nilai berlaku, dan tanda TIDAK disimpan** (`status_kinerja` ↔
  `statusKinerja`): Dibatalkan, Final (sidik cocok), Diajukan (Ajukan terakhir
  lebih baru dari Kembalikan terakhir, sidik sekarang), Draf. Urutan keputusan
  = `urut_keputusan` pengajuan; `waktu_perangkat` keputusan dihitung database
  berpresisi milidetik dan selalu sesudah keputusan sebelumnya
  (`WAKTU_KEPUTUSAN_SQL`), karena Ajukan dan Kembalikan bisa jatuh di detik
  yang sama. Koreksi = penilaian baru ber-`id_ref` akar; nilai berlaku = Final
  paling akhir di keluarga itu (`kinerja_berlaku`).
- **Handler cloud**: template siapa terakhir menang, `is_bawaan = 1` mematikan
  bawaan lain (aturan 34), `tipe` aspek terkunci, melepas jabatan hanya bila
  masih milik template pengirim. Penilaian ditulis hanya selama belum ada
  `Final`/`Batal` di cloud (event yang kalah dilewati, tidak ditolak);
  perangkat menolak simpan yang akan dilewati itu (`PESAN_FINAL_LAMA`).
  Keputusan append-only, tidak pernah ditolak karena urutan.
- **Disiplin otomatis** (`hitung_disiplin` ↔ `hitungDisiplin`): klasifikasi
  per tanggal sama dengan `susunLaporanKehadiran` + hari perjalanan driver =
  tepat; P = ⌊(2·tepat + telat)·1000 / 2D⌋ ke skor lewat
  `hr_kinerja_ambang_disiplin`. `rincian` teks kanonik ikut sidik; D = 0 =
  skor manual dengan catatan wajib. Ajukan ditolak bila `rincian` ≠ hitungan
  kini (`PESAN_DISIPLIN_BERUBAH`); gateway Desktop/Mobile menjalankan
  `syncNow()` dan menyimpan ulang draf dulu (Q-72).
- Nilai akhir ×100 = Σ bobot × 25 × (skor − 1), tanpa pembulatan; predikat
  dari `hr_kinerja_predikat`, keduanya dibekukan ke keputusan `Final`.
  Pengaturan `hr_kinerja_*` lewat `setting/update`, validator sendiri, TIDAK
  lewat `BATAS_PENGATURAN`.
- RBAC (Q-83 sampai Q-85): `hr.performance.view` dan `hr.performance.assess`
  rahasia (`CONFIDENTIAL_PERMISSIONS`), `hr.performance.finalize` sensitif
  (`SENSITIVE_MUTATION_PERMISSIONS`, mengembalikan, memfinalkan, dan membuat
  koreksi), `hr.performance.config` ikut paket Admin. HRD keempatnya, Atasan
  `assess`. Semua aksi ditolak atas diri sendiri; penilaian atas diri sesi
  baru terbaca setelah Final lewat `view`. Area `pengajuan` juga menerima
  `assess`/`view`. Command `desktop_hr_performance_templates`,
  `_template_save`, `_settings_save`, `_list`, `_detail`, `_save`,
  `_decide`; Web `POST /api/hris/performance`. `_list` dengan `id_karyawan`
  = riwayat semua periode, setiap baris bertanda `berlaku`.
- Layar: `/hris` tab Kinerja (`KinerjaWorkspace.tsx`: Penilaian dan, untuk
  `config`, Template + pengaturan di `TemplateKinerja.tsx`), tab Kinerja
  rincian karyawan (`view`, `RiwayatKinerjaKaryawan`), dan Mobile `/pengajuan`
  tab Penilaian. `PenilaianKinerja.tsx` dipakai keduanya; di `/pengajuan`
  Mobile `modeHp` menyembunyikan Kembalikan, Final, dan Koreksi (Q-72). Tombol aksi
  mengikuti peta `boleh` dari backend.
- **Semua perangkat wajib diperbarui sebelum penilaian dipakai**: perangkat
  v40 tidak mengenal tiga rute baru dan enam tabel snapshot.

## HRIS fase 7: rekrutmen dan pelatihan (schema versi 42)

Rincian dan keputusan pemilik di `prd-hris.md` §22 (Q-86 sampai Q-100). Logika
`desktop/hr_rekrutmen.rs` dan `desktop/hr_pelatihan.rs` (disalin ke Mobile) ↔
`validations/hr-rekrutmen.ts` + `services/hr-rekrutmen.ts` dan
`validations/hr-pelatihan.ts` + `services/hr-pelatihan.ts`, vektor sama; SQL
kembar diperiksa harfiah oleh kedua `*.test.ts` (fragmen makro `concat!`
dipecah lebih dulu). Sentinel `-2038`, `REQUIRED_TABLE_COUNT` 102.

- **Semua khusus cloud** (Q-86, Q-87): `hr_lowongan`, `hr_pelamar`,
  `hr_pelamar_tahap`, `hr_pelamar_berkas`, `hr_pelatihan`,
  `hr_pelatihan_peserta` hanya di `turso.rs` + `db-schema.ts`/`db-migrations.ts`.
  Tanpa tabel snapshot, rute, atau outbox baru; `storage.rs`, `sync.rs` (kecuali
  `CLIENT_SCHEMA_VERSION`), dan `CLOUD_MIRRORED_TABLES` tidak disentuh. Layar
  butuh koneksi ke database, Desktop sekalipun.
- **Status tidak disimpan**: lowongan `Ditutup` bila tombol Tutup ditekan ATAU
  `tanggal_tutup` lewat (Q-88), `Dijadwalkan`, `Dibuka`; pelamar = tahap
  `urutan` terbesar yang tidak dibatalkan; pelatihan `Dibatalkan`,
  `Dijadwalkan`, `Berlangsung`, `Selesai`. Tahap append-only, bebas di antara
  tahap proses, tahap akhir (`Diterima`, `Ditolak`, `Mundur`) mengunci (Q-91);
  urutan tahap dari bacaan terakhir, jadi dua sesi bersamaan bertabrakan di PK.
- **Retensi** (Q-33, Q-93): `HAPUS_PELAMAR_LAMA_SQL` menghapus pelamar tanpa
  `id_karyawan` bila `date(<tutup efektif>, '+N months', '+1 day')` ≤ tanggal
  WIB jam database; N = `hr_pelamar_retensi_bulan` (`BATAS_PENGATURAN`, 1–60,
  bawaan 12, berlaku surut). Satu batch: `pelamar_dihapus` (angka anonim, Q-96)
  ditambah, berkas, tahap, lalu pelamar. `?1` NULL = retensi, `?1` = id = hapus
  lebih cepat (`hr.recruit.delete`). Dijalankan `AutoFotoCleanupRunner`
  (`desktop_hr_recruit_cleanup`, cukup sesi): tidak ada yang login, tidak ada
  yang terhapus. Tanggal hapus yang tampil berasal dari SQL yang sama
  (`tanggal_hapus_sql!` ↔ `TANGGAL_HAPUS_SQL`), bukan `tambah_bulan`.
- **Jadikan karyawan** (Q-92 (a), Q-100): `id_unik`/`kode_karyawan` dari
  `id_dari_pelamar` ↔ `idDariPelamar` (`createEmployeeIdentifiers` atas bagian
  acak `plm-<hex>`), kontrak `ktr-<id_pelamar>`. Desktop/Mobile: validasi dulu,
  klaim cloud `KLAIM_PELAMAR_SQL[0]` (yang kalah = 0 baris), isian awal
  `hr_profil` (Q-94, idempoten), lalu `create_employee_tx` + `catat_kontrak_tx`
  satu transaksi SQLite. Klaim terisi tanpa karyawan = Lanjutkan dengan id yang
  sama; karyawan yang sudah ada di perangkat atau cloud tidak ditulis ulang
  (`sudah_ada`), karena `employee/create` cloud menimpa token. Web atomik penuh
  lewat `withTransaction` dengan `susunTambahKaryawan` (kini juga dipakai
  `tambahKaryawan` sebagai satu batch). Wajib KETIGA izin `hr.recruit.manage`,
  `employees.manage`, `hr.contract.manage`. Pelamar ber-`id_karyawan` terkunci
  dan tidak pernah terhapus; tidak ada "batal jadikan karyawan".
- **Sertifikat = `hr_dokumen` berjenis `dok-sertifikat`** (Q-97), ditulis satu
  batch bersama berkas dan `hr_pelatihan_peserta.id_dokumen` lewat
  `SIMPAN_DOKUMEN_SQL`/`INSERT_BERKAS_DOKUMEN_SQL` (kembar `hris.rs` ↔
  `validations/hris.ts`). `HAPUS_DOKUMEN_SQL` melepas tautan peserta, jadi
  tab Dokumen tidak meninggalkan tautan mati. `hr.training.manage` hanya menulis
  sertifikat yang tertaut ke peserta; berkasnya terbaca lewat
  `BERKAS_SERTIFIKAT_SQL` saja. Biaya satu total per pelatihan, tanpa jurnal.
- RBAC: `hr.recruit.view`/`manage` rahasia (`CONFIDENTIAL_PERMISSIONS`),
  `hr.recruit.delete` sensitif tetapi paket HRD, `hr.training.*` ikut Admin.
  15 command `desktop_hr_vacanc*`/`applicant*`/`recruit_cleanup`/`training*`
  (Desktop 301 / Mobile 307); Web `POST /api/hris/recruitment` dan
  `/api/hris/training`.
- Layar: tab Rekrutmen (`RekrutmenWorkspace.tsx`) dan Pelatihan
  (`PelatihanWorkspace.tsx`) di `/hris`, tab Pelatihan rincian karyawan, dan
  masa simpan pelamar di form pengaturan Organisasi (konfirmasi memperingatkan
  bila dipendekkan). Mobile ikut sejak fase 10.
- **Semua perangkat wajib diperbarui**: begitu cloud naik ke v42, perangkat v41
  berhenti sinkron (`SCHEMA_VERSION_OUTDATED`).

## HRIS fase 8: pengingat dan Telegram HRD (tanpa perubahan skema)

Rincian dan keputusan pemilik di `prd-hris.md` §23 (Q-101 sampai Q-112).
Versi skema tetap 42, sentinel tetap `-2038`, tanpa tabel, kolom, rute, atau
izin baru. Aturan kembar `desktop/telegram.rs` ↔ `validations/telegram.ts` +
`services/telegram.ts`, vektor sama; SQL diperiksa harfiah oleh
`validations/telegram.test.ts`. Command Desktop 302 / Mobile 308.

- **Bidang `hrd`, tujuh kejadian** `hr_kontrak_akhir`, `hr_percobaan_akhir`,
  `hr_dokumen_kedaluwarsa`, `hr_sp_berakhir`, `hr_pengajuan_menunggu`,
  `hr_urgent_belum_diketahui`, `hr_ulang_tahun_kerja`. Semua dicatat
  `catat_harian` ↔ `catatHarian` mulai jam `hr_ingat_jam` WIB jam database
  (`catat_harian_pada` ↔ `catatHarianPada` menerima jam dan jam HR-nya
  supaya bisa diuji). Angka jendela dan jamnya kini pengaturan (lihat "HRIS
  fase 9"); bawaannya tetap 30/7/7/30/2 dan 07.00. Karyawan hanya yang Aktif;
  jabatan = master jabatan, lalu `jabatan_status`.
- **Id**: `hr-kontrak:<id>:jauh|:dekat` (tahap, bukan angka, Q-116), `hr-coba:<id>`,
  `hr-dok:<id>:<tanggal_kedaluwarsa>` (diperpanjang = diingatkan lagi, Q-104),
  `hr-sp:<id>` (hari terakhir berlaku sampai 6 hari sesudahnya, disaring
  `aktif_sejak`), dan tiga ringkasan harian `hr-tunggu:`, `hr-urgent:`,
  `hr-ultah:<tanggal WIB>` (Q-103). Pengingat kontrak dan percobaan hanya untuk
  kontrak terakhir karyawan yang tidak dibatalkan (Q-110).
- **Yang tidak pernah dikirim** (Q-32): SQL sumber tidak membaca NIK,
  `hr_profil`, nominal, alasan, isi SP, nomor dokumen dan kontrak, maupun data
  pelamar; dua ringkasan pengajuan tanpa nama (Q-108). Pesan memuat nama,
  jabatan, jenis dokumen, dan tingkat SP (Q-105). Klaim Reimburse ikut dihitung
  (Q-107).
- **Parkir klaim** (Q-101): baris HR masuk lewat `INSERT_ANTREAN_PARKIR_SQL`
  dengan `klaim_oleh = 'gen:2'` dan `klaim_sampai = '9999-12-31 23:59:59'`.
  Build v33–fase 7 hanya mengambil dan membatalkan baris tanpa klaim berlaku,
  jadi tidak menyentuhnya. `DRAIN_*_SQL` ↔ `TELEGRAM_DRAIN_*_SQL` menambah
  `OR klaim_oleh = 'gen:2'`; gagal kirim yang masih boleh dicoba kembali
  diparkir (`klaim_setelah_gagal` ↔ `klaimSetelahGagal`). `diparkir` = semua
  kejadian bidang `hrd`; kejadian generasi berikutnya memakai `gen:3`. Celah
  tersisa: build fase 8 mati di antara klaim dan hasil kirim, lalu build lama
  membatalkan barisnya setelah 5 menit.
- **Kartu "Perlu perhatian"** (`components/hris/PerluPerhatian.tsx`, tab
  Karyawan `/hris`, ketiga versi sejak fase 10). Dibaca dari
  cloud lewat `desktop_hr_attention` ↔ aksi `perhatian` di `/api/hris/query`
  (Q-102), dari `perhatian` ↔ `perhatianHr` dengan `PERHATIAN_SQL_*` yang
  disusun dari potongan SQL Telegram yang sama; pengajuan memakai
  `SQL_HR_MENUNGGU`/`SQL_HR_URGENT` apa adanya, dan rekrutmen
  `PERHATIAN_REKRUTMEN_SQL` di `hr_rekrutmen.rs` ↔ `hr-rekrutmen.ts` (tanpa
  nama pelamar, Q-111). Gerbangnya `IZIN_PERHATIAN` (salah satu), lalu
  `izin_perhatian` ↔ `izinPerhatian` per bagian di backend: kontrak dan ulang
  tahun kerja `employees.view` (Q-112), dokumen `hr.document.view`, SP
  `hr.warning.view`, pengajuan `hr.request.view` atau `reimburse.decide` (yang
  terakhir hanya hitungan Reimburse), rekrutmen `hr.recruit.view`/`manage`.
  Bagian tanpa izin tidak dibaca dan kuncinya tidak ada. Klik nama membuka
  rincian karyawan pada tab Kontrak, Dokumen, SP, atau Kerja (`tabAwal`).
- Grup Telegram adalah pembaca tanpa RBAC: kartu Notifikasi memperingatkannya
  di kolom grup HRD, dan sakelar `hr_*` lahir mati.

## HRIS fase 9: angka pengingat, kejadian HR baru, kartu di beranda dan Mobile (tanpa perubahan skema)

Rincian dan keputusan pemilik di `prd-hris.md` §24 (Q-113 sampai Q-124).
Versi skema tetap 42, sentinel tetap `-2038`, tanpa tabel, kolom, rute,
command, atau izin baru (Desktop 302 / Mobile 308). Fase 8 dan 9 dirilis
BERSAMA (Q-113 (a)): fase 8 belum pernah dikirim ke klien, jadi id dan
jendelanya boleh diganti dan kejadian baru tetap generasi parkir `gen:2`.

- **Angka pengingat** (Q-114, Q-115): enam entri baru `BATAS_PENGATURAN`
  (`hris.rs` ↔ `validations/hris.ts`), disimpan lewat `setting/update` dengan
  izin `hr.org.manage`, diisi di tab Organisasi `/hris` (kelompok "Angka
  pengingat HR" di bawah angka kontrak, satu tombol simpan):
  `hr_ingat_kontrak_jauh` 30 (8–90), `hr_ingat_kontrak_dekat` 7 (1–30),
  `hr_ingat_percobaan` 7 (1–30), `hr_ingat_dokumen` 30 (1–90),
  `hr_ingat_menunggu` 2 (1–14), `hr_ingat_jam` 7 (0–23). Aturan silang:
  dekat < jauh (`PESAN_INGAT_KONTRAK`), hanya saat disimpan.
- SQL membaca angkanya lewat makro `ingat_*_sql!` di `hris.rs` (dibuka
  `pub(crate) use`, dipakai `telegram.rs` dengan `concat!`) ↔ `INGAT_*_SQL`:
  subkueri `setting_gex_system` berbatas pola `retensi_bulan_sql!`, kosong
  atau rusak = bawaan, dihitung database. SQL sumber Telegram dan SQL kartu
  fase 8 memakai fragmen yang sama; tes teks SQL memecah per fragmen
  (`harapSqlDiRust`). Angka rusak dekat ≥ jauh: jendela jauh kosong, dekat
  tetap (`max(jauh, dekat)`). Angka berlaku setelah terdorong ke cloud.
- **Id kontrak** `hr-kontrak:<id>:jauh|:dekat` (`id_hr_kontrak(id, sisa,
  dekat)`), jadi mengubah angka di tengah jendela tidak melahirkan pesan kedua.
  **Jam**: `SQL_JAM_WIB` membawa `jam_hr`; stok tetap `JAM_RINGKASAN_STOK`.
  Pesan menunggu menerima N (`pesan_hr_pengajuan_menunggu(…, hari)`), dan
  baris `menunggu` kartu membawa `hari`. Jendela SP, ulang tahun kerja, dan
  periode kinerja tetap 7 hari di kode (`HR_HARI_JENDELA`).
- **Enam kejadian baru** (bidang `hrd`, lahir mati, diparkir; 20 → 26):
  `hr_kinerja_menunggu` (`hr-kinerja-tunggu:<tanggal>`, hanya angka),
  `hr_kinerja_periode` (`hr-kinerja-periode:<mulai>`, hari ke-1 sampai ke-7
  sesudah periode `hr_kinerja_periode` berakhir, `periode_kinerja_berakhir`),
  `hr_pelamar_baru` (`hr-pelamar:<tanggal>`, pelamar kemarin per judul
  lowongan, tanpa nama), `hr_lowongan_tutup` (`hr-lowongan:<id>:<tanggal>`,
  H-3 sampai hari H), `hr_pengajuan_baru` (`hr-ajuan:<id>`), dan
  `hr_pengajuan_diputus` (`hr-putus:<id_keputusan>`). Empat pertama di
  `catat_kinerja_rekrutmen` ↔ `catatKinerjaRekrutmen` (akhir `catat_hrd`,
  ikut jam HR); dua terakhir di `catat_pengajuan_hr` ↔ `catatPengajuanHr`
  (dari `catat_kejadian`, disaring `aktif_sejak` dan 7 hari jam cloud).
- Status kinerja tidak di SQL: SQL sumber mengirim keputusan sebagai JSON,
  lalu `status_kinerja` ↔ `statusKinerja`, `ringkas_kinerja_menunggu` ↔
  `ringkasKinerjaMenunggu`, dan `ringkas_kinerja_periode` ↔
  `ringkasKinerjaPeriode` (wajib dinilai = karyawan Aktif yang rentang
  aktifnya beririsan, Q-118). Nilai akhir dan predikat tidak dibaca (Q-117).
- **Per pengajuan** (Q-120 (b), Q-121): nama + kelompok + tanggal, kecuali
  Sakit tanpa nama (`KELOMPOK_TANPA_NAMA`); klaim Reimburse ikut tanpa
  nominal; keputusan = yang pertama bersidik isi sekarang tanpa `Batal`, jadi
  keputusan ganda dan yang gugur tidak dikirim. Alasan tidak pernah dibaca.
- **Kartu "Perlu perhatian"**: bagian `kinerja` (`{ menunggu, menunggu_sejak,
  periode }`, hanya angka) dengan pembantu yang sama dengan Telegram
  (`ringkas_menunggu_cloud`, `jenis_periode_cloud`, `ringkas_periode_cloud`
  ↔ kembarannya). `IZIN_PERHATIAN` 9 (`hr.performance.view`,
  `hr.performance.finalize`; `assess` tidak cukup, Q-122). `perhatian` →
  `perhatian_pada(…, tanggal)` ↔ `perhatianHrPada` supaya jendela periode
  bisa diuji.
- **Layar**: `PerluPerhatian.tsx` menerima `onPilihKaryawan` opsional (tanpa
  itu nama tidak bisa diklik), `onBukaKinerja`, dan `sembunyiBilaKosong` (beranda, Q-123: tidak
  tampil selama memuat atau bila kosong; galat koneksi tetap tampil).
  `TabRincian`/`TAB_RINCIAN` pindah ke `validations/telegram.ts`. Beranda
  Web/Desktop (`app/page.tsx`) membuka `/hris?karyawan=<id>&tab=<tab>`,
  `/hris?tab=kinerja`, dan `/hris?tab=rekrutmen`; `HrisWorkspace` membaca
  parameter itu lewat `useSearchParams` (halaman `/hris` membungkusnya dengan
  `Suspense`). Mobile `/dashboard` memasang kartu yang sama dengan tautan
  yang sama sejak fase 10 (Q-132); tanpa area `hris` tautan Penilaian
  membuka `/pengajuan?tab=penilaian`.

## HRIS fase 10: HRIS di Mobile dan bagan struktur (tanpa perubahan skema)

Rincian dan keputusan pemilik di `prd-hris.md` §25 (Q-125 sampai Q-136).
Versi skema tetap 42, sentinel tetap `-2038`, tanpa tabel, kolom, rute,
command, atau izin baru (Desktop 302 / Mobile 308). Dirilis bersama fase 8
dan 9 (Q-125); HP HRD butuh APK baru.

- **`/hris` di Mobile** (`mobile/src/app/hris/page.tsx`, milik Mobile): guard
  area `hris` (`employees.view`) → `router.replace("/dashboard")`,
  `HrisWorkspace` di dalam `Suspense`. Semua tab dan tab rincian ikut, dijaga
  izin yang sama dengan Web/Desktop (Q-126 sampai Q-128), termasuk Organisasi
  dan Kembalikan/Final/Koreksi/Template kinerja; hanya cetak SP A4 yang
  disembunyikan (`isMobileRuntime()`, Q-131). `/pengajuan` tab Penilaian
  tetap `modeHp`. Bendera `desktopSaja` dihapus dari `navigation.ts` dan
  saringannya dari Menu Mobile; `hris` ada di `KARYAWAN_SHORTCUT_AREAS`.
- **`components/hris` disalin utuh** lewat `dirsToCopy` (bukan lagi empat
  entri `filesToCopy`). Di luar direktori itu komponennya hanya bergantung pada
  `PilihCari`, `KonfirmasiData`, `Modal`, dan `inventory/gaya`. Jangan
  mengimpor `PageHeader`, `FeedbackBanner`, atau `AppShell` dari sana: props
  kedua workspace berbeda.
- **Tata letak HP** menurut lebar layar, tanpa prop `modeHp` baru:
  `DaftarRincian.tsx` (daftar disembunyikan di bawah `lg` selama ada rincian
  atau form, tombol "Kembali ke daftar") dipakai `HrisWorkspace`,
  `KeluarWorkspace`, `RekrutmenWorkspace`, `PelatihanWorkspace`, dan
  `PenilaianKinerja`; baris tab `HrisWorkspace`/`RincianKaryawan` digulir
  mendatar di bawah `sm`. Tidak ada lagi `window.confirm/prompt/alert` di
  `components/hris`: hapus berkas dan dokumen lewat `konfirmasiData`, alasan
  batal penyesuaian cuti diisi di barisnya.
- **Berkas** (`components/hris/berkas.tsx`): `bukaBerkas` satu-satunya jalur
  membuka berkas HRIS, termasuk lampiran pengajuan. Web/Desktop tab baru;
  Mobile gambar di dialog pratinjau (tanpa salinan di HP), PDF lewat
  `saveFileWithPicker` (SAF) dan mengembalikan kalimat untuk ditampilkan
  (Q-129). `siapkanBerkas` dipakai keempat unggahan: gambar > 1 MB diperkecil
  `optimizeImageFile` ke JPEG sisi 2000 px, mutu 0,85 lalu 0,7 (Q-130); PDF
  apa adanya dan tetap ditolak backend bila > 1 MB.
- **Tanpa koneksi**: `hris::tak_terhubung` (dipakai semua modul HR khusus
  cloud) kini juga memetakan `TURSO_NETWORK_ERROR` ke pesan "butuh koneksi ke
  database"; kodenya dipertahankan, kode lain diteruskan. Tidak ada cache data
  khusus cloud di HP (Q-30, Q-45).
- **Bagan** (`components/hris/BaganOrganisasi.tsx`, tab Struktur, ketiga
  versi, `employees.view`, Q-136): logika murni `validations/hris-bagan.ts`
  (`susunBagan`, `rantaiBagan`, `kotakBagan`, `terbukaBawaan`, `bukaRantai`,
  `kelompokUnit`) tanpa kembaran Rust karena hanya layar yang membacanya.
  Simpul = karyawan `Aktif`; lingkaran (dari `atasan_siklus` dan dihitung
  ulang dari karyawan aktif) dan atasan nonaktif/tidak dikenal menjadi akar
  bertanda (`LABEL_TANDA_HRIS.atasan_siklus`/`atasan_nonaktif`); tanpa atasan
  dan tanpa bawahan hanya di kelompok "Belum punya atasan" per divisi (200
  nama pertama, Q-135). Tiga tampilan (Q-133, Q-134): Bagan (bawaan mulai
  `lg`, dua tingkat terbuka, > 8 bawahan ditumpuk ke bawah, paling banyak 400
  kotak dan 12 tingkat, gulir mendatar di dalam kartu), Fokus (bawaan di bawah
  `lg`: rantai atasan, kotak terpilih, bawahan langsung), dan Menurut unit
  (Cabang → Divisi, `<details>`). Garis dari border pseudo-element
  `slate-500`, tanpa CSS baru. Daftar berjenjang lama dihapus.

## HRIS fase 11: rencana dan anggaran pelatihan (schema versi 43)

Rincian dan keputusan pemilik di `prd-hris.md` §26 (Q-137 sampai Q-149).
Logika di `desktop/hr_pelatihan.rs` (disalin ke Mobile) ↔
`validations/hr-pelatihan.ts` + `services/hr-pelatihan.ts`, vektor sama; SQL
kembar diperiksa harfiah oleh `hr-pelatihan.test.ts`, dan vektor
`ringkas_anggaran` ↔ `ringkasAnggaran` satu berkas
(`validations/hr-pelatihan-anggaran.vektor.json`, dibaca Rust lewat
`include_str!`). Sentinel `-2039`, `REQUIRED_TABLE_COUNT` 104, command Desktop
304 / Mobile 310, tanpa izin baru.

- **Khusus cloud** (Q-138, pola Q-87): `hr_pelatihan_anggaran` (PK
  `<tahun>:<id_divisi|umum>`, upsert `SIMPAN_PAGU_SQL`, dihapus barisnya,
  tanpa riwayat, Q-149) dan `hr_pelatihan_rencana` (`rcn-<hex>`, dibatalkan,
  tidak dihapus), plus kolom `hr_pelatihan.id_rencana` (kosong = di luar
  rencana; `ensure_column`/`hasColumn`, indeks `idx_hr_pelatihan_rencana`
  sesudahnya). `storage.rs`, snapshot, rute, dan `CLOUD_MIRRORED_TABLES` tidak
  disentuh; `PROMOTION_PLAN` rencana → pelatihan → peserta.
- **Tahun kalender = tahun `tanggal_mulai`** (Q-139). Pelatihan yang ditautkan
  wajib setahun dengan rencananya (`periksa_rencana_pelatihan` ↔
  `periksaRencanaPelatihan`, juga saat tautannya tetap); tahun rencana terkunci
  selama ada pelatihan tertaut yang tidak batal, dan rencana bertaut tidak bisa
  dibatalkan. Kedua larangan itu dieja ulang di `UBAH_RENCANA_SQL` /
  `BATAL_RENCANA_SQL` supaya tautan yang lahir di sela pemeriksaan menang.
  Build v42 masih bisa memindah tanggal tanpa menyentuh `id_rencana`, jadi
  `REALISASI_SQL` juga membaca pelatihan tahun lain yang menautkan rencana
  tahun itu (tanda `beda_tahun`).
- **Tidak disimpan**: status rencana (`status_rencana` ↔ `statusRencana`:
  Dibatalkan, Terlaksana, Berlangsung, Dijadwalkan, Terlewat, Belum
  dijadwalkan) dan realisasi. Beban divisi = divisi rencananya, tanpa rencana
  = Umum (Q-141). Terikat = biaya pelatihan Dijadwalkan, Terpakai = Berlangsung
  + Selesai, Sisa = Pagu − keduanya, boleh minus (Q-142). Total pagu = jumlah
  semua pagu tahun itu (Q-140); kelompok tanpa baris pagu bersisa kosong.
- **Tanda, tidak menolak** (Q-143): `lewat_pagu`, `rencana_lewat_pagu`,
  `tanpa_pagu`, dan per rencana `lewat_estimasi`, `beda_tahun`. Form
  pelatihan menampilkan sisa pagu kelompoknya (biaya lama dikembalikan dulu
  saat diubah) dan memperingatkan di `konfirmasiData`, lalu tetap menyimpan.
- Divisi wajib aktif saat pagu dibuat atau divisi rencana berubah; pagu lama
  untuk divisi nonaktif tetap bisa diubah. Realisasi adalah biaya yang dicatat
  di pelatihan, bukan jurnal; pembukuan tetap jurnal manual tanpa akun baru
  (Q-146).
- RBAC (Q-145): baca `hr.training.view` atau `manage`, tulis rencana dan pagu
  `hr.training.manage` (jadi paket Admin juga). Command
  `desktop_hr_training_plan`, `desktop_hr_training_plan_save`; Web aksi
  `rencana` dan `rencana_simpan` di `POST /api/hris/training`.
- Layar: pilihan "Pelatihan" / "Rencana dan anggaran" di tab Pelatihan
  `/hris`, pemilih tahun bersama; `components/hris/RencanaPelatihan.tsx`
  (ringkasan per kelompok, isian pagu, rencana dengan `DaftarRincian`, ekspor
  Excel sheet Ringkasan dan Rencana lewat `AngkaExcel` + `saveFileWithPicker`,
  Q-147). Ketiga versi; Mobile ikut lewat `dirsToCopy`.
- **Semua perangkat wajib diperbarui**: begitu cloud naik ke v43, perangkat
  v42 berhenti sinkron (`SCHEMA_VERSION_OUTDATED`).

## HRIS fase 12: berkas transfer gaji ke bank (schema versi 44)

Rincian dan keputusan pemilik di `prd-hris.md` §27 (Q-150 sampai Q-159,
Q-173 sampai Q-176). Logika `desktop/transfer.rs` (disalin ke Mobile) ↔
`validations/transfer.ts` + `services/transfer.ts`, vektor sama
(`validations/transfer.vektor.json`, dibaca Rust lewat `include_str!`); SQL,
konstanta, pesan, dan tanda diperiksa harfiah oleh `transfer.test.ts`.
Sentinel `-2040`, `REQUIRED_TABLE_COUNT` 107, command Desktop 307 / Mobile
313, tanpa izin baru. Aplikasi menyiapkan berkas, TIDAK mentransfer.

- **Khusus cloud** (pola `app_telegram_setting`): `app_bank`,
  `app_bank_rekening`, `app_bank_format`. `storage.rs`, snapshot, rute, dan
  `CLOUD_MIRRORED_TABLES` tidak disentuh; `PROMOTION_PLAN` bank → rekening,
  format. Tanpa UNIQUE; nama/alias bank, rekening (bank + nomor), dan nama
  format unik ditegakkan aplikasi (`bank_bentrok`, `rekening_bentrok`,
  `nama_bentrok`).
- **Bank bawaan** dari `validations/bank-bawaan.json` (19 bank, kode BI
  diverifikasi 13 Nov 2026; BSI 451 dengan alias eks BSM/BNI Syariah/BRI
  Syariah), `INSERT OR IGNORE` hanya di `turso.rs` dan `db-migrations.ts`.
  Tidak ada hapus bank: `hr_profil.bank` tetap teks nama dan dicocokkan lewat
  `cocok_bank` ↔ `cocokBank` (nama lalu alias, huruf besar kecil dan spasi
  dirapikan). Ganti nama menambah nama lama ke alias (Q-176).
- **Nominal = `payroll_items.net_salary`** apa adanya (sudah termasuk kasbon
  dan reimburse mode gaji), dijumlahkan sebagai bilangan bulat. Rekening
  karyawan dibaca saat mengunduh, tidak dibekukan. `susun_transfer` ↔
  `susunTransfer` membagi baris menjadi masuk berkas, "Perlu dibayar manual"
  (`tanpa_rekening`, `bank_tidak_dikenal` termasuk bank nonaktif,
  `tanpa_kode_bank` bila format memakai kode, `nominal_nol`), dan di luar
  cakupan (`sesama`/`antarbank`, untuk berkas yang lain). `nama_berbeda` dan
  `karyawan_keluar` hanya peringatan. Tanda, tidak menolak.
- **Berkas** dirender di TS untuk ketiga versi (`lib/client/berkas-transfer.ts`,
  tanpa kembaran Rust): Excel umum (sheet Transfer, Perlu dibayar manual,
  Ringkasan) dan format kustom CSV/TXT/xlsx dari `app_bank_format.kolom`
  (larik `{isian, judul, teks}`, `validasi_kolom` ↔ `validasiKolom`). Teks
  berisi pemisah selalu dikutip; `desimal` hanya nominal CSV/TXT; CRLF, UTF-8
  tanpa BOM; tanggal selalu `YYYY-MM-DD`. Format bank khusus (lebar tetap,
  baris kepala/total) DITUNDA sampai ada contoh berkas asli (§27.8 langkah 8).
- **Unduh** hanya run `APPROVED`/`PAID`, wajib KEDUA `payroll.run.disburse`
  dan `hr.finance.view` (`IZIN_UNDUH`, Q-157; tidak ada paket bawaan yang
  memegang keduanya). `catat = true` menulis `payroll_audit_logs`
  `TRANSFER_EXPORT` langsung di cloud (status lama = baru, catatan JSON kunci
  urut abjad, Q-156); `PAID` tetap manual (Q-155). Unduhan sebelumnya
  dikembalikan sebagai `riwayat` untuk peringatan unggahan ganda.
- **Pengaturan** (`desktop_transfer_settings_save`, aksi `simpan_pengaturan`)
  khusus `payroll.config.manage` (Superadmin, Q-173). Bacaan
  `desktop_transfer_settings` cukup sesi untuk bank aktif (isian profil
  keuangan); pemegang kedua izin unduh mendapat rekening dan format aktif.
  Web `POST /api/payroll/transfer` (`pengaturan`, `simpan_pengaturan`, `berkas`).
- **Layar**: Pengaturan tab "Transfer Bank" (`TransferBankCard.tsx`,
  Web/Desktop) dengan penyusun kolom dan pratinjau data contoh; tab "Berkas
  Transfer" di rincian proses gaji (`components/payroll/BerkasTransfer.tsx`,
  di `filesToCopy`, dipasang kedua `RunDetailClient`) yang hanya menawarkan
  format umum atau format bank rekening debet; isian bank profil keuangan
  menjadi `PilihCari` (`RincianKaryawan.tsx`). Jejak unduhan tampil terbaca di
  audit trail (`ringkasCatatanUnduhan`).
- **Semua perangkat wajib diperbarui**: begitu cloud naik ke v44, perangkat
  v43 berhenti sinkron (`SCHEMA_VERSION_OUTDATED`).

## Domain contoh

`master_item` dan `log_aktivitas` adalah tabel peraga yang memperagakan pola
lengkap dari UI sampai cloud. Ganti keduanya dengan domain aplikasi ini, ikuti
tabel empat lapisan di atas, lalu sesuaikan `src/lib/rbac/catalog.ts`,
`src/lib/auth/access.ts`, gateway, dan pendaftaran perintah di kedua `lib.rs`.

Detail lengkap ada di `README.md`.
