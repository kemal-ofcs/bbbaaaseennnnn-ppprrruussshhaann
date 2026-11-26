# PRD: Pengalaman Native-Feel WebView & Optimasi Performa Selektif Mobile (Tauri v2)

Status 2026-11-26: **disetujui pemilik** (rekomendasi Q-1 sampai Q-3 diterima; siap masuk implementasi Fase 1 di sesi baru).

## 1. Masalah dan tujuan

UI aplikasi Mobile berjalan di dalam Android WebView menggunakan Next.js 16 static export. Di dalam `mobile/src/` terdapat 55 elemen `<Link>`, `<a>`, dan `<img>`. Ketika pengguna menahan lama tombol navigasi, kartu menu, tautan daftar, atau gambar, Android WebView memunculkan pop-up konteks browser berisi URL internal `http://tauri.localhost/...` (beserta pilihan "Salin alamat link" / "Buka di browser") serta efek seret gambar (*ghost drag*).

Pemilik juga mempertimbangkan apakah aplikasi Mobile perlu ditulis ulang menjadi native murni (Kotlin/Swift) demi menghilangkan perilaku browser dan menjaga performa. Padahal mesin inti aplikasi (SQLite lokal, sinkronisasi Turso dua arah, enkripsi vault AES-256-GCM + Argon2id, kalkulasi payroll `rust_decimal`, Storage Access Framework, dan deteksi lokasi palsu JNI) sudah berjalan sebagai binary native Rust/Android, dan seluruh aplikasi berbagi satu basis kode lewat `bun run sync:mobile`.

Tujuan PRD ini:
1. Menghilangkan perilaku browser pada WebView Mobile sehingga rasa sentuhan setara aplikasi native tanpa merusak salin-tempel pada isian form maupun kode teknis.
2. Menetapkan prinsip optimasi performa selektif berbasis pengukuran nyata: hanya memindahkan modul hardware berat (seperti pemindai QR) ke jembatan native bila terbukti menjadi hambatan di perangkat target.

## 2. Keputusan pemilik

| Tanggal | Keputusan |
|---|---|
| 2026-11-26 | Tetap mempertahankan arsitektur **Tauri v2 + Rust** untuk Mobile (tidak menulis ulang UI ke Kotlin/Swift penuh). |
| 2026-11-26 | Menyusun PRD terlebih dahulu sebelum menulis kode, memakai alur skill repo (`susun-prd`, `absensi-sppg-rules`, `ponytail`, `antislop`, `jalankan-antislop`, `jalankan-check`) serta aturan kerja di `CLAUDE.md`. |
| 2026-11-26 | Pengerjaan bertahap: Fase 1 menutup pop-up URL long-press & sentuhan WebView secara terpusat; Fase 2 (optimasi kamera/QR native) bersifat kondisional dan baru dibuka bila ada bukti pengukuran nyata di HP target. |
| 2026-11-26 | Q-1 disetujui: memakai pengaman lapis ganda (CSS/JS + Kotlin `hitTestResult.type` di `MainActivity.kt`). |
| 2026-11-26 | Q-2 disetujui: `WebView.setWebContentsDebuggingEnabled(true)` tetap dibiarkan di luar cakupan PRD ini. |
| 2026-11-26 | Q-3 disetujui: fokus selesaikan dan uji Fase 1 terlebih dahulu; Fase 2 ditunda sampai ada bukti pengukuran nyata di perangkat target. |

## 3. Alur pengguna

- **Karyawan / Operator Lapangan (Android APK):** Mengetuk atau tidak sengaja menahan lama tab `MobileBottomNav`, header `MobileHeader`, ubin `Menu`, tautan daftar (`Karyawan`, `Riwayat`, `Payroll`), atau foto/logo. Tidak pernah melihat pop-up `http://tauri.localhost/...` atau bayangan seret gambar. Saat mengisi form (login, pencarian menu, pengajuan, laporan perjalanan), tahan-lama pada `<input>` / `<textarea>` tetap memunculkan menu pilih/salin/tempel bawaan Android.
- **Admin / HRD / Keuangan (Android APK):** Mengetuk tautan eksternal (`tel:`, `https://wa.me/...`, tautan peta) tetap membuka aplikasi tujuan secara normal lewat `AndroidNativeBridge.openExternal`. Tahan-lama pada teks kode yang memang perlu disalin (`<code>` / `<pre>`, misalnya kode perangkat lisensi atau kode pemulihan 2FA) tetap dapat dipilih dan disalin.
- **Superadmin / Pemilik Build:** Menjalankan `bun run android:patch` atau `bun run tauri:android:build:arm64`; skrip `mobile/scripts/patch-android-release.ts` otomatis memasang ulang dan memverifikasi pengaman WebView pada `MainActivity.kt` meskipun `src-tauri/gen/android` di-generate ulang oleh `tauri android init`.

