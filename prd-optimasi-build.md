# PRD: Optimasi Waktu Build Desktop & Mobile Android (Tauri v2 + Rust + Next.js 16)

Status 2026-11-27: **diimplementasikan (Fase 1 & Fase 2)**; siap uji rilis biner K1–K4 pada perangkat/mesin.

## 1. Masalah dan tujuan

Berdasarkan pengukuran langsung stempel waktu artefak build rilis nyata (27 November 2026 pukul 00:05–00:52 WIB), satu siklus build inkremental berurutan untuk Desktop dan Mobile Android sudah memakan **~48 menit**, padahal seluruh 600+ crate dependency pihak ketiga sudah tersimpan di cache lokal. Apabila terjadi *clean build* (mengompilasi ulang 624 crate Desktop dan 538 crate Mobile) atau build Android dijalankan tanpa `--target aarch64` (membangun 4 arsitektur sekaligus), total durasi build menembus **1 hingga 2+ jam**.

Enam akar penyebab yang terverifikasi pada kode dan lingkungan build saat ini:

1. **Crate Rust monolith tunggal dan invalidasi `tauri::generate_context!()` (~32 menit gabungan):**
   - `web-desktop/src-tauri/src` berisi **94.404 baris kode Rust** (40 berkas: 64.995 baris produksi + 29.409 baris `#[cfg(test)]`), **245** blok `#[derive(...)]`, dan **310** fungsi `#[tauri::command]` di dalam satu fungsi *dispatcher* raksasa `tauri::generate_handler!` pada `web-desktop/src-tauri/src/lib.rs:24-335` (serta 316 command pada `mobile/src-tauri/src/lib.rs:28-345`).
   - Di Desktop, makro `tauri::generate_context!()` dipanggil langsung di dalam crate library `web-desktop/src-tauri/src/lib.rs:336`, bukan di biner tipis `web-desktop/src-tauri/src/main.rs`. Setiap kali hasil frontend `web-desktop/out/` (18,0 MB / 281 berkas) berubah, `build.rs` dan *proc-macro* Tauri membungkus ulang aset dan menghanguskan cache crate library 94.404 baris tersebut — sehingga **mengubah 1 baris UI/CSS tetap memaksa `rustc` mengompilasi ulang seluruh 94.404 baris Rust (~18,5 menit di Desktop)**.
   - Selain itu, `build.rs` memasang `cargo:rerun-if-changed=src` dan `SPPG_BUILD_DATE` (`web-desktop/src-tauri/build.rs:345-382` dan `mobile/src-tauri/build.rs:351-388`), yang memaksa crate utama di-build ulang setiap pergantian hari WIB.
2. **Setelan rilis Mobile *single-thread* Fat LTO (~14,5 menit per ABI):**
   - `mobile/src-tauri/Cargo.toml:70-75` memasang `lto = true` (Fat LTO lintas 538 crate) sekaligus `codegen-units = 1`, yang mengunci seluruh optimasi mesin LLVM pada **1 thread CPU tunggal** sepanjang ~14,5 menit untuk satu ABI (`aarch64`).
3. **Pemborosan `crate-type` (>1 GB I/O mati) dan Linker MSVC standar:**
   - Baik `web-desktop/src-tauri/Cargo.toml:15` maupun `mobile/src-tauri/Cargo.toml:11` memasang `crate-type = ["staticlib", "cdylib", "rlib"]`.
   - Pada Desktop Windows, `.exe` hanya membutuhkan `rlib`, tetapi Cargo ikut merakit `absensi_sppg_desktop_lib.lib` (**232,0 MB**) dan `.dll` + `.pdb` (**7,0 MB**) lalu memanggil linker bawaan MSVC `link.exe` alih-alih `rust-lld.exe` yang sudah tersedia di toolchain Rust.
   - Pada Mobile Android, APK hanya menggunakan `libabsensi_sppg_mobile_lib.so` (**21,7 MB**, hanya 3,9% dari total 556,6 MB artefak library), tetapi Cargo tetap merakit `libabsensi_sppg_mobile_lib.a` (**299,2 MB**, `staticlib` khusus iOS) dan `.rlib` (**235,7 MB**).
