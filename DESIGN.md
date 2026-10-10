Berikut adalah **Design Brief & Arsitektur Desain UI/UX Lengkap** untuk **MaklonOS Tahap 1 (MVP CS/CRM Core Engine & Local-First Infrastructure)**. Dokumen ini menjadi acuan mutlak tim desain dan engineering sebelum implementasi kode dimulai.

---

# DESIGN BRIEF: MAKLONOS TAHAP 1 (CS/CRM CORE)

---

## 1. Design Principles

Tiga aturan desain yang wajib dipatuhi di seluruh antarmuka MaklonOS:

### Prinsip 1: High-Density Ergonomics (Kepadatan Informasi Maksimal Tanpa Mengorbankan Keterbacaan)

* **Konteks:** Tim CS menangani puluhan *chat* WhatsApp, prospek masuk, dan permohonan sampel secara paralel. UI MaklonOS bukan *marketing landing page* yang membutuhkan *whitespace* berlebih.


* **Aturan Desain:**
* Gunakan tata letak berkepadatan tinggi (*compact density*): tinggi baris tabel standar $36\text{ px} - 40\text{ px}$, ukuran font data $12\text{ px} - 13\text{ px}$.
* Semua data kunci (nama prospek, nomor WhatsApp, status segmen, limit revisi, PIC CS) harus terlihat *above-the-fold* tanpa memerlukan horizontal scroll pada resolusi $1366 \times 768$ (standar laptop operasional kantor).


* Dilarang menyembunyikan aksi berulang (seperti *Log Follow-up* atau *Tambah Sampel*) di balik *meatball menu* (tiga titik). Aksi utama wajib satu klik atau melalui pintasan keyboard (*keyboard shortcut*).



### Prinsip 2: Deterministic Business-Gate Visibility (Transparansi Kondisi Gerbang Bisnis)

* **Konteks:** Sistem maklon memiliki batasan bisnis ketat (*Business Gates*), seperti *Single Active Session*, kuota revisi gratis vs berbayar, dan syarat kelulusan dokumen.


* **Aturan Desain:**
* Tombol aksi yang terkunci oleh sistem tidak boleh sekadar disabled tanpa konteks. UI wajib menampilkan status visual deterministik: mengapa aksi terkunci, siapa yang berwenang membuka (*misal: "Terkunci: Kuota Revisi Habis — Menunggu Penetapan Tarif Finance"*), dan tag status terkait.


* Indikator status waktu (seperti status *Cold Lead* $>7$ hari) harus menggunakan warna penanda eksplisit dan penghitung hari yang jelas, bukan sekadar timestamp pasif.





### Prinsip 3: Zero-Latency Local-First Feedback (Transparansi Sinkronisasi & Integritas Offline)

* **Konteks:** Menggunakan SQLite lokal di dalam Tauri v2 yang tersinkronisasi ke Turso. Aplikasi harus beroperasi instan tanpa jeda jaringan (*zero network roundtrip lag*).


* **Aturan Desain:**
* Setiap aksi input data (entri lead, kompresi gambar, catatan follow-up) wajib menerapkan *Optimistic UI*: data langsung muncul di layar dalam $0\text{ ms}$.
* Indikator status persistensi wajib selalu terlihat: `Tersimpan Lokal` (SQLite), `Menyinkronkan...`, atau `Tersinkronisasi Cloud` (Turso).
* Jika koneksi terputus, UI tidak boleh memunculkan *blocking alert* yang menghentikan kerja CS, melainkan memberikan lencana status *Offline Outbox* dengan hitungan antrean data tertunda.



---

## 2. Visual Direction

### Mood & Karakter

* **Industrial Cockpit & Clinical Precision:** Nuansa perangkat lunak operasional industri manufaktur modern, steril, presisi, dan dapat diandalkan. Menggabungkan efisiensi sistem *terminal-grade* dengan kejelasan antarmuka modern.
* **Fokus Fungsional:** Mengutamakan hierarki kontras tajam, teks monospasial untuk kode identifikasi, serta penggunaan warna hanya untuk menyampaikan arti semantik data.



### Referensi Visual

* **Linear.app & GitHub Desktop:** Struktur layout panel, navigasi cepat berbasis keyboard, borders $1\text{ px}$ halus, dan *command palette*.
* **Retool / Bloomberg Terminal (Modernized):** Pemanfaatan ruang data yang padat, tabel informasi multi-atribut, dan *data grid* yang stabil.

### Anti-Patterns (Apa yang Dihindari)

* **Dilarang:** Gradient warna-warni dekoratif, efek *glassmorphism* (*backdrop-blur* berat), dan animasi transisi yang lambat ($>150\text{ ms}$).
* **Dilarang:** Komponen UI berbentuk *pill/capsule* bulat besar ($>24\text{ px}$ radius) yang membuang ruang horizontal pada tabel data.
* **Dilarang:** Modal bertumpuk (*modal inside modal*). Form yang panjang wajib dialihkan ke *Side Slide-over Drawer* agar konteks tabel di latar belakang tetap terlihat.
* **Dilarang:** Teks abu-abu terang rendah kontras (seperti `#94A3B8` di atas background putih) yang melelahkan mata operator CS saat bekerja dalam durasi panjang.

---

## 3. Design Tokens

### 3.1. Color Palette (Strict Hex Codes & Semantic Roles)

| Token Name | Hex Code | Deskripsi & Rasional Penggunaan |
| --- | --- | --- |
| **Brand Primary (Cyan Industrial)** |  |  |
| `color-primary-900` | `#083344` | Header sidebar, state navigasi teratas. |
| `color-primary-800` | `#155E75` | Active state item sidebar, border fokus form. |
| `color-primary-700` | `#0E7490` | **Primary Brand Color.** Aksi utama (Tombol CTA, ikon navigasi utama). Menghadirkan kesan klinis manufaktur/farmasi/kosmetik terpercaya. |
| `color-primary-600` | `#0891B2` | Hover state tombol CTA utama. |
| `color-primary-100` | `#CFFAFE` | Background seleksi baris tabel. |
| `color-primary-50` | `#ECFEFF` | Background badge informasi aktif. |
| **Neutral & Surface (Deep Slate)** |  | Rasional: Memiliki undertone biru dingin yang menyatu dengan primary cyan, mencegah kelelahan mata dibanding monochrome murni. |
| `color-surface-bg` | `#F8FAFC` | Background aplikasi (Slate-50). |
| `color-surface-card` | `#FFFFFF` | Background panel, card, modal, drawer. |
| `color-border-subtle` | `#E2E8F0` | Garis batas antar baris tabel, separator (Slate-200). |
| `color-border-strong` | `#CBD5E1` | Border input form, batas panel utama (Slate-300). |
| `color-text-main` | `#0F172A` | Teks judul, nilai data utama (Slate-900). Kontras 14.5:1 terhadap putih. |
| `color-text-muted` | `#475569` | Label form, deskripsi sekunder (Slate-600). Kontras 5.8:1 terhadap putih. |
| `color-text-placeholder` | `#64748B` | Placeholder form, ikon nonaktif (Slate-500). Kontras 4.6:1 (WCAG AA). |
| **Status Semantik (Aturan Bisnis MaklonOS)** |  |  |
| `color-status-hot-bg` | `#ECFDF5` | Background badge `HOT LEAD` ($\le 3$ hari) & revisi gratis.

 |
| `color-status-hot-text` | `#065F46` | Teks lencana `HOT LEAD` (Emerald-800). |
| `color-status-warm-bg` | `#FFFBEB` | Background badge `WARM LEAD` ($4-7$ hari).

 |
| `color-status-warm-text` | `#92400E` | Teks lencana `WARM LEAD` (Amber-800). |
| `color-status-cold-bg` | `#FFF1F2` | Background badge `COLD LEAD` ($>7$ hari) & biaya revisi.

 |
| `color-status-cold-text` | `#9F1239` | Teks lencana `COLD LEAD` (Rose-800). |
| `color-status-offline` | `#6366F1` | Indikator mode SQLite Lokal / Pending Sync (Indigo-600). |

### 3.2. Typography Scale

* **Primary Font Family:** `Plus Jakarta Sans`, sans-serif.
* *Rasional:* Font modern karya desainer tipe Indonesia (Tokotype), memiliki *x-height* proporsional untuk teks kecil, serta rendering yang tajam pada mesin Windows DirectWrite (Tauri v2 Desktop) tanpa distorsi vertikal.


* **Monospace Font Family:** `JetBrains Mono`, monospace.
* *Rasional:* Digunakan khusus untuk `kode_klien` (`KLN-YYYYMMDD-XXXX`), nomor telepon WhatsApp, nilai nominal uang, dan counter revisi. Karakter pembeda angka nol bergaris (`0`), huruf `O`, angka satu (`1`), dan huruf `l` mencegah salah baca data identitas klien.





| Token | Size | Line Height | Weight | Penerapan Komponen |
| --- | --- | --- | --- | --- |
| `text-display` | 24px | 32px | Bold (700) | Angka KPI Dashboard Ringkasan. |
| `text-title-lg` | 18px | 24px | SemiBold (600) | Judul Screen / Panel Drawer. |
| `text-title-sm` | 15px | 20px | SemiBold (600) | Header Card, Section Profil Klien. |
| `text-body` | 13px | 18px | Regular (400) | Isi tabel, teks interaksi follow-up, nilai form. |
| `text-body-bold` | 13px | 18px | SemiBold (600) | Nama klien, primary data text. |
| `text-caption` | 11px | 16px | Medium (500) | Label metadata, timestamp, lencana badge status. |
| `text-code` | 12px | 16px | Regular (500) | `KLN-XXXX`, tag revisi, teks mono payload. |

### 3.3. Spacing Scale (4px Base Grid)

* `space-1`: 4px — Jarak internal elemen kecil (isi badge, icon-to-text).
* `space-2`: 8px — Spacing vertikal form group compact, gap antar badge.
* `space-3`: 12px — Padding cell tabel, padding horizontal input form.
* `space-4`: 16px — Padding container card, gap antar kolom input form.
* `space-5`: 20px — Padding header modal, batas antar section data.
* `space-6`: 24px — Padding ruang kerja utama layar desktop.

### 3.4. Radius Tokens (Sharp & Industrial)

* `radius-none`: 0px — Divider dan border tabel data.
* `radius-sm`: 3px — Badge status, tag filter, checkbox.
* `radius-md`: 6px — Input field, tombol aksi, card, side drawer.
* `radius-lg`: 8px — Dialog modal konfirmasi & alert force logout.

### 3.5. Elevation & Shadow

* `shadow-none`: `none` (Default untuk card pada surface `#F8FAFC`, dipertegas dengan border `1px solid #E2E8F0`).
* `shadow-sm`: `0 1px 2px 0 rgba(15, 23, 42, 0.05)` (Dropdown menu, autocomplete input).
* `shadow-drawer`: `-4px 0 16px 0 rgba(15, 23, 42, 0.08)` (Side Slide-Over Inspector Drawer).
* `shadow-modal`: `0 12px 32px -4px rgba(15, 23, 42, 0.20)` (Modal force-logout dan intake lead).

