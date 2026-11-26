# PRD: Saldo tutup buku berubah → grup Telegram Keuangan

Status: langkah 1–7 ditulis 2026-11-21; langkah 8 (antislop, check, uji K7) menunggu pemilik. Acuan: implementasi yang sama di
`C:\dev\sekolah` (2026-11-20).

## 1. Masalah dan tujuan

Tutup buku menyimpan potret saldo setiap akun. Jika sesudahnya ada transaksi yang masuk ke
periode tertutup (biasanya dari perangkat yang offline saat periode ditutup), tutup buku itu
ditandai `perlu_ditinjau` dan muncul di kartu "Perlu perhatian". Tanda itu hanya terlihat oleh
orang yang membuka halaman Keuangan. Tidak ada pemberitahuan ke mana pun, jadi saldo yang
dilaporkan bisa berbeda dari buku tanpa diketahui siapa pun.

Tujuan: begitu saldo periode tertutup berubah, grup Telegram Keuangan menerima satu pesan
untuk setiap tutup buku.

## 2. Keputusan pemilik

| Tanggal | Keputusan |
|---|---|
| 2026-11-20 | Kanal ditentukan penerima. Pihak luar memakai WhatsApp, staf internal memakai grup Telegram per bidang. Perusahaan tidak punya notifikasi WA, jadi tidak ada yang dipindah. |
| 2026-11-21 | Fitur ini dirancang dulu, mengikuti cara sekolah. Kodenya ditulis setelah PRD disetujui. |
| 2026-11-21 | Q-1: "Ditutup oleh" berisi username (`dibuat_oleh`). Q-2: pemeriksaan dijalankan sesi pemegang `accounting.view`. |
| (berlaku) | Bot hanya mengirim satu arah dan grupnya per bidang. Bot dua arah atau grup tunggal tidak ditawarkan lagi. |

## 3. Alur pengguna

- **Admin keuangan / bendahara (anggota grup Keuangan):** menerima pesan
  "⚠️ Saldo berubah sesudah tutup buku sampai 31/08/2026 · Ditutup oleh: … · Ada transaksi baru
  di periode yang sudah ditutup. Tinjau di Keuangan, tab Tutup Buku." Setelah itu membuka
  aplikasi, meninjau selisihnya, lalu menutup ulang (sudah ada: `close-revise`).
- **Superadmin:** tidak perlu mengatur hal baru. Sakelarnya tetap "Tutup buku" di kartu
  Telegram, yang sudah ada. Labelnya diperluas menjadi "Tutup buku, saldo berubah sesudah
  ditutup, dan buka kembali".
- **Pemegang `accounting.view` lainnya:** tidak melihat apa pun yang baru. Sesi merekalah yang
  menjalankan pemeriksaan latar.

## 4. Wajib ada

1. Pemeriksaan latar tiap 30 menit, hanya di sesi yang memegang `accounting.view`. Pemeriksaan
   pertama 60 detik sesudah login.
2. Pemeriksaan menghitung `status`, yang sudah ada, lalu memilih baris `Aktif` yang
   `perlu_ditinjau === true`.
3. Satu baris `notifikasi_telegram` per tutup buku, dengan id `tutup-berubah:<id_tutup>` dan
   kejadian `tutup_buku`, ditulis lewat `INSERT OR IGNORE`. Pengirim Telegram yang sudah ada
   (`AutoTelegramRunner`) yang mengirimnya ke grup Keuangan.
4. Pemeriksaan hanya mencatat bila Telegram aktif, token terisi, `kirim:tutup_buku` = `1`, dan
   `grup:keuangan` sudah diatur.
5. Desktop dan Mobile menghitung dari SQLite lokal. Karena itu pemeriksaan hanya berjalan bila
   sinkronisasi terakhir (`desktop_sync_cursor.updated_at`, domain `operational`) paling lama
   900 detik. Kalau tidak, hasilnya
   `{ diantre: 0, alasan: "Sinkronisasi terakhir lebih dari 15 menit lalu." }`.
   Web membaca cloud langsung, jadi tanpa syarat ini.
6. Isi pesan dan id dieja kembar di TS dan Rust, dan diuji dengan vektor yang sama.

## 5. Di luar cakupan

- Kejadian "versi menunggu keputusan". Ini sudah terkirim sebagai `tutup:<id>` di
  `catat_kejadian` / `catatKejadian`.
- Pesan ke grup Pimpinan.
- Menyebut nominal atau nama akun di pesan. Rinciannya tetap dibaca di aplikasi.
- Pengingat berulang bila belum ditinjau. Satu pesan per tutup buku sudah cukup, dan menutup
  ulang membuat tutup buku baru dengan id baru.
- Notifikasi WhatsApp dalam bentuk apa pun.

## 6. Kriteria penerimaan

