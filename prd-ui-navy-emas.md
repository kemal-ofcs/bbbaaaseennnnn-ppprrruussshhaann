# PRD: UI halaman dalam navy + emas (port dari Manajemen Sekolah)

Status 2026-11-26: **disetujui pemilik** (semua usulan Q-1 sampai Q-7 diterima;
cakupan = seluruh perubahan UI/UX sekolah sampai commit `d06db36`, termasuk yang
tidak tercatat di PRD sekolah).

**Progres langkah 0.1 (2026-11-26).** `components/ui/Sakelar.tsx` + tes disalin
dari sekolah, masuk `filesToCopy`; blok `.sakelar*` di kedua `globals.css`;
tambalan `input.peer:not(:checked) ~ div.bg-slate-800` dibuang dari keduanya.
Diganti: Web `holidays`, `settings` (Otomasi Alfa), `shift` ×2 (fleksibel,
multi-sesi; `htmlFor` label tetap menunjuk `id` sakelar), `id-cards` ×2 (garis
potong, garis tepi; sebelumnya tanpa ARIA); Mobile `settings` ×2 (Otomasi Alfa,
geofence), `shift` (fleksibel), `MailSettingsCard`. Cek: `Sakelar.test.ts` 4
lulus, `tsc` Web + Mobile lulus, Biome berkas diubah tanpa temuan baru, grep K12
bersih. **Belum:** K11 tangkapan layar dan uji klik → simpan → muat ulang
(pemilik).

**Progres langkah 0.2 (2026-11-26).** `scripts/audit-kontras.ts` disalin apa
adanya (daftar putih Web 9 latar sama dengan sekolah), terpasang di `check`,
`check:quick`, dan `audit:kontras`. `.text-on-accent` ditambahkan di Web. Temuan
pertama 41 potongan; diperbaiki 25 berkas (berkas bersama disunting di Web lalu
`sync:mobile`, termasuk tab HRIS/Inventaris/Keuangan/Perjalanan, tombol
`TwoFactorCard`, `LicenseActivationPanel`, `BrandLogo`, `RunDetailClient`
indigo/teal, gradien dashboard/scanner/karyawan). Ikut juga hasil 0c sekolah yang
murni CSS: Web `text-slate-500` dan badge netral terang `#64748b` → `#5b677c`,
blok teks aksen pucat 200–400 (biru, indigo, violet, ungu, teal, cyan, oranye,
fuchsia, kuning, merah); Mobile `--color-slate-500` `#5b677c`, teal-400
`#0f766e`, cyan-400 `#0e7490` di tema terang. Cek: `audit:kontras` lulus (K13),
`tsc` Web + Mobile lulus, Biome 29 + 30 berkas tanpa temuan baru.

**Langkah 0.3** dilewati (Q-3). **Langkah 0.4 (2026-11-26):** antislop 5 berkas
(komentar fase 0, `.claude/ANTISLOP.md`); `bun run check` penuh **lulus** 13:13 WIB
(`.claude/HASIL.md`, cargo test 480 + 484). Sebelumnya gagal di
`schema-consistency.test.ts:127` (di luar UI): tes meniru database v44 dengan
menghapus `version = 45` padahal v46/v47 juga tercatat; diganti `version >= 45`.
**Fase 0 selesai**, kecuali K11 (tangkapan layar dan uji simpan sakelar, pemilik).

**Progres langkah 1 (2026-11-26).** A1: `--app-navy`, `--app-navy-strong`,
`--app-gold-line`, `--app-gold-text` di `:root` dan blok terang kedua
`globals.css` (Mobile kini juga punya `--app-gold`). A3: `PageHeader.tsx` disalin
dari sekolah (kelas `.page-header*`, tanpa utilitas warna); blok terang lama
"Page Header Seamless" ber-`!important` diganti blok token `.page-header*` +
`.aksi-cepat*` (termasuk E5). A2 (Q-2 a): `QuickActionTile` (`font-mono-data` →
`font-mono`, kelasnya tidak ada di sini) dan `QuickActionGrid` baru, Web saja
(tidak ada di `filesToCopy`); `DEFAULT_TILES` = 12 modul `MODULES` lama dengan
judul dan `subtitle` pendek. Di beranda `MODULES`, `TONE_CLASSES`,
`CATEGORY_TABS`, filter kategori, dan grid bento dibuang; judul seksi memakai
`.page-header-eyebrow/-title`. Cek: `tsc` Web + Mobile lulus, Biome 17 berkas
bersih, `audit:kontras` lulus, K3 (pemeriksa kontras: teks emas terang 7,09:1,
garis 3,19:1; gelap 11,0:1 dan 3,42:1; ikon terang 7,83:1). **Belum:** tangkapan
layar beranda 390/1280 px kedua tema (K1, K2, K9, pemilik).

