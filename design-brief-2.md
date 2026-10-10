# DESIGN BRIEF: MAKLONOS TAHAP 2 (RND LAB, PRICING ENGINE, DESAIN, LEGAL GATE, & APPROVAL GATEWAY)

---

## 1. Design Principles

Tiga aturan desain mutlak yang wajib dipatuhi antarmuka MaklonOS Tahap 2:

### Prinsip 1: Hard Interlocking Gate Transparency (Transparansi Gerbang Bisnis Tak Terkompromi)

* **Konteks:** Tahap 2 menghubungkan lima divisi dengan dependensi prosedural ketat: Legal tidak boleh mendaftar sebelum DP lunas; Pabrik tidak boleh memproduksi sebelum Dummy disetujui; RnD tidak boleh meracik revisi sebelum tarif kustom diverifikasi Finance.


* **Aturan Desain:**
* Elemen interaktif yang terkunci (*disabled*) dilarang keras hanya diredupkan warnanya tanpa penjelasan.
* Setiap tombol atau seksi form yang terkunci wajib dibungkus oleh komponen visual **GateLockBanner** yang secara deterministik menampilkan:
1. Status kondisi prasyarat (*misal: "Terkunci: Menunggu Pelunasan DP Legal & Produksi"*).


2. Divisi penanggung jawab pembuka gerbang (*misal: "PIC: Tim Finance"*).


3. Tautan langsung ke dokumen/tiket prasyarat untuk mempercepat koordinasi internal.





### Prinsip 2: High-Precision Calculation & Formula Clarity (Presisi Angka & Integritas Kimia-Finansial)

* **Konteks:** Kesalahan pembulatan desimal pada HPP memicu kerugian margin produksi massal ribuan unit. Kesalahan pencatatan kode formula atau takaran membatalkan registrasi BPOM.


* **Aturan Desain:**
* Seluruh data identifikasi teknis (`formula_code`, `bpom_reg_number`, `sig_report_no`, nomor invoice) dan kalkulasi finansial (HPP, margin %, harga final) wajib dirender menggunakan font monospasial dengan penataan rata kanan (*right-aligned*) untuk angka.


* Kalkulasi dinamis HPP dan margin wajib bersifat reaktif instan ($0\text{ ms}$ input response) dengan penanda visual jika margin berada di bawah ambang batas minimal perusahaan ($< 30\%$).





### Prinsip 3: Asymmetric Bifurcation (Back-Office Padat vs Client Mobile Frictionless)

* **Konteks:** Sistem melayani dua spektrum pengguna yang berlawanan: staf back-office internal (memerlukan kepadatan data tinggi di desktop/tablet) dan klien maklon eksternal (mengakses link via smartphone tanpa akun login).


* **Aturan Desain:**
* **Internal (RnD, Finance, Desain, Legal):** Gunakan layout *multi-column data cockpit* dengan hotkey keyboard, tabel padat ($36\text{ px}$ row height), dan panel inspektor berdampingan.


* **Eksternal (Approval Gateway Klien):** Gunakan layout *mobile-first card stack* satu kolom tanpa menu navigasi, rasio kontras tinggi, elemen visual besar (mockup, spesifikasi kunci), dan dua tombol keputusan tegas: **ACC** atau **REVISI**.





---

## 2. Visual Direction

### Mood & Karakter

* **Sterile Laboratory Meets Quantitative Banking:** Menggabungkan kebersihan instrumen laboratorium sains (RnD) dengan ketegasan terminal finansial kuantitatif (Finance). Terstruktur, objektif, tanpa dekorasi artifisial.


* **Client Gateway Trust:** Khusus antarmuka klien via web link, visual harus memancarkan kredibilitas pabrik farmasi/kosmetik bersertifikasi cGMP/CPKB: tata letak teratur, tipografi elegan, dan bebas dari distorsi elemen teknis internal.

### Referensi Visual

* **Mercury Bank & Stripe Billing Dashboard:** Tata letak ringkasan invoice, pemisahan komponen kalkulasi HPP, dan status audit pembayaran.


* **Benchling & LabArchives:** Formulasi reagen, penomoran kode formula unik, dan input *product knowledge* yang terstruktur.


* **DocuSign / Typeform Mobile Experience:** Alur persetujuan dokumen publik berbasis token: satu kartu fokus dalam satu waktu, navigasi terarah, dan penandatanganan/persetujuan sekali sentuh.



### Anti-Patterns (Apa yang Dihindari)

* **Dilarang:** Input kalkulasi harga menggunakan slider interaktif. Finansial maklon menuntut presisi mutlak berbasis angka desimal yang diketik langsung.


* **Dilarang:** Menggunakan pop-up konfirmasi standar browser (`window.confirm`) untuk keputusan penting seperti *Tolak Formula* atau *Verifikasi Bayar*. Semua wajib menggunakan *Structured Audit Modal*.


* **Dilarang:** Membiarkan klien melihat internal pricing breakdown (HPP, margin %) pada halaman approval web. Klien hanya berhak melihat spesifikasi fisik, foto mockup, dan harga unit final penawaran.



---

## 3. Design Tokens

### 3.1. Color Palette (Strict Hex Codes & Semantic Roles)

| Token Name | Hex Code | Deskripsi & Rasional Penggunaan |
| --- | --- | --- |
| **Brand Primary (Cyan Industrial)** |  | Mempertahankan kontinuitas identitas dari Tahap 1.

 |
| `color-primary-900` | `#083344` | Header workspace, navigasi teratas.

 |