---

## 4. Screen Inventory (Phase 1 MVP)

| Screen ID | Nama Layar | Target Pengguna | Tujuan & Cakupan Fitur |
| --- | --- | --- | --- |
| **SCR-01** | **Authentication & Session Guard** | CS, CRM, Staf Back-Office | Login akun, pemantauan sesi aktif 60 detik, dan tampilan interupsi force-logout jika terjadi benturan sesi ganda.

 |
| **SCR-02** | **CS Central Workbench** | CS, Lead Handler | Layar beranda utama CS: Ringkasan metrik pipeline (Hot/Warm/Cold), tabel data leads dengan filter cepat, search box, dan quick action bar.

 |
| **SCR-03** | **Lead Intake & Client Registration Drawer** | CS | Form slide-over untuk registrasi lead baru tanpa meninggalkan workbench, otomatisasi kode `KLN-YYYYMMDD-XXXX`.

 |
| **SCR-04** | **Client 360 & Lead Inspector** | CS, CRM | Detail komprehensif profil klien: riwayat log interaksi, perubahan status segmentasi otomatis, riwayat tiket sampel, dan limit revisi.

 |
| **SCR-05** | **Sample Ticket Creation Modal** | CS | Form permintaan sampel formula baru/modifikasi, inspeksi batas revisi dinamis, dan kalkulasi otomatis routing tiket (RnD Queue vs Finance Queue).

 |
| **SCR-06** | **Media Compressor & Attachment Uploader** | CS, Finance | Komponen inspeksi upload foto: konversi canvas client-side ke `.webp`, pemotongan gambar (crop), dan penegakan batas $\le 300\text{ KB}$.

 |
| **SCR-07** | **System Sync & Offline Outbox Center** | CS, Staf, Admin | Status koneksi Turso cloud, riwayat sinkronisasi SQLite lokal, status bot Telegram divisi, dan log antrean transaksi lokal saat offline.

 |

---

## 5. User Flows

### Flow 1: Intake Lead Baru & Generasi Otomatis Kode Klien

```
[Mulai] 
  │
  ▼
[CS menekan tombol "Lead Baru" (atau tekan Cmd/Ctrl + N)]
  │
  ▼
[Side Drawer Terbuka]: Menampilkan Form Registrasi Lead
  │
  ├── CS menginput: Nama Klien, No. WhatsApp, Wilayah (Provinsi/Kota), Saluran Lead, Kategori Produk[cite: 1]
  │
  ▼
[Validasi Form Real-time]:
  ├── Cek keunikan Nomor WhatsApp di SQLite lokal
  │     ├── [Duplikat]: Tampilkan peringatan "Nomor sudah terdaftar pada KLN-XXX" -> Tawarkan buka profil
  │     └── [Unik]: Tombol "Simpan & Buat Lead" aktif
  │
  ▼
[CS Klik "Simpan & Buat Lead"]
  │
  ├── SQLite Lokal mengeksekusi trigger penerbitan kode: KLN-YYYYMMDD-XXXX[cite: 1]
  ├── Atur segment_status = 'HOT', last_activity_at = NOW()[cite: 1]
  ├── Atur clients.free_revision_limit = 1 (Default)[cite: 1]
  │
  ▼
[Optimistic UI]: Data langsung muncul di urutan teratas tabel Workbench (0ms)
  │
  ├── Worker background menyinkronkan data ke Turso Cloud[cite: 1]
  └── Bot Telegram memicu alert asynchronous ke Grup CS: "Lead Baru: KLN-XXXX..."[cite: 1]
  │
  ▼
[Selesai]

```

---

### Flow 2: Siklus Harian CS & Re-aktivasi Cold Lead (>7 Hari)

```
[Mulai: CS Membuka Workbench SCR-02]
  │
  ▼
[CS Mengklik Tab Filter "Cold Leads (>7 Hari)"][cite: 1]
  │
  ▼
[Tabel Menampilkan Daftar Prospek Pasif]:
  ├── Tiap baris diberi badge merah 'COLD' dan indikator "Pasif X hari"[cite: 1]
  │
  ▼
[CS Klik Tombol "Quick WhatsApp" / "Log Follow-up" pada Baris Lead]
  │
  ├── Muncul Popover Catatan Cepat
  ├── CS memilih template re-aktivasi / mencatat hasil follow-up
  │
  ▼
[CS Klik "Simpan Follow-up"]
  │
  ├── Sistem mereset last_activity_at = NOW()[cite: 1]
  ├── Segmentasi otomatis berpindah dari 'COLD' -> 'WARM' / 'HOT'[cite: 1]
  ├── total_followups bertambah +1[cite: 1]
  │
  ▼
[Baris Prospek otomatis berpindah dari tab Cold ke tab Active Pipeline]
  │
  ▼
[Selesai]

```

---

### Flow 3: Pembuatan Tiket Sampel & Evaluasi Gerbang Revisi Gratis

```
[Mulai: Dari Layar Client 360 SCR-04]
  │
  ▼
[CS Klik Tombol "Buat Tiket Sampel"]
  │
  ▼
[Modal SCR-05 Terbuka]:
  ├── Sistem memeriksa: clients.free_revision_limit vs sample_requests.revision_index[cite: 1]
  │
  ├── FORM DATA:
  │     ├── Jenis Formulasi: [Baru / Modifikasi Eksisting][cite: 1]
  │     ├── Nama Target BPOM, Klaim Manfaat, Target Kemasan, Target Budget[cite: 1]
  │     └── Spesifikasi Khusus (JSON): Tekstur, Aroma, Warna, Volume[cite: 1]
  │
  ▼
[Evaluasi Engine Revisi Dinamis]:
  │
  ├── KASUS A: revision_index <= free_revision_limit (Contoh: Revisi ke-0 atau 1)[cite: 1]
  │     ├── Tampilkan Info Banner Hijau: "Revisi Gratis (Kuota Tersedia)"[cite: 1]
  │     ├── Status Tiket Otomatis: RND_QUEUE_FREE[cite: 1]
  │     └── Aksi Simpan -> Tiket langsung diteruskan ke antrean RnD[cite: 1]
  │
  └── KASUS B: revision_index > free_revision_limit (Kuota Gratis Habis)[cite: 1]
        ├── Tampilkan Alert Banner Merah: "Kuota Revisi Gratis Habis. Dikenakan Biaya Tambahan."[cite: 1]
        ├── is_billable otomatis diset TRUE[cite: 1]
        ├── Status Tiket Otomatis: PENDING_FEE_ASSESSMENT[cite: 1]
        ├── Field RnD otomatis dikunci (Disabled)[cite: 1]
        └── Aksi Simpan -> Tiket dialihkan ke Antrean Finance & Notifikasi Telegram dikirim ke Divisi Finance[cite: 1]
  │
  ▼
[Selesai]

```

---

### Flow 4: Upload Bukti Bayar / Media dengan Kompresi WebP $\le 300\text{ KB}$

```
[Mulai]
  │
  ▼
[CS / Finance melakukan Drag & Drop gambar ke Dropzone Komponen SCR-06][cite: 1]
  │
  ▼
[Client-side Canvas Image Engine Memproses]:
  ├── 1. Periksa dimensi gambar. Jika sisi terpanjang > 1280px, resize skala proporsional ke 1280px[cite: 1].
  ├── 2. Konversi format buffer ke .webp dengan kualitas 75%[cite: 1].
  ├── 3. Evaluasi ukuran byte hasil kompresi[cite: 1].
  │
  ├── JIKA UKURAN <= 300 KB:
  │     ├── Tampilkan pratinjau thumbnail hijau
  │     ├── Tampilkan label: "Terkompresi: [Ukuran Asli] -> [Ukuran Akhir] .webp"
  │     └── Simpan blob ke folder SQLite lokal[cite: 1]
  │
  └── JIKA UKURAN TETAP > 300 KB:
        ├── Tolak berkas secara otomatis[cite: 1]
        ├── Munculkan Pesan Error: "Ukuran berkas melebihi 300 KB setelah kompresi."[cite: 1]
        └── Buka dialog Canvas Crop Tool interaktif: CS dipaksa memotong area yang tidak perlu[cite: 1]
  │
  ▼
[Selesai]

```

---

### Flow 5: Penegakan Single Active Session & Penanganan Konflik

```
[Aplikasi Berjalan di Komputer Desktop CS (Sesi A)]
  │
  ▼
[Heartbeat Worker berjalan otomatis setiap 60 detik]:[cite: 1]
  ├── Mengirim active_session_id lokal ke server Turso[cite: 1]
  │
  ├── JIKA active_session_id lokal == server:
  │     └── Status normal, lanjutkan operasional
  │
  └── JIKA CS login di HP Android (Sesi B diterbitkan oleh Turso):[cite: 1]
        ├── Server Turso memperbarui active_session_id baru[cite: 1]
        ├── Heartbeat Sesi A mendeteksi ketidakcocokan UUID[cite: 1]
        │
        ▼
[Eksekusi Force Logout Seketika]:[cite: 1]
  ├── 1. Hentikan seluruh request jaringan & sinkronisasi data aktif
  ├── 2. Amankan data lokal SQLite yang belum tersinkron ke tabel 'quarantine_queue'[cite: 1]
  ├── 3. Hapus session token autentikasi lokal
  └── 4. Munculkan Layar Penuh Modal Pemblokiran (SCR-01 Alert):
        "Sesi Anda Telah Berakhir. Akun Anda dibuka pada perangkat lain."[cite: 1]
        [Tombol: "Login Kembali di Perangkat Ini"]
  │
  ▼
[Selesai]

```

---

## 6. Layout per Screen

### SCR-01: Authentication & Session Guard Modal

```
+-----------------------------------------------------------------------------------------+
|                                    MAKLONOS - LOGIN                                     |
+-----------------------------------------------------------------------------------------+
|                                                                                         |
|                               +-------------------------------+                         |
|                               |       [LOGO] MaklonOS         |                         |
|                               |  Sistem Operasi Terpadu v1.0  |                         |
|                               +-------------------------------+                         |
|                               | Username                      |                         |
|                               | [ cs.rina                   ] |                         |
|                               | Password                      |                         |
|                               | [ ••••••••••••••••••        ] |                         |
|                               |                               |                         |
|                               | [x] Ingat di perangkat ini    |                         |
|                               |                               |                         |
|                               | [   MASUK KE SISTEM (Enter) ] |                         |
|                               +-------------------------------+                         |
|                               | (!) 1 Akun = 1 Sesi Aktif     |                         |
|                               | Login di sini akan memutus    |                         |
|                               | sesi di perangkat lain.       |                         |
|                               +-------------------------------+                         |
|                                                                                         |
+-----------------------------------------------------------------------------------------+

```

* **Hierarki:**
1. Box Login berada tepat di tengah layar (*Dead Center*).
2. Sub-label edukatif mengenai *Single Active Session Enforcement*.