4. **Pemaketan ganda di Desktop dan Mobile:**
   - `web-desktop/src-tauri/tauri.conf.json:41` memakai `"targets": "all"` sehingga di Windows setiap build mempaketkan binary 45,3 MB dua kali: `.msi` WiX (22,2 MB) dan `-setup.exe` NSIS (18,9 MB).
   - `mobile/package.json:25` menjalankan `tauri android build --target aarch64` tanpa `--apk`, sehingga Gradle merakit **APK (27,3 MB)** sekaligus **AAB Play Store (19,8 MB)** di setiap build.
5. **Tekanan RAM 11 GB dan *swapping* ke HDD mekanik 5400 RPM:**
   - Mesin pengembang (`AMD FX-8800P`, 2 core / 4 thread @ 2,1 GHz, 11 GB RAM dengan sisa bebas ~3,9 GB saat IDE dan browser aktif) dibebani `org.gradle.jvmargs=-Xmx4096m -XX:MaxMetaspaceSize=1024m` pada `mobile/src-tauri/gen/android/gradle.properties:9` (hingga **5 GB RAM** untuk Gradle Daemon) bersamaan dengan `rustc`/LLVM (3–5 GB RAM).
   - Kelebihan memori dialihkan ke `pagefile.sys` pada partisi HDD mekanik 5400 RPM (`D:` dan `E:`) serta berbenturan dengan pemindaian *real-time* antivirus sistem (`MsMpEng.exe`) terhadap ribuan file `.rlib`/`.rcgu.o`.
6. **Beban Frontend ganda (~8,5 menit gabungan):**
   - `web-desktop/src` (638 berkas TS/TSX, 181.704 baris + 158 API route) dan `mobile/src` (462 berkas TS/TSX, 164.186 baris) masing-masing menjalankan pemeriksaan tipe `tsc` penuh dan transformasi Babel `reactCompiler: true` (`web-desktop/next.config.ts:108`, `mobile/next.config.ts:53`) atas komponen berukuran >3.000 baris (`id-cards/page.tsx` 3.828 baris, `InventarisWorkspace.tsx` 3.105 baris, `settings/page.tsx` 3.035 baris).

Tujuan PRD ini:

1. Memangkas waktu build rilis inkremental gabungan Desktop + Mobile dari **~48 menit menjadi <=15–20 menit** tanpa mengubah perilaku runtime, keamanan, skema database, maupun satu baris pun pada skrip audit (`audit:schema`, `audit:contract`, `audit:docs`).
2. Memangkas waktu rebuild Desktop ketika **hanya kode frontend (React/CSS) yang berubah** dari **~25 menit menjadi ~5–7 menit** (kompilasi Rust turun dari ~18,5 menit menjadi ~1–1,5 menit) melalui isolasi `tauri::generate_context!()` ke `src/main.rs`.
3. Menghentikan pembuatan artefak biner mati (`staticlib` 232 MB di Desktop dan 299,2 MB di Mobile) serta menjinakkan konsumsi RAM Gradle agar tidak memicu *swap thrashing* ke HDD mekanik.

## 2. Keputusan pemilik