**Progres langkah 2 (2026-11-26).** A4: `TabBar.tsx` + `TabBar.test.ts` disalin
apa adanya dari sekolah, `TabBar.tsx` masuk `filesToCopy`; blok `.tab-bar*` versi
Web sekolah (termasuk E4 garis tab tidak aktif) di kedua `globals.css`, Mobile
memakai blok yang sama (bukan versi Mobile sekolah tanpa E4). Diganti 12 baris
tab Web: `settings` (`vertikalLg`, panel `settings-panel`), `operational` (E6,
sebelumnya tanpa ARIA), `hris/{BaganOrganisasi, HrisWorkspace, KinerjaWorkspace,
PelatihanWorkspace (kini ber-`aria-label`), PengajuanWorkspace, PenilaianKinerja,
RincianKaryawan}`, Inventaris, Keuangan (badge lewat `badge`), Perjalanan; lalu
`sync:mobile`, dan Mobile `pengajuan/page.tsx` dengan tangan. Konstanta
`TOMBOL_TAB`/`TOMBOL_MODE`/`TOMBOL` Bagan yang tak terpakai dibuang. Id tab kini
`tab-<prefix>-<id>` (mis. `settings-tab-umum` → `tab-settings-umum`); tidak ada
E2E atau kode lain yang merujuk id lama. Cek: `TabBar.test.ts` 4 lulus (K5), grep K4
hanya `TabBar.tsx` Web + Mobile, `tsc` Web + Mobile lulus, Biome berkas diubah bersih (5 peringatan `!important` lama di CSS
Mobile). **Belum:** tangkapan layar tab kedua tema (pemilik).

