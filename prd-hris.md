# PRD — HRIS (Kepegawaian)

Status (10 Nov 2026): **PRD final, belum ada kode.** Semua keputusan (Q-1
sampai Q-38) sudah dijawab pemilik (§13, §14). Perubahan arsitektur A-1, A-3,
A-4, A-5 disetujui; A-2 ditolak (Q-38). "Urutan pengerjaan fase 1" ada di §16
(jawaban Q-39 sampai Q-46 mengubah sebagian §5). **Fase 1 selesai** (§16.9),
`bun run check` penuh lulus (10 Nov 2026). **Fase 2 dibangun** (§17, jawaban
Q-47 sampai Q-54; catatan dan penyimpangan di §17.12), `bun run check` penuh
belum dijalankan (pemilik). **Fase 3 dibangun** (§18, jawaban Q-55 sampai
Q-58; catatan dan penyimpangan di §18.11), `bun run check` penuh lulus
(10 Nov 2026). **Fase 4 dibangun** (§19, jawaban Q-59 sampai Q-62; catatan
dan penyimpangan di §19.11), `bun run check` penuh belum dijalankan (pemilik).
**Fase 5 dibangun** (§20, jawaban Q-63 sampai Q-70; catatan dan penyimpangan
di §20.13), `bun run check` penuh belum dijalankan (pemilik).

---

## 1. Masalah

Aplikasi ini sudah mengurus absensi, shift, libur, gaji, pajak, BPJS, dan kasbon.
Yang belum ada adalah pekerjaan HRD di sekitarnya:

- struktur organisasi (cabang, divisi, jabatan, siapa atasan siapa);
- biodata, kontrak, dan dokumen karyawan;
- pengajuan cuti, izin, sakit, lembur, tukar shift, dinas luar, reimbursement,
  dengan persetujuan;
- surat peringatan, karyawan keluar, dan pesangon;
- penilaian kinerja, rekrutmen, dan pelatihan;
- pengingat kontrak habis, dokumen kedaluwarsa, dan SP berakhir.

Sekarang Izin/Sakit hanya bisa dicatat lewat Koreksi Admin, tanpa jejak siapa
yang meminta, siapa yang menyetujui, dan berapa sisa jatah cuti.

## 2. Apakah fitur ini masuk aplikasi ini?

**Ya.** Hampir semua yang dibutuhkan HRIS bergantung pada data yang sudah ada:

| Kebutuhan HRIS | Yang sudah ada |
| :-- | :-- |
| Daftar karyawan | `master_data` |
| Hari wajib masuk | `wajib_masuk` / `wajibMasuk` (shift + libur) |
| Status Izin/Sakit di laporan | `laporan-kehadiran.ts` (kode S, I) |
| Lembur dan tarifnya | rekap payroll + `overtime_tier_rules` (PP 35/2021) |
| PTKP | `salary_configs.ptkp_status` |
| Akun yang tertaut ke karyawan | `master_operator.id_karyawan` (pola driver) |
| Persetujuan dengan sidik isi | `sidik_baris` pengajuan pembelian (v30) |
| Riwayat append-only, status diturunkan | `drv_laporan`, `inventory_mutasi` |
| Foto/berkas di luar snapshot | `absensi_foto`, `inventory_penerimaan_foto` |
| Cetak A4 dari browser | `cetakTandaTerimaUpah.ts` |
| Pemberitahuan grup | modul Telegram v33 |

**Batasnya:** self-service karyawan (karyawan login sendiri) ditunda (Q-3).
Formulir lamaran publik tidak dibuat (Q-17). Integrasi ke sistem luar (BPJS
online, e-Bupot DJP, bank) di luar cakupan.

## 3. Perubahan arsitektur yang butuh persetujuan

Sesuai AGENTS.md aturan 3. **A-1, A-3, A-4, A-5 disetujui pemilik (10 Nov
2026) dengan usulan di kolom kanan.** A-2 ditolak, dibiarkan sebagai catatan:

| # | Perubahan | Kenapa perlu | Usulan paling aman |
| :-- | :-- | :-- | :-- |
| A-1 | **Divisi menjadi master** | Q-6, Q-11, Q-12 | §5.2: tabel master + daftar nama lama. Kolom teks `divisi` di tabel lama TIDAK dihapus |
| A-2 | ~~**Cakupan bawahan di RBAC**~~ | **Ditolak (Q-38).** Atasan melihat semua karyawan | §10.2: hanya pengaman "tidak untuk diri sendiri" |
| A-3 | **Absensi membaca pengajuan yang disetujui** | Cuti tidak boleh jadi Alfa | §6.6: pola `PELAPOR_PERJALANAN_SQL` driver, tanpa menulis baris ke `absensi_harian` |
| A-4 | **Payroll membaca HRIS** | Q-14, Q-15, Q-20 | Titik kait di `payroll/commands.rs` dan `computePayrollRecap`, sama seperti kasbon |
| A-5 | **Bidang Telegram baru `hrd`** | Q-24 | Kejadian baru baru dinyalakan setelah semua perangkat diperbarui (perangkat lama membatalkan kejadian yang tidak dikenalnya) |

## 4. Istilah

| Istilah | Arti |
| :-- | :-- |
| **HRD** | Pemegang izin pemutus pengajuan (`hr.request.decide`). Bisa lebih dari satu orang. |
| **Atasan** | Akun operator yang tertaut ke satu karyawan (Q-25) dan memegang izin pengaju. Bisa melihat dan mengajukan untuk semua karyawan (Q-38). |
| **Atasan langsung** | Kolom `id_atasan` di data karyawan. Hanya informasi struktur dan penilai kinerja bawaan; tidak membatasi akses (Q-38). |
| **Pengajuan** | Satu permintaan untuk satu karyawan: cuti, izin, sakit, lembur, tukar shift, dinas luar, atau reimbursement. |
| **Jenis pengajuan** | Baris master yang menentukan alur, boleh-tidaknya urgent, dan dampak gaji (Q-2, Q-10, Q-15). |
| **Urgent** | Pengajuan yang langsung disetujui atasan. HRD wajib menandainya "Diketahui" (Q-9). |
| **Jatah cuti** | Hak cuti tahunan dikurangi pemakaian, ditambah/dikurangi penyesuaian. Tidak pernah disimpan sebagai angka. |
| **Periode cuti** | Rentang berlakunya jatah: tahun kalender atau ulang tahun masuk kerja (Q-7). |

## 5. Fase 1 — Organisasi, data karyawan, kontrak, dokumen

### 5.1 Struktur organisasi (Q-1, Q-6, Q-11)

Tingkatannya tetap: **Cabang → Divisi → Jabatan**. Yang diedit hanya isinya,
di Pengaturan tab baru "Organisasi" (izin `hr.org.manage`).

- Perusahaan satu kantor cukup punya satu cabang. Cabang bawaan `Pusat` dibuat
  saat migrasi. Tidak di-seed saat provisioning, dengan alasan yang sama
  seperti `company_profile` (aturan 29).
- Divisi dan jabatan **tidak pernah dihapus**. Menonaktifkan menyembunyikannya
  dari pilihan baru, sedangkan karyawan lama tetap merujuknya.
- Nama unik ditegakkan di aplikasi (`assert_unique`), tidak dengan `UNIQUE` di
  skema (aturan 32). Kembaran dari dua perangkat offline ditandai `nama_ganda`,
  sama seperti kolom tambahan inventaris.
- Form karyawan memakai `PilihCari` untuk cabang, divisi, jabatan, dan atasan.
- **Atasan langsung** (`id_atasan`) adalah satu karyawan lain. Siklus (A atasan
  B, B atasan A) ditolak saat disimpan. Bila siklus tetap lahir dari dua
  perangkat offline, ditandai `atasan_siklus` untuk dibetulkan HRD. Karena
  `id_atasan` tidak membatasi akses (Q-38), siklus tidak merusak apa pun selain
  tampilan struktur.

Divisi dan jabatan berlaku di semua cabang (Q-29). Karyawan memilih cabang,
divisi, dan jabatan secara terpisah; "Gudang Cabang A" adalah kombinasi, bukan
divisi baru.

### 5.2 Ganti nama ikut ke riwayat (Q-12, perubahan A-1)

Sekarang nama divisi disalin sebagai teks ke `master_data.divisi`,
`id_card.divisi`, `log_scan.divisi`, `absensi_harian.kelas_divisi`,
`backup_karyawan.divisi_asal/divisi_pengganti`, dan `koreksi_admin.divisi`.

**Usulan: nama lama dipetakan, riwayat tidak ditulis ulang.**

- Tabel `hr_divisi_nama` mencatat setiap nama yang pernah dipakai suatu divisi.
  Laporan menampilkan nama kini lewat pemetaan teks lama → `id_divisi` → nama
  sekarang.
- Nama lama **dicadangkan** dan tidak boleh dipakai divisi lain (pola kode barang
  terhapus). Tanpa itu, "Gudang" lama dan "Gudang" baru tidak bisa dibedakan.
- `master_data.divisi` tetap diisi teks nama sekarang, supaya scanner, kartu ID,
  inventaris, dan semua kueri lama tetap jalan tanpa diubah. Mengganti nama
  divisi memperbarui kolom itu untuk karyawannya, di transaksi yang sama.

Alternatif yang **tidak** dipilih: menulis ulang teks di seluruh tabel riwayat.
Itu berarti ribuan baris berubah, ikut outbox atau snapshot, dan baris yang
masih mengantre di perangkat offline akan kembali membawa nama lama.

**Migrasi data lama:** setiap teks `master_data.divisi` yang berbeda menjadi
satu divisi di cabang `Pusat`. Teks di tabel riwayat yang tidak cocok dengan
divisi mana pun tetap tampil apa adanya.

### 5.3 Data karyawan lengkap

Ditambahkan ke data kerja yang sudah ada:

| Kelompok | Isi | Izin baca |
| :-- | :-- | :-- |
| Kerja | cabang, divisi, jabatan, atasan, tanggal masuk, status kerja | `employees.view` |
| Pribadi | NIK, nomor KK, tempat/tanggal lahir, jenis kelamin, agama, status nikah, alamat KTP & domisili, pendidikan terakhir, kontak darurat | `hr.personal.view` |
| Keuangan | bank, nomor rekening, nama pemilik rekening, NPWP, nomor BPJS Kesehatan & Ketenagakerjaan | `hr.finance.view` |

- PTKP tetap di `salary_configs.ptkp_status`, tidak diduplikasi.
- Tanggal masuk bawaannya `master_data.tanggal_mulai_aktif` lama, dan bisa
  dikoreksi.
- Nomor rekening dan NIK disamarkan di daftar (`**** 1234`) dan baru tampil utuh
  di rincian bagi pemegang izinnya.
- Validasi format di Rust dan TS kembar (NIK 16 digit, NPWP 15/16 digit, nomor
  HP lewat `contact.ts` aturan 40).

Data pribadi dan keuangan **tidak** ikut tersinkron ke perangkat (Q-30):
`hr_profil` cloud-only seperti `master_operator`, dibaca dan ditulis lewat
route/command yang langsung ke database cloud, hanya saat online.

### 5.4 Kontrak dan status kerja

Setiap kontrak atau perpanjangan adalah satu baris `hr_kontrak` yang
append-only. **Status kerja tidak disimpan**: diturunkan dari kontrak terakhir
yang berlaku pada tanggal itu.

| Jenis | Aturan yang diperiksa (peringatan, bukan penolakan) |
| :-- | :-- |
| PKWTT (tetap) | masa percobaan maks 3 bulan, hanya untuk PKWTT |
| PKWT (kontrak) | wajib tanggal selesai; total PKWT berturut-turut maks 5 tahun (PP 35/2021) |
| Harian lepas | kurang dari 21 hari kerja per bulan; 3 bulan berturut-turut ≥ 21 hari menjadi tanda "perlu diangkat PKWTT" |
| Magang | wajib tanggal selesai |

Angka-angka hukum di PRD ini adalah **bawaan yang bisa diubah**, dan perlu dicek
ulang oleh konsultan HR atau hukum klien sebelum dipakai.

### 5.5 Dokumen (Q-16)

Data dokumen wajib, berkas opsional.

- Jenis bawaan: KTP, KK, NPWP, Ijazah, Kontrak Kerja, Sertifikat, SIM, Surat
  Dokter, Lainnya. Bisa ditambah di Pengaturan.
- Data: nomor, tanggal terbit, tanggal kedaluwarsa (opsional), catatan.
- Berkas: JPEG/PNG/WEBP/PDF, batas ukuran ditegakkan Rust sebelum masuk outbox
  (aturan 43). Usulan batas 1 MB per berkas, maks 5 berkas per dokumen.
- Berkas **di luar snapshot**, didorong per berkas dan ditarik per id saat
  dibuka (pola `absensi_foto`, aturan 42). Daftar dokumen tidak pernah membawa
  isi berkas.
- Izin `hr.document.view` / `hr.document.manage`.

## 6. Fase 2 — Mesin pengajuan, cuti, izin, sakit

### 6.1 Alur (Q-5, Q-9)

```
Karyawan ──WA/lisan──▶ Atasan
                         │ ajukan di aplikasi + alasan
                         ▼
              ┌── Menunggu HRD ──┐
              │                  │
        HRD Setujui         HRD Tolak
              │                  │
          Disetujui           Ditolak

Urgent (bila jenisnya mengizinkan):
Atasan ──ajukan + ACC sekaligus──▶ Disetujui (urgent) ──HRD──▶ Diketahui
```

- **Pengaju** adalah pemegang `hr.request.submit` (atasan atau HRD), untuk
  karyawan mana pun (Q-38). Tidak dibatasi atasan langsung.
- **Tidak untuk diri sendiri:** akun yang tertaut ke karyawan X tidak bisa
  mengajukan Urgent untuk X, dan tidak bisa memutus pengajuan untuk X. Pengajuan
  biasa untuk dirinya sendiri boleh, dan tetap menunggu HRD. Diperiksa di
  backend, kembar Rust ↔ TS.
- **Pemutus** adalah pemegang izin pemutus jenis itu. Pengaju tidak boleh
  memutuskan pengajuannya sendiri kecuali Superadmin (pola `validate_pemutus`).
  Ini jadi masalah di perusahaan yang HRD-nya hanya satu orang (Q-28).
- **Urgent** langsung berlaku. HRD tidak bisa membatalkannya (Q-9). Pengajuan
  tetap muncul di daftar "Perlu diketahui" sampai HRD menandainya.
- **Pembatalan:** pengaju boleh membatalkan selama masih Menunggu. Pengajuan
  yang sudah Disetujui hanya bisa dibatalkan pemutus, lewat pengajuan
  pembatalan dengan alasan. Pengajuan urgent juga bisa dibatalkan dengan jalan
  ini, misalnya bila karyawan ternyata masuk. Ini **bukan** HRD menganulir
  urgent, karena alasannya dicatat dan atasan diberi tahu.
- Atasan mengajukan untuk dirinya sendiri: boleh sebagai pengajuan biasa, dan
  tetap menunggu HRD (Q-36, Q-38).

### 6.2 Status tidak disimpan

Pola `drv_laporan` dan pengajuan pembelian:

- `hr_pengajuan` berisi isi pengajuan beserta `sidik` (SHA-256 isi kanonik,
  kembar Rust ↔ TS).
- `hr_pengajuan_keputusan` append-only: `Setujui`, `Tolak`, `Setujui Urgent`,
  `Diketahui`, `Batal`. Setiap keputusan membawa `sidik` isi yang dilihat
  pemutus.
- Status diturunkan: keputusan final pertama menurut `diterima_cloud` yang
  sidiknya cocok dengan isi sekarang. Suntingan setelah keputusan menggugurkan
  keputusan itu.
- **Cloud tidak pernah menolak keputusan.** Dua HRD offline yang memutus
  berbeda menghasilkan tanda `keputusan_ganda` untuk ditinjau, dan yang pertama
  sampai di cloud yang berlaku.
- Tanggal dan jam keputusan dicatat dua: jam perangkat untuk tampilan, dan
  `diterima_cloud` (jam database cloud) untuk urutan.

### 6.3 Jenis pengajuan (Q-2, Q-10, Q-13, Q-15)

Master `hr_jenis_pengajuan`, disunting di Pengaturan → Organisasi:

| Kolom | Arti |
| :-- | :-- |
| `kelompok` | `Cuti`, `Izin`, `Sakit`, `Lembur`, `Tukar Shift`, `Dinas Luar`, `Reimburse` (tetap, menentukan isian form) |
| `nama` | bisa diganti, mis. "Cuti Menikah" |
| `izin_pemutus` | `hr.request.decide` (HRD) atau `reimburse.decide` (Keuangan). Ini wujud "penyetuju diatur per jenis" |
| `boleh_urgent` | 0/1 |
| `potong_jatah` | 0/1, hanya kelompok Cuti |
| `dampak_gaji` | `Dibayar`, `Potong Gaji`, `Tidak Berpengaruh` |
| `maks_hari` | batas per pengajuan, kosong = tanpa batas |
| `wajib_dokumen` | 0/1, mis. surat dokter untuk sakit > 1 hari |

Bawaannya (bisa diubah, dicek ulang klien):

| Nama | Kelompok | Potong jatah | Gaji | Urgent | Maks hari |
| :-- | :-- | :-- | :-- | :-- | :-- |
| Cuti Tahunan | Cuti | ya | Dibayar | tidak | — |
| Cuti Menikah | Cuti | tidak | Dibayar | tidak | 3 |
| Menikahkan / khitan / baptis anak | Cuti | tidak | Dibayar | tidak | 2 |
| Istri melahirkan / keguguran | Cuti | tidak | Dibayar | ya | 2 |
| Duka keluarga inti | Cuti | tidak | Dibayar | ya | 2 |
| Duka anggota rumah | Cuti | tidak | Dibayar | ya | 1 |
| Cuti Melahirkan | Cuti | tidak | Dibayar | tidak | 90 |
| Keguguran | Cuti | tidak | Dibayar | ya | 45 |
| Haid hari 1–2 | Izin | tidak | Dibayar | ya | 2 |
| Sakit | Sakit | tidak | Dibayar | ya | — |
| Izin Dibayar | Izin | tidak | Dibayar | ya | — |
| Izin Tidak Dibayar | Izin | tidak | Potong Gaji | ya | — |

UU KIA (UU 4/2024) memungkinkan cuti melahirkan hingga 6 bulan dengan syarat
tertentu dan upah bertingkat. Itu ditangani dengan menyunting `maks_hari` dan
mencatat bulan ke-5 dan ke-6 sebagai jenis tersendiri. Hitungan upah 75% tidak
dibuat otomatis di fase ini.

### 6.4 Hari yang dihitung

- Cuti dan izin dicatat sebagai rentang tanggal, opsional setengah hari (hanya
  untuk kelompok Izin).
- **Hari terpakai = hari dalam rentang yang `wajib_masuk` untuk karyawan itu**,
  memakai fungsi yang sudah ada. Libur shift dan hari libur tidak memotong
  jatah.
- Pengajuan yang bertumpuk dengan pengajuan Disetujui/Menunggu lain untuk
  karyawan yang sama ditolak di perangkat. Yang lahir dari dua perangkat
  offline ditandai `bertumpuk`.
- Tanggal yang sudah lewat boleh diajukan (sakit kemarin), tapi ditolak bila
  periodenya sudah tutup buku gaji (proses gaji `PAID` mencakup tanggal itu).

### 6.5 Jatah cuti tahunan (Q-7, Q-8)

Jatah tidak disimpan:

```
jatah = hak periode
      + penyesuaian (saldo awal migrasi, carry-over, koreksi HRD)
      − hari terpakai pengajuan Cuti ber-potong_jatah yang Disetujui
```

Pengaturan per perusahaan (`setting_gex_system`):

| Kunci | Pilihan | Bawaan |
| :-- | :-- | :-- |
| `hr_cuti_periode` | `kalender` / `ulang_tahun_kerja` | `ulang_tahun_kerja` |
| `hr_cuti_hak` | angka hari | 12 |
| `hr_cuti_syarat_bulan` | masa kerja minimum | 12 |
| `hr_cuti_prorata` | 0/1, karyawan baru di periode kalender dapat prorata | 0 |
| `hr_cuti_sisa` | `hangus` / `dibawa` / `diuangkan` | `hangus` |
| `hr_cuti_bawa_maks` | maks hari dibawa | 6 |
| `hr_cuti_bawa_bulan` | dibawa harus dipakai dalam N bulan | 3 |

- Carry-over dan "diuangkan" dicatat sebagai baris penyesuaian berid
  deterministik (`bawa:<karyawan>:<periode>`), supaya dua perangkat yang
  menghitung pergantian periode bersamaan menghasilkan PK yang sama.
- "Diuangkan" memakai upah harian dari `salary_configs` dan masuk gaji
  berikutnya (A-4).
- Mengubah `hr_cuti_periode` setelah ada data hanya berlaku untuk periode
  berikutnya. Periode berjalan tetap memakai aturan lama.
- Jatah minus diperbolehkan (HRD menyetujui melebihi jatah) dan tampil sebagai
  peringatan, pola "Stok minus" inventaris.

### 6.6 Dampak ke absensi (perubahan A-3)

Pola driver: pengajuan yang Disetujui **tidak menulis** baris `absensi_harian`.
Pengajuan dibaca lewat SQL kembar `PENGAJUAN_BERLAKU_SQL`:

- Generate Alfa melewati karyawan + tanggal yang ditutup pengajuan berlaku.
- Audit absensi tidak menilai tanggal itu.
- Laporan kehadiran menampilkan kode C (Cuti), I, S, DL (Dinas Luar). Bila ada
  scan Hadir di tanggal itu, Hadir menang, sama dengan aturan laporan sekarang
  (Q-34).
- Koreksi Admin Sakit/Izin/Dispen yang sudah ada **tetap berfungsi** dan tidak
  dimigrasi. Untuk baris baru, HRD diarahkan ke pengajuan.

### 6.7 Dampak ke gaji (Q-15, perubahan A-4)

- `Dibayar`: hari itu dihitung hadir untuk FLAT_DAILY. Untuk HOURLY memakai
  `jam_kerja_normal_menit` shift (perlu dicek di rumus rekap saat fase 2).
- `Potong Gaji`: tidak dibayar. Untuk gaji bulanan, potongan per hari mengikuti
  rumus potongan yang sudah ada di payroll. Bila belum ada, rumusnya dirinci di
  awal fase 2.
- `Tidak Berpengaruh`: hanya menghapus Alfa.

## 7. Fase 3 — Lembur (SPL), tukar shift, dinas luar

### 7.1 Lembur (Q-14)

Pengaturan `hr_lembur_mode`:

- `otomatis` (bawaan, perilaku sekarang): jam lembur dari absensi dibayar, SPL
  hanya administrasi.
- `spl`: lembur dibayar = **min(jam SPL disetujui, jam lembur absensi)** per
  tanggal. Lembur tanpa SPL tampil "lembur tanpa SPL" di rekap untuk ditinjau,
  tidak dibayar.

SPL berisi tanggal, jam mulai, jam selesai, dan pekerjaan. Melebihi 4 jam/hari
atau 18 jam/minggu (PP 35/2021) diperingatkan, tidak ditolak. Tarif tetap dari
`overtime_tier_rules`.

### 7.2 Tukar shift

Dua karyawan bertukar jadwal pada tanggal tertentu, diajukan atasan keduanya
(atau HRD). Ini **menyentuh inti scanner**, karena shift yang berlaku untuk
sebuah scan berubah (`scanner.rs` ↔ `attendance-processor.ts`). Rinciannya
ditulis di awal fase 3 setelah membaca jalur `backup_karyawan`, yang sudah
menangani pengganti per tanggal. Usul awal: tukar shift yang disetujui
menghasilkan dua penugasan pengganti memakai mekanisme yang sudah ada, tanpa
mesin jadwal kedua.

### 7.3 Dinas luar

Karyawan bertugas di luar dan tidak scan. Pengajuan berlaku diperlakukan seperti
laporan perjalanan driver: tidak di-Alfa-kan, tidak diaudit, dihitung hari hadir
(`HARI_HADIR_SQL` diperluas). Uang dinas diajukan terpisah sebagai
reimbursement.

## 8. Fase 4 — Reimbursement (Q-20)

- Kategori (Transport, Kesehatan, Makan, Dinas, Lainnya) bisa disunting. Batas
  per kategori per bulan bersifat opsional dan hanya peringatan.