| `color-primary-700` | `#0E7490` | Aksi utama back-office (Submit Formula, Buat Invoice).

 |
| `color-primary-50` | `#ECFEFF` | Highlight baris tabel terpilih, focus state.

 |
| **Finance & Calculation (Emerald Sharp)** |  | Digunakan khusus kalkulasi HPP, pelunasan transfer, dan status Acc.

 |
| `color-finance-800` | `#065F46` | Teks nilai harga final, total kalkulasi. |
| `color-finance-600` | `#059669` | Tombol `Verifikasi Lunas`, border indikator profit margin. |
| `color-finance-50` | `#ECFDF5` | Background container breakdown HPP.

 |
| **Legal & Regulatory (Imperial Violet)** |  | Warna semantik otoritas hukum, izin edar BPOM, Halal, dan HKI.

 |
| `color-legal-800` | `#3730A3` | Badge status `BPOM MD/NA Terbit`, label sertifikat resmi.

 |
| `color-legal-600` | `#4F46E5` | Aksi submit dokumen legalitas, tag White-label bypass.

 |
| `color-legal-50` | `#EEF2FF` | Background section compliance & berkas SIG.

 |
| **Interlocking Lock States (Amber & Crimson)** |  |  |
| `color-gate-locked` | `#991B1B` | Banner terkunci, penolakan formula pabrik, revisi berbayar.

 |
| `color-gate-locked-bg` | `#FEF2F2` | Background banner pemblokiran alur.

 |
| `color-gate-pending` | `#92400E` | Menunggu approval dummy, evaluasi tarif Finance.

 |
| `color-gate-pending-bg` | `#FFFBEB` | Background penahan alur sementara.

 |

### 3.2. Typography Scale

* **Primary Font:** `Plus Jakarta Sans` — Digunakan pada label form, judul dokumen, dan antarmuka web klien.


* **Monospace Font:** `JetBrains Mono` — Digunakan pada entitas kritis:
* Kode formula (`FOR-2026-SKN-001`)


* Nomor BPOM (`NA18260100234` / `MD 867012001001`)


* Angka finansial, formula HPP, persentase margin, dan token approval 32 karakter.





| Token | Size | Line Height | Weight | Penerapan Komponen |
| --- | --- | --- | --- | --- |
| `text-display` | 24px | 32px | Bold (700) | Kalkulasi Harga Unit Final, Angka Total MOU.

 |
| `text-title-lg` | 18px | 24px | SemiBold (600) | Header Workbench RnD, Modal Pricing Engine.

 |
| `text-title-sm` | 15px | 20px | SemiBold (600) | Section Header: Breakdown HPP, Legal Check.

 |
| `text-body` | 13px | 18px | Regular (400) | Form input field, tabel antrian, spesifikasi lab.

 |
| `text-body-bold` | 13px | 18px | SemiBold (600) | Nilai nominal biaya, nama formula, PIC divisi.

 |
| `text-caption` | 11px | 16px | Medium (500) | Sub-label gate, warning threshold margin.

 |
| `text-mono-data` | 13px | 18px | Regular (500) | Input field biaya, kode formula, nomor izin edar.

 |

### 3.3. Spacing, Radius, & Shadow Tokens

* **Spacing Scale:** Base 4px (`space-1`: 4px, `space-2`: 8px, `space-3`: 12px, `space-4`: 16px, `space-5`: 20px, `space-6`: 24px, `space-8`: 32px).


* **Radius:**
* `radius-sm`: 3px (Badge BPOM, status gate pill).


* `radius-md`: 6px (Input field numerik, card breakdown harga).


* `radius-lg`: 8px (Modal generator invoice, card approval klien di mobile).




* **Shadows:**
* `shadow-card`: `0 1px 3px 0 rgba(15, 23, 42, 0.08)` (Card formula dan dummy).


* `shadow-calc-popover`: `0 8px 24px -4px rgba(15, 23, 42, 0.15)` (Live breakdown HPP).





---

## 4. Screen Inventory (Phase 2 Additions)

| Screen ID | Nama Layar | Target Pengguna | Tujuan & Cakupan Fitur |
| --- | --- | --- | --- |
| **SCR-08** | **RnD Laboratory Workbench** | Formulator RnD | Antrean tiket peracikan sampel terurut deadline, pemilihan formulasi (*New/Existing*), konfirmasi kelayakan mesin pabrik (*Acc/Tolak*), registrasi `formula_code`, dan pencatatan *Product Knowledge*.

 |
| **SCR-09** | **Dynamic Pricing & Costing Engine** | Tim Finance | Modul kalkulator dinamis HPP per unit (Bahan + Kemasan + Overhead) dikalikan target margin %, riwayat penyesuaian harga, serta penguncian harga final draf MoU.

 |
| **SCR-10** | **Custom Revision Fee Assessment Modal** | Tim Finance | Form penetapan tarif kustom bahan baku untuk tiket revisi di luar batas gratis (`revision_index > free_revision_limit`) sebelum lab mulai bekerja.

 |
| **SCR-11** | **Packaging Design & Dummy Gate Tracker** | Desainer Grafis | Pengambilan brief kemasan, upload mockup visual ($\le 300\text{ KB}$ WebP), pelacakan verifikasi bayar dummy, input resi kirim dummy fisik, dan pemantau approval dummy.

 |
| **SCR-12** | **Strict Legal Compliance Gatekeeper** | Legal Officer | Pemantau status pelunasan DP Legal & Produksi (`is_dp_cleared`), bypass otomatis produk White-label, serta form perekaman izin SIG, BPOM MD/NA, Halal, dan HKI.

 |