| Tanggal | Keputusan |
|---|---|
| 2026-11-27 | Menyusun PRD optimasi build terlebih dahulu di sesi analisis untuk dieksekusi bersih pada sesi baru. |
| 2026-11-27 | Mematuhi 100% aturan `CLAUDE.md` dan `absensi-sppg-rules`: menjaga `isMinifyEnabled = false`, `webpki-roots`, `ring`, tidak melonggarkan/mengubah skrip audit (`audit-sync-contract.ts`, `schema-audit.ts`, `audit-docs.ts`), serta memvalidasi hasil akhir dengan `bun run check` penuh. |
| 2026-11-27 | Membagi pengerjaan menjadi **Fase 1** (wajib: isolasi `generate_context!()` Desktop, tuning Cargo + linker `rust-lld`, target bundler, serta patch RAM/cache Gradle) dan **Fase 2** (sakelar iterasi cepat frontend `SPPG_FAST_EXPORT=1` dan panduan tuning OS lokal). |
| 2026-11-27 | `Q-1` disetujui: `mobile/src-tauri/Cargo.toml` memakai `crate-type = ["cdylib", "rlib"]` (menghapus `"staticlib"` selama belum ada build Xcode iOS di Mac). |
| 2026-11-27 | `Q-2` disetujui: default Windows hanya merakit NSIS lewat `tauri.windows.conf.json` (`.msi` dipisah ke `tauri:build:msi`) dan `tauri:android:build:arm64` menambah `--apk` (`.aab` dipisah ke `tauri:android:build:aab`). |
| 2026-11-27 | `Q-3` disetujui: pemeriksaan tipe `tsc` tetap aktif pada skrip rilis utama, disertai sakelar opsional `SPPG_FAST_EXPORT=1` (skrip `:fast`) untuk iterasi lokal cepat. |
| 2026-11-27 | `Q-4` disetujui: `reactCompiler: true` tetap aktif pada rilis produksi dan hanya ikut dimatikan saat `SPPG_FAST_EXPORT=1`. |

## 3. Alur pengguna

- **Pemilik / Perilis Desktop (`cd web-desktop && bun run tauri:build`):** Membangun installer Windows `Absensi Perusahaan_<versi>_x64-setup.exe` jauh lebih cepat. Saat hanya mengubah UI/CSS tanpa menyentuh Rust, Cargo hanya mengompilasi ulang crate biner tipis `main.rs` dan me-link ke `rlib` yang sudah tersimpan. Jika sewaktu-waktu membutuhkan paket `.msi`, tersedia perintah `bun run tauri:build:msi`.
- **Pemilik / Perilis Mobile Android (`bun run sync:mobile && cd mobile && bun run tauri:android:build:arm64`):** Membangun `app-universal-release.apk` ARM64 menggunakan Thin LTO multi-thread tanpa merakit `.a` iOS maupun `.aab`. Jika suatu saat membutuhkan `.aab` untuk Play Store, tersedia perintah `bun run tauri:android:build:aab`. Setiap `bun run android:patch` otomatis mengunci batas heap Gradle `-Xmx2048m` dan mengaktifkan cache Gradle meski `src-tauri/gen/android` baru di-generate ulang.
- **Pengembang Harian / Pemeriksa Kualitas (`bun run check`):** Kompilasi `cargo test` di kedua workspace ikut dipercepat oleh linker `rust-lld.exe`, dan seluruh gerbang integritas (`audit:schema`, `audit:contract`, `audit:docs`, `audit:kontras`, lint, typecheck, unit test, serta `cargo test`) tetap berjalan penuh tanpa modifikasi aturan audit.

## 4. Wajib ada

### Fase 1 (Wajib, Prioritas Utama — Optimasi Compiler, Linker, Target Bundler & Gradle Tanpa Regresi)