- Nominal `INTEGER` rupiah (aturan 13). Foto nota 1–5, pola
  `inventory_penerimaan_foto` (di luar snapshot, MIME dan ukuran diperiksa Rust
  dan handler cloud).
- Pemutus menurut `izin_pemutus` jenisnya, bawaannya `reimburse.decide`
  (Keuangan). Nominal yang disetujui boleh lebih kecil dari yang diajukan,
  dengan alasan.
- Pengaturan `hr_reimburse_bayar`:
  - `gaji`: masuk proses gaji berikutnya sebagai tambahan **tidak kena pajak**,
    lewat titik kait yang sama dengan kasbon (A-4). Bukan baris
    `payroll_components`, karena kolomnya `REAL` dan berlaku per kelompok,
    bukan per klaim.
  - `terpisah`: dibayar Keuangan, pola `drv_upah_bayar` (append-only,
    pembatalan `batal-<id>`, status bayar diturunkan, bayar ganda ditandai
    bukan ditolak).
- Pembayaran dicatat ke Pembukuan lewat jurnal manual (Q-31); CHECK
  `keu_jurnal.sumber` tidak disentuh.

## 9. Fase 5 — Surat peringatan dan karyawan keluar

### 9.1 SP (Q-22)

- `hr_sp`: tingkat (SP1/SP2/SP3), tanggal, pelanggaran, masa berlaku (bawaan 6
  bulan, PP 35/2021 Pasal 52; bisa diubah per perusahaan), penanda tangan.
- **Eskalasi:** form SP mengusulkan tingkat = tingkat SP aktif tertinggi + 1.
  HRD boleh memilih lain dengan alasan. SP3 aktif memunculkan tombol "Mulai
  proses keluar".
- **Cetak A4** dari browser memakai kop `company_profile` (pola
  `cetakTandaTerimaUpah`), disembunyikan di Mobile.
- Pencabutan = baris `batal-<id_sp>` dengan alasan, bukan menghapus.
- Izin `hr.warning.view` / `hr.warning.manage`, dan `hr.warning.cancel` sensitif.

### 9.2 Karyawan keluar (Q-19)

Alasan (bawaan dari PP 35/2021, bisa disunting): Resign, Habis Kontrak, PHK
Efisiensi, PHK Pelanggaran, Pensiun, Meninggal, Sakit Berkepanjangan, Lainnya.

**Checklist keluar** dibaca dari modul yang ada:

- barang inventaris yang dipinjam dan belum kembali;
- sisa kasbon (`pinjaman_aktif`);
- sisa cuti (masuk UPH bila "diuangkan");
- akun operator yang tertaut dinonaktifkan;
- kartu ID ditarik (centang manual).

**Usulan pesangon**, angka awal yang boleh diubah dengan alasan:

- UP menurut masa kerja: < 1 tahun = 1× upah, naik 1× per tahun, maksimal 9×
  untuk ≥ 8 tahun.
- UPMK: 3–6 tahun 2×, naik 1× per 3 tahun, maksimal 10× untuk ≥ 24 tahun.
- UPH: sisa cuti, ongkos pulang, dan lain-lain sesuai PK/PP/PKB.
- Pengali UP dan UPMK per alasan disimpan di tabel yang bisa disunting.
  Bawaannya dari PP 35/2021 dan wajib dicek ulang klien.
- PKWT yang berakhir: uang kompensasi = masa kerja (bulan) / 12 × upah.
- Upah = upah pokok + tunjangan tetap dari `salary_configs`/komponen.

**Saat berlaku** (tanggal efektif), dalam satu transaksi (aturan 33):
`master_data.status_aktif = 'Nonaktif'`, `tanggal_selesai_aktif` diisi, dan
akun tertaut dinonaktifkan. Pembayaran pesangon dicatat lewat jurnal manual
(sama seperti upah driver, Q-28 driver; Q-31 di sini).

`hr.offboard.manage` sensitif.

## 10. Hak akses

### 10.1 Izin baru

| Izin | Sensitif | Paket bawaan |
| :-- | :-- | :-- |
| `hr.org.manage` | | HRD |
| `hr.personal.view` / `hr.personal.manage` | | HRD |
| `hr.finance.view` / `hr.finance.manage` | ya (manage) | HRD |
| `hr.contract.manage` | | HRD |
| `hr.document.view` / `hr.document.manage` | | HRD |
| `hr.request.view` | | HRD, Atasan |
| `hr.request.submit` | | HRD, Atasan |
| `hr.request.urgent` | | Atasan |
| `hr.request.decide` | ya | HRD |
| `hr.leave.adjust` (koreksi jatah) | ya | — |
| `reimburse.decide` | ya | — (Keuangan) |
| `hr.warning.view` / `hr.warning.manage` | | HRD |
| `hr.warning.cancel` | ya | — |
| `hr.offboard.manage` | ya | — |
| `hr.performance.view` / `hr.performance.assess` / `hr.performance.config` | | HRD; assess juga Atasan |
| `hr.recruit.view` / `hr.recruit.manage` | | HRD |
| `hr.training.view` / `hr.training.manage` | | HRD |

Izin sensitif masuk `SENSITIVE_MUTATION_PERMISSIONS` dan `NOT IN` seed Admin
Rust. Role bawaan baru: **HRD** dan **Atasan** (Q-25), bisa diubah Superadmin.
Data rahasia diatur per izin (Q-23).

### 10.2 Tanpa cakupan bawahan (Q-38)

- Akses HRIS hanya ditentukan izin. Pemegang izin melihat semua karyawan, sama
  seperti modul lain hari ini.
- Satu-satunya saringan per orang: aturan "tidak untuk diri sendiri" (§6.1),
  dibandingkan dengan `id_karyawan` sesi, di backend (aturan 10).
- Data rahasia tetap dijaga izinnya masing-masing (Q-23): atasan yang tidak
  diberi `hr.personal.view` atau `hr.finance.view` tidak melihat NIK atau
  rekening siapa pun.
- Halaman `/hris/*` dijaga `canAccessArea` (aturan 36).

## 11. Fase 6–8

### 11.1 Fase 6 — Penilaian kinerja (Q-18)

- Template per jabatan: aspek + bobot (total 100%). Satu template bisa dipakai
  banyak jabatan.
- Periode diatur per perusahaan: bulanan, kuartal, semester, atau tahunan.
- Penilai bawaan = atasan langsung; pemegang `hr.performance.assess` lain boleh
  menilai, dan namanya tercatat. Tidak boleh menilai dirinya sendiri. HRD
  memfinalkan.
- Aspek bertipe `Otomatis Disiplin` dihitung dari absensi periode itu (hadir,
  terlambat, Alfa) dengan rumus yang ditampilkan ke penilai. Rumusnya dirinci
  di awal fase 6.
- Skala (Q-37): aspek 1–5, nilai akhir 0–100 berbobot, predikat bisa disunting
  (bawaan ≥ 90 Sangat Baik).
- Nilai yang sudah final tidak bisa diubah, hanya dikoreksi dengan penilaian
  koreksi berjejak.

### 11.2 Fase 7 — Rekrutmen (Q-17) dan pelatihan (Q-26)

**Rekrutmen**, HRD input saja:

- Lowongan: jabatan, divisi, cabang, jumlah, tanggal buka/tutup, status.
- Pelamar: data dasar, sumber (Jobstreet, referensi, dan seterusnya), CV
  opsional (berkas, pola dokumen).
- Tahap: Lamaran → Seleksi Berkas → Wawancara → Tes → Penawaran → Diterima /
  Ditolak. Riwayat tahap append-only.
- **Diterima → "Jadikan karyawan"** membuka form karyawan terisi, lalu membuat
  `master_data` dengan token dan QR `id|token` (aturan 31) serta kontrak
  pertama.
- Retensi (Q-33, UU PDP): pelamar yang tidak diterima dihapus otomatis 12 bulan
  setelah lowongannya ditutup (bisa diubah); HRD bisa menghapus lebih cepat.

**Pelatihan:**

- Pelatihan: nama, penyelenggara, tanggal, biaya (INTEGER), peserta.
- Sertifikat masuk Dokumen jenis Sertifikat, dengan kedaluwarsa untuk pengingat.
- Biaya tidak otomatis menjadi jurnal di fase ini.

### 11.3 Fase 8 — Pengingat dan Telegram HRD (Q-24, perubahan A-5)

Kartu "Perlu perhatian" di beranda HRIS (selalu ada) dan bidang Telegram `hrd`
(dinyalakan Superadmin):

| Kejadian | Kapan | Id deterministik |
| :-- | :-- | :-- |
| Kontrak PKWT berakhir | H-30 dan H-7 | `hr-kontrak:<id>:<H>` |
| Masa percobaan berakhir | H-7 | `hr-coba:<id>` |
| Dokumen kedaluwarsa | H-30 | `hr-dok:<id>` |
| SP berakhir | hari H | `hr-sp:<id>` |
| Pengajuan menunggu > 2 hari | harian | `hr-tunggu:<tanggal WIB>` (ringkasan) |
| Urgent belum diketahui | harian | `hr-urgent:<tanggal WIB>` (ringkasan) |
| Ulang tahun kerja | hari H | `hr-ultah:<id>:<tahun>` |

Isi pesan (Q-32): nama + jabatan saja. NIK, nominal gaji,
alasan sakit, dan isi SP tidak pernah dikirim. Pengirimnya modul Telegram v33
apa adanya: satu SQL sumber + fungsi pesan kembar + entri `bidang_kejadian`.
**Kejadian baru baru boleh dinyalakan setelah semua perangkat diperbarui.**

## 12. Sinkronisasi dan skema

Aturan umum untuk semua fase:

- Setiap tabel baru menyentuh keempat lapisan dalam satu perubahan, dan
  `SNAPSHOT_SOURCES` ↔ `SNAPSHOT_TABLES` identik (aturan 30). Pengecualian:
  `hr_profil` cloud-only (Q-30), tidak pernah masuk `storage.rs` maupun
  `SNAPSHOT_TABLES`, pola `master_operator`/`password_reset_request` (aturan 24, 42).
- Setiap fase menaikkan versi skema (fase 1 = v36) dan sentinel Rust (mulai
  `-2032`), plus angka di `ensure_schema_current` (aturan 21).
- Tidak ada `UNIQUE` di kolom bisnis (aturan 32).
- Riwayat append-only dengan status diturunkan. Pembatalan berid `batal-<id>`.
- Berkas (dokumen, nota, CV) di luar snapshot, didorong per berkas.
- Tabel yang barisnya tidak pernah dihapus (`hr_divisi`, `hr_jabatan`,
  `hr_cabang`, riwayat) memakai `delete_missing: false`.
- Kunci payload yang tidak dikenal handler cloud versi lama dilindungi pola
  "cloud hanya menimpa kolom bila payload membawa kuncinya" (seperti
  `atribut`/`desimal` inventaris), karena perangkat lama tidak tahu kolom HRIS.
- Seluruh tabel HRIS ikut `PROMOTION_PLAN` dan dibuang saat pindah database.

Model data rinci (nama kolom, CHECK, indeks) ditulis di awal setiap fase, di
bagian "Urutan pengerjaan fase N", seperti `prd-driver.md` §13–§15.

Usulan tabel per fase:

| Fase | Tabel |
| :-- | :-- |
| 1 | `hr_cabang`, `hr_divisi`, `hr_divisi_nama`, `hr_jabatan`, `hr_profil` (Q-30), `hr_kontrak`, `hr_dokumen_jenis`, `hr_dokumen`, `hr_dokumen_berkas` (luar snapshot), kolom baru `master_data.id_cabang/id_divisi/id_jabatan/id_atasan/tanggal_masuk` |
| 2 | `hr_jenis_pengajuan`, `hr_pengajuan`, `hr_pengajuan_keputusan`, `hr_cuti_penyesuaian`, `hr_pengajuan_berkas` (luar snapshot) |
| 3 | kolom isian lembur/tukar/dinas di `hr_pengajuan` (atau tabel anak, diputuskan di awal fase 3) |
| 4 | `hr_reimburse_kategori`, `hr_reimburse_bayar`, `hr_reimburse_bayar_baris` |
| 5 | `hr_sp`, `hr_keluar`, `hr_keluar_alasan`, `hr_pesangon_pengali` |
| 6 | `hr_kinerja_template`, `hr_kinerja_aspek`, `hr_kinerja_penilaian`, `hr_kinerja_nilai` |
| 7 | `hr_lowongan`, `hr_pelamar`, `hr_pelamar_tahap`, `hr_pelatihan`, `hr_pelatihan_peserta` |
| 8 | tanpa tabel (Telegram v33) |

## 13. Keputusan pemilik (10 Nov 2026)

| No | Pertanyaan | Jawaban |
| :-- | :-- | :-- |
| Q-1 | Ukuran klien | Campuran, harus bisa semua |
| Q-2 | Siapa penyetuju | Diatur per jenis pengajuan |
| Q-3 | Self-service karyawan | Ditunda, pekerjaan besar yang perlu hati-hati |
| Q-4 | Bertahap atau sekaligus | Bertahap, semua modul ada di PRD |
| Q-5 | Cara atasan menyetujui | Atasan punya akun operator. Karyawan lapor lewat WA, atasan mengajukan di aplikasi dengan alasan, HRD setuju/tolak. Urgent bisa langsung di-ACC atasan |
| Q-6 | Struktur organisasi | Master organisasi, isinya disunting di Pengaturan oleh yang berwenang, jadi pilihan di data karyawan |
| Q-7 | Pembaruan jatah cuti | Diatur per perusahaan |
| Q-8 | Sisa cuti | Diatur per perusahaan |
| Q-9 | HRD setelah urgent | Wajib "mengetahui", tidak bisa membatalkan |
| Q-10 | Siapa boleh urgent | Diatur per jenis pengajuan |
| Q-11 | Yang disunting | Isinya saja; tingkatan tetap Cabang → Divisi → Jabatan |
| Q-12 | Ganti nama divisi | Semua ikut nama baru, termasuk riwayat |
| Q-13 | Jenis pengajuan | Semua: cuti/izin/sakit, lembur, reimbursement, tukar shift, dinas luar |
| Q-14 | Lembur | Diatur per perusahaan (otomatis atau wajib SPL) |
| Q-15 | Cuti/izin ke gaji | Diatur per jenis |
| Q-16 | Dokumen | Data wajib, berkas opsional |
| Q-17 | Rekrutmen | HRD input saja |
| Q-18 | Kinerja | Template per jabatan, aspek berbobot |
| Q-19 | Pesangon | Dihitung sebagai usulan + checklist keluar |
| Q-20 | Bayar reimbursement | Diatur per perusahaan (ikut gaji atau terpisah) |
| Q-21 | Cakupan atasan | ~~Menurut atasan langsung, berjenjang~~ Diganti Q-38 |
| Q-22 | SP | Catat + cetak + eskalasi |
| Q-23 | Data rahasia | Diatur per izin RBAC |
| Q-24 | Pengingat | Dasbor + Telegram bidang `hrd` |
| Q-25 | Akun atasan | Tertaut ke data karyawannya; role bawaan HRD dan Atasan |
| Q-26 | Pelatihan | Riwayat + sertifikat |
| Q-27 | Urutan fase | Disetujui (fase 1–8 seperti PRD ini) |
| Q-38 | Perubahan A-2 (atasan hanya melihat bawahannya) | Tidak dipakai. Atasan bisa melihat semua karyawan. Yang tetap: tidak bisa urgent atau memutus untuk dirinya sendiri |

## 14. Pertanyaan lanjutan (dijawab 10 Nov 2026)

Pemilik menyetujui semua usulan di bawah. Kolom "Keputusan" adalah aturan yang
berlaku.

| No | Pertanyaan | Keputusan |
| :-- | :-- | :-- |
| Q-28 | HRD sendirian: bila HRD yang mengajukan (atasan tanpa akun), siapa yang memutus? | HRD boleh memutus pengajuannya sendiri, tetapi riwayat menandainya "diajukan dan diputus orang yang sama" dan masuk daftar tinjau Superadmin |
| Q-29 | Divisi melekat ke satu cabang, atau berlaku di semua cabang? Jabatan global atau per divisi? | Divisi dan jabatan global; karyawan memilih cabang + divisi + jabatan terpisah. "Gudang Cabang A" cukup sebagai kombinasi, bukan divisi baru |
| Q-30 | Data pribadi & keuangan (NIK, KK, rekening, alamat) ikut tersinkron ke semua perangkat, termasuk terminal scanner? | **Tidak.** `hr_profil` cloud-only seperti `master_operator`: hanya terbaca saat online, tidak pernah ada di SQLite terminal. Gaji sudah tersinkron hari ini, dan menambah NIK + rekening ke setiap terminal memperbesar dampak satu perangkat hilang |
| Q-31 | Reimbursement & pesangon: jurnal otomatis (sumber jurnal baru, CHECK `keu_jurnal.sumber` dibangun ulang di 4 lapisan, semua perangkat wajib diperbarui) atau jurnal manual seperti upah driver? | Manual di fase 4–5; otomatis bisa menyusul sekali jalan untuk keduanya |
| Q-32 | Isi pesan Telegram HRD boleh memuat nama karyawan? | Nama + jabatan. Tidak pernah NIK, gaji, alasan sakit, atau isi SP |
| Q-33 | Data pelamar yang tidak diterima dihapus otomatis setelah berapa lama (UU PDP 27/2022)? | 12 bulan setelah lowongan ditutup, bisa diubah; HRD bisa menghapus lebih cepat |
| Q-34 | Karyawan scan Hadir di hari cutinya: jatah tetap terpotong? | Laporan menampilkan Hadir; jatah tidak terpotong untuk hari itu; muncul tanda "hadir saat cuti" untuk HRD |
| Q-35 | HRIS bagian dari produk yang sama, atau modul berbayar terpisah yang harus dibuka lewat lisensi? | Bagian dari produk yang sama. Lisensi LIS1 dan alat penerbit `C:\dev\lisensi` tidak diubah. Gerbang lisensi yang sudah ada (`enforce_any`, `requireWebPermission`) otomatis berlaku untuk izin HRIS |
| Q-36 | Atasan mengajukan untuk dirinya sendiri | Terjawab oleh Q-38: boleh mengajukan biasa, tetapi tidak urgent dan tidak memutus sendiri; tetap menunggu HRD |
| Q-37 | Skala penilaian kinerja | Aspek 1–5, nilai akhir 0–100 berbobot, dengan predikat yang bisa disunting (mis. ≥ 90 Sangat Baik) |

## 15. Di luar cakupan

- Self-service karyawan (Q-3), termasuk slip gaji di HP karyawan.
- Formulir lamaran publik (Q-17).
- Pelaporan otomatis ke BPJS, DJP (e-Bupot), Wajib Lapor Ketenagakerjaan.
- Transfer gaji ke bank.
- Upah cuti melahirkan bertingkat UU KIA secara otomatis (dicatat manual).
- Rencana dan anggaran pelatihan (Q-26).
- Struktur organisasi bergambar (bagan). Daftar berjenjang cukup; bagan bisa
  menyusul setelah fase 1.

## 16. Urutan pengerjaan fase 1

Ditulis setelah menelusuri kode (10 Nov 2026). Temuan yang mengubah §5 dijawab
pemilik sebagai Q-39 sampai Q-46 (§16.7); bila §5 dan bagian ini berbeda,
**bagian ini yang berlaku**.

### 16.1 Temuan dari kode

- `master_data` sudah punya `jabatan_status` (teks "Jabatan", bawaan `Staff`,
  tercetak di kartu ID), `jenis_personil` (`Pegawai`/`Kontrak`/`Magang`/`Harian`),
  `tanggal_daftar` (label "Tgl Daftar / Bergabung", bisa dikoreksi), dan `lp`
  (jenis kelamin). Keempatnya dipakai, bukan diduplikasi.
- Mengubah karyawan hari ini **menulis ulang** nama dan divisi orang itu di
  `id_card`, `absensi_harian`, `log_scan`, `backup_karyawan`, `koreksi_admin`
  (lokal `update_employee`, Web `updateKaryawan`, dan handler cloud
  `employee/update`). Perilaku itu dibiarkan karena per orang. Yang baru di
  sini hanya ganti nama **divisi**, yang tidak menulis ulang riwayat (§5.2).
- **Bug lama:** handler cloud `employee/update` tidak menulis `tanggal_daftar`,
  jadi koreksinya dari Desktop/Mobile tidak pernah sampai cloud dan tertimpa
  tarikan berikutnya. Diperbaiki di fase ini (Q-41).
- Seed Admin bawaan memberi semua izin yang tidak sensitif (`NOT IN` di
  `turso.rs`, filter di `DEFAULT_ROLE_PERMISSIONS.admin`), jadi tanpa
  pengecualian Admin otomatis melihat NIK dan rekening (Q-42).
- Halaman Karyawan Web/Desktop dan Mobile adalah dua berkas terpisah, jadi
  isian organisasi ditulis sebagai komponen bersama.
- `REQUIRED_TABLE_COUNT` = 70 tabel cloud; fase ini menambah 9 → 79.

### 16.2 Model data (skema v36, sentinel `-2032` `hris-org-v1`)

**Tersinkron** (keempat lapis: `storage.rs` Desktop + Mobile, `turso.rs`,
`db-schema.ts`/`db-migrations.ts`, `SNAPSHOT_TABLES` = `SNAPSHOT_SOURCES`).
Semua `delete_missing: false` karena tidak ada baris yang dihapus, tanpa
`PendingGuard`, tanpa `UNIQUE` selain PK.

| Tabel | Kolom | Snapshot / rute |
| :-- | :-- | :-- |
| `hr_cabang` | `id_cabang` PK, `nama` NOT NULL, `alamat`, `is_aktif` INTEGER NOT NULL DEFAULT 1 CHECK (0,1), `created_at`, `updated_at` | `hr-branch` / `hr-branch/save` |
| `hr_divisi` | `id_divisi` PK, `nama` NOT NULL (nama sekarang), `is_aktif`, `created_at`, `updated_at` | `hr-division` / `hr-division/save` |
| `hr_divisi_nama` | `id_nama` PK, `id_divisi` NOT NULL, `nama` NOT NULL, `created_at`. Indeks `id_divisi`. Append-only: setiap nama yang pernah dipakai | `hr-division-name`, tanpa rute; menumpang event `hr-division/save` (pola `drv_laporan_muatan`) |
| `hr_jabatan` | `id_jabatan` PK, `nama` NOT NULL, `is_aktif`, `created_at`, `updated_at` | `hr-position` / `hr-position/save` |
| `hr_kontrak` | `id_kontrak` PK, `id_karyawan` NOT NULL, `jenis` CHECK IN (`PKWTT`, `PKWT`, `Harian Lepas`, `Magang`, `Pembatalan`), `id_ref` (Pembatalan: kontrak yang dibatalkan), `nomor`, `tanggal_mulai` NOT NULL (Pembatalan: tanggal WIB dibatalkan), `tanggal_selesai`, `percobaan_selesai` (hanya PKWTT), `catatan` (Pembatalan: alasan, wajib), `dicatat_oleh` (dari sesi), `created_at`. Indeks `id_karyawan`. Append-only; pembatalan berid `batal-<id_kontrak>` | `hr-contract` / `hr-contract/create` (kontrak dan pembatalan) |
| `master_data` + 4 kolom | `id_cabang`, `id_divisi`, `id_jabatan`, `id_atasan` (TEXT, boleh kosong). `CREATE` + `ensure_column`/`hasColumn` | ikut `employee` |

`tanggal_masuk` **tidak** ditambahkan: `tanggal_daftar` menjadi "Tanggal Masuk"
(Q-41). `jenis_kelamin` tidak ditambahkan: memakai `lp`.

**Khusus cloud** (hanya `turso.rs` + jalur Web; tidak di `storage.rs`, tidak di
snapshot, tidak lewat outbox; pola `master_operator`/`app_telegram_setting`).
Dibaca dan ditulis command Rust lewat `TursoClient` (atau hub pada mode
database lokal) dan route Web, hanya saat terhubung (Q-30, Q-45).