## 4. Wajib ada

### Fase 1 (Wajib, Prioritas Utama): Native-Feel WebView & Anti Pop-Up URL

1. **Hardening CSS Sentuhan (`mobile/src/app/globals.css`):**
   - Pasang `-webkit-touch-callout: none;` pada `html, body, a, img, button` untuk mematikan callout tautan/gambar bawaan WebView.
   - Pasang `-webkit-user-drag: none;` pada `a, img` untuk mematikan efek seret tautan/gambar.
   - Pertahankan pengecualian `user-select: text; -webkit-user-select: text;` untuk `input, textarea, select, code, pre` dan tambahkan `[data-selectable="true"]` bila diperlukan, agar salin-tempel form serta penyalinan kode pemulihan/perangkat tidak terganggu.
   - Pertahankan `overscroll-behavior-y: contain;` (untuk `PullToRefresh.tsx`) dan tambahkan `overscroll-behavior-x: none;` pada `html, body` guna mencegah pantulan tepi horizontal WebView.

2. **Guard Event Global WebView (`mobile/src/components/MobileWebViewGuard.tsx`, dipasang di `mobile/src/app/layout.tsx`):**
   - Komponen `"use client"` ringan yang merender `null` dan dipasang sekali di `RootLayout` (`mobile/src/app/layout.tsx`).
   - Ekspor fungsi murni `bolehMenuKonteks(target: EventTarget | null): boolean` yang mengembalikan `true` hanya jika `target` (atau leluhurnya lewat `.closest(...)`) adalah `input, textarea, [contenteditable="true"], code, pre, [data-allow-contextmenu="true"]`.
   - Pasang listener `contextmenu` pada `document`: jika `!bolehMenuKonteks(event.target)`, panggil `event.preventDefault()`.
   - Pasang listener `dragstart` pada `document`: jika target berada di dalam `a, img`, panggil `event.preventDefault()`.
   - Lepaskan kedua listener di cleanup `useEffect(..., [])`.
   - Hanya berada di workspace `mobile/` (bukan `web-desktop/`, tidak masuk `sync-frontend-lib.ts`) agar perilaku klik-kanan browser Web/Desktop tidak berubah.

3. **Pengaman Lapis Kedua Android Kotlin (`MainActivity.kt`) + Verifikasi Otomatis (`mobile/scripts/patch-android-release.ts`):**
   - Di `MainActivity.kt` (`onWebViewCreate(webView: WebView)`), pasang `webView.setOnLongClickListener` yang memeriksa `webView.hitTestResult.type`.
   - Telan event (`return true`) HANYA untuk tipe tautan dan gambar (`WebView.HitTestResult.SRC_ANCHOR_TYPE`, `SRC_IMAGE_ANCHOR_TYPE`, `IMAGE_TYPE`, `ANCHOR_TYPE`), dan kembalikan `false` untuk `EDIT_TEXT_TYPE` serta tipe lain agar seleksi teks pada input tetap berfungsi di semua OEM Android WebView.
   - Tambahkan blok penambalan dan verifikasi idempoten pada `mobile/scripts/patch-android-release.ts` (mengikuti pola bagian `4b` dan tahap `5. Verifikasi`) tanpa merusak pendaftaran `AndroidNativeBridge(this)` maupun aturan wajib `isMinifyEnabled = false`.

4. **Unit Test (`mobile/src/components/MobileWebViewGuard.test.ts`):**
   - Uji fungsi `bolehMenuKonteks` untuk kasus blokir (`a`, `img`, `button`, `div`, teks di dalam `a`) dan kasus izin (`input`, `textarea`, `code`, `pre`, `[contenteditable="true"]`, `[data-allow-contextmenu="true"]`).

### Fase 2 (Kondisional, Ditunda sesuai prinsip Ponytail / YAGNI): Optimasi Kamera & Scanner Selektif