1. **Isolasi `tauri::generate_context!()` Desktop ke `src/main.rs` (`web-desktop/src-tauri/src/lib.rs` & `web-desktop/src-tauri/src/main.rs`):**
   - Pada `web-desktop/src-tauri/src/lib.rs`, ganti `pub fn run()` dengan `pub fn run_with_context(context: tauri::Context<tauri::Wry>)` yang memanggil `.run(context)` — memindahkan pemanggilan makro `tauri::generate_context!()` sepenuhnya keluar dari `lib.rs` ke `web-desktop/src-tauri/src/main.rs`:
     `absensi_sppg_desktop_lib::run_with_context(tauri::generate_context!());`
   - Hapus fungsi `pub fn run()` tanpa parameter di `web-desktop/src-tauri/src/lib.rs` agar `tauri::generate_context!()` tidak pernah ikut diekspansikan atau terikat ke perubahan `../out` di dalam crate library 94.404 baris.
   - **Syarat mutlak:** Seluruh blok `.invoke_handler(tauri::generate_handler![ ... ])` **wajib tetap berada di `web-desktop/src-tauri/src/lib.rs`** dengan format persis sama agar regex `registeredCommands()` di `.agents/skills/absensi-sppg-rules/scripts/audit-sync-contract.ts:414-422,1293-1305` tetap membaca seluruh 310 command tanpa menyentuh modul di `src/desktop/**`.
   - `mobile/src-tauri/src/lib.rs` **tidak diubah** pada poin ini karena Android memuat `cdylib` lewat `#[cfg_attr(mobile, tauri::mobile_entry_point)] pub fn run()`, bukan lewat `src/main.rs`.

2. **Pemangkasan `crate-type` & Penyetelan Profil Release Cargo (`web-desktop/src-tauri/Cargo.toml` & `mobile/src-tauri/Cargo.toml`):**
   - `web-desktop/src-tauri/Cargo.toml`:
     - Ubah `crate-type = ["staticlib", "cdylib", "rlib"]` menjadi `crate-type = ["rlib"]` untuk menghentikan pembuatan `absensi_sppg_desktop_lib.lib` (232 MB) dan `.dll`/`.pdb` (7 MB).
     - Tambahkan `[profile.release]` dengan `panic = "abort"` dan `strip = "symbols"` (membiarkan `lto = false` dan `codegen-units` bawaan agar linking ulang `main.rs` terhadap `rlib` saat UI berubah selesai dalam hitungan detik).
   - `mobile/src-tauri/Cargo.toml`:
     - Ubah `crate-type = ["staticlib", "cdylib", "rlib"]` menjadi `crate-type = ["cdylib", "rlib"]` untuk menghentikan pembuatan `libabsensi_sppg_mobile_lib.a` (299,2 MB) selama build iOS belum dijalankan.
     - Pada `[profile.release]`, ubah `lto = true` menjadi `lto = "thin"` dan ubah `codegen-units = 1` menjadi `codegen-units = 16` agar keempat thread CPU bekerja paralel; pertahankan `opt-level = "z"`, `panic = "abort"`, dan `strip = true`.

3. **Aktivasi Fast Linker `rust-lld.exe` Khusus Host Windows (`web-desktop/src-tauri/.cargo/config.toml` & `mobile/src-tauri/.cargo/config.toml`):**
   - Buat berkas konfigurasi Cargo per-workspace agar tidak memengaruhi proyek Rust lain milik pemilik:
     ```toml
     [target.x86_64-pc-windows-msvc]
     linker = "rust-lld.exe"
     ```
   - Karena dibatasi ketat pada `[target.x86_64-pc-windows-msvc]`, linker NDK Clang untuk `aarch64-linux-android` maupun toolchain Linux/macOS tidak terpengaruh sama sekali, sedangkan link `.exe` Desktop serta kompilasi ulang biner `cargo test` dan `build-script-build.exe` di kedua workspace menjadi jauh lebih cepat.

4. **Target Bundler Spesifik Platform & Skrip Android (`web-desktop/src-tauri/tauri.windows.conf.json`, `web-desktop/package.json`, `mobile/package.json`, `CARA-BUILD.txt`):**
   - Buat `web-desktop/src-tauri/tauri.windows.conf.json` (dibaca otomatis oleh Tauri v2 hanya saat build di Windows) berisi `{ "bundle": { "targets": ["nsis"] } }`, sehingga Windows hanya merakit `-setup.exe` NSIS tanpa mengubah `"targets": "all"` di `tauri.conf.json` untuk Linux/macOS. Tambahkan skrip `"tauri:build:msi": "tauri build --bundles msi"` di `web-desktop/package.json`.
   - Di `mobile/package.json`: perbarui `tauri:android:build:arm64` menjadi `bun run android:patch && tauri android build --target aarch64 --apk`, `tauri:android:build:split` menjadi `bun run android:patch && tauri android build --split-per-abi --apk`, dan tambahkan `"tauri:android:build:aab": "bun run android:patch && tauri android build --target aarch64 --aab"` untuk rilis Play Store.
   - Perbarui catatan varian perintah pada `CARA-BUILD.txt` agar selaras.