| Tabel | Kolom |
| :-- | :-- |
| `hr_profil` | `id_karyawan` PK; **pribadi**: `nik`, `no_kk`, `tempat_lahir`, `tanggal_lahir`, `agama` CHECK NULL atau IN (`Islam`, `Kristen`, `Katolik`, `Hindu`, `Buddha`, `Konghucu`, `Lainnya`), `status_nikah` CHECK NULL atau IN (`Belum Kawin`, `Kawin`, `Cerai Hidup`, `Cerai Mati`), `alamat_ktp`, `alamat_domisili`, `pendidikan` CHECK NULL atau IN (`SD`, `SMP`, `SMA/SMK`, `D1`, `D2`, `D3`, `D4`, `S1`, `S2`, `S3`, `Lainnya`), `darurat_nama`, `darurat_hubungan`, `darurat_hp`; **keuangan**: `bank`, `no_rekening`, `nama_rekening`, `npwp`, `bpjs_kesehatan`, `bpjs_ketenagakerjaan`; jejak: `pribadi_diubah_oleh/_pada`, `keuangan_diubah_oleh/_pada` (jam database) |
| `hr_dokumen_jenis` | `id_jenis` PK, `nama` NOT NULL, `is_aktif`, `created_at`, `updated_at`. Bawaan `INSERT OR IGNORE` berid tetap (`dok-ktp`, `dok-kk`, `dok-npwp`, `dok-ijazah`, `dok-kontrak`, `dok-sertifikat`, `dok-sim`, `dok-surat-dokter`, `dok-lainnya`) di `turso.rs` dan `db-migrations.ts`. Aman di-seed karena tidak pernah lewat outbox |
| `hr_dokumen` | `id_dokumen` PK, `id_karyawan` NOT NULL, `id_jenis` NOT NULL, `nomor`, `tanggal_terbit`, `tanggal_kedaluwarsa`, `catatan`, `dicatat_oleh`, `created_at`, `updated_at`. Indeks `id_karyawan`, `tanggal_kedaluwarsa`. Hapus = `DELETE` sungguhan bersama berkasnya dalam satu transaksi (tidak ada perangkat yang bisa menghidupkannya kembali) |
| `hr_dokumen_berkas` | `id_berkas` PK, `id_dokumen` NOT NULL, `urutan` CHECK 1–5, `nama_berkas`, `mime_type` CHECK IN (`image/jpeg`, `image/png`, `image/webp`, `application/pdf`), `data_base64` NOT NULL, `created_at`. Indeks `id_dokumen` |

- Pengenal: NIK dan KK 16 digit, NPWP 15 atau 16 digit, BPJS dan rekening 5–20
  digit; tanda baca dibuang sebelum disimpan. Nomor HP darurat lewat
  `contact.ts` ↔ `normalize_operator_phone`. Validasi kembar Rust ↔ TS.
- Berkas: maks 1 MB setelah didekode (`MAKS_BERKAS_BASE64` = 1.398.104
  karakter), maks 5 per dokumen, MIME harus cocok dengan tanda tangan bita
  (`%PDF`, `FF D8`, `89 50 4E 47`, `RIFF…WEBP`). Diunggah satu berkas per
  permintaan, jadi body route Web cukup 1,6 MB. Daftar dokumen tidak pernah
  membawa `data_base64`.
- Daftar karyawan tidak memuat NIK atau rekening sama sekali (lebih ketat dari
  "disamarkan" di §5.3); nilainya hanya ada di rincian untuk pemegang izinnya.

**Pengaturan** (`setting_gex_system`, tanpa perubahan skema, lewat rute
`setting/update` yang sudah ada; kosong = bawaan, Q-46):
`hr_percobaan_maks_bulan` = 3, `hr_pkwt_maks_bulan` = 60,
`hr_harian_batas_hari` = 21, `hr_harian_batas_bulan` = 3.

Kedua jalur menaikkan `CURRENT_SCHEMA_VERSION`/`CLIENT_SCHEMA_VERSION` ke 36,
`REQUIRED_TABLE_COUNT` ke 79, sentinel `-2032`, dan angka di
`ensure_schema_current`. Kesembilan tabel ikut `PROMOTION_PLAN`; kelima tabel
tersinkron dibuang saat pindah database (`reset_cloud_linked_data`) dan
diklasifikasikan di `CLOUD_MIRRORED_TABLES`.

### 16.3 Divisi dan jabatan dari teks ke master

**Migrasi** (sekali, di cloud saja: blok sentinel `turso.rs` setelah loop
`ensure_column` dan blok v36 `db-migrations.ts`, teks SQL kembar). Perangkat
mendapat hasilnya lewat tarikan snapshot.

1. Cabang `cab-pusat` "Pusat" dibuat hanya bila `master_data` sudah berisi
   (database baru tetap kosong, §5.1).
2. Setiap `LOWER(TRIM(divisi))` berbeda menjadi satu `hr_divisi` berid
   `'div-' || lower(hex(lower(trim(divisi))))` (deterministik, jadi Rust dan Web
   yang sama-sama menjalankannya menghasilkan id yang sama) + satu
   `hr_divisi_nama` `<id_divisi>:awal`.
3. Sama untuk `jabatan_status` → `hr_jabatan` (`jab-…`), kecuali kosong dan `-`.
4. `master_data.id_cabang/id_divisi/id_jabatan` diisi dari hasil itu.
   Semua `INSERT OR IGNORE` / `WHERE … IS NULL`, jadi aman diulang.

**Aturan nama** (kembar, `assert_unique` di aplikasi): nama cabang, divisi, dan
jabatan unik tanpa beda huruf besar/kecil di tabelnya. Nama divisi juga tidak
boleh sama dengan nama lama divisi **lain** di `hr_divisi_nama` (dicadangkan).
Kembaran dari dua perangkat offline tidak ditolak cloud dan muncul sebagai
tanda `nama_ganda` di tab Organisasi.

**Menyimpan divisi** (`hr-division/save`; lokal dan cloud melakukan hal yang
sama dalam satu transaksi):

- baris `hr_divisi` + `hr_divisi_nama` baru bila namanya belum pernah dipakai
  divisi itu;
- `master_data.divisi` dan `id_card.divisi` karyawan ber-`id_divisi` itu
  diganti nama sekarang (data kini, bukan riwayat);
- karyawan yang `id_divisi`-nya kosong dan teks divisinya sama dengan salah
  satu nama divisi itu ikut ditautkan. Inilah "Jadikan divisi" untuk teks yang
  belum punya master, tanpa command kedua.

`hr-position/save` sama, untuk `master_data.jabatan_status`, tanpa riwayat nama
(Q-39).

**Menyimpan karyawan** (Rust `create/update/import_employees`, Web
`createKaryawan`/`updateKaryawan`/impor, handler cloud `employee/*`):

- `id_divisi` wajib untuk karyawan baru dari form; cabang, jabatan, dan atasan
  opsional. Teks `divisi` selalu diisi dari master (`id_divisi` → nama
  sekarang); `jabatan_status` dari `id_jabatan` bila diisi. Pilihan baru harus
  master yang aktif; master nonaktif yang sudah dipakai karyawan itu boleh
  tetap.
- `id_atasan`: karyawan lain yang ada, bukan dirinya, dan tidak membentuk
  siklus (`periksa_atasan` ↔ `periksaAtasan`, menelusuri rantai `id_atasan`).
  Siklus dari dua perangkat offline menjadi tanda `atasan_siklus`.
- **Handler cloud** tidak pernah menolak karena master: `id_cabang`,
  `id_jabatan`, `id_atasan` hanya ditimpa bila payload membawa kunci tidak
  kosong. Payload tanpa `id_divisi` (perangkat lama) dipetakan dari teksnya
  lewat `hr_divisi_nama`, dan teksnya dinormalkan ke nama sekarang; teks yang
  tidak dikenal disimpan apa adanya dengan `id_divisi` kosong. Dengan
  `id_divisi` yang dikenal, teks `divisi` selalu diambil dari master, sehingga
  event lama yang telat tidak bisa mengembalikan nama lama.
- `tanggal_daftar` ditulis handler `employee/update` bila payload membawa nilai
  tidak kosong (perbaikan bug, Q-41).
- **Impor Excel dan Ubah massal**: teks dipetakan ke master (termasuk nama
  lama); yang tidak dikenal menolak barisnya dengan "Divisi 'X' belum terdaftar
  di Pengaturan → Organisasi." (Q-44). Ubah massal memakai dropdown master
  (`id_divisi`, `id_jabatan`, `id_cabang`).

**Riwayat tampil dengan nama kini** lewat satu potongan SQL kembar
`DIVISI_KINI_SQL(kolom)` (teks diperiksa identik Rust ↔ TS, pola Telegram):
`COALESCE((SELECT d.nama FROM hr_divisi_nama n JOIN hr_divisi d ON …
WHERE LOWER(TRIM(n.nama)) = LOWER(TRIM(kolom)) ORDER BY n.created_at LIMIT 1),
kolom)`. Dipakai untuk tampilan **dan** saringan divisi di: laporan kehadiran
bulanan (`report.ts` ↔ `administration.rs`), riwayat absensi dan log scan,
daftar koreksi dan backup, ekspor Excel laporan, dan penerima `Divisi`
inventaris. Pilihan saringan divisi diambil dari `hr_divisi`, bukan teks unik
`master_data`. Teks yang tidak terpetakan tampil apa adanya.

### 16.4 Kontrak dan status kerja

- Status kerja **tidak disimpan**: `status_kerja(kontrak, tanggal)` ↔
  `statusKerja` mengambil kontrak tidak dibatalkan terakhir yang mulai ≤
  tanggal. Hasilnya jenis, berlaku sampai, masa percobaan sampai, atau
  "Kontrak berakhir"/"Tanpa kontrak".
- Ditolak (kelengkapan, bukan angka hukum): PKWT dan Magang tanpa tanggal
  selesai; tanggal selesai sebelum mulai; `percobaan_selesai` pada selain PKWTT;
  pembatalan tanpa alasan atau atas kontrak yang sudah dibatalkan.
- Tanda, bukan penolakan (angka dari pengaturan §16.2):
  `percobaan_lewat` (masa percobaan > `hr_percobaan_maks_bulan`),
  `pkwt_lewat` (jumlah lama PKWT tidak dibatalkan sejak PKWTT terakhir >
  `hr_pkwt_maks_bulan`), `harian_perlu_pkwtt` (kontrak berlaku Harian Lepas
  dan hari hadir ≥ `hr_harian_batas_hari` di setiap `hr_harian_batas_bulan`
  bulan penuh terakhir, memakai `HARI_HADIR_SQL` yang sudah ada).
- **`jenis_personil` mengikuti kontrak** (Q-40): menyimpan kontrak atau
  pembatalan mengisi `master_data.jenis_personil` dari kontrak tidak dibatalkan
  dengan `tanggal_mulai` terakhir (PKWTT → `Pegawai`, PKWT → `Kontrak`, Harian
  Lepas → `Harian`, Magang → `Magang`), di transaksi yang sama, lokal dan cloud
  (`JENIS_DARI_KONTRAK_SQL`, kembar). Tidak bergantung pada jam, jadi urutan
  tiba di cloud tidak mengubah hasil. Handler `employee/*` menghitung ulang
  sesudah upsert, dan isian di form terkunci bila karyawan punya kontrak.
  Tanpa kontrak, isian lama tetap berlaku.

### 16.5 Hak akses

| Izin | Sensitif | HRD | Atasan | Admin bawaan |
| :-- | :-- | :-- | :-- | :-- |
| `hr.org.manage` | | ya | | ya |
| `hr.personal.view` / `hr.personal.manage` | | ya | | **tidak** |
| `hr.finance.view` | | ya | | **tidak** |
| `hr.finance.manage` | ya | ya | | tidak |
| `hr.contract.manage` | | ya | | ya |
| `hr.document.view` / `hr.document.manage` | | ya | | **tidak** |

- Daftar baru `CONFIDENTIAL_PERMISSIONS` di `catalog.ts` (pribadi, keuangan,
  dan dokumen, karena pindaian KTP/KK sama rahasianya dengan NIK)
  dikecualikan dari paket Admin Web dan dari seed Admin Rust (`NOT IN`), tanpa
  menjadikannya sensitif (Q-42). `hr.finance.manage` masuk
  `SENSITIVE_MUTATION_PERMISSIONS`.
- Role bawaan **HRD** (`hrd`): `home.view`, `employees.view`,
  `employees.manage`, dan semua izin di atas. **Atasan** (`atasan`):
  `home.view`, `employees.view`; izin pengajuannya ditambahkan di fase 2.
  Pola seed role Driver (lewat `role_key`, tanpa id eksplisit), di Rust dan
  `SYSTEM_ROLE_KEYS`/`DEFAULT_ROLE_PERMISSIONS`. Akun atasan ditautkan ke
  karyawannya lewat `master_operator.id_karyawan` yang sudah ada.
- Membaca master organisasi dan kontrak cukup `employees.view`. Profil
  mengembalikan hanya kelompok yang izinnya dipegang. Halaman `/hris` dijaga
  area `hris` (`employees.view`); setiap tab memeriksa izinnya sendiri, dan
  backend memeriksa ulang (aturan 10).

### 16.6 Command, rute, dan layar

**Rust** (`desktop/hris.rs`, disalin ke Mobile; terdaftar di kedua `lib.rs`,
`build.rs`, `capabilities/default.json`): `desktop_hr_org` (master + nama lama
+ tanda + teks tanpa master + pengaturan, `employees.view`);
`desktop_hr_branch_save`, `desktop_hr_division_save`,
`desktop_hr_position_save`, `desktop_hr_settings_save`,
`desktop_hr_document_types_save` (`hr.org.manage`); `desktop_hr_contracts`
(`employees.view`), `desktop_hr_contract_create`, `desktop_hr_contract_cancel`
(`hr.contract.manage`); `desktop_hr_profile` (salah satu izin view),
`desktop_hr_profile_save_personal` (`hr.personal.manage`),
`desktop_hr_profile_save_finance` (`hr.finance.manage`); `desktop_hr_documents`,
`desktop_hr_document_file` (`hr.document.view`), `desktop_hr_document_save`,
`desktop_hr_document_delete`, `desktop_hr_document_file_add`,
`desktop_hr_document_file_delete` (`hr.document.manage`). Command khusus cloud
memberi pesan "butuh koneksi ke database" saat `TURSO_NOT_CONFIGURED` atau
jaringan gagal.

**Web**: `validations/hris.ts` + `services/hris.ts` (kembar Rust), rute
`POST /api/hris/<…>` (Zod `.strict()`, tanpa `GET`), gateway `gateways/hris.ts`.

**Layar** (Q-43: Mobile hanya form karyawan):

1. **Pengaturan → Organisasi** (Web/Desktop): Cabang, Divisi (nama lama,
   jumlah karyawan, ganti nama dengan peringatan bahwa nama lama dicadangkan),
   Jabatan, "Teks divisi tanpa master" + Jadikan divisi, Jenis dokumen, angka
   bawaan kontrak. Aktif/nonaktif, tanpa hapus. `konfirmasiData` sebelum simpan.
2. **Form karyawan** (Web/Desktop dan Mobile): komponen bersama
   `components/personnel/IsianOrganisasi.tsx` (di `filesToCopy`) dengan
   `PilihCari` cabang, divisi, jabatan, atasan; "Tgl Daftar / Bergabung" menjadi
   "Tanggal Masuk"; `jenis_personil` terkunci bila punya kontrak. Saringan dan
   Ubah massal divisi/jabatan dari master.
3. **`/hris`** (Web/Desktop, tidak di menu Mobile): daftar karyawan + tab
   Struktur (daftar berjenjang menurut atasan, dan per cabang/divisi); rincian
   bertab Kerja (ringkas + status kerja + tanda), Pribadi, Keuangan, Kontrak
   (riwayat, tambah, batalkan dengan alasan), Dokumen (data + unggah/lihat
   berkas). Tab khusus cloud menampilkan pesan bila sedang offline.

### 16.7 Jawaban fase 1 (10 Nov 2026)

| No | Pertanyaan | Jawaban |
| :-- | :-- | :-- |
| Q-39 | `jabatan_status` yang sudah ada | Pola divisi tanpa riwayat nama: `id_jabatan` baru, `jabatan_status` tetap diisi nama sekarang, ganti nama ikut memperbaruinya |
| Q-40 | `jenis_personil` vs status kerja dari kontrak | Kontrak menimpa `jenis_personil`; isian terkunci bila ada kontrak |
| Q-41 | `tanggal_masuk` baru vs `tanggal_daftar` | Pakai `tanggal_daftar` sebagai Tanggal Masuk; bug handler cloud diperbaiki |
| Q-42 | Admin bawaan dan data rahasia | Pribadi dan keuangan tidak ikut paket Admin (dokumen ikut dikecualikan, §16.5) |
| Q-43 | Layar di Mobile | Form karyawan saja; `/hris` dan Organisasi Web/Desktop |
| Q-44 | Teks divisi/jabatan tak dikenal saat impor | Baris ditolak dengan pesan |
| Q-45 | Dokumen tersinkron atau khusus cloud | Khusus cloud seperti `hr_profil` |
| Q-46 | Angka hukum kontrak | Pengaturan per perusahaan (`setting_gex_system`) |

### 16.8 Langkah

| # | Langkah | Gerbang |
| :-- | :-- | :-- |
| 1 | **Skema v36**: 5 tabel tersinkron + 4 kolom `master_data` di keempat lapis, 4 tabel khusus cloud, migrasi teks → master, sentinel `-2032`, `REQUIRED_TABLE_COUNT` 79, promosi, purge pindah database, klasifikasi tabel. | `audit:schema` + tes sentinel/provisioning Rust |
| 2 | **Aturan domain kembar** `hris.rs` ↔ `validations/hris.ts`: validasi master/profil/dokumen/berkas, `periksa_atasan`, status kerja, tanda kontrak, padanan `jenis_personil`, `DIVISI_KINI_SQL`. Vektor uji yang sama. | `bun test` + `cargo test hris` |
| 3 | **Sinkronisasi**: rute `hr-branch/save`, `hr-division/save`, `hr-position/save`, `hr-contract/create`; handler cloud (tidak menolak karena master); perubahan handler `employee/*` (kunci baru, pemetaan teks, `tanggal_daftar`, `jenis_personil`); penulisan lokal SQLite + outbox satu transaksi; snapshot. | `audit:contract` + tes cloud `TursoClient::local_file` |
| 4 | **RBAC**: izin, `CONFIDENTIAL_PERMISSIONS`, role HRD dan Atasan, command Rust, rute Web, gateway. | tes Rust + `web-rbac-boundary` |
| 5 | **Karyawan**: penyimpanan Rust/Web dengan `id_*`, impor Excel, Ubah massal, `IsianOrganisasi` di form Web/Desktop dan Mobile, `DIVISI_KINI_SQL` di laporan dan riwayat. | tes impor, laporan, dan payroll yang sudah ada tetap lulus |
| 6 | **Layar** Organisasi dan `/hris`. | `bun test` + typecheck |
| 7 | `bun run sync:mobile`, bagian ringkas `CLAUDE.md`, catatan "Sudah dibangun". | `audit:docs`; `bun run check` penuh oleh pemilik |

### 16.9 Sudah dibangun (10 Nov 2026)

Langkah 1–7 dibangun. Gerbang yang dijalankan: `audit:schema` dan
`audit:contract` lulus; `cargo test --lib` Desktop 370 dan Mobile 374 lulus
(termasuk `sentinel_2031_memicu_skema_dan_migrasi_hris`: migrasi teks → master,
ganti nama divisi di cloud, dan normalisasi event lama); `hris.test.ts`
cermin tes Rust; typecheck kedua workspace dan Biome bersih. `bun run check`
penuh belum dijalankan (pemilik).

Penyimpangan dari §16.1–§16.6, untuk ditinjau:

- **Tab Organisasi ada di `/hris`, bukan Pengaturan.** Halaman Pengaturan
  dijaga `branding.manage`, yang tidak dimiliki role HRD. Tab dijaga
  `hr.org.manage`.
- **Arti kunci organisasi di payload `employee/*`**: absen atau `null` = tidak
  dibawa, `""` = dikosongkan (bukan "hanya kunci tidak kosong" seperti tertulis
  di §16.3). Tanpa ini, mengosongkan atasan atau cabang tidak pernah sampai ke
  cloud. Draft dari baris daftar hanya membawa kunci yang terisi, dan payload
  outbox mengirim `null` untuk nilai kosong kecuali form sengaja
  mengosongkannya, jadi perangkat yang belum menarik migrasi tidak menghapus
  nilai cloud.
- **Belum dikerjakan:** nama divisi kini untuk penerima `Divisi` di layar dan
  laporan inventaris (§16.3). Kuerinya tersebar di beberapa laporan Rust dan
  TS, sedangkan `mutasi_json` adalah payload outbox yang tidak boleh
  dipetakan; dikerjakan terpisah.
- Tes `services/alfa-audit.test.ts` + `operational-workflow.test.ts` gagal bila
  dijalankan dalam satu proses (`CLIENT_CLOSED`: klien bersama ditutup tes
  lain); masing-masing lulus sendiri, dan keduanya tidak diubah fase ini.

## 17. Urutan pengerjaan fase 2

Ditulis setelah menelusuri kode (10 Nov 2026). Pertanyaan yang muncul dijawab
pemilik sebagai Q-47 sampai Q-54 (§17.10). Bila §6 dan bagian ini berbeda,
**bagian ini yang berlaku**.

### 17.1 Temuan dari kode

- **Payroll hanya punya dua tipe gaji**: `HOURLY` dan `FLAT_DAILY`
  (`payroll/models.rs`, `calculateEmployeePay`). Tidak ada gaji bulanan, jadi
  tidak ada rumus potongan per hari. Di kedua tipe, hari tanpa jam kerja atau
  tanpa hadir sudah otomatis tidak dibayar (Q-48).
- Rekap gaji punya satu titik hitung per karyawan: baris agregat di
  `desktop_get_payroll_recap` (dipakai pratinjau DAN pembekuan run) dan
  `computePayrollRecap` (Web). Kasbon dikaitkan di sana lewat
  `loan::pinjaman_aktif` ↔ `pinjamanAktif` + `potong_kasbon`; pengajuan
  memakai pola yang sama.
- `HARI_HADIR_SQL` (driver) = tanggal unik berstatus `Hadir`/`PRESENT` UNION
  tanggal WIB berlaporan perjalanan. `PELAPOR_PERJALANAN_SQL` dikaitkan di tiga
  tempat: Generate Alfa (`operational.rs` ↔ `alfa-audit.ts`), audit absensi
  (`get_attendance_audit` ↔ `attendance-audit.ts`), dan hari hadir FLAT_DAILY.
  Laporan kehadiran bulanan (`laporan-kehadiran.ts`) **tidak** membacanya.
- `wajib_masuk` ↔ `wajibMasuk` hanya fungsi murni; datanya (hari kerja shift,
  `tbl_hari_libur`, whitelist lewat `evaluate_holiday_scan` ↔
  `evaluateHolidayScan`) dikumpulkan pemanggil masing-masing.
- Pengajuan pembelian (v30) menyimpan keputusan sebagai **kolom** di baris
  pengajuan, bukan tabel append-only. Fase ini menggabungkan: `sidik` dan
  `validate_pemutus` dari pengajuan pembelian, keputusan append-only +
  `diterima_cloud` dari `drv_laporan`/`keu_tutup_buku`.
- Generate Alfa membuat baris `Alfa` di `absensi_harian`. Sakit yang diajukan
  kemudian (tanggal lewat) menemukan baris Alfa yang sudah ada; A-3 melarang
  menulis `absensi_harian`, jadi **pembaca** yang memenangkan pengajuan atas
  Alfa (§17.5).
- Sesi Web (`readSessionRecord`) tidak memuat `master_operator.id_karyawan`;
  Rust punya `karyawan_sesi`. Aturan "tidak untuk diri sendiri" di Web membaca
  kolom itu sekali per permintaan.
- `hris.rs` sudah 2.100 baris; fase 2 menjadi modul baru `hr_pengajuan.rs`.
- Penerima `Divisi` inventaris (sisa fase 1) dibaca untuk tampilan di tiga
  kueri kembar: `stock_card` ↔ `stockCard`, `list_loans` ↔ `listLoans`,
  `document` ↔ `documentInventaris`. `mutasi_json` (payload outbox) dan
  pembacaan pinjaman untuk pengembalian (yang menyalin teks asli ke mutasi
  kembali) tidak disentuh. Tidak ada agregasi per penerima.
- `REQUIRED_TABLE_COUNT` = 79; fase ini menambah 5 → 84.

### 17.2 Model data (skema v37, sentinel `-2033` `hris-pengajuan-v1`)