| **SCR-13** | **Financial Clearance & Invoice Hub** | Tim Finance | Dasbor verifikasi mutasi rekening koran untuk 4 jenis pembayaran, upload bukti bayar terkompresi, pencocokan nominal, dan penerbit PDF invoice resmi.

 |
| **SCR-14** | **One-Time Token Approval Web Portal** | Klien Eksternal | Halaman web responsif (tanpa login, single-use token dengan TTL dinamis) untuk persetujuan sampel lab, dummy kemasan, atau MoU dengan opsi **ACC** / **REVISI**.

 |

---

## 5. User Flows

### Flow 1: Peracikan Formula Lab RnD & Konfirmasi Kelayakan Pabrik

```
[Tiket Berstatus: READY_FOR_RND (Lolos Pembayaran / Kuota Gratis)][cite: 2]
  │
  ▼
[RnD Membuka SCR-08 Workbench]
  │
  ├── 1. Pilih Klasifikasi: [New Product Formula] ATAU [Existing Formula Database][cite: 2]
  ├── 2. Konfirmasi Kelayakan Produksi bersama Tim Mesin Pabrik[cite: 2]:
  │     │
  │     ├── PILIHAN A: [TOLAK PABRIK][cite: 2]
  │     │     ├── Input Alasan Teknis (Viskositas mesin, inkompatibilitas bahan)[cite: 2]
  │     │     ├── Telegram Bot otomatis mengirim alert ke Grup CS[cite: 2]
  │     │     └── Tiket dikembalikan ke CS untuk negosiasi ulang spesifikasi[cite: 2]
  │     │
  │     └── PILIHAN B: [ACC FORMULA][cite: 2]
  │           ├── Sistem menerbitkan / memvalidasi `formula_code` unik[cite: 2]
  │           ├── Input lead_time_days peracikan fisik[cite: 2]
  │           ├── Input Product Knowledge (manfaat, tekstur, kestabilan, aturan pakai)[cite: 2]
  │           └── Klik "Sampel Selesai Dibuat"[cite: 2]
  │
  ▼
[Status Tiket: SAMPLE_DISPATCHED_TO_CS][cite: 2]
  │
  ├── Telegram Bot mengirim alert ke Grup CS & Finance[cite: 2]
  └── Data formula langsung terkunci dan tersedia untuk kalkulator HPP Finance[cite: 2]

```

---

### Flow 2: Kalkulasi Dinamis HPP & Margin oleh Finance

```
[Mulai: Tiket Sampel Di-Acc oleh RnD & Klien Meminta Penawaran Harga][cite: 2]
  │
  ▼
[Finance Membuka SCR-09 Dynamic Pricing Engine]
  │
  ├── Sistem menarik data base formula dari sample_feedbacks[cite: 2]
  ├── Finance menginput variabel:
  │     ├── base_hpp_unit (Rp)[cite: 2]
  │     ├── packaging_cost_unit (Rp)[cite: 2]
  │     ├── operational_cost_unit (Rp)[cite: 2]
  │     └── margin_percentage (%)[cite: 2]
  │
  ▼
[Engine Menghitung Reaktif 0ms]:[cite: 2]
  │
  │  Total HPP = base_hpp + packaging_cost + operational_cost[cite: 2]
  │  final_unit_price = Total HPP * (1 + (margin_percentage / 100))[cite: 2]
  │
  ├── JIKA margin_percentage < 30%: Banner oranye "Margin di bawah standar operasional!"[cite: 2]
  └── JIKA margin_percentage >= 30%: Banner hijau "Margin optimal"
  │
  ▼
[Finance Klik: "Kunci & Terbitkan Harga Draf MOU"][cite: 2]
  │
  ├── Field is_approved = 1 di tabel pricing_formulas[cite: 2]
  └── Nilai final_unit_price otomatis mengunci kalkulasi total pada production_mou[cite: 2]

```

---

### Flow 3: Gerbang Dummy Produk & Penahanan Jalur Pabrik (Dummy Gate)

```
[Formulir Tiket Sampel Menandai: is_dummy_required = TRUE][cite: 2]
  │
  ▼
[Sistem Menerbitkan Tagihan DUMMY_FEE di Antrian Finance][cite: 2]
  │
  ├── Desain Grafis DILARANG mencetak dummy sebelum Finance memverifikasi bayar[cite: 2]
  │
  ▼
[Finance Memverifikasi Pembayaran Dummy via SCR-13][cite: 2]
  │
  ▼
[Desain Grafis Mencetak Dummy Fisik & Mengirimkan ke Klien][cite: 2]
  │
  ├── Input nomor resi pengiriman dummy fisik[cite: 2]
  ├── Sistem menerbitkan tautan DUMMY_APPROVAL via WhatsApp Klien[cite: 2]
  │
  ▼
[INTERLOCKING GATE AKTIF]:
  │
  ├── Tombol "Buat Draf MoU Produksi" & "Kirim ke PPIC" TERKUNCI TOTAL[cite: 2]
  ├── Badge: "Pabrik Ditahan: Menunggu Konfirmasi Fisik Dummy dari Klien"[cite: 2]
  │
  ├── KASUS A: Klien Memilih [TOLAK / REVISI DUMMY][cite: 2]
  │     ├── Tiket dummy kembali ke Desain Grafis untuk perbaikan cetak[cite: 2]
  │     └── Jalur pabrik TETAP TERKUNCI[cite: 2]
  │
  └── KASUS B: Klien Memilih [ACC DUMMY][cite: 2]
        ├── dummy_status berubah menjadi 'ACC'[cite: 2]
        └── Kunci gerbang pabrik terbuka: CS dapat melanjutkan ke pengajuan MoU[cite: 2]

```