| # | Kriteria | Platform |
|---|---|---|
| K1 | Telegram mati, atau `kirim:tutup_buku` mati, atau `grup:keuangan` kosong: pemeriksaan mengembalikan `alasan` ≠ null dan tidak menulis baris. | Semua |
| K2 | Tutup buku `Aktif` dengan `perlu_ditinjau` menghasilkan tepat satu baris `tutup-berubah:<id>` berkejadian `tutup_buku`. Pemeriksaan kedua menghasilkan `diantre: 0`. | Semua |
| K3 | Baris `Menunggu`, `Dibuka`, `Digantikan`, serta `Aktif` yang tidak berubah tidak menghasilkan baris. | Semua |
| K4 | Sinkronisasi terakhir lebih dari 15 menit lalu: `alasan` = "Sinkronisasi terakhir lebih dari 15 menit lalu.", tanpa query ke cloud. | Desktop, Mobile |
| K5 | Sesi tanpa `accounting.view` tidak pernah memanggil command atau route ini. Command dan route juga menolak dengan 403 / `FORBIDDEN`. | Semua |
| K6 | Dua perangkat atau dua tab yang memeriksa bersamaan tetap menghasilkan satu baris. | Semua |
| K7 | Uji manual: tutup buku, catat jurnal bertanggal di periode itu (atau tarik jurnal offline dari perangkat lain). Dalam ±31 menit grup Keuangan menerima satu pesan "⚠️ Saldo berubah …". | Web, Desktop |

## 7. Catatan teknis

**Tabel:** tidak ada tabel atau kolom baru, dan versi skema tidak naik. Yang dipakai
`notifikasi_telegram` dan `app_telegram_setting` (keduanya KHUSUS CLOUD, sentinel `-2029`),
`keu_tutup_buku` (tersinkron), dan `desktop_sync_cursor` (lokal).

**Izin:** tidak ada izin baru. Command dan route memakai `accounting.view`, yang sudah ada di
`DEFAULT_ROLE_PERMISSIONS` untuk role yang bisa membuka Keuangan (`access.ts:54`).

**Aturan kembar TS ↔ Rust:**

| TS (`web-desktop/src/lib/...`) | Rust (`src-tauri/src/desktop/...`) |
|---|---|
| `validations/telegram.ts`: `idTutupBerubah`, `pesanTutupBerubah`, `antreanTutupBerubah` | `telegram.rs`: `pesan_tutup_berubah`, `antrean_tutup_berubah` |
| `services/telegram.ts`: `tutupBukuSiap` (memakai `bacaPengaturan` + `Pengaturan.siap`, yang sudah diekspor) | `telegram.rs`: `tutup_buku_siap`, `antrekan_tutup_berubah` (memakai `rows_affected` hasil `INSERT_ANTREAN_SQL`) |
| `services/tutup-buku.ts`: `notify(client)` | `tutup_buku.rs`: `notify(state)`, `detik_sejak_sync`, `MAKS_DETIK_SINKRON_PEMBERITAHUAN = 900`, `ALASAN_*` |

**Invarian yang berlaku** (rujukan, tidak disalin):
- CLAUDE.md §"Notifikasi grup Telegram (schema versi 33)". Untuk kejadian ini, "Menambah
  kejadian = satu SQL sumber" tidak bisa dipenuhi, karena `perlu_ditinjau` diturunkan dari
  neraca, tidak disimpan. Pengecualian ini wajib ditulis di bagian itu: pencatatnya
  `tutup_buku::notify`, bukan `catat_kejadian`.
- Aturan `aktif_sejak` / 7 hari tidak berlaku. Yang dicatat adalah KEADAAN sekarang, bukan
  kejadian lampau. Akibatnya, menyalakan Telegram pertama kali mengirim satu pesan untuk setiap
  tutup buku yang saat itu memang perlu ditinjau. Itu disengaja.
- Saldo dan status selalu diturunkan, tidak pernah disimpan (aturan keuangan). Fitur ini tidak
  menyimpan "sudah diberitahu" di `keu_tutup_buku`; penanda dedupe-nya adalah id antrean.

**Acuan kode di sekolah** (salin polanya, sesuaikan nama):
`web-desktop/src/lib/services/tutup-buku.ts` (`notify`),
`web-desktop/src-tauri/src/desktop/tutup_buku.rs` (`notify`),
`web-desktop/src/lib/validations/telegram.ts` (`antreanTutupBerubah`),
`web-desktop/src/app/api/accounting/close-notify/route.ts`,
`web-desktop/src/components/AutoPemberitahuanRunner.tsx` (`useKetukBerkala`),
dan tes `tutup_berubah_kembar` / "saldo tutup buku berubah".

## 8. Temuan dari kode

- `perlu_ditinjau` sudah dihitung di `web-desktop/src/lib/services/tutup-buku.ts:123` dan
  `web-desktop/src-tauri/src/desktop/tutup_buku.rs:275`. Rust memakai `saldo_sekarang` dari
  neraca lokal (`tutup_buku.rs:205`).