5. **Penjinakan Memori & Cache Gradle secara Idempoten (`mobile/scripts/patch-android-release.ts`):**
   - Perluas `mobile/scripts/patch-android-release.ts` agar menambal dan memverifikasi `src-tauri/gen/android/gradle.properties`:
     - Turunkan `org.gradle.jvmargs` dari `-Xmx4096m -XX:MaxMetaspaceSize=1024m -Dfile.encoding=UTF-8` menjadi `-Xmx2048m -XX:MaxMetaspaceSize=512m -Dfile.encoding=UTF-8` agar menyisakan ruang RAM bagi `rustc`/LLVM di mesin 11 GB.
     - Aktifkan `org.gradle.caching=true` dan `org.gradle.parallel=true` (menghapus tanda komentar `# org.gradle.parallel=true`).
     - Tambahkan pemeriksaan di tahap 5 (`Verifikasi ulang`) sehingga bila nilai `gradle.properties` hilang setelah `tauri android init` atau belum sesuai, skrip memperbaikinya secara idempoten lalu memverifikasi ulang.

### Fase 2 (Tambahan Terisolasi + Checklist Lingkungan Mesin Lokal)

1. **Mode Iterasi Cepat Frontend Opsional (`SPPG_FAST_EXPORT=1`):**
   - Tambahkan dukungan environment `SPPG_FAST_EXPORT=1` di `web-desktop/next.config.ts` dan `mobile/next.config.ts` (hanya ketika `SPPG_FAST_EXPORT === "1"`, aktifkan `typescript: { ignoreBuildErrors: true }` dan matikan `reactCompiler`) disertai skrip lokal terpisah (mis. `tauri:build:fast` / `tauri:android:build:arm64:fast`).
   - Seluruh skrip rilis resmi (`tauri:build`, `tauri:android:build:arm64`, `build:web`, `paket:build`, `image:build`, dan `bun run check`) **tetap** menjalankan validasi `tsc` dan `reactCompiler` secara penuh.
2. **Panduan Tuning Mesin Windows Pengembang (di `CARA-BUILD.txt`, dikerjakan manual di OS oleh pemilik):**
   - Menjadikan Virtual Memory (`pagefile.sys`) **No paging file** pada partisi HDD mekanik (`D:` dan `E:`), menyisakan *System managed size* hanya pada partisi SSD sistem (`C:`).
   - Menambahkan pengecualian folder (*Folder Exclusion*) pada Windows Security untuk direktori repo, folder cache Cargo (`.cargo`), dan folder cache Gradle (`.gradle`) agar `MsMpEng.exe` tidak memindai ribuan file objek `.rlib`/`.rcgu.o` saat kompilasi.
   - Menutup browser berat saat menjalankan build rilis penuh dan membersihkan tumpukan berkas kompilasi lama di `target/release/build/absensi_sppg_*` sekali sebelum pengukuran baseline baru.

## 5. Di luar cakupan