* **Primary Action:** Tombol *Masuk ke Sistem* (Cyan 700, Full Width).
* **Overlay Force Logout State (SCR-01B):**
* Backdrop gelap pekat (`#0F172A`, opacity 85%) mengunci seluruh UI aplikasi.
* Kartu dialog peringatan merah: Ikon Gembok Terputus, Pesan: *"Sesi Anda dialihkan ke perangkat lain pada pukul 14:22 WIB."*

* Tombol aksi tunggal: *"Ambil Alih Sesi & Login Ulang"* (menerbitkan UUID sesi baru dan memutus perangkat lawan).





---

### SCR-02: CS Central Workbench (Unified Pipeline View)

```
+--------------------------------------------------------------------------------------------------------------------------+
| MaklonOS  |  [Q Cari Klien / No. WA / Kode... (Ctrl+K)]           | Sync: [OK Turso Cloud] | CS: Rina | [Keluar]         |
+-----------+-------------------------------------------------------+------------------------+-----------------------------+
| SIDEBAR   | WORKBENCH CUSTOMER SERVICE                                                                                  |
|-----------|-------------------------------------------------------------------------------------------------------------|
| [x] Leads | [ + LEAD BARU (Ctrl+N) ]  [ Filter Divisi v ]   [ Export CSV ]                                              |
| [ ] Sampel|                                                                                                             |
| [ ] Retensi| PIPELINE RINGKAS                                                                                           |
| [ ] Offline| +-----------------------+ +-----------------------+ +-----------------------+ +-----------------------------+ |
|           | | TOTAL PROSPEK AKTIF   | | HOT LEADS (<=3 HARI)  | | WARM LEADS (4-7 HARI) | | COLD LEADS (>7 HARI)        | |
|           | | 128 Klien             | | 42 Klien              | | 56 Klien              | | 30 Klien (! Butuh Tindakan) | |
|           | +-----------------------+ +-----------------------+ +-----------------------+ +-----------------------------+ |
|           |                                                                                                             |
|           | [ SEMUA LEADS (128) ]   [ HOT (42) ]   [ WARM (56) ]   [ COLD LEADS (30) ]   [ PERLU FORMULA (12) ]         |
|           |-------------------------------------------------------------------------------------------------------------|
|           | KODE KLIEN       | NAMA KLIEN       | WHATSAPP       | WILAYAH      | SEGMEN | REVISI | TERAKHIR KONTAK| AKSI   |
|           |------------------+------------------+----------------+--------------+--------+--------+----------------+--------|
|           | KLN-20260922-001 | PT Cantik Jelita | 081234567890   | Bandung, JB  | [HOT ] | 0 / 1  | 2 jam lalu     | [Log]  |
|           | KLN-20260921-042 | CV Berkah Herbal | 087788991122   | Surabaya, JT | [WARM] | 1 / 1  | 4 hari lalu    | [Log]  |
|           | KLN-20260914-012 | Amanda Skincare  | 081992233441   | Jakarta, DKI | [COLD] | 1 / 1  | 8 hari lalu (!) | [Log] |
|           |                  |                  |                |              |        |        |                |        |
|           |-------------------------------------------------------------------------------------------------------------|
|           | Menampilkan 1 - 10 dari 128 Leads                           [<< Halaman Pertama]  [< Prev]  [1] 2 3  [Next >]   |
+--------------------------------------------------------------------------------------------------------------------------+

```

* **Hierarki & Layout Section:**
1. **Top Global Bar:** Status identitas user aktif, indikator sinkronisasi Turso, global quick-search.


2. **Left Navigation Rail ($200\text{ px}$):** Menu terstruktur ramping untuk CS.
3. **Metric KPI Summary Ribbon:** 4 kartu metrik utama segmentasi waktu prospek.


4. **Segmented Filter Tabs:** Filter status segmentasi sekali klik.
5. **Data Grid Core:** Baris data compact dengan kode klien monospace dan indikator badge.




* **Primary Action:** Tombol Cyan `+ LEAD BARU (Ctrl+N)`.


* **Secondary Action Bar:** Quick Follow-up logging per baris `[Log]` yang langsung membuka popover pencatatan tanpa berpindah halaman.



---

### SCR-03 & SCR-04: Client 360 & Lead Intake Slide-over Drawer

```
+-------------------------------------------------------------------+
| DETAIL KLIEN: KLN-20260922-0001                       [X Tutup]   |
+-------------------------------------------------------------------+
|  PT CANTIK JELITA UTAMA                                           |
|  Status: [FIRST_ORDER_ACTIVE]      PIC CS: Rina Handayani         |
+-------------------------------------------------------------------+
| [ Ringkasan Profil ]  [ Riwayat Interaksi ]  [ Tiket Sampel (2) ] |
+-------------------------------------------------------------------+
| INFORMASI UTAMA                                                   |
| Telepon/WA   : 081234567890 [ Chat via Web WA ]                   |
| Wilayah      : Kota Bandung, Jawa Barat                           |
| Saluran Lead : Instagram Ads                                      |
| Kategori     : Skincare / Sunscreen Serum Gel                     |
| Limit Revisi : [ 1 ] Kali Gratis (Tersisa: 1 Kuota)               |
+-------------------------------------------------------------------+
| LOG INTERAKSI CS (Terakhir: 2 Jam Lalu -> Segmen HOT)             |
| +---------------------------------------------------------------+ |
| | [ Input Catatan Follow-up Baru...                     ]       | |
| | Jenis: (o) WhatsApp  ( ) Telp  ( ) Meeting Offline            | |
| | [ Simpan & Update Interaksi ]                                 | |
| +---------------------------------------------------------------+ |
| * 22/09/2026 14:00 - CS Rina: Klien menanyakan aroma sampel lab.  |
| * 20/09/2026 10:15 - CS Rina: Formulasi target disetujui awal.    |
+-------------------------------------------------------------------+
| TIKET SAMPEL TERDAFTAR                                            |
| Tiket #SMP-01 | Rev: 0 (Gratis) | [ RND_QUEUE_FREE ]              |
| Tiket #SMP-02 | Rev: 1 (Gratis) | [ SEDANG DIRACIK LAB ]          |
|                                                                   |
| [ + BUAT TIKET SAMPEL BARU ]                                      |
+-------------------------------------------------------------------+

```

* **Hierarki Layout:**
* Komponen *Slide-over panel* dari sisi kanan layar selebar $480\text{ px}$ (Desktop) atau $100\%$ lebar layar (Mobile).
* Panel header menampilkan kode klien monospasial, nama perusahaan, dan PIC yang bertanggung jawab.


* Tabbed sub-view: Memisahkan detail identitas, *timeline audit trail*, dan daftar permohonan sampel lab.




* **Primary Action:** `[ Simpan & Update Interaksi ]` untuk mereset counter `last_activity_at` kembali ke `HOT`.



---

### SCR-05: Sample Ticket Creation & Revision Gate Modal

```
+---------------------------------------------------------------------------+
| BUAT PERMOHONAN SAMPEL FORMULA                           [X Batal]        |
+---------------------------------------------------------------------------+
| Klien: PT Cantik Jelita Utama (KLN-20260922-0001)                         |
| Indeks Revisi Saat Ini: 2 (Limit Gratis Klien: 1 Kali)                    |
+---------------------------------------------------------------------------+
| (!) EVALUASI GERBANG REVISI (BUSINESS GATE):                              |
| [PERINGATAN]: Kuota revisi gratis telah terlampaui!                      |
| Tiket ini BERBAYAR (is_billable = TRUE) dan akan otomatis dialihkan       |
| ke Divisi Finance (PENDING_FEE_ASSESSMENT). Formulator RnD tidak akan     |
| dapat memproses formula sebelum biaya ditetapkan dan diverifikasi lunas.  |
+---------------------------------------------------------------------------+
| Jenis Formulasi     : (o) New Product Formula   ( ) Existing Formula      |
| Nama Produk BPOM    : [ Sunscreen Niacinamide Gel SPF 50    ]             |
| Klaim Manfaat Utama : [ Mencerahkan, non-comedogenic, matte finish ]      |
| Target Kemasan      : [ Tube 30 ml dengan pump airless      ]             |
| Target Budget (HPP) : [ Rp 25.000 / pcs                     ]             |
|                                                                           |
| SPESIFIKASI FORMULASI (JSON PARAMETERS):                                  |
| Tekstur: [Gel Ringan Water-burst]    Aroma: [Fresh Citrus 0.05%]         |
| Warna  : [Transparan Sedikit Kuning] Volume: [30 ml]                     |
|                                                                           |
| [x] Klien Membutuhkan Dummy Cetak Kemasan Fisik                           |
+---------------------------------------------------------------------------+
|                                    [ Batalkan ]  [ AJUKAN KE FINANCE -> ] |
+---------------------------------------------------------------------------+

```

* **Hierarki Layout:**
* Modal dialog dengan lebar medium ($640\text{ px}$).
* *Gate Evaluator Banner* di bagian atas: Berubah warna secara reaktif (Hijau untuk kuota gratis, Merah untuk penagihan berbayar).


* Form input spesifikasi teknis formulasi kosmetik/makanan.




* **Primary Action:**
* Jika Gratis: `[ AJUKAN KE LAB RND ]` (Cyan Button).


* Jika Berbayar: `[ AJUKAN KE FINANCE (BIAYA REVISI) ]` (Rose/Amber Button).





---

## 7. Component Library

### 7.1. Component: `BadgeStatus`

* **Tujuan:** Menampilkan status segmentasi lead, status tiket sampel, dan status konektivitas.


* **Variants:**
* `hot`: Background `#ECFDF5`, Border `#A7F3D0`, Text `#065F46`, Icon Dot Hijau.


* `warm`: Background `#FFFBEB`, Border `#FDE68A`, Text `#92400E`, Icon Dot Kuning.


* `cold`: Background `#FFF1F2`, Border `#FECDD3`, Text `#9F1239`, Icon Alert Segitiga.


* `free-revision`: Background `#F0FDF4`, Border `#BBF7D0`, Text `#166534`.


* `billable-revision`: Background `#FEF2F2`, Border `#FECACA`, Text `#991B1B`.


* `offline`: Background `#EEF2FF`, Border `#C7D2FE`, Text `#3730A3`.




* **States:** Normal, Hover (menampilkan tooltip keterangan durasi hari/kondisi gate).

### 7.2. Component: `ButtonAction`

* **Variants:**
* `primary`: Background `#0E7490`, Text `#FFFFFF`, Hover `#0891B2`, Active `#155E75`.
* `secondary`: Background `#FFFFFF`, Border `#CBD5E1`, Text `#0F172A`, Hover `#F8FAFC`.
* `destructive`: Background `#E11D48`, Text `#FFFFFF`, Hover `#BE123C`.
* `ghost`: Background Transparent, Text `#475569`, Hover `#F1F5F9`.