- Fase 2 **tidak langsung dikerjakan** sampai ada bukti pengukuran nyata di HP Android target (kelas menengah/bawah).
- Kriteria pemicu: (a) waktu baca QR `@zxing/browser` terasa lambat atau sulit fokus pada sesi scan nyata, atau (b) perangkat cepat panas / mengalami frame drop parah saat antrean scan panjang.
- Langkah bila dipicu: ukur baseline nyata (cold-start, waktu decode QR, waktu inferensi `@vladmandic/human`), lalu pindahkan **hanya pembacaan QR** ke jembatan/plugin native Android (CameraX + ML Kit / ZXing native) sambil tetap mempertahankan kontrak payload QR `id|token` (`CLAUDE.md` Aturan 31) dan fallback WebView.
- Model verifikasi wajah 1:1 (`@vladmandic/human`, `FACE_MODEL_ID` di `face-engine.ts`) tidak dipindahkan pada fase ini karena penggantian model membatalkan seluruh vektor wajah yang sudah tersimpan.

## 5. Di luar cakupan

- Menulis ulang UI Mobile ke Kotlin/Jetpack Compose, Swift/SwiftUI, Flutter, atau React Native.
- Mengubah perilaku klik-kanan atau seleksi teks pada Web dan Desktop (`web-desktop/`).
- Perubahan skema database, `SNAPSHOT_TABLES`, outbox sync, izin RBAC, atau `#[tauri::command]` Rust.
- Mengubah `WebView.setWebContentsDebuggingEnabled(true)` (dibahas terpisah di `Q-2`).
- Mengubah logika `PullToRefresh.tsx`, `LivenessCapture.tsx`, atau `AndroidNativeBridge` (share/save/openExternal).

## 6. Kriteria penerimaan

| # | Kriteria | Platform |
|---|---|---|
| K1 | Tahan lama (1–2 detik) pada seluruh tab `MobileBottomNav`, header `MobileHeader`, kartu `Menu`, dan tautan daftar (`Karyawan`, `Riwayat`, `Payroll`, `Pengaturan`) tidak memunculkan pop-up `http://tauri.localhost/...` maupun menu tautan browser. | Mobile (Android APK) |
| K2 | Tahan lama pada gambar (`BrandLogo`, foto karyawan, bukti foto absensi/perjalanan) tidak memunculkan menu "Unduh/Bagikan gambar" WebView dan tidak memicu efek seret gambar. | Mobile (Android APK) |
| K3 | Tahan lama pada `<input>` dan `<textarea>` (login, cari menu, form pengajuan/karyawan) tetap menampilkan menu pilih/salin/tempel Android dan berfungsi normal. | Mobile (Android APK) |
| K4 | Tahan lama pada `<code>` / `<pre>` atau elemen bertanda `data-allow-contextmenu="true"` (kode perangkat lisensi, kode pemulihan 2FA) tetap memungkinkan teks disalin. | Mobile (Android APK) |
| K5 | Ketuk (tap) pada tautan eksternal (`tel:`, `https://wa.me/...`, peta) tetap membuka aplikasi tujuan, dan gestur `PullToRefresh` tetap berjalan mulus tanpa bentrok. | Mobile (Android APK) |
| K6 | `cd mobile && bun run android:patch` bersifat idempoten (aman dijalankan berulang), menjaga `AndroidNativeBridge(this)` serta `isMinifyEnabled = false`, dan gagal eksplisit bila pengaman `setOnLongClickListener` hilang dari `MainActivity.kt`. | Build Android |
| K7 | `MobileWebViewGuard.test.ts` lulus, `jalankan-antislop` bersih (`.claude/ANTISLOP.md`), dan `bun run check` penuh di root lulus (`.claude/HASIL.md`). Perilaku klik-kanan Web & Desktop tidak berubah. | Semua |

## 7. Catatan teknis