**Tersinkron** (keempat lapis + `SNAPSHOT_TABLES` = `SNAPSHOT_SOURCES`). Semua
`delete_missing: false` (tidak ada baris yang dihapus), tanpa `UNIQUE` selain
PK, tanpa `PendingGuard` (tidak ada tabel anak yang ikut event induk).

| Tabel | Kolom | Snapshot / rute |
| :-- | :-- | :-- |
| `hr_jenis_pengajuan` | `id_jenis` PK; `nama` NOT NULL; `kelompok` NOT NULL CHECK IN (`Cuti`, `Izin`, `Sakit`, `Lembur`, `Tukar Shift`, `Dinas Luar`, `Reimburse`); `izin_pemutus` NOT NULL DEFAULT `hr.request.decide` CHECK IN (`hr.request.decide`, `reimburse.decide`); `boleh_urgent`, `potong_jatah`, `wajib_dokumen`, `is_aktif` INTEGER 0/1; CHECK (`potong_jatah = 0 OR kelompok = 'Cuti'`); `dampak_gaji` NOT NULL CHECK IN (`Dibayar`, `Potong Gaji`, `Tidak Berpengaruh`); `maks_hari` INTEGER CHECK NULL atau > 0; `satuan_maks` NOT NULL DEFAULT `Hari Kerja` CHECK IN (`Hari Kerja`, `Hari Kalender`) (Q-53); `created_at`, `updated_at` | `hr-request-type` / `hr-request-type/save` |
| `hr_pengajuan` | `id_pengajuan` PK (`pgn-<acak>`); `id_karyawan`, `id_jenis` NOT NULL; **salinan jenis saat diajukan**: `kelompok`, `potong_jatah`, `dampak_gaji` (menyunting jenis tidak mengubah cuti dan gaji yang lalu); `tanggal_mulai`, `tanggal_selesai` NOT NULL, CHECK `tanggal_selesai >= tanggal_mulai`; `setengah_hari` 0/1, CHECK (`setengah_hari = 0 OR (kelompok = 'Izin' AND tanggal_mulai = tanggal_selesai)`); `alasan` NOT NULL; `sidik` NOT NULL; `diajukan_oleh` NOT NULL (username sesi); `waktu_perangkat` NOT NULL (UTC); `created_at`, `updated_at`. Indeks `(id_karyawan, tanggal_mulai)`, `(tanggal_mulai, tanggal_selesai)` | `hr-request` / `hr-request/save` (buat dan sunting, upsert) |
| `hr_pengajuan_keputusan` | `id_keputusan` PK; `id_pengajuan` NOT NULL; `jenis` CHECK IN (`Setujui`, `Tolak`, `Setujui Urgent`, `Diketahui`, `Batal`); `sidik` NOT NULL (isi yang dilihat); `alasan` (wajib untuk `Tolak` dan `Batal`); `oleh` NOT NULL; `waktu_perangkat` NOT NULL; `diterima_cloud` (jam database cloud, kosong di perangkat sampai tertarik); `created_at`. Indeks `id_pengajuan`. Append-only. Id tetap untuk keputusan yang hanya boleh ada satu: `urgent-<id>`, `tahu-<id>`, `batal-<id>` (dua perangkat menghasilkan PK yang sama); `Setujui`/`Tolak` acak, supaya keputusan ganda terlihat | `hr-request-decision` / `hr-request-decision/create` |
| `hr_cuti_penyesuaian` | `id_penyesuaian` PK; `id_karyawan` NOT NULL; `periode` NOT NULL (tanggal mulai periode `YYYY-MM-DD`); `jenis` CHECK IN (`Saldo Awal`, `Koreksi`, `Diuangkan`, `Pembatalan`); `id_ref` (Pembatalan); `hari` INTEGER NOT NULL (boleh negatif; Diuangkan negatif); `nominal` INTEGER (rupiah, hanya Diuangkan, aturan 13); `alasan` NOT NULL; `dicatat_oleh` NOT NULL; `created_at`. Indeks `(id_karyawan, periode)`. Append-only; pembatalan `batal-<id>`; diuangkan `uang:<id_karyawan>:<periode>` | `hr-leave-adjustment` / `hr-leave-adjustment/create` |

Cloud memakai `ON CONFLICT DO NOTHING` untuk keputusan dan penyesuaian, dan
`diterima_cloud = datetime('now')` (aturan 19). Handler `hr-request/save`
selalu upsert (tidak pernah menolak; suntingan yang telat menggugurkan
keputusan lewat sidik, §17.3).

**Jenis bawaan** (§6.3) di `src/lib/validations/hr-jenis-bawaan.json`, dibaca
Rust lewat `include_str!` dan TS lewat import (pola `akun-bawaan.json`),
`INSERT OR IGNORE` berid tetap (`jns-cuti-tahunan`, `jns-cuti-menikah`, …) di
ketiga lapis. Seed lokal tidak lewat outbox, jadi tidak mendorong apa pun ke
cloud (aturan 29 tidak terlanggar). Bawaan tambahan: Sakit `wajib_dokumen` 1;
Cuti Melahirkan dan Keguguran `satuan_maks` kalender. CHECK `kelompok` dan
`izin_pemutus` sudah memuat nilai fase 3–4 supaya tidak perlu membangun ulang
CHECK nanti; validasi aplikasi fase 2 hanya menerima `Cuti`/`Izin`/`Sakit` dan
`hr.request.decide`.

**Khusus cloud** (Q-51, pola `hr_dokumen_berkas`; hanya `turso.rs` + Web):

| Tabel | Kolom |
| :-- | :-- |
| `hr_pengajuan_berkas` | `id_berkas` PK, `id_pengajuan` NOT NULL, `urutan` CHECK 1–5, `nama_berkas`, `mime_type` CHECK IN (`image/jpeg`, `image/png`, `image/webp`, `application/pdf`), `data_base64` NOT NULL, `diunggah_oleh`, `created_at`. Indeks `id_pengajuan` |

Validasi berkas memakai ulang `validasi_berkas` ↔ `validasiBerkas` fase 1
(1 MB, tanda tangan bita). Lampiran ditambahkan setelah pengajuan tersimpan,
hanya saat terhubung. Daftar pengajuan hanya membawa jumlah berkas.

**Pengaturan cuti** (`setting_gex_system`, rute `setting/update` yang ada,
lewat `desktop_hr_settings_save` yang diperluas dengan nilai teks; kosong =
bawaan §6.5): `hr_cuti_periode`, `hr_cuti_hak` (0–60), `hr_cuti_syarat_bulan`
(0–24), `hr_cuti_prorata` (0/1), `hr_cuti_sisa`, `hr_cuti_bawa_maks` (0–60),
`hr_cuti_bawa_bulan` (1–12).

Kedua jalur: `CURRENT_SCHEMA_VERSION`/`CLIENT_SCHEMA_VERSION` 37,
`REQUIRED_TABLE_COUNT` 84, sentinel `-2033` + angka `ensure_schema_current`,
`PROMOTION_PLAN` (kelima tabel), purge pindah database dan
`CLOUD_MIRRORED_TABLES` (empat tabel tersinkron).

### 17.3 Status, sidik, dan tanda

**Sidik** (`sidik_pengajuan` ↔ `sidikPengajuan`): SHA-256 dari `id_karyawan`,
`id_jenis`, `kelompok`, `potong_jatah`, `dampak_gaji`, `tanggal_mulai`,
`tanggal_selesai`, `setengah_hari`, `alasan`, dipisah `\u001f`.

**Urutan keputusan** (satu potongan SQL dan satu pembanding, kembar):
`diterima_cloud IS NULL, diterima_cloud, waktu_perangkat, id_keputusan`.
Keputusan yang sudah sampai di cloud diurutkan menurut jam cloud; yang masih
tertunda di perangkat menyusul menurut jam perangkat.

**Status** (`status_pengajuan` ↔ `statusPengajuan`, berurutan):

1. ada `Batal` → **Dibatalkan**;
2. keputusan final pertama (`Setujui`, `Tolak`, `Setujui Urgent`) yang
   `sidik`-nya sama dengan sidik pengajuan sekarang: `Tolak` → **Ditolak**,
   `Setujui` → **Disetujui**, `Setujui Urgent` → **Disetujui (urgent)**;
3. selain itu → **Menunggu**.

**Pengajuan berlaku** = Disetujui atau Disetujui (urgent). Bentuk SQL-nya,
predikat atas alias `p` dan kembar teks Rust ↔ TS (`PENGAJUAN_BERLAKU_SQL`):

```sql
NOT EXISTS (SELECT 1 FROM hr_pengajuan_keputusan b
            WHERE b.id_pengajuan = p.id_pengajuan AND b.jenis = 'Batal')
AND (SELECT k.jenis FROM hr_pengajuan_keputusan k
     WHERE k.id_pengajuan = p.id_pengajuan AND k.sidik = p.sidik
       AND k.jenis IN ('Setujui', 'Tolak', 'Setujui Urgent')
     ORDER BY k.diterima_cloud IS NULL, k.diterima_cloud, k.waktu_perangkat, k.id_keputusan
     LIMIT 1) IN ('Setujui', 'Setujui Urgent')
```

`PENGAJUAN_RENTANG_SQL` (`?1`..`?2`) memilih pengajuan berlaku yang bertumpuk
dengan rentang itu, beserta `id_karyawan`, tanggal, `kelompok`,
`dampak_gaji`, `potong_jatah`, `setengah_hari`. Semua pembaca (§17.5–§17.7)
memakai dua potongan ini; tidak ada kueri status ketiga.

**Tanda** (`tanda_pengajuan` ↔ `tandaPengajuan`, tidak pernah menolak):
`perlu_diketahui` (urgent berlaku tanpa `Diketahui`), `keputusan_ganda` (dua
keputusan final bersidik sah dengan hasil berbeda), `keputusan_gugur` (ada
keputusan final tetapi semuanya bersidik lama), `diputus_sendiri` (Q-28:
`oleh` keputusan yang berlaku = `diajukan_oleh`, masuk daftar tinjau
Superadmin), `bertumpuk` (berlaku/menunggu lain untuk karyawan yang sama di
tanggal yang sama), `tanpa_dokumen` (jenis `wajib_dokumen`, hari terpakai > 1,
tanpa lampiran; hanya terlihat saat online), `hadir_saat_cuti` (Q-34),
`jatah_minus`.

### 17.4 Aturan pengajuan (diperiksa di perangkat dan Web, kembar)

- **Ajukan / sunting** (`hr.request.submit`): jenis aktif berkelompok
  Cuti/Izin/Sakit; rentang sah dan ≤ 366 hari; `setengah_hari` hanya Izin satu
  tanggal; alasan 1–500 karakter; `maks_hari` dibanding hari kerja atau hari
  kalender menurut `satuan_maks`; ditolak bila bertumpuk dengan pengajuan
  Menunggu/berlaku lain karyawan itu, atau bila ada proses gaji `PAID` yang
  periodenya menyentuh rentang (`PERIODE_DIBAYAR_SQL`). Sunting hanya oleh
  pengaju (atau Superadmin), hanya selama Menunggu.
- **Urgent** (`hr.request.urgent`): jenis `boleh_urgent`; ditulis sebagai
  pengajuan + keputusan `urgent-<id>` dalam satu transaksi (dua event outbox
  berurutan).
- **Tidak untuk diri sendiri** (§6.1): akun yang `id_karyawan`-nya sama
  dengan karyawan pengajuan tidak boleh `Setujui Urgent`, `Setujui`, `Tolak`,
  `Diketahui`, atau membatalkan pengajuan yang sudah berlaku. Berlaku juga
  untuk Superadmin. Pengajuan biasa untuk diri sendiri boleh.
- **Memutus** (izin `izin_pemutus` jenisnya): hanya selama Menunggu; Tolak
  wajib alasan. Pengaju boleh memutus pengajuannya sendiri (Q-28), ditandai
  `diputus_sendiri`. Setujui ditolak bila periode gaji `PAID` (sama seperti
  ajukan).
- **Diketahui** (`hr.request.decide`): hanya untuk urgent berlaku tanpa
  `Diketahui`.
- **Batal**: Menunggu → pengaju (atau Superadmin); berlaku → pemegang izin
  pemutus jenisnya. Alasan wajib. Ditolak bila periode gaji `PAID`.

### 17.5 Hari, Alfa, audit, dan laporan (perubahan A-3)

**Hari wajib** (`tanggal_wajib` ↔ `tanggalWajib`): tanggal dalam rentang yang
`wajib_masuk` untuk karyawan itu, memakai shift `master_data.id_shift` SAAT
INI, `tbl_hari_libur`, dan whitelist (`evaluate_holiday_scan`), sama dengan
Generate Alfa. Riwayat shift tidak ada, jadi pengajuan lama mengikuti shift
sekarang (keterbatasan yang diterima).

**Tanggal hadir** = definisi `HARI_HADIR_SQL` (scan `Hadir`/`PRESENT` atau
laporan perjalanan), sebagai daftar tanggal (`TANGGAL_HADIR_SQL`, kembar).

- **Generate Alfa** (`operational.rs` ↔ `alfa-audit.ts`): setelah cek pelapor
  perjalanan, karyawan dengan pengajuan berlaku di tanggal itu dilewati
  (termasuk setengah hari), hitungan baru `jumlahPengajuan`.
- **Audit absensi**: tanggal yang ditutup pengajuan berlaku tidak dinilai,
  pola pelapor.
- **Laporan kehadiran** (`laporan_kehadiran` ↔ `getLaporanKehadiran`): data
  baru `pengajuan` (`PENGAJUAN_RENTANG_SQL`). Urutan kode
  `susunLaporanKehadiran`: H/T > pengajuan > S/I/D dari koreksi > A > L/M/-.
  Kode pengajuan hanya di tanggal yang dijadwalkan atau yang punya catatan
  (Alfa): **C** (Cuti, kode baru), **I** (Izin, termasuk setengah hari),
  **S** (Sakit). Kolom total baru `cuti`; I dan S ikut menghitung pengajuan.
  **DL** menunggu fase 3.
- **Rekap bulanan** (`REKAP_BULANAN_SQL`, kembar): per hari ditambah
  `kelompok` pengajuan berlaku (subkueri berpredikat `PENGAJUAN_BERLAKU_SQL`).
  Hari tanpa hadir yang ditutup pengajuan dihitung Sakit/Izin/Cuti
  (`totalCuti` baru), bukan Alfa. Seperti hari ini, rekap ini hanya melihat
  tanggal yang punya baris absensi.
- Baris Alfa lama tetap di `absensi_harian` (tidak ditulis, A-3); payroll
  tidak membaca Alfa, jadi gaji tidak terpengaruh.
- **Koreksi Admin** Sakit/Izin/Dispen tetap berfungsi dan tidak dimigrasi.
  Form koreksi memberi catatan: "Untuk catatan baru, pakai Pengajuan di HRIS."

### 17.6 Dampak ke gaji (perubahan A-4)

`cuti_dibayar(conn, mulai, akhir)` ↔ `cutiDibayar` mengembalikan per karyawan
`{ hari, menit }` dari pengajuan berlaku ber-`dampak_gaji = 'Dibayar'`, atas
tanggal wajib dalam periode (satu tanggal dihitung sekali walau bertumpuk):

| | Hari penuh | Setengah hari (Q-49) |
| :-- | :-- | :-- |
| FLAT_DAILY | +1 hari, kecuali tanggal hadir | +1 hari, kecuali tanggal hadir (sudah terhitung) |
| HOURLY | + `jam_kerja_normal_menit` shift kini, kecuali tanggal hadir (Q-47) | + ½ `jam_kerja_normal_menit` (dibulatkan ke bawah), selalu |

- Dikaitkan di baris agregat rekap (Rust `desktop_get_payroll_recap`, TS
  `computePayrollRecap`): `days_present += hari`, menit reguler `+= menit`
  (sebelum `apply_holiday_fallback`, sebagai jam hari biasa). Pembekuan run
  memakai baris rekap yang sama. `breakdown_snapshot` mencatat
  `cuti_dibayar: { hari, menit }` untuk slip.
- Shift ber-jam normal 0 menghasilkan 0 menit dan tanda `jam_normal_nol` di
  rekap.
- **`Potong Gaji` dan `Tidak Berpengaruh` tanpa kait payroll** (Q-48): hari
  itu tidak dibayar secara alami. Rumus potongan ditulis bila kelak ada tipe
  gaji bulanan.

### 17.7 Jatah cuti (§6.5)

Tidak disimpan. `jatah_cuti(...)` ↔ `jatahCuti` murni, diuji vektor yang sama;
datanya dikumpulkan satu fungsi baca per jalur.

- **Tanggal masuk** = `master_data.tanggal_daftar` (Q-41). Kosong = tanpa hak,
  tanda `tanpa_tanggal_masuk`. **Tanggal berhak** E = tanggal masuk +
  `hr_cuti_syarat_bulan` (akhir bulan dijepit, mis. 31 Jan + 1 bulan = 28/29
  Feb, memakai `tambah_bulan` fase 1).
- **Periode** `ulang_tahun_kerja`: [E + 12k bulan, E + 12(k+1) bulan), hak
  penuh. `kalender`: tahun kalender; tahun berjalannya E mendapat hak penuh
  mulai E bila `hr_cuti_prorata` = 0, atau ⌊hak × bulan tersisa ÷ 12⌋
  (bulan tersisa = bulan penuh dari E sampai 31 Desember) bila 1; tahun
  sebelumnya tanpa hak. Tanggal sebelum E tidak bisa memakai jatah.
- **Pemakaian** = tanggal wajib dari pengajuan berlaku `potong_jatah = 1`
  dalam periode, dikurangi tanggal hadir (Q-34). Pengajuan yang melintasi
  batas periode dibagi per tanggal.
- **Penyesuaian** periode itu (yang tidak dibatalkan) ditambahkan.
- **Dibawa** (Q-50, diturunkan tanpa baris): bila `hr_cuti_sisa = dibawa`,
  bawaan = min(maks(sisa periode sebelumnya, 0), `hr_cuti_bawa_maks`). Bawaan
  dipakai lebih dulu oleh pemakaian dalam `hr_cuti_bawa_bulan` bulan pertama
  periode; sisanya hangus setelah itu. Dihitung berantai dari periode pertama,
  jadi pengajuan offline yang telat ikut mengubahnya (belum ada uang yang
  keluar).
- **Diuangkan** (Q-50): bila `hr_cuti_sisa = diuangkan`, HRD menekan "Proses
  akhir periode" untuk periode yang sudah berakhir; dicatat baris
  `uang:<id_karyawan>:<periode>` jenis `Diuangkan`, `hari` = −sisa (sisa ≥ 0),
  `nominal` = sisa × upah harian dari `salary_configs` yang berlaku di akhir
  periode (FLAT_DAILY `daily_rate`; HOURLY `rate_per_hour` ×
  `jam_kerja_normal_menit` ÷ 60, dibulatkan ke rupiah terdekat, aritmetika
  bilangan bulat). Nilai dibekukan; dua perangkat menghasilkan PK yang sama
  dan yang pertama sampai di cloud yang berlaku. **Pembayarannya** ikut kait
  gaji reimbursement fase 4; sampai itu tampil "Perlu dibayar" dan dibayar
  manual.
- **Ganti `hr_cuti_periode`** (Q-54) berlaku langsung untuk semua periode;
  dialog konfirmasi memperingatkan bahwa sisa cuti dihitung ulang.
- Sisa minus boleh (HRD menyetujui melebihi jatah) dan tampil peringatan
  `jatah_minus`, pola "Stok minus". Form pengajuan memperlihatkan hari terpakai
  dan sisa jatah sebelum disimpan.

### 17.8 Hak akses

| Izin | Sensitif | HRD | Atasan | Admin bawaan |
| :-- | :-- | :-- | :-- | :-- |
| `hr.request.view` | | ya | ya | ya |
| `hr.request.submit` | | ya | ya | ya |
| `hr.request.urgent` | **ya (usul)** | | ya | tidak |
| `hr.request.decide` | ya | ya | | tidak |
| `hr.leave.adjust` | ya | | | tidak |

- `hr.request.urgent` diusulkan sensitif (beda dari §10.1): urgent sama dengan
  menyetujui, dan tanpa itu Admin bawaan mendapatkannya otomatis.
- Sensitif = `SENSITIVE_MUTATION_PERMISSIONS` + `NOT IN` seed Admin Rust.
  Role HRD dan Atasan diperbarui di Rust dan `DEFAULT_ROLE_PERMISSIONS`
  (paket bawaan saja; role yang sudah disunting Superadmin tidak ditimpa,
  sama seperti fase 1).
- Membaca lampiran cukup `hr.request.view`; menambah/menghapus lampiran oleh
  pengaju atau pemegang `hr.request.decide`.
- Halaman: tab Pengajuan di `/hris` dijaga `hr.request.view`; Mobile halaman
  `/pengajuan` dengan area baru `pengajuan` (`hr.request.view`).

### 17.9 Command, rute, dan layar

**Rust** (`desktop/hr_pengajuan.rs`, disalin ke Mobile; kedua `lib.rs`,
`build.rs`, `capabilities/default.json`): `desktop_hr_requests` (daftar +
status + tanda, saringan status/karyawan/rentang; `hr.request.view`),
`desktop_hr_request_save` (`hr.request.submit`, urgent juga
`hr.request.urgent`), `desktop_hr_request_decide` (`Setujui`/`Tolak`/
`Diketahui`/`Batal`, izin per §17.4), `desktop_hr_request_types_save`
(`hr.org.manage`), `desktop_hr_leave_balance` (jatah per periode + rincian
satu karyawan; `hr.request.view`), `desktop_hr_leave_adjust` dan
`desktop_hr_leave_period_close` (`hr.leave.adjust`); khusus cloud
`desktop_hr_request_files`, `desktop_hr_request_file`,
`desktop_hr_request_file_add`, `desktop_hr_request_file_delete`.
Pengaturan cuti lewat `desktop_hr_settings_save` yang diperluas.

**Web**: `validations/hr-pengajuan.ts` + `services/hr-pengajuan.ts`, rute
`POST /api/hris/requests/<…>` (Zod `.strict()`, tanpa `GET`), gateway
`gateways/hr-pengajuan.ts`.

**Layar** (Q-52: pengajuan juga di Mobile):

1. **Pengajuan** (`components/hris/PengajuanWorkspace.tsx`, di `filesToCopy`;
   tab di `/hris` dan halaman Mobile `/pengajuan`): daftar dengan saringan
   (Menunggu, Perlu diketahui, Perlu ditinjau = bertanda, Semua) + rentang;
   form Ajukan (`PilihCari` karyawan, jenis, tanggal, setengah hari bila Izin,
   alasan, Urgent bila boleh; ringkasan hari terpakai + sisa jatah;
   `konfirmasiData`); rincian (isi, riwayat keputusan, tanda, lampiran saat
   online, tombol sesuai izin).
2. **Tab Cuti di rincian karyawan `/hris`**: jatah per periode (hak, bawaan,
   penyesuaian, pemakaian, sisa), riwayat pengajuan, Penyesuaian
   (`hr.leave.adjust`). Mobile: ringkasan jatah satu karyawan di form ajukan.
3. **Organisasi `/hris`**: bagian Jenis pengajuan dan Aturan cuti
   (Web/Desktop).
4. **Proses akhir periode** (hanya mode `diuangkan`): daftar karyawan yang
   periodenya berakhir dan belum diproses, plus daftar "Perlu dibayar".
5. Catatan di form Koreksi Admin untuk Sakit/Izin.

### 17.10 Jawaban fase 2 (10 Nov 2026)

| No | Pertanyaan | Jawaban |
| :-- | :-- | :-- |
| Q-47 | HOURLY + `Dibayar` | `jam_kerja_normal_menit` shift kini per hari wajib, kecuali hari itu ada scan Hadir |
| Q-48 | `Potong Gaji` untuk gaji bulanan | Tipe gaji bulanan tidak ada; tanpa kait payroll |
| Q-49 | Setengah hari (Izin) | Tidak di-Alfa-kan; Dibayar: FLAT_DAILY 1 hari, HOURLY + ½ jam normal |
| Q-50 | Dibawa dan diuangkan | Dibawa diturunkan tanpa baris; diuangkan dicatat HRD (`uang:`), dibayar lewat kait fase 4 |
| Q-51 | Lampiran | Khusus cloud, pola `hr_dokumen_berkas`; wajib dokumen = tanda |
| Q-52 | Mobile | Pengajuan juga di Mobile; pengaturan Web/Desktop |
| Q-53 | Satuan `maks_hari` | Kolom `satuan_maks` per jenis |
| Q-54 | Ganti `hr_cuti_periode` | Berlaku langsung dengan peringatan |