* **States:** Default, Hover, Focus (Ring 2px Cyan-800, Offset 1px), Disabled (Opacity 40%, Cursor not-allowed), Loading (Label teks digantikan animasi spinner $14\text{ px}$ dan text "Memproses...").

### 7.3. Component: `InputData`

* **Variants:** `text`, `phone-id` (+62 flag prefix bawaan), `monospace-code` (font JetBrains Mono), `textarea`, `dropdown-select`.
* **States:**
* `default`: Border `1px solid #CBD5E1`, Background `#FFFFFF`.
* `focus`: Border `1.5px solid #0E7490`, Ring `2px #CFFAFE`.
* `error`: Border `1.5px solid #E11D48`, Helper Text warna merah di bawah input.
* `disabled`: Background `#F1F5F9`, Text `#94A3B8`, Cursor Not-Allowed.



### 7.4. Component: `ImageCompressorDropzone`

* **Tujuan:** Menampung foto bukti bayar & sampel kemasan dengan batas mutlak $\le 300\text{ KB}$ `.webp`.


* **States:**
* `idle`: Area putus-putus (*dashed border*) dengan instruksi: *"Tarik gambar ke sini (Maks 1280px / 300KB WebP)"*.


* `compressing`: Progress bar animasi dengan info kalkulasi: *"Mengonversi ke WebP & Menyesuaikan Resolusi..."*.


* `success`: Thumbnail preview gambar, badge hijau *"218 KB .webp"*, tombol ganti file.


* `rejected-oversize`: Border merah pekat, peringatan *"Ukuran akhir 342 KB (>300 KB). Klik untuk Crop Gambar"*.





### 7.5. Component: `SessionGuardModal`

* **Tujuan:** Mencegah pelanggaran integritas data akibat multi-login dalam 1 akun pengguna.


* **Properties:** Non-dismissible (tidak bisa ditutup via tombol ESC atau klik backdrop).
* **Content:** Peringatan konflik sesi, identitas waktu sesi baru, tombol alih kendali sesi.



---

## 8. State UI untuk Screen Kunci

### SCR-02: CS Central Workbench

#### 1. Empty State (Belum Ada Data)

* **Visual:** Ilustrasi outline bersih dokumen checklist tanpa prospek.
* **Teks:** *"Belum ada prospek terdaftar di sistem"*
* **Sub-teks:** *"Mulai daftarkan klien atau prospek baru untuk mencatat kebutuhan formula maklon."*
* **Aksi Utama:** Tombol tunggal `[ + Daftarkan Prospek Pertama ]` (Membuka Drawer SCR-03).

#### 2. Loading State (Inisialisasi / Sync Turso)

* **Visual:** Skeleton loading shimmer abu-abu muda (`#E2E8F0`) pada 4 kartu KPI atas dan 8 baris tabel.
* **Durasi:** Maksimal $150\text{ ms}$ jika membaca dari SQLite lokal, atau instan.

#### 3. Error State (Database Corrupt / Failure)

* **Visual:** Alert banner merah di atas tabel dengan tombol diagnosis.
* **Teks:** *"Gagal membaca basis data lokal: SQLite I/O Error."*
* **Aksi:** Tombol `[ Pulihkan dari Turso Cloud ]` dan `[ Hubungi Tim IT / Salin Log ]`.

#### 4. Success State (Aksi Selesai)

* **Visual:** Toast notification floating di kanan bawah selama 3 detik.
* **Teks:** *"Lead KLN-20260922-0002 berhasil dibuat. Notifikasi terkirim ke Telegram Divisi CS."*


#### 5. Offline Mode State (Koneksi Putus)

* **Visual:** Banner atas tipis berwarna indigo (`#6366F1`): *"Mode Offline Aktif — Anda bekerja menggunakan database lokal SQLite. 4 perubahan tersimpan di antrean sinkronisasi."*

* **Perilaku:** Semua tombol CRUD tetap berfungsi normal tanpa hambatan jaringan.

---

### SCR-05: Sample Ticket Creation

#### 1. Empty State (Belum Ada Riwayat Sampel)

* **Visual:** Penanda indeks revisi ke-0: *"Permohonan Formula Perdana (Revisi #0)"*. Kuota gratis utuh 100%.



#### 2. Gate Exceeded State (Melebihi Kuota Revisi)

* **Visual:** Seluruh form field yang berkaitan dengan RnD diberi border peringatan merah. Tombol submit berubah label dan warna menjadi penagihan Finance.



---

## 9. Responsive Behaviour

MaklonOS dirancang menggunakan pendekatan **Responsive Adaptive Grid** untuk mendukung laptop staf kantor, tablet supervisor produksi, dan smartphone Android CS:

```
+------------------------------------------------------------------------------------+
| BREAKPOINT MAPPING                                                                 |
+------------------------------------------------------------------------------------+
| Desktop (>= 1200px) : Multi-column full workbench, split screen table + inspector  |
| Tablet  (768-1199px): Collapsible icon-rail, stacked table with compact attributes |
| Mobile  (< 768px)   : Bottom navigation bar, vertical cards, full-screen sheets    |
+------------------------------------------------------------------------------------+

```

### 9.1. Desktop ($>1200\text{ px}$) — Default Tauri v2 Desktop App

* Sidebar navigasi kiri terbuka penuh selebar $220\text{ px}$.
* Tabel data menampilkan 8 kolom penuh secara horizontal tanpa perlu scrolling.
* Membuka profil klien menggunakan sistem **Split Inspector View**: Tabel menyusut menjadi $65\%$ lebar layar, dan panel detail klien mengisi $35\%$ sisi kanan layar secara berdampingan.

### 9.2. Tablet ($768\text{ px} - 1199\text{ px}$) — Ruang Rapat / Mobile Staff

* Sidebar navigasi kiri otomatis diciutkan menjadi **Icon Rail** ($64\text{ px}$).
* Tabel data menyembunyikan kolom sekunder (seperti *Wilayah* dan *PIC CS*), hanya menyisakan *Nama Klien*, *Segmen*, *Limit Revisi*, dan tombol *Aksi*.
* Drawer detail klien membuka dalam mode *Slide-over* selebar $550\text{ px}$ menutupi sebagian tabel dengan backdrop transparan.

### 9.3. Mobile ($<768\text{ px}$) — Tauri v2 Android APK

* Sidebar kiri dihilangkan total dan digantikan oleh **Bottom Navigation Bar** dengan 4 menu utama: `Leads`, `Sampel`, `Cari`, dan `Akun`.
* Tabel data diubah menjadi bentuk **Card List Vertikal**: Tiap kartu memuat Nama Klien, Status Badge di kanan atas, Kode Klien monospasial, dan 1 tombol aksi utama `[Log Kontak]`.
* Formulir intake dan detail klien membuka dalam bentuk **Full Screen Sheet** dengan tombol navigasi kembali di pojok kiri atas. Tombol simpan selalu melayang (*sticky bottom action button*).

---

## 10. Accessibility (A11y) & Usability Standards

### 10.1. Contrast Ratios (WCAG 2.1 Level AA Compliance)

* Teks utama (`#0F172A`) di atas background kartu (`#FFFFFF`): Rasio kontras **14.5:1** (Melampaui syarat 4.5:1).
* Teks sekunder label (`#475569`) di atas kartu: Rasio kontras **5.8:1**.
* Teks badge `COLD LEAD` (`#9F1239` di atas `#FFF1F2`): Rasio kontras **6.2:1**.
* Border input interaktif (`#CBD5E1` di atas `#FFFFFF`): Rasio kontras **3.2:1** (Memenuhi batas non-text contrast 3.0:1).

### 10.2. Focus Order & Keyboard Navigation

* **Global Shortcut Key Map:**
* `Ctrl + K` (Windows) / `Cmd + K` (macOS): Fokus ke input pencarian global klien.
* `Ctrl + N` / `Cmd + N`: Membuka drawer registrasi *Lead Baru*.


* `Esc`: Menutup slide-over drawer atau modal aktif.


* **Focus Trap:** Pada modal dialog (SCR-01 dan SCR-05), tombol `Tab` wajib terkunci hanya di dalam elemen interaktif modal tersebut; fokus tidak boleh bocor ke elemen tabel di latar belakang.
* **Urutan Tab Form Intake (SCR-03):** Nama Klien $\rightarrow$ Nomor WA $\rightarrow$ Provinsi $\rightarrow$ Kota $\rightarrow$ Saluran Lead $\rightarrow$ Kategori Produk $\rightarrow$ Tombol Simpan.



### 10.3. Kebutuhan ARIA & Pembaca Layar (Screen Reader)

* Semua kode identifikasi monospasial wajib menggunakan atribut pelafalan jelas:
```html
<span class="font-mono" aria-label="Kode Klien: K-L-N dua ribu dua puluh enam, nol sembilan dua puluh dua, nol nol nol satu">
  KLN-20260922-0001
</span>

```


* Indikator status sync Turso cloud menggunakan `aria-live="polite"` sehingga perubahan koneksi dari online ke offline terbaca tanpa memotong aktivitas suara operator:
```html
<div role="status" aria-live="polite" class="sr-only">
  Status sinkronisasi: Tersambung ke Turso Cloud
</div>

```


* Modal interupsi sesi ganda (*Single Session Guard*) wajib menggunakan `role="alertdialog"` dengan atribut `aria-live="assertive"` agar sistem seketika membacakan peringatan force-logout.



---

## 11. Kesimpulan & Langkah Eksekusi

Design Brief ini mendefinisikan batasan antarmuka MaklonOS Tahap 1. Struktur ini mengikat seluruh pekerjaan komponen frontend di Next.js, penanganan state lokal di Tauri v2, dan validasi visual atas aturan bisnis maklon (kuota revisi, kompresi gambar $\le 300\text{ KB}$, dan proteksi sesi aktif). Desain dapat langsung diimplementasikan ke dalam komponen fungsional tanpa ambiguitas layout.

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

# DESIGN BRIEF: MAKLONOS TAHAP 3 (PPIC, LANTAI PENGELUARAN, PENYELESAIAN BAKI, LOGISTIK, SIASATAN QC & PENYERAHAN CRM)

---

## 1. Design Principles

Tiga peraturan reka bentuk mandatori yang wajib dipatuhi dalam antaramuka MaklonOS Tahap 3:

### Prinsip 1: Sequential Floor Locking & Physical-to-Digital Parity (Kuncian Berurutan Lantai Kilang)

* **Konteks:** Di lantai pengeluaran fizikal, bancuhan (*mixing*) mustahil dilakukan sebelum penimbangan (*weighing*) bahan aktif selesai. Begitu juga pengisian (*filling*) dan pembungkusan (*packing*).


* **Peraturan Reka Bentuk:**
* Antaramuka penjejakan pengeluaran wajib menguatkuasakan kuncian keadaan sekuensial yang ketat (*Strict Sequential Stepper*). Pengguna dilarang mengaktifkan atau melangkau ke fasa seterusnya sebelum fasa sebelumnya disahkan selesai dengan cop masa (*timestamp*) dan pengenalan operator.