- **Tabel & skema:** Tidak ada perubahan tabel, kolom, atau versi skema; `SNAPSHOT_TABLES` dan `CANONICAL_SYNC_ROUTES` tidak berubah.
- **Izin & Command Rust:** Tidak ada izin RBAC baru dan tidak ada `#[tauri::command]` baru.
- **Batas salinan `sync:mobile`:** Perubahan Fase 1 hanya menyentuh berkas milik `mobile/` sendiri (`mobile/src/app/*`, `mobile/src/components/MobileWebViewGuard.*`, `mobile/scripts/patch-android-release.ts`). Tidak menyentuh berkas salinan (`mobile/src/lib/**`, `mobile/src/types/**`, `mobile/src-tauri/src/mobile/**`).
- **Pertahanan berlapis WebView dan Android:**
  - CSS: `mobile/src/app/globals.css` (`-webkit-touch-callout: none`, `-webkit-user-drag: none`, `overscroll-behavior-x: none`).
  - JS/DOM: `mobile/src/components/MobileWebViewGuard.tsx` (`contextmenu` & `dragstart` terpusat).
  - Kotlin Android: `MainActivity.kt` (`onWebViewCreate` -> `setOnLongClickListener` berdasarkan `hitTestResult.type`), ditambal dan diverifikasi otomatis oleh `mobile/scripts/patch-android-release.ts`.
- **Catatan implementasi untuk sesi eksekusi:**
  - `mobile/package.json` tidak memasang `jsdom` atau `happy-dom`, sehingga helper `bolehMenuKonteks` sebaiknya memakai pengecekan struktural ringan (`closest` / `parentElement`) agar `MobileWebViewGuard.test.ts` lulus dengan `bun test` murni tanpa menambah dependensi baru.
  - Penambalan `mobile/scripts/patch-android-release.ts` pada `MainActivity.kt` wajib menangani dua kondisi secara idempoten: ketika `onWebViewCreate` sudah ada (seperti saat ini dengan `AndroidNativeBridge`) maupun ketika belum ada (setelah `tauri android init` baru).
- **Invarian & skill kerja yang berlaku** (dirujuk, tidak disalin):
  - `CLAUDE.md` & `.agents/skills/absensi-sppg-rules/SKILL.md`: 4 Pilar (verifikasi kode nyata, konservasi struktur lama, reuse, guard kuat), Aturan 12 (Android `isMinifyEnabled = false`, `webpki-roots`, `ring`), Aturan 14 (lifecycle kamera bila Fase 2 aktif), Aturan 31 (kontrak QR `id|token`), Aturan 35 (dilarang melonggarkan skrip audit), Aturan 41 (`bun run check` penuh sekali di akhir).
  - `ponytail`: tangani akar masalah di titik terpusat (bukan menambal 55 komponen `<Link>` / `<a>` / `<img>` satu per satu); tunda Fase 2 sampai ada bukti bottleneck nyata.
  - `antislop` & `antislop-layoutmobile`: R-02, R-03 (tap target >= 44px), R-26/R-32 (aksesibilitas keyboard & fokus tetap utuh), R-34 (tema gelap dan terang tetap berfungsi). Catatan R-33: seluruh aturan UI/CSS ditulis langsung di sumber (`globals.css`, `MobileWebViewGuard.tsx`); `patch-android-release.ts` hanya menjaga konfigurasi proyek Gradle/Kotlin hasil generate `tauri android init` yang di-gitignore.
  - Alur eksekusi skill `.claude/skills/`: `susun-prd` (dokumen ini) -> implementasi (`absensi-sppg-rules` + `ponytail`) -> `jalankan-antislop` (`.claude/ANTISLOP.md`) -> `jalankan-check` (`bun run check` -> `.claude/HASIL.md`) -> build APK & uji perangkat.

## 8. Temuan dari kode

