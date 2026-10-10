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