* Elemen input pelarasan jadual oleh SPV Pengeluaran mestilah berbentuk penetapan tarikh manual yang eksplisit, bukan kalkulasi automatik sistem, bagi memastikan anggaran mencerminkan kekangan fizikal sebenar jentera kilang.





### Prinsip 2: Physical Release Settlement Gate (Kuncian Pelepasan Fizikal Berasaskan Kewangan)

* **Konteks:** Risiko kewangan terbesar berlaku apabila barang fizikal keluar dari pintu gudang kilang sebelum baki kos pengeluaran dan kos penghantaran dijelaskan sepenuhnya oleh klien.


* **Peraturan Reka Bentuk:**
* Butang cetakan Surat Jalan, pemilihan armada, penyerahan kepada kurier kargo, dan input nombor resi penghantaran wajib disekat secara visual dan fungsian selagi status bayaran baki belum disahkan `VERIFIED` oleh Bahagian Kewangan (`is_settlement_cleared = 1`).


* Sekatan ini mesti memaparkan sepanduk amaran kewangan berwarna merah gelap dengan pautan langsung kepada invois penyelesaian baki untuk mengelakkan salah faham antara operator logistik dan pihak kewangan.





### Prinsip 3: Immutable Lifecycle Territory (Pemisahan Wilayah Kitaran Hayat CS vs CRM)

* **Konteks:** Pertindihan kuasa antara CS (pemerolehan pesanan pertama) dan CRM (pengekalan pesanan ulangan) merosakkan struktur komisen dan mengelirukan pelanggan.


* **Peraturan Reka Bentuk:**
* Sebaik sahaja produk disahkan `ACC Produk` oleh klien, profil pelanggan bertukar secara kekal kepada `EXISTING_CLIENT`.


* Antaramuka CS serta-merta dikunci kepada mod **Paparan Sahaja (Read-Only)**. Sebarang cubaan CS untuk mencipta pesanan baharu bagi pelanggan tersebut akan disekat oleh modal pengalihan tugas dengan tindakan satu klik: *"Serahkan Notifikasi Pesanan Ulangan kepada CRM"*.





---

## 2. Visual Direction

### Mood & Karakter

* **Heavy Industrial Cockpit & High-Trust Logistics:** Menggabungkan ketegasan sistem kawalan lantai kilang (*Manufacturing Execution System*) dengan kejelasan logistik bertaraf antarabangsa. Visual kelihatan teguh, kontras tinggi, menggunakan ikonografi perindustrian yang jelas, dan bebas daripada elemen hiasan yang mengurangkan kelajuan kerja operator.


* **Forensic Auditability:** Khusus untuk siasatan QC dan tuntutan pemulangan (*return claims*), antaramuka membawakan susun atur perbandingan bukti forensik sebelah-menyebelah (*side-by-side comparative inspection*) antara sampel simpanan makmal dan bukti kerosakan pelanggan.



### Rujukan Visual

* **Tulip Interfaces & Plex MES:** Papan pemuka penjejakan status fasa pengeluaran lantai kilang (timbang, bancuh, isi, bungkus) yang mesra skrin sentuh tablet.


* **Flexport & Samsara Dispatch:** Susun atur pengurusan manifes logistik, penjanaan Surat Jalan, dan pengesahan resi berperingkat.


* **Linear Cycles & Jira Service Management:** Alur saluran paip pengekalan (*retention pipeline*) CRM dan pengurusan tiket siasatan tuntutan mutu produk.



### Anti-Patterns (Perkara yang Dielakkan)

* **Dilarang:** Menggunakan elemen *drag-and-drop* rawak untuk fasa pengeluaran kilang. Penukaran fasa mesti melalui butang pengesahan eksplisit dengan audit modal bagi mengelakkan tersalah sentuh pada tablet berminyak/sarung tangan kerja.


* **Dilarang:** Menyembunyikan nombor rujukan kritikal seperti `batch_code`, `po_reference_no`, dan `tracking_number` dalam menu tersembunyi. Semua kod pengesanan wajib sentiasa kelihatan menggunakan fon monoruang.


* **Dilarang:** Membenarkan pengeluaran Surat Jalan sementara (*provisional pass*) tanpa status bayaran lunas daripada Finance.



---

## 3. Design Tokens

### 3.1. Color Palette (Strict Hex Codes & Semantic Roles)

| Nama Token | Kod Hex | Peranan Semantik & Rasional Penggunaan |
| --- | --- | --- |
| **Brand Primary (Cyan Industrial)** |  | Mengekalkan kesinambungan daripada Tahap 1 & Tahap 2.

 |
| `color-primary-900` | `#083344` | Latar pengepala modul kilang & logistik.

 |
| `color-primary-700` | `#0E7490` | Butang tindakan utama, status aktif penjejakan.

 |
| `color-primary-50` | `#ECFEFF` | Latar belakang kad fasa pengeluaran yang sedang berjalan.

 |
| **Lantai Pengeluaran & Fasa (Industrial Slate & Amber)** |  | Digunakan khusus untuk fasa kilang dan kelewatan bahan.

 |
| `color-stage-pending` | `#64748B` | Fasa belum bermula / terkunci (Slate-500). |
| `color-stage-active` | `#0284C7` | Fasa sedang berlangsung (Sky-600) dengan animasi denyutan halus. |
| `color-stage-done` | `#059669` | Fasa selesai disahkan (Emerald-600). |
| `color-po-delay-bg` | `#FEF3C7` | Latar amaran bahan mentah kehabisan stok / penangguhan PO.

 |
| `color-po-delay-text` | `#92400E` | Teks amaran kelewatan pembekal PO (Amber-800).

 |
| **Logistik & Pelepasan Fizikal (Violet & Teal)** |  | Kawalan Surat Jalan dan pengesahan resi kurier.

 |
| `color-logistics-bg` | `#F0FDFA` | Latar bahagian logistik & pematuhan SOP simpanan.

 |
| `color-logistics-text` | `#0F766E` | Teks status sedia hantar & pengangkutan dalaman.

 |
| `color-settlement-locked` | `#991B1B` | Sekatan pelepasan barang akibat baki belum lunas.

 |
| `color-settlement-locked-bg` | `#FEF2F2` | Latar belakang amaran sekatan penghantaran.

 |
| **Siasatan Mutu QC (Forensic Crimson & Green)** |  | Keputusan liabiliti kerosakan produk.

 |
| `color-qc-internal` | `#DC2626` | `INTERNAL_FAULT` — Kesilapan kilang / autorisasi retur.

 |
| `color-qc-external` | `#D97706` | `RECIPIENT_FAULT` — Kerosakan kurier / penolakan retur.

 |
| `color-qc-pass` | `#16A34A` | `ACC_PRODUCT` — Produk diterima sempurna oleh klien.

 |
| **Pengekalan CRM (Indigo Growth)** |  | Saluran paip pesanan ulangan dan kitaran pelanggan sedia ada.

 |
| `color-crm-pipeline-bg` | `#EEF2FF` | Latar saluran paip pengekalan CRM.

 |
| `color-crm-pipeline-text` | `#3730A3` | Teks lencana status pelanggan sedia ada (`EXISTING_CLIENT`).

 |

### 3.2. Typography Scale

* **Primary Font Family:** `Plus Jakarta Sans` — Pengepala seksyen, nota siasatan QC, dan arahan SOP.


* **Monospace Font Family:** `JetBrains Mono` — Digunakan mandatori untuk:
* Kod Kelompok Pengeluaran (`BAT-20260922-0001`)


* Nombor Purchase Order PPIC (`PO-PPIC-2026-088`)


* Nombor Resi Kurier Kargo (`JNE-TRK-882910023`) dan Plat Nombor Kenderaan (`B 1234 KMN`)


* Nombor Surat Jalan (`SJ-20260922-019`)


* Angka baki pelunasan invois kewangan.





| Token | Size | Line Height | Weight | Penerapan Komponen |
| --- | --- | --- | --- | --- |
| `text-display` | 24px | 32px | Bold (700) | Kod kelompok aktif, nilai baki bayaran lunas.

 |
| `text-title-lg` | 18px | 24px | SemiBold (600) | Pengepala Meja Kerja SPV & Modul Penghantaran.

 |
| `text-title-sm` | 15px | 20px | SemiBold (600) | Pengepala Fasa Pengeluaran (Timbang / Bancuh).

 |
| `text-body` | 13px | 18px | Regular (400) | Butiran senarai semak SOP, log komunikasi pemandu.

 |
| `text-body-bold` | 13px | 18px | SemiBold (600) | Nama pembekal PO, jenis kecacatan QC, nama pemandu.

 |
| `text-caption` | 11px | 16px | Medium (500) | Suhu simpanan SOP, cop masa peralihan fasa.

 |
| `text-mono-code` | 12px | 16px | Regular (500) | Nombor kelompok, nombor PO, kod resi kargo.

 |

---

## 4. Screen Inventory (Phase 3 Core Screens)

| ID Skrin | Nama Skrin | Sasaran Pengguna | Tujuan & Skop Fungsian Utama |
| --- | --- | --- | --- |
| **SCR-15** | **PPIC Inventory & PO Workbench** | Pegawai PPIC | Pengesahan stok bahan mentah gudang, pendaftaran nombor PO pembekal (`po_reference_no`), anggaran tarikh ketibaan bahan, dan butang pelepasan bahan sedia.

 |
| **SCR-16** | **SPV Production Floor & Rescheduling Workbench** | SPV Pengeluaran | Meja kerja penjadualan manual 4 fasa akibat kelewatan bahan mentah, serta papan kawalan penjejakan fasa fizikal sekuensial (Timbang $\rightarrow$ Bancuh $\rightarrow$ Isi $\rightarrow$ Bungkus).

 |
| **SCR-17** | **Logistics Dispatcher & Delivery Gate Hub** | Logistik, Kewangan | Penguatkuasaan gerbang pelunasan kewangan, penjanaan PDF Surat Jalan dan SOP Simpanan, pemilihan armada internal vs ekspedisi rekanan, dan pengagihan nombor resi.

 |
| **SCR-18** | **QC Forensic Claim Investigation Workbench** | Pemeriksa QC | Siasatan aduan kerosakan pasca penerimaan klien (*Klien ACC Produk: Tidak*), perbandingan sampel simpanan makmal, dan penentuan liabiliti (*Internal Fault* vs *Recipient Fault*).

 |
| **SCR-19** | **CRM Retention & Repeat Order Pipeline** | Pegawai CRM | Papan pemuka pengekalan pelanggan sedia ada, penjejakan anggaran masa kehabisan stok produk klien, sejarah kod formula lama, dan penciptaan tiket pesanan ulangan.

 |

---

## 5. User Flows

### Flow 1: Pengecekan Bahan PPIC & Penjadualan Semula Manual oleh SPV