- `mobile/src/app/globals.css:44-47,61-88,233-235`: sudah memasang `-webkit-tap-highlight-color: transparent`, `user-select: none` pada `body`, pengecualian `user-select: text` untuk `input, textarea, select, code, pre`, serta `overscroll-behavior-y: contain`. Belum memiliki `-webkit-touch-callout: none` maupun `-webkit-user-drag: none`.
- `mobile/src/app/layout.tsx:45-59`: `RootLayout` memasang `THEME_INIT_SCRIPT`, `ThemeProvider`, dan `AuthProvider`, tetapi belum memiliki guard global `contextmenu` / `dragstart`.
- `mobile/src/**`: terdapat 55 elemen `<Link>`, `<a>`, dan `<img>` (misalnya `MobileBottomNav.tsx:72-100`, `MobileHeader.tsx:22-53`, `menu/page.tsx:91-97`, `EmployeeDetailModal.tsx:189,199`, `RincianSuratJalan.tsx:500-501`). Semua `<Link>` dirender sebagai `<a href="/...">` yang dipecah Android WebView menjadi `http://tauri.localhost/...`.
- `mobile/src-tauri/gen/android/app/src/main/java/id/absensi/perusahaan/mobile/MainActivity.kt:14-17`: sudah meng-override `onWebViewCreate(webView: WebView)` untuk memasang `AndroidNativeBridge(this)`.
- `mobile/scripts/patch-android-release.ts:305-329`: saat ini baru menambal `WebView.setWebContentsDebuggingEnabled(true)` di `MainActivity.kt` (`onCreate`), belum menambal atau memverifikasi `onWebViewCreate`.
- `mobile/src-tauri/gen/android/app/src/main/java/id/absensi/perusahaan/mobile/AndroidNativeBridge.kt:65-91`: sudah menangani pembukaan tautan eksternal (`openExternal`) dengan whitelist skema aman (`http`, `https`, `tel`, `sms`, `mailto`, `geo`, `whatsapp`).
- `mobile/src/components/PullToRefresh.tsx:104-194`: menangani gestur tarik-ke-bawah via `touchstart`/`touchmove`/`touchend` dan memblokir overscroll saat menarik; guard long-press tidak menyentuh event sentuhan tersebut.
- `mobile/src/components/ScannerView.tsx:3-6,62-65` & `mobile/src/lib/client/face-engine.ts:11-66`: QR scanner memakai `@zxing/browser`, verifikasi wajah 1:1 memakai `@vladmandic/human` (model offline ~9 MB di `/models/wajah/`, backend WebGL, terikat `FACE_MODEL_ID`), sedangkan liveness di `LivenessCapture.tsx:1-30` memakai analisis piksel tanpa ML.

## 9. Urutan pengerjaan

| # | Langkah | Gerbang |
|---|---|---|
| 1 | `mobile/src/app/globals.css`: tambah `-webkit-touch-callout: none`, `-webkit-user-drag: none`, `overscroll-behavior-x: none`, dan jaga pengecualian seleksi form/`code`/`pre`/`[data-selectable="true"]`. | `biome check` berkas berubah + cek tema gelap/terang |
| 2 | Buat `mobile/src/components/MobileWebViewGuard.tsx` + `mobile/src/components/MobileWebViewGuard.test.ts`; pasang `<MobileWebViewGuard />` di `mobile/src/app/layout.tsx`. | `cd mobile && bun test src/components/MobileWebViewGuard.test.ts && bun run typecheck` |
| 3 | Perbarui `mobile/scripts/patch-android-release.ts` agar menambal dan memverifikasi `setOnLongClickListener` berbasis `hitTestResult.type` di `MainActivity.kt` (`onWebViewCreate`) tanpa mengganggu `AndroidNativeBridge(this)`; jalankan `cd mobile && bun run android:patch` dua kali (uji idempoten). | `bun run android:patch` keluar 0 di kedua run |
| 4 | Jalankan skill `jalankan-antislop` (tulis `.claude/ANTISLOP.md`), lalu jalankan skill `jalankan-check` (`bun run check` penuh di root, tulis `.claude/HASIL.md`). | `.claude/HASIL.md` berstatus **LULUS** |
| 5 | Build APK ARM64 (`cd mobile && bun run tauri:android:build:arm64`) lalu uji manual `K1`–`K5` di HP Android nyata. | `K1`–`K5` lolos di perangkat |
| 6 | (Kondisional Fase 2) Hanya jika ada keluhan/bukti performa QR di HP target: ukur baseline nyata sebelum merancang jembatan kamera QR native. | Laporan tolok ukur nyata |

## 10. Pertanyaan terbuka

Seluruh pertanyaan terbuka telah **ditutup (disetujui pemilik pada 2026-11-26)**:

- **Q-1 (Ditutup):** Menggunakan pengaman lapis ganda (CSS/JS + Kotlin `hitTestResult.type` di `MainActivity.kt`), sehingga OEM WebView Android tetap bersih dari dialog tautan/gambar sambil menjaga `EDIT_TEXT_TYPE` tetap normal.
- **Q-2 (Ditutup):** Setelan `WebView.setWebContentsDebuggingEnabled(true)` di `mobile/scripts/patch-android-release.ts:315-325` tetap berada di luar cakupan PRD ini.
- **Q-3 (Ditutup):** Fokus menyelesaikan dan menguji Fase 1 terlebih dahulu; Fase 2 baru dibuka bila uji di HP target menunjukkan bottleneck nyata pada QR scanner.