### 17.11 Langkah

| # | Langkah | Gerbang |
| :-- | :-- | :-- |
| 1 | **Sisa fase 1**: penerima `Divisi` tampil nama kini (`CASE WHEN m.penerima_tipe = 'Divisi' THEN <divisi_kini(m.penerima_nama)> ELSE m.penerima_nama END`) di `stock_card` ↔ `stockCard`, `list_loans` ↔ `listLoans`, `document` ↔ `documentInventaris`. | tes kembar: ganti nama divisi, kartu stok menampilkan nama baru |
| 2 | **Skema v37**: 4 tabel tersinkron + 1 khusus cloud, jenis bawaan JSON, sentinel `-2033`, `REQUIRED_TABLE_COUNT` 84, promosi, purge, klasifikasi. | `audit:schema` + tes sentinel/provisioning Rust |
| 3 | **Aturan domain kembar** `hr_pengajuan.rs` ↔ `validations/hr-pengajuan.ts`: sidik, status, tanda, validasi §17.4, `tanggal_wajib`, `PENGAJUAN_BERLAKU_SQL`/`PENGAJUAN_RENTANG_SQL`/`TANGGAL_HADIR_SQL`/`PERIODE_DIBAYAR_SQL` (teks identik), `jatah_cuti`, `cuti_dibayar`. | `bun test` + `cargo test hr_pengajuan` |
| 4 | **Sinkronisasi**: rute §17.2, handler cloud (tidak menolak), penulisan lokal + outbox satu transaksi, snapshot. | `audit:contract` + tes cloud `TursoClient::local_file` |
| 5 | **A-3**: Generate Alfa, audit, laporan kehadiran, rekap bulanan. | tes `alfa-audit`, `attendance-audit`, `laporan-kehadiran`, `report` (dijalankan terpisah) + padanan Rust |
| 6 | **A-4**: kait rekap gaji. | tes `payroll-recap` + `loan` + Rust payroll tetap lulus, vektor baru |
| 7 | **RBAC + command + rute + gateway**. | tes Rust + `web-rbac-boundary` |
| 8 | **Layar** Web/Desktop dan Mobile. | typecheck + Biome |
| 9 | `bun run sync:mobile`, bagian `CLAUDE.md`, catatan "Sudah dibangun". | `audit:docs`; `bun run check` penuh oleh pemilik |

### 17.12 Sudah dibangun (10 Nov 2026)

Langkah 1–9 dibangun. Gerbang yang dijalankan: `audit:schema`,
`audit:contract` (86 rute, 60 tabel snapshot), dan `audit:docs` lulus;
`cargo test --lib` Desktop 381 dan Mobile 385 lulus (termasuk
`tests_alur`: penulisan lokal + outbox lalu payload outbox diterapkan ke
database cloud `TursoClient::local_file`); tes TS terkait lulus
(`hr-pengajuan.test.ts` dengan vektor kembar, `hr-pengajuan-absensi.test.ts`
untuk Alfa, audit, dan rekap gaji, laporan, rekap bulanan, inventaris, RBAC);
typecheck kedua workspace dan Biome berkas yang diubah bersih. `bun run check`
penuh belum dijalankan (pemilik).

Penyimpangan dari §17.1–§17.9, untuk ditinjau:

- **Halaman `/pengajuan` (menu "Cuti & Izin"), bukan tab di `/hris`.** Satu
  halaman yang sama di Web, Desktop, dan Mobile; Atasan tidak butuh area
  `hris`. Tab Cuti di rincian karyawan dan jenis + aturan cuti di tab
  Organisasi `/hris` tetap seperti rancangan.
- **Aturan cuti lewat command sendiri** `desktop_hr_leave_settings_save`
  (Web: aksi `aturan`), bukan memperluas `desktop_hr_settings_save`, karena
  nilainya campuran teks dan angka.
- **`diputus_sendiri` tidak berlaku untuk urgent.** Urgent memang diputus
  pengajunya; tanda Q-28 hanya untuk Setujui/Tolak oleh pengaju yang sama.
- **`tanpa_dokumen` dan `jatah_minus` bukan tanda daftar.** Lampiran khusus
  cloud dan jatah butuh hitungan per karyawan, jadi keduanya tampil di
  rincian pengajuan (saat online) dan di form ajukan / tab Cuti.
- **Kode C/I/S hanya di TS** (`kodeKelompok`): matriks laporan disusun di
  `laporan-kehadiran.ts` untuk ketiga build; Rust hanya mengirim data
  `pengajuan` (`LAPORAN_PENGAJUAN_SQL`).
- **Tes integrasi Alfa/audit/gaji hanya di TS.** Padanan Rust menguji fungsi
  yang dipanggil kaitnya (`pengaju_tanggal`, `cuti_dibayar`) dengan data yang
  setara; Generate Alfa dan rekap gaji Rust memanggil fungsi yang sama.
- Rekap bulanan menambah kolom `totalCuti` di data; belum ada layar yang
  menampilkannya. Ekspor laporan kehadiran menambah kolom Cuti.
- Catatan di form Koreksi Admin (Web/Desktop dan Mobile) untuk Sakit/Izin.

## 18. Urutan pengerjaan fase 3

Ditulis setelah menelusuri kode (10 Nov 2026), disetujui pemilik. Q-55 sampai
Q-58 dijawab (§18.9) dan isi bagian ini mengikuti jawabannya. Bila §7 dan
bagian ini berbeda, **bagian ini yang berlaku**.

### 18.1 Temuan dari kode

- **`PENGAJUAN_RENTANG_SQL` dan `LAPORAN_PENGAJUAN_SQL` tidak menyaring
  kelompok.** Begitu Lembur atau Tukar Shift berlaku, `pengaju_tanggal`
  menutup tanggal itu dari Generate Alfa dan audit, padahal karyawannya tetap
  wajib masuk. Keduanya harus disaring ke kelompok ketidakhadiran.
- `cuti_dibayar` ↔ `cutiDibayar` hanya membaca `dampak_gaji = 'Dibayar'`.
  Lembur dan Tukar Shift harus `Tidak Berpengaruh`; itu juga melindungi
  perangkat v37 yang belum diperbarui (mereka tetap memakai SQL lama dan akan
  memperlakukan pengajuan Lembur sebagai cuti dibayar bila jenisnya `Dibayar`).
- CHECK `hr_pengajuan.kelompok` sudah memuat nilai fase 3. CHECK
  `setengah_hari` hanya untuk Izin, jadi Dinas Luar setengah hari butuh
  membangun ulang tabel di keempat lapis (tidak diusulkan).
- **Lembur absensi** = `max(0, jam_kerja − jam_kerja_normal_menit)` per baris
  sesi (`time_policy`), tanpa melihat jam pulang shift. Rekap gaji menjumlahkan
  per periode; tanggal libur (`tbl_hari_libur` aktif, atau di luar hari kerja
  shift BARIS itu) memindahkan seluruh jam hari itu ke jam hari libur.
  **Jenjang `overtime_tier_rules` diterapkan pada total jam satu periode,
  bukan per hari** (`calculateOvertimeIndex`); perilaku lama, tidak diubah fase
  ini. FLAT_DAILY tidak membayar lembur sama sekali, jadi SPL untuk gaji harian
  hanya administrasi.