---

### Flow 4: Gerbang Validasi Pelunasan DP Legal & Regulasi

```
[Tim Legal Membuka SCR-12 Legal Gatekeeper untuk Berkas MOU-XXXX][cite: 2]
  │
  ▼
[Sistem Mengevaluasi Status Kepemilikan Izin]:[cite: 2]
  │
  ├── JIKA clients.is_white_label = TRUE:[cite: 2]
  │     └── Alur Uji SIG, Pendaftaran BPOM mandiri, dan HKI OTOMATIS DI-BYPASS[cite: 2]
  │         Status: 'NOT_APPLICABLE'. Hanya validasi sertifikat Halal/Izin edar pabrik[cite: 2].
  │
  └── JIKA clients.is_white_label = FALSE (Pendaftaran Mandiri Klien):[cite: 2]
        │
        ▼
  [Sistem Mengevaluasi production_mou.is_dp_cleared]:[cite: 2]
        │
        ├── JIKA is_dp_cleared == 0 (DP Belum Diverifikasi Finance):[cite: 2]
        │     ├── Seluruh form input nomor SIG, BPOM, dan Halal DIKUNCI MATI (Disabled)[cite: 2]
        │     └── Banner Merah: "Terkunci: Dilarang Mendaftar ke Portal Pemerintah Sebelum DP Lunas!"[cite: 2]
        │
        └── JIKA is_dp_cleared == 1 (Finance Telah Verifikasi DP):[cite: 2]
              ├── Kunci form terbuka[cite: 2]
              ├── Legal Officer menginput nomor uji gizi SIG, nomor notifikasi BPOM NA/MD, & sertifikat Halal[cite: 2]
              └── Status berkas berubah menjadi FULLY_COMPLIANT[cite: 2]

```

---

### Flow 5: Perjalanan Klien via Tautan Web Sekali Pakai (One-Time Token Gateway)

```
[Klien Menerima Pesan WhatsApp Berisi Tautan: https://app.maklon.com/approval/{token_hash}][cite: 2]
  │
  ▼
[Klien Membuka Link di Browser Ponsel (SCR-14)][cite: 2]
  │
  ▼
[Sistem Memvalidasi Token Secara Real-time]:[cite: 2]
  │
  ├── 1. Apakah is_used == 1?[cite: 2]
  │     └── [YA]: Tampilkan Layar Peringatan: "Tautan persetujuan ini sudah pernah digunakan."[cite: 2]
  │
  ├── 2. Apakah NOW() > expires_at (TTL Habis)?[cite: 2]
  │     └── [YA]: Tampilkan Layar Kedaluwarsa: "Tautan telah kedaluwarsa. Hubungi CS Anda."[cite: 2]
  │
  └── [VALID]: Tampilkan Halaman Persetujuan Spesifikasi Produk[cite: 2]
        ├── Foto Mockup Kemasan Terkompresi[cite: 2]
        ├── Ringkasan Formula: Nama BPOM, Klaim, Aroma, Tekstur[cite: 2]
        │
        ▼
  [Klien Memilih Respons]:[cite: 2]
        │
        ├── OPSI A: Klik [SETUJUI (ACC)][cite: 2]
        │     ├── Dialog konfirmasi modal: "Yakin menyetujui formula ini?"
        │     └── Submit -> Token ditandai is_used = 1, status tiket = ACC[cite: 2]
        │
        └── OPSI B: Klik [MINTA REVISI / TOLAK][cite: 2]
              ├── Field "Catatan Revisi Klien" wajib diisi minimal 15 karakter[cite: 2]
              └── Submit -> Token ditandai is_used = 1, tiket kembali ke revisi[cite: 2]
  │
  ▼
[Layar Sukses]: "Terima kasih, konfirmasi Anda telah tercatat langsung di sistem MaklonOS."[cite: 2]
  │
  └── Notifikasi instan terkirim ke Grup Telegram CS & Divisi Terkait[cite: 2]

```

---

## 6. Layout per Screen

### SCR-08: RnD Laboratory Workbench (Desktop / Tablet Cleanroom)