```
[MoU Berstatus: READY_FOR_LEGAL_AND_PRODUCTION][cite: 3]
  │
  ▼
[PPIC Membuka SCR-15: Pengesahan Bahan Mentah Gudang][cite: 3]
  │
  ├── PILIHAN A: [BAHAN TERSEDIA][cite: 3]
  │     └── Status Kelompok: READY_FOR_WEIGHING -> Terus ke Lantai Kilang[cite: 3]
  │
  └── PILIHAN B: [BAHAN TIDAK TERSEDIA (OUT OF STOCK)][cite: 3]
        ├── PPIC memasukkan: po_reference_no, nama pembekal, anggaran tarikh sampai bahan[cite: 3]
        ├── Status Kelompok: OUT_OF_STOCK_PENDING_PO[cite: 3]
        └── Notifikasi amaran merah dihantar ke Papan Pemuka SPV Pengeluaran[cite: 3]
  │
  ▼
[SPV Pengeluaran Menerima Amaran di SCR-16 Workbench][cite: 3]
  │
  ▼
[SPV Membuka Modal Penjadualan Semula Manual (Bukan Automatik)]:[cite: 3]
  ├── Input Tarikh Baharu: Mula Timbang, Mula Bancuh, Mula Isi, Mula Bungkus[cite: 3]
  ├── Input Tarikh Sasaran Siap Produk (estimated_completion_date)[cite: 3]
  └── Klik "Simpan & Kemas Kini Jadual Rasmi"[cite: 3]
  │
  ▼
[Sistem Mengemas Kini SQLite & Turso Cloud]:[cite: 3]
  ├── Jadual baharu dipaparkan serta-merta pada papan pemuka CS[cite: 3]
  └── Bot Telegram menghantar makluman anjakan tarikh ke Kumpulan Telegram CS[cite: 3]

```

---

### Flow 2: Pelaksanaan 4 Fasa Pengeluaran Fizikal Lantai Kilang

```
[Bahan Tiba & Disahkan oleh PPIC: READY_FOR_WEIGHING][cite: 3]
  │
  ▼
[FASA 1: PENIMBANGAN BAHAN (STAGE_WEIGHING)][cite: 3]
  ├── Operator menyemak berat bahan aktif mengikut spesifikasi formula RnD[cite: 3]
  └── SPV klik butang: "Sahkan Penimbangan Selesai" -> Cop Masa Disimpan[cite: 3]
  │
  ▼
[FASA 2: PEMBANCUHAN / MIXING (STAGE_MIXING)][cite: 3]
  ├── Pencampuran reaktor sehingga homogen[cite: 3]
  └── SPV klik butang: "Sahkan Bancuhan Selesai" -> Cop Masa Disimpan[cite: 3]
  │
  ▼
[FASA 3: PENGISIAN / FILLING (STAGE_FILLING)][cite: 3]
  ├── Pengisian ke dalam pembungkusan primer (botol/tiub)[cite: 3]
  └── SPV klik butang: "Sahkan Pengisian Selesai" -> Cop Masa Disimpan[cite: 3]
  │
  ▼
[FASA 4: PEMBUNGKUSAN / PACKING (STAGE_PACKING)][cite: 3]
  ├── Pemasangan label, kotak sekunder, dan karton induk[cite: 3]
  └── SPV klik butang: "Sahkan Pembungkusan Selesai"[cite: 3]
  │
  ▼
[SPV Klik: "KONFIRMASI PRODUK JADI SELESAI"][cite: 3]
  │
  ├── Status Kelompok: PRODUCTION_FINISHED[cite: 3]
  ├── Sistem menghantar isyarat segera kepada Bahagian Kewangan untuk Invois Pelunasan[cite: 3]
  └── Notifikasi amaran disalurkan ke Kumpulan Telegram CS & Kewangan[cite: 3]

```

---

### Flow 3: Gerbang Pelunasan Kewangan & Pelepasan Logistik

```
[Produk Siap Dibungkus: PRODUCTION_FINISHED][cite: 3]
  │
  ▼
[Bahagian Kewangan Mengeluarkan Invois Pelunasan Baki & Kos Hantar][cite: 3]
  │
  ▼
[GERBANG KUNCIAN PENGHANTARAN AKTIF (STRICT SETTLEMENT GATE)]:[cite: 3]
  │
  ├── Pihak Logistik cuba membuka SCR-17 Dispatcher Hub
  ├── Paparan Terkunci: Butang "Cetak Surat Jalan" & "Panggil Kurier" TIDAK AKTIF[cite: 3]
  ├── Sepanduk Merah: "Pelepasan Disekat: Menunggu Pengesahan Bayaran Pelunasan"[cite: 3]
  │
  ▼
[Klien Membayar Baki -> Kewangan Mengesahkan Status: PAID (is_settlement_cleared = 1)][cite: 3]
  │
  ▼
[Kuncian Pelepasan Terbuka Automatik]:[cite: 3]
  ├── 1. Logistik menjana dan mencetak PDF Surat Jalan & Lembar SOP Simpanan[cite: 3]
  ├── 2. Pilih Kaedah: [Armada Dalaman (Pemandu/Plat)] ATAU [Ekspedisi Kargo (Pick-up)][cite: 3]
  ├── 3. SPV/Logistik memasukkan nombor resi (tracking_number) & muat naik bukti resi[cite: 3]
  │
  ▼
[Sistem Menghantar Resi Berperingkat]:[cite: 3]
  ├── Bot Telegram menyalurkan resi sah ke Kumpulan CS[cite: 3]
  └── CS memanjangkan resi dan pautan jejak kepada klien via WhatsApp[cite: 3]

```

---

### Flow 4: Siasatan Aduan Tuntutan Retur QC (ACC Produk: Ya / Tidak)

```
[Barang Diterima Klien di Lokasi Destinasi][cite: 3]
  │
  ▼
[Klien Mengesahkan Status Penerimaan]:[cite: 3]
  │
  ├── KES A: [YA - ACC PRODUK][cite: 3]
  │     ├── Status Pesanan: ORDER_COMPLETED[cite: 3]
  │     └── Aliran terus beralih ke Mesin Handover CRM (Flow 5)[cite: 3]
  │
  └── KES B: [TIDAK - TOLAK / ADUAN KEROSAKAN][cite: 3]
        │
        ▼
  [Sistem Menjana Tiket qc_claims: UNDER_INVESTIGATION][cite: 3]
        │
        ├── Pegawai QC membuka SCR-18 Forensic Workbench[cite: 3]
        ├── QC mengambil sampel simpanan makmal (retain sample) batch berkaitan[cite: 3]
        ├── Bandingkan foto kerosakan klien vs integriti sampel simpanan[cite: 3]
        │
        ├── KEPUTUSAN 1: [INTERNAL_FAULT (Salah Kilang/Formula/Segel)][cite: 3]
        │     ├── QC memilih: "ACC RETUR"[cite: 3]
        │     ├── Sistem mengeluarkan Surat Kebenaran Pemulangan Fizikal Barang[cite: 3]
        │     └── Sistem menjana tiket pembuatan kelompok ganti TANPA kos tambahan klien[cite: 3]
        │
        └── KEPUTUSAN 2: [RECIPIENT_FAULT (Kerosakan Kurier/Penerima)][cite: 3]
              ├── QC memilih: "TOLAK RETUR"[cite: 3]
              ├── Sistem menjana Berita Acara Siasatan Rasmi QC berserta bukti pra-hantar[cite: 3]
              └── CS mengarahkan klien membuat tuntutan insurans ekspedisi luar[cite: 3]

```

---

### Flow 5: Serah Terima Automatik CS ke CRM & Sekatan Pesanan Ulangan

```
[Status Pesanan Rasmi: ORDER_COMPLETED (Lolos ACC Produk)][cite: 3]
  │
  ▼
[Enjin Serah Terima Automatik Berjalan]:[cite: 3]
  ├── 1. clients.lifecycle_status bertukar: FIRST_ORDER_ACTIVE -> EXISTING_CLIENT[cite: 3]
  ├── 2. Sistem menetapkan akaun kepada Pegawai CRM (assigned_crm_id)[cite: 3]
  ├── 3. Papan pemuka CRM SCR-19 menerima profil lengkap:
  │      - Kod Formula yang diluluskan (last_formula_code)[cite: 3]
  │      - Kuantiti kelompok terakhir & anggaran tarikh stok habis (estimated_depletion_at)[cite: 3]
  │
  ▼
[KUNCIAN WILAYAH DIKUATKUASAKAN]:[cite: 3]
  ├── Akses CS pada akaun tersebut bertukar menjadi PAPARAN SAHAJA (Read-Only)[cite: 3]
  │
  └── JIKA Klien Menghubungi CS Asal untuk Pesanan Ulangan (Repeat Order):[cite: 3]
        ├── CS cuba membuat pesanan baharu dengan kod_klien tersebut
        ├── Sistem memaparkan Sekatan Keras (Modal Block):
        │   "Akaun ini kini di bawah pengurusan CRM (PIC: Rendi). CS dilarang membuat tiket pesanan ulangan."[cite: 3]
        └── Tindakan Tunggal CS: Klik [Majukan Perbualan kepada Rendi (CRM)][cite: 3]

```

---

## 6. Layout per Screen

### SCR-16: SPV Production Floor & Rescheduling Workbench (Tablet / Desktop)

```
+--------------------------------------------------------------------------------------------------------------------------+
| MaklonOS Pabrik | Kelompok Aktif: BAT-20260922-0001 (Sunscreen Gel 30ml) | Mod: [ Tablet Offline Sedia ] | SPV: Bayu     |
+-----------------+--------------------------------------------------------+-------------------------------+---------------+
| STATUS BAHAN PPIC : [ TERSEDIA ] (Disahkan oleh PPIC: 22/09/2026 08:30 WIB)                   | Sasaran Siap: 28/09/2026 |
| JIKA BAHAN DELAY  : [ BUKA PENJADUALAN SEMULA MANUAL (KLIK DI SINI) ]                                                    |
+--------------------------------------------------------------------------------------------------------------------------+
| PENJEJAKAN 4-FASA PENGELUARAN FIZIKAL (SEKUANSIAL BERKUNCI)                                                              |
|                                                                                                                          |
|  [✓] 1. PENIMBANGAN          [✓] 2. PEMBANCUHAN           [●] 3. PENGISIAN            [ ] 4. PEMBUNGKUSAN                |
|  +------------------------+  +------------------------+  +------------------------+  +------------------------+          |
|  | Status: SELESAI        |  | Status: SELESAI        |  | Status: SEDANG JALAN   |  | Status: TERKUNCI       |          |
|  | Bahan aktif 100% pas   |  | Homogeniti disahkan    |  | Nozel Mesin Line B     |  | Menunggu Fasa Isi      |          |
|  | Selesai: 22/09 10:15   |  | Selesai: 22/09 14:00   |  | Mula: 22/09 14:30      |  | Anggaran: 23/09 09:00  |          |
|  | Operator: Joko (Lab)   |  | Operator: Budi (Pabrik)|  | Operator: Slamet (Pack)|  | Operator: -            |          |
|  +------------------------+  +------------------------+  +------------------------+  +------------------------+          |
|                                                                                                                          |
+--------------------------------------------------------------------------------------------------------------------------+
| BORANG PENGESAHAN FASA SEMASA: FASA 3 - PENGISIAN (FILLING)                                                              |
|                                                                                                                          |
| Suhu Pengisian Suapan : [ 28.5 ] °C   (Julat Dibenarkan: 25.0 - 30.0 °C)                                                 |
| Ujian Kebocoran Tiub  : [ (o) LULUS SAMPEL KELOMPOK ]      [ ( ) GAGAL KEBOCORAN ]                                       |
| Nota Operator Lantai  : [ Isian 30.2 ml konsisten merentas 50 botol ujian pertama.                                    ] |
|                                                                                                                          |
| [ CETAK LABEL KELOMPOK ]                            [ SIMPAN LOG SEMENTARA ]   [ SAHKAN FASA PENGISIAN SELESAI -> ]      |
+--------------------------------------------------------------------------------------------------------------------------+
| BUTANG KELOMPOK SIAP: [ KONFIRMASI PRODUK JADI SELESAI (KUNCI & MINTA PELUNASAN) ] (Hanya aktif selepas Fasa 4 Selesai)   |
+--------------------------------------------------------------------------------------------------------------------------+

```