- **`backup_karyawan` satu arah.** Karyawan asal ditolak scanner ("sedang
  digantikan"); pengganti scan dengan `id_shift_backup` sebagai sesi
  `PENGGANTI`. Generate Alfa dan audit tidak membaca `backup_karyawan` sama
  sekali, jadi asal yang digantikan tetap di-Alfa kecuali ada koreksi.
  Tukar dua arah lewat dua baris backup **gagal**: tiap orang menjadi asal di
  satu baris dan pengganti di baris lain, `find_effective_backup` ↔
  `findEffectiveBackup` mengambil baris pertama yang cocok (urut `id_backup`),
  sehingga salah satu ditolak scan, dan keduanya di-Alfa karena tidak punya
  sesi `NORMAL`. Baris backup juga ditulis langsung (bukan status turunan) dan
  jalur Web-nya memakai jam JS.
- Scanner memakai `master_data.id_shift` sebagai shift dasar di satu titik
  (`baseShiftRow` di `attendance-processor.ts`, `base_shift` di `scanner.rs`);
  id sesi `NORMAL-<tanggal>-<id>-<shift>`, kode shift whitelist libur, dan
  multi-sesi turun dari sana. Generate Alfa, audit, dan laporan kehadiran juga
  membaca shift dari `master_data`.
- **Dinas luar sudah hampir lengkap lewat fase 2**: Alfa dan audit menutup
  tanggal pengajuan berlaku apa pun, dan `cuti_dibayar` memberi FLAT_DAILY +1
  hari dan HOURLY + jam normal kecuali hari hadir. Memperluas `HARI_HADIR_SQL`
  (usul §7.3) hanya menolong FLAT_DAILY; HOURLY tetap tanpa jam.
- `kodeKelompok` mengembalikan `null` untuk kelompok lain, jadi Lembur dan
  Tukar Shift sudah tidak tampil di laporan; DL tinggal ditambahkan.
- Aturan cuti disimpan lewat `desktop_hr_leave_settings_save`
  (`hr.org.manage`, Web aksi `aturan`).
- Tidak ada tabel baru: `REQUIRED_TABLE_COUNT` tetap 84.

### 18.2 Model data (skema v38, sentinel `-2034` `hris-pengajuan-v2`)

**Isian sebagai kolom di `hr_pengajuan`, bukan tabel anak** (keputusan §12).
Satu baris = satu sidik = satu event `hr-request/save`; tabel anak butuh
`PendingGuard` dan event gabungan, sedangkan isiannya hanya satu tanggal dan
paling banyak tiga nilai.

| Kolom baru | Kelompok | Arti |
| :-- | :-- | :-- |
| `jam_mulai`, `jam_selesai` TEXT | Lembur | `HH:MM`; `jam_selesai <= jam_mulai` = lewat tengah malam |
| `id_karyawan_tukar` TEXT | Tukar Shift | karyawan kedua |
| `id_shift_asal`, `id_shift_tukar` INTEGER | Tukar Shift | salinan shift `id_karyawan` dan `id_karyawan_tukar` saat diajukan; mengganti shift karyawan sesudahnya tidak mengubah tukar yang sudah ada |

- `CREATE` di keempat lapis + `ensure_column`/`hasColumn`, **tanpa CHECK**:
  `ALTER TABLE ADD COLUMN` tidak bisa memuat CHECK lintas kolom, dan database
  baru dan lama harus sama. Ditegakkan Rust, TS, dan handler cloud (bentuk salah
  = tanpa statement = konflik, pola fase 2).
- Indeks `idx_hr_pengajuan_tukar (id_karyawan_tukar, tanggal_mulai)` setelah
  loop `ensure_column` dan di `INDEX_MIGRATIONS` (aturan 20).
- `UPSERT_PENGAJUAN_SQL` (Rust = TS) + lima kolom; handler `hr-request/save`
  menulisnya. Perangkat v37 tidak pernah mengirim kelompok baru
  (`periksa_jenis` lama menolaknya) dan mengirim Cuti/Izin/Sakit tanpa kunci
  baru = kosong, jadi tidak perlu pola "hanya bila kunci dibawa".

**Isian per kelompok** (`validasi_pengajuan` ↔ `validasiPengajuan`, kembar):

| Kelompok | Tanggal | Isian lain | `alasan` di form |
| :-- | :-- | :-- | :-- |
| Cuti, Izin, Sakit | rentang (fase 2) | kolom baru kosong | Alasan |
| Dinas Luar | rentang, tanpa setengah hari | kolom baru kosong | Tujuan dan keperluan |
| Lembur | satu tanggal kerja (= `absensi_harian.tanggal`, shift malam ikut tanggal masuk) | jam mulai/selesai, durasi 1–1.439 menit | Pekerjaan |
| Tukar Shift | satu tanggal | karyawan kedua aktif, bukan dirinya; shift keduanya ada dan berbeda | Alasan |

**Jenis**: `KELOMPOK_AKTIF` + `Lembur`, `Tukar Shift`, `Dinas Luar`. Untuk
Lembur dan Tukar Shift `validasi_jenis` memaksa `dampak_gaji = 'Tidak
Berpengaruh'`, `potong_jatah = 0`, `maks_hari` kosong. Bawaan baru di
`hr-jenis-bawaan.json` (`INSERT OR IGNORE`, id tetap): `jns-lembur` (urgent
ya), `jns-tukar-shift` (urgent tidak), `jns-dinas-luar` (`Dibayar`, urgent ya,
wajib dokumen tidak).

**Pengaturan** (`setting_gex_system`, lewat `desktop_hr_leave_settings_save` /
aksi `aturan` yang diperluas; kosong = bawaan): `hr_lembur_mode` `otomatis` |
`spl` (bawaan `otomatis`), `hr_lembur_maks_harian` jam 1–12 (4),
`hr_lembur_maks_mingguan` jam 1–72 (18).

Kedua jalur: `CURRENT_SCHEMA_VERSION`/`CLIENT_SCHEMA_VERSION` 38, sentinel
`-2034` + angka `ensure_schema_current`. Tanpa tabel baru, jadi
`REQUIRED_TABLE_COUNT`, `PROMOTION_PLAN`, purge, dan `CLOUD_MIRRORED_TABLES`
tidak berubah.

### 18.3 Status, sidik, dan kueri

- Status, keputusan, urgent, Diketahui, Batal: fase 2 apa adanya.
- **Sidik**: sembilan bagian fase 2 tetap untuk Cuti/Izin/Sakit/Dinas Luar,
  jadi sidik dan keputusan lama tidak gugur. Lembur menambah `jam_mulai`,
  `jam_selesai`; Tukar Shift menambah `id_karyawan_tukar`, `id_shift_asal`,
  `id_shift_tukar`.
- `PENGAJUAN_RENTANG_SQL` dan `LAPORAN_PENGAJUAN_SQL` + `AND p.kelompok IN
  ('Cuti', 'Izin', 'Sakit', 'Dinas Luar')`; semua pembaca fase 2 berhenti
  melihat Lembur dan Tukar Shift.
- `SPL_RENTANG_SQL`: Lembur berlaku `?1`..`?2` → karyawan, tanggal, jam.
- `TUKAR_RENTANG_SQL`: Tukar Shift berlaku → `(id_karyawan, tanggal,
  id_shift_tukar)` UNION `(id_karyawan_tukar, tanggal, id_shift_asal)`.
  Ketiganya memakai `berlaku_sql!` / `PENGAJUAN_BERLAKU_SQL`, teks kembar.
- **Bertumpuk** (perangkat dan Web, `bentrok_pengajuan` ↔ `bentrokPengajuan`;
  pengajuan Menunggu atau berlaku, karyawan dicocokkan di `id_karyawan` DAN
  `id_karyawan_tukar`):

  | | Ketidakhadiran | Lembur | Tukar Shift |
  | :-- | :-- | :-- | :-- |
  | **Ketidakhadiran** (Cuti, Izin, Sakit, DL) | tolak (fase 2) | tolak, kecuali Izin setengah hari | tolak |
  | **Lembur** | | tolak bila jamnya beririsan | boleh |
  | **Tukar Shift** | | | tolak |

  Tukar Shift juga ditolak bila salah satu karyawan punya `backup_karyawan`
  Aktif di tanggal itu.
- "Tidak untuk diri sendiri" untuk Tukar Shift berlaku bila karyawan sesi salah
  satu dari keduanya.
- **Tanda baru** `lembur_lewat_batas`: SPL Menunggu/berlaku karyawan itu
  berjumlah > `hr_lembur_maks_harian` di tanggal itu, atau > 
  `hr_lembur_maks_mingguan` di minggu Senin–Minggu-nya. Tidak menolak.

### 18.4 Lembur dan gaji (perubahan A-4)

- **`otomatis`**: rekap tidak berubah; SPL hanya administrasi.
- **`spl`**: `lembur_spl(conn, mulai, akhir)` ↔ `lemburSpl` per karyawan per
  tanggal kerja. Aturan murni `potong_lembur_spl` ↔ `potongLemburSpl` diuji
  vektor yang sama:
  - menit SPL = jumlah durasi SPL berlaku tanggal itu;
  - hari biasa: lembur absensi L, dibayar `min(SPL, L)`;
  - hari libur dan libur mingguan (definisi rekap yang ada): menurut Q-56
    (usul: seluruh jam hari itu juga butuh SPL, dibayar `min(SPL, jam kerja +
    lembur)`; potongan diambil dari bagian lembur dulu, baru jam kerja, supaya
    `apply_holiday_fallback` tetap benar);
  - hasilnya mengurangi `total_lembur_menit`/`total_libur_menit`/
    `total_libur_jam_kerja_menit` di baris agregat rekap (Rust
    `desktop_get_payroll_recap`, TS `computePayrollRecap`), sebelum
    `apply_holiday_fallback`.
- Baris rekap + `lembur_tanpa_spl_menit` (jam lembur di tanggal tanpa SPL) dan
  `lembur_dipotong_menit` (seluruh yang tidak dibayar); `breakdown_snapshot`
  mencatat `lembur_spl: { mode, dipotong_menit, tanpa_spl_menit }`. Layar rekap
  gaji menampilkan kolom "Lembur tanpa SPL" di mode `spl`.
- Mode dibaca saat rekap dihitung, termasuk saat run dibekukan (Q-57).
- FLAT_DAILY tidak terpengaruh; tarif tetap `overtime_tier_rules`.

### 18.5 Tukar shift (scanner, Alfa, audit, laporan)

Usul Q-55: **dibaca langsung dari pengajuan berlaku, bukan lewat
`backup_karyawan`** (§18.1). Satu pengajuan = satu tanggal, dua karyawan:
`id_karyawan` memakai `id_shift_tukar`, `id_karyawan_tukar` memakai
`id_shift_asal`. Bila salah satu shift tidak menjadwalkan tanggal itu, orang
itu libur dan yang lain masuk (tukar libur).

- **Scanner** (`scanner.rs` ↔ `attendance-processor.ts`): `shift_tukar_scan` ↔
  `shiftTukarScan` mencari tukar berlaku karyawan itu di tanggal kalender scan
  dan sehari sebelumnya; kandidat terbaru yang tanggal kerjanya menurut shift
  tukar = tanggal tukar dipakai (pola asal di `find_effective_backup`). Shift
  dasar diganti di SATU titik sebelum `baseShiftRow`/`base_shift`; id sesi,
  whitelist libur, multi-sesi, jam kerja, dan lembur mengikutinya. Backup tetap
  diperiksa lebih dulu, dan sesi terbuka shift lama tetap ditutup dengan
  shiftnya sendiri.
- **Generate Alfa** (`operational.rs` ↔ `alfa-audit.ts`) dan **audit**: untuk
  tanggal bertukar, hari kerja, jam pulang, dan batas Alfa memakai shift tukar.
  Tanggal tukar hari ini dan kemarin dinilai terpisah dengan shift tukarnya,
  supaya tukar ke shift malam tetap dinilai; penilaian shift dasar melewati
  tanggal itu.
- **Laporan kehadiran**: data baru `tukar` (karyawan, tanggal, hari kerja dan
  kode shift tukar) untuk "dijadwalkan" di tanggal itu. Rekap gaji tidak perlu
  kait: libur mingguan sudah dibaca dari `absensi_harian.id_shift`.
- Terminal yang belum menarik persetujuan memakai shift lama (keterbatasan
  offline yang sama dengan backup).

### 18.6 Dinas luar

Usul Q-58: **jalur fase 2 apa adanya.** Alfa dan audit tertutup; gaji lewat
`cuti_dibayar` menurut `dampak_gaji` jenisnya (bawaan `Dibayar`: FLAT_DAILY +1
hari, HOURLY + jam normal shift kini, kecuali hari hadir). `HARI_HADIR_SQL`
tidak diubah (beda dari §7.3), tanpa setengah hari, wajib dokumen per jenis.

- Laporan kehadiran: kode **DL** (`kodeKelompok`), total baru `dinas`,
  dihitung hari wajib dan ikut persen hadir (bekerja di luar kantor). Rekap
  bulanan + `totalDinas`, ekspor + kolom Dinas.
- Uang dinas tetap reimbursement fase 4.

### 18.7 Hak akses

Tanpa izin baru. Mengajukan, urgent, dan memutus memakai izin fase 2
(`izin_pemutus` jenisnya); pengaturan lembur `hr.org.manage`.

### 18.8 Command, rute, dan layar

Tanpa command dan rute outbox baru (`audit:contract` tidak berubah):
`desktop_hr_request_save` dan Web `simpanPengajuan` menerima isian baru,
`desktop_hr_requests` membawa kolom dan tanda baru,
`desktop_hr_leave_settings_save` + tiga kunci lembur, baris rekap gaji + dua
angka lembur.

**Layar**:

1. `PengajuanWorkspace` (Web, Desktop, Mobile): isian menurut kelompok jenis
   (Lembur: tanggal, jam mulai/selesai, pekerjaan, ringkasan jam hari itu dan
   minggu itu; Tukar Shift: tanggal + `PilihCari` karyawan kedua, dengan shift
   keduanya sebelum dan sesudah; Dinas Luar: rentang + tujuan). Daftar dan
   rincian menampilkan jam atau pasangan tukar.
2. Organisasi `/hris`: "Aturan cuti" menjadi "Aturan cuti dan lembur" (mode,
   batas harian dan mingguan); mengganti mode memperingatkan bahwa rekap gaji
   yang belum dibekukan ikut berubah.
3. Rekap gaji: kolom "Lembur tanpa SPL" di mode `spl`.
4. Laporan kehadiran: kode DL dan kolom Dinas.

### 18.9 Jawaban fase 3 (10 Nov 2026)

| No | Pertanyaan | Jawaban |
| :-- | :-- | :-- |
| Q-55 | Tukar shift lewat `backup_karyawan` atau dibaca dari pengajuan? | Dari pengajuan (§18.5); `backup_karyawan` tidak bisa dua arah tanpa merombak scanner dan tidak dibaca Alfa |
| Q-56 | Mode `spl` di hari libur / libur mingguan | Seluruh jam hari itu butuh SPL, dibayar `min(SPL, jam kerja + lembur)` |
| Q-57 | Ganti `hr_lembur_mode` di tengah periode | Berlaku untuk seluruh periode yang belum dibekukan, dengan peringatan; run yang sudah dibekukan mencatat modenya |
| Q-58 | Dampak dinas luar ke gaji | Lewat `cuti_dibayar` per jenis (FLAT +1 hari, HOURLY + jam normal), tanpa setengah hari, wajib dokumen per jenis |

### 18.10 Langkah

| # | Langkah | Gerbang |
| :-- | :-- | :-- |
| 1 | **Skema v38**: lima kolom + indeks di keempat lapis, jenis bawaan baru, sentinel `-2034`. | `audit:schema` + tes sentinel/provisioning Rust |
| 2 | **Aturan kembar** `hr_pengajuan.rs` ↔ `validations/hr-pengajuan.ts`: isian per kelompok, sidik diperluas, saringan kelompok, `SPL_RENTANG_SQL`, `TUKAR_RENTANG_SQL`, bentrok, `lembur_lewat_batas`, `potong_lembur_spl`, `shift_tukar_scan`. | `bun test` + `cargo test hr_pengajuan` |
| 3 | **Sinkronisasi**: `UPSERT_PENGAJUAN_SQL` dan handler cloud `hr-request/save`. | `audit:contract` + `tests_alur` |
| 4 | **Tukar shift**: scanner, Generate Alfa, audit, laporan. | tes `attendance-processor`, `alfa-audit`, `attendance-audit`, `laporan-kehadiran` (terpisah) + padanan Rust scanner |
| 5 | **Lembur SPL**: kait rekap gaji kedua jalur, pengaturan. | tes `payroll-recap*` + Rust payroll, vektor baru |
| 6 | **Dinas luar**: DL di laporan dan rekap bulanan. | tes laporan + rekap bulanan |
| 7 | **Layar** Web/Desktop dan Mobile. | typecheck + Biome |
| 8 | `bun run sync:mobile`, bagian `CLAUDE.md`, catatan "Sudah dibangun". | `audit:docs`; `bun run check` penuh oleh pemilik |

### 18.11 Sudah dibangun (10 Nov 2026)

Langkah 1–8 dibangun. Gerbang yang dijalankan: `audit:schema`,
`audit:contract` (60 tabel snapshot, command Desktop 267 / Mobile 273), dan
`audit:docs` lulus; `cargo test --lib` Desktop 390 lulus (termasuk
`sentinel_2033_memicu_kolom_pengajuan_fase_3`, `tests_alur::alur_fase3_tukar_dan_lembur`,
`tukar_shift_berlaku_mengganti_shift_dasar_scan`,
`tukar_shift_dan_lembur_saat_generate_alfa`); tes TS terkait lulus
(`hr-pengajuan.test.ts` dengan vektor kembar fase 3 dan teks SQL kembar,
`hr-pengajuan-fase3.test.ts` untuk Alfa, audit, simpan Web, dan rekap gaji
SPL, `attendance-processor`, `laporan-kehadiran`, `report`, `alfa-audit`,
`attendance-audit`, `operational-workflow`, `hr-pengajuan-absensi`,
`payroll-recap-hari-kerja`, `loan`); typecheck kedua workspace dan Biome
berkas yang diubah bersih. `bun run check` penuh lulus (pemilik, 10 Nov 2026).

Penyimpangan dan catatan, untuk ditinjau:

- **Kolom baru terdaftar di `SNAPSHOT_TABLES`** `hr_pengajuan` (Desktop dan
  Mobile `sync.rs`). Tidak tertulis di §18.2; tanpa itu isian lembur dan tukar
  tidak pernah tertarik ke perangkat lain (`audit:contract` menangkapnya).
- **Rekap gaji tanpa kolom baru.** "Lembur tanpa SPL" tampil sebagai baris kecil
  di sel Jam Lembur (`X j tidak dibayar (SPL)`, rinciannya di tooltip), karena
  tabel rekap memakai kolom tetap. Angkanya ada di baris rekap
  (`lembur_dipotong_menit`, `lembur_tanpa_spl_menit`, `lembur_mode`) dan di
  `breakdown_snapshot.lembur_spl`.
- **Aturan lembur disimpan lewat command aturan cuti** yang sama
  (`desktop_hr_leave_settings_save` / aksi `aturan`): satu tombol "Simpan aturan
  cuti dan lembur"; drafnya wajib membawa ketiga kunci lembur.
- **Tes `attendance-processor.test.ts` kini memuat modul lewat `await import`**
  dengan `server-only` di-mock, karena scanner Web membaca tukar shift dari
  `services/hr-pengajuan` (yang `server-only`).
- Tukar shift dua offline untuk orang dan tanggal yang sama: yang ber-id
  pengajuan terkecil dipakai di semua perangkat (`ORDER BY 1, 2, 4`); keduanya
  ditandai `bertumpuk` di daftar.
- Lembur lewat tengah malam dicatat di tanggal kerjanya (tanggal masuk shift);
  irisan jam dinilai di garis waktu tanggal itu.
- Tidak ada tes Rust khusus untuk audit dengan tukar shift; penggantian shiftnya
  satu baris dan diuji di TS (`hr-pengajuan-fase3.test.ts`).

## 19. Urutan pengerjaan fase 4

Ditulis setelah menelusuri kode (10 Nov 2026). Q-59 sampai Q-62 dijawab
pemilik (§19.9) dan isi bagian ini mengikuti jawabannya. Bila §8 dan bagian ini
berbeda, **bagian ini yang berlaku**.

### 19.1 Temuan dari kode

- CHECK `hr_jenis_pengajuan.kelompok`/`hr_pengajuan.kelompok` sudah memuat
  `Reimburse` dan CHECK `izin_pemutus` sudah memuat `reimburse.decide`; handler
  cloud `hr-request-type/save` dan `hr-request/save` juga sudah menerimanya.
  Yang menolak hanya aplikasi: `KELOMPOK_AKTIF`, `validasi_jenis` (memaksa
  `izin_pemutus = hr.request.decide`), dan `SEED_JENIS_SQL` (menanam
  `'hr.request.decide'` sebagai literal).
- `putuskan` sudah membaca `izin_pemutus` dari jenisnya, jadi pemutus per jenis
  tinggal dipakai. Gerbang command `desktop_hr_request_decide` masih
  `hr.request.submit`/`hr.request.decide` saja; `desktop_hr_requests` dan
  halaman `/pengajuan` butuh `hr.request.view`.
- **`bentrok_pengajuan` akan menolak klaim**: lengan bawaannya (`a.tidak_hadir()
  || b.tidak_hadir()`) dan lengan Lembur membuat klaim di tanggal cuti atau
  lembur dianggap bertumpuk. Reimburse wajib dikecualikan paling awal.
- `tolak_bila_dibayar` (`PERIODE_DIBAYAR_SQL`) dipanggil saat ajukan, Setujui,
  dan Batal. Untuk klaim ini salah sasaran: nota bulan lalu yang gajinya sudah
  dibayar justru kasus biasa.
- Pembaca absensi dan gaji fase 2–3 (`PENGAJUAN_RENTANG_SQL`,
  `LAPORAN_PENGAJUAN_SQL`, `SPL_RENTANG_SQL`, `TUKAR_RENTANG_SQL`,
  `tanggal_wajib`, `hadir_saat_cuti`) sudah menyaring kelompok, jadi klaim tidak
  menyentuh Alfa, audit, laporan, `cuti_dibayar`, atau SPL.
- `hr_pengajuan_keputusan` append-only (`ON CONFLICT DO NOTHING`) dan tidak
  punya kolom nominal. Nominal yang disetujui adalah milik keputusan, bukan isi
  pengajuan, jadi menaruhnya di keputusan tidak menyentuh sidik.
- **Kait gaji kasbon**: `pinjaman_aktif` membaca potongan yang sudah masuk
  proses gaji lewat `json_each(breakdown_snapshot, '$.kasbon')` dari run yang
  tidak `REJECTED`; saat `PAID`, `periksa_potongan_payroll` menolak bila
  kasbonnya sudah tidak sah ("Tolak proses gaji ini lalu buat ulang"), lalu
  `catat_pembayaran_payroll_tx` menulis angsuran dan jurnal `pay-<run>`. Kasbon
  yang masih ada di proses gaji belum dibayar tidak bisa dibatalkan
  (`PESAN_POTONGAN_TERTUNDA`).
- Engine gaji: HOURLY `net = gross − potongan − BPJS karyawan − PPh 21`,
  FLAT_DAILY `net = gross − potongan`; kasbon dikurangkan SESUDAH engine.
  Tambahan yang ditempel sesudah engine otomatis tidak kena pajak/BPJS.
- Rekap gaji hanya memuat `master_data.status_aktif = 'Aktif'`: klaim karyawan
  yang sudah keluar tidak pernah ikut gaji.
- `susun_jurnal_payroll`: `potongan_lain = gross − net − pph21 − bpjs_k −
  kasbon`. Menambah reimbursement ke `net` tanpa suku baru membuat baris
  Potongan Gaji Lain ter-debit.
- Slip (`SlipGajiPrintView`) menampilkan `components` per kategori
  ALLOWANCE/DEDUCTION; tunjangan dari komponen ikut bruto.
- Cuti diuangkan: baris `uang:<karyawan>:<periode>` (`Diuangkan`, nominal
  beku). `akhir_periode` menampilkan semua baris itu sebagai "Perlu dibayar"
  tanpa status bayar.
- Pola pembayaran terpisah ada di driver v35 (`drv_upah_bayar`/`_baris`,
  `bayar_aktif`, `periksa_bayar_upah`, `periksa_batal_bayar`, `tanda_upah`).
- Tidak ada role Keuangan bawaan (hanya Admin, HRD, Atasan, Driver).
- Lampiran fase 2: pengaju atau `hr.request.decide` yang boleh mengubah.
- **Perangkat v38** membaca baris klaim dari snapshot: `bentrok_pengajuan`
  lamanya menolak cuti di tanggal yang punya klaim, daftar lamanya menampilkan
  klaim tanpa nominal, dan ia bisa memutus klaim (izin dibaca dari jenis) tanpa
  nominal disetujui. Semua perangkat wajib diperbarui sebelum klaim dipakai.

### 19.2 Model data (skema v39, sentinel `-2035` `hris-reimburse-v1`)

**Klaim = baris `hr_pengajuan` berkelompok `Reimburse`** (bukan tabel sendiri).
Status, keputusan, Batal, sidik, lampiran, daftar, dan layar fase 2 dipakai apa
adanya; tabel sendiri berarti menyalin seluruh mesin itu.

**Kategori = jenis pengajuan berkelompok `Reimburse`** (Q-59), bukan
`hr_reimburse_kategori`: jenis sudah punya nama, aktif/nonaktif,
`izin_pemutus`, dan `wajib_dokumen` (= wajib nota).

**Kolom baru** (`CREATE` di keempat lapis + `ensure_column`/`hasColumn`, tanpa
CHECK, pola §18.2; WAJIB juga di `SNAPSHOT_TABLES.columns` Desktop dan Mobile):

| Kolom | Arti |
| :-- | :-- |
| `hr_jenis_pengajuan.batas_bulanan` INTEGER | rupiah per karyawan per bulan, kosong = tanpa batas; hanya Reimburse; peringatan saja |
| `hr_pengajuan.nominal` INTEGER | rupiah yang diajukan; hanya Reimburse, 1–1.000.000.000 |
| `hr_pengajuan_keputusan.nominal_disetujui` INTEGER | hanya `Setujui` atas Reimburse, 1–`nominal` |

- `UPSERT_JENIS_SQL`, `UPSERT_PENGAJUAN_SQL`, `INSERT_KEPUTUSAN_SQL`,
  `CLOUD_INSERT_KEPUTUSAN_SQL` (Rust = TS) + kolomnya.
- Handler `hr-request-type/save` menimpa `batas_bulanan` **hanya bila payload
  membawa kuncinya** (pola `atribut` inventaris): perangkat v38 yang menyimpan
  jenis lain tidak boleh menghapus batas. `nominal` tidak butuh itu (v38 tidak
  pernah menyimpan Reimburse), keputusan insert-only.

**Tabel tersinkron baru** (keempat lapis, `SNAPSHOT_TABLES` = `SNAPSHOT_SOURCES`,
`delete_missing: false`, append-only, tanpa `UNIQUE` selain PK, tanpa
`PendingGuard`), pola `drv_upah_bayar`:

| Tabel | Kolom | Snapshot / rute |
| :-- | :-- | :-- |
| `hr_reimburse_bayar` | `id_bayar` PK (`rbb-<acak>`, pembatalan `batal-<id_bayar>`); `jenis` CHECK IN (`Bayar`, `Pembatalan`); `id_ref`; `id_karyawan` NOT NULL; `tanggal` NOT NULL (WIB); `total` INTEGER NOT NULL CHECK `>= 0`; `keterangan`; `dicatat_oleh` NOT NULL; `created_at`. Indeks `(id_karyawan, tanggal)` | `hr-reimburse-payment` / `hr-reimburse-payment/create` (header + baris satu event, pembatalan juga) |
| `hr_reimburse_bayar_baris` | `id_baris` PK (`<id_bayar>:<id_klaim>`); `id_bayar` NOT NULL; `sumber` CHECK IN (`Reimburse`, `Cuti Diuangkan`); `id_klaim` NOT NULL (id pengajuan, atau id penyesuaian `uang:`); `nominal` INTEGER NOT NULL CHECK `>= 0` (disalin saat dibayar). Indeks `id_bayar`, `id_klaim` | domain snapshot `hr-reimburse-payment-line`, tanpa rute push |

Handler cloud `ON CONFLICT DO NOTHING`, tidak pernah menolak karena aturan
bisnis.

**Seed** (`INSERT OR IGNORE`, tanpa outbox):

- `hr-jenis-bawaan.json` + kunci opsional `izin_pemutus` (bawaan
  `hr.request.decide`) dan `batas_bulanan`; `SEED_JENIS_SQL` membaca
  `izin_pemutus` sebagai argumen, bukan literal. Lima jenis baru
  `jns-rmb-transport`, `jns-rmb-kesehatan`, `jns-rmb-makan`, `jns-rmb-dinas`,
  `jns-rmb-lainnya`: kelompok Reimburse, `reimburse.decide`, `wajib_dokumen` 1,
  urgent tidak, batas kosong.
- `akun-bawaan.json`: `akun-beban-reimburse` 5-1650 "Beban Reimbursement
  Karyawan", Beban, `sistem: true` (Q-61).

**Pengaturan** `setting_gex_system.hr_reimburse_bayar` = `gaji` | `terpisah`,
bawaan **`terpisah`** (gaji tidak berubah sampai pemilik memilih), lewat
`desktop_hr_leave_settings_save` / aksi `aturan` yang diperluas (pola §18.11).

Kedua jalur: `CURRENT_SCHEMA_VERSION`/`CLIENT_SCHEMA_VERSION` 39, sentinel
`-2035` + angka `ensure_schema_current`, `REQUIRED_TABLE_COUNT` 86,
`PROMOTION_PLAN`, purge pindah database, dan `CLOUD_MIRRORED_TABLES` (kedua
tabel baru).

### 19.3 Klaim, sidik, dan status

- **Isian** (`validasi_pengajuan`/`periksa_jenis` ↔ kembar): satu tanggal biaya
  (`tanggal_mulai = tanggal_selesai`, tidak lewat hari ini WIB), `nominal`
  1–1.000.000.000, `alasan` = keperluan, tanpa setengah hari dan kolom fase 3.
- **Jenis Reimburse** (`validasi_jenis`): `dampak_gaji` dipaksa `Tidak
  Berpengaruh`, `potong_jatah` 0, `maks_hari` kosong, **`boleh_urgent` dipaksa
  0** (urgent = atasan menyetujui sendiri, melewati Keuangan). `izin_pemutus`
  bisa dipilih `hr.request.decide` atau `reimburse.decide` untuk semua jenis
  (Q-2); `batas_bulanan` kosong atau 1–1.000.000.000.
- **Sidik**: sembilan bagian fase 2 + `nominal` untuk Reimburse; sidik kelompok
  lain tidak berubah.
- **Status, keputusan, Batal**: fase 2 apa adanya (`berlaku_sql!`).
- **Bertumpuk**: `bentrok_pengajuan` ↔ `bentrokPengajuan` mengembalikan `false`
  bila salah satunya Reimburse (cabang pertama).
- **Periode gaji dibayar**: `tolak_bila_dibayar` dilewati untuk Reimburse;
  gantinya Batal ditolak bila klaim **sudah dibayar atau ada di proses gaji
  yang tidak ditolak** (§19.4), pesan pola `PESAN_POTONGAN_TERTUNDA`.
- **Nominal disetujui** (`periksa_aksi` diperluas): `Setujui` atas Reimburse
  wajib `nominal_disetujui` 1–`nominal`; lebih kecil dari `nominal` = alasan
  wajib. Aksi lain dan kelompok lain menolak nilai ini. **Nominal berlaku**
  (`nominal_berlaku` ↔ `nominalBerlaku`) = `nominal_disetujui` keputusan yang
  berlaku, kosong (keputusan dari perangkat v38) = `nominal`.
- `KLAIM_BERLAKU_SQL` (`?1` = sampai tanggal): klaim Reimburse berlaku +
  nominal berlakunya, subkueri `nominal_disetujui` dengan `ORDER BY` yang sama
  dengan `berlaku_sql!`; teks kembar Rust ↔ TS.
- **Tanda baru** (tidak menolak): `lewat_batas` (jumlah klaim Menunggu +
  berlaku karyawan itu, jenis itu, bulan tanggal biaya > `batas_bulanan`;
  Menunggu dihitung `nominal`, berlaku `nominal` berlaku), `dibayar_ganda`
  (§19.4), `dibayar_batal` (dibayar aktif padahal klaim tidak berlaku lagi,
  lahir dari perangkat offline). `tanpa_nota` = `tanpa_dokumen` fase 2
  (rincian, saat online).

### 19.4 Pembayaran

**Status bayar diturunkan** (`status_bayar` ↔ `statusBayar`), per klaim
(Reimburse berlaku, atau baris `uang:` yang tidak dibatalkan):

| Status | Syarat |
| :-- | :-- |
| Dibayar | ada pembayaran terpisah aktif (`Bayar` tanpa `batal-<id>`), atau ada di `breakdown_snapshot.reimburse` proses gaji `PAID` |
| Dalam proses gaji | ada di `breakdown_snapshot.reimburse` proses gaji yang bukan `PAID`/`REJECTED` |
| Belum dibayar | selain itu |

Lebih dari satu pembayaran aktif (dua terpisah, atau terpisah + proses gaji
tidak ditolak) = tanda `dibayar_ganda`.

**Pembayaran terpisah** (selalu tersedia, apa pun modenya: karyawan yang sudah
keluar, cuti diuangkan, dan kebutuhan mendesak tetap bisa dibayar):

- `catat_bayar_reimburse` ↔ `catatBayarReimburse`: satu karyawan, klaim dan/atau
  baris `uang:` miliknya yang Belum dibayar (`periksa_bayar_reimburse` ↔
  `periksaBayarReimburse`, hanya di perangkat). `total` = jumlah nominal
  berlaku saat dicatat, isian tidak membawa total. Tanggal WIB hari ini atau
  isian (tidak di masa depan), keterangan opsional.
- Pembatalan `batal-<id_bayar>` (`periksa_batal_bayar`, pola driver), alasan
  wajib; klaimnya kembali Belum dibayar.
- Pembukuan: jurnal manual (Q-31), tidak ada jurnal otomatis.

**Mode `gaji`** (Q-20, A-4), pola kasbon:

- `reimburse_gaji(conn, period_end)` ↔ `reimburseGaji`: per karyawan, klaim
  Reimburse berlaku bertanggal ≤ `period_end` yang Belum dibayar. Hanya bila
  `hr_reimburse_bayar = gaji`, dibaca saat rekap dihitung termasuk pembekuan
  (pola Q-57). Cuti diuangkan tidak pernah lewat sini (Q-62).
- Baris agregat rekap (Rust `desktop_get_payroll_recap` + pembekuan, TS
  `computePayrollRecap`): kasbon tetap dipotong dari `pay.net` (reimbursement
  tidak bisa termakan kasbon), lalu `net = pay.net − kasbon + reimburse`.
  Bruto, PPh 21, BPJS, dan `components` tidak berubah. Baris rekap +
  `est_reimburse`; `breakdown_snapshot.reimburse` = `[{ id_pengajuan, nominal }]`.
- Proses gaji `REJECTED` mengembalikan klaimnya ke Belum dibayar dengan
  sendirinya (`json_each` mengabaikan run ditolak).
- Saat `PAID` (`catat_pembayaran_payroll_tx` ↔ `catatPembayaranPayrollTx`,
  transaksi yang sama): `periksa_reimburse_payroll` ↔ kembar menolak bila klaim
  di run itu sudah tidak berlaku, nominal berlakunya berubah, atau sudah punya
  pembayaran terpisah aktif / ada di run `PAID` lain: "Tolak proses gaji ini
  lalu buat ulang." (pola `periksa_potongan_payroll`).
- Jurnal gaji `pay-<run>` (Q-61): `ItemPayroll.reimburse`, baris Debit
  `akun-beban-reimburse`, dan `potongan_lain = gross + reimburse − net − pph21
  − bpjs_k − kasbon`. Sumber tetap `Payroll`, CHECK tidak disentuh.
- Slip: bagian baru "Reimbursement (tidak kena pajak)" dari
  `breakdown_snapshot.reimburse`, di atas Gaji Bersih.

**Ganti mode**: tidak ada salinan mode per klaim. `terpisah` → `gaji`: klaim
Belum dibayar ikut proses gaji berikutnya. `gaji` → `terpisah`: klaim yang
sudah ada di proses gaji tetap ikut proses itu (sudah dibekukan), sisanya
menunggu dibayar terpisah. Dialog konfirmasi menyebutkan keduanya.

**Cuti diuangkan** (Q-62): dibayar lewat pembayaran terpisah
(`sumber = 'Cuti Diuangkan'`). "Perlu dibayar" di tab Cuti dan daftar akhir
periode menjadi status bayar turunan. PPh 21 atas uang itu dihitung manual.
Membatalkan penyesuaian `uang:` yang sudah dibayar ditolak.

### 19.5 Hak akses

| Izin | Sensitif | Paket bawaan |
| :-- | :-- | :-- |
| `reimburse.decide` | ya | — (diberikan Superadmin; tidak ada role Keuangan bawaan) |

- Masuk `catalog.ts` (grup Kepegawaian), `SENSITIVE_MUTATION_PERMISSIONS`, dan
  `NOT IN` seed Admin Rust.
- `reimburse.decide` mencakup memutus dan membatalkan klaim berjenis
  `reimburse.decide`, mencatat dan membatalkan pembayaran terpisah, dan
  membaca daftar pembayaran. Tidak ada izin bayar terpisah: §10.1 hanya
  menyebut satu izin.
- Daftar pengajuan (`desktop_hr_requests`, Web `query`) dan halaman
  `/pengajuan` (area `pengajuan`): `hr.request.view` ATAU `reimburse.decide`;
  tanpa `hr.request.view` hanya klaim Reimburse yang dikembalikan (Keuangan tidak
  melihat alasan sakit). `desktop_hr_request_decide` + `reimburse.decide`.
- Mengajukan klaim: `hr.request.submit`. Lampiran (nota) bisa diubah pengaju,
  `hr.request.decide`, atau pemegang `izin_pemutus` jenisnya.
- Aturan `hr_reimburse_bayar` dan jenis: `hr.org.manage`.

### 19.6 Command, rute, dan layar

**Rust** (`hr_pengajuan.rs`, disalin ke Mobile): perluasan
`desktop_hr_request_save` (`nominal`), `desktop_hr_request_decide`
(`nominalDisetujui`), `desktop_hr_requests` (status bayar, nominal berlaku,
tanda), `desktop_hr_request_types_save` (`batas_bulanan`, pemutus),
`desktop_hr_leave_settings_save` (`hr_reimburse_bayar`). Baru:
`desktop_hr_reimburse_overview` (Belum dibayar dan Dalam proses gaji per
karyawan, riwayat pembayaran `dari`..`sampai`), `desktop_hr_reimburse_pay`,
`desktop_hr_reimburse_pay_cancel` (ketiganya `reimburse.decide`). Rekap gaji
dan `catat_pembayaran_payroll_tx` di `payroll/commands.rs` + `loan.rs`.

**Web**: `validations/hr-pengajuan.ts` + `services/hr-pengajuan.ts`, aksi baru
di `POST /api/hris/requests` (Zod `.strict()`), gateway `gateways/hr-pengajuan.ts`,
`payroll-recap.ts`, `PATCH /api/payroll/runs`.

**Layar** (Web, Desktop, Mobile kecuali disebut):

1. `PengajuanWorkspace`: isian Reimburse (kategori = jenis, tanggal biaya,
   nominal rupiah, keperluan; pemakaian bulan itu dibanding batas); saringan
   "Reimburse"; rincian dengan nominal diajukan/disetujui, status bayar, dan
   nota; dialog Setujui Reimburse dengan nominal (bawaan = diajukan) dan alasan
   bila lebih kecil.
2. Bagian **Pembayaran** di `/pengajuan` (hanya pemegang `reimburse.decide`):
   Belum dibayar per karyawan (klaim + cuti diuangkan), pilih lalu Bayar
   (`konfirmasiData`), Dalam proses gaji (baca saja), riwayat + Batalkan.
3. Organisasi `/hris` (Web/Desktop): jenis Reimburse dengan pemutus dan batas
   bulanan; "Aturan cuti dan lembur" + cara bayar reimbursement.
4. Rekap gaji: baris kecil "Reimburse Rp…" di sel Gaji Bersih (pola SPL §18.11,
   tanpa kolom baru); slip + bagian reimbursement.
5. Tab Cuti di rincian karyawan dan daftar akhir periode: status bayar cuti
   diuangkan.

### 19.7 Tidak dikerjakan di fase ini

- Jurnal otomatis pembayaran terpisah (Q-31), tanda terima cetak, dan tautan
  klaim ke pengajuan Dinas Luar (uang dinas cukup kategori Dinas).
- Rentang tanggal per klaim: satu nota satu tanggal; perjalanan beberapa hari
  diajukan per nota.
- Kejadian Telegram (fase 8).

### 19.8 Penanda yang ditinjau pemilik saat menyetujui

- Bawaan `hr_reimburse_bayar` = `terpisah`.
- Urgent tidak berlaku untuk Reimburse.
- `reimburse.decide` sekaligus izin membayar (tanpa `reimburse.pay`).
- Pembayaran terpisah tersedia juga di mode `gaji`.

### 19.9 Jawaban fase 4 (10 Nov 2026)

| No | Pertanyaan | Jawaban |
| :-- | :-- | :-- |
| Q-59 | Kategori reimbursement | Jenis pengajuan berkelompok Reimburse + kolom `batas_bulanan`; tanpa `hr_reimburse_kategori` |
| Q-60 | Foto nota | Lampiran khusus cloud Q-51 (`hr_pengajuan_berkas`); nota kosong = tanda `tanpa_nota` |
| Q-61 | Jurnal gaji mode `gaji` | Akun bawaan baru `akun-beban-reimburse` 5-1650, di jurnal gaji `Payroll` |
| Q-62 | Cuti diuangkan | Lewat pembayaran terpisah reimbursement apa pun modenya; PPh 21 manual |

### 19.10 Langkah

| # | Langkah | Gerbang |
| :-- | :-- | :-- |
| 1 | **Skema v39**: tiga kolom + dua tabel di keempat lapis, `SNAPSHOT_TABLES.columns`, seed jenis dan akun, sentinel `-2035`, `REQUIRED_TABLE_COUNT` 86, promosi, purge, klasifikasi. | `audit:schema` + tes sentinel/provisioning Rust |
| 2 | **Aturan kembar** `hr_pengajuan.rs` ↔ `validations/hr-pengajuan.ts`: jenis dan isian Reimburse, sidik + nominal, bentrok, `periksa_aksi` + nominal disetujui, `nominal_berlaku`, `KLAIM_BERLAKU_SQL`, `lewat_batas`, `status_bayar`, `periksa_bayar_reimburse`, `periksa_reimburse_payroll`, jurnal gaji. | `bun test` + `cargo test hr_pengajuan loan` |
| 3 | **Sinkronisasi**: rute `hr-reimburse-payment/create`, handler cloud jenis (kunci `batas_bulanan`), pengajuan, keputusan, pembayaran; penulisan lokal + outbox satu transaksi. | `audit:contract` + `tests_alur` |
| 4 | **Kait gaji** kedua jalur: rekap, pembekuan, PAID, jurnal, slip. | tes `payroll-recap*`, `loan` + Rust payroll, vektor baru |
| 5 | **Pembayaran terpisah** + cuti diuangkan. | tes kembar + `tests_alur` |
| 6 | **RBAC + command + rute + gateway**. | tes Rust + `web-rbac-boundary` |
| 7 | **Layar** Web/Desktop dan Mobile. | typecheck + Biome |
| 8 | `bun run sync:mobile`, bagian `CLAUDE.md`, catatan "Sudah dibangun". | `audit:docs`; `bun run check` penuh oleh pemilik |

### 19.11 Sudah dibangun (11 Nov 2026)

Langkah 1–8 dibangun. Gerbang yang dijalankan: `audit:schema` (86 tabel wajib,
685 kolom di 62 tabel snapshot, 80 tabel dipromosikan), `audit:contract` (87
rute, 62 tabel snapshot, command Desktop 270 / Mobile 276), dan `audit:docs`
lulus; `cargo test --lib` Desktop 397 dan Mobile 401 lulus (termasuk
`tests_alur::alur_fase4_reimburse`, `fase4_*`, `jurnal_payroll` dengan vektor
reimbursement, dan `sentinel_2034_memicu_skema_reimburse`); runner tes TS kedua
workspace (`bun run test`) lulus, termasuk `hr-pengajuan-reimburse.test.ts`
(vektor kembar), `hr-pengajuan.test.ts` (teks SQL kembar Rust ↔ TS, juga
salinan Mobile), `services/hr-pengajuan-reimburse.test.ts` (alur Web: klaim,
nominal disetujui, daftar Keuangan, rekap mode `gaji`, PAID dan jurnal
`pay-<run>`, pembayaran terpisah), `loan.test.ts`, `accounting*`,
`schema-consistency`, `rbac-migration`, `web-rbac-boundary`; typecheck kedua
workspace dan Biome berkas yang diubah bersih. `bun run check` penuh belum
dijalankan (pemilik).

Penyimpangan dan catatan, untuk ditinjau:

- **Keuangan tanpa `hr.request.view` juga hanya membaca rincian dan nota klaim
  Reimburse** (riwayat keputusan, daftar dan isi lampiran), bukan hanya daftar.
  §19.5 hanya menyebut daftar; tanpa ini nota cuti/sakit terbaca lewat id.
- **Kunci `hr_reimburse_bayar` absen dari isian aturan = tidak disimpan**, tidak
  ditolak seperti kunci lembur (§18.11): layar Organisasi selalu mengirimnya.
- **Seed jenis bawaan dipindah ke sesudah `ensure_column`** di `storage.rs`
  Desktop dan Mobile (dan sebelum seed di `db-migrations.ts`), karena seed kini
  menulis `batas_bulanan`; tanpa itu database lama gagal di seed.
- **`tanpa_nota` bukan tanda daftar**, sama seperti `tanpa_dokumen` fase 2
  (§17.12): lampiran khusus cloud, jadi tampil di rincian saat online.
- `KLAIM_BERLAKU_SQL` juga mengembalikan keterangan (`nama jenis: keperluan`)
  dan `UANG_BERLAKU_SQL` keterangan periodenya, untuk layar Pembayaran.
  `GAJI_REIMBURSE_SQL` (klaim di proses gaji tidak ditolak) adalah SQL kembar
  ketiga.
- Pesan PAID untuk klaim yang tidak berlaku lagi menyebut id klaim (tanggalnya
  tidak terbaca dari daftar klaim berlaku); pesan lain menyebut tanggal biaya.
- Tab "Cuti diuangkan" tetap butuh `hr.request.view` (backend akhir periode);
  Keuangan membayar cuti diuangkan dari tab Pembayaran.
- Tab Pembayaran ikut di Mobile karena `PengajuanWorkspace` satu komponen.
  Halaman gaji Mobile hanya menampilkan total, jadi baris "Reimburse" dan
  bagian slip hanya di Web/Desktop.
- Memilih kelompok Reimburse di form jenis langsung mengisi pemutus
  `reimburse.decide` dan wajib nota (bisa diubah).
- Daftar harapan audit kontrak ditambah rute `hr-reimburse-payment/create` dan
  dua tabel snapshot (pengetatan, bukan pelonggaran); hitungan bagan akun di
  tes naik 27 → 28 (sistem 8 → 9) dan daftar versi migrasi tes RBAC + 39.

## 20. Urutan pengerjaan fase 5

Disetujui pemilik dan dibangun (catatan di §20.13). Ditulis setelah menelusuri
kode (11 Nov 2026). Q-63 sampai Q-70 sudah dijawab (§20.11) dan isi bagian ini mengikuti
jawabannya; yang belum disetujui adalah rancangan utuhnya, termasuk penanda di
§20.10. Bila §9 dan bagian ini berbeda, **bagian ini yang berlaku**.

### 20.1 Temuan dari kode

- **`master_data.tanggal_selesai_aktif` sudah ada** di keempat lapis dan
  `SNAPSHOT_TABLES`, tetapi hanya isian bebas "Tanggal Selesai Aktif
  (Opsional)" di form Karyawan; tidak ada logika (scanner, Alfa, gaji) yang
  membacanya. Kolom itu dipakai sebagai tanggal keluar; tidak ada kolom tanggal
  baru.
- **`status_aktif` adalah keadaan tersimpan, bukan turunan.** Scanner
  (`scanner.rs`, "Karyawan berstatus nonaktif"), Generate Alfa, rekap gaji,
  penerima `Personil` inventaris, dan daftar akhir periode cuti membaca
  `status_aktif = 'Aktif'`. Karena itu "keluar" tetap menulis kolom ini, tidak
  diturunkan dari tabel keluar.
- **Zombie (aturan 33):** handler cloud `employee/update` menulis
  `status_aktif = excluded.status_aktif` dengan bawaan `'Aktif'` bila payload
  tidak membawanya, dan `tanggal_selesai_aktif` dari payload (kosong =
  dikosongkan). Lokal `update_employee` menulis `status_aktif` dari draf form.
  `employee/status` dan `desktop_set_employee_status` (`employees.manage`, yang
  dipegang role HRD) bisa mengaktifkan siapa saja kapan saja. Event lama dari
  perangkat offline akan menghidupkan karyawan yang sudah keluar.
- **Handler cloud berjalan di biner pengirim** (`apply_event_to_turso` di
  perangkat yang mendorong outbox). Normalisasi di handler hanya melindungi bila
  pengirimnya sudah diperbarui: perangkat v39 tetap bisa mengirim `'Aktif'`
  mentah.
- **Rekap gaji hanya memuat `md.status_aktif = 'Aktif'`** (Rust
  `payroll/commands.rs` di dua kueri, TS `payroll-recap.ts`). Karyawan yang
  sudah dinonaktifkan tidak ikut proses gaji periode keluarnya.
- **`master_operator` khusus cloud** (kolom `status`, bawaan `'Aktif'`), jadi
  tidak bisa ikut transaksi SQLite lokal seperti tertulis di §9.2. Login online
  sudah menolak akun yang `id_karyawan`-nya menunjuk personil tidak aktif
  (`turso.rs`, kueri login), tetapi **login offline** (`desktop_login`, snapshot
  vault) tidak memeriksa `master_data`; hanya laporan driver yang memeriksa ulang
  personil sesi (`driver.rs`).
- **Pinjaman barang**: `inventory_mutasi` `alasan = 'Peminjaman'`,
  `penerima_tipe = 'Personil'`, `penerima_id` = id karyawan; belum kembali =
  jumlah > jumlah `Pengembalian` (`id_ref`) yang tidak dibatalkan
  (`list_loans` ↔ `listLoans`, inventaris). Pengembalian tidak membawa penerima,
  jadi tetap bisa dicatat setelah karyawan keluar; Peminjaman baru ke personil
  nonaktif sudah ditolak.
- **Kasbon**: sisa efektif = pokok − angsuran − pelunasan − potongan di proses
  gaji yang belum dibayar (`BAYAR_SQL`, `PENDING_SQL`, `loan.rs`). Pelunasan
  Tunai (`pay_off_loan`, jurnal Kas/Piutang) sudah ada; tidak ada jenis mutasi
  "potong dari pesangon" (CHECK `keu_pinjaman_mutasi.jenis` hanya empat nilai).
- **Cuti**: `hitung_jatah` mengembalikan periode berjalan dan sisanya;
  `upah_harian` (FLAT_DAILY = `daily_rate`, HOURLY = tarif × jam normal shift)
  sudah dipakai cuti diuangkan. Baris `uang:` dan klaim reimburse punya status
  bayar turunan (§19.4); `akhir_periode` hanya memuat karyawan Aktif.
- **Dasar upah**: `salary_configs` hanya `HOURLY` (`rate_per_hour`) dan
  `FLAT_DAILY` (`daily_rate`), berlaku menurut `effective_date`; tidak ada gaji
  bulanan. `payroll_components` FIXED dibayar penuh per proses gaji (bisa harian
  atau mingguan), PERCENTAGE dari gaji pokok, `applies_to` = `ALL` atau id
  karyawan; tidak bisa dibaca sebagai "tunjangan tetap bulanan".
- **Kontrak**: `kontrak_aktif`, `status_kerja`, `tambah_bulan`, `nomor_hari`
  (`hris.rs`) dan `tambah_hari` (privat di `hr_pengajuan.rs`) cukup untuk
  menghitung masa kerja dan kontrak PKWT yang berlaku.
- **Cetak**: `cetakTandaTerimaUpah.ts` (A4, `#kos-print-root`, `@media print`)
  memakai `getCompanyBranding` yang hanya nama + logo. Alamat dan nama pimpinan
  ada di `getCompanyProfile`, yang butuh `settings.manage`.
- **RBAC**: seed Admin Rust memberi semua izin di luar daftar `NOT IN`, jadi
  izin baru yang tidak sensitif dan tidak rahasia otomatis ikut Admin. Seed
  role HRD (`role_key = 'hrd'`, daftar `IN`) dijalankan setiap `ensure_schema`,
  jadi izin baru di daftar itu ikut ke role HRD yang sudah ada. Tidak ada role
  Keuangan bawaan.
- Skema sekarang: v39, sentinel `-2035`, `REQUIRED_TABLE_COUNT` 86, 62 tabel
  snapshot, 87 rute, command Desktop 270 / Mobile 276.

### 20.2 Model data (skema v40, sentinel `-2036` `hris-keluar-v1`)

**Khusus cloud** (Q-63; hanya `turso.rs` + `db-schema.ts`/`db-migrations.ts`;
tidak di `storage.rs`, tidak di snapshot, tidak lewat outbox; pola `hr_profil`
dan `hr_dokumen`). Dibaca dan ditulis command Rust lewat `TursoClient` (atau hub
pada mode database lokal) dan route Web, hanya saat terhubung. Tanpa `UNIQUE`
selain PK.

| Tabel | Kolom |
| :-- | :-- |
| `hr_sp` | `id_sp` PK (`sp-<acak>`); `id_karyawan` NOT NULL; `tingkat` CHECK IN (`SP1`, `SP2`, `SP3`); `tanggal` NOT NULL (tanggal surat, WIB); `masa_bulan` INTEGER NOT NULL CHECK 1–12 (dibekukan dari pengaturan); `berlaku_sampai` NOT NULL; `nomor` (opsional); `pelanggaran` NOT NULL; `harapan` (perbaikan yang diminta, opsional); `usulan_tingkat` CHECK IN (`SP1`, `SP2`, `SP3`); `alasan_tingkat` (wajib bila `tingkat` ≠ usulan); `penanda_nama` NOT NULL, `penanda_jabatan` NOT NULL; `dicatat_oleh`, `created_at` (jam database); `diubah_oleh`, `diubah_pada`; `dicabut_oleh`, `dicabut_pada`, `alasan_cabut`. Indeks `(id_karyawan, tanggal)`, `berlaku_sampai` |
| `hr_keluar_alasan` | `id_alasan` PK; `nama` NOT NULL; `pengali_up` INTEGER NOT NULL CHECK 0–1000 (persen dari kelipatan UP); `pengali_upmk` INTEGER NOT NULL CHECK 0–1000; `uph` INTEGER CHECK (0,1); `kompensasi_pkwt` INTEGER CHECK (0,1); `uang_pisah` INTEGER CHECK (0,1); `dasar_hukum`; `is_aktif`; `created_at`, `updated_at`. Menggantikan `hr_pesangon_pengali` di §12 (satu baris alasan sudah memuat pengalinya) |
| `hr_keluar` | `id_keluar` PK (`klr-<acak>`); `id_karyawan` NOT NULL; `id_alasan` NOT NULL, `alasan_nama` (salinan); `id_sp` (SP yang mendasari, opsional); `tanggal_pemberitahuan` (opsional); `tanggal_terakhir` NOT NULL (hari kerja terakhir); `keterangan`; `masa_kerja_mulai` (salinan `tanggal_daftar`); `upah_pokok` INTEGER NOT NULL CHECK ≥ 0, `usulan_upah_pokok` INTEGER, `alasan_upah` (wajib bila berbeda), `tunjangan_tetap` INTEGER NOT NULL DEFAULT 0 CHECK ≥ 0; `kartu_ditarik` INTEGER CHECK (0,1), `catatan_checklist`; `checklist_saat_berlaku` (JSON potret saat Berlakukan); `dicatat_oleh`, `created_at`, `diubah_oleh`, `diubah_pada`; `berlaku_oleh`, `berlaku_pada`; `dibatalkan_oleh`, `dibatalkan_pada`, `alasan_batal`. Indeks `id_karyawan`, `tanggal_terakhir` |
| `hr_keluar_rincian` | `id_rincian` PK (`<id_keluar>:<komponen>`); `id_keluar` NOT NULL; `komponen` CHECK IN (`UP`, `UPMK`, `UPH Cuti`, `UPH Ongkos Pulang`, `UPH Lainnya`, `Kompensasi PKWT`, `Uang Pisah`, `Lainnya`); `dasar` (teks hitungan, mis. "masa kerja 5 th: 6 × upah × 50%"); `usulan` INTEGER NOT NULL CHECK ≥ 0; `nominal` INTEGER NOT NULL CHECK ≥ 0; `alasan_ubah` (wajib bila `nominal` ≠ `usulan`); `urutan`. Indeks `id_keluar` |

- Status SP dan status keluar **tidak disimpan** (§20.3, §20.4).
- Pencabutan SP dan pembatalan keluar adalah **kolom**, bukan baris
  `batal-<id>` seperti tertulis di §9.1: tabelnya khusus cloud, jadi tidak ada
  dua perangkat offline yang perlu digabung. Kolomnya diisi sekali
  (`WHERE dicabut_pada IS NULL`), dengan jam database (pola `hr_dokumen`).
- **Seed alasan** `INSERT OR IGNORE` berid tetap dari
  `validations/hr-keluar-alasan-bawaan.json` (Rust `include_str!`, TS import),
  di `turso.rs` dan `db-migrations.ts` saja, sesudah `CREATE`. Aman di-seed
  karena tidak pernah lewat outbox. Nilai bawaannya di §20.5.

**Tersinkron** (keempat lapis): satu kolom baru `master_data.id_keluar` TEXT
(boleh kosong). `CREATE` + `ensure_column`/`hasColumn`, **WAJIB** juga di
`SNAPSHOT_TABLES.columns` `master_data` Desktop dan Mobile, dan di `storage.rs`
Mobile yang diubah manual (tidak disalin `sync:mobile`). Kolom ini **hanya
ditulis transaksi cloud** Berlakukan/Batal (§20.4) dan tertarik ke perangkat
lewat snapshot; tidak ada rute, handler `employee/*` tidak pernah menulisnya,
dan perangkat tidak pernah mengirimnya. Gunanya: perangkat offline tahu
karyawan ini keluar (menolak "aktifkan lagi", tanda di daftar, rekap gaji
§20.6) tanpa menyalin isi `hr_keluar`.

**Pengaturan** (`setting_gex_system`, tanpa perubahan skema):
`hr_sp_masa_bulan` = 6 (1–12), entri baru `BATAS_PENGATURAN` ↔ kembar, lewat
`desktop_hr_settings_save` yang sudah ada.

Kedua jalur: `CURRENT_SCHEMA_VERSION`/`CLIENT_SCHEMA_VERSION` 40, sentinel
`-2036` + angka `ensure_schema_current`, `REQUIRED_TABLE_COUNT` 90, keempat
tabel cloud ikut `PROMOTION_PLAN` (`hr_keluar_rincian` bergantung `hr_keluar`,
keduanya bergantung `master_data`). Jumlah tabel snapshot (62) dan rute (87)
tidak berubah.

### 20.3 Surat peringatan

- **Status turunan** (`status_sp` ↔ `statusSp`, per tanggal WIB): `Dicabut`
  bila `dicabut_pada` terisi, `Berlaku` bila `tanggal` ≤ hari ini ≤
  `berlaku_sampai`, selain itu `Berakhir`.
- **Masa berlaku**: `berlaku_sampai` = `tambah_bulan(tanggal, masa_bulan)`
  dikurangi satu hari (`tambah_hari(…, -1)`; `tambah_hari` dijadikan publik dan
  dipakai bersama). 10 Jan + 6 bulan = berlaku s.d. 9 Jul; 31 Agu + 6 bulan =
  s.d. 27 Feb (28 Feb dipotong ke akhir bulan, lalu dikurangi satu hari).
  `masa_bulan` dibekukan per SP, jadi mengganti pengaturan tidak mengubah SP
  lama.
- **Eskalasi** (`usulan_tingkat` ↔ `usulanTingkat`): SP Berlaku tertinggi pada
  tanggal SP baru + 1, tanpa SP Berlaku = SP1, maksimal SP3. Bila SP3 masih
  Berlaku, usulan tetap SP3 dan hasilnya membawa `sp3_berlaku: true`; layar
  menampilkan "Mulai proses keluar" (alasan bawaan PHK Pelanggaran, `id_sp`
  terisi). Tingkat lain dari usulan = `alasan_tingkat` wajib.
- **Isian** (`validasi_sp` ↔ `validasiSp`): karyawan Aktif; `tanggal` tidak di
  masa depan (jam database WIB) dan tidak sebelum `tanggal_daftar`;
  `pelanggaran` 1–2.000 karakter; `harapan` dan `alasan_tingkat` ≤ 1.000;
  `nomor` ≤ 100; penanda tangan wajib (nama dan jabatan teks, layar mengisi
  bawaan dari SP terakhir). Tidak untuk diri sendiri (`id_karyawan` sesi), baik
  membuat, mengubah, maupun mencabut.
- **Ubah**: hanya `nomor`, `pelanggaran`, `harapan`, penanda tangan, selama
  tidak dicabut (`hr.warning.manage`). Tingkat dan tanggal terkunci; salah
  tingkat = cabut lalu buat ulang.
- **Cabut** (`hr.warning.cancel`): alasan wajib, sekali.
- **Cetak A4** (`components/hris/cetakSuratPeringatan.ts`, pola
  `cetakTandaTerimaUpah`): kop nama, logo, dan alamat; nomor, tanggal, kepada
  (nama, jabatan, divisi kini), tingkat, pelanggaran, harapan, masa berlaku,
  penanda tangan, dan kolom tanda terima karyawan. SP yang dicabut tercetak
  dengan tanda DICABUT. Kop dibaca command SP dari `company_profile` cloud,
  bukan dari `getCompanyProfile` (yang butuh `settings.manage`), jadi
  `getCompanyBranding` tidak diubah. Hanya Web/Desktop (layar SP tidak ada di
  Mobile, Q-43).

### 20.4 Karyawan keluar

**Status turunan** (`status_keluar` ↔ `statusKeluar`): `Dibatalkan` bila
`dibatalkan_pada` terisi; `Berlaku` bila `berlaku_pada` terisi; `Jatuh tempo`
bila `tanggal_terakhir` ≤ hari ini WIB; selain itu `Dijadwalkan` (Q-64).

**Catat dan ubah** (`hr.offboard.manage`, selama Dijadwalkan atau Jatuh tempo):

- Satu proses yang tidak dibatalkan per karyawan (diperiksa di transaksi cloud).
  Karyawan Aktif. Tidak untuk diri sendiri.
- `tanggal_terakhir` ≥ `tanggal_daftar`, boleh di masa depan;
  `tanggal_pemberitahuan` ≤ `tanggal_terakhir`. Alasan harus aktif.
- Setiap simpan menghitung ulang usulan (§20.5) dan menulis ulang
  `hr_keluar_rincian` dalam satu transaksi; `nominal` yang tidak sama dengan
  usulan wajib beralasan. Usulan dihitung Rust dari SQLite lokal (semua
  masukannya tabel tersinkron: `salary_configs`, `hr_kontrak`, jatah cuti) dan
  Web dari cloud, dengan fungsi kembar yang sama.
- Selama belum berlaku, `master_data` tidak berubah: karyawan tetap bisa scan,
  ikut Alfa, dan ikut gaji.

**Checklist** (dibaca hidup, tidak menolak apa pun; command membaca SQLite
lokal, Web membaca cloud; kueri kembar):

| Butir | Sumber |
| :-- | :-- |
| Barang dipinjam belum kembali | `PINJAMAN_PERSONIL_SQL` (potongan `list_loans` + `penerima_tipe = 'Personil' AND penerima_id = ?`), teks kembar |
| Sisa kasbon | pinjaman `Disetujui` dengan sisa efektif > 0 (`BAYAR_SQL`, `PENDING_SQL`) |
| Reimburse dan cuti diuangkan belum dibayar | `KLAIM_BERLAKU_SQL`, `UANG_BERLAKU_SQL` + `status_bayar` (§19.4); dibayar lewat Pembayaran reimburse yang sudah ada |
| Pengajuan sesudah tanggal terakhir | pengajuan Menunggu atau berlaku yang `tanggal_selesai` > `tanggal_terakhir` |
| Akun operator tertaut | `master_operator.id_karyawan` (cloud; Desktop offline: "butuh koneksi") |
| Kartu ID ditarik | centang manual `kartu_ditarik` |

Ringkasan: total rincian, lalu baris informasi "dikurangi sisa kasbon" dan
"perkiraan diterima" (Q-68). Tidak disimpan sebagai angka, kecuali di potret
`checklist_saat_berlaku`.

**Berlakukan** (`hr.offboard.manage`; terbuka sejak `tanggal_terakhir`, jam
database WIB). Satu batch pipeline cloud (pola hapus dokumen §16.2), setiap
statement dijaga keadaan `hr_keluar` yang sama sehingga tekan ganda tidak
menggandakan:

1. `hr_keluar`: `berlaku_oleh`, `berlaku_pada = datetime('now')`,
   `checklist_saat_berlaku` (potret checklist + ringkasan); rincian terkunci
   sejak ini.
2. `master_data`: `status_aktif = 'Nonaktif'`, `tanggal_selesai_aktif =
   tanggal_terakhir`, `id_keluar = id_keluar`.
3. `master_operator`: `status = 'Nonaktif'` untuk akun ber-`id_karyawan` itu
   (Q-70).

Ditolak bila karyawan itu tertaut ke akun Superadmin aktif terakhir ("Pindahkan
peran Superadmin dulu") atau ke akun sesi sendiri. Sesudahnya layar memanggil
`syncNow()` supaya `master_data` perangkat langsung tertarik; trigger
`sync_pulse` `master_data` memberi tahu perangkat lain. Dialog Berlakukan
menyebut bahwa scan ditolak sejak saat itu (tekan setelah jam pulang hari
terakhir), dan bila ditekan terlambat, jumlah Alfa sistem sesudah
`tanggal_terakhir`.

**Batalkan** (`hr.offboard.manage`, sensitif, Q-65): alasan wajib, kapan saja,
tidak untuk diri sendiri. Bila sudah berlaku, batch yang sama mengembalikan
`master_data` (`status_aktif = 'Aktif'`, `tanggal_selesai_aktif` dan
`id_keluar` dikosongkan, hanya `WHERE id_keluar = ?`). Akun operator **tidak**
diaktifkan lagi (Superadmin dari menu Operator). Bekerja kembali bertahun-tahun
kemudian = data karyawan baru.

**Normalisasi status** (melawan zombie, kembar di semua jalur penulis):

- Handler cloud `employee/create|update` (upsert) dan `employee/status`:
  `status_aktif = CASE WHEN master_data.id_keluar IS NOT NULL THEN 'Nonaktif'
  ELSE <nilai payload> END`, dan `tanggal_selesai_aktif` dipertahankan bila
  `id_keluar` terisi. Tidak menolak, pola normalisasi divisi §16.3. Jalur Web
  `services/employee.ts` (buat, ubah, ubah status, impor) memakai potongan SQL
  yang sama.
- Lokal `update_employee`, `set_employee_status`, dan impor karyawan: bila
  `id_keluar` lokal terisi, mengaktifkan ditolak ("Karyawan ini sudah keluar.
  Batalkan proses keluarnya di HRIS untuk mengaktifkannya lagi.") dan isian
  status/tanggal selesai dari draf diabaikan.
- **Sesi personil nonaktif** (Q-70): login offline dan setiap command
  (pemeriksaan di `require_permission`/`require_any_permission`) menolak sesi
  yang `id_karyawan`-nya menunjuk personil tidak Aktif di SQLite lokal, pola
  laporan driver. Berlaku untuk semua akun, termasuk Superadmin.

### 20.5 Usulan pesangon

Semua aritmetika `i64` ↔ `number` bilangan bulat (aturan 13); batas masukan
menjaga hasil di bawah 2^53. Pembulatan: rupiah terdekat, setengah ke atas.
Fungsi murni `usulan_pesangon` ↔ `usulanPesangon` dengan vektor uji yang sama.

**Upah sebulan** (Q-66), dari `salary_configs` terakhir yang `effective_date` ≤
`tanggal_terakhir`:

| `salary_type` | Usulan upah pokok |
| :-- | :-- |
| `FLAT_DAILY` | 30 × `daily_rate` (Pasal 157 UU 13/2003 jo. UU 6/2023) |
| `HOURLY` | `rate_per_hour` × 173 (pembagi upah sejam Kepmenakertrans 102/2004) |
| tidak ada | 0, HRD wajib mengisi |

Tunjangan tetap diisi HRD (bawaan 0); komponen ALLOWANCE aktif yang berlaku
untuk karyawan itu ditampilkan sebagai acuan, tidak dijumlahkan. **Upah** =
`upah_pokok` + `tunjangan_tetap`, maksimal 1.000.000.000.

**Masa kerja**: dari `masa_kerja_mulai` (= `tanggal_daftar`, Q-41) sampai
`tambah_hari(tanggal_terakhir, 1)` (eksklusif). `bulan_penuh(mulai, akhir)` =
n terbesar dengan `tambah_bulan(mulai, n)` ≤ akhir; tahun = bulan_penuh / 12.
`tanggal_daftar` kosong = UP dan UPMK tidak diusulkan (usulan 0, dasar "tanggal
masuk kosong").

| Komponen | Usulan |
| :-- | :-- |
| UP | kelipatan = min(tahun + 1, 9); `(upah × kelipatan × pengali_up + 50) / 100` |
| UPMK | kelipatan = 0 bila tahun < 3, 10 bila tahun ≥ 24, selain itu tahun / 3 + 1; `(upah × kelipatan × pengali_upmk + 50) / 100` |
| UPH Cuti | hanya bila alasan `uph`: sisa cuti periode yang memuat `tanggal_terakhir` (`hitung_jatah`, bukan `sebelum_berhak`, sisa > 0) × `upah_harian` yang sudah ada (Q-68) |
| Kompensasi PKWT | hanya bila alasan `kompensasi_pkwt` dan kontrak berlaku pada `tanggal_terakhir` berjenis PKWT (`status_kerja`): bulan = max(`bulan_penuh(kontrak.tanggal_mulai, akhir)`, 1); `(upah × bulan + 6) / 12` (PP 35/2021 Pasal 16) |
| UPH Ongkos Pulang, UPH Lainnya, Lainnya | 0, diisi HRD |
| Uang Pisah | baris hanya muncul bila alasan `uang_pisah`; 0, diisi HRD menurut PK/PP/PKB |

Contoh vektor: upah 5.000.000, masuk 2020-03-15, terakhir 2026-03-14 → 72
bulan, 6 tahun; UP 7 × 5.000.000 = 35.000.000 × pengali; UPMK 3 × 5.000.000 =
15.000.000 × pengali. Terakhir 2026-03-13 → 71 bulan, 5 tahun: UP 6×, UPMK 2×.

**Alasan bawaan** (PP 35/2021, **wajib dicek ulang klien**; pengali dalam
persen, semua bisa disunting):

| `id_alasan` | Nama | UP | UPMK | UPH | Kompensasi PKWT | Uang pisah | Dasar |
| :-- | :-- | --: | --: | :--: | :--: | :--: | :-- |
| `klr-resign` | Resign | 0 | 0 | ya | | ya | Pasal 50 |
| `klr-habis-kontrak` | Habis Kontrak | 0 | 0 | ya | ya | | Pasal 15–16 |
| `klr-efisiensi` | PHK Efisiensi | 100 | 100 | ya | | | Pasal 43 ayat 2 (karena kerugian: 50) |
| `klr-pelanggaran` | PHK Pelanggaran | 50 | 100 | ya | | | Pasal 52 ayat 1 (pelanggaran mendesak ayat 2: 0/0 + uang pisah) |
| `klr-pensiun` | Pensiun | 175 | 100 | ya | | | Pasal 56 |
| `klr-meninggal` | Meninggal | 200 | 100 | ya | | | Pasal 57 |
| `klr-sakit` | Sakit Berkepanjangan | 200 | 100 | ya | | | Pasal 55 |
| `klr-lainnya` | Lainnya | 0 | 0 | ya | | | diisi HRD |

Mengubah alasan atau pengali tidak mengubah proses keluar yang sudah berlaku
(rinciannya beku); proses yang masih Dijadwalkan memakai nilai baru saat
disimpan berikutnya.

### 20.6 Gaji terakhir (Q-67, perubahan A-4)

- Rekap dan pembekuan gaji Rust (`payroll/commands.rs`, kedua kueri yang kini
  `md.status_aktif = 'Aktif'`) dan `computePayrollRecap` (`payroll-recap.ts`)
  memakai satu potongan SQL kembar `KARYAWAN_REKAP_SQL` (teks diperiksa identik
  Rust ↔ TS): `md.status_aktif = 'Aktif' OR (md.id_keluar IS NOT NULL AND
  md.tanggal_selesai_aktif >= <period_start>)`.
- Absensi sesudah `tanggal_terakhir` tidak ada (scan ditolak, Alfa tidak
  dibuat), jadi yang dibayar hanya sampai hari terakhir. Kasbon dan reimburse
  mode `gaji` ikut kait yang sudah ada tanpa perubahan.
- Baris rekap karyawan keluar diberi tanda "Keluar <tanggal>".
- `id_keluar` dipakai, bukan `status_aktif = 'Nonaktif'` saja, supaya karyawan
  yang dinonaktifkan manual dengan `tanggal_selesai_aktif` lama tidak ikut.

### 20.7 Hak akses (Q-69)

| Izin | Sensitif | Rahasia | Paket bawaan |
| :-- | :-- | :-- | :-- |
| `hr.warning.view` | | ya | HRD |
| `hr.warning.manage` | | ya | HRD |
| `hr.warning.cancel` | ya | | — |
| `hr.offboard.view` (baru, tidak ada di §10.1) | | ya | HRD |
| `hr.offboard.manage` | ya | | — |

- Rahasia = `CONFIDENTIAL_PERMISSIONS` (tidak ikut paket Admin Web) dan `NOT
  IN` seed Admin Rust; sensitif = `SENSITIVE_MUTATION_PERMISSIONS` dan `NOT
  IN`. Seed role HRD Rust dan `DEFAULT_ROLE_PERMISSIONS.hrd` + tiga izin.
- Membaca daftar dan rincian keluar: `hr.offboard.view` atau
  `hr.offboard.manage` (`requireAnyWebPermission`). Membaca SP: `hr.warning.view`.
- Menyunting alasan dan pengali: `hr.offboard.manage` (uang). Masa SP:
  `hr.org.manage` (aksi pengaturan yang sudah ada).
- Halaman `/hris` tetap area `hris`; tab SP dan Keluar memeriksa izinnya
  sendiri, backend memeriksa ulang (aturan 10).

### 20.8 Command, rute, dan layar

**Rust** (`desktop/hr_keluar.rs` baru, disalin ke Mobile lewat daftar salin;
terdaftar di kedua `lib.rs`, `build.rs`, `capabilities/default.json`; command
khusus cloud memberi pesan "butuh koneksi ke database" saat
`TURSO_NOT_CONFIGURED` atau jaringan gagal):

| Command | Izin |
| :-- | :-- |
| `desktop_hr_warnings` (riwayat per karyawan + usulan tingkat, atau daftar SP Berlaku) | `hr.warning.view` |
| `desktop_hr_warning_save` (buat dan ubah) | `hr.warning.manage` |
| `desktop_hr_warning_revoke` | `hr.warning.cancel` |
| `desktop_hr_offboardings` (daftar dan status) | `hr.offboard.view` / `manage` |
| `desktop_hr_offboarding` (rincian atau pratinjau per karyawan: header, rincian, usulan, checklist) | `hr.offboard.view` / `manage` |
| `desktop_hr_offboarding_save` | `hr.offboard.manage` |
| `desktop_hr_offboarding_apply` (Berlakukan) | `hr.offboard.manage` |
| `desktop_hr_offboarding_cancel` | `hr.offboard.manage` |
| `desktop_hr_exit_reasons_save` | `hr.offboard.manage` |

Perubahan yang ada: `desktop_hr_settings_save` (`hr_sp_masa_bulan`),
`set_employee_status`/`update_employee`/impor (penjaga `id_keluar`), handler
cloud `employee/*`, login offline dan pemeriksaan sesi, rekap gaji.

**Web**: `validations/hr-keluar.ts` + `services/hr-keluar.ts` (kembar Rust),
rute `POST /api/hris/warnings` dan `POST /api/hris/offboarding` (Zod
`.strict()`, aksi per operasi, tanpa `GET`), gateway `gateways/hr-keluar.ts`,
`services/employee.ts`, `payroll-recap.ts`.

**Layar** (Web/Desktop; Mobile hanya butir 5, Q-43):

1. Rincian karyawan `/hris`, tab **SP**: riwayat dengan status, Buat SP
   (usulan tingkat, alasan bila berbeda, `konfirmasiData`), ubah teks, Cabut
   (ketik alasan), Cetak.
2. Tab **Keluar** di `/hris`: daftar Dijadwalkan / Jatuh tempo / Berlaku /
   Dibatalkan; rincian dengan checklist, rincian pesangon (usulan, nominal,
   alasan), ringkasan netto, Berlakukan, Batalkan. "Mulai proses keluar" dari
   rincian karyawan dan dari SP3 Berlaku.
3. Organisasi `/hris`: alasan keluar + pengali (`hr.offboard.manage`), masa SP
   (`hr.org.manage`).
4. Rekap gaji: tanda "Keluar <tanggal>" di baris karyawan keluar.
5. Halaman Karyawan Web/Desktop dan Mobile: tanda "Keluar <tanggal>" dari
   `id_keluar`; tombol Aktifkan dinonaktifkan dengan pesan.

### 20.9 Tidak dikerjakan di fase ini

- Jurnal otomatis pesangon (Q-31) dan status "pesangon sudah dibayar":
  pembayarannya jurnal manual. PPh 21 final atas pesangon (PP 68/2009) dihitung
  manual.
- Potong kasbon dari pesangon secara otomatis (Q-68): pelunasan lewat
  Pelunasan Tunai yang ada.
- Kompensasi PKWT pada setiap perpanjangan kontrak (bukan saat keluar), dan
  ganti rugi PKWT yang diputus sebelum waktunya (Pasal 62 UU 13/2003): baris
  `Lainnya`.
- Cetak surat keterangan kerja (paklaring) dan cetak rincian pesangon.
- Surat jalan driver yang masih terbuka dan upah surat jalan belum dibayar di
  checklist (bisa ditambah sebagai butir baru tanpa skema).
- Nomor SP otomatis (nomor diisi HRD, pola nomor kontrak).
- Kejadian Telegram "SP berakhir" (fase 8; isi SP tidak pernah dikirim, Q-32).

### 20.10 Penanda yang ditinjau pemilik saat menyetujui

- Pengali bawaan §20.5 (terutama Efisiensi 100 bukan 50, dan UPH/uang pisah per
  alasan) dan konstanta 30 hari / 173 jam.
- Pencabutan SP dan pembatalan keluar sebagai kolom, bukan baris `batal-<id>`;
  `hr_pesangon_pengali` digabung ke `hr_keluar_alasan`.
- Berlakukan terbuka sejak `tanggal_terakhir` (bukan H+1): ditekan di hari
  terakhir menolak scan pulang hari itu; ditekan terlambat meninggalkan Alfa
  sistem sesudah hari terakhir (jumlahnya ditampilkan di dialog, tidak dihapus).
- Rincian pesangon beku sejak berlaku; koreksi sesudahnya = Batalkan lalu catat
  ulang (yang ikut mengaktifkan karyawan sesaat).
- UPH Cuti dihitung untuk setiap alasan ber-`uph`, apa pun aturan
  `hr_cuti_sisa` (hangus/dibawa/diuangkan), karena itu hak saat putus hubungan
  kerja.
- Masa kerja dari `tanggal_daftar` saja; kontrak lama tidak disambung otomatis.
- Proses gaji terakhir membayar tunjangan FIXED penuh (perilaku engine hari ini,
  sama dengan karyawan yang masuk di tengah periode).
- Penjaga sesi personil nonaktif berlaku untuk semua akun, termasuk Superadmin;
  Berlakukan ditolak untuk karyawan yang tertaut ke Superadmin aktif terakhir.
- **Semua perangkat wajib diperbarui sebelum fitur keluar dipakai**: perangkat
  v39 menjalankan handler `employee/*` lama saat mendorong outbox dan bisa
  mengirim `status_aktif = 'Aktif'` tanpa normalisasi.

### 20.11 Jawaban fase 5 (11 Nov 2026)

| No | Pertanyaan | Jawaban |
| :-- | :-- | :-- |
| Q-63 | SP dan keluar tersinkron atau khusus cloud | Khusus cloud (pola `hr_profil`); transaksi cloud mengubah `master_data` dan akun; kolom tersinkron `master_data.id_keluar` |
| Q-64 | Tanggal efektif di masa depan | Dijadwalkan; "Berlakukan" terbuka sejak tanggal terakhir dan baru saat itu status Nonaktif ditulis |
| Q-65 | Batal / aktif lagi | Batal kapan saja dengan alasan (`hr.offboard.manage`); mengaktifkan kembali karyawan, tidak akunnya; aktifkan dari halaman Karyawan ditolak selama keluar berlaku |
| Q-66 | Dasar upah pesangon | Dari konfigurasi gaji (FLAT_DAILY 30 × harian, HOURLY tarif × 173) + tunjangan tetap diisi HRD; bisa diubah dengan alasan |
| Q-67 | Gaji terakhir | Rekap gaji memuat karyawan keluar yang tanggal keluarnya di dalam periode |
| Q-68 | Kasbon, klaim belum dibayar, sisa cuti | Kasbon dan klaim hanya checklist (dilunasi/dibayar lewat jalur yang ada); sisa cuti periode berjalan = baris UPH usulan |
| Q-69 | Siapa membaca SP dan keluar | `hr.warning.view/manage` dan izin baru `hr.offboard.view` rahasia, paket HRD; `hr.offboard.manage` dan `hr.warning.cancel` sensitif tanpa paket |
| Q-70 | Akun operator tertaut | Dinonaktifkan di transaksi cloud yang sama; login offline dan sesi menolak personil nonaktif |

### 20.12 Langkah

| # | Langkah | Gerbang |
| :-- | :-- | :-- |
| 1 | **Skema v40**: 4 tabel khusus cloud di `turso.rs` + `db-schema.ts`/`db-migrations.ts`, seed alasan dari JSON sesudah `CREATE`; kolom `master_data.id_keluar` di keempat lapis (`storage.rs` Desktop DAN Mobile diubah manual, `ensure_column`/`hasColumn`, `SNAPSHOT_TABLES.columns` Desktop dan Mobile); sentinel `-2036` + `ensure_schema_current`, `REQUIRED_TABLE_COUNT` 90, `PROMOTION_PLAN`; daftar sentinel di tes `turso.rs` dan tes skema ikut disesuaikan. | `audit:schema` + tes sentinel/provisioning Rust |
| 2 | **Aturan kembar** `hr_keluar.rs` ↔ `validations/hr-keluar.ts`: `validasi_sp`, `status_sp`, `usulan_tingkat`, akhir masa SP, `validasi_keluar`, `status_keluar`, `bulan_penuh`, usulan upah, `usulan_pesangon`, validasi rincian; `tambah_hari` publik; teks SQL kembar `PINJAMAN_PERSONIL_SQL` dan `KARYAWAN_REKAP_SQL` diperiksa harfiah. Vektor uji yang sama (termasuk §20.5). | `bun run test` (per berkas) + `cargo test hr_keluar` |
| 3 | **Normalisasi status**: handler cloud `employee/*`, lokal `update_employee`/`set_employee_status`/impor, Web `services/employee.ts`. | tes cloud `TursoClient::local_file`: event `employee/update` dan `employee/status` lama bernilai `'Aktif'` sesudah keluar tetap `Nonaktif`; tes TS |
| 4 | **Transaksi cloud** catat/ubah/Berlakukan/Batalkan + akun operator; penjaga Superadmin terakhir dan diri sendiri; login offline dan sesi menolak personil nonaktif. | tes Rust (login offline, batch berlaku dan batal di `local_file`) + `services/hr-keluar.test.ts` |
| 5 | **Kait gaji** (Q-67) di rekap dan pembekuan kedua jalur. | tes `payroll-recap*`, `loan` + Rust payroll dengan karyawan keluar di tengah periode |
| 6 | **RBAC + command + rute + gateway**: `catalog.ts` (5 izin), `CONFIDENTIAL_PERMISSIONS`/`SENSITIVE_MUTATION_PERMISSIONS`, `NOT IN` seed Admin Rust, seed HRD Rust + `DEFAULT_ROLE_PERMISSIONS`, `rbac-migration.test.ts` + versi 40; 9 command di keempat tempat; daftar harapan `audit-sync-contract.ts` (jumlah command; rute dan tabel snapshot tidak berubah) dan angka di dokumen skill. | `audit:contract` + tes Rust + `web-rbac-boundary` |
| 7 | **Layar** §20.8 + cetak SP. | typecheck + Biome |
| 8 | `bun run sync:mobile`, bagian `CLAUDE.md`, catatan "Sudah dibangun". | `audit:docs`; `bun run check` penuh oleh pemilik |

### 20.13 Sudah dibangun (11 Nov 2026)

Langkah 1–8 dibangun. Gerbang yang dijalankan: `audit:schema` (90 tabel wajib,
84 tabel dipromosikan), `audit:contract` (87 rute, 62 tabel snapshot, command
Desktop 279 / Mobile 285), dan `audit:docs` lulus; `cargo test --lib` Desktop
408 dan Mobile 412 lulus (termasuk `hr_keluar::tests` dengan vektor §20.5,
`keluar_berlaku_menahan_event_lama_dan_bisa_dibatalkan`, dan
`sentinel_2035_memicu_skema_keluar`); runner tes TS kedua workspace
(`bun run test`, 90 dan 81 berkas) lulus, termasuk `validations/hr-keluar.test.ts`
(vektor kembar dan teks SQL kembar Rust ↔ TS, juga salinan Mobile) dan
`services/hr-keluar.test.ts` (alur Web: SP, catat, Berlakukan, aktifkan
ditolak, rekap gaji, Batalkan); typecheck kedua workspace dan Biome berkas yang
diubah bersih. `bun run check` penuh belum dijalankan (pemilik).

Penyimpangan dan catatan, untuk ditinjau:

- **Alasan keluar dan pengali disunting di tab Keluar**, bukan Organisasi
  (§20.8 butir 3): izinnya `hr.offboard.manage`, yang tidak dipegang pemegang
  `hr.org.manage` biasa. Masa SP tetap di Organisasi (form pengaturan kontrak
  membaca `BATAS_PENGATURAN`, jadi kuncinya ikut tampil tanpa layar baru).
- **Berlakukan juga mencabut sesi Web akun tertaut** (`app_session.revoked_at`,
  statement keempat `BERLAKUKAN_SQL`). Tidak tertulis di §20.4; penjaga sesi Web
  yang sudah ada juga menolaknya, ini hanya menutup sesi seketika.
- **Penjaga sesi personil nonaktif** dipasang di `require_any_permission` dan
  login offline (`tolak_personil_nonaktif`). Personil yang belum ada di SQLite
  perangkat tidak ditolak (perangkat yang belum sinkron).
- **Kait gaji**: satu kueri rekap Rust (`desktop_get_payroll_recap`, dipakai juga
  pembekuan) dan `computePayrollRecap`. `desktop_bulk_apply_flat_daily` (atur
  tarif massal) sengaja tetap hanya karyawan Aktif.
- **Belum dikerjakan**: tanda "Keluar <tanggal>" di baris rekap gaji (§20.6) dan
  di halaman Karyawan Mobile (§20.8 butir 5; Mobile menampilkan pesan penolakan
  dari backend saat mengaktifkan). Halaman Karyawan Web/Desktop sudah.
- **Tes yang belum ada**: tes Rust khusus login offline personil nonaktif dan
  tes Rust payroll dengan karyawan keluar di tengah periode; padanannya diuji
  di TS (`services/hr-keluar.test.ts`) dan di tes cloud Rust.
- Daftar karyawan (Rust `get_employees`, Web `getDaftarKaryawan`) kini membawa
  `id_keluar`. Usulan pesangon Desktop dihitung dari SQLite lokal (`muat_lokal`)
  lalu ditulis ke cloud; Web menghitungnya dari cloud.
- Tes lama yang disesuaikan: `pengaturan_kontrak` (Rust) dan "pengaturan
  kontrak" (TS) kini membawa kunci `hr_sp_masa_bulan`, daftar sentinel tes
  `turso.rs` + `-2036`, daftar versi migrasi tes RBAC + 40, daftar tabel
  `schema-consistency.test.ts` + 4. Daftar harapan tabel khusus cloud
  `audit-sync-contract.ts` + 4 (pengetatan, bukan pelonggaran).