```
+--------------------------------------------------------------------------------------------------------------------------+
| MaklonOS Lab | Antrean Sampel: [ 5 Menunggu ] [ 2 Sedang Diracik ]    | Mode: [ SQLite Bersih / Offline Siap ] | Dimas (RnD)  |
+--------------+--------------------------------------------------------+----------------------------------------+--------------+
| TIKET AKTIF  | DETAIL PERACIKAN SAMPEL #SMP-2026-089                                              Status: [ IN_LAB_RND ] |
|--------------|-----------------------------------------------------------------------------------------------------------|
| > SMP-089    | Klien: PT Cantik Jelita Utama   | Target BPOM: Sunscreen Niacinamide Gel SPF 50   | Deadline: 25 Sep 2026 |
|   PT Cantik  |-----------------------------------------------------------------------------------------------------------|
|   (H-2)      | [1] KLASIFIKASI RACIKAN                                                                                   |
|              |     Jenis Formula : (*) Formula Baru (New Product)    ( ) Formula Eksisting (Perpustakaan)                |
|   SMP-090    |     Basis Formula : [ FOR-LIB-GEL-04 - Gel Water Burst V2                              v ]                |
|   CV Berkah  |-----------------------------------------------------------------------------------------------------------|
|   (H-4)      | [2] KONFIRMASI KELAYAKAN MESIN PABRIK (FEASIBILITY GATE)                                                  |
|              |     Keputusan Mesin Pabrik: [ (o) ACC KELAYAKAN PABRIK ]      [ ( ) TOLAK SPESIFIKASI ]                   |
|   SMP-092    |     Catatan Kapasitas Mesin: "Viskositas aman untuk nozel mesin filling otomatis line B."                 |
|   Amanda     |-----------------------------------------------------------------------------------------------------------|
|   (Revisi-2) | [3] IDENTITAS FORMULA & SPESIFIKASI FISIK LAB                                                             |
|   [Lunas]    |     Kode Formula Unik : [ FOR-2026-SKN-0089-A        ]  (Terverifikasi Unik)                              |
|              |     Lead Time Racik   : [ 4 ] Hari Kerja                                                                  |
|              |     Warna Fisik       : [ Sedikit kekuningan transparan   ]     Aroma: [ Citrus Light 0.05% ]             |
|              |     Tekstur           : [ Water-burst cooling effect      ]     pH   : [ 5.5 - 6.0          ]             |
|              |-----------------------------------------------------------------------------------------------------------|
|              | [4] PRODUCT KNOWLEDGE SUMMARY (Wajib untuk CS & Klien)                                                    |
|              |     +-----------------------------------------------------------------------------------------------+     |
|              |     | Serum tabir surya berbahan dasar air. Mengandung Niacinamide 4% untuk mencerahkan tanpa rasa |     |
|              |     | lengket. Cocok untuk iklim tropis. Stabilitas suhu ruang teruji pada 40C selama 48 jam.       |     |
|              |     +-----------------------------------------------------------------------------------------------+     |
|              |                                                                                                           |
|              | [ BATALKAN ]                                     [ SIMPAN DRAF LOKAL ]   [ RACIKAN SELESAI (KIRIM CS) -> ]|
+--------------------------------------------------------------------------------------------------------------------------+

```

* **Hierarki Layout:**
1. **Split-Screen Panel:** Kiri ($280\text{ px}$) antrean tiket terurut prioritas deadline; Kanan ruang formulasi aktif.


2. **Feasibility Gate Section:** Pilihan tegas radio button *Acc/Tolak* bersama pabrik yang diletakkan di atas sebelum input fisik agar tidak membuang waktu lab jika mesin menolak.


3. **Product Knowledge Editor:** Textbox terstruktur agar tim CS memiliki amunisi edukasi klien yang akurat.




* **Primary Action:** `[ RACIKAN SELESAI (KIRIM CS) -> ]` (Cyan Button) yang memicu penerbitan status kirim dan notifikasi Telegram.



---

### SCR-09: Finance Dynamic Pricing Engine & Margin Calculator

```
+--------------------------------------------------------------------------------------------------------------------------+
| KALKULATOR PRICING & HPP DINAMIS - MAKLONOS FINANCE                                                         [X Tutup]     |
+--------------------------------------------------------------------------------------------------------------------------+
| Klien: PT Cantik Jelita Utama   | Formula: FOR-2026-SKN-0089-A | Batch Ukuran Rencana: 5.000 Pcs                         |
+--------------------------------------------------------------------------------------------------------------------------+
| KOMPONEN BIAYA SATUAN (PER PCS)                                                                                          |
| 1. Biaya Bahan Baku Racikan RnD (Base HPP)     : Rp [ 11.250,00     ] / pcs                                              |
| 2. Biaya Komponen Kemasan (Botol, Segel, Box)  : Rp [  4.500,00     ] / pcs                                              |
| 3. Biaya Overhead & Tenaga Kerja Produksi      : Rp [  1.750,00     ] / pcs                                              |
|                                                  ----------------------- (+)                                             |
|    SUBTOTAL TOTAL HPP PRODUKSI                 : Rp   17.500,00 / pcs                                                    |
+--------------------------------------------------------------------------------------------------------------------------+
| PENETAPAN MARGIN KEUNTUNGAN                                                                                              |
| Target Margin Perusahaan (%)                   : [ 35.00 ] %       (Ambang Batas Minimum: 30.00%)                        |
| Nominal Margin Keuntungan Bersih               : Rp    6.125,00 / pcs                                                    |
+--------------------------------------------------------------------------------------------------------------------------+
| KALKULASI HARGA JUAL SATUAN FINAL (KONTRAK MOU)                                                                          |
| +----------------------------------------------------------------------------------------------------------------------+ |
| |                                                                                                                      | |
| |   HARGA JUAL FINAL PER UNIT :  Rp 23.625,00  / pcs                                                                   | |
| |   ESTIMASI TOTAL NILAI MOU  :  Rp 118.125.000,00 (Untuk 5.000 Pcs)                                                   | |
| |   KEBUTUHAN DP 50%          :  Rp  59.062.500,00 (Syarat Mulai Legalitas & Pabrik)                                   | |
| |                                                                                                                      | |
| +----------------------------------------------------------------------------------------------------------------------+ |
| [x] Kunci kalkulasi harga ini secara permanen untuk penerbitan dokumen MoU resmi.                                         |
+--------------------------------------------------------------------------------------------------------------------------+
| [ Riwayat Perubahan Biaya ]                                  [ Batal ]   [ SIMPAN & KUNCI HARGA FINAL DRAF MOU -> ]      |
+--------------------------------------------------------------------------------------------------------------------------+

```

* **Hierarki Layout:**
* Komponen dialog modal kalkulasi luas ($720\text{ px}$).
* Input numerik monospasial terstruktur rapi ke bawah.