* **Hierarki Susun Atur:**
1. **Top Status Ribbon:** Memaparkan status bahan mentah PPIC dan sasaran siap kelompok.


2. **Sequential Stage Stepper:** 4 kad fasa pengeluaran dengan indikator visual berkunci. Fasa ke-4 disekat sepenuhnya selagi Fasa ke-3 belum disahkan selesai.


3. **Touch-Optimized Verification Form:** Input nombor dan butang radio besar yang mesra skrin sentuh tablet Android di lantai kilang.




* **Primary Action:** `[ SAHKAN FASA PENGISIAN SELESAI -> ]` yang merekodkan cop masa dan membuka fasa seterusnya.



---

### SCR-17: Logistics Dispatcher & Settlement Gate Hub

```
+--------------------------------------------------------------------------------------------------------------------------+
| PUSAT PELEPASAN LOGISTIK & PENGHANTARAN                                                    Kelompok: BAT-20260922-0001   |
+--------------------------------------------------------------------------------------------------------------------------+
| Klien: PT Cantik Jelita Utama   | Kuantiti: 5.000 Pcs Tube 30ml   | Nilai Baki Pelunasan: Rp 59.062.500,00               |
+--------------------------------------------------------------------------------------------------------------------------+
| (!) STATUS GERBANG PELUNASAN PRODUKSI (STRICT SETTLEMENT GATE):                                                          |
| +----------------------------------------------------------------------------------------------------------------------+ |
| | [TERVERIFIKASI LUNAS] Bayaran baki pengeluaran & kos penghantaran telah disahkan Finance (23/09/2026). (is_cleared=1)| |
| | Kebenaran pelepasan fizikal barang DILULUSKAN. Surat Jalan dan resi boleh diproses.                                 | |
| +----------------------------------------------------------------------------------------------------------------------+ |
|                                                                                                                          |
| [1] DOKUMEN PENGHANTARAN RASMI (PDF GENERATOR)                                                                           |
|     * Dokumen Surat Jalan : [ LIHAT & CETAK SURAT JALAN (SJ-20260923-004) ] -> Mengandungi 25 Master Box (5.000 pcs)    |
|     * SOP Simpanan Produk : [ LAMPIRKAN PANDUAN SIMPANAN (MAKS 30°C) ]    -> Wajib ditampal pada setiap karton luar     |
|                                                                                                                          |
| [2] KAEDAH PENGHANTARAN BARANG                                                                                           |
|     Pilihan Saluran : ( ) Armada Dalaman Syarikat         (*) Ekspedisi Rekanan Kargo Luar                               |
|     Nama Vendor     : [ Indah Logistik Cargo v ]          Jenis Servis  : [ Kargo Darat Berhawa Dingin v ]               |
|                                                                                                                          |
| [3] PENGAGIHAN NOMBOR RESI PENGHANTARAN                                                                                  |
|     Nomor Resi Rasmi: [ IDH-CGK-20260923-99120            ]  (Wajib dimasukkan sebaik kurier mengambil barang)           |
|     Muat Naik Bukti : [ Bukti_Resi_Fizikal.webp (180 KB)  ]  [ Padam / Ganti ]                                           |
|                                                                                                                          |
| [ BATAL ]                                                  [ SIMPAN DRAF ]   [ SAHKAN BARANG KELUAR & AGIH RESI (CS) -> ]|
+--------------------------------------------------------------------------------------------------------------------------+

```

* **Hierarki Susun Atur:**
* Bahagian paling atas diduduki oleh sepanduk pengesahan gerbang kewangan. Jika `is_settlement_cleared = 0`, butang cetakan dan input resi dikunci dengan label amaran: *"Barang ditahan di gudang kilang sehingga baki dijelaskan"*.


* Seksyen penjanaan dokumen Surat Jalan dan pelekat SOP suhu simpanan.


* Seksyen input resi pengangkutan dan muat naik foto bukti fizikal terkompresi $\le 300\text{ KB}$.




* **Primary Action:** `[ SAHKAN BARANG KELUAR & AGIH RESI (CS) -> ]` yang menghantar makluman segera ke Kumpulan Telegram CS untuk disampaikan kepada klien.



---

### SCR-18: QC Forensic Claim Investigation Workbench

```
+--------------------------------------------------------------------------------------------------------------------------+
| MAKLONOS QC FORENSIC INVESTIGATION                                                         Tiket Aduan: QC-CLM-2026-0012 |
+--------------------------------------------------------------------------------------------------------------------------+
| Kelompok: BAT-20260922-0001 | Klien: PT Cantik Jelita Utama | Aduan Klien: "Penutup tiub pecah & cecair bocor 200 pcs"    |
+--------------------------------------------------------------------------------------------------------------------------+
| PERBANDINGAN BUKTI FORENSIK (SIDE-BY-SIDE FORENSIC VIEW)                                                                 |
|                                                                                                                          |
| [A] BUKTI ADUAN KLIEN (PASCA TERIMA)                     [B] SAMPEL PERTINGGAL LAB (RETAIN SAMPLE KILANG)                |
| +-----------------------------------------------------+  +-----------------------------------------------------+         |
| |                                                     |  |                                                     |         |
| |        [ FOTO KARTON BASAH & KEMIK KLIEN ]          |  |         [ FOTO SAMPEL SIMPANAN RETAIN QC ]          |         |
| |             (Muat naik klien: WebP)                 |  |        (Disimpan di makmal pada 22/09/2026)         |         |
| |                                                     |  |                                                     |         |
| +-----------------------------------------------------+  +-----------------------------------------------------+         |
| Pemerhatian: Kotak kemik teruk, kesan hentakan kargo.    Pemerhatian: Sampel retain ujian tork penutup 100% utuh.        |
+--------------------------------------------------------------------------------------------------------------------------+
| ANALISIS & KEPUTUSAN LIABILITI KECACATAN QC                                                                              |
|                                                                                                                          |
| Jenis Liabiliti Liabiliti : [ ( ) INTERNAL_FAULT (Kilang) ]       [ (o) RECIPIENT_FAULT (Ekspedisi Luar / Klien) ]       |
| Status Keputusan Rasmi    : [ ( ) ACC RETUR BARANG        ]       [ (o) TOLAK RETUR (TUNTUTAN INSURANS)          ]       |
|                                                                                                                          |
| Hujah Siasatan QC (Wajib) :                                                                                              |
| +----------------------------------------------------------------------------------------------------------------------+ |
| | Ujian tork penutup tiub pada sampel simpanan makmal mencatatkan 1.8 N.m (memenuhi standard). Kerosakan pada gambar  | |
| | klien berpunca daripada himpitan objek berat semasa transit kargo pihak ketiga (surat jalan ditandatangani basah).   | |
| +----------------------------------------------------------------------------------------------------------------------+ |
|                                                                                                                          |
| [ CETAK BERITA ACARA QC (PDF) ]                                             [ SIMPAN SIASATAN ]   [ SAHKAN KEPUTUSAN QC ]|
+--------------------------------------------------------------------------------------------------------------------------+

```

* **Hierarki Susun Atur:**
* Bahagian tengah membawakan panel perbandingan visual forensik sebelah-menyebelah (*Side-by-Side View*).


* Pemilihan liabiliti kerosakan: `INTERNAL_FAULT` vs `RECIPIENT_FAULT`.


* Sekiranya `INTERNAL_FAULT` dipilih, sistem memaparkan sub-bahagian *"Pelepasan Kelompok Gantian Percuma"* secara automatik.




* **Primary Action:** `[ SAHKAN KEPUTUSAN QC ]` yang mengunci siasatan dan menjana Berita Acara rasmi untuk tindakan CS seterusnya.



---

### SCR-19: CRM Retention & Repeat Order Pipeline

```
+--------------------------------------------------------------------------------------------------------------------------+
| MaklonOS CRM | Pelanggan Sedia Ada: [ 84 Aktif ] | Sasaran Re-Order Bulan Ini: 18 Klien | PIC CRM: Rendi                 |
+--------------+--------------------------------------------------------------------------+--------------------------------+
| SALURAN PAIP PENGEKALAN PELANGGAN (RETENTION & REPEAT ORDER PIPELINE)                                                    |
|                                                                                                                          |
| [1. PENJAGAAN / NURTURING (42)]  [2. SASARAN RE-ORDER H-14 (18)]  [3. DRAF KONTRAK REPEAT (12)]  [4. RE-PRODUCTION (12)]   |
| +-----------------------------+  +-----------------------------+  +---------------------------+  +---------------------+ |
| | PT Cantik Jelita Utama      |  | Amanda Skincare             |  | CV Berkah Herbal          |  | Dermaglow Clinic    | |
| | KLN-20260922-0001           |  | KLN-20260710-0019           |  | KLN-20260601-0004         |  | KLN-20260512-0081   | |
| | Batch: 5.000 Pcs (23/09/26) |  | Stok dijangka habis dlm:    |  | Repeat: 10.000 Pcs        |  | Fasa: Mixing Pabrik | |
| | Formula: FOR-SKN-0089-A     |  | 10 Hari Lagi (!)            |  | Nilai: Rp 236.000.000     |  | Batch: BAT-2026-081 | |
| | Status: Produk Diterima ACC |  | Hubungi: 081992233441       |  | Menunggu DP Repeat        |  | Target: 30 Sep 2026 | |
| | [ Cadang Promosi Re-Order ] |  | [ Buka Borang Re-Order -> ] |  | [ Semak Status DP ]       |  | [ Pantau Kelompok ] | |
| +-----------------------------+  +-----------------------------+  +---------------------------+  +---------------------+ |
+--------------------------------------------------------------------------------------------------------------------------+
| PERINCIAN FORMULA ACUAN PESANAN ULANGAN (TERKUNCI & KONSISTEN)                                                           |
| Formula Asal Terbukti : FOR-2026-SKN-0089-A (Sunscreen Niacinamide Gel SPF 50)                                          |
| Pilihan Pesanan       : (o) Kuantiti Sama (5.000 pcs)    ( ) Penggandaan Kelompok (10.000 pcs - Diskaun Skala 5%)        |
|                                                                                                                          |
| [ + JANA INVOIS DP REPEAT ORDER ]                                               [ HUBUNGI KLIEN VIA WHATSAPP (TEMPLAT) ] |
+--------------------------------------------------------------------------------------------------------------------------+

```