- Memecah atau memindahkan berkas `web-desktop/src-tauri/src/desktop/*.rs` atau `mobile/src-tauri/src/mobile/*.rs` ke sub-crate/direktori lain (jalur dan isi berkas tersebut dikunci ketat oleh `audit-sync-contract.ts`, `schema-audit.ts`, dan `sync-rust-modules.ts`, sedangkan Aturan 35 melarang mengubah skrip audit).
- Mengganti fitur TLS `reqwest` di Desktop (`aws-lc-sys`) tanpa pengujian regresi menyeluruh terhadap koneksi Turso, server libSQL LAN, SMTP, dan Telegram.
- Mengaktifkan R8/ProGuard Android (`isMinifyEnabled` wajib tetap `false` sesuai Aturan 12).
- Mengubah skema database, `SNAPSHOT_TABLES`, `CANONICAL_SYNC_ROUTES`, izin RBAC, daftar `#[tauri::command]`, maupun logika bisnis aplikasi.
- Mengubah atau menghapus model wajah offline (`public/models/wajah/*.bin` / `FACE_MODEL_ID`).

## 6. Kriteria penerimaan

| # | Kriteria | Platform |
|---|---|---|
| K1 | Setelah satu build rilis penuh selesai, mengubah satu berkas frontend saja (misalnya teks atau kelas CSS di `web-desktop/src/`) lalu menjalankan `cd web-desktop && bun run tauri:build` **tidak** mengompilasi ulang crate `absensi_sppg_desktop_lib`; Cargo hanya mengompilasi `absensi_sppg_desktop` bin + bundling NSIS (tahap Rust selesai <2 menit pada mesin referensi). | Desktop (Windows) |
| K2 | Build Desktop tidak lagi menghasilkan `absensi_sppg_desktop_lib.lib` maupun `absensi_sppg_desktop_lib.dll` di `target/release/deps/`, secara bawaan hanya merakit installer NSIS `-setup.exe` di Windows (`.msi` tetap tersedia via `tauri:build:msi`), dan installer terpasang serta menjalankan alur inti (login, sync, cetak/simpan berkas) dengan normal. | Desktop (Windows) |
| K3 | Build Mobile `bun run tauri:android:build:arm64` memakai `lto = "thin"` dan `codegen-units = 16`, tidak lagi menghasilkan `libabsensi_sppg_mobile_lib.a`, hanya membangun `.apk` tanpa `.aab` (dengan `.aab` tersedia via `tauri:android:build:aab`), serta mencatat penurunan durasi kompilasi Rust yang nyata dibanding baseline ~14,5 menit. | Mobile (Android) |
| K4 | APK hasil build terpasang di perangkat Android ARM64 tanpa `UnsatisfiedLinkError`, serta alur inti (login, sync Turso/lokal, kamera QR, simpan cadangan SAF) berfungsi normal tanpa peningkatan crash atau regresi ukuran ekstrem. | Mobile (Android) |
| K5 | `cd mobile && bun run android:patch` bersifat idempoten (aman dijalankan 2× beruntun dengan exit code 0), memasang dan memverifikasi `-Xmx2048m -XX:MaxMetaspaceSize=512m`, `org.gradle.caching=true`, `org.gradle.parallel=true` di `gradle.properties`, sekaligus tetap mempertahankan `isMinifyEnabled = false`, `signingConfig`, izin manifest, dan `MainActivity.kt`. | Build Android |
| K6 | Konfigurasi `.cargo/config.toml` mengaktifkan `rust-lld.exe` untuk target `x86_64-pc-windows-msvc` tanpa menggagalkan `cargo test` di kedua workspace dan tanpa mengganggu cross-compile NDK `aarch64-linux-android`. | Host Windows |
| K7 | Jalur build Web (`cd web-desktop && bun run build:web` dan `bun run paket:build`) tidak terdampak dan tetap valid. | Web |
| K8 | Seluruh gerbang integritas lulus tanpa mengubah skrip audit: `jalankan-antislop` bersih (`.claude/ANTISLOP.md`) dan `bun run check` penuh di root berstatus **LULUS** (`.claude/HASIL.md`, meliputi `audit:schema`, `audit:contract`, `audit:docs`, `audit:kontras`, lint, typecheck, unit test TS, dan `cargo test` kedua workspace). | Semua |

## 7. Catatan teknis

