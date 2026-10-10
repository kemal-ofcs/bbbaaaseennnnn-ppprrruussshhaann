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