* **Hierarki Susun Atur:**
* Papan Kanban 4 lajur saluran paip berasaskan anggaran kehabisan stok produk klien (`estimated_depletion_at`).


* Kad maklumat pelanggan memaparkan kod formula asal secara kekal supaya pesanan ulangan tidak perlu melalui proses penyelidikan sampel dari awal.




* **Primary Action:** `[ Buka Borang Re-Order -> ]` untuk terus menjana draf kontrak dan invois DP pesanan ulangan di bawah kawalan CRM.



---

## 7. Component Library (Phase 3 Additions)

### 7.1. Component: `SequentialStageStepper`

* **Tujuan:** Mengawal dan memaparkan fasa kemajuan fizikal 4 peringkat di lantai kilang.


* **Variants:**
* `state-locked`: Warna kelabu, ikon gembok kecil, tidak boleh ditekan.


* `state-active`: Warna biru langit (`#0284C7`), ikon roda berputar halus, borang input fasa terbuka di bawahnya.
* `state-completed`: Warna hijau (`#059669`), ikon tanda rait tebal, memaparkan nama operator dan cop masa penyiapan.




* **Peraturan:** Fasa $N+1$ hanya boleh bertukar kepada `state-active` apabila Fasa $N$ telah bertukar kepada `state-completed`.



### 7.2. Component: `SettlementGateLock`

* **Tujuan:** Menyekat tindakan fizikal logistik sekiranya baki pengeluaran belum dijelaskan.


* **Properties:** `isSettlementCleared: boolean`, `balanceAmount: number`, `invoicePdfUrl: string`.
* **Visual Behaviour:** Sekiranya `false`, membungkus seluruh kawasan butang pengangkutan dengan lapisan overlay kelabu separuh telus berserta sepanduk merah: *"Dilarang melepaskan barang. Baki invois belum disahkan oleh Kewangan"*.



### 7.3. Component: `ForensicProofComparator`

* **Tujuan:** Memaparkan perbandingan gambar aduan kerosakan klien dan sampel retain makmal.


* **Ciri-ciri:** Pembesar imej bersepadu (*synchronized zoom*), paparan metadata fail WebP, dan penanda perbandingan visual bagi memudahkan pegawai QC membuat justifikasi.



### 7.4. Component: `DepletionCountdownBadge`

* **Tujuan:** Menunjukkan amaran masa kehabisan stok produk klien dalam papan pemuka CRM.


* **Variants:**
* `safe`: $> 30$ hari (Lencana Hijau).
* `warning`: $14 - 30$ hari (Lencana Amber).
* `critical`: $\le 14$ hari (Lencana Merah Berkelip) — Menuntut tindakan segera follow-up pesanan ulangan.





### 7.5. Component: `LifecycleTerritoryModal`

* **Tujuan:** Menyekat staf CS daripada mencipta pesanan baharu untuk pelanggan yang telah berpindah status kepada CRM.


* **Content:** Paparan maklumat pemilikan akaun oleh Pegawai CRM, butang salin perbualan, dan butang tindakan pantas untuk memajukan pesanan ke grup Telegram CRM.



---

## 8. State UI untuk Screen Kunci

### SCR-16: SPV Production Floor Tracker

#### 1. Empty State

* **Visual:** Ikon tangki reaktor bersih tanpa kelompok aktif.
* **Teks:** *"Tiada kelompok sedia untuk diproses di lantai kilang."*
* **Sub-teks:** *"Kelompok baharu akan muncul sebaik sahaja PPIC mengesahkan ketersediaan bahan mentah."*


#### 2. Material Out-of-Stock State (Kelewatan Bahan PPIC)

* **Visual:** Sepanduk amaran jingga di atas stepper fasa.
* **Teks:** *"Pengeluaran Tertangguh: Bahan Mentah Kehabisan Stok (PO: PO-PPIC-2026-088)."*

* **Tindakan:** Butang menyerlah `[ Lakukan Penjadualan Semula Manual ]` untuk memasukkan tarikh anjakan lantai kilang.



#### 3. Production Finished State

* **Visual:** Kad perayaan hijau dengan pengesahan penyelesaian 4 fasa lengkap berserta cop masa.


* **Teks:** *"Kelompok BAT-20260922-0001 telah selesai dibungkus sepenuhnya. Isyarat invois pelunasan telah dihantar ke Kewangan."*


---

### SCR-18: QC Forensic Claim Investigation

#### 1. Under Investigation State

* **Visual:** Lencana amaran kuning berkelip pada nombor kelompok. Butang kelulusan retur dinyahaktifkan sehingga nota hujah siasatan diisi sekurang-kurangnya 30 aksara.



#### 2. Internal Fault Authorized State

* **Visual:** Sepanduk merah dengan lencana cop rasmi `RETUR DILULUSKAN`. Sistem memaparkan pautan nombor kelompok gantian percuma yang telah dijana ke antrian penimbangan semula.



#### 3. Recipient Fault Rejected State

* **Visual:** Sepanduk kelabu neutral dengan lencana `RETUR DITOLAK`. Butang muat turun *Berita Acara Siasatan Ekspedisi* tersedia untuk kegunaan CS.



---

## 9. Responsive Behaviour

```
+------------------------------------------------------------------------------------------+
| RESPONSIVE BREAKDOWN TAHAP 3                                                             |
+------------------------------------------------------------------------------------------+
| Desktop (>= 1200px) : Multi-column workbench (PPIC, Logistik, Kewangan, CRM Pipeline)    |
| Tablet  (768-1199px): Touch-first inspection cockpit (SPV Lantai Kilang & QC Makmal)    |
| Mobile  (< 768px)   : Bottom card stack, alert drawer (CS Quick Reschedule & Tracking)   |
+------------------------------------------------------------------------------------------+

```

### 9.1. Desktop ($> 1200\text{ px}$) — Meja Kerja Pejabat Pengurusan

* **CRM Pipeline (SCR-19):** Paparan 4 lajur Kanban penuh sebelah-menyebelah dengan keupayaan seret kad antara peringkat saluran paip pengekalan.
* **Logistics Hub (SCR-17):** Paparan panel terbelah (*Split-Screen*) antara borang butiran pengangkutan di sebelah kiri dan pratonton dokumen PDF Surat Jalan di sebelah kanan.



### 9.2. Tablet ($768\text{ px} - 1199\text{ px}$) — Tablet Android SPV Lantai Kilang (Bayu) & QC

* **Stepper Pengeluaran (SCR-16):** Stepper 4 fasa disusun secara mendatar padat dengan sasaran sentuhan minimum $48\text{ px} \times 48\text{ px}$ bagi memudahkan operator yang memakai sarung tangan kerja.


* **Borang Pengesahan Suhu & Ujian:** Menggunakan pad kekunci angka bersaiz besar (*numeric on-screen keypad*) untuk input bacaan instrumen kilang secara pantas.

### 9.3. Mobile ($< 768\text{ px}$) — Paparan Pantas CS & Pemandu Armada

* **Penjejakan Status Kelompok:** Antaramuka diubah suai menjadi kad menegak tunggal yang memaparkan fasa semasa dan anggaran tarikh siap.


* **Penghantaran Resi:** Butang satu klik *"Salin Pautan Resi Kargo"* yang memformat teks terus ke aplikasi WhatsApp untuk dihantar kepada pelanggan dengan segera.



---

## 10. Accessibility (A11y) & Usability Standards

### 10.1. Contrast Ratios (WCAG 2.1 AA Compliance)

* Teks amaran kelewatan bahan PO (`#92400E`) di atas latar kuning cair (`#FEF3C7`): Rasio kontras **5.4:1** (Melepasi standard WCAG AA 4.5:1).


* Teks status sekatan pelunasan (`#991B1B`) di atas latar merah cair (`#FEF2F2`): Rasio kontras **7.8:1** (Lolos WCAG AAA).


* Teks kod kelompok monoruang (`#0F172A`) di atas kad putih: Rasio kontras **14.5:1**.



### 10.2. Focus Order & Keyboard Navigation

* **SPV Reschedule Form Navigation (SCR-16):** Urutan kunci `Tab` bagi pelarasan tarikh manual mengikut susunan kronologi logik pengeluaran:

$$\text{Tarikh Timbang} \rightarrow \text{Tarikh Bancuh} \rightarrow \text{Tarikh Isi} \rightarrow \text{Tarikh Bungkus} \rightarrow \text{Tarikh Sasaran Siap} \rightarrow \text{Butang Simpan}$$



* **Lantai Kilang Kiosk Hotkeys:**
* `Spacebar`: Mengesahkan senarai semak SOP fasa aktif.
* `Ctrl + Enter` (atau `Cmd + Enter`): Mengesahkan penyiapan fasa semasa dan membuka fasa berikutnya.





### 10.3. Keperluan ARIA & Screen Reader

* Stepper pengeluaran fizikal menggunakan penandaan ARIA berstruktur:
```html
<nav aria-label="Kemajuan Fasa Pengeluaran Fizikal">
  <ol class="flex items-center">
    <li aria-current="step" aria-label="Fasa 3: Pengisian Cecair, Status Sedang Berjalan">
      <span>Fasa 3: Pengisian</span>
    </li>
    <li aria-disabled="true" aria-label="Fasa 4: Pembungkusan Produk, Status Terkunci Menunggu Fasa 3">
      <span>Fasa 4: Pembungkusan</span>
    </li>
  </ol>
</nav>

```


* Gerbang kuncian Surat Jalan logistik wajib menyertakan atribut makluman amaran dinamik:
```html
<div role="alert" aria-live="assertive" id="settlement-lock-msg">
  Pelepasan barang disekat: Invois pelunasan baki pengeluaran belum disahkan lunas oleh Bahagian Kewangan.
</div>

```


* Saluran paip pengekalan CRM (SCR-19) menyertakan `role="region"` dengan `aria-live="polite"` untuk membacakan penukaran kad pelanggan ke peringkat sasaran re-order apabila dikemas kini.



---

Dokumen Design Brief MaklonOS Tahap 3 ini melengkapkan keseluruhan spesifikasi reka bentuk sistem secara *end-to-end* (Tahap 1, 2, dan 3). Dengan garis panduan fasa pengeluaran berurutan, gerbang pelunasan logistik yang ketat, modul siasatan forensik QC, dan pengasingan akaun CRM, pasukan jurutera frontend dan pereka antara muka boleh membina sistem tanpa sebarang keraguan fungsian.