- Telegram `tutup_buku` hanya mencatat tutup buku baru dan buka kembali:
  `services/telegram.ts:500` dan `telegram.rs:1839` (`TELEGRAM_SQL_TUTUP_BUKU`,
  `validations/telegram.ts:230`).
- Belum ada fungsi "detik sejak sinkron" dan tidak ada modul `uks`. Pembacaan kursornya sudah
  ada di `sync.rs:3529` (`desktop_sync_cursor`, domain `operational`), jadi fungsinya cukup
  ditaruh di `tutup_buku.rs`.
- Belum ada runner 30 menit. Runner yang ada: `AutoTelegramRunner` (60 detik, setiap sesi),
  `AutoAlfaRunner`, `AutoSyncRunner`, `AutoFotoCleanupRunner`, dipasang di `AppShell.tsx:48-51`
  dan `MobileAppShell.tsx:78-81`. Memasang neraca di `AutoTelegramRunner` berarti menghitung
  neraca setiap menit di setiap sesi, jadi ditolak.
- Command `desktop_accounting_close_*` terdaftar di `web-desktop/src-tauri/src/lib.rs:192-197`
  dan `mobile/src-tauri/src/lib.rs:196-201`. Contoh pola izin: `commands.rs:3315`.
  `commands.rs` Mobile TIDAK disalin skrip, jadi wajib disunting sendiri.
- `tutup_buku.rs` dan `telegram.rs` ikut `sync-rust-modules.ts`. `AutoTelegramRunner.tsx` ada
  di `filesToCopy` `sync-frontend-lib.ts`. Runner baru yang identik byte juga masuk ke sana.

## 9. Urutan pengerjaan

| # | Langkah | Gerbang |
|---|---|---|
| 1 | `validations/telegram.ts` + `telegram.rs`: id, pesan, `antrean*`, label `LABEL_KEJADIAN.tutup_buku`. Vektor kembar di `telegram.test.ts` dan `mod tests`. | `bun test validations/telegram.test.ts`, `cargo test telegram` |
| 2 | `services/telegram.ts` `tutupBukuSiap`; `services/tutup-buku.ts` `notify`. Tes integrasi di `services/tutup-buku.test.ts` (database berkas, satu klien) untuk K1–K3 dan K6 (panggilan kedua = 0). | `bun test --timeout 30000 services/tutup-buku.test.ts` |
| 3 | Route `POST /api/accounting/close-notify` (`assertSameOriginMutation`, `requireWebPermission("accounting.view")`, Zod `{}` `.strict()`). | tsc |
| 4 | Rust: `telegram::tutup_buku_siap` / `antrekan_tutup_berubah`; `tutup_buku::notify` + `detik_sejak_sync` (K4). Command `desktop_accounting_close_notify` (`///` sebelum `#[tauri::command]`, `require_permission` dulu) di kedua `commands.rs`, kedua `lib.rs`, kedua `build.rs`, kedua `capabilities/default.json`, kedua `permissions/autogenerated/desktop_accounting_close_notify.toml`. | `cargo test tutup_buku`, `bun run audit:contract` |
| 5 | Gateway `jalankanPemberitahuanTutupBuku` di `gateways/accounting.ts` (Desktop/Mobile → command, lalu `kickDesktopSync` bila `diantre > 0`; Web → route). | tsc |
| 6 | Runner `AutoPemberitahuanRunner.tsx` (`useKetukBerkala`, 30 menit, `hasPermission(user, "accounting.view")`), dipasang di `AppShell` dan `MobileAppShell`, masuk `filesToCopy`. | tsc kedua workspace |
| 7 | Sinkronisasi Mobile (`sync-rust-modules.ts`, `sync-frontend-lib.ts`). Dokumentasi: pengecualian di CLAUDE.md §Telegram, satu baris id `tutup-berubah:`. | grep literal `antrean_tutup_berubah` di salinan Mobile |
| 8 | Pemilik: `jalankan-antislop` lalu `jalankan-check`, lalu uji K7. | `.claude/HASIL.md` segar |

## 10. Pertanyaan terbuka

- **Q-1. Nama di "Ditutup oleh":** username (`dibuat_oleh`, sama dengan sekolah) atau nama
  operator lewat join `master_operator`? Rekomendasi: username, supaya teksnya kembar dengan
  sekolah dan tanpa query tambahan.
- **Q-2. Penjalan pemeriksaan:** sesi `accounting.view` tiap 30 menit (rekomendasi, sama dengan
  sekolah), atau hanya sesi `accounting.close`? Dengan `accounting.close`, pemeriksaan lebih
  jarang berjalan di Desktop/Mobile, karena perangkat pemegang izin itu lebih sedikit.