- **Tabel & skema:** Tidak ada perubahan tabel, kolom, `SNAPSHOT_TABLES`, maupun `CANONICAL_SYNC_ROUTES`.
- **Izin & Command Rust:** Tidak ada penambahan/penghapusan `#[tauri::command]` maupun izin RBAC.
- **Keterikatan Skrip Audit (`CLAUDE.md` Aturan 35 & 45):**
  - `.agents/skills/absensi-sppg-rules/scripts/audit-sync-contract.ts:414-422,1293-1305` memvalidasi daftar command dengan membaca `web-desktop/src-tauri/src/lib.rs` menggunakan pola `/invoke_handler\(tauri::generate_handler!\[([\s\S]*?)\n\s*\]\)/`. Oleh karena itu `.invoke_handler(tauri::generate_handler![ ... ])` **wajib tetap berada di `lib.rs`**; hanya pemanggilan `tauri::generate_context!()` yang dipindah ke `src/main.rs`.
  - Seluruh jalur berkas modul `src/desktop/*.rs` dan `src/mobile/*.rs` tetap dipertahankan di tempatnya masing-masing agar `schema-audit.ts`, `audit-sync-contract.ts`, dan `sync-rust-modules.ts` tetap hijau.
- **Batas `sync:mobile`:** Tidak ada perubahan pada berkas salinan `mobile/scripts/sync-frontend-lib.ts` maupun `mobile/scripts/sync-rust-modules.ts`.
- **Invarian & skill kerja yang berlaku** (dirujuk, tidak disalin): `CLAUDE.md` (Aturan 12, 15, 35, 41, 45), `.agents/skills/absensi-sppg-rules/SKILL.md`, `ponytail` (optimasi terfokus pada bottleneck nyata tanpa over-refactoring 40 modul Rust), `jalankan-antislop`, dan `jalankan-check`.

## 8. Temuan dari kode

- `web-desktop/src-tauri/Cargo.toml:13-15,67-80`: `crate-type = ["staticlib", "cdylib", "rlib"]` dan belum mendefinisikan `[profile.release]`.
- `mobile/src-tauri/Cargo.toml:9-11,70-75`: `crate-type = ["staticlib", "cdylib", "rlib"]` serta `[profile.release]` memakai `lto = true` dan `codegen-units = 1`.
- `web-desktop/src-tauri/src/lib.rs:6,24-336` & `web-desktop/src-tauri/src/main.rs:4-6`: `tauri::generate_context!()` diekspansi langsung di `lib.rs` bersama 94.404 baris kode Rust dan 310 command; `main.rs` hanya memanggil `absensi_sppg_desktop_lib::run()`.
- `web-desktop/src-tauri/build.rs:345-382` & `mobile/src-tauri/build.rs:351-388`: `cargo:rerun-if-changed=src` dan `SPPG_BUILD_DATE` memicu build ulang setiap pergantian tanggal WIB atau perubahan folder `src/`.
- `web-desktop/src-tauri/tauri.conf.json:39-42`: `"targets": "all"` memerintahkan bundler membuat `.msi` sekaligus NSIS `-setup.exe` pada Windows.
- `mobile/package.json:24-26`: `tauri:android:build:arm64` belum menyertakan `--apk`, sehingga membangun `.apk` sekaligus `.aab`.
- `mobile/src-tauri/gen/android/gradle.properties:9,16`: `org.gradle.jvmargs=-Xmx4096m -XX:MaxMetaspaceSize=1024m`, `org.gradle.parallel=true` masih dikomentari, dan `org.gradle.caching` belum aktif.
- `mobile/scripts/patch-android-release.ts:64-76,450-568`: sudah menambal dan memverifikasi `build.gradle.kts`, `proguard-rules.pro`, `AndroidManifest.xml`, `strings.xml`, `MainActivity.kt`, dan ikon, tetapi belum menambal `gradle.properties`.
- `web-desktop/next.config.ts:108` & `mobile/next.config.ts:53`: `reactCompiler: true` berjalan di atas seluruh berkas TSX di kedua workspace tanpa opsi bypass untuk iterasi lokal.
- `.agents/skills/absensi-sppg-rules/scripts/audit-sync-contract.ts:414-422,542-565,1288-1348`: mengunci keberadaan `generate_handler!` di `lib.rs` dan letak modul di `src/desktop/*.rs` / `src/mobile/*.rs`.