* Banner kalkulasi harga unit final yang sangat kontras dengan latar belakang hijau emerald muda (`#ECFDF5`).




* **Logika Perhitungan Terintegrasi:**

$$\text{Total HPP} = 11.250 + 4.500 + 1.750 = 17.500$$



$$\text{final\_unit\_price} = 17.500 \times \left(1 + \frac{35}{100}\right) = 23.625$$



* **Primary Action:** `[ SIMPAN & KUNCI HARGA FINAL DRAF MOU -> ]`.



---

### SCR-12: Strict Legal Compliance Gatekeeper

```
+--------------------------------------------------------------------------------------------------------------------------+
| MAKLONOS REGULATORY & LEGAL GATEKEEPER                                                     MOU: MOU-20260922-0004         |
+--------------------------------------------------------------------------------------------------------------------------+
| Profil: PT Cantik Jelita Utama | Skema: [ REGULASI PENUH (BPOM MANDIRI) ] | Legal Officer: Siti Rahma                    |
+--------------------------------------------------------------------------------------------------------------------------+
| (!) STATUS GERBANG PELUNASAN DP LEGAL & PRODUKSI:                                                                        |
| +----------------------------------------------------------------------------------------------------------------------+ |
| | [TERVERIFIKASI LUNAS] DP Sebesar Rp 59.062.500,- Diverifikasi oleh Finance pada 22/09/2026. (is_dp_cleared = 1)     | |
| | Gerbang regulasi terbuka. Pendaftaran dokumen uji dan perizinan resmi diizinkan.                                    | |
| +----------------------------------------------------------------------------------------------------------------------+ |
|                                                                                                                          |
| [1] UJI GIZI & STABILITAS LABORATORIUM SIG                                                                               |
|     Status Uji SIG        : [ ( ) MENUNGGU HASIL ]    [ (o) LULUS (PASSED) ]    [ ( ) GAGAL ]                            |
|     Nomor Laporan SIG     : [ SIG.MARK.LAB.2026.09881               ]  Tanggal Uji: [ 20/09/2026 ]                       |
|                                                                                                                          |
| [2] REGISTRASI IZIN EDAR BADAN POM (BPOM)                                                                                |
|     Jenis Pendaftaran     : [ BPOM NA (Kosmetik) v ]                                                                     |
|     Nomor Registrasi BPOM : [ NA182601004921                        ]  (Format Valid: NA + 11 Digit)                     |
|     Tanggal Terbit Izin   : [ 22/09/2026 ]  Masa Berlaku: [ 5 Tahun ]                                                    |
|                                                                                                                          |
| [3] KEPATUHAN SERTIFIKASI HALAL & HKI MEREK                                                                             |
|     Sertifikat Halal (ID) : [ ID32110000299100224                   ]                                                    |
|     Nomor Agenda HKI      : [ IPT202609110024                       ]  Kelas Merek: [ 03 - Kosmetik ]                    |
|                                                                                                                          |
| [ Buka Berkas PDF Bukti ]                                           [ Simpan Draf ]   [ TERBITKAN KEPATUHAN LEGAL (ACC) ]|
+--------------------------------------------------------------------------------------------------------------------------+

```

* **Hierarki Layout:**
* Bagian atas didominasi status banner gerbang DP. Jika `is_dp_cleared = 0`, seluruh elemen isian di bawahnya diblokir (*disabled greyed out*) dan ditutup overlay gembok.


* Tiga seksi form berurutan secara kronologis hukum: Lab SIG $\rightarrow$ BPOM $\rightarrow$ Halal & HKI.




* **Primary Action:** `[ TERBITKAN KEPATUHAN LEGAL (ACC) ]` (Violet Button `#4F46E5`).



---

### SCR-14: Client One-Time Token Approval Web Portal (Mobile Web)

```
+-------------------------------------------------------+
|  https://app.maklon.com/approval/a9f8e21c9...      (x)|
+-------------------------------------------------------+
|                 [ LOGO PABRIK MAKLON ]                |
|               LEMBAR PERSETUJUAN KLIEN                |
+-------------------------------------------------------+
| Halo, PT Cantik Jelita Utama                          |
| Mohon tinjau sampel formula fisik yang telah Anda     |
| terima sebelum kami melanjutkan ke pendaftaran izin.  |
+-------------------------------------------------------+
| INFORMASI FORMULA                                     |
| Produk     : Sunscreen Niacinamide Gel SPF 50         |
| Kode Sampel: FOR-2026-SKN-0089-A                      |
| Masa Berlaku Tautan: Berakhir dlm 48 Jam (24/09/2026) |
+-------------------------------------------------------+
| FOTO MOCKUP KEMASAN                                   |
| +---------------------------------------------------+ |
| |                                                   | |
| |             [ GAMBAR MOCKUP KEMASAN ]             | |
| |              (Botol Pump 30ml - WebP)             | |
| |                                                   | |
| +---------------------------------------------------+ |
| Karakteristik: Water-burst, aroma citrus segar.       |
+-------------------------------------------------------+
| RESPON PERSETUJUAN ANDA                               |
|                                                       |
|  (o) SAYA SETUJU (ACC FORMULA & MOCKUP)               |
|      Lanjutkan ke pembuatan kontrak MOU produksi.     |
|                                                       |
|  ( ) SAYA INGIN REVISI                                |
|      Catatan Revisi Anda (Wajib diisi):               |
|      +----------------------------------------------+ |
|      | [ Tekstur sudah oke, tapi aroma minta      ] | |
|      | [ sedikit dikurangi agar tidak menyengat.  ] | |
|      +----------------------------------------------+ |
|                                                       |
| +---------------------------------------------------+ |
| |          KIRIM KEPUTUSAN SAYA SEKARANG            | |
| +---------------------------------------------------+ |
| (!) Tautan ini sekali pakai. Keputusan tidak dapat    |
| diubah setelah tombol kirim ditekan.                  |
+-------------------------------------------------------+

```