**Progres langkah 3 (2026-11-26).** A5: `MemuatHalaman.tsx` disalin apa adanya
dari sekolah dan masuk `filesToCopy` (bukan salinan manual: komponennya bersama,
yang milik Mobile hanya halamannya); blok `.memuat-halaman*` (latar
`--app-background`, putaran `--app-gold-line`) di akhir kedua `globals.css`.
Diganti 7 layar "Memuat otorisasi..." Web (`payroll`, `payroll/config` + 3 aturan,
`payroll/runs`, `RunDetailClient`), spinner sky beranda (pesan "Memuat Command
Center …"), dan 2 layar Mobile (`payroll/page.tsx`, `SlipDetailClient.tsx`).
Cek: grep K8 = 0 di Web dan Mobile, `tsc` Web + Mobile lulus, Biome berkas diubah
bersih, `audit:kontras` lulus. **Belum:** tangkapan layar layar tunggu kedua tema
(pemilik).

**Progres langkah 3.1 (2026-11-26).** E1–E3 dari `git diff a4bde11~1 d06db36`
sekolah (E4/E5 sudah di langkah 1–2). Web apa adanya: `--app-input-border`
`#56658a` / `#8391b5`, form terang berselector `:not([hidden]):not([type="hidden"])`
+ hover `#5b6b94`, garis netral gelap lewat `[class^=…]`/`[class*=" …"]`
(`#56658a`, hover `#7584aa`), panah SVG `select:not([multiple])` dua warna,
`.pilih-cari-tombol`, panel modal memakai variabel. Fokus terang tetap `#0284c7`
(sekolah `#2f4fbf` berasal dari remap B, menunggu langkah 6). `PilihCari.tsx`
diberi kelas lalu `sync:mobile`. Mobile (Q-7): token `--app-input-border` +
`--app-input-border-hover` di kedua tema dan aturan `:is(…)` yang sama tanpa
`!important` (tema terang Mobile dari skala dibalik, bukan aturan form
tersendiri); terang `#7584aa`, bukan `#8391b5`, karena isian Mobile juga di
`bg-slate-900/800` (`#f1f5f9`/`#e2e8f0`), tempat `#8391b5` hanya 2,87:1. Tidak
ada `<select>` ber-`appearance-none` atau `multiple`, jadi panah tidak ganda.
Kontras garis: gelap `#56658a` 3,08–3,48:1 (slate-900/950, latar Web/Mobile);
terang Web `#8391b5` 3,14:1 di putih; terang Mobile `#7584aa` 3,73 / 3,40 /
3,02:1; panah 6,9–7,9:1. Cek: Biome berkas diubah tanpa temuan baru (5 peringatan
`!important` lama Mobile), `audit:kontras` lulus. **Belum:** tangkapan layar form
Karyawan dan dialog kedua tema (pemilik).

**Progres langkah 5 (2026-11-26).** C1: header `payroll/page.tsx` tinggal
"Buat Batch Payroll" (`canCreateRun ? … : undefined`, pola sekolah); Batch Runs
dan Konfigurasi Gaji (`visible: canManageConfig`) pindah ke `QuickActionGrid`
bawaan 4 kolom, jadi kedua ubin berukuran sama dengan ubin beranda. C2:
`payroll/config/page.tsx` 3 kartu `Link` → `QuickActionGrid kolom={3}` dengan
`subtitle` (ikon `clock`, `document`, `users` seperti sekolah, tanpa kartu JP).
Impor `Link` dibuang dari `payroll/page.tsx` (masih dipakai di config). Cek:
`tsc` Web lulus, Biome 2 berkas bersih, `audit:kontras` lulus. Tidak ada berkas
Mobile yang tersentuh. **Temuan:** baris tab `payroll/config/page.tsx`
("Rate Gaji Karyawan", dst.) masih tombol buatan sendiri tanpa `role="tablist"`,
jadi luput dari A4 (sekolah sudah `TabBar` `idPrefix="konfigurasi-gaji"`).
**Belum:** K6/K7 manual (Superadmin + akun tanpa `payroll.config.manage`,
pemilik).

**Progres langkah 6 (2026-11-26).** Fase B Web, pola sekolah. **B1** ke cyan:
`StatusBadge` `info`, `RunStatusBadge` Diajukan, `SyncPulse` Menyinkronkan,
Cicilan "Menunggu barang", fallback tahap Rekrutmen, status tujuan
`RunDetailClient`, kotak info `BootstrapPanel` (+ override terang
`.bootstrap-info-box` cyan-800), pil status lain dan kolom Sakit di dashboard,
wajah terdeteksi di scanner, "Pulang" dan "Belum Pulang" di `history` (pil
`bg-cyan-500/15`, karena `bg-cyan-950` tidak punya override terang), hasil
"lainnya" Generate Alfa di `settings`, langkah aktif `LivenessCapture`. Ke
emerald: kartu "Hadir Hari Ini", legenda dan segmen "Tepat Waktu" (`#10b981`,
`AttendanceGauge3D`/`AttendanceGaugeGate`), kolom total hadir dashboard, hasil
scan sukses, "Akun aktif" `operators`, "Jaringan Terhubung" beranda.
Dijadwalkan/Berjalan/Disetujui tetap sky (navy), sama dengan sekolah. **B2**:
blok `@theme` `--color-sky-50..950` = skala navy sekolah; 66 hex/`rgb` sky di
`globals.css` dipetakan per anak tangga (50→`#eef2fc` … 600→`#2f4fbf`, 700→
`#10308a`, 800→`#0c2470`), termasuk `--app-primary*`, fokus input terang,
sidebar aktif, aurora; glow garis pindai scanner `#7b93e3`. `biome.json` Web
diberi `css.parser.tailwindDirectives` (seperti sekolah) supaya `@theme`
terbaca. **B3**: 57 baris di 30 berkas `bg-sky-400|500 … text-slate-950|white`
→ `bg-sky-700 … text-on-accent`, `hover:bg-sky-300|400|500` →
`hover:bg-sky-600` (termasuk `Modal`, `ThemeToggle`, tombol HRIS, segmen
dashboard). Override terang `a[href="/scanner"].bg-sky-400` dan
`button.bg-sky-400` dibuang (tak terpakai); selector segmen aktif dan
`.bg-slate-950\/60 button` pindah dari `bg-sky-500` ke `bg-sky-700` (tanpa itu
tombol aktif segmen dashboard bertinta `#475569` di tema terang). Akibatnya
tombol `bg-sky-700` di dalam `div.bg-slate-950` kini bergradien navy di tema
terang. Tidak disentuh: hex data kartu ID, `LoginScene`, `HomeHeroScene` 3D.
Cek: `tsc` Web lulus, Biome `src/app` + `src/components` 328 berkas bersih,
`audit:kontras` lulus; tidak ada `text-sky-500..900`. Salinan Mobile belum
di-`sync:mobile` (ikut langkah 7). **Belum:** tangkapan layar `/`,
`/dashboard`, `/scanner`, `/karyawan`, `/hris`, `/settings`, `/payroll` kedua
tema (pemilik).

**Progres langkah 7 (2026-11-26).** Pola `2ead61c` + D sekolah. **B2 Mobile**:
blok `@theme` `--color-sky-*` navy (sama dengan Web), cermin terang 950/900 →
`#eef2fc`/`#dce4f9`, 400/300/200 → `#2f4fbf`/`#10308a`/`#0c2470`, 100/50 →
`#0a1a4f`/`#061033`; `.theme-invariant` nilai navy gelap; `--app-primary*` gelap
`#7b93e3`/`#2f4fbf`, terang `#2f4fbf`/`#10308a`; aurora dan seleksi navy.
`mobile/biome.json` diberi `css.parser.tailwindDirectives`. **B1**: ke cyan
`StatusBadge` "Datang Lebih Awal", `RunStatusBadge` Diajukan, `FeedbackBanner`
`info`, pil `info` Operator, kotak info `BootstrapPanel`, wajah terdeteksi
`ScannerView`, langkah aktif `LivenessCapture`. **B3**: semua tombol
`bg-sky-400|500 … text-slate-950|on-accent` di berkas milik Mobile (±60 baris,
26 berkas) → `bg-sky-700 … text-on-accent`, hover → `sky-600`; `bg-sky-600
hover:bg-sky-500` (Slip, form karyawan, foto personil) → 700/600; gradien sky
bertinta gelap (`sync`, `DigitalIdCardPreview`, `EmployeeDetailModal`) → solid
`bg-sky-700`, avatar `settings` → `.ikon-navy`. Salinan `inventory/gaya.ts`,
`WajahWorkspace`, `DriverWorkspace` (`bg-sky-600 … text-white`, di Mobile terang
jadi tinta gelap di atas navy) disunting di Web → `bg-sky-700 hover:bg-sky-600
text-on-accent`, lalu `sync:mobile` (ikut membawa hasil B Web langkah 6). **D**
(Q-4 a): kelas `.hub-row`, `.ikon-navy`, `.nav-aktif`, `.nav-aktif-ikon`,
`.kartu-angka`, `.kartu-angka-label` di akhir `globals.css` Mobile; Menu (ubin
`hub-row`, kotak ikon `ikon-navy`), dashboard (tombol Scanner `ikon-navy`, baris
Data Karyawan `hub-row`, ikon jam `ikon-navy`, 4 kartu statistik `kartu-angka`),
`MobileBottomNav` (Scanner `ikon-navy`, tab aktif `nav-aktif`). Bilah bawah
sudah berdasar gelap (`bg-slate-950/95`), jadi tidak mengidap D5. **Q-6**: sidebar
aktif sudah ikut remap di langkah 6; pemindahan tombol hamburger **tidak
dikerjakan**: di sini sidebar tidak punya kepala berlogo (logo di bilah atas,
sidebar mulai di bawahnya) dan tombolnya sudah di samping logo. Cek: `tsc` Web +
Mobile lulus, Biome 37 berkas Mobile + 3 Web tanpa temuan baru (5 peringatan
`!important` lama), `audit:kontras` lulus, K10 grep `bg-sky-500/15` di Menu,
dashboard, bilah bawah = 0. **Belum:** tangkapan layar Menu, dashboard, bilah
bawah Mobile 390 px kedua tema (K10, pemilik).

**Langkah 8 (2026-11-26).** Antislop 4 berkas, komentar saja (`.claude/ANTISLOP.md`):
banner `====` Akses Cepat, Login, dan `.hub-row` di kedua `globals.css` jadi 1–2
baris, komentar `@theme`/token emas/garis input dipadatkan, kepala `TabBar.tsx`
8 → 3 baris (lalu `sync:mobile`), rujukan "(Q-1)" di `QuickActionTile` dibuang.
`bun run check` penuh **lulus** 22:23 WIB (`.claude/HASIL.md`, cargo test 480 +
484). **Semua langkah selesai**; tersisa hanya tangkapan layar dan uji manual
pemilik (K1, K2, K6, K7, K9, K10, K11, dan tangkapan layar langkah 2–6).

Sumber: `C:\dev\sekolah\prd-ui-navy-emas.md` (semua fase selesai dan
disetujui di sana). Dokumen ini mencatat apa yang bisa disalin apa adanya, apa
yang harus disesuaikan karena kode di sini berbeda, dan pertanyaan yang perlu
dijawab sebelum eksekusi.

Hanya tampilan: tidak ada tabel, kolom, command Tauri, rute API, izin, atau
aturan kembar TS ↔ Rust. `audit:schema` dan `audit:contract` tidak terdampak.

## 1. Ringkasan

Tujuan, prinsip warna (§3a sekolah: navy + emas = identitas, hijau/amber/rose/
netral = status), dan urutan fase (0 → A → C → B → D) dipakai ulang. Yang
berbeda adalah titik awalnya: di sekolah komponen bersamanya sudah ada dan
tinggal diganti gayanya, sedangkan di sini sebagian besar belum ada.

| Komponen sekolah | Di repo ini | Tindakan |
|---|---|---|
| `PageHeader` | Ada, struktur sama (27 pemakai) | Salin versi sekolah + kelas `.page-header*` |
| `Sakelar` + tes | Tidak ada | Salin, ganti sakelar buatan sendiri |
| `TabBar` + tes | Tidak ada | Salin, masuk `filesToCopy` sejak awal (lihat §3.4) |
| `MemuatHalaman` | Tidak ada | Salin (18 baris) |
| `QuickActionTile` / `QuickActionGrid` | Tidak ada; dashboard punya grid modul sendiri | Salin, `DEFAULT_TILES` ditulis ulang untuk modul perusahaan (Q-2) |
| Mobile `HubRow` / `StatTile` | Tidak ada; kartu ditulis langsung di halaman | Kelas CSS di markup yang ada, bukan komponen baru (Q-4) |
| `scripts/audit-kontras.ts` | Tidak ada | Salin (hanya `node:fs`/`node:path`), pasang di `check`/`check:quick` |
| `web-desktop/scripts/sisir-kontras.mts` | Tidak ada; **Playwright belum terpasang** di sini | Q-3 |
| Token `--app-navy*`, `--app-gold-line`, `--app-gold-text` | Web punya `--app-gold` saja; Mobile tidak punya token emas | Tambah di kedua `globals.css` |
| `.text-on-accent` | Mobile ada (`globals.css:191`), Web belum | Tambah di Web |

### 1.1 Riwayat git sekolah sebagai sumber salinan

Fase tidak dikomit satu per satu. Pemetaannya:

| Commit | Tanggal | Isi | Di repo ini |
|---|---|---|---|
| `03c7af9` | 11-24 | `capture-promosi.ts`, `seed-demo-promosi.ts`, tangkapan layar promosi | Tidak ada; diperlukan `sisir-kontras.mts` (Q-3) |
| `32964d8` | 11-25 | Login navy + emas (kedua `globals.css`, kedua `login/page.tsx`, `Icon`) | **Sudah ada**: blok `.login-hero` identik |
| `8e100c2` | 11-26 05:56 | Fase 0, A, C, D, dan B Web sekaligus (135 berkas, +2.656/−1.513) | Sumber utama langkah 0.1 sampai 6 |
| `2ead61c` | 11-26 13:48 | B Mobile (B1–B3 di 46 berkas Mobile) + tombol hamburger di sidebar (`AppSidebar`, `HeaderBar`) | Langkah 7 dan Q-6 |
| `a4bde11`, `96883ef`, `be1f824`, `d06db36` | 11-26 14:36–17:23 | "Bug border box": perbaikan sesudah PRD, **tidak tercatat di PRD sekolah** (§4 Fase E) | Belum ada |

Karena `8e100c2` mencampur semua fase, salinan diambil per berkas
(`git show 8e100c2:<berkas>` untuk komponen baru, potongan blok `globals.css`
per kelas `.sakelar*`, `.aksi-cepat*`, `.page-header*`, `.tab-bar*`), bukan
`cherry-pick`. Struktur folder kedua repo berbeda (sekolah punya
`kepegawaian`, `nilai`, `akademik`, `AppSidebar`; di sini `hris`,
`perjalanan`, `AppShell`), jadi patch utuh tidak akan masuk.

Urutannya tetap mulai dari Fase 0, sama seperti di sekolah.

## 2. Keputusan sekolah yang diusulkan berlaku apa adanya

Satu basis kode turunan dan pemilik yang sama, jadi keputusan di bawah diusulkan
dipakai tanpa dibahas ulang (Q-1 mengonfirmasi):

- Warna per menu (`tone`) di Akses Cepat dihapus; satu nada navy, warna hanya
  untuk badge status.
- Emas di tema terang: teks `#92400e` (7,1:1), garis `#d97706` (3,2:1, hanya
  border). Emas gelap `#f6c453`, garis gelap `#86682a`.
- Sakelar aktif hijau `#059669`, nonaktif netral `#64748b`, sama di kedua tema,
  dengan teks "Aktif"/"Nonaktif".
- Status yang dulu `sky` pindah ke **cyan** (info, menunggu, menyinkronkan) atau
  **emerald** (hadir, tepat waktu, berhasil) sebelum remap Fase B.
- Remap Fase B: `--color-sky-*` = skala navy (`400 #7b93e3` … `700 #10308a` …
  `950 #061033`); tombol `bg-sky-400|500 … text-slate-950` → `bg-sky-700
  hover:bg-sky-600 text-on-accent`.
- Gate `audit:kontras` tanpa daftar pengecualian.
- Hex warna di data kartu ID, scene 3D login, dan overlay kanvas scanner tidak
  disentuh.
- Antislop dan `bun run check` penuh dijalankan pemilik.

## 3. Temuan dari kode

### 3.1 Sakelar on/off (Fase 0a)

| Berkas:baris | Pola |
|---|---|
| `web-desktop/src/app/holidays/page.tsx:626-628` | `input.peer` + `div`, `bg-slate-800` / `peer-checked:bg-sky-500` |
| `web-desktop/src/app/settings/page.tsx:2707-2709` | `input.peer`, `peer-checked:bg-amber-400` |
| `web-desktop/src/app/shift/page.tsx:1133-1135` | `input.peer` |
| `web-desktop/src/app/shift/page.tsx:742` | `<button role="switch">` |
| `web-desktop/src/app/id-cards/page.tsx:3329, 3412` | `<button>` + kenop `translate-x-*`, perlu dicek apakah ber-ARIA |
| `mobile/src/app/settings/page.tsx:718-720` | `input.peer` |
| `mobile/src/app/settings/page.tsx:1222` | kenop geofence `translate-x-5` |
| `mobile/src/app/shift/page.tsx:880` | `<button role="switch">` |
| `mobile/src/components/MailSettingsCard.tsx:291-293` | `input.peer` |

Total ±6 Web + 4 Mobile (sekolah 14 + 4; di sini tidak ada kartu Notifikasi WA).
Akar masalahnya sama dengan §8.1 sekolah: `bg-slate-800` di kartu `bg-slate-900`
±1,2:1, tambalan tema terang per pola, dan skala slate Mobile yang dibalik.
`peer-checked` juga masih ada di `web-desktop/src/app/globals.css` (tambalan
yang dibuang setelah penggantian).

### 3.2 Teks sewarna latar (Fase 0b)

- Web memaksa `.text-white`/`.text-slate-100/200` ke `#0f172a` di tema terang
  (`globals.css:823-834`) dengan daftar putih 9 latar (`globals.css:858-`),
  persis kasus sekolah.
- Pindai kasar `className` (`text-white` + `bg-indigo|violet|teal|…-500..900`,
  gradien, `bg-[#…]`): ±9 elemen Web, ±4 Mobile. Daftar pastinya diambil dari
  keluaran `audit:kontras` pertama, bukan dari pindai ini.

### 3.3 Akses Cepat (Fase A2 + C)

- `web-desktop/src/app/page.tsx:41-183`: `MODULES` 13 kartu dengan `tone`
  (`sky|amber|emerald|violet`, `TONE_CLASSES`), disaring `area` di `:338`,
  dirender grid bento `grid-cols-1 md:2 lg:3` di `:690-740` dengan deskripsi
  panjang. Ini pengganti `QuickActionGrid` sekolah, tetapi bentuknya kartu
  besar, bukan ubin ikon.
- `web-desktop/src/app/payroll/page.tsx:193-215`: header berisi 2 tautan
  (Batch Runs, Konfigurasi), bukan 4 seperti sekolah. Tidak ada Rapel dan
  Pelaporan di sini.
- `web-desktop/src/app/payroll/config/page.tsx:417-470`: 3 kartu sub-modul
  (Lembur, Pajak, BPJS) buatan sendiri; sekolah punya 4 (dengan JP).
- `web-desktop/src/app/page.tsx:194-210` `TIER_BADGES` dan spinner `:323`
  ikut disentuh di A5/B.

### 3.4 Baris tab (Fase A4)

`role="tablist"` Web: `app/settings/page.tsx:1243`,
`components/hris/{BaganOrganisasi:133, HrisWorkspace:159, KinerjaWorkspace:49,
PelatihanWorkspace:137, PengajuanWorkspace:373, PenilaianKinerja:262,
RincianKaryawan:259}`, `components/inventory/InventarisWorkspace.tsx:427`,
`components/keuangan/KeuanganWorkspace.tsx:220`,
`components/perjalanan/PerjalananWorkspace.tsx:120`. Total 11, ditambah tab
`app/operational/page.tsx:642-644` yang belum ber-ARIA (E6).

**Beda penting dari sekolah:** 10 dari 11 berkas itu disalin ke Mobile
(`components/hris` lewat `dirsToCopy`, Inventaris/Keuangan/Perjalanan lewat
`filesToCopy`). Jadi `TabBar.tsx` wajib masuk `filesToCopy` dan blok `.tab-bar`
wajib ada di `globals.css` Mobile **di langkah yang sama**, bukan di Fase D;
kalau tidak, `sync:mobile` menghasilkan impor yang tidak ada. Mobile juga punya
tab sendiri di `mobile/src/app/pengajuan/page.tsx` (diganti dengan tangan).

### 3.5 Layar tunggu (Fase A5)

"Memuat otorisasi..." polos: Web `payroll/page.tsx:185`,
`payroll/config/page.tsx:370`, `payroll/config/{bpjs,overtime,tax}-rules/page.tsx`,
`payroll/runs/page.tsx:70`, `payroll/runs/detail/RunDetailClient.tsx:141` (7);
Mobile `payroll/page.tsx:276`, `payroll/slip/[id]/SlipDetailClient.tsx:152` (2,
punya Mobile sendiri). Spinner `app/page.tsx:323`.

### 3.6 Warna `sky` (Fase B)

±804 pemakaian `sky-N` di Web dan ±582 di Mobile. Web **belum** punya blok
`@theme` untuk sky (remap ditulis baru). Mobile sudah mencermin skala sky untuk
tema terang (`globals.css:219-223, 288-289, 335-`), jadi B2 Mobile mengganti
nilai cermin itu dengan cermin navy versi sekolah. Kandidat status yang harus
keluar dari sky dulu (B1), daftar awal: `StatusBadge` `info`
(`components/ui/StatusBadge.tsx:6`), `RunStatusBadge.tsx:19`, `TIER_BADGES`,
sidebar aktif `AppShell.tsx:56` (ini identitas, ikut remap), dan status
sinkron. Inventaris lengkap dibuat di langkah B1.

### 3.7 Mobile (Fase D)

- Tidak ada `HubRow`/`StatTile`. Dashboard (`mobile/src/app/dashboard/page.tsx`)
  menulis kartu langsung: tombol Scanner gradien sky `:206`, baris Data
  Karyawan `:232`, grid statistik `:259`.
- Menu (`mobile/src/app/menu/page.tsx:89-98`): grid 3 kolom, kotak ikon
  `bg-sky-500/15 text-sky-300`. Ini padanan Akses Cepat yang paling sering
  dilihat di HP.
- `MobileBottomNav.tsx` (126 baris): perlu dicek apakah mengidap bug yang sama
  dengan sekolah D5 (kelas terang + `dark:` yang dibalik variabel Mobile).

## 4. Rancangan per fase

### Fase 0: bug sakelar dan kontras (Web + Mobile)

- **0a.** Salin `Sakelar.tsx` + `Sakelar.test.ts` + blok `.sakelar*` ke kedua
  `globals.css`; masuk `filesToCopy`. Ganti sakelar §3.1. Hapus tambalan
  `peer-checked` di `globals.css` Web. Uji klik → simpan → muat ulang per
  sakelar (pemilik).
- **0b.** `.text-on-accent` di Web; perbaiki elemen dari keluaran `audit:kontras`.
  Salinan Mobile disunting lewat berkas Web lalu `sync:mobile`.
- **0c.** Penyisiran kontras saat berjalan: tergantung Q-3.
- **0d.** Salin `scripts/audit-kontras.ts`, sesuaikan jalur kedua workspace,
  pasang di `check` dan `check:quick` root.

### Fase A: fondasi

- **A1.** Token di `:root` dan blok terang kedua `globals.css`.
- **A2.** Salin `QuickActionTile`/`QuickActionGrid` + `.aksi-cepat*`.
  `DEFAULT_TILES` diisi dari `MODULES` dashboard (judul pendek, `area` sama),
  `tone` dibuang. Bentuk dashboard: Q-2.
- **A3.** Salin `PageHeader` + `.page-header*`; 27 pemakai tidak disunting.
- **A4.** Salin `TabBar` + tes, `filesToCopy`, `.tab-bar` di kedua CSS; ganti 11
  baris tab Web + `pengajuan` Mobile. Id tab yang berubah (mis. Settings) dicek
  terhadap selector E2E bila ada.
- **A5.** Salin `MemuatHalaman`; ganti 7 + 1 layar Web. Mobile 2 layar ikut
  bila Mobile mau komponen yang sama (disalin manual, bukan `filesToCopy`,
  karena halaman Payroll Mobile milik Mobile).

### Fase C: hub per modul (Web/Desktop)

- **C1.** `payroll/page.tsx`: Batch Runs dan Konfigurasi (`payroll.config.manage`,
  syarat sama dengan tombol sekarang) pindah ke grid 2 kartu (Q-5). Header
  tinggal "Buat Batch Payroll".
- **C2.** `payroll/config/page.tsx`: 3 kartu → `QuickActionGrid kolom={3}` dengan
  `subtitle`.
- **C3.** Settings, HRIS, Keuangan, Inventaris cukup `TabBar` (sudah di A4).

### Fase B: remap `sky`

B1 status → cyan/emerald, B2 `@theme` Web baru + cermin navy Mobile, B3 tombol
bertulisan gelap, lalu buang override terang yang tak terpakai. Tangkapan layar
`/`, `/dashboard`, `/scanner`, `/karyawan`, `/hris`, `/settings`, `/payroll`
kedua tema.

### Fase D: Mobile

Kelas `.ikon-navy` dan `.kartu-angka` (nama sama dengan sekolah) dipasang di
dashboard, menu, dan statistik; tombol Scanner dashboard navy; `MobileBottomNav`
diperiksa dan ditulis dengan dasar gelap bila mengidap bug D5.

### Fase E: garis kontrol form dan tab (perbaikan sekolah sesudah PRD)

Dari empat commit "Bug border box" (hanya `globals.css` Web di sekolah):

- **E1. Garis input ≥ 3:1.** `--app-input-border` gelap `rgba(255,255,255,0.12)`
  → `#56658a`, terang `#cbd5e1` (1,5:1) → `#8391b5`; hover `#7584aa` / `#5b6b94`.
  Input/select/textarea berkelas `border-white/*` atau `border-slate-*` ditimpa
  lewat pencocokan `[class^=…]`/`[class*=" …"]` (supaya `hover:`/`focus:border-*`
  tidak ikut). Selector tema terang select/textarea diberi
  `:not([hidden]):not([type="hidden"])` untuk menaikkan spesifisitas; panel
  modal memakai variabel yang sama. Di sini `--app-input-border` masih nilai
  lama (`globals.css:19, 43`).
- **E2. Tombol panah `PilihCari`** diberi kelas `.pilih-cari-tombol` dengan garis
  yang sama. `PilihCari.tsx` ada di `filesToCopy`, jadi Mobile ikut tersalin;
  CSS-nya ditambahkan di kedua `globals.css`.
- **E3. Panah `<select>`** diganti SVG berjarak tetap (`appearance: none`,
  `padding-right: 2.75rem`), dua warna untuk kedua tema.
- **E4. Tab tidak aktif** bergaris lembut (gelap `rgb(148 163 184 / 22%)`,
  terang `#c9d1e6` di atas putih). Ikut di A4.
- **E5. Kotak ikon Akses Cepat tema terang** navy pucat (ikon `#1d3a9e`,
  8,25:1), berubah navy pekat + emas saat disorot. Ikut di A2.
- **E6. `/operational`** tab Koreksi Admin / Backup / Import Manual jadi
  `TabBar`. Di sini baris tab yang sama ada tanpa `role="tablist"`
  (`web-desktop/src/app/operational/page.tsx:642-644`), jadi ikut A4.

Sekolah hanya menerapkan E1–E3 di Web. Usul: Mobile ikut dengan variabel
`--app-input-border` miliknya (Q-7).

## 5. Di luar cakupan

- Struktur halaman besar (`id-cards` ±3.400 baris, `settings` ±2.700).
- Sidebar dan hero dashboard, kecuali Q-6.
- UI 3D/motion, ikon baru, dependensi baru selain yang diputuskan di Q-3.

## 6. Kriteria penerimaan

K1–K14 sekolah berlaku dengan penyesuaian:

| # | Penyesuaian |
|---|---|
| K4 | `grep -rn 'role="tablist"' web-desktop/src mobile/src` hanya menemukan `TabBar.tsx` (Web + salinan Mobile). |
| K6 | Akun tanpa `payroll.config.manage` tidak melihat kartu Konfigurasi. |
| K8 | `grep -rn "Memuat otorisasi" web-desktop/src/app` = 0 (Mobile menurut A5). |
| K10 | Menu, dashboard, dan bilah bawah Mobile navy + emas di kedua tema, tanpa kotak ikon `bg-sky-500/15`. |
| K11 | Tangkapan layar: Hari Libur, Shift, Pengaturan (sakelar `:2707`), Kartu ID. |
| K12 | `grep -rn "peer-checked" web-desktop/src mobile/src` = 0; hanya `Sakelar.tsx` yang memuat `role="switch"`. |
| K14 | Hanya bila Q-3 = (a). |

## 7. Urutan pengerjaan

Satu langkah per giliran, pemilik membalas "Lanjut".

| # | Langkah | Gerbang |
|---|---|---|
| 0.1 | 0a `Sakelar` Web + Mobile | `Sakelar.test.ts`, grep K12, `tsc` kedua workspace |
| 0.2 | 0d `audit:kontras`, lalu 0b perbaiki keluarannya | `audit:kontras` lulus (K13), Biome berkas diubah |
| 0.3 | 0c penyisiran (bila Q-3 = a) | K14 |
| 1 | A1 token, A2 Akses Cepat dashboard, A3 `PageHeader` | `tsc`, tangkapan layar dashboard 390/1280 px kedua tema (K1, K2, K9), K3 |
| 2 | A4 `TabBar` + `sync:mobile` | `TabBar.test.ts` (K5), grep K4, `tsc` Mobile |
| 3 | A5 `MemuatHalaman` | grep K8 |
| 3.1 | E1–E3 garis input, `PilihCari`, panah select | tangkapan layar form Karyawan dan dialog di kedua tema; pemeriksa kontras ≥ 3:1 |
| 4 | Pemilik: tinjau A, antislop → check | `.claude/HASIL.md` hijau |
| 5 | C1, C2 | K6, K7 manual (Superadmin + akun tanpa konfigurasi gaji) |
| 6 | B1 → B2 → B3 Web | tangkapan layar 7 halaman, `audit:kontras` |
| 7 | B Mobile + D | `tsc` + Biome Mobile, K10 |
| 8 | Pemilik: antislop → check | `.claude/HASIL.md` hijau |

## 8. Pertanyaan terbuka

- **Q-1.** Keputusan sekolah di §2 berlaku apa adanya di sini, termasuk sky →
  cyan untuk status dan hijau untuk sakelar? (Usul: ya.)
- **Q-2.** Grid modul dashboard Web (13 kartu besar berdeskripsi, 1–3 kolom):
  (a) diganti ubin `QuickActionGrid` 2/4 kolom seperti mockup sekolah, deskripsi
  jadi `subtitle` pendek; (b) bentuk kartu besar dipertahankan, hanya `tone`
  dibuang dan diberi kotak ikon navy + garis emas. (Usul: a, supaya satu
  komponen dipakai dashboard dan hub Payroll.)
- **Q-3.** Penyisiran kontras 0c butuh Playwright, yang belum terpasang di
  `web-desktop` (CLAUDE.md menyebut `test:e2e`, tetapi skrip dan paketnya tidak
  ada). (a) pasang `playwright` sebagai devDependency + Chromium dan salin
  `sisir-kontras.mts` dengan alur login sendiri; (b) lewati 0c, cukup gate
  statis + tangkapan layar manual pemilik. (Usul: b dulu; a bila tangkapan
  layar masih menemukan teks tak terbaca.)
- **Q-4.** Mobile: (a) kelas CSS pada markup yang ada (`.ikon-navy`,
  `.kartu-angka`), tanpa komponen baru; (b) salin `HubRow`/`StatTile` sekolah
  dan susun ulang dashboard/menu. (Usul: a, diff jauh lebih kecil.)
- **Q-5.** Hub Payroll hanya 2 tautan. (a) tetap dipindah ke grid 2 kartu;
  (b) dibiarkan di header, C1 hanya merapikan gaya. (Usul: a, konsisten dengan
  sekolah.)
- **Q-6.** Ikut porting perubahan sidebar sekolah (tombol hamburger pindah ke
  kepala sidebar, sidebar aktif navy + emas)? Di sekolah ini permintaan
  tambahan pemilik, bukan bagian PRD awal. (Usul: ya, sidebar aktif ikut remap
  B; tombol hamburger ikut bila disetujui.)
- **Q-7.** Perbaikan garis input E1–E3 juga diterapkan di Mobile, atau Web saja
  seperti di sekolah? (Usul: keduanya; HP lebih sering dipakai di luar ruangan,
  jadi garis pudar lebih terasa di sana.)