## 9. Urutan pengerjaan

| # | Langkah | Gerbang |
|---|---|---|
| 1 | Tambahkan `web-desktop/src-tauri/.cargo/config.toml` & `mobile/src-tauri/.cargo/config.toml` (`rust-lld.exe` khusus `x86_64-pc-windows-msvc`), lalu perbarui `crate-type` & `[profile.release]` pada kedua `Cargo.toml`. | `cargo check --tests` lulus di `web-desktop` dan `mobile` |
| 2 | Pindahkan `tauri::generate_context!()` dari `web-desktop/src-tauri/src/lib.rs` ke `web-desktop/src-tauri/src/main.rs` lewat `run_with_context(...)` sambil menjaga `generate_handler!` tetap di `lib.rs`. | `bun run audit:contract` lulus & `cargo test --manifest-path web-desktop/src-tauri/Cargo.toml --no-run` lulus |
| 3 | Tambahkan `web-desktop/src-tauri/tauri.windows.conf.json` (`["nsis"]`) & skrip `tauri:build:msi`, perbarui skrip `--apk` + `:aab` di `mobile/package.json`, perluas `mobile/scripts/patch-android-release.ts` untuk `gradle.properties`, dan selaraskan `CARA-BUILD.txt`. | `cd mobile && bun run android:patch` keluar 0 pada dua eksekusi beruntun |
| 4 | Tambahkan sakelar `SPPG_FAST_EXPORT=1` di `web-desktop/next.config.ts`, `mobile/next.config.ts`, dan skrip `:fast` lokal tanpa mengubah perilaku rilis standar. | `bun run build:desktop` dan `bun run build:mobile` standar tetap bersih |
| 5 | Jalankan skill `jalankan-antislop` (tulis `.claude/ANTISLOP.md`), lalu jalankan skill `jalankan-check` (`bun run check` penuh di root, tulis `.claude/HASIL.md`). | `.claude/HASIL.md` berstatus **LULUS** |
| 6 | Lakukan pengukuran waktu nyata `cd web-desktop && bun run tauri:build` (termasuk uji ubah 1 baris frontend untuk membuktikan `K1`) dan `cd mobile && bun run tauri:android:build:arm64`, lalu verifikasi installer & APK di perangkat nyata (`K2`, `K4`). | Target durasi tercapai & seluruh `K1`–`K8` lulus |

## 10. Pertanyaan terbuka

Seluruh pertanyaan terbuka telah **ditutup (disetujui pemilik pada 2026-11-27)**:

- **Q-1 (Ditutup):** `mobile/src-tauri/Cargo.toml` menggunakan `crate-type = ["cdylib", "rlib"]` (menghapus `"staticlib"` selama build iOS di Mac belum dijalankan).
- **Q-2 (Ditutup):** Default Windows hanya merakit NSIS lewat `tauri.windows.conf.json` (`.msi` dipisah ke `tauri:build:msi`) dan `tauri:android:build:arm64` memakai `--apk` (`.aab` dipisah ke `tauri:android:build:aab`).
- **Q-3 (Ditutup):** Pemeriksaan tipe `tsc` tetap aktif pada skrip rilis utama; sakelar `SPPG_FAST_EXPORT=1` (skrip `:fast`) disediakan untuk iterasi lokal cepat.
- **Q-4 (Ditutup):** `reactCompiler: true` tetap aktif pada rilis produksi dan hanya dimatikan saat `SPPG_FAST_EXPORT=1`.