* **Hierarki Layout Mobile:**
* Desain satu kolom ramping dengan batasan lebar container maksimal $480\text{ px}$ di tengah layar smartphone.


* Elemen visual foto mockup kemasan yang dapat diperbesar (*tap-to-expand*).


* Pilihan keputusan tegas radio selection berukuran tap besar ($48\text{ px}$ height).




* **Primary Action:** Tombol besar sticky-bottom Cyan `KIRIM KEPUTUSAN SAYA SEKARANG`.



---

## 7. Component Library (Phase 2 Additions)

### 7.1. Component: `GateLockBanner`

* **Tujuan:** Menampilkan visual proteksi pemblokiran alur akibat business gates yang belum terpenuhi.


* **Variants:**
* `locked-financial`: Background `#FEF2F2`, Border `#F87171`, Teks `#991B1B`. Ikon Gembok Merah. Pesan: Menunggu verifikasi DP Finance.


* `locked-dummy`: Background `#FFFBEB`, Border `#FBBF24`, Teks `#92400E`. Ikon Jam Pasir. Pesan: MoU ditahan sampai approval dummy klien terbit.


* `locked-revision-fee`: Background `#FEF2F2`, Border `#F87171`, Teks `#991B1B`. Pesan: Lab RnD terkunci sampai tarif kustom revisi dilunasi.


* `unlocked-cleared`: Background `#ECFDF5`, Border `#34D399`, Teks `#065F46`. Ikon Centang Ganda Hijau. Pesan: Gerbang lolos validasi.





### 7.2. Component: `DynamicCostInputRow`

* **Tujuan:** Komponen input baris kalkulator HPP dengan format rupiah otomatis, sinkronisasi state instan, dan label deskriptif.


* **Properties:** `label`, `value`, `prefix = "Rp"`, `readOnly`, `onChange`.
* **State Behavior:** Setiap kali nilai diketik, emit event kalkulasi ke container kalkulator tanpa perlu klik tombol submit.



### 7.3. Component: `FormulaFeasibilityToggle`

* **Tujuan:** Memilih persetujuan atau penolakan mesin pabrik pada workbench RnD.


* **Variants:**
* State `ACC`: Tombol hijau menyala dengan teks *"Pabrik Mampu Memproduksi"*.
* State `TOLAK`: Tombol merah menyala dengan teks *"Pabrik Mengalami Kendala Mesin"*. Menampilkan textarea wajib: *"Alasan Kegagalan Viskositas/Mesin"*.





### 7.4. Component: `OneTimeApprovalCard`

* **Tujuan:** Wadah interaktif publik klien eksternal untuk menyatakan persetujuan formulasi atau dummy.


* **Properties:** `productName`, `formulaCode`, `mockupUrl`, `expiresAt`, `onSubmitDecision`.


* **Micro-interaction:** Memilih radio button "REVISI" otomatis memicu animasi *slide-down* textarea input catatan revisi klien.



### 7.5. Component: `ProofAuditViewer`

* **Tujuan:** Menampilkan bukti bayar transfer mutasi yang telah dikompresi $\le 300\text{ KB}$ `.webp` berdampingan dengan form verifikasi Finance.


* **Features:** Zoom in/out digital, tombol unduh file, dan indikator status verifikasi lunas.



---

## 8. State UI untuk Screen Kunci

### SCR-08: RnD Laboratory Workbench

* **Empty State:** Tidak ada tiket peracikan baru di antrean. Ilustrasi tabung erlenmeyer bersih dengan label: *"Semua formula sampel telah selesai diracik. Kerja bagus!"*
* **Loading State:** Shimmering skeleton pada list tiket kiri dan panel form kanan ($<100\text{ ms}$ SQLite read).


* **Offline Cleanroom State:** Badge indigo di pojok kanan: *"Mode Lab Bersih (Offline) — Data racikan tersimpan di SQLite lokal dan akan sinkron otomatis ke Turso begitu tablet terhubung ke Wi-Fi kantor."*

* **Failure State (Formula Ditolak Pabrik):** Alert merah pekat: *"Formula ditandai TOLAK MESIN. Tiket telah dialihkan kembali ke meja CS Rina beserta catatan kendala teknis."*


### SCR-12: Strict Legal Compliance Gatekeeper

* **Locked State (`is_dp_cleared = 0`):** Seluruh form terkunci total. Terdapat overlay transparan dengan watermark gembok besar dan tombol aksi: `[ Minta Finance Cek Mutasi DP ]`.


* **White-Label Bypass State (`is_white_label = 1`):** Form SIG dan BPOM digantikan oleh kartu informasi abu-abu: *"Produk terdaftar sebagai White Label. Izin edar menggunakan sertifikat BPOM induk pabrik (NA18230109982). Pendaftaran mandiri dilewati."*


### SCR-14: One-Time Token Approval Web Portal

* **Token Expired State:** Halaman putih bersih, ikon jam pasir redup: *"Masa Berlaku Tautan Persetujuan Telah Berakhir. Demi kepastian harga dan ketersediaan formula, silakan hubungi CS Anda via tombol WhatsApp di bawah untuk menerbitkan tautan baru."*

