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

## Domain contoh

`master_item` dan `log_aktivitas` adalah tabel peraga yang memperagakan pola
lengkap dari UI sampai cloud. Ganti keduanya dengan domain aplikasi ini, ikuti
tabel empat lapisan di atas, lalu sesuaikan `src/lib/rbac/catalog.ts`,
`src/lib/auth/access.ts`, gateway, dan pendaftaran perintah di kedua `lib.rs`.

Detail lengkap ada di `README.md`.