* **Token Already Used State:** Ikon centang hijau: *"Tautan Ini Telah Digunakan. Keputusan Anda pada sampel ini telah tersimpan di sistem kami pada 22/09/2026 pukul 14:15 WIB."*

* **Success Submitted State:** Animasi centang sukses: *"Terima kasih! Keputusan Anda berhasil dicatat. Tim kami sedang menyiapkan berkas produksi selanjutnya."*


---

## 9. Responsive Behaviour

```
+------------------------------------------------------------------------------------------+
| RESPONSIVE BREAKDOWN TAHAP 2                                                             |
+------------------------------------------------------------------------------------------+
| Desktop (>= 1200px) : Multi-column workbench (RnD, Finance, Legal, Desain)[cite: 2]     |
| Tablet  (768-1199px): Single-column scroll, sticky action bar (RnD Lab Tablet)[cite: 2]  |
| Mobile  (< 768px)   : Single-card view, bottom sticky submit (Client Approval Gateway)[cite: 2]|
+------------------------------------------------------------------------------------------+

```

### 9.1. Desktop ($> 1200\text{ px}$) — Default Lingkungan Back-Office

* **RnD Workbench:** Tampilan 2 kolom (Kiri $300\text{ px}$ daftar tiket antrian sampel, Kanan formulir racikan penuh).


* **Finance Pricing:** Layout berdampingan: Kiri rincian HPP, Kanan preview kalkulasi invoice MoU secara real-time.


* **Desain & Proof Viewer:** Split panel antara gambar bukti bayar / mockup visual dengan metadata status approval.



### 9.2. Tablet ($768\text{ px} - 1199\text{ px}$) — Tablet Formulator Lab (Dimas)

* Antrean tiket sampel diubah menjadi *dropdown selector* di header untuk menghemat ruang layar.


* Form racikan lab dirender dalam 1 kolom vertikal penuh dengan ukuran tombol sentuh minimum $44\text{ px}$ agar mudah ditekan formulator yang mengenakan sarung tangan latex laboratorium.



### 9.3. Mobile ($< 768\text{ px}$) — Lingkungan Klien Eksternal (SCR-14)

* Mengabaikan sidebar dan global navigation bar internal.


* Menampilkan antarmuka kartu terpusat dengan padding samping $16\text{ px}$.


* Gambar mockup kemasan dioptimalkan untuk orientasi vertikal ponsel.


* Tombol submit keputusan klien (`ACC` / `REVISI`) mengambang secara permanen di bagian bawah layar (*fixed bottom container* dengan *safe-area inset*).



---

## 10. Accessibility (A11y) & Usability Standards

### 10.1. Contrast Ratios (WCAG 2.1 AA Compliance)

* Teks nominal HPP & Margin (`#065F46`) di atas background hijau kalkulator (`#ECFDF5`): Rasio kontras **7.1:1** (Lolos WCAG AAA).
* Banner peringatan gate terkunci (`#991B1B` di atas `#FEF2F2`): Rasio kontras **8.4:1**.


* Teks tombol persetujuan mobile klien (`#FFFFFF` di atas `#0E7490`): Rasio kontras **5.2:1**.



### 10.2. Focus Order & Keyboard Navigation

* **Finance Pricing Speed Entry (SCR-09):** Urutan navigasi tombol `Tab` dirancang berurutan tanpa jeda:

$$\text{Base HPP} \rightarrow \text{Packaging} \rightarrow \text{Overhead} \rightarrow \text{Margin \%} \rightarrow \text{Enter (Simpan)}$$




Tombol `Enter` pada input terakhir langsung memicu konfirmasi penyimpanan tanpa perlu menyentuh mouse.
* **Lab Hotkeys (SCR-08):**
* `Alt + A`: Set toggle kelayakan ke *ACC Kelayakan Pabrik*.


* `Alt + T`: Set toggle kelayakan ke *Tolak Spesifikasi* dan fokus ke catatan penolakan.





### 10.3. Kebutuhan ARIA & Screen Reader

* Input kalkulasi dinamis menggunakan `aria-live="polite"` pada wadah total harga, sehingga setiap perubahan angka HPP dibacakan pembaruannya oleh pembaca layar:
```html
<div role="region" aria-live="polite" aria-label="Hasil Kalkulasi Harga Final">
  Harga Jual Satuan Final: Rp 23.625,00
</div>

```


* Tombol yang terkunci oleh gerbang bisnis (*Gate Lock*) tidak boleh hanya memakai atribut HTML `disabled`, melainkan dipadukan dengan `aria-disabled="true"` beserta deskripsi `aria-describedby` ke ID pesan gate:
```html
<button aria-disabled="true" aria-describedby="legal-lock-notice" class="cursor-not-allowed ...">
  Submit Registrasi BPOM
</button>
<p id="legal-lock-notice" class="sr-only">
  Tombol terkunci karena pembayaran DP Legal dan Produksi belum diverifikasi Finance.
</p>

```


* Halaman approval klien (SCR-14) menyertakan `role="form"` dengan validasi error langsung yang terhubung melalui `aria-errormessage` pada kotak teks catatan revisi.



---

Design Brief MaklonOS Tahap 2 ini menetapkan pedoman desain antarmuka, arsitektur tata letak, dan penguncian sistem bisnis antar-divisi. Seluruh implementasi komponen UI di Next.js dan Tauri v2 dapat langsung dieksekusi dengan jaminan integritas data dan ketiadaan celah bypass operasional.