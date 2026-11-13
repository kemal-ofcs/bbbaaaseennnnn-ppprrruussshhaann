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
di §20.13), `bun run check` penuh belum dijalankan (pemilik). **Fase 6
dirancang dan disetujui pemilik** (§21, jawaban Q-71 sampai Q-85, 12 Nov
2026); belum ada kode.

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

### 15.1 Catatan pemilik sesudah fase 8 (12 Nov 2026)

- **Self-service karyawan dan formulir lamaran publik**: dicatat untuk nanti,
  sebagai website/CMS terpisah dengan pola proyek `c:/dev/sekolah`. Belum
  dirancang.
- **Pelaporan BPJS, DJP (e-Bupot), Wajib Lapor**: alurnya belum dipahami
  pemilik; perlu penjelasan dulu sebelum diputuskan masuk atau tidak.
- **Transfer gaji ke bank**: belum diputuskan.
- **Upah cuti melahirkan UU KIA**: tetap dicatat manual untuk sekarang.
- **Masuk fase berikutnya**: rencana dan anggaran pelatihan (Q-26); bagan
  struktur organisasi di SEMUA versi (Web, Desktop, Mobile); kejadian Telegram
  penilaian kinerja, rekrutmen, dan per pengajuan; kartu "Perlu perhatian" di
  Mobile dan di beranda aplikasi; pengaturan angka pengingat per perusahaan.
  Semuanya ditunda di §22.10/§23.7 dan kini diminta ada.
- **Urutan yang disetujui**: fase 9 = kejadian Telegram baru, kartu di Mobile
  dan beranda, dan pengaturan angka pengingat (§24); fase 10 = rencana dan
  anggaran pelatihan dan bagan struktur organisasi. Pelaporan BPJS/DJP/Wajib
  Lapor dan berkas transfer gaji ke bank dibahas sesudah fase 10.
- **HRIS lengkap di Mobile untuk HRD** (diminta 12 Nov 2026): HRD harus bisa
  bekerja di laptop maupun HP. Ini membalik Q-43 ("Mobile hanya form
  karyawan").
- **Urutan fase yang berlaku (12 Nov 2026, menggantikan butir urutan di
  atas)**: fase 9 = §24 (tidak berubah); fase 10 = HRIS lengkap di Mobile
  untuk HRD + bagan struktur organisasi di semua versi (bagan butuh halaman
  HRIS Mobile, dan Q-124 ditinjau ulang di sana); fase 11 = rencana dan
  anggaran pelatihan. Pelaporan BPJS/DJP/Wajib Lapor dan berkas transfer gaji
  ke bank sesudah fase 11.

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

## 21. Urutan pengerjaan fase 6

**Disetujui pemilik (12 Nov 2026) dan dibangun (catatan di §21.14).** Ditulis setelah
menelusuri kode (11 Nov 2026). Q-71 sampai Q-85 sudah dijawab (§21.13) dan
rancangan utuhnya, termasuk penanda di §21.12, disetujui. Bila §11.1 atau §12
dan bagian ini berbeda, **bagian ini yang berlaku** (terutama: enam tabel,
bukan empat, dan semuanya tersinkron).

### 21.1 Temuan dari kode

- **`hr_jabatan`** hanya `id_jabatan`, `nama`, `is_aktif`, `created_at`,
  `updated_at` (tersinkron, `delete_missing: false`, rute
  `hr-position/save`). Tidak ada tempat untuk template; menambah kolom berarti
  mengubah handler `hr-position/save` dan pola "hanya menimpa bila payload
  membawa kuncinya" untuk perangkat v40. `master_data.id_jabatan` boleh kosong
  (karyawan yang teks jabatannya belum dipetakan, §16.3).
- **Atasan langsung**: `master_data.id_atasan`, dijaga `periksa_atasan` ↔
  `periksaAtasan` (bukan diri sendiri, ada, tanpa lingkaran) dan
  `dalam_siklus_atasan` untuk siklus dari dua perangkat offline. Tidak
  membatasi akses (Q-38).
- **"Tidak untuk diri sendiri"**: `OperatorUser.id_karyawan` (dari
  `master_operator.id_karyawan`). `hr_pengajuan.rs` memakainya lewat
  `KeadaanAksi.karyawan_sendiri` + `PESAN_DIRI_SENDIRI`, juga untuk
  Superadmin; `hr_keluar.rs` lewat `tolak_diri_sendiri`. Akun tanpa
  `id_karyawan` tidak pernah tertolak aturan ini.
- **Sumber disiplin**:
  - `absensi_harian` (tersinkron) memuat `status_kehadiran`, `jam_masuk`,
    `menit_terlambat` per sesi. Definisi hadir/terlambat/sakit/izin/dispen/Alfa
    per HARI ada di `LAPORAN_KEHADIRAN_SQL.hari` (`report.ts` ↔
    `administration.rs`, satu baris per karyawan per tanggal, multi-sesi
    digabung; terlambat = `MAX(menit_terlambat) > 0`).
  - **Matriks laporan hanya ada di TS** (`susunLaporanKehadiran`,
    `validations/laporan-kehadiran.ts`): Rust hanya mengirim data mentah.
    Matriks itu sudah menggabungkan `wajibMasuk`, whitelist libur
    (`evaluateHolidayScan`), tukar shift (`LAPORAN_TUKAR_SQL`), dan pengajuan
    berlaku (`LAPORAN_PENGAJUAN_SQL`, `KELOMPOK_TIDAK_HADIR`): Hadir menang
    atas pengajuan (Q-34), pengajuan menang atas koreksi S/I/D dan Alfa, dan
    hari wajib tanpa catatan menjadi `-`. Padanan Rust untuk
    `wajib_masuk` (`hari_kerja.rs`) dan `evaluate_holiday_scan`
    (`scanner.rs`) sudah ada; padanan Rust untuk klasifikasi per hari belum.
  - **Rentang laporan dibatasi 92 hari** (`MAKS_HARI_LAPORAN` kembar), dan
    kuerinya memuat semua karyawan. Periode semester/tahunan tidak bisa
    memakai `getLaporanKehadiran` apa adanya.
  - **Laporan kehadiran tidak membaca laporan perjalanan driver**: hari driver
    di jalan tanpa scan tampil `-`, padahal Generate Alfa, audit, dan
    `HARI_HADIR_SQL` menganggapnya bekerja (`PELAPOR_PERJALANAN_SQL`).
  - Rekap bulanan (`REKAP_BULANAN_SQL` kembar) per bulan kalender, tanpa
    hari wajib dan tanpa tukar shift; tidak cocok sebagai sumber rasio.
  - Generate Alfa hanya menilai kemarin dan hari ini, jadi tanggal lampau yang
    terlewat tetap tanpa catatan (`-`).
- **Pola final berjejak**: `hr_pengajuan` + `hr_pengajuan_keputusan`
  (append-only, `sidik` SHA-256 hex dari isian kanonik digabung `\u{1f}`,
  status = keputusan final pertama menurut `urut_keputusan` yang sidiknya
  cocok, `Batal` menang, `diterima_cloud` jam cloud). Isi + baris anak dalam
  satu event dengan `PendingGuard::induk_tertunda` ada di `trip/save` +
  `drv_muatan`. Handler yang menulis hanya selama keadaan masih terbuka ada di
  servis aset (`CLAUDE.md` "Servis aset", rute `inventory-service/*`).
- **SP** (`hr_sp`) khusus cloud: tidak terbaca dari SQLite perangkat.
  Command fase 5 membaca SQLite lokal dulu lalu memanggil `TursoClient`.
- **Pengaturan HRIS** lewat rute `setting/update` yang sudah ada
  (`hris::simpan_pengaturan`: upsert `setting_gex_system` + outbox, event lama
  kunci yang sama dibuang). `BATAS_PENGATURAN` hanya angka dan
  `validasi_pengaturan` mewajibkan semua kuncinya; nilai teks (pola
  `hr_lembur_mode`, `hr_reimburse_bayar`) punya validatornya sendiri.
- **RBAC**: `catalog.ts` belum memuat `hr.performance.*`. Area `hris` =
  `employees.view` (Atasan sudah bisa membuka `/hris` di Web/Desktop), area
  `pengajuan` = `hr.request.view`. Seed HRD/Atasan Rust (`turso.rs`, daftar
  `IN`) ↔ `DEFAULT_ROLE_PERMISSIONS`; Admin Rust = semua di luar `NOT IN`.
- **Layar**: `HrisWorkspace` (tab Karyawan, Struktur, Keluar, Organisasi),
  `RincianKaryawan` (Kerja, Pribadi, Keuangan, Kontrak, Dokumen, Cuti, SP).
  Mobile punya `/pengajuan` (`PengajuanWorkspace`, di `filesToCopy`) tetapi
  tidak punya `/hris`.
- Skema sekarang: v40, sentinel `-2036`, `REQUIRED_TABLE_COUNT` 90, 62 tabel
  snapshot, 87 rute, command Desktop 279 / Mobile 285.

### 21.2 Model data (skema v41, sentinel `-2037` `hris-kinerja-v1`)

**Tersinkron** (Q-71; keempat lapis, `SNAPSHOT_TABLES` ↔ `SNAPSHOT_SOURCES`
identik, `storage.rs` Desktop DAN Mobile diubah manual, `SNAPSHOT_TABLES.columns`
Desktop dan Mobile). Tanpa `UNIQUE` selain PK. Menggantikan empat tabel usulan
§12: pemetaan jabatan dan keputusan butuh tabel sendiri.

| Tabel | Kolom |
| :-- | :-- |
| `hr_kinerja_template` | `id_template` PK (`ktp-<acak>`); `nama` NOT NULL; `keterangan`; `is_bawaan` INTEGER NOT NULL DEFAULT 0 CHECK (0,1); `is_aktif` INTEGER NOT NULL DEFAULT 1 CHECK (0,1); `diubah_oleh` NOT NULL; `created_at`, `updated_at` |
| `hr_kinerja_aspek` | `id_aspek` PK (`<id_template>:<acak>`); `id_template` NOT NULL; `nama` NOT NULL; `tipe` CHECK IN (`Manual`, `Otomatis Disiplin`); `bobot` INTEGER NOT NULL CHECK 1–100; `panduan` (teks untuk penilai); `urutan` INTEGER NOT NULL DEFAULT 0; `is_aktif` CHECK (0,1); `created_at`, `updated_at`. Indeks `id_template` |
| `hr_kinerja_jabatan` | `id_jabatan` PK; `id_template` (kosong = dilepas); `diubah_oleh` NOT NULL; `updated_at`. PK memastikan satu jabatan paling banyak satu template tanpa `UNIQUE` |
| `hr_kinerja_penilaian` | `id_penilaian` PK (`knj-<acak>`); `id_karyawan` NOT NULL; `id_ref` (koreksi: id penilaian AKAR); `alasan_koreksi`; `periode_jenis` CHECK IN (`Bulanan`, `Kuartal`, `Semester`, `Tahunan`); `periode_mulai`, `periode_selesai` NOT NULL, CHECK `periode_selesai >= periode_mulai`; `id_template` NOT NULL, `template_nama` NOT NULL (salinan); `id_jabatan`, `jabatan_nama` (salinan saat dibuat); `id_penilai` (id karyawan penilai, boleh kosong); `penilai_oleh` NOT NULL (username penyimpan terakhir); `catatan`; `sidik` NOT NULL; `dibuat_oleh` NOT NULL; `waktu_perangkat` NOT NULL; `created_at`, `updated_at`. Indeks `(id_karyawan, periode_mulai)`, `id_ref` |
| `hr_kinerja_nilai` | `id_nilai` PK (`<id_penilaian>:<id_aspek>`); `id_penilaian` NOT NULL; `id_aspek` NOT NULL; `aspek_nama` NOT NULL, `tipe` CHECK sama, `bobot` INTEGER NOT NULL CHECK 1–100, `urutan` (salinan template, Q-78); `skor` INTEGER CHECK (`skor IS NULL OR skor BETWEEN 1 AND 5`); `catatan`; `rincian` (teks kanonik disiplin §21.6, hanya `Otomatis Disiplin`). Indeks `id_penilaian` |
| `hr_kinerja_keputusan` | `id_keputusan` PK; `id_penilaian` NOT NULL; `jenis` CHECK IN (`Ajukan`, `Kembalikan`, `Final`, `Batal`); `sidik` NOT NULL; `alasan`; `nilai_akhir` INTEGER CHECK (`nilai_akhir IS NULL OR nilai_akhir BETWEEN 0 AND 10000`, hanya `Final`, ×100); `predikat` (salinan teks, hanya `Final`); `oleh` NOT NULL; `waktu_perangkat` NOT NULL; `diterima_cloud`; `created_at`. Indeks `id_penilaian` |

**Rute dan snapshot** (tiga rute baru, 87 → 90; enam tabel snapshot, 62 → 68):

| Rute | Isi event | Tabel |
| :-- | :-- | :-- |
| `hr-performance-template/save` | header template + semua aspek + baris pemetaan jabatan yang diubah | `hr_kinerja_template`, `hr_kinerja_aspek`, `hr_kinerja_jabatan` |
| `hr-performance/save` | header penilaian + semua baris nilai | `hr_kinerja_penilaian`, `hr_kinerja_nilai` |
| `hr-performance-decision/create` | satu keputusan | `hr_kinerja_keputusan` |

- `delete_missing: false` untuk lima tabel (tidak ada baris yang dihapus:
  template dan aspek dinonaktifkan, pemetaan dilepas dengan `id_template`
  kosong, penilaian dibatalkan). `hr_kinerja_nilai` `delete_missing: true`
  (muat ulang template di draf bisa membuang aspek), dilindungi
  `PendingGuard::induk_tertunda` selama event `hr-performance` induknya
  tertunda (pola `drv_muatan`). Domain snapshot `hr-performance-aspect`,
  `hr-performance-position`, `hr-performance-score` tanpa rute push.
- **Handler cloud**:
  - `hr-performance-template/save`: upsert ketiganya; bila `is_bawaan = 1`,
    `UPDATE hr_kinerja_template SET is_bawaan = 0 WHERE id_template <> ?` di
    transaksi yang sama (aturan 34).
  - `hr-performance/save`: menulis header dan nilai **hanya bila** penilaian
    itu belum punya keputusan `Final` atau `Batal` di cloud; selain itu event
    dilewati, tidak ditolak (pola servis). Baris nilai yang tidak ada di
    payload dihapus di transaksi yang sama.
  - `hr-performance-decision/create`: `INSERT … ON CONFLICT DO NOTHING`,
    `diterima_cloud = datetime('now')`. Tidak pernah menolak karena urutan.
- **Validasi Rust sebelum SQLite + outbox** (aturan 43): semua enum, rentang
  skor/bobot/`nilai_akhir`, panjang teks, dan bentuk `rincian` persis CHECK
  cloud.
- **Tanpa seed**: template bersifat milik perusahaan, jadi tidak ada template
  bawaan yang ditanam (lihat §21.12).

**Pengaturan** (`setting_gex_system` lewat rute `setting/update` yang sudah
ada, validator sendiri `validasi_pengaturan_kinerja` ↔
`validasiPengaturanKinerja`, **tidak** lewat `BATAS_PENGATURAN`, jadi tes
`pengaturan_kontrak` tidak berubah):

| Kunci | Bawaan | Aturan |
| :-- | :-- | :-- |
| `hr_kinerja_periode` | `Semester` | `Bulanan`, `Kuartal`, `Semester`, `Tahunan` |
| `hr_kinerja_ambang_disiplin` | `950,900,800,700` | empat bilangan bulat 1–1000, turun tegas: permil minimal skor 5, 4, 3, 2 |
| `hr_kinerja_predikat` | `9000:Sangat Baik\|7500:Baik\|6000:Cukup\|4000:Kurang\|0:Sangat Kurang` | 2–7 pasangan `ambang×100:nama`, ambang turun tegas, yang terakhir 0, nama 1–50 karakter tanpa `\|` dan `:` |

Kosong atau rusak = bawaan (pola `dari_peta`). Kedua jalur:
`CURRENT_SCHEMA_VERSION`/`CLIENT_SCHEMA_VERSION` 41, sentinel `-2037` + angka
`ensure_schema_current`, `REQUIRED_TABLE_COUNT` 96, enam tabel ikut
`PROMOTION_PLAN` dan dibuang saat pindah database.

### 21.3 Template, aspek, dan pemetaan jabatan (Q-78, Q-79)

- **Template** (`validasi_template` ↔ `validasiTemplate`): nama 1–100, unik di
  aplikasi (tanpa `UNIQUE`; kembaran offline tampil sebagai tanda
  `nama_ganda`); keterangan ≤ 1.000.
- **Aspek aktif**: 1–20; nama 1–100 unik dalam template; bobot bilangan bulat
  1–100 dan **total aspek aktif tepat 100**; paling banyak satu
  `Otomatis Disiplin`; panduan ≤ 1.000. Aspek tidak pernah dihapus, hanya
  dinonaktifkan; tipenya terkunci sejak dibuat.
- **Bawaan** (Q-79): paling banyak satu template aktif ber-`is_bawaan = 1`;
  template bawaan tidak bisa dinonaktifkan selagi bawaan. Dua perangkat
  offline yang sama-sama menandai bawaan: yang terakhir sampai di cloud menang
  (handler §21.2).
- **Pemetaan**: satu template boleh untuk banyak jabatan; satu jabatan
  paling banyak satu template (PK `hr_kinerja_jabatan`). Pemetaan disunting
  dari form template; memindahkan jabatan ke template lain cukup menulis
  barisnya dengan `id_template` baru.
- **Template seorang karyawan** (`template_karyawan` ↔ `templateKaryawan`):
  pemetaan jabatan `master_data.id_jabatan` ke template aktif; bila tidak ada
  (jabatan tanpa template, `id_jabatan` kosong, atau template nonaktif) =
  template bawaan aktif; bila tidak ada juga = "belum bisa dinilai".
- **Mengubah template yang sudah dipakai** (Q-78): boleh. Penilaian menyalin
  nama aspek, tipe, bobot, dan urutan ke `hr_kinerja_nilai` saat dibuat, jadi
  perubahan hanya berlaku untuk penilaian sesudahnya. Draf bisa "Muat ulang
  template" (menulis ulang baris nilai dari template kini; skor aspek yang
  `id_aspek`-nya masih ada dipertahankan).

### 21.4 Periode (Q-82, Q-80)

- **Jenis** dari `hr_kinerja_periode`, dibekukan ke `periode_jenis` saat
  penilaian dibuat. Rentang kalender (`periode_rentang` ↔ `periodeRentang`):
  bulan (1 s.d. akhir bulan), kuartal (Jan–Mar, Apr–Jun, Jul–Sep, Okt–Des),
  semester (Jan–Jun, Jul–Des), tahun. Payload menyebut jenis + tanggal mulai;
  `periode_selesai` dihitung, dan pasangan yang tidak kanonik ditolak.
- **Satu penilaian per karyawan per periode** (Q-73), ditegakkan di perangkat
  dan Web: penilaian akar (tanpa `id_ref`) yang tidak dibatalkan dan rentangnya
  bertumpuk dengan penilaian akar lain karyawan itu (jenis apa pun) ditolak.
  Mengganti jenis tidak mengubah penilaian lama; periode baru yang bertumpuk
  dengan periode lama ditolak. Dua perangkat offline yang membuat penilaian
  untuk karyawan dan periode yang sama → tanda `penilaian_ganda` di keduanya;
  HRD membatalkan salah satunya.
- **Rentang aktif** (Q-80): `mulai_aktif` = max(`periode_mulai`,
  `tanggal_daftar`); `akhir_aktif` = min(`periode_selesai`,
  `tanggal_selesai_aktif` bila terisi). Rentang aktif kosong = tidak bisa
  dinilai. Rentang aktif yang lebih pendek dari periode = tanda
  `periode_tidak_penuh`.
- **Membuat** penilaian baru: karyawan `status_aktif = 'Aktif'`. Setelah keluar
  berlaku (`id_keluar` terisi), penilaian baru ditolak; draf dan penilaian
  diajukan yang sudah ada tetap bisa difinalkan atau dibatalkan. Draf boleh
  dibuat sejak `periode_mulai` ≤ hari ini; **Ajukan** terbuka sejak
  `periode_selesai` ≤ hari ini (tanggal WIB SQLite perangkat; cloud tidak
  memeriksa ulang).
- **Draf offline, Ajukan mencoba sinkron dulu** (Q-72, jalan tengah). Simpan
  draf selalu boleh offline. Di Desktop/Mobile, tombol Ajukan menjalankan
  `syncNow()` lebih dulu, lalu menyimpan ulang draf supaya disiplin dihitung
  dari data yang baru ditarik. Bila `rincian` disiplin berubah, Ajukan berhenti
  dan layar menampilkan angka lama → baru untuk diperiksa; penilai menekan
  Ajukan sekali lagi. Bila sinkron gagal (offline, `TURSO_NOT_CONFIGURED`),
  Ajukan tetap jalan dengan peringatan "Data absensi mungkin belum terbaru;
  angka disiplin dihitung dari data di perangkat ini." Web selalu membaca
  cloud, jadi tanpa langkah sinkron. Tidak ada kolom yang mencatat apakah
  sinkron berhasil; HRD tetap melihat `disiplin_berubah` di rincian.
- **Template mengikuti jabatan saat penilaian dibuat** (Q-80); jabatan yang
  berganti di tengah periode tidak mengubahnya, kecuali "Muat ulang template"
  selama draf (yang membaca jabatan kini).

### 21.5 Penilaian, status, dan finalisasi

**Isian** (`validasi_penilaian` ↔ `validasiPenilaian`): skor bilangan bulat
1–5 atau kosong selama draf; catatan aspek ≤ 1.000; catatan umum ≤ 2.000;
aspek `Otomatis Disiplin` diisi sistem (§21.6), tidak dari payload, kecuali
hari dinilai 0. Penilai = sesi penyimpan terakhir (`penilai_oleh`,
`id_penilai` dari `id_karyawan` sesi); penilai lain boleh mengambil alih
selama draf, `dibuat_oleh` tetap. Penilai bawaan (atasan langsung) hanya
menentukan daftar "Perlu saya nilai" dan tanda `bukan_atasan_langsung`.

**Sidik** (`sidik_penilaian` ↔ `sidikPenilaian`, pola `sidik_pengajuan`:
digabung `\u{1f}`, SHA-256 hex): `id_karyawan`, `id_ref`, `periode_mulai`,
`periode_selesai`, `id_template`, `catatan`, lalu per baris nilai urut
(`urutan`, `id_aspek`): `id_aspek`, `tipe`, `bobot`, `skor` (kosong bila
null), `catatan`, `rincian`. Penilai tidak ikut sidik.

**Status turunan** (`status_kinerja` ↔ `statusKinerja`, berurutan, keputusan
diurutkan `urut_keputusan` yang sudah ada):

1. `Dibatalkan`: ada keputusan `Batal`.
2. `Final`: ada `Final` dengan sidik = sidik sekarang (yang pertama berlaku).
3. `Diajukan`: `Ajukan` terakhir bersidik sekarang lebih baru daripada
   `Kembalikan` terakhir bersidik sekarang.
4. `Draf`.

**Aksi** (`periksa_aksi_kinerja` ↔ `periksaAksiKinerja`; semuanya ditolak
bila `id_karyawan` penilaian = `id_karyawan` sesi, termasuk Superadmin):

| Aksi | Izin | Syarat |
| :-- | :-- | :-- |
| Simpan draf | `assess` | status Draf (atau baru) |
| Ajukan | `assess` | Draf; semua skor terisi; `periode_selesai` ≤ hari ini; `rincian` disiplin tersimpan = hitungan saat ini (`PESAN_DISIPLIN_BERUBAH`, penjaga backend untuk §21.4) |
| Kembalikan | `finalize` | Diajukan; alasan wajib (1–500) |
| Final | `finalize` | Diajukan; menulis `nilai_akhir` dan `predikat` beku ke baris keputusan |
| Batal | `assess` atau `finalize` | Draf atau Diajukan; alasan wajib. Final tidak bisa dibatalkan, hanya dikoreksi (§21.7) |

**Tanda** (`tanda_kinerja` ↔ `tandaKinerja`): `penilaian_ganda`,
`final_gugur` (ada `Final` yang sidiknya tidak cocok lagi: isi offline yang
lebih dulu sampai menggugurkan final versi lama, pola ACC pengajuan),
`final_dibatalkan` (`Batal` dari perangkat lain menang atas `Final`),
`dinilai_dan_difinalkan_sama` (Q-28), `bukan_atasan_langsung`,
`disiplin_manual`, `periode_tidak_penuh`. `disiplin_berubah` (hitungan hidup ≠
`rincian` beku) hanya dihitung di layar rincian, bukan di daftar.

### 21.6 Rumus Otomatis Disiplin (Q-75, Q-76, Q-77)

Fungsi murni kembar `hitung_disiplin` ↔ `hitungDisiplin` dengan vektor uji
yang sama; masukannya dibaca dengan SQL kembar baru (teks diperiksa harfiah):
`DISIPLIN_KARYAWAN_SQL` (hari kerja + kode shift, pola
`LAPORAN_KEHADIRAN_SQL.karyawan` untuk satu id), `DISIPLIN_HARI_SQL` (kolom
sama dengan `LAPORAN_KEHADIRAN_SQL.hari` + saringan `id_karyawan`),
`DISIPLIN_PENGAJUAN_SQL` dan `DISIPLIN_TUKAR_SQL` (`LAPORAN_PENGAJUAN_SQL` /
`LAPORAN_TUKAR_SQL` + saringan `id_karyawan`), `DISIPLIN_PERJALANAN_SQL`
(tanggal WIB `date(waktu_perangkat, '+7 hours')` laporan ber-`id_karyawan`,
batas sama dengan `PELAPOR_PERJALANAN_SQL`); libur dan whitelist memakai
`LAPORAN_KEHADIRAN_SQL.libur`/`.whitelist` apa adanya. Tidak lewat
`getLaporanKehadiran`, jadi batas 92 hari tidak berlaku (periode maks 366 hari).
Desktop/Mobile membaca SQLite lokal; Web membaca cloud.

**Rentang dihitung**: `mulai_aktif` s.d. min(`akhir_aktif`, hari ini WIB).

**Klasifikasi per tanggal** (yang pertama cocok):

| # | Keadaan | Kelas |
| :-- | :-- | :-- |
| 1 | tercatat Hadir dan tidak terlambat (sel `H`) | tepat |
| 2 | tercatat Hadir dan terlambat (sel `T`, `MAX(menit_terlambat) > 0`) | telat |
| 3 | ada laporan perjalanan ber-`id_karyawan` di tanggal WIB itu | tepat |
| 4 | pengajuan Cuti/Izin/Sakit/Dinas Luar berlaku, dan tanggal itu tercatat atau dijadwalkan | dikecualikan |
| 5 | tercatat Sakit/Izin/Dispen (koreksi admin) | dikecualikan |
| 6 | tercatat Alfa | alfa |
| 7 | dijadwalkan (`wajib_masuk` dengan shift tukar dan whitelist libur, sama dengan laporan) tanpa catatan | kosong |
| 8 | selain itu (libur, libur mingguan) | tidak dihitung |

Urutan 1, 2, 4–8 sama dengan `susunLaporanKehadiran`; baris 3 menambahkan hari
perjalanan (pola `HARI_HADIR_SQL`). Laporan kehadiran sendiri tidak diubah.

**Aritmetika** (`i64` ↔ `number`, bilangan bulat; hasil kali maks
2 × 366 × 1000, jauh di bawah 2^53):

- `D` = tepat + telat + alfa + kosong (dikecualikan tidak masuk, Q-75; kosong
  masuk, Q-76).
- `P` (permil) = ⌊(2 × tepat + telat) × 1000 / (2 × D)⌋. Tepat = 1, telat = ½,
  alfa dan kosong = 0.
- Skor = 5 bila P ≥ a₅, 4 bila P ≥ a₄, 3 bila P ≥ a₃, 2 bila P ≥ a₂, selain itu
  1; (a₅, a₄, a₃, a₂) dari `hr_kinerja_ambang_disiplin` (bawaan 950, 900, 800,
  700).
- `D = 0` (tidak ada hari dinilai): skor tidak dihitung; penilai mengisi skor
  manual dengan catatan wajib, tanda `disiplin_manual`.
- `rincian` = `D|tepat|telat|alfa|kosong|dikecualikan|P|a₅,a₄,a₃,a₂` (teks
  kanonik, ikut sidik). Dihitung ulang setiap simpan draf; beku sejak Ajukan.
  Layar menampilkan rumus dan setiap angkanya kepada penilai dan HRD.

Vektor: D = 20 (tepat 17, telat 2, alfa 1) → P = 36.000 / 40 = 900 → skor 4.
D = 21 (tepat 20, telat 1) → P = ⌊41.000 / 42⌋ = 976 → skor 5. D = 3 (kosong 3)
→ P = 0 → skor 1. Tepat 10 + 4 hari cuti berlaku → D = 10, P = 1000 → skor 5.

**SP** (Q-77): hanya informasi. Layar rincian membaca SP Berlaku dalam periode
dari cloud (`TursoClient`, setelah koneksi SQLite lokal ditutup); offline
tampil "butuh koneksi". Tidak mengubah angka disiplin dan tidak ikut sidik.

### 21.7 Nilai akhir, predikat, dan koreksi (Q-74, Q-81)

- **Nilai aspek** (Q-74) = (skor − 1) × 25: 1 = 0, 2 = 25, 3 = 50, 4 = 75,
  5 = 100.
- **Nilai akhir ×100** (`nilai_akhir` ↔ `nilaiAkhir`) = Σ bobot × 25 ×
  (skor − 1), rentang 0–10.000. Karena Σ bobot = 100, hasilnya tepat nilai
  0–100 dengan dua desimal; **tidak ada pembulatan**. Tampil `77,50`.
- **Predikat** (`predikat` ↔ `predikatNilai`): pasangan pertama dari
  `hr_kinerja_predikat` yang ambangnya ≤ nilai akhir ×100. Dibekukan ke
  keputusan `Final`; mengubah pengaturan tidak mengubah penilaian final.
- Vektor: bobot 40/35/25, skor 4/5/3 → 40 × 75 + 35 × 100 + 25 × 50 = 7.750
  → 77,50 Baik. Semua 5 → 10.000 Sangat Baik. Semua 1 → 0 Sangat Kurang.
- **Koreksi** (Q-81): penilaian baru ber-`id_ref` = id penilaian **akar**
  (koreksi atas koreksi tetap merujuk akar), `alasan_koreksi` wajib (1–1.000),
  baris nilai disalin dari penilaian berlaku (bukan dari template), lalu
  melewati Draf → Diajukan → Final yang sama. Dibuat oleh pemegang
  `finalize`; diisi pemegang `assess` atau `finalize`. Paling banyak satu
  koreksi terbuka (Draf/Diajukan) per akar; akar harus Final.
- **Nilai berlaku** per karyawan per periode (`kinerja_berlaku` ↔
  `kinerjaBerlaku`): di antara akar dan koreksinya yang berstatus Final,
  yang keputusan `Final`-nya paling akhir menurut `urut_keputusan`. Riwayat
  menampilkan semuanya.

### 21.8 Hak akses (Q-83, Q-84, Q-85)

| Izin | Sensitif | Rahasia | Paket bawaan |
| :-- | :-- | :-- | :-- |
| `hr.performance.view` | | ya | HRD |
| `hr.performance.assess` | | ya | HRD, Atasan |
| `hr.performance.config` | | | HRD (dan Admin) |
| `hr.performance.finalize` (baru, tidak ada di §10.1) | ya | | HRD |

- Rahasia = `CONFIDENTIAL_PERMISSIONS` dan `NOT IN` seed Admin Rust; sensitif
  = `SENSITIVE_MUTATION_PERMISSIONS` dan `NOT IN`. Seed HRD Rust +
  `DEFAULT_ROLE_PERMISSIONS.hrd` empat izin; seed Atasan +
  `DEFAULT_ROLE_PERMISSIONS.atasan` `hr.performance.assess`.
- **Membaca** daftar dan rincian: `view`, `assess`, atau `finalize`
  (`requireAnyWebPermission` / `require_any_permission`). Penilaian atas diri
  sesi tidak pernah terbaca selama belum Final, dan sesudah Final hanya lewat
  `view` (Q-85). Template: keempat izin.
- **Menyunting** template, pemetaan, dan pengaturan kinerja: `config`.
- Area: `/hris` tetap area `hris`, tab Kinerja memeriksa izinnya sendiri.
  Area `pengajuan` juga menerima `hr.performance.assess` dan `view` (pola
  `reimburse.decide`), supaya Atasan tanpa `hr.request.view` bisa membuka tab
  Penilaian di Mobile. Backend memeriksa ulang (aturan 10).

### 21.9 Command, rute, dan layar

**Rust** (`desktop/hr_kinerja.rs` baru, disalin ke Mobile lewat daftar salin
`sync-rust-modules.ts`; terdaftar di kedua `lib.rs`, `build.rs`,
`capabilities/default.json`; mutasi lokal + outbox dalam satu transaksi):

| Command | Izin |
| :-- | :-- |
| `desktop_hr_performance_templates` (template, aspek, pemetaan, pengaturan) | `view` / `assess` / `config` / `finalize` |
| `desktop_hr_performance_template_save` | `config` |
| `desktop_hr_performance_settings_save` | `config` |
| `desktop_hr_performance_list` (per periode: penilaian, status, tanda, karyawan belum dinilai, "Perlu saya nilai") | `view` / `assess` / `finalize` |
| `desktop_hr_performance_detail` (rincian, hitungan disiplin hidup, riwayat koreksi, SP dari cloud bila terhubung) | `view` / `assess` / `finalize` |
| `desktop_hr_performance_save` (buat, ubah draf, muat ulang template, buat koreksi) | `assess`; koreksi `finalize` |
| `desktop_hr_performance_decide` (Ajukan, Kembalikan, Final, Batal) | menurut §21.5 |

Command Desktop 279 → 286, Mobile 285 → 292. Handler cloud tiga rute di
`turso.rs` (`apply_event_to_turso`), `CANONICAL_SYNC_ROUTES` ↔
`canonical_sync_route`.

**Web**: `validations/hr-kinerja.ts` + `services/hr-kinerja.ts` (kembar Rust),
rute `POST /api/hris/performance` (Zod `.strict()`, aksi per operasi, tanpa
`GET`), gateway `gateways/hr-kinerja.ts`.

**Layar**:

1. `/hris` tab **Kinerja** (Web/Desktop, `KinerjaWorkspace.tsx`): pemilih
   periode, daftar (Belum dinilai, Draf, Diajukan, Final, Dibatalkan, tanda),
   rincian dengan form skor per aspek, panel rumus disiplin, SP Berlaku,
   Ajukan / Kembalikan / Final / Batal / Buat koreksi (`konfirmasiData`
   sebelum simpan dan sebelum Final), riwayat koreksi.
2. `/hris` tab Kinerja bagian **Template** (`config`): template, aspek dan
   bobot (penjumlah 100 hidup), pemetaan jabatan, template bawaan, pengaturan
   periode, ambang disiplin, dan predikat.
3. `RincianKaryawan` tab **Kinerja** (`view`): nilai berlaku per periode dan
   riwayat koreksi.
4. Mobile `/pengajuan` tab **Penilaian** (`assess`; komponen bersama
   `PenilaianKinerja.tsx` di `filesToCopy`): daftar periode, "Perlu saya
   nilai", isi skor dan catatan, rumus disiplin, Simpan (offline boleh),
   Ajukan (sinkron dulu, §21.4). Template dan Final hanya Web/Desktop (Q-72).
   Ajukan di tab Kinerja Desktop memakai alur sinkron yang sama.

### 21.10 Tidak dikerjakan di fase ini

- Penilaian diri oleh karyawan (Q-3) dan penilaian 360°/banyak penilai
  (Q-73).
- SP mengurangi nilai disiplin (Q-77); SP hanya informasi.
- Kait nilai kinerja ke gaji, bonus, kenaikan, atau perpanjangan kontrak.
- Target KPI numerik per aspek, kalibrasi, dan distribusi paksa.
- Template bawaan yang ditanam saat provisioning.
- Laporan kehadiran yang membaca perjalanan driver (hanya disiplin yang
  membacanya).
- Cetak A4 dan ekspor Excel hasil penilaian.
- Kejadian Telegram (fase 8, Q-32).

### 21.11 Langkah

| # | Langkah | Gerbang |
| :-- | :-- | :-- |
| 1 | **Skema v41**: enam tabel di keempat lapis (`storage.rs` Desktop DAN Mobile diubah manual, tidak disalin `sync:mobile`), `SNAPSHOT_TABLES` (termasuk `columns`) Desktop dan Mobile ↔ `SNAPSHOT_SOURCES`, `delete_missing` §21.2, `PendingGuard::induk_tertunda` untuk `hr_kinerja_nilai`; indeks dibuat sesudah tabelnya (aturan 20); sentinel `-2037` + `ensure_schema_current`, `CURRENT_SCHEMA_VERSION`/`CLIENT_SCHEMA_VERSION` 41, `REQUIRED_TABLE_COUNT` 96, daftar `isDatabaseSchemaReady` (`db-schema.ts`), `schema-consistency.test.ts`, `PROMOTION_PLAN`, `CLOUD_MIRRORED_TABLES` dan pembuangan saat pindah database; daftar sentinel di tes `turso.rs` dan tes skema ikut disesuaikan. Tidak ada seed; bila pemilik meminta template bawaan, seed berjalan sesudah `ensure_column`/`hasColumn` di ketiga lapis. | `audit:schema` + tes sentinel/provisioning/pindah database Rust |
| 2 | **Aturan kembar** `hr_kinerja.rs` ↔ `validations/hr-kinerja.ts`: `validasi_template`, `template_karyawan`, `periode_rentang`, rentang aktif, `validasi_penilaian`, `sidik_penilaian`, `status_kinerja`, `periksa_aksi_kinerja`, `tanda_kinerja`, `hitung_disiplin`, `nilai_akhir`, `predikat`, `kinerja_berlaku`, `validasi_pengaturan_kinerja`; SQL kembar `DISIPLIN_*_SQL` diperiksa harfiah. Vektor §21.6 dan §21.7. Pengaturan kinerja TIDAK masuk `BATAS_PENGATURAN` (tes `pengaturan_kontrak` dan "pengaturan kontrak" tidak berubah). | `bun run sync:mobile` dulu (tes teks SQL membaca salinan Mobile), lalu `bun run test` (per berkas; jumlah baris "0 fail" = jumlah berkas `*.test.ts`) + `cargo test hr_kinerja` |
| 3 | **Handler cloud** tiga rute: template + bawaan idempoten, penilaian hanya selama belum Final/Batal, keputusan tanpa penolakan. | tes `TursoClient::local_file`: save sesudah Final dilewati; dua bawaan → satu; `Batal` menang; `final_gugur` |
| 4 | **Command lokal + outbox** (transaksi tunggal), detail membaca SP cloud setelah koneksi SQLite ditutup; jumlah argumen `Statement` pas dengan placeholder. | tes alur Rust (`tests_alur::alur_fase6_kinerja`: buat, isi, ajukan, Ajukan ditolak saat `rincian` basi lalu lolos setelah simpan ulang, kembalikan, final, koreksi, diri sendiri ditolak, keluar berlaku) |
| 5 | **Web**: service, rute `/api/hris/performance`, gateway. | `services/hr-kinerja.test.ts` (alur Web sama dengan langkah 4) |
| 6 | **RBAC**: `catalog.ts` (4 izin), `CONFIDENTIAL_PERMISSIONS`/`SENSITIVE_MUTATION_PERMISSIONS`, baris izin + `NOT IN` seed Admin Rust, seed HRD dan Atasan Rust + `DEFAULT_ROLE_PERMISSIONS`, area `pengajuan`, `rbac-migration.test.ts` + versi 41; 7 command di keempat tempat; daftar harapan `audit-sync-contract.ts` (3 rute, 6 tabel snapshot, jumlah command; pengetatan, bukan pelonggaran) dan angka di dokumen skill; `hr.performance.finalize` tertulis di `CLAUDE.md`. | `audit:contract` + `audit:docs` + `web-rbac-boundary` |
| 7 | **Layar** §21.9 (Web/Desktop dan tab Mobile). | typecheck + Biome |
| 8 | `bun run sync:mobile`, bagian `CLAUDE.md` "HRIS fase 6", catatan "Sudah dibangun". | `audit:docs`; `bun run check` penuh oleh pemilik |

### 21.12 Penanda yang ditinjau pemilik saat menyetujui

- **Q-72 jalan tengah** (§21.4): draf offline, Ajukan sinkron dulu; bila
  sinkron gagal, Ajukan tetap jalan dengan peringatan. Ini mengurangi, bukan
  menghilangkan, angka disiplin yang basi dan penilaian ganda.
- **Akibat Q-71**: nilai, skor, dan catatan penilai tersalin ke SQLite setiap
  perangkat, termasuk terminal scanner (berbeda dengan Q-30 dan Q-63).
  Kerahasiaan hanya dijaga izin di command dan rute.
- Satu penilaian per periode hanya ditegakkan di perangkat; kembaran offline
  menjadi tanda, bukan ditolak cloud.
- Enam tabel, bukan empat (§12): pemetaan jabatan dan keputusan butuh tabel
  sendiri; pemetaan tidak menambah kolom ke `hr_jabatan`.
- Bawaan: periode `Semester`, ambang disiplin 950/900/800/700, predikat
  90/75/60/40/0.
- Skor disiplin tidak bisa ditimpa penilai, kecuali D = 0.
- Hari perjalanan driver dihitung tepat waktu walau tanpa scan; laporan
  kehadiran tetap menampilkannya `-`.
- Ajukan terbuka sejak hari terakhir periode, memakai tanggal perangkat.
- Koreksi dibuat pemegang `finalize` saja; penilai yang juga memfinalkan
  diizinkan dengan tanda `dinilai_dan_difinalkan_sama` (preseden Q-28).
- Template bawaan tidak ditanam; tanpa template bawaan, karyawan yang
  jabatannya belum dipetakan belum bisa dinilai.
- **Semua perangkat wajib diperbarui sebelum penilaian dipakai**: perangkat
  v40 tidak mengenal tiga rute baru dan enam tabel snapshot.

### 21.13 Jawaban fase 6 (11 Nov 2026)

| No | Pertanyaan | Jawaban |
| :-- | :-- | :-- |
| Q-71 | Data kinerja khusus cloud atau tersinkron | Tersinkron semua (template, aspek, penilaian, nilai), termasuk ke terminal scanner |
| Q-72 | Atasan menilai dari HP | Ya, Mobile juga (tab di `/pengajuan`); Final dan template tetap Web/Desktop. Dijawab ulang 12 Nov 2026: draf boleh offline, Ajukan menjalankan sinkron dulu dan menghitung ulang disiplin; bila sinkron gagal, tetap bisa diajukan dengan peringatan (§21.4) |
| Q-73 | Jumlah penilai per karyawan per periode | Satu penilaian; bawaan atasan langsung, penilai lain boleh mengambil alih selama draf, namanya tercatat |
| Q-74 | Skor 1–5 ke 0–100 | (skor − 1) × 25 |
| Q-75 | Rumus disiplin | Rasio: tepat 1, terlambat ½, Alfa 0; Cuti/Izin/Sakit/Dinas Luar berlaku dan S/I/Dispen koreksi dikeluarkan dari pembagi; permil ke skor lewat ambang yang bisa disunting |
| Q-76 | Hari wajib tanpa catatan | Sama dengan Alfa, ditampilkan terpisah sebagai "tanpa catatan" |
| Q-77 | SP di penilaian | Informasi saja, tidak mengubah angka |
| Q-78 | Template yang sudah dipakai | Boleh diubah; penilaian membekukan salinan aspek dan bobot, draf bisa muat ulang |
| Q-79 | Jabatan tanpa template / karyawan tanpa jabatan | Template bawaan (satu, ditandai) |
| Q-80 | Masuk/keluar/ganti jabatan di tengah periode | Dinilai atas rentang aktif dengan tanda; template menurut jabatan saat dibuat; sesudah keluar berlaku tidak ada penilaian baru, draf tetap bisa diselesaikan |
| Q-81 | Bentuk koreksi | Penilaian koreksi utuh merujuk akar, alasan wajib, final ulang oleh HRD |
| Q-82 | Bentuk periode | Kalender, satu jenis per perusahaan (`hr_kinerja_periode`); penilaian bertumpuk ditolak di perangkat |
| Q-83 | Izin memfinalkan | Izin baru `hr.performance.finalize`, sensitif, paket HRD |
| Q-84 | Kerahasiaan izin | `view` dan `assess` rahasia; `config` tidak |
| Q-85 | Yang terbaca pemegang `assess` tanpa `view` | Semua penilaian, kecuali penilaian atas dirinya; itu hanya terbaca setelah Final lewat `view` |

### 21.14 Sudah dibangun (12 Nov 2026)

Langkah 1–8 dibangun. Gerbang yang dijalankan: `audit:schema` (96 tabel wajib,
90 tabel dipromosikan), `audit:contract` (90 rute, 68 tabel snapshot, command
Desktop 286 / Mobile 292), dan `audit:docs` lulus; `cargo test --lib` Desktop
425 dan Mobile 429 lulus (termasuk `hr_kinerja::tests` dengan vektor §21.6 dan
§21.7, `tests_alur::alur_fase6_kinerja`, `kinerja_cloud_bawaan_final_batal_dan_gugur`,
`sentinel_2036_memicu_skema_kinerja`, dan `nilai_kinerja_terlindungi_oleh_outbox_penilaian`);
runner tes TS kedua workspace (`bun run test`, 92 dan 83 berkas) lulus, termasuk
`validations/hr-kinerja.test.ts` (vektor kembar, teks SQL dan pesan kembar
Rust ↔ TS, juga salinan Mobile), `services/hr-kinerja.test.ts` (alur Web sama
dengan alur Rust), dan `web-rbac-boundary.test.ts` (paket izin bawaan); typecheck
kedua workspace dan Biome berkas yang diubah bersih. `bun run check` penuh belum
dijalankan (pemilik). Layar belum dicoba di aplikasi yang berjalan.

Penyimpangan dan catatan, untuk ditinjau:

- **DDL lebih ketat dari §21.2**: `NOT NULL` pada `tipe` (aspek dan nilai),
  `periode_jenis`, dan `jenis` keputusan; `is_aktif` aspek `NOT NULL DEFAULT 1`;
  `urutan` nilai `NOT NULL DEFAULT 0`; `created_at`/`updated_at`
  `NOT NULL DEFAULT (datetime('now'))`; CHECK periode tingkat tabel.
- **Nama domain dan kunci payload** yang ditetapkan: `hr-performance-template`,
  `hr-performance` (penilaian), `hr-performance-decision`; payload
  `hrPerformanceTemplates`, `…Aspects`, `…Positions`, `…Reviews`, `…Scores`,
  `…Decisions`. Bentuk event: `{ template, aspek, jabatan }`,
  `{ penilaian, nilai }`, dan baris keputusan datar.
- **`waktu_perangkat` keputusan berpresisi milidetik dan selalu sesudah
  keputusan sebelumnya** (`WAKTU_KEPUTUSAN_SQL`, kembar): tanpa itu Ajukan dan
  Kembalikan di detik yang sama berurutan acak dan statusnya ikut acak.
- **Simpan ditolak bila sudah ada `Final`/`Batal` dengan sidik apa pun**
  (`PESAN_FINAL_LAMA`), termasuk Draf karena `final_gugur`: cloud akan
  melewatinya, jadi perangkat menolak daripada menyimpan diam-diam.
- **Melepas jabatan di cloud** hanya berlaku bila jabatan itu masih milik
  template pengirim (tidak tertulis di §21.2), supaya perangkat lama tidak
  membatalkan pemindahan dari perangkat lain.
- **`rincian` saat D = 0** berbentuk `0|0|0|0|0|<dikecualikan>||a5,a4,a3,a2`
  (P kosong). `bukan_atasan_langsung` juga muncul bila penilai tidak punya
  `id_karyawan`; `final_dibatalkan` = ada `Batal` dan ada `Final` sidik apa pun.
- **Isian nilai kosong atau muat ulang template** mempertahankan skor
  tersimpan. Karyawan, periode, dan `id_ref` tidak bisa diubah setelah
  penilaian dibuat; koreksi wajib memakai karyawan dan periode akarnya.
- **Libur dan whitelist disiplin** dibaca `muat_kalender` ↔ `muatKalender`
  (isinya sama dengan `LAPORAN_KEHADIRAN_SQL.libur`/`.whitelist`).
- **Tambahan di luar §21.9**: `daftar` menerima saringan `id_karyawan`
  (riwayat semua periode, untuk tab Kinerja rincian karyawan) dan menandai
  `berlaku` per penilaian. `hris::tulis_pengaturan` diekstrak dari
  `simpan_pengaturan` dan dipakai pengaturan kinerja.
- **Urutan langkah**: RBAC dan pendaftaran tujuh command dikerjakan bersama
  langkah 5 (rute Web memakai `PermissionKey`, gateway memanggil command), sisa
  langkah 6 (area `pengajuan`, dokumen skill, tes batas) sesudahnya.
- **Gateway Ajukan** menyimpan ulang isian form di kedua jalur sebelum
  memutus; Desktop/Mobile menjalankan `syncNow()` lebih dulu (Q-72).
- **Belum dikerjakan**: perlindungan `PendingGuard` untuk baris aspek dan
  pemetaan yang menumpang event template (tidak diminta §21.2; aspek bisa
  dijaga lewat awalan `<id_template>:`, pemetaan tidak). Tab Kinerja `/hris`
  butuh area `hris` (`employees.view`); HRD dan Atasan bawaan memegangnya.
- Tes lama yang disesuaikan: daftar sentinel tes `turso.rs` + `-2037`, daftar
  versi migrasi `rbac-migration.test.ts` + 41, daftar tabel
  `schema-consistency.test.ts` + 6. Daftar harapan `audit-sync-contract.ts`
  + 3 rute dan + 6 tabel snapshot (pengetatan, bukan pelonggaran).

## 22. Urutan pengerjaan fase 7

**Disetujui pemilik (12 Nov 2026) dan dibangun (catatan di §22.15).** Ditulis setelah menelusuri kode
(12 Nov 2026). Q-86 sampai Q-100 sudah dijawab (§22.14), semuanya sesuai
usulan, dan rancangan utuhnya, termasuk penanda di §22.12, disetujui. Bila
§11.2, §10.1, atau §12 dan bagian ini berbeda, **bagian ini yang berlaku**
(terutama: enam tabel bukan lima, semuanya khusus cloud, dan satu izin baru
`hr.recruit.delete` di luar §10.1).

### 22.1 Temuan dari kode

- **Pola khusus cloud sudah lengkap dan bisa dipakai apa adanya.** `hr_profil`,
  `hr_dokumen_jenis`, `hr_dokumen`, `hr_dokumen_berkas` (`turso.rs`, blok v36)
  dan `hr_sp`, `hr_keluar*` (v40) hanya ada di `turso.rs` +
  `db-schema.ts`/`db-migrations.ts`. Command-nya `async`, mengambil
  `state.get_turso_client()` lalu memanggil fungsi modul (`hris::dokumen`,
  `simpan_dokumen`, `hapus_dokumen`, `tambah_berkas`, `berkas`,
  `hapus_berkas`); galat jaringan dipetakan `tak_terhubung`. Tulisan
  multi-tabel memakai `TursoClient::execute_atomic` dengan setiap statement
  dijaga keadaan yang sama (`BERLAKUKAN_SQL`, `hr_keluar.rs`), sehingga tekan
  ganda tidak menggandakan. Pada mode database lokal `TursoClient` menunjuk
  hub, jadi pola ini tetap jalan.
- **Berkas**: `hris::validasi_berkas` ↔ `validasiBerkas` (MIME dari
  `MIME_BERKAS` = JPEG/PNG/WEBP/PDF, `MAKS_BERKAS_BASE64` 1.398.104 karakter =
  1 MB, `base64_sah`, tanda tangan bita `%PDF` / `FF D8` / `89 50 4E 47` /
  `RIFF…WEBP`). Daftar dokumen tidak pernah membawa `data_base64`
  (`length(b.data_base64) AS panjang`); isi diambil per berkas. Maksimal
  `MAKS_BERKAS_PER_DOKUMEN` = 5, urutan = slot kosong terkecil.
- **Jenis dokumen "Sertifikat" sudah ada**: `SEED_JENIS_DOKUMEN_SQL`
  (`hris.rs`, kembar TS) menanam `dok-sertifikat` bersama delapan jenis lain
  (`INSERT OR IGNORE`, dijalankan setiap `ensure_schema`; tes `turso.rs`
  menghitung 9 baris). Jenis bisa dinonaktifkan HRD, dan `simpan_dokumen`
  menolak jenis nonaktif untuk dokumen baru.
- **`hr_dokumen.tanggal_kedaluwarsa` hari ini hanya disimpan dan
  ditampilkan** (`RincianKaryawan.tsx`: "tanpa kedaluwarsa" atau tanggalnya).
  Validasinya hanya "tidak sebelum tanggal terbit". Belum ada kueri, tanda,
  atau pengingat yang membacanya, tetapi indeksnya sudah ada
  (`idx_hr_dokumen_kedaluwarsa`), disiapkan untuk fase 8 (`hr-dok:<id>`).
- **Membuat karyawan, Desktop/Mobile** (`operational::create_employee`,
  command `desktop_create_employee`, izin `employees.manage`): `id_unik` dan
  `kode_karyawan` datang DARI DRAF (layar membuatnya dengan
  `createEmployeeIdentifiers(crypto.randomUUID())` →
  `EMP_<12 karakter>` / `K<8 karakter>`, `validations/stabilization.ts`);
  token dari `token_from_event(event_id)`, `qr_code = "{id}|{token}"`
  (aturan 31); organisasi lewat `hris::org_dari_draft` + `tulis_org` +
  `isi_payload_org`; `master_data`, `id_card`, dan outbox `employee/create`
  dalam SATU transaksi. Fungsi ini membuka koneksi dan transaksinya sendiri,
  jadi belum bisa digabung dengan tulisan lain.
- **Kontrak** (`hris::catat_kontrak`, `hr.contract.manage`): transaksi
  terpisah (`dalam_transaksi`), id acak `ktr-<hex>`, `INSERT_KONTRAK_SQL` +
  `JENIS_DARI_KONTRAK_SQL` + outbox `hr-contract/create` (append-only, kiriman
  ulang berhenti di PK). Karyawan + kontrak pertama hari ini DUA transaksi dan
  dua tekan.
- **Membuat karyawan, Web** (`services/employee.ts` `tambahKaryawan`): token
  `generateRandomToken(10)`, lalu TIGA `db.execute` terpisah (`master_data`,
  `id_card`, `tulisOrg`), tidak atomik hari ini.
- **Handler cloud `employee/create|update`** (`turso.rs`) menjalankan
  beberapa `query_one` berurutan, bukan satu batch, dan menolak payload tanpa
  `divisi`. Tidak ada fungsi yang mengembalikan daftar `Statement`-nya, jadi
  "menyisipkan karyawan baru langsung di cloud dalam satu batch bersama data
  pelamar" berarti menulis ulang handler itu.
- **Penghapusan berbasis jam database** (aturan 19): `driver::HAPUS_FOTO_LAMA_SQL`
  (`datetime('now', '-90 days')`, teks kembar), command
  `desktop_trip_photo_cleanup` (cukup `require_session`, lokal + cloud,
  kegagalan cloud tidak membatalkan lokal), dipanggil `AutoFotoCleanupRunner`
  (`AppShell`, 60 detik setelah login lalu tiap 6 jam, semua sesi). Tidak ada
  server atau penjadwal di arsitektur 2-tier; satu-satunya "penjadwal" adalah
  sesi yang sedang login.
- **RBAC**: `catalog.ts` belum memuat `hr.recruit.*` maupun `hr.training.*`
  (§10.1 sudah menyebut `view`/`manage` untuk keduanya). Admin Web = semua
  izin di luar `SENSITIVE_MUTATION_PERMISSIONS` dan `CONFIDENTIAL_PERMISSIONS`;
  Admin Rust = semua di luar daftar `NOT IN`. Seed HRD dan Atasan Rust
  (`turso.rs`, daftar `IN`, dijalankan setiap `ensure_schema`) ↔
  `DEFAULT_ROLE_PERMISSIONS`. HRD memegang `employees.manage` dan
  `hr.contract.manage`. Area `hris` = `employees.view` (`access.ts`); setiap
  tab memeriksa izinnya sendiri.
- **Versi skema menghentikan perangkat lama dengan sendirinya**:
  `sync.rs` (`is_client_schema_outdated`) dan `portability.rs` mengembalikan
  `SCHEMA_VERSION_OUTDATED` bila versi cloud > `CLIENT_SCHEMA_VERSION`. Begitu
  satu perangkat atau Web menaikkan cloud ke v42, perangkat v41 berhenti
  sinkron sampai diperbarui, apa pun isi fase ini.
- **`PROMOTION_PLAN`** ada di `lib/server/database-promotion.ts` (diperiksa
  `schema-audit.ts`); daftar harapan tabel khusus cloud ada di
  `audit-sync-contract.ts` (`.agents/skills/absensi-sppg-rules/scripts/`).
- **Layar**: `HrisWorkspace` (Karyawan, Struktur, Keluar, Kinerja,
  Organisasi), `RincianKaryawan` (Kerja, Pribadi, Keuangan, Kontrak, Dokumen,
  Cuti, SP, Kinerja). Mobile tidak punya `/hris` (Q-43).
- Skema sekarang: v41, sentinel `-2037`, `REQUIRED_TABLE_COUNT` 96, 68 tabel
  snapshot, 90 rute, command Desktop 286 / Mobile 292.

### 22.2 Model data (skema v42, sentinel `-2038` `hris-rekrutmen-v1`)

**Semua khusus cloud** (Q-86, Q-87; hanya `turso.rs` +
`db-schema.ts`/`db-migrations.ts`; tidak di `storage.rs`, tidak di
`SNAPSHOT_TABLES`/`SNAPSHOT_SOURCES`, tidak lewat outbox). Tanpa `UNIQUE`
selain PK. Alasannya per tabel:

| Tabel | Kenapa khusus cloud |
| :-- | :-- |
| `hr_pelamar`, `hr_pelamar_tahap`, `hr_pelamar_berkas` | Data pribadi orang yang BUKAN karyawan (UU PDP), preseden Q-30 dan Q-63. Yang menentukan: retensi (Q-33) mewajibkan data benar-benar hilang. Baris tersinkron yang dihapus tetap tertinggal di SQLite perangkat yang offline atau jarang dibuka, dan terminal scanner tidak punya alasan memegangnya |
| `hr_lowongan` | Tanpa data pribadi, tetapi hanya berguna bersama pelamar dan jangkar retensinya dibaca SQL cloud. Menyinkronkannya menambah empat lapis dan satu rute tanpa pemakai offline |
| `hr_pelatihan`, `hr_pelatihan_peserta` | Sertifikatnya `hr_dokumen` (khusus cloud), jadi layar pelatihan tetap butuh koneksi. Tidak ada alur lapangan yang membacanya offline |

Akibatnya fase ini **tanpa tabel snapshot baru (tetap 68) dan tanpa rute baru
(tetap 90)**. Pembatalan dan penutupan memakai KOLOM yang diisi sekali, bukan
baris `batal-<id>` (preseden §20.2: tidak ada dua perangkat offline yang perlu
digabung).

| Tabel | Kolom |
| :-- | :-- |
| `hr_lowongan` | `id_lowongan` PK (`low-<acak>`); `judul` NOT NULL; `id_jabatan`, `id_divisi`, `id_cabang` (boleh kosong; nama dibaca hidup dari master, Q-12); `jumlah` INTEGER NOT NULL CHECK 1–999; `tanggal_buka` NOT NULL; `tanggal_tutup` (rencana, boleh kosong), CHECK `tanggal_tutup IS NULL OR tanggal_tutup >= tanggal_buka`; `keterangan`; `ditutup_pada`, `ditutup_oleh` (jam database); `pelamar_dihapus` INTEGER NOT NULL DEFAULT 0 CHECK ≥ 0 (hitungan anonim, §22.6); `dicatat_oleh` NOT NULL, `created_at`; `diubah_oleh`, `diubah_pada`. Indeks `tanggal_buka` |
| `hr_pelamar` | `id_pelamar` PK (`plm-<hex>`); `id_lowongan` NOT NULL; `nama` NOT NULL; `no_hp` (kanonik `+62…`, aturan 40); `email`; `lp` CHECK (`lp IS NULL OR lp IN ('L','P')`); `tanggal_lahir`; `alamat`; `pendidikan` CHECK sama dengan `hr_profil.pendidikan`; `sumber` (teks bebas ≤ 100); `tanggal_lamaran` NOT NULL; `catatan`; `id_karyawan`, `dijadikan_oleh`, `dijadikan_pada` (klaim "Jadikan karyawan", diisi sekali, §22.5); `dicatat_oleh` NOT NULL, `created_at`; `diubah_oleh`, `diubah_pada`. Indeks `id_lowongan`, `id_karyawan`. **Tanpa NIK, KK, rekening**: itu baru diisi di `hr_profil` setelah menjadi karyawan |
| `hr_pelamar_tahap` | `id_tahap` PK (`<id_pelamar>:<urutan>`); `id_pelamar` NOT NULL; `urutan` INTEGER NOT NULL CHECK ≥ 1; `tahap` NOT NULL CHECK IN (`Lamaran`, `Seleksi Berkas`, `Wawancara`, `Tes`, `Penawaran`, `Diterima`, `Ditolak`, `Mundur`); `tanggal` NOT NULL (tanggal kejadian, WIB); `catatan`; `oleh` NOT NULL, `created_at` (jam database); `dibatalkan_oleh`, `dibatalkan_pada`, `alasan_batal`. Indeks `id_pelamar`. PK dari `urutan` membuat dua sesi yang mencatat tahap bersamaan bertabrakan di PK, bukan menghasilkan dua tahap "terakhir" |
| `hr_pelamar_berkas` | `id_berkas` PK (`pb-<acak>`); `id_pelamar` NOT NULL; `urutan` INTEGER NOT NULL CHECK 1–3; `nama_berkas`; `mime_type` NOT NULL CHECK sama dengan `hr_dokumen_berkas`; `data_base64` NOT NULL; `created_at`. Indeks `id_pelamar` |
| `hr_pelatihan` | `id_pelatihan` PK (`plt-<acak>`); `nama` NOT NULL; `penyelenggara`; `tanggal_mulai` NOT NULL, `tanggal_selesai` NOT NULL, CHECK `tanggal_selesai >= tanggal_mulai`; `lokasi`; `biaya` INTEGER NOT NULL DEFAULT 0 CHECK ≥ 0 (total satu pelatihan, aturan 13); `keterangan`; `dicatat_oleh` NOT NULL, `created_at`; `diubah_oleh`, `diubah_pada`; `dibatalkan_oleh`, `dibatalkan_pada`, `alasan_batal`. Indeks `tanggal_mulai` |
| `hr_pelatihan_peserta` | `id_peserta` PK (`<id_pelatihan>:<id_karyawan>`, satu karyawan sekali per pelatihan tanpa `UNIQUE`); `id_pelatihan` NOT NULL; `id_karyawan` NOT NULL; `hasil` CHECK (`hasil IS NULL OR hasil IN ('Lulus','Tidak Lulus','Tidak Hadir')`); `id_dokumen` (sertifikat di `hr_dokumen`, boleh kosong); `catatan`; `dicatat_oleh` NOT NULL, `created_at`. Indeks `id_pelatihan`, `id_karyawan`, `id_dokumen` |

- **Tanpa seed** dan tanpa perubahan `SEED_JENIS_DOKUMEN_SQL` (jenis
  `dok-sertifikat` sudah ada; tes yang menghitung 9 jenis tidak berubah).
- **Pengaturan** (`setting_gex_system`, tanpa perubahan skema):
  `hr_pelamar_retensi_bulan` = 12 (1–60), entri baru `BATAS_PENGATURAN` ↔
  kembar (pola `hr_sp_masa_bulan`), sehingga kuncinya tampil di form
  pengaturan Organisasi tanpa layar baru (`hr.org.manage`). Tes
  `pengaturan_kontrak` (Rust) dan "pengaturan kontrak" (TS) ikut bertambah satu
  kunci.
- **Indeks dibuat sesudah tabelnya** (aturan 20); tidak ada kolom hasil
  migrasi di fase ini.
- Kedua jalur: `CURRENT_SCHEMA_VERSION`/`CLIENT_SCHEMA_VERSION` 42, sentinel
  `-2038` + angka `ensure_schema_current`, `REQUIRED_TABLE_COUNT` 102, enam
  tabel ikut `PROMOTION_PLAN` (urutan: `hr_lowongan` → `hr_pelamar` →
  `hr_pelamar_tahap`/`hr_pelamar_berkas`; `hr_pelatihan` →
  `hr_pelatihan_peserta`, yang juga bergantung `master_data` dan `hr_dokumen`),
  `isDatabaseSchemaReady`, `schema-consistency.test.ts` + 6, daftar harapan
  tabel khusus cloud `audit-sync-contract.ts` + 6. **Tidak ada yang dibuang
  saat pindah database** karena tidak ada salinannya di SQLite perangkat;
  `CLOUD_MIRRORED_TABLES` tidak berubah.

### 22.3 Lowongan dan pelamar (data, sumber, CV)

**Lowongan** (`validasi_lowongan` ↔ `validasiLowongan`):

- `judul` 1–100; `jumlah` 1–999; `keterangan` ≤ 2.000. Jabatan, divisi, dan
  cabang opsional tetapi bila diisi harus ada dan aktif di masternya saat
  disimpan. Master tidak pernah dihapus, jadi nama dibaca hidup (`LEFT JOIN`),
  tidak disalin.
- **Status turunan** (`status_lowongan` ↔ `statusLowongan`, tanggal WIB jam
  database): `Ditutup` bila `ditutup_pada` terisi ATAU `tanggal_tutup` < hari
  ini; `Dijadwalkan` bila `tanggal_buka` > hari ini; selain itu `Dibuka`
  (Q-88).
- **Tanggal tutup efektif** (jangkar retensi, `TUTUP_EFEKTIF_SQL` kembar):
  yang lebih awal di antara `date(ditutup_pada, '+7 hours')` dan
  `tanggal_tutup` yang sudah lewat; kosong selama lowongan belum Ditutup.
- **Tutup**: mengisi `ditutup_pada = datetime('now')` sekali. **Buka lagi**:
  mengosongkan `ditutup_pada` dan memundurkan atau mengosongkan
  `tanggal_tutup`; jam retensi ikut mulai dari nol (penanda §22.12).
- Lowongan tidak dihapus. Lowongan salah input cukup ditutup; lowongan tanpa
  pelamar boleh disunting bebas.
- Daftar membawa hitungan per status pelamar, `pelamar_dihapus`, jumlah
  diterima dibanding `jumlah`, dan "data pelamar dihapus pada <tanggal>" bila
  jangkar sudah ada.

**Pelamar** (`validasi_pelamar` ↔ `validasiPelamar`):

- Wajib: lowongan (Q-89), `nama` 2–100, `tanggal_lamaran` (tidak di masa
  depan, tidak sebelum `tanggal_buka`). Opsional: `no_hp` (dinormalkan
  `normalize_operator_phone` / `contact.ts`), `email` (bentuk dasar, ≤ 255),
  `lp`, `tanggal_lahir` (tidak di masa depan), `alamat` ≤ 1.000, `pendidikan`
  (daftar `PENDIDIKAN` yang sudah ada), `catatan` ≤ 2.000.
- **Sumber** (Q-90): teks bebas ≤ 100. Layar memberi saran dari daftar tetap
  (`Jobstreet`, `LinkedIn`, `Glints`, `Instagram`, `Referensi Karyawan`,
  `Datang Langsung`, `Lainnya`) ditambah nilai yang pernah dipakai; tidak ada
  tabel master sumber.
- Menambah pelamar hanya ke lowongan `Dibuka` atau `Ditutup` (lamaran yang
  baru dicatat belakangan); menyimpan pelamar baru sekaligus menulis tahap
  `Lamaran` urutan 1 di batch yang sama.
- **Pelamar kembar** tidak ditolak: nama + no. HP yang sama di lowongan yang
  sama menjadi tanda `mungkin_ganda` di daftar (dua HRD menginput orang yang
  sama).
- Mengubah data pelamar boleh selama belum dijadikan karyawan. Lowongannya
  tidak bisa dipindah (retensi mengikuti lowongan); salah lowongan = hapus dan
  catat ulang.

**CV dan berkas** (`hr_pelamar_berkas`): opsional (Q-16), maksimal 3 per
pelamar, memakai `validasi_berkas` ↔ `validasiBerkas` apa adanya (1 MB, empat
MIME, tanda tangan bita) dan slot urutan kosong terkecil. Daftar tidak pernah
membawa `data_base64`; isi diambil per berkas. Berkas tidak disalin ke
`hr_dokumen` saat pelamar menjadi karyawan (Q-95).

### 22.4 Tahap seleksi (append-only, status turunan, pembatalan)

- **Riwayat append-only**: setiap perpindahan = satu baris `hr_pelamar_tahap`
  ber-`urutan` berikutnya (`COALESCE(MAX(urutan), 0) + 1`, dihitung di
  statement INSERT-nya sendiri). Baris tidak pernah diubah isinya dan tidak
  pernah dihapus, kecuali oleh retensi (§22.6).
- **Status turunan** (`status_pelamar` ↔ `statusPelamar`): `tahap` baris
  ber-`urutan` terbesar yang `dibatalkan_pada`-nya kosong. Pelamar yang semua
  tahapnya dibatalkan tidak mungkin ada: tahap `Lamaran` urutan 1 tidak bisa
  dibatalkan.
- **Urutan tahap** (`periksa_tahap` ↔ `periksaTahap`, Q-91): dari tahap
  proses (`Lamaran`, `Seleksi Berkas`, `Wawancara`, `Tes`, `Penawaran`) boleh
  ke tahap proses mana pun (maju, melompat, atau mengulang, misalnya wawancara
  kedua) dan ke tahap akhir (`Diterima`, `Ditolak`, `Mundur`). Dari tahap
  akhir tidak ada tahap baru. `tanggal` tidak di masa depan dan tidak sebelum
  `tanggal_lamaran`; `catatan` ≤ 1.000, wajib untuk `Ditolak` dan `Mundur`.
- **Batalkan tahap terakhir** (koreksi salah tekan): mengisi
  `dibatalkan_oleh/pada/alasan_batal` pada baris terakhir yang belum
  dibatalkan, alasan wajib, sekali per baris; status kembali ke tahap
  sebelumnya. Ditolak bila baris itu `Lamaran` urutan 1, atau bila pelamar
  sudah dijadikan karyawan (`id_karyawan` terisi).
- **Lowongan Ditutup tidak mengunci tahap**: proses pelamar yang sudah masuk
  boleh diselesaikan. Layar menandai pelamar yang masih di tahap proses pada
  lowongan Ditutup, karena retensi tetap berjalan atas mereka.
- **Kuota**: jumlah `Diterima` melebihi `hr_lowongan.jumlah` tidak ditolak,
  hanya tanda `lewat_kuota` di lowongan.
- Semua penulis memakai transaksi cloud; tidak ada "dua perangkat offline",
  jadi tidak ada sidik, tanda gugur, atau `diterima_cloud` seperti fase 2
  dan 6.

### 22.5 Jadikan karyawan (alur, atomisitas, kontrak pertama, penandaan pelamar)

**Peta atomisitas** (temuan §22.1):

| Bagian | Tempat | Bisa satu transaksi dengan |
| :-- | :-- | :-- |
| Klaim pelamar (`hr_pelamar.id_karyawan`), isian awal `hr_profil` | cloud | sesama tulisan cloud (`execute_atomic` / `db.batch`) |
| `master_data` + `id_card` + organisasi + `hr_kontrak` | Desktop/Mobile: SQLite lokal + outbox | satu transaksi SQLite (setelah `create_employee` dan `catat_kontrak` dipecah menjadi varian `_tx`) |
| Semua di atas | Web: cloud | satu `db.batch` |

Jadi **Web bisa atomik penuh; Desktop tidak bisa**, karena data pelamar di
cloud dan `master_data` wajib lewat SQLite lokal + outbox (aturan 3). Yang
dirancang untuk Desktop adalah dua langkah yang masing-masing atomik, dengan
id deterministik supaya langkah kedua bisa diulang tanpa menggandakan (Q-92).

**Id deterministik** (`id_dari_pelamar` ↔ `idDariPelamar`, vektor uji sama):

- `id_unik` = `createEmployeeIdentifiers(<hex id_pelamar>)` →
  `EMP_<12 karakter pertama>`; `kode_karyawan` usulannya dari fungsi yang sama
  dan BOLEH disunting HRD di form. Padanan Rust ditulis kembar.
- `id_kontrak` = `ktr-<id_pelamar>` (pola `brg-<id_baris>`,
  `cil-<id_pengajuan>`); `hr-contract/create` sudah berhenti di PK.

**Alur**:

1. Syarat: status pelamar `Diterima`, `id_karyawan` kosong. Layar membuka form
   karyawan terisi dari pelamar (nama, no. HP, L/P) dan lowongan (jabatan,
   divisi, cabang); HRD melengkapi shift, tanggal masuk, atasan, dan kontrak
   pertama (jenis, tanggal mulai, tanggal selesai, masa percobaan, nomor).
2. **Semua validasi dijalankan dulu**, tanpa menulis apa pun: validasi
   karyawan yang sudah ada (termasuk `org_dari_draft` dan keunikan
   `kode_karyawan`), `validasi_kontrak`, dan status pelamar.
3. **Klaim di cloud** (satu batch, `KLAIM_PELAMAR_SQL` kembar):
   `UPDATE hr_pelamar SET id_karyawan = ?, dijadikan_oleh = ?, dijadikan_pada
   = datetime('now') WHERE id_pelamar = ? AND id_karyawan IS NULL AND <status
   Diterima>`; lalu isian awal `hr_profil` (`tanggal_lahir`,
   `alamat_domisili`, `pendidikan`) `ON CONFLICT DO NOTHING`, dijaga klaim
   yang sama (Q-94). Bila baris pelamar sudah diklaim dengan `id_karyawan`
   yang sama, langkah ini dianggap sudah selesai (jalur "Lanjutkan").
4. **Tulis karyawan**: Desktop/Mobile satu transaksi SQLite
   (`create_employee_tx` + `catat_kontrak_tx` + dua baris outbox
   `employee/create` dan `hr-contract/create`), lalu `syncNow()`. Web:
   `master_data`, `id_card`, organisasi, `hr_kontrak`, dan
   `JENIS_DARI_KONTRAK_SQL` di `db.batch` yang SAMA dengan langkah 3.
   Token dan QR `id|token` dibuat jalur yang sudah ada (aturan 31), tidak ada
   pembuat token kedua.

**Mencegah dua kali**:

- Dua perangkat menekan bersamaan: keduanya menghasilkan `id_unik` dan
  `id_kontrak` yang sama; klaim hanya dimenangkan satu (`WHERE id_karyawan IS
  NULL`), yang kalah berhenti sebelum menulis lokal dengan pesan "Pelamar ini
  sudah dijadikan karyawan."
- Klaim berhasil tetapi langkah 4 gagal (aplikasi ditutup, galat SQLite):
  pelamar tampil **"Diterima, data karyawan belum lengkap"** (klaim terisi
  tetapi `master_data` belum ada: Desktop memeriksa SQLite lokal, Web
  memeriksa cloud) dengan tombol **Lanjutkan** yang mengulang langkah 4 dengan
  id yang sama. Kontrak berhenti di PK. Handler cloud `employee/create`
  adalah upsert yang MENIMPA `token_absensi` dan `qr_code`, jadi Lanjutkan di
  Desktop hanya terbuka bila `master_data` itu belum ada di SQLite lokal DAN
  belum ada di cloud (dibaca lewat `TursoClient` sesudah `syncNow()`); bila
  sudah ada di salah satunya, layar cukup menarik data, tidak menulis ulang.
  Yang tersisa: dua perangkat menekan Lanjutkan pada saat yang sama sebelum
  salah satunya terdorong, dan token yang terakhir sampai yang berlaku
  (kartu belum dicetak pada saat itu).
- Satu pelamar tidak pernah menghasilkan dua karyawan, karena `id_unik`
  diturunkan dari `id_pelamar`. Orang yang sama melamar dua kali (dua
  `id_pelamar`) tetap bisa menjadi dua karyawan; itu sama dengan menambah
  karyawan dua kali hari ini dan tidak dijaga.

**Penandaan pelamar**: `id_karyawan` terisi = "Sudah menjadi karyawan" dengan
tautan ke rincian karyawan. Sejak itu data pelamar, tahap, dan berkasnya
terkunci (tidak bisa diubah, dibatalkan tahapnya, atau dihapus) dan
**dikecualikan dari retensi selamanya**. Tidak ada "batal jadikan karyawan":
salah orang diselesaikan lewat proses keluar fase 5 atau menonaktifkan
karyawan.

**Yang tidak ikut**: kartu ID (dibuat dari menu Kartu ID seperti biasa), akun
operator, data keuangan `hr_profil`, dan jatah cuti (dihitung dari
`tanggal_daftar` yang diisi di form).

### 22.6 Retensi dan penghapusan (Q-33)

- **Yang dihapus**: pelamar ber-`id_karyawan` KOSONG yang lowongannya punya
  tanggal tutup efektif (§22.3) dan `date(<tutup efektif>, '+N months')` <
  tanggal WIB jam database, N dari `hr_pelamar_retensi_bulan` (kosong atau di
  luar 1–60 = 12). Itu mencakup `Ditolak`, `Mundur`, `Diterima` yang tidak
  pernah dijadikan karyawan, dan pelamar yang prosesnya menggantung. Bersama
  barisnya ikut terhapus seluruh `hr_pelamar_tahap` dan `hr_pelamar_berkas`.
- **Yang tersisa** (Q-96): baris `hr_lowongan` dan satu angka anonim
  `pelamar_dihapus` yang ditambah di batch yang sama. Tidak ada nama, sumber,
  atau tahap yang disimpan; statistik per sumber hilang bersama datanya.
- **Yang tidak pernah terhapus**: pelamar ber-`id_karyawan` (termasuk yang
  klaimnya belum dilanjutkan), beserta tahap dan berkasnya.
- **Satu batch `execute_atomic`** (`HAPUS_PELAMAR_LAMA_SQL`, teks kembar Rust
  ↔ TS, pola `HAPUS_FOTO_LAMA_SQL`): tambah `pelamar_dihapus`, hapus berkas,
  hapus tahap, hapus pelamar, semuanya dengan predikat yang sama dan pelamar
  dihapus terakhir. Dua sesi yang menjalankannya bersamaan: yang kedua tidak
  menemukan apa-apa. Tidak ada jam perangkat (aturan 19).
- **Siapa yang menjalankan** (Q-93): tidak ada server atau penjadwal, jadi
  sesi yang login. Panggilan baru di `AutoFotoCleanupRunner` yang sudah ada
  (tidak menambah runner) ke command `desktop_hr_recruit_cleanup` (cukup
  `require_session`, hanya mengembalikan hitungan, pola
  `desktop_trip_photo_cleanup`) dan aksi Web yang setara. Akibatnya: bila
  tidak ada yang login, tidak ada yang terhapus sampai login berikutnya.
- **Peringatan**: daftar lowongan menampilkan "data pelamar dihapus pada
  <tanggal>" sejak lowongan Ditutup, dan menonjolkannya 30 hari sebelum hari
  itu. Mengubah `hr_pelamar_retensi_bulan` langsung berlaku untuk semua
  lowongan, termasuk yang sudah tutup; memendekkannya bisa menghapus data
  pada siklus berikutnya (dialog pengaturan menyebut ini).
- **Hapus lebih cepat** (`hr.recruit.delete`): satu pelamar, kapan saja,
  dengan mengetik `KONFIRMASI_HAPUS_PERMANEN` (konstanta yang sudah ada).
  Statement yang sama untuk satu `id_pelamar`, tetap menambah
  `pelamar_dihapus`, tetap menolak pelamar ber-`id_karyawan`.
- **Cadangan**: ekspor database dan promosi membawa pelamar yang masih ada
  saat itu. Berkas cadangan lama tidak ikut dibersihkan retensi; itu di luar
  jangkauan aplikasi (penanda §22.12).

### 22.7 Pelatihan, peserta, biaya (INTEGER, tanpa jurnal), sertifikat

- **Pelatihan** (`validasi_pelatihan` ↔ `validasiPelatihan`): `nama` 1–100;
  `penyelenggara` dan `lokasi` ≤ 100; `tanggal_selesai` ≥ `tanggal_mulai`,
  boleh di masa depan (pelatihan terjadwal); `biaya` bilangan bulat
  0–1.000.000.000 (aturan 13), satu angka total per pelatihan (Q-98);
  `keterangan` ≤ 2.000.
- **Status turunan** (`status_pelatihan` ↔ `statusPelatihan`): `Dibatalkan`
  bila `dibatalkan_pada` terisi; `Dijadwalkan` bila `tanggal_mulai` > hari
  ini; `Berlangsung`; `Selesai` bila `tanggal_selesai` < hari ini.
- **Batal**: kolom, alasan wajib, sekali. Tidak ada hapus. Pelatihan yang
  dibatalkan tidak muncul di riwayat karyawan.
- **Peserta**: hanya karyawan `status_aktif = 'Aktif'` saat ditambahkan
  (dibaca dari `master_data` cloud di transaksi yang sama); PK
  `<id_pelatihan>:<id_karyawan>` menahan duplikat. `hasil` opsional dan bisa
  diubah; `catatan` ≤ 1.000. **Melepas peserta** menghapus barisnya (tabel
  khusus cloud, tidak ada yang bisa menghidupkannya kembali), ditolak selama
  `id_dokumen` terisi (hapus sertifikatnya dulu). Riwayat tetap terbaca
  setelah karyawan keluar.
- **Biaya tanpa jurnal** (§11.2): tidak ada sumber jurnal baru, CHECK
  `keu_jurnal.sumber` tidak disentuh, tidak ada "sudah dibayar". Pembukuannya
  jurnal manual. Layar menampilkan biaya per peserta sebagai pembagian
  tampilan saja, tidak disimpan.
- **Sertifikat = `hr_dokumen` berjenis `dok-sertifikat`** (Q-97), tidak ada
  tabel sertifikat. Dari baris peserta, "Tambah sertifikat" memanggil inti
  `simpan_dokumen` dan `tambah_berkas` yang sudah ada dengan `id_jenis`
  dikunci `dok-sertifikat` dan `id_karyawan` peserta, lalu mengisi
  `hr_pelatihan_peserta.id_dokumen`, semuanya satu batch. Isiannya: nomor,
  tanggal terbit, **tanggal kedaluwarsa** (opsional), catatan (bawaan: nama
  pelatihan), berkas opsional (maks 5, 1 MB).
  - Sertifikat itu otomatis tampil di tab Dokumen karyawan, tanpa kode baru.
  - **Kait fase 8**: pengingat "Dokumen kedaluwarsa H-30" (`hr-dok:<id>`)
    membaca `hr_dokumen.tanggal_kedaluwarsa` lewat indeks yang sudah ada,
    jadi sertifikat pelatihan ikut tanpa perubahan di fase 8.
  - `hapus_dokumen` ↔ kembaran TS mendapat satu statement tambahan di batch
    yang sama: `UPDATE hr_pelatihan_peserta SET id_dokumen = NULL WHERE
    id_dokumen = ?`, supaya menghapus dari tab Dokumen tidak meninggalkan
    tautan mati.
  - Jenis `dok-sertifikat` yang dinonaktifkan HRD membuat "Tambah sertifikat"
    ditolak dengan pesan "Aktifkan jenis dokumen Sertifikat di Organisasi."
  - Izin: `hr.training.manage` cukup untuk menulis dokumen yang jenisnya
    `dok-sertifikat` DAN tertaut ke baris peserta; di luar itu tetap
    `hr.document.manage` (penanda §22.12).
- **Riwayat per karyawan**: tab Pelatihan di rincian karyawan (pelatihan
  tidak dibatalkan, hasil, sertifikat dan kedaluwarsanya).

### 22.8 Hak akses

| Izin | Sensitif | Rahasia | Paket bawaan |
| :-- | :-- | :-- | :-- |
| `hr.recruit.view` | | ya | HRD |
| `hr.recruit.manage` | | ya | HRD |
| `hr.recruit.delete` (baru, tidak ada di §10.1) | ya | | HRD |
| `hr.training.view` | | | HRD (dan Admin) |
| `hr.training.manage` | | | HRD (dan Admin) |

- Nama izin mengikuti §10.1 (`hr.recruit.*`), bukan `hr.recruitment.*`.
- Rahasia = `CONFIDENTIAL_PERMISSIONS` dan `NOT IN` seed Admin Rust; sensitif
  = `SENSITIVE_MUTATION_PERMISSIONS` dan `NOT IN`. `hr.recruit.delete` sensitif
  tetapi masuk paket HRD (pola `hr.performance.finalize`), karena Q-33
  menyebut HRD yang menghapus lebih cepat (Q-99).
- **Jadikan karyawan tanpa izin baru** (Q-100): command dan rute mewajibkan
  KETIGA izin `hr.recruit.manage`, `employees.manage`, dan
  `hr.contract.manage` (aturan 44: aksi itu menulis data pelamar, karyawan,
  dan kontrak). Paket HRD sudah memegang ketiganya.
- Membaca lowongan, pelamar, tahap, dan berkas: `hr.recruit.view` atau
  `hr.recruit.manage`. Membaca pelatihan: `hr.training.view` atau
  `hr.training.manage`. Berkas sertifikat dari layar pelatihan mengikuti izin
  pelatihan; dari tab Dokumen tetap `hr.document.view`.
- Paket Atasan tidak berubah (pola fase 5).
- Pembersihan retensi: cukup sesi (aturan tetap, tanpa pilihan pengguna,
  hasilnya hanya hitungan).
- Area: `/hris` tetap area `hris`; tab Rekrutmen dan Pelatihan memeriksa
  izinnya sendiri, backend memeriksa ulang (aturan 10, 36).
- Seed HRD Rust + `DEFAULT_ROLE_PERMISSIONS.hrd` + lima izin;
  `rbac-migration.test.ts` + versi 42.

### 22.9 Command, rute, dan layar

**Rust** (`desktop/hr_rekrutmen.rs` dan `desktop/hr_pelatihan.rs` baru, disalin
ke Mobile lewat daftar salin `sync-rust-modules.ts`; terdaftar di kedua
`lib.rs`, `build.rs`, `capabilities/default.json`; doc comment sebelum
`#[tauri::command]`, aturan 45; semuanya `async` lewat `TursoClient`, dengan
pesan "butuh koneksi ke database" saat `TURSO_NOT_CONFIGURED` atau jaringan
gagal):

| Command | Izin |
| :-- | :-- |
| `desktop_hr_vacancies` (daftar, status, hitungan, tanggal hapus) | `recruit.view` / `manage` |
| `desktop_hr_vacancy_save` (buat, ubah, tutup, buka lagi) | `recruit.manage` |
| `desktop_hr_applicants` (pelamar satu lowongan, atau rincian satu pelamar: tahap + daftar berkas tanpa isi) | `recruit.view` / `manage` |
| `desktop_hr_applicant_save` | `recruit.manage` |
| `desktop_hr_applicant_stage` (catat tahap, batalkan tahap terakhir) | `recruit.manage` |
| `desktop_hr_applicant_file` (isi satu berkas) | `recruit.view` / `manage` |
| `desktop_hr_applicant_file_save` (tambah, hapus) | `recruit.manage` |
| `desktop_hr_applicant_hire` (klaim + karyawan + kontrak, juga jalur Lanjutkan) | `recruit.manage` + `employees.manage` + `hr.contract.manage` |
| `desktop_hr_applicant_delete` | `recruit.delete` |
| `desktop_hr_recruit_cleanup` (retensi) | sesi |
| `desktop_hr_trainings` (daftar, rincian + peserta, atau riwayat satu karyawan) | `training.view` / `manage` |
| `desktop_hr_training_save` (buat, ubah, batal) | `training.manage` |
| `desktop_hr_training_participants_save` (tambah, lepas, hasil) | `training.manage` |
| `desktop_hr_training_certificate_save` (dokumen + berkas, hapus) | `training.manage` |
| `desktop_hr_training_certificate_file` | `training.view` / `manage` |

Command Desktop 286 → 301, Mobile 292 → 307. Perubahan yang ada:
`operational::create_employee` dan `hris::catat_kontrak` dipecah menjadi
varian `_tx` (perilaku command lama tidak berubah), `hris::hapus_dokumen`
(+ satu statement), `BATAS_PENGATURAN` (+ satu kunci). **Tidak ada perubahan
di `sync.rs`, `storage.rs`, `apply_event_to_turso`, maupun
`CANONICAL_SYNC_ROUTES`.**

**Web**: `validations/hr-rekrutmen.ts` + `services/hr-rekrutmen.ts` dan
`validations/hr-pelatihan.ts` + `services/hr-pelatihan.ts` (kembar Rust,
termasuk teks SQL), rute `POST /api/hris/recruitment` dan
`POST /api/hris/training` (Zod `.strict()`, aksi per operasi, tanpa `GET`,
body 25 MB hanya untuk aksi berkas), gateway `gateways/hr-rekrutmen.ts` dan
`gateways/hr-pelatihan.ts`. `services/employee.ts` `tambahKaryawan` dipecah
menjadi penyusun statement supaya bisa masuk `db.batch` jadikan karyawan
(dan sekaligus membuat tambah karyawan biasa atomik).

**Layar** (Web/Desktop saja, Q-43; Mobile tidak mendapat layar apa pun, tetapi
modul dan command tetap terdaftar di biner Mobile seperti fase 5):

1. `/hris` tab **Rekrutmen** (`RekrutmenWorkspace.tsx`): daftar lowongan
   dengan status dan hitungan; rincian lowongan berisi pelamar per status,
   tanda `mungkin_ganda`, `lewat_kuota`, dan tanggal hapus; rincian pelamar
   dengan riwayat tahap, berkas, Catat tahap, Batalkan tahap terakhir, Jadikan
   karyawan / Lanjutkan, Hapus. `konfirmasiData` sebelum simpan lowongan,
   pelamar, tahap, dan jadikan karyawan; hapus memakai ketik konfirmasi.
2. `/hris` tab **Pelatihan** (`PelatihanWorkspace.tsx`): daftar per tahun,
   rincian dengan peserta (pemilih `PilihCari`), hasil, sertifikat.
3. `RincianKaryawan` tab **Pelatihan** (`hr.training.view`).
4. Organisasi `/hris`: `hr_pelamar_retensi_bulan` tampil di form pengaturan
   yang sudah ada.
5. `AutoFotoCleanupRunner`: panggilan pembersihan pelamar.

### 22.10 Tidak dikerjakan di fase ini

- Formulir lamaran publik dan unggah CV oleh pelamar (§15, Q-17).
- Jurnal otomatis biaya pelatihan dan status "biaya sudah dibayar" (§11.2);
  rencana dan anggaran pelatihan (§15, Q-26).
- Menyalin CV pelamar ke Dokumen karyawan (Q-95).
- Gaji yang diharapkan, penilaian wawancara berskor, jadwal wawancara, dan
  pewawancara: cukup catatan tahap.
- Surat penawaran dan surat penolakan (cetak atau email).
- Talent pool lintas lowongan (pelamar tanpa lowongan), memindahkan pelamar
  antar lowongan.
- Statistik rekrutmen per sumber yang bertahan setelah retensi.
- Pelatihan wajib per jabatan, matriks kompetensi, ikatan dinas.
- Kejadian Telegram (lowongan, pelamar, sertifikat kedaluwarsa): fase 8.
- Layar Mobile.
- Membersihkan data pelamar dari berkas cadangan lama.

### 22.11 Langkah

| # | Langkah | Gerbang |
| :-- | :-- | :-- |
| 1 | **Skema v42**: enam tabel khusus cloud di `turso.rs` + `db-schema.ts`/`db-migrations.ts`, indeks sesudah tabelnya; sentinel `-2038` + `ensure_schema_current`, `CURRENT_SCHEMA_VERSION`/`CLIENT_SCHEMA_VERSION` 42 (Desktop DAN Mobile), `REQUIRED_TABLE_COUNT` 102, `isDatabaseSchemaReady`, `schema-consistency.test.ts` + 6, `PROMOTION_PLAN` + 6; daftar sentinel di tes `turso.rs` ikut disesuaikan. `storage.rs`, `sync.rs`, dan `CLOUD_MIRRORED_TABLES` TIDAK disentuh. | `audit:schema` + tes sentinel/provisioning Rust (`sentinel_2037_memicu_skema_rekrutmen`) |
| 2 | **Aturan kembar** `hr_rekrutmen.rs` ↔ `validations/hr-rekrutmen.ts` dan `hr_pelatihan.rs` ↔ `validations/hr-pelatihan.ts`: `validasi_lowongan`, `status_lowongan`, `validasi_pelamar`, `periksa_tahap`, `status_pelamar`, `id_dari_pelamar`, `validasi_pelatihan`, `status_pelatihan`, validasi peserta; `BATAS_PENGATURAN` + `hr_pelamar_retensi_bulan`; teks SQL kembar `TUTUP_EFEKTIF_SQL`, `KLAIM_PELAMAR_SQL`, `HAPUS_PELAMAR_LAMA_SQL` diperiksa harfiah. Vektor uji yang sama. | `bun run sync:mobile` dulu (tes teks SQL membaca salinan Mobile), lalu `bun run test` (per berkas) + `cargo test hr_rekrutmen hr_pelatihan` |
| 3 | **RBAC + pendaftaran command**: `catalog.ts` (5 izin), `CONFIDENTIAL_PERMISSIONS`/`SENSITIVE_MUTATION_PERMISSIONS`, baris izin + `NOT IN` seed Admin Rust, seed HRD Rust + `DEFAULT_ROLE_PERMISSIONS`, `rbac-migration.test.ts` + versi 42; 15 command (kerangka + guard izin) di keempat tempat; daftar harapan `audit-sync-contract.ts` (jumlah command, + 6 tabel khusus cloud; rute dan tabel snapshot tidak berubah; pengetatan, bukan pelonggaran). Ditaruh di sini karena rute Web memakai `PermissionKey` dan gateway memanggil command (pelajaran fase 6). | `audit:contract` + `web-rbac-boundary` |
| 4 | **Transaksi cloud rekrutmen** (Rust): lowongan, pelamar + tahap pertama, tahap dan pembatalannya, berkas, hapus satu pelamar, retensi. | tes `TursoClient::local_file`: tahap sesudah tahap akhir ditolak; batalkan tahap terakhir; retensi menghapus pelamar + tahap + berkas, menambah `pelamar_dihapus`, dan melewati pelamar ber-`id_karyawan`; dijalankan dua kali hasilnya sama |
| 5 | **Jadikan karyawan** (Rust): `create_employee_tx` + `catat_kontrak_tx`, klaim, Lanjutkan; command lama tetap lulus tesnya. | tes alur Rust (`tests_alur::alur_fase7_jadikan_karyawan`: klaim, karyawan + kontrak + dua outbox dalam satu transaksi, QR `id|token`, tekan kedua ditolak, klaim tanpa karyawan lalu Lanjutkan, pelamar terkunci, salah satu izin kurang ditolak) |
| 6 | **Pelatihan** (Rust): pelatihan, peserta, sertifikat lewat inti dokumen, `hapus_dokumen` melepas tautan. | tes `local_file`: peserta ganda berhenti di PK; sertifikat tampil di `hris::dokumen`; hapus dokumen mengosongkan `id_dokumen`; lepas peserta bersertifikat ditolak |
| 7 | **Web**: service, rute `/api/hris/recruitment` dan `/api/hris/training`, gateway; `tambahKaryawan` menjadi penyusun statement. | `services/hr-rekrutmen.test.ts` dan `services/hr-pelatihan.test.ts` (alur sama dengan langkah 4–6, jadikan karyawan satu `db.batch`) + tes karyawan yang sudah ada |
| 8 | **Layar** §22.9, panggilan retensi di `AutoFotoCleanupRunner`, `bun run sync:mobile`, bagian `CLAUDE.md` "HRIS fase 7", angka di dokumen skill, catatan "Sudah dibangun". | typecheck + Biome + `audit:docs`; `bun run check` penuh oleh pemilik |

### 22.12 Penanda yang ditinjau pemilik saat menyetujui

- **Semua khusus cloud**: rekrutmen dan pelatihan tidak bisa dibuka tanpa
  koneksi ke database, di Desktop sekalipun. Imbalannya: tanpa tabel snapshot
  dan tanpa rute baru, dan data pelamar tidak pernah ada di perangkat.
- **Enam tabel, bukan lima** (§12): `hr_pelamar_berkas` ditambahkan untuk CV.
- **Jadikan karyawan di Desktop bukan satu transaksi**: klaim di cloud, lalu
  karyawan + kontrak di SQLite lokal. Celahnya ditutup id deterministik dan
  tombol Lanjutkan, bukan dihilangkan. Web atomik penuh.
- `id_unik` karyawan hasil rekrutmen diturunkan dari id pelamar (bukan acak),
  dan kontrak pertamanya berid `ktr-<id_pelamar>`.
- Tidak ada "batal jadikan karyawan".
- Jadikan karyawan menulis isian awal `hr_profil` (tanggal lahir, alamat
  domisili, pendidikan) tanpa menuntut `hr.personal.manage`.
- **Retensi hanya berjalan saat ada sesi yang login**, dan menghapus juga
  pelamar yang prosesnya belum selesai ketika masanya habis.
- Lowongan dianggap Ditutup otomatis setelah `tanggal_tutup` lewat; lowongan
  tanpa tanggal tutup yang tidak pernah ditutup menyimpan pelamarnya tanpa
  batas. Membuka lagi lowongan mengulang jam retensi.
- Mengubah angka retensi berlaku surut untuk lowongan yang sudah tutup.
- Setelah retensi hanya tersisa jumlah pelamar yang dihapus per lowongan.
- Berkas cadangan lama tetap memuat data pelamar yang sudah dihapus.
- Tahap boleh melompat dan mengulang; tahap tambahan `Mundur`.
- Kuota lowongan dan pelamar kembar hanya tanda, tidak menolak.
- `hr.training.manage` boleh menulis `hr_dokumen` berjenis Sertifikat yang
  tertaut ke peserta, tanpa `hr.document.manage`.
- Melepas peserta menghapus barisnya (satu-satunya hapus baris di pelatihan).
- `hr.recruit.delete` sensitif tetapi ikut paket HRD.
- **Perangkat v41**: tidak ada rute atau tabel snapshot yang tidak dikenalnya,
  jadi tidak ada data yang bisa dirusaknya. Tetapi begitu cloud naik ke v42,
  perangkat v41 berhenti sinkron (`SCHEMA_VERSION_OUTDATED`) sampai
  diperbarui. Jadi semua perangkat tetap wajib diperbarui, kali ini karena
  mekanisme versi, bukan karena isi fase.

### 22.13 Pertanyaan untuk pemilik

| No | Pertanyaan | Usulan | Alasan |
| :-- | :-- | :-- | :-- |
| Q-86 | Lowongan, pelamar, tahap, dan CV: khusus cloud atau tersinkron? | Khusus cloud semuanya | Data pribadi bukan-karyawan (UU PDP, preseden Q-30 dan Q-63). Penghapusan retensi hanya bisa dijamin bila datanya tidak pernah tersalin ke perangkat |
| Q-87 | Pelatihan dan peserta: khusus cloud atau tersinkron (terbaca offline)? | Khusus cloud | Sertifikatnya `hr_dokumen` yang sudah khusus cloud, jadi layar itu tetap butuh koneksi; menyinkronkan menambah dua tabel empat lapis dan dua rute tanpa pemakai offline |
| Q-88 | Lowongan tutup: hanya lewat tombol, atau otomatis setelah `tanggal_tutup`? | Keduanya: Ditutup bila ditekan ATAU tanggal tutup lewat | Tanpa otomatis, lowongan yang lupa ditutup membuat retensi tidak pernah mulai |
| Q-89 | Pelamar wajib tertaut ke satu lowongan? | Ya; pelamar umum dicatat di lowongan "Umum" yang dibuat HRD | Retensi Q-33 dihitung dari tutupnya lowongan; pelamar tanpa lowongan butuh aturan retensi kedua |
| Q-90 | Sumber pelamar: daftar tetap, master yang bisa disunting, atau teks bebas? | Teks bebas dengan saran | Tidak ada laporan yang mengelompokkan sumber di fase ini, dan datanya dihapus retensi; master sumber = tabel dan layar tambahan |
| Q-91 | Urutan tahap ketat atau bebas? Perlu tahap "Mundur"? | Bebas di antara tahap proses (boleh melompat dan mengulang), tahap akhir mengunci; tambah `Mundur` | Tidak semua lowongan memakai Tes; wawancara bisa dua kali; pelamar yang menarik diri bukan "Ditolak" |
| Q-92 | Jadikan karyawan di Desktop: (a) klaim cloud lalu karyawan + kontrak lewat SQLite lokal dan outbox, dengan id deterministik dan tombol Lanjutkan; atau (b) satu batch cloud yang menyisipkan `master_data` langsung? | (a) | (b) atomik penuh, tetapi menulis ulang handler `employee/create` sebagai penulis `master_data` kedua di cloud (token, organisasi, normalisasi) dan melewati outbox (aturan 3). (a) memakai jalur yang sudah teruji; celahnya bisa diulang dengan aman |
| Q-93 | Siapa menjalankan penghapusan retensi? | Runner sesi login yang sudah ada (`AutoFotoCleanupRunner`), SQL berjam database di cloud | Arsitektur 2-tier tidak punya server atau penjadwal; pola foto laporan 90 hari sudah terbukti |
| Q-94 | Jadikan karyawan ikut mengisi awal data pribadi (`tanggal_lahir`, alamat domisili, pendidikan) dari pelamar? | Ya, hanya bila profilnya belum ada | HRD tidak mengetik ulang; satu statement di batch klaim |
| Q-95 | CV pelamar disalin ke Dokumen karyawan saat dijadikan karyawan? | Tidak; CV tetap terbaca dari tab Rekrutmen (pelamar itu tidak pernah terhapus) | Menyalin butuh jenis dokumen baru dan menggandakan berkas sampai 3 MB per orang |
| Q-96 | Setelah retensi, apa yang tersisa? | Lowongan + jumlah pelamar yang dihapus (angka anonim) | Statistik per sumber atau per tahap berarti menyimpan turunan data yang seharusnya hilang, dan belum ada laporan yang memakainya |
| Q-97 | Sertifikat pelatihan: `hr_dokumen` jenis Sertifikat, atau tabel sendiri? | `hr_dokumen` jenis `dok-sertifikat`, ditautkan dari baris peserta | Jenisnya, berkasnya, tab Dokumen, dan indeks kedaluwarsanya sudah ada; pengingat fase 8 (`hr-dok:<id>`) ikut tanpa kode tambahan |
| Q-98 | Biaya pelatihan: satu total per pelatihan atau per peserta? | Satu total per pelatihan; per peserta hanya pembagian tampilan | Sesuai §11.2, dan belum ada jurnal atau ikatan dinas yang butuh angka per orang |
| Q-99 | Izin menghapus pelamar | Izin baru `hr.recruit.delete`, sensitif, masuk paket HRD; `hr.recruit.view`/`manage` rahasia; `hr.training.*` biasa (ikut Admin) | Hapus permanen layak dipisah dari `manage`, tetapi Q-33 menyebut HRD yang melakukannya. Riwayat pelatihan bukan data rahasia |
| Q-100 | Izin "Jadikan karyawan" | Tanpa izin baru: wajib memegang `hr.recruit.manage` + `employees.manage` + `hr.contract.manage` sekaligus | Aksi itu tidak memberi kuasa lebih dari tambah karyawan + catat kontrak yang sudah bisa dilakukan pemegang kedua izin itu (aturan 44) |

### 22.14 Jawaban fase 7 (12 Nov 2026)

Semua jawaban sesuai usulan §22.13, jadi isi §22.2–§22.12 tidak berubah.

| No | Pertanyaan | Jawaban |
| :-- | :-- | :-- |
| Q-86 | Lowongan, pelamar, tahap, dan CV | Khusus cloud semuanya |
| Q-87 | Pelatihan dan peserta | Khusus cloud |
| Q-88 | Lowongan tutup | Keduanya: Ditutup bila ditekan ATAU `tanggal_tutup` lewat |
| Q-89 | Pelamar wajib tertaut lowongan | Ya; pelamar umum dicatat di lowongan "Umum" yang dibuat HRD |
| Q-90 | Sumber pelamar | Teks bebas dengan saran |
| Q-91 | Urutan tahap | Bebas di antara tahap proses (melompat dan mengulang), tahap akhir mengunci; tambah `Mundur` |
| Q-92 | Jadikan karyawan di Desktop | (a): klaim cloud, lalu karyawan + kontrak lewat SQLite lokal dan outbox, id deterministik dan tombol Lanjutkan |
| Q-93 | Penjalan retensi | `AutoFotoCleanupRunner` yang sudah ada, SQL berjam database di cloud |
| Q-94 | Isian awal data pribadi dari pelamar | Ya, hanya bila profilnya belum ada |
| Q-95 | CV disalin ke Dokumen karyawan | Tidak |
| Q-96 | Yang tersisa setelah retensi | Lowongan + jumlah pelamar yang dihapus (angka anonim) |
| Q-97 | Sertifikat pelatihan | `hr_dokumen` jenis `dok-sertifikat`, ditautkan dari baris peserta |
| Q-98 | Biaya pelatihan | Satu total per pelatihan; per peserta hanya pembagian tampilan |
| Q-99 | Izin menghapus pelamar | `hr.recruit.delete` sensitif, paket HRD; `hr.recruit.view`/`manage` rahasia; `hr.training.*` biasa (ikut Admin) |
| Q-100 | Izin Jadikan karyawan | Tanpa izin baru: `hr.recruit.manage` + `employees.manage` + `hr.contract.manage` sekaligus |

### 22.15 Sudah dibangun (12 Nov 2026)

Langkah 1–8 dibangun. Gerbang yang dijalankan: `audit:schema` (102 tabel wajib,
96 tabel dipromosikan), `audit:contract` (90 rute, 68 tabel snapshot, command
Desktop 301 / Mobile 307), dan `audit:docs` lulus; `cargo test --lib` Desktop
436 dan Mobile 440 lulus (termasuk `hr_rekrutmen::tests` dan
`hr_pelatihan::tests` dengan vektor §22.3–§22.7,
`tutup_efektif_sql_sama_dengan_aturan_murni`,
`rekrutmen_cloud_tahap_berkas_dan_retensi`,
`tests_alur::alur_fase7_jadikan_karyawan`,
`pelatihan_cloud_peserta_dan_sertifikat`, dan
`sentinel_2037_memicu_skema_rekrutmen`); runner tes TS kedua workspace
(`bun run test`, 96 dan 87 berkas) lulus, termasuk
`validations/hr-rekrutmen.test.ts` dan `validations/hr-pelatihan.test.ts`
(vektor kembar, teks SQL dan pesan kembar Rust ↔ TS, juga salinan Mobile),
`services/hr-rekrutmen.test.ts` dan `services/hr-pelatihan.test.ts` (alur Web
sama dengan alur Rust), dan `web-rbac-boundary.test.ts` (paket izin bawaan);
typecheck kedua workspace dan Biome berkas yang diubah bersih. `bun run check`
penuh belum dijalankan (pemilik). Layar belum dicoba di aplikasi yang berjalan.

Penyimpangan dan catatan, untuk ditinjau:

- **Alamat pelamar maksimal 255 karakter, bukan 1.000** (§22.3): alamat
  menjadi isian awal `hr_profil.alamat_domisili` (Q-94), dan `validasi_pribadi`
  membatasinya `MAKS_TEKS`. Email memakai validator email operator yang sudah
  ada (maks 120, bukan 255).
- **Tanggal hapus = `date(<tutup efektif>, '+N months', '+1 day')`**, dihapus
  bila ≤ hari ini: sama dengan predikat `<` §22.6, tetapi tanggal yang tampil
  persis hari penghapusannya. Bulan dihitung SQLite, jadi untuk tanggal akhir
  bulan hasilnya bisa beberapa hari berbeda dari `tambah_bulan`; layar
  memakai tanggal dari SQL yang sama.
- **Satu kumpulan SQL untuk retensi dan hapus lebih cepat**
  (`HAPUS_PELAMAR_LAMA_SQL`, `?1` NULL = retensi, `?1` = id). Konfirmasi
  `Hapus Permanen` hanya di layar (pola inventaris); backend dijaga izin
  sensitif.
- **Klaim dan isian profil dua statement, bukan satu batch** (Desktop/Mobile):
  yang kalah klaim hanya bisa dikenali dari `rows_affected` UPDATE-nya, karena
  kedua perangkat menghasilkan `id_karyawan` yang sama. Isian profil idempoten,
  dijaga klaim yang sama, dan diulang pada Lanjutkan. Jalur Lanjutkan dipilih
  backend dari isi klaim, bukan flag.
- **Web memakai `withTransaction`, bukan `db.batch`**: klaim yang kalah (0
  baris) harus menghentikan seluruh tulisan. Tes membuktikan kegagalan di
  tengah tidak meninggalkan klaim.
- **Penjaga izin kedua di `jadikan_karyawan` ↔ `jadikanKaryawan`** selain di
  command dan rute: gerbang sesi Desktop juga menegakkan lisensi, jadi syarat
  "salah satu izin kurang ditolak" diuji di fungsi itu.
- **Aturan sunting tambahan**: lowongan Ditutup tidak bisa disunting sebelum
  dibuka lagi; tanggal buka tidak sesudah lamaran pertama; tanggal tutup baru
  saat Buka lagi harus hari ini atau sesudahnya; tanggal lamaran tidak sesudah
  tahap yang sudah dicatat (baris tahap `Lamaran` tetap, append-only); master
  organisasi yang tidak diubah boleh tetap nonaktif. `menggantung` hanya
  menghitung pelamar tanpa `id_karyawan`.
- **Sertifikat tidak memanggil fungsi `simpan_dokumen`/`tambah_berkas`**,
  karena keduanya menjalankan `query_one` sendiri; yang dipakai bersama SQL-nya
  (`SIMPAN_DOKUMEN_SQL`, `INSERT_BERKAS_DOKUMEN_SQL`, kini satu baris dan kembar
  dengan `validations/hris.ts`), `validasi_dokumen`, dan `validasi_berkas`.
  Tambahan: aksi `hapus_berkas`, batas 500 peserta sekali tambah, dan bendera
  `sertifikat_aktif` di rincian.
- **Batas body rute**: rekrutmen 1,6 MB (satu berkas per aksi), pelatihan 8 MB
  (sertifikat sampai 5 berkas); body dibaca sebelum aksinya diketahui.
- **Urutan langkah**: daftar tabel khusus cloud `audit-sync-contract.ts` dan
  versi 42 `rbac-migration.test.ts` dikerjakan di langkah 1 (keduanya langsung
  gagal begitu DDL v42 ada). Skrip audit tidak menyimpan angka command, jadi
  tidak ada daftar command yang diperketat.
- **`create_employee` ↔ `tambahKaryawan`**: `create_employee_tx` dan
  `periksa_draft_karyawan` diekstrak tanpa mengubah urutan tulisan; Web
  `susunTambahKaryawan` membuat `tambahKaryawan` satu `db.batch`. Belum ada tes
  layanan karyawan Web sebelumnya; tes baru "tambah karyawan biasa tetap jalan
  sebagai satu batch" menutupnya. `catat_kontrak_tx` menerima id dari
  pemanggil; command lama tetap membuat `ktr-<hex>`.
- **Helper yang dibuka**: `hr_keluar::{Baris, teks_baris, angka_baris,
  hari_ini_cloud}` menjadi `pub(super)` supaya dipakai ulang. `bacaBase64` dan
  pembuka berkas pindah dari `RincianKaryawan.tsx` ke
  `components/hris/berkas.ts`.
- **Konstanta khusus tes**: `tutup_efektif`, `TUTUP_EFEKTIF_SQL`, dan
  `RETENSI_BULAN_SQL` Rust hanya `#[cfg(test)]` (yang berlaku di cloud adalah
  makronya); `SARAN_SUMBER`, `TANGGAL_HAPUS_SQL`, dan `STATUS_PELAMAR_SQL` hanya
  di TS. `#![allow(dead_code)]` sementara sudah dilepas.
- **Belum dikerjakan**: tabrakan PK dua sesi yang mencatat tahap bersamaan
  tidak diuji (transport `local_file` serial); mekanismenya ada dan galat
  `UNIQUE` diterjemahkan. Pengingat sertifikat kedaluwarsa tetap fase 8.

## 23. Urutan pengerjaan fase 8

**Disetujui pemilik (12 Nov 2026).** Ditulis setelah menelusuri kode
(12 Nov 2026); jawaban Q-101 sampai Q-112 di §23.11, semuanya sesuai usulan.
Bila §11.3 dan bagian ini berbeda, **bagian ini yang berlaku** (terutama:
semua kejadian HR dicatat sekali sehari mulai 07.00 WIB, ulang tahun kerja
menjadi ringkasan harian, id pengingat dokumen
memuat tanggal kedaluwarsanya, dan baris antrean HR "diparkir" supaya perangkat
lama tidak bisa membatalkannya).

### 23.1 Temuan dari kode

- **Pengirim selalu membaca CLOUD, tidak pernah SQLite perangkat.**
  `telegram::drain` (`desktop/telegram.rs`) menerima `&TursoClient`;
  `desktop_drain_telegram` (`commands.rs`) hanya memeriksa sesi lalu
  `state.get_turso_client()`. Kembarannya `drainTelegram`
  (`services/telegram.ts`) dipanggil `POST /api/telegram/drain`
  (`requireWebSession`). Jadi kekhawatiran "data khusus cloud tetapi pengirim
  membaca lokal" **tidak terjadi**: `hr_dokumen` dan `hr_sp` (khusus cloud)
  maupun `hr_kontrak`, `hr_pengajuan`, `hr_pengajuan_keputusan`, `master_data`
  (tersinkron, salinannya ada di cloud) terbaca oleh pengirim yang sama di
  Desktop, Mobile, dan Web. Pada mode database lokal `TursoClient` menunjuk hub.
  Akibat yang perlu diketahui: mutasi yang masih mengantre di outbox belum
  terlihat pengirim sampai terdorong.
- **Siapa yang menjalankan**: `AutoTelegramRunner` (`AppShell` Web/Desktop dan
  `MobileAppShell`), 20 detik setelah login lalu tiap 60 detik, untuk SETIAP
  sesi. Tidak ada server atau penjadwal; bila tidak ada yang login, tidak ada
  yang dikirim sampai login berikutnya.
- **Satu siklus** (`drain`): `ensure_schema_current` → `baca_pengaturan`
  (berhenti bila `aktif` ≠ 1 atau token kosong) → hapus baris bukan `Menunggu`
  berumur > 30 hari → `catat_kejadian` (di dalamnya `catat_armada`,
  `catat_buka_buku`, `catat_harian`) → ambil `TELEGRAM_BATCH` (20) baris
  `Menunggu` yang klaimnya kosong atau kedaluwarsa → klaim atomik
  (`klaim_oleh`, `klaim_sampai = +5 menit`) → kirim → `Terkirim`, atau
  `status_setelah_gagal` ↔ `statusSetelahGagal` (3 kali lalu `Gagal`).
- **Pola menambah kejadian** (dipakai fase 3 driver tanpa perubahan skema):
  entri di `KEJADIAN`/`TELEGRAM_KEJADIAN`, `bidang_kejadian`/`BIDANG_KEJADIAN`,
  `LABEL_KEJADIAN`; satu SQL sumber ber-`NOT EXISTS` atas
  `notifikasi_telegram.id_notifikasi`; fungsi pesan kembar; cabang di
  `catat_kejadian`. Bidang baru = entri `BIDANG`/`TELEGRAM_BIDANG` +
  `label_bidang`/`LABEL_BIDANG`. Pengaturannya hanya baris baru
  `grup:<bidang>` dan `kirim:<kejadian>` di `app_telegram_setting`
  (key/value); `notifikasi_telegram.kejadian` sengaja tanpa CHECK.
  `NotifikasiTelegramCard.tsx` merender `TELEGRAM_BIDANG` dan
  `TELEGRAM_KEJADIAN` dengan `.map`, jadi bidang dan sakelar baru tampil tanpa
  perubahan layar.
- **`aktif_sejak` dan batas 7 hari** ada di setiap SQL sumber berbasis
  peristiwa (`created_at >= ? AND created_at >= datetime('now', '-7 days')`).
  Ringkasan harian (`stok_menipis`) tidak memakainya: `catat_harian` membaca
  `SQL_JAM_WIB`, menunggu `JAM_RINGKASAN_STOK` (7), lalu memeriksa
  `belum_tercatat` atas `stok:<tanggal WIB>`. Semua kejadian §11.3 berbasis
  TANGGAL (H-30, H-7, hari H, harian), bukan peristiwa, jadi polanya
  `catat_harian`, bukan `catat_kejadian`.
- **Tes kembar**: `validations/telegram.test.ts` memeriksa teks SQL perjalanan
  harfiah terhadap `telegram.rs` (Desktop dan salinan Mobile) dan vektor pesan
  yang sama; `services/telegram.test.ts` "kejadian armada" ↔
  `catat_armada_dari_data_cloud` (Rust, `TursoClient::local_file`).
  `telegram.rs` ada di daftar salin `sync-rust-modules.ts`.
- **Siapa yang mengatur**: `require_telegram_admin` (`settings.manage` DAN
  `is_superadmin`) untuk empat command konfigurasi; Web
  `requireWebPermission(request, "settings.manage", true)`. Tab Pengaturan
  "Notifikasi" hanya tampil untuk `isSuperadmin` (`settings/page.tsx`).
  `baca_draft` menuntut objek `grup` dan `kirim` berkunci PERSIS daftar build
  itu (`objek_persis`), lalu menulis per kunci; build lama yang menyimpan
  konfigurasi tidak menyentuh kunci baru yang tidak dikenalnya.
- **Perangkat lama membatalkan kejadian yang tidak dikenalnya**, dan tidak ada
  gerbang yang menghentikannya: di `drain`, `bidang_kejadian(kejadian)` =
  `None` membuat baris `Menunggu` diubah menjadi `Dibatalkan`. Baris yang
  sudah dibatalkan tetap memegang id-nya, jadi `NOT EXISTS` mencegah kejadian
  itu dicatat ulang: pesannya hilang diam-diam. `drain` hanya memanggil
  `ensure_schema_current` (memeriksa sentinel, dan sentinel lama tetap ada di
  cloud); pemeriksaan `CLIENT_SCHEMA_VERSION` (`is_client_schema_outdated`,
  `sync.rs`) hanya ada di jalur sinkronisasi. Jadi **menaikkan versi skema pun
  tidak menghentikan pengirim perangkat lama**. Yang bisa dimanfaatkan: SELECT
  dan pembatalan di build lama sama-sama bersyarat
  `klaim_sampai IS NULL OR klaim_sampai < datetime('now')`, sehingga baris
  yang klaimnya masih berlaku tidak disentuhnya (§23.2).
- **Sumber data setiap kejadian §11.3**:

  | Kejadian | Tabel | Letak | Terbaca pengirim Desktop/Mobile | Web membaca dari |
  | :-- | :-- | :-- | :-- | :-- |
  | PKWT berakhir, percobaan berakhir | `hr_kontrak` (`jenis`, `tanggal_selesai`, `percobaan_selesai`; pembatalan = baris `batal-<id>`) + `master_data` | tersinkron | ya, salinan cloud | cloud |
  | Dokumen kedaluwarsa (termasuk sertifikat pelatihan fase 7, Q-97) | `hr_dokumen.tanggal_kedaluwarsa` + `hr_dokumen_jenis.nama` | khusus cloud | ya | cloud |
  | SP berakhir | `hr_sp` (`berlaku_sampai` beku per SP, `dicabut_pada`) | khusus cloud | ya | cloud |
  | Pengajuan menunggu, urgent belum diketahui | `hr_pengajuan` (`sidik`, `created_at` = jam cloud) + `hr_pengajuan_keputusan` | tersinkron | ya, salinan cloud | cloud |
  | Ulang tahun kerja | `master_data.tanggal_daftar` (= Tanggal Masuk, Q-41) | tersinkron | ya, salinan cloud | cloud |

- **Yang sudah ada dan dipakai ulang**: status kerja dan tanda kontrak
  (`status_kerja`, `tanda_kontrak`, `kontrak_aktif` ↔ kembaran TS di
  `validations/hris.ts`), predikat kontrak tidak dibatalkan di
  `JENIS_DARI_KONTRAK_SQL`, `status_sp` ↔ `statusSp` (`Berlaku` sampai DENGAN
  `berlaku_sampai`), `status_pengajuan` + tanda `perlu_diketahui`
  (`tanda_keputusan`), predikat keputusan final di `PENGAJUAN_BERLAKU_SQL`,
  tanggal hapus pelamar (`tanggal_hapus_sql!` ↔ `TANGGAL_HAPUS_SQL`), dan
  `idx_hr_dokumen_kedaluwarsa`. `hr_dokumen.tanggal_kedaluwarsa` hari ini
  belum dibaca kueri mana pun.
- **Bentuk `tanggal_daftar` tidak terbukti divalidasi di semua jalur lama**
  (kolom teks sejak sebelum HRIS), jadi SQL ulang tahun kerja wajib menyaring
  `date(tanggal_daftar) IS NOT NULL`, bukan menganggapnya `YYYY-MM-DD`.
- **Belum ada kartu "Perlu perhatian" di HRIS.** `HrisWorkspace.tsx` (tab
  Karyawan, Struktur, Kinerja, Keluar, Rekrutmen, Pelatihan, Organisasi) hanya
  menampilkan tanda kontrak per karyawan di daftar (`LABEL_TANDA_HRIS`). Pola
  serupa yang ada: tab "Perlu ditinjau" `/perjalanan` dan `/pengajuan`, bagian
  "Perlu ditinjau" Cicilan, dan peringatan foto 7 hari driver. Izin baca hari
  ini: kontrak `employees.view` (`desktop_hr_contracts`), dokumen
  `hr.document.view`, SP `hr.warning.view`, pengajuan `hr.request.view` atau
  `reimburse.decide` (yang terakhir hanya klaim Reimburse, `hanya_reimburse`),
  rekrutmen `hr.recruit.view`/`manage`. Rute baca Web: `POST /api/hris/query`
  (enum `aksi`, izin per aksi).
- Skema sekarang: v42, sentinel `-2038`, `REQUIRED_TABLE_COUNT` 102, 68 tabel
  snapshot, 90 rute, command Desktop 301 / Mobile 307, 13 kejadian, 4 bidang.

### 23.2 Model data: tanpa perubahan skema

**Versi skema tetap 42, sentinel tetap `-2038`, `REQUIRED_TABLE_COUNT` tetap
102, 68 tabel snapshot, 90 rute.** Tidak ada tabel, kolom, indeks, rute outbox,
atau izin baru. `storage.rs`, `sync.rs`, DDL `turso.rs`, `db-schema.ts`,
`db-migrations.ts`, `PROMOTION_PLAN`, dan skrip audit tidak disentuh.
Alasannya: pola fase 3 driver berlaku persis.

- **Bidang `hrd`** dan **tujuh kejadian `hr_*`** hanya baris baru di
  `app_telegram_setting` (`grup:hrd`, `kirim:hr_*`), ditulis saat Superadmin
  menyimpan kartu Notifikasi. Sakelar baru lahir mati (baris belum ada =
  `kirim` salah).
- **Tidak ada pengaturan baru di `setting_gex_system`**: H-30, H-7, 2 hari,
  dan jam 07.00 konstanta kembar di kode (Q-106).
- **Parkir klaim** (Q-101), satu-satunya perubahan pada cara antrean dipakai,
  tanpa mengubah tabelnya: baris kejadian HR dimasukkan dengan
  `klaim_oleh = 'gen:2'` dan `klaim_sampai = '9999-12-31 23:59:59'`
  (`INSERT_ANTREAN_PARKIR_SQL`, kembar). Build lama tidak pernah memilih atau
  membatalkan baris yang klaimnya masih berlaku. Build fase 8 menambah
  `OR klaim_oleh = 'gen:2'` pada SELECT, klaim, dan pembatalan di `drain` ↔
  `drainTelegram`; kegagalan kirim yang masih boleh dicoba ulang
  mengembalikan baris ke keadaan parkir, bukan ke klaim kosong. Tiga belas
  kejadian lama tidak diparkir dan perilakunya tidak berubah. Kejadian baru
  sesudah fase ini memakai `gen:3` dan seterusnya, yang tidak dikenali build
  fase 8.
  - Celah yang tersisa: build fase 8 mati di antara klaim dan hasil kirim.
    Klaim 5 menitnya kedaluwarsa dan baris itu terlihat build lama, yang
    membatalkannya. Butuh dua hal sekaligus (aplikasi mati tepat saat
    mengirim, dan masih ada perangkat lama yang login); kartu "Perlu
    perhatian" tetap menampilkan hal yang sama.

### 23.3 Kejadian

Semua ke bidang `hrd`. Semua dicatat di `catat_harian` ↔ `catatHarian` setelah
07.00 WIB jam database (`JAM_RINGKASAN_STOK` yang ada), supaya pengingat tidak
terkirim tengah malam; tiap siklus sesudahnya hanya memeriksa `NOT EXISTS`.
"Hari ini" selalu `date('now', '+7 hours')` di SQL (aturan 19). Karyawan =
`master_data.status_aktif = 'Aktif'`; yang sudah keluar atau nonaktif tidak
diingatkan. Jabatan = `COALESCE(hr_jabatan.nama, master_data.jabatan_status)`.

| Kejadian (`kirim:`) | Kapan dicatat | Id deterministik | SQL sumber (cloud) |
| :-- | :-- | :-- | :-- |
| `hr_kontrak_akhir` | sisa hari 8–30 (`:30`) dan 0–7 (`:7`) sebelum `tanggal_selesai` | `hr-kontrak:<id_kontrak>:30`, `hr-kontrak:<id_kontrak>:7` | `hr_kontrak` berjenis `PKWT`, tidak punya `batal-<id>`, dan tidak ada kontrak tidak dibatalkan lain milik karyawan itu yang `tanggal_mulai`-nya lebih baru (sudah diperpanjang = tidak diingatkan) |
| `hr_percobaan_akhir` | sisa hari 0–7 sebelum `percobaan_selesai` | `hr-coba:<id_kontrak>` | `hr_kontrak` tidak dibatalkan, kontrak terakhir karyawannya, `percobaan_selesai` terisi |
| `hr_dokumen_kedaluwarsa` | sisa hari 0–30 sebelum `tanggal_kedaluwarsa` | `hr-dok:<id_dokumen>:<tanggal_kedaluwarsa>` (Q-104) | `hr_dokumen` + `hr_dokumen_jenis`; sertifikat pelatihan ikut karena jenisnya `dok-sertifikat` |
| `hr_sp_berakhir` | `berlaku_sampai` = hari ini sampai 6 hari lalu, dan ≥ tanggal WIB `aktif_sejak` | `hr-sp:<id_sp>` | `hr_sp` dengan `dicabut_pada IS NULL` |
| `hr_pengajuan_menunggu` | harian, bila ada | `hr-tunggu:<tanggal WIB>` | `hr_pengajuan` tanpa `Batal` dan tanpa keputusan final bersidik sekarang, `created_at <= datetime('now', '-2 days')` (jam cloud), dihitung per `kelompok` |
| `hr_urgent_belum_diketahui` | harian, bila ada | `hr-urgent:<tanggal WIB>` | pengajuan yang keputusan berlakunya `Setujui Urgent`, tanpa `Batal`, tanpa `Diketahui` (tanda `perlu_diketahui`) |
| `hr_ulang_tahun_kerja` | harian, bila ada | `hr-ultah:<tanggal WIB>` (Q-103) | `master_data` Aktif dengan bulan-hari `tanggal_daftar` = hari ini dan tahun lebih kecil; 29 Feb jatuh di 28 Feb pada tahun bukan kabisat (sama dengan `tambah_bulan`) |

- **Jendela, bukan satu hari**: karena pengirim hanya berjalan saat ada sesi,
  pengingat dicatat pada login pertama di dalam jendelanya. H-30 berhenti
  berlaku begitu sisa ≤ 7, jadi kontrak yang baru terlihat 5 hari sebelum
  berakhir hanya menghasilkan satu pesan (`:7`), bukan dua.
- **`aktif_sejak`**: pengingat yang melihat ke depan (kontrak, percobaan,
  dokumen) tidak disaring `aktif_sejak`; kejadian hari H (SP) disaring.
  Batas 7 hari menjadi lebar jendela hari H. Akibatnya saat `hrd` pertama kali
  dinyalakan, semua yang sedang di dalam jendela terkirim hari itu (penanda).
- Setiap SQL per butir ber-`LIMIT 50` per siklus seperti yang ada; sisanya
  tercatat di siklus berikutnya, dan antrean mengirim 20 pesan per menit.
- Teks SQL kembar Rust ↔ TS diperiksa harfiah (perluasan tes "SQL perjalanan
  disalin harfiah" di `telegram.test.ts`).

**Isi pesan** (fungsi kembar `pesan_hr_*` ↔ `pesanHr*`, vektor uji sama; teks
polos seperti pesan lain):

| Kejadian | Isi |
| :-- | :-- |
| `hr_kontrak_akhir` | "Kontrak PKWT berakhir <sisa> hari lagi (<tanggal>)", nama, jabatan. Sisa 0 = "hari ini" |
| `hr_percobaan_akhir` | "Masa percobaan berakhir <sisa> hari lagi (<tanggal>)", nama, jabatan |
| `hr_dokumen_kedaluwarsa` | "Dokumen <nama jenis> kedaluwarsa <sisa> hari lagi (<tanggal>)", nama, jabatan (Q-105) |
| `hr_sp_berakhir` | "Masa berlaku <SP1/SP2/SP3> berakhir <tanggal>", nama, jabatan (Q-105) |
| `hr_pengajuan_menunggu` | "<n> pengajuan menunggu lebih dari 2 hari", lalu hitungan per kelompok (Cuti 3, Izin 1, Reimburse 2, …) dan "Paling lama sejak <tanggal>" |
| `hr_urgent_belum_diketahui` | "<n> pengajuan urgent belum diketahui HRD", "Paling lama sejak <tanggal>" |
| `hr_ulang_tahun_kerja` | "Ulang tahun kerja hari ini", lalu sampai 30 baris "nama (jabatan), <n> tahun" dan "dan <k> lainnya" (pola `MAKS_BARIS_STOK`) |

**Yang TIDAK pernah dikirim** (Q-32, ditegakkan dengan tidak membaca kolomnya
di SQL sumber, pola `gaji_status` yang tidak membaca `payroll_items`): NIK dan
isi `hr_profil` apa pun; gaji, nominal klaim, nominal pesangon; `alasan`
pengajuan (termasuk alasan sakit) dan lampirannya; `pelanggaran`, `harapan`,
dan `alasan_tingkat` SP; nomor dan berkas dokumen; nomor kontrak; data
pelamar. Dua ringkasan pengajuan tidak memuat nama sama sekali, supaya
"<nama>: Sakit" tidak terbaca di grup.

**Kandidat yang ditunda fase 7** (§22.10):

| Kandidat | Putusan | Alasan |
| :-- | :-- | :-- |
| Sertifikat kedaluwarsa | **Masuk**, tanpa kode khusus | Sertifikat = `hr_dokumen` (Q-97), ikut `hr_dokumen_kedaluwarsa` |
| Lowongan dibuka/ditutup, pelamar baru, tahap pelamar | **Tidak masuk** | Rekrutmen HRD-input saja (Q-17): memberi tahu grup HRD tentang hal yang baru diketik HRD sendiri. Data pelamar sengaja khusus cloud dan diretensi (Q-33, Q-86); menyalin namanya ke riwayat grup Telegram mengalahkan retensi itu |
| Data pelamar akan dihapus retensi | **Hanya kartu "Perlu perhatian"** (hitungan per lowongan, tanpa nama), tidak ke Telegram (Q-111) | Daftar lowongan sudah menonjolkannya 30 hari sebelumnya; cukup satu tempat lagi yang selalu terlihat |

Catatan tunda fase 4 (§19.7) dan fase 5 (§20.9) terjawab oleh
`hr_pengajuan_menunggu` (klaim ikut dihitung sebagai kelompok Reimburse,
Q-107) dan `hr_sp_berakhir`. Catatan tunda fase 6 (§21.10, penilaian kinerja)
tidak masuk (§23.7).

### 23.4 Kartu "Perlu perhatian"

Selalu ada, tidak bergantung pada Telegram. Tempatnya di atas daftar pada tab
Karyawan `/hris` (tab bawaan = beranda HRIS), komponen baru
`components/hris/PerluPerhatian.tsx`. Web/Desktop saja (Mobile tidak punya
`/hris`, Q-43). Tiap bagian hanya dikirim backend bila sesi memegang izinnya;
bagian tanpa isi tidak dirender, dan kartu menulis "Tidak ada yang perlu
perhatian" bila semua bagian yang boleh dilihat kosong.

| Bagian | Isi | Izin (sama dengan izin baca datanya hari ini) |
| :-- | :-- | :-- |
| Kontrak | PKWT berakhir ≤ 30 hari dan masa percobaan berakhir ≤ 7 hari: nama, jabatan, tanggal, sisa hari | `employees.view` |
| Dokumen | kedaluwarsa ≤ 30 hari ATAU sudah lewat: nama, jenis dokumen, tanggal | `hr.document.view` |
| Surat peringatan | SP yang berakhir ≤ 7 hari: nama, tingkat, tanggal | `hr.warning.view` |
| Pengajuan | hitungan menunggu > 2 hari per kelompok dan urgent belum diketahui, tautan ke `/pengajuan` | `hr.request.view`; pemegang `reimburse.decide` saja hanya melihat hitungan Reimburse |
| Ulang tahun kerja | hari ini dan 7 hari ke depan: nama, tanggal, tahun ke- | `employees.view` |
| Rekrutmen | lowongan yang data pelamarnya dihapus ≤ 30 hari: judul lowongan, jumlah pelamar, tanggal hapus | `hr.recruit.view` atau `hr.recruit.manage` |

- **Sumber data: cloud, satu bacaan** (Q-102). Command baru
  `desktop_hr_attention` (`async`, `TursoClient`, pola command khusus cloud
  fase 5–7) ↔ aksi baru `perhatian` di `POST /api/hris/query`. Dokumen, SP,
  dan rekrutmen memang hanya ada di cloud, dan dengan satu sumber kartu dan
  Telegram memakai predikat SQL yang SAMA (konstanta kembar di
  `validations/telegram.ts` dipakai dua-duanya), jadi keduanya tidak bisa
  berbeda pendapat. Tanpa koneksi kartu menulis "Butuh koneksi ke database"
  dan sisa halaman tetap jalan dari SQLite lokal.
- Kartu lebih lebar dari Telegram (dokumen yang sudah lewat, ulang tahun 7
  hari ke depan, rekrutmen) karena kartu bukan pesan sekali kirim.
- Klik nama membuka rincian karyawan pada tab yang sesuai (Kontrak, Dokumen,
  SP), memakai pemilih karyawan yang sudah ada di `HrisWorkspace`.
- Dimuat saat tab dibuka dan pada tombol Muat Ulang; tidak ada polling.

### 23.5 Hak akses

- **Tidak ada izin baru.** `catalog.ts`, seed role Rust,
  `CONFIDENTIAL_PERMISSIONS`, `SENSITIVE_MUTATION_PERMISSIONS`, dan
  `rbac-migration.test.ts` tidak berubah.
- Konfigurasi bidang `hrd` dan sakelar `hr_*`: tetap hanya Superadmin
  (`require_telegram_admin`), di kartu Notifikasi yang ada.
- Pengirim: tetap cukup sesi (`desktop_drain_telegram`), hasilnya hanya
  hitungan.
- `desktop_hr_attention`: `require_any_permission` atas `employees.view`,
  `hr.document.view`, `hr.warning.view`, `hr.request.view`,
  `reimburse.decide`, `hr.recruit.view`, `hr.recruit.manage`; setiap bagian
  disaring lagi per izin di backend (aturan 10, 44), bukan di layar. Web sama
  lewat `requireAnyWebPermission`.
- **Grup Telegram adalah pembaca tanpa RBAC** (Q-23, Q-42, Q-69, Q-84): siapa
  pun anggota grup `hrd` membaca nama + jabatan + jenis dokumen + tingkat SP.
  Itu sebabnya isi pesan dibatasi §23.3 dan sakelar per kejadian lahir mati.

### 23.6 Command, rute, dan layar

**Rust** (`desktop/telegram.rs`, sudah di daftar salin Mobile): `BIDANG` 4 → 5,
`KEJADIAN` 13 → 20, `bidang_kejadian`, `label_bidang`; tujuh SQL sumber, tujuh
fungsi `pesan_hr_*`, cabang HR di `catat_harian`; `INSERT_ANTREAN_PARKIR_SQL`
dan tiga predikat `drain`. Bacaan kartu `perhatian` di modul yang sama (SQL-nya
milik modul itu), dipanggil satu command baru:

| Command | Izin |
| :-- | :-- |
| `desktop_hr_attention` (kartu "Perlu perhatian", bagian menurut izin) | salah satu izin §23.5 |

Command Desktop 301 → 302, Mobile 307 → 308 (terdaftar di kedua `lib.rs`,
`build.rs`, `capabilities/default.json`; doc comment sebelum
`#[tauri::command]`, aturan 45). Empat command konfigurasi dan
`desktop_drain_telegram` tidak berubah tanda tangannya.

**Web**: `validations/telegram.ts` (kembar di atas), `services/telegram.ts`
(`catatHarian`, `drainTelegram`, bacaan `perhatian`), aksi `perhatian` di
`POST /api/hris/query` (Zod `.strict()`, tanpa `GET`), gateway
`gateways/hris.ts` (cabang `isDesktopRuntime()`). Rute `/api/telegram/drain`
dan `/api/settings/telegram*` tidak berubah.

**Layar**:

1. Pengaturan → Notifikasi (`NotifikasiTelegramCard.tsx`): grup HRD dan tujuh
   sakelar muncul dari daftar; ditambah satu kalimat peringatan di kelompok
   HRD tentang siapa yang membaca grup itu.
2. `/hris` tab Karyawan: `PerluPerhatian.tsx`.
3. Mobile: tidak ada layar; `AutoTelegramRunner` di `MobileAppShell` ikut
   mengirim kejadian HR seperti kejadian lain.

### 23.7 Tidak dikerjakan di fase ini

- Pengaturan angka pengingat per perusahaan (H-30, H-7, 2 hari, jam 07.00).
- Pengingat `pkwt_lewat`, `percobaan_lewat`, `harian_perlu_pkwtt`: sudah tampil
  sebagai tanda di daftar karyawan; tidak dijadikan kejadian.
- Kejadian rekrutmen dan pelatihan selain sertifikat kedaluwarsa (§23.3).
- Kejadian penilaian kinerja (menunggu Final, periode berakhir) dan bagian
  Kinerja di kartu.
- Kejadian per pengajuan (pengajuan baru, diputus) dan per klaim: hanya
  ringkasan harian.
- Ulang tahun (tanggal lahir): `hr_profil` data pribadi, tidak pernah dikirim.
- Kartu "Perlu perhatian" di Mobile dan di beranda aplikasi (`/`).
- Pesan pribadi ke karyawan atau atasan, perintah dari Telegram, tombol di
  pesan: bot tetap satu arah.
- Mengirim ulang pesan `Gagal` atau `Dibatalkan` dari layar.
- Gerbang versi di `drain` untuk build mendatang (parkir klaim sudah
  menutupnya per generasi).

### 23.8 Langkah

| # | Langkah | Gerbang |
| :-- | :-- | :-- |
| 1 | **Aturan kembar** `telegram.rs` ↔ `validations/telegram.ts`: bidang `hrd`, tujuh kejadian, `bidang_kejadian`, label, id deterministik, tujuh SQL sumber, tujuh fungsi pesan, konstanta jendela (30, 7, 2 hari), `INSERT_ANTREAN_PARKIR_SQL`. Belum ada yang memanggilnya. | `bun run sync:mobile` dulu (tes teks SQL membaca salinan Mobile), lalu `bun test src/lib/validations/telegram.test.ts` (vektor pesan, SQL harfiah Rust ↔ TS) + `cargo test telegram` |
| 2 | **Pengirim Rust**: cabang HR di `catat_harian`, parkir klaim di `drain` (SELECT, klaim, batal, parkir ulang saat gagal). | tes `TursoClient::local_file` `catat_hrd_dari_data_cloud`: setiap kejadian dari data yang sama; dijalankan dua kali tidak menggandakan; kontrak yang sudah diperpanjang atau dibatalkan, karyawan nonaktif, SP dicabut tidak dicatat; sebelum 07.00 tidak ada yang dicatat. Tes `baris_parkir_tidak_disentuh_predikat_lama`: SELECT dan UPDATE batal build lama (teks v33 disalin ke tes) tidak mengenai baris parkir; gagal kirim kembali parkir; kejadian lama tetap tidak diparkir |
| 3 | **Pengirim Web**: `catatHarian` dan `drainTelegram` kembar langkah 2. | `bun test src/lib/services/telegram.test.ts` ("kejadian hrd", data dan pesan sama dengan langkah 2, dan tes parkir yang sama) |
| 4 | **Kartu, backend**: bacaan `perhatian` (Rust + TS, bagian menurut izin), command `desktop_hr_attention` di keempat tempat, aksi `perhatian` di `/api/hris/query`, gateway. | `audit:contract` (302/308) + `cargo test telegram` (bagian tanpa izin tidak ikut) + tes layanan Web yang sama + `web-rbac-boundary` |
| 5 | **Layar**: `PerluPerhatian.tsx` di `HrisWorkspace`, kalimat peringatan di `NotifikasiTelegramCard`; `bun run sync:mobile`; bagian `CLAUDE.md` "HRIS fase 8" (dan angka 13 → 20 kejadian, 4 → 5 bidang di bagian Telegram v33); angka di dokumen skill (command 302/308); catatan "Sudah dibangun" §23.12. | typecheck + Biome + `audit:docs`; `bun run check` penuh oleh pemilik |

`audit:schema` tidak punya gerbang di fase ini karena tidak ada DDL yang
berubah; ia tetap ikut `bun run check` penuh di akhir.

### 23.9 Penanda yang ditinjau pemilik saat menyetujui

- **Tanpa perubahan skema**: versi tetap 42, sentinel tetap `-2038`. Perangkat
  fase 7 tetap bisa sinkron; yang membedakan build hanya isi pengirimnya.
- **Parkir klaim** memakai kolom `klaim_oleh`/`klaim_sampai` untuk tujuan
  kedua (menyembunyikan baris dari build lama). Ini satu-satunya bagian yang
  mengubah `drain`, kode yang sudah berjalan sejak v33. Celah sisanya di §23.2.
- **Prosedur tetap dianjurkan**: nyalakan sakelar `hr_*` setelah perangkat
  diperbarui. Parkir klaim menjaga bila ada yang terlewat, bukan pengganti.
- **Pengingat hanya terkirim bila ada yang login** hari itu (sesi mana pun,
  termasuk terminal scanner dan HP driver), dan baru setelah 07.00 WIB.
- **Hari pertama dinyalakan**: semua kontrak, percobaan, dan dokumen yang
  sedang di dalam jendelanya terkirim sekaligus (dibatasi 20 pesan per menit).
- Pengingat dokumen hanya untuk dokumen yang belum lewat; dokumen yang sudah
  kedaluwarsa sebelum Telegram dinyalakan hanya tampil di kartu.
- Dokumen yang tanggal kedaluwarsanya diperbarui diingatkan lagi untuk tanggal
  barunya (id memuat tanggal), berbeda dari id `hr-dok:<id>` di §11.3.
- Ulang tahun kerja satu pesan per hari, bukan satu per orang (§11.3).
- Pesan memuat **jenis dokumen** dan **tingkat SP** selain nama + jabatan.
- Dua ringkasan pengajuan tidak memuat nama; klaim Reimburse ikut dihitung di
  grup HRD walaupun pemutusnya pemegang `reimburse.decide`.
- "Menunggu > 2 hari" dihitung dari jam cloud menerima pengajuan (2 × 24 jam
  kalender, termasuk hari libur), bukan hari kerja.
- Pengingat PKWT tidak dikirim bila karyawan itu sudah punya kontrak yang
  lebih baru, apa pun jenisnya.
- Kartu "Perlu perhatian" butuh koneksi ke database, di Desktop sekalipun, dan
  pemegang `employees.view` (termasuk Atasan dan Admin) melihat bagian Kontrak
  dan Ulang tahun kerja.
- Data pelamar tidak pernah masuk Telegram.

### 23.10 Pertanyaan untuk pemilik

| No | Pertanyaan | Usulan | Alasan |
| :-- | :-- | :-- | :-- |
| Q-101 | Cara aman menyalakan kejadian baru selagi masih ada perangkat lama: (a) parkir klaim (§23.2) ditambah prosedur; (b) prosedur saja seperti fase 3 driver; (c) menaikkan versi skema ke 43 tanpa isi? | (a) | (c) tidak menolong: `drain` build lama tidak memeriksa versi, hanya sentinel lama yang tetap ada. (b) bergantung pada disiplin, dan pesan yang dibatalkan hilang diam-diam. (a) tiga predikat di `drain` + satu INSERT, tanpa skema |
| Q-102 | Kartu "Perlu perhatian" di Desktop: (a) semua bagian dibaca dari cloud lewat satu command; (b) kontrak, pengajuan, ulang tahun dari SQLite lokal dan sisanya dari cloud? | (a) | Tiga dari enam bagian memang khusus cloud; satu sumber berarti SQL yang sama dengan Telegram. (b) tetap tampil sebagian saat offline, tetapi dua jalur baca dan dua set kueri kembar |
| Q-103 | Ulang tahun kerja: satu pesan per orang (`hr-ultah:<id>:<tahun>`, §11.3) atau ringkasan harian (`hr-ultah:<tanggal>`)? | Ringkasan harian | Karyawan hasil impor sering bertanggal masuk sama (1 Januari, tanggal berdiri); per orang berarti puluhan pesan sekaligus |
| Q-104 | Dokumen yang diperpanjang (tanggal kedaluwarsa diubah): diingatkan lagi? | Ya, id `hr-dok:<id_dokumen>:<tanggal_kedaluwarsa>` | Dengan id §11.3 (`hr-dok:<id>`) SIM yang diperpanjang tidak pernah diingatkan lagi seumur baris itu |
| Q-105 | Selain nama + jabatan (Q-32), bolehkah pesan memuat jenis dokumen ("SIM B1") dan tingkat SP ("SP2")? | Ya untuk keduanya; nomor dokumen dan isi SP tetap tidak pernah | Tanpa jenis dokumen pesannya tidak bisa ditindaklanjuti. Tingkat SP bukan isi SP, tetapi bila dianggap terlalu peka, pesan SP cukup "Masa berlaku SP berakhir" |
| Q-106 | Angka pengingat (H-30/H-7 kontrak, H-7 percobaan, H-30 dokumen, 2 hari menunggu, 07.00 WIB): tetap di kode atau bisa diatur per perusahaan? | Tetap di kode | §11.3 sudah menetapkannya; enam pengaturan baru menambah layar dan validator kembar tanpa permintaan |
| Q-107 | Klaim Reimburse yang menunggu > 2 hari ikut ringkasan grup HRD? | Ya, sebagai baris hitungan "Reimburse", tanpa nominal | Mesin pengajuannya sama; grup Keuangan tidak punya kejadian klaim. Bila pemutus klaim bukan HRD, alternatifnya ringkasan kedua ke grup Keuangan (satu kejadian lagi) |
| Q-108 | Ringkasan pengajuan menunggu dan urgent: hitungan saja, atau dengan nama karyawan? | Hitungan saja per kelompok | Nama + kelompok "Sakit" di grup sudah mendekati "alasan sakit" yang dilarang Q-32; rinciannya ada di `/pengajuan` |
| Q-109 | SP berakhir: dikirim pada hari terakhir berlaku (`berlaku_sampai`) saja, atau juga pengingat sebelumnya? | Hari terakhir saja (§11.3), kartu menampilkan 7 hari sebelumnya | SP berakhir tidak butuh tindakan seperti kontrak; cukup tahu |
| Q-110 | Pengingat PKWT untuk karyawan yang sudah punya kontrak lebih baru (sudah diperpanjang atau diangkat PKWTT): tetap dikirim? | Tidak | Mengingatkan hal yang sudah ditangani hanya menambah bising |
| Q-111 | Data pelamar yang akan dihapus retensi: Telegram, kartu, atau keduanya? | Kartu saja (judul lowongan, jumlah, tanggal; tanpa nama) | Daftar lowongan sudah menonjolkannya; nama pelamar tidak boleh keluar ke Telegram (Q-86) |
| Q-112 | Bagian Kontrak dan Ulang tahun kerja di kartu terbuka untuk semua pemegang `employees.view` (termasuk Atasan dan Admin)? | Ya | Tanggal kontrak sudah terbaca dengan izin itu hari ini (`desktop_hr_contracts`); kartu tidak membuka data baru |

### 23.11 Jawaban fase 8 (12 Nov 2026)

Semua jawaban sesuai usulan §23.10, dan penanda §23.9 disetujui, jadi isi
§23.2–§23.9 tidak berubah.

| No | Pertanyaan | Jawaban |
| :-- | :-- | :-- |
| Q-101 | Menyalakan kejadian baru selagi ada perangkat lama | (a): parkir klaim (`gen:2`) ditambah prosedur |
| Q-102 | Sumber kartu "Perlu perhatian" di Desktop | (a): semua bagian dari cloud lewat satu command |
| Q-103 | Ulang tahun kerja | Ringkasan harian (`hr-ultah:<tanggal>`) |
| Q-104 | Dokumen yang diperpanjang | Diingatkan lagi; id `hr-dok:<id_dokumen>:<tanggal_kedaluwarsa>` |
| Q-105 | Jenis dokumen dan tingkat SP di pesan | Ya untuk keduanya; nomor dokumen dan isi SP tidak pernah |
| Q-106 | Angka pengingat | Tetap di kode |
| Q-107 | Klaim Reimburse di ringkasan grup HRD | Ya, baris hitungan "Reimburse" tanpa nominal |
| Q-108 | Nama di ringkasan pengajuan | Tidak; hitungan per kelompok saja |
| Q-109 | Waktu pesan SP berakhir | Hari terakhir berlaku saja; kartu menampilkan 7 hari sebelumnya |
| Q-110 | Pengingat PKWT bila sudah ada kontrak lebih baru | Tidak dikirim |
| Q-111 | Data pelamar yang akan dihapus retensi | Kartu saja (judul lowongan, jumlah, tanggal; tanpa nama) |
| Q-112 | Bagian Kontrak dan Ulang tahun kerja untuk pemegang `employees.view` | Ya |

### 23.12 Sudah dibangun (12 Nov 2026)

Langkah 1–5 dibangun tanpa perubahan skema (versi 42, sentinel `-2038`, 68
tabel snapshot, 90 rute, tanpa izin baru). Gerbang yang dijalankan:
`audit:contract` (90 rute, 68 tabel snapshot, command Desktop 302 / Mobile
308) dan `audit:docs` lulus; `cargo test telegram` Desktop dan Mobile 18 lulus
(termasuk `isi_pesan_hrd`, `sql_sumber_hrd_sah_di_skema_cloud`,
`catat_hrd_dari_data_cloud`, `baris_parkir_tidak_disentuh_predikat_lama`,
`izin_kartu_perhatian`, `perhatian_menurut_izin`) dan `cargo test
hr_rekrutmen` Desktop 7 lulus; `bun test` untuk `services/telegram.test.ts`,
`validations/telegram.test.ts`, dan `validations/hr-rekrutmen.test.ts` 37
lulus di kedua workspace (vektor, teks SQL dan daftar izin kembar Rust ↔ TS,
data uji disalin dari Rust), `web-rbac-boundary.test.ts` 9 lulus; typecheck
kedua workspace dan Biome berkas yang diubah bersih. `bun run check` penuh
belum dijalankan (pemilik). Layar belum dicoba di aplikasi yang berjalan, dan
belum ada pesan yang dikirim ke Telegram sungguhan.

Penyimpangan dan catatan, untuk ditinjau:

- **Teks pesan diberi emoji di depan** seperti 13 pesan yang sudah ada (📄
  kontrak, ⏳ percobaan, 🪪 dokumen, 📋 SP, 📥 menunggu, ⚡ urgent, 🎉 ulang
  tahun); nama dan jabatan satu baris "Karyawan: <nama> · <jabatan>", baris
  jabatan hilang bila kosong.
- **Ringkasan pengajuan juga hanya karyawan Aktif** (aturan umum §23.3), jadi
  pengajuan milik karyawan yang sudah keluar tidak ikut dihitung walaupun masih
  Menunggu di `/pengajuan`. Hitungan per kelompok urut abjad.
- **"Kontrak terakhir"** = urutan `JENIS_DARI_KONTRAK_SQL` (tanggal mulai, lalu
  id kontrak); kontrak yang punya `batal-<id>` dianggap tidak ada. Kontrak lama
  yang bukan kontrak terakhir karyawannya tidak diingatkan, berlaku juga untuk
  masa percobaan.
- **Daftar ulang tahun kerja tanpa `LIMIT`**; pesannya memotong di 30 baris
  (`MAKS_BARIS_STOK`). Ringkasan tanpa isi tidak dicatat, jadi setiap siklus
  sesudah 07.00 mengulang tiga kueri ringkasan sampai ada isinya atau tanggal
  berganti.
- **Kejadian yang diparkir ditentukan dari bidangnya (`hrd`)**, bukan dari
  `klaim_oleh` yang terbaca: baris yang klaimnya sempat diganti pengirim yang
  mati tetap kembali diparkir saat gagal berikutnya. Generasi sesudah fase ini
  perlu aturan `diparkir` sendiri.
- **Tiga ekspor khusus tes di `services/telegram.ts`** (`Pengaturan`,
  `bacaPengaturan`, `catatHarianPada`) supaya batas 07.00 diuji tanpa bergantung
  jam saat tes berjalan; berkasnya `server-only`. Jalur `drain` Rust (kirim dan
  batal sungguhan) hanya diuji lewat SQL dan fungsi yang dipakainya, karena
  `kirim_pesan` memanggil HTTP Telegram langsung; tes Web menjalankan
  `drainTelegram` utuh dengan `fetch` tiruan.
- **SQL kartu Rekrutmen di modul rekrutmen** (`PERHATIAN_REKRUTMEN_SQL` di
  `hr_rekrutmen.rs` ↔ `hr-rekrutmen.ts`), bukan `telegram.rs`, karena makro
  tanggal hapus dan tutup efektif hanya ada di sana; bacaannya tetap di
  `telegram::perhatian`.
- **Jendela kartu yang ditafsirkan**: kontrak PKWT sisa 0–30 dan percobaan 0–7
  (yang sudah lewat tetap tanda `pkwt_lewat`/`percobaan_lewat` di daftar);
  dokumen ≤ 30 hari termasuk yang sudah lewat; SP Berlaku yang berakhir dalam 7
  hari; ulang tahun kerja hari ini sampai 7 hari ke depan; rekrutmen tanggal
  hapus ≤ hari ini + 30 dan hanya lowongan yang masih punya pelamar yang belum
  dijadikan karyawan. Setiap daftar `LIMIT 200`, tanpa "dan k lainnya".
- **Layar**: kartu hanya dirender bila sesi memegang salah satu
  `IZIN_PERHATIAN`; tombol Muat ulang menjalankan `syncNow()` dulu (outbox
  yang belum terdorong belum terlihat cloud). Klik nama memilih karyawan dan
  membuka `RincianKaryawan` pada tab yang sesuai (prop baru `tabAwal`, ekspor
  tipe `TabRincian`); klik lowongan membuka tab Rekrutmen; bagian Pengajuan
  bertaut ke `/pengajuan`. Kalimat peringatan di kolom grup HRD kartu
  Notifikasi.
- **Command juga terdaftar di Mobile** (308) karena `telegram.rs` dan
  `commands.rs` ikut daftar salin; tidak ada layar Mobile untuknya.

## 24. Urutan pengerjaan fase 9

**Disetujui pemilik (12 Nov 2026).** Ditulis setelah menelusuri kode
(12 Nov 2026); jawaban Q-113 sampai Q-124 di §24.12, semuanya sesuai usulan.
Isinya butir yang ditunda §22.10 dan §23.7 dan diminta pemilik
di §15.1: kejadian Telegram penilaian kinerja, rekrutmen, dan per pengajuan;
kartu "Perlu perhatian" di Mobile dan di beranda; angka pengingat yang bisa
diatur per perusahaan. HRIS lengkap di Mobile dan bagan struktur organisasi
adalah fase 10; rencana dan anggaran pelatihan fase 11 (§15.1).

### 24.1 Temuan dari kode

- **Fase 8 belum dirilis.** Seluruh kode fase 8 masih di working tree (commit
  terakhir "selesai fase 7"), jadi belum ada perangkat yang menjalankan
  `gen:2`. Ini menentukan Q-113: bila fase 8 dan 9 dirilis bersama, kejadian
  baru cukup masuk generasi parkir `gen:2` yang sama, dan id serta jendela
  fase 8 masih boleh diubah tanpa jejak di cloud.
- **Bila fase 8 dirilis lebih dulu**, dua masalah muncul: (1) kejadian fase 9
  butuh `gen:3` dan predikat `drain` baru (`klaim_oleh IN ('gen:2', 'gen:3')`);
  (2) build fase 8 tetap memakai angka 30/7/2/07.00 dari kode, sementara build
  fase 9 memakai pengaturan, sehingga dua build yang berjalan bersamaan mencatat
  pengingat yang sama dengan jendela berbeda. Dengan id `hr-kontrak:<id>:30`
  dan pengaturan H-14, build lama dan baru masing-masing mengirim satu pesan.
- **Pola pengaturan angka sudah ada.** `BATAS_PENGATURAN` (`hris.rs` ↔
  `validations/hris.ts`) memuat enam angka HR berbatas min–maks, disimpan di
  `setting_gex_system` (tersinkron) lewat `simpan_pengaturan` →
  `tulis_pengaturan` (outbox `setting/update`, satu transaksi), dijaga
  `hr.org.manage`, layarnya di `OrganisasiPanel.tsx`. SQL yang membaca angka
  itu memakai subkueri berbatas dengan bawaan (`retensi_bulan_sql!` ↔
  `RETENSI_BULAN_SQL`): nilai rusak = bawaan, dihitung database, teks kembar.
  Pengirim Telegram membaca cloud, jadi angka yang baru disimpan di perangkat
  berlaku setelah terdorong.
- **Angka fase 8 tertulis di tiga tempat**: literal di SQL sumber dan SQL kartu
  (`TELEGRAM_SQL_HR_*`, `PERHATIAN_SQL_*`), id kontrak `:30`/`:7`
  (`id_hr_kontrak`), dan jam `JAM_RINGKASAN_STOK` di `catat_harian_pada`, yang
  juga dipakai ringkasan stok Inventaris.
- **Status penilaian kinerja tidak ada di SQL.** `status_kinerja` ↔
  `statusKinerja` dihitung di kode dari sidik dan keputusan
  (`urut_keputusan`). Kejadian kinerja karena itu membaca baris penilaian dan
  keputusan dari cloud lalu memakai fungsi status yang sama, bukan SQL predikat
  baru. Jenis periode yang berlaku ada di `setting_gex_system`
  `hr_kinerja_periode`; rentangnya `periode_rentang` ↔ `periodeRentang`.
- **Data kejadian baru dan jam cloud-nya**: `hr_pengajuan.created_at` (jam
  cloud), `hr_pengajuan_keputusan.diterima_cloud`, `hr_kinerja_keputusan`
  (`diterima_cloud` + `waktu_perangkat` berpresisi milidetik),
  `hr_pelamar.created_at` dan `hr_lowongan` (khusus cloud, jadi jam cloud).
- **Beranda**: Web/Desktop `/` = `src/app/page.tsx` (ringkasan dan kartu
  modul, `AppShell`). Mobile `/` hanya mengalihkan ke `/dashboard`
  (`mobile/src/app/dashboard/page.tsx`, milik Mobile sendiri, tidak disalin).
- **Mobile sudah punya bacaannya**: `desktop_hr_attention` terdaftar di biner
  Mobile (308) dan `ambilPerhatian` ada di `gateways/hris.ts` salinan Mobile.
  Yang belum: komponennya. `PerluPerhatian.tsx` tidak di `filesToCopy`, dan
  mengimpor tipe `TabRincian` dari `RincianKaryawan.tsx` yang tidak ada di
  Mobile. Mobile punya `/pengajuan` (termasuk tab Penilaian) tetapi tidak punya
  `/hris`.
- **Kartu Notifikasi** merender `TELEGRAM_KEJADIAN` dengan `.map`, jadi sakelar
  baru tampil sendiri; `telegramDraftSchema` dan `baca_draft` wajib ditambah
  kuncinya (pola langkah 1 fase 8).
- Skema sekarang: v42, sentinel `-2038`, 68 tabel snapshot, 90 rute, command
  Desktop 302 / Mobile 308, 20 kejadian, 5 bidang.

### 24.2 Model data: tanpa perubahan skema

Versi tetap 42, sentinel tetap `-2038`, tanpa tabel, kolom, indeks, rute, atau
izin baru. Pengaturan baru = baris `setting_gex_system` lewat
`BATAS_PENGATURAN`; kejadian baru = baris `app_telegram_setting` dan antrean
seperti fase 8. Dengan Q-113 (a), semua kejadian baru juga diparkir `gen:2`
(`diparkir` = bidang `hrd`, sudah begitu).

### 24.3 Angka pengingat per perusahaan (Q-114, Q-115, Q-116)

Enam entri baru di `BATAS_PENGATURAN`, diatur di tab Organisasi `/hris`
(`hr.org.manage`), berlaku untuk Telegram DAN kartu:

| Kunci | Arti | Bawaan | Batas |
| :-- | :-- | :-- | :-- |
| `hr_ingat_kontrak_jauh` | PKWT: pengingat pertama, hari sebelum berakhir | 30 | 8–90 |
| `hr_ingat_kontrak_dekat` | PKWT: pengingat kedua | 7 | 1–30, wajib < jauh |
| `hr_ingat_percobaan` | Masa percobaan | 7 | 1–30 |
| `hr_ingat_dokumen` | Dokumen kedaluwarsa | 30 | 1–90 |
| `hr_ingat_menunggu` | Pengajuan menunggu lebih dari (hari) | 2 | 1–14 |
| `hr_ingat_jam` | Jam WIB mulai mencatat kejadian HR harian | 7 | 0–23 |

- SQL membaca angkanya lewat fragmen kembar berpola `retensi_bulan_sql!`
  (`ingat_*_sql!` ↔ `INGAT_*_SQL`): subkueri `setting_gex_system` berbatas,
  bawaan bila kosong atau rusak. Literal 30/7/2 di SQL sumber dan SQL kartu
  fase 8 diganti fragmen itu; konstanta `HR_HARI_*` menjadi bawaan.
- `validasi_pengaturan` ↔ `validasiPengaturan` menambah satu aturan silang:
  dekat < jauh. Bila yang tersimpan rusak (dekat ≥ jauh dari data lama), SQL
  tetap jalan: jendela "jauh" kosong, "dekat" tetap.
- **Id kontrak menjadi `hr-kontrak:<id>:jauh` / `:dekat`** (Q-116): mengubah
  angka di tengah jendela tidak melahirkan pesan kedua untuk tahap yang sama.
  `id_hr_kontrak(id, sisa, dekat)`.
- **Jam**: `catat_harian_pada` membaca `hr_ingat_jam` untuk kejadian HR; stok
  Inventaris tetap `JAM_RINGKASAN_STOK` (7). Jendela kartu yang lain (SP 7 hari,
  ulang tahun 7 hari ke depan, rekrutmen 30 hari) tetap di kode.
- Pesan "menunggu lebih dari N hari" memakai angka yang sama; fungsi pesan
  menerima N sebagai argumen.

### 24.4 Kejadian baru (Q-117 sampai Q-121)

Semua ke bidang `hrd`, sakelar lahir mati, diparkir. Kejadian berbasis tanggal
dicatat di `catat_hrd` sesudah jam `hr_ingat_jam`; kejadian per peristiwa di
`catat_kejadian`, disaring `aktif_sejak` dan batas 7 hari jam cloud seperti
kejadian v33.

| Kejadian (`kirim:`) | Kapan | Id | Isi (tanpa yang dilarang Q-32) |
| :-- | :-- | :-- | :-- |
| `hr_kinerja_menunggu` | ringkasan harian, bila ada | `hr-kinerja-tunggu:<tanggal>` | "<n> penilaian kinerja menunggu Final", paling lama sejak. Tanpa nama (hasil kinerja rahasia) |
| `hr_kinerja_periode` | sekali per periode, hari pertama sesudah `periode_selesai` sampai 7 hari | `hr-kinerja-periode:<periode_mulai>` | "Periode <label> berakhir: <a> belum dinilai, <b> masih draf, <c> diajukan". Tanpa nama |
| `hr_pelamar_baru` | ringkasan harian atas pelamar yang dicatat kemarin (WIB) | `hr-pelamar:<tanggal>` | "<n> pelamar baru kemarin", lalu per judul lowongan. Tanpa nama pelamar (Q-86) |
| `hr_lowongan_tutup` | `tanggal_tutup` H-3 sampai hari H, belum ditekan Tutup | `hr-lowongan:<id>:<tanggal_tutup>` | judul, tanggal tutup, jumlah pelamar, kuota |
| `hr_pengajuan_baru` | per pengajuan, `created_at` cloud, masih Menunggu saat dibaca | `hr-ajuan:<id_pengajuan>` | menurut Q-120 |
| `hr_pengajuan_diputus` | per keputusan final yang berlaku, `diterima_cloud` | `hr-putus:<id_keputusan>` | menurut Q-120; Setujui/Tolak dan pemutus; tanpa alasan |

- `hr_kinerja_menunggu` dan `hr_kinerja_periode` membaca penilaian dan
  keputusan dari cloud lalu memakai `status_kinerja` ↔ `statusKinerja`.
  "Wajib dinilai" (Q-118) = karyawan Aktif yang rentang aktifnya (§21.4)
  beririsan dengan periode itu; "belum dinilai" = tanpa penilaian akar yang
  tidak dibatalkan untuk periode itu.
- `hr_pengajuan_diputus` hanya keputusan yang sidiknya cocok dengan isi
  sekarang dan yang pertama berlaku (`PENGAJUAN_BERLAKU_SQL`); keputusan ganda
  dan yang gugur tidak dikirim.
- Klaim Reimburse ikut `hr_pengajuan_baru`/`_diputus` tanpa nominal (Q-121).
- Menambah kejadian = pola fase 8: `KEJADIAN`, `bidang_kejadian`, label, id,
  SQL sumber, fungsi pesan kembar, dan kunci baru di `telegramDraftSchema` dan
  `baca_draft`. Jumlah kejadian 20 → 26.

### 24.5 Kartu "Perlu perhatian": Kinerja, beranda, Mobile (Q-122 sampai Q-124)

- **Bagian Kinerja baru**: hitungan penilaian yang menunggu Final dan, untuk
  periode yang baru berakhir, belum dinilai / masih draf. Hanya angka, bertaut
  ke tab Kinerja (Web/Desktop) atau tab Penilaian `/pengajuan` (Mobile). Izin:
  `hr.performance.finalize` atau `hr.performance.view` (Q-122). Masuk
  `IZIN_PERHATIAN` dan `IzinPerhatian`.
- **Beranda Web/Desktop** (`src/app/page.tsx`): komponen yang sama di atas
  daftar modul, hanya bila sesi memegang salah satu `IZIN_PERHATIAN` dan hanya
  bila ada isinya (Q-123); di `/hris` kartunya tetap selalu tampil. Klik nama
  dari beranda membuka `/hris?karyawan=<id>&tab=<tab>`; `HrisWorkspace` membaca
  parameter itu (`useSearchParams` dalam `Suspense`, cocok dengan
  `output: "export"`).
- **Mobile** (`/dashboard`): komponen disalin lewat `filesToCopy`. Tipe
  `TabRincian` dipindah ke `validations/telegram.ts` supaya komponen tidak
  mengimpor `RincianKaryawan`. Di Mobile nama tidak bisa diklik (tidak ada
  `/hris`); tautan Pengajuan dan Penilaian ke `/pengajuan` tetap (Q-124).
  Tanpa koneksi: "Butuh koneksi ke database", sisa layar tetap jalan.
- Kartu memakai angka §24.3 untuk jendela kontrak, percobaan, dokumen, dan
  menunggu.

### 24.6 Hak akses

- Tidak ada izin baru. `IZIN_PERHATIAN` 7 → 9 (`hr.performance.view`,
  `hr.performance.finalize`), tetap disaring per bagian di backend.
- Angka pengingat: `hr.org.manage` (Q-115), lewat `desktop_hr_settings_save` dan
  aksi pengaturan `/api/hris` yang sudah ada.
- Konfigurasi Telegram tetap Superadmin. Grup HRD tetap pembaca tanpa RBAC;
  karena itu kinerja hanya angka dan per pengajuan mengikuti Q-120.

### 24.7 Command, rute, dan layar

- **Tanpa command baru** (tetap Desktop 302 / Mobile 308): pengaturan lewat
  `desktop_hr_settings_save`, kartu lewat `desktop_hr_attention`. Tanpa rute
  baru: `/api/hris` (pengaturan) dan `/api/hris/query` aksi `perhatian`.
- **Rust**: `hris.rs` (`BATAS_PENGATURAN`, aturan silang, fragmen `ingat_*`),
  `telegram.rs` (enam kejadian, SQL sumber dan kartu memakai fragmen, bagian
  Kinerja), `hr_kinerja.rs` (fungsi yang dipakai ulang dibuka `pub(crate)` bila
  perlu).
- **Web**: kembaran di `validations/hris.ts`, `validations/telegram.ts`,
  `services/telegram.ts`; `telegramDraftSchema`.
- **Layar**: isian enam angka di `OrganisasiPanel.tsx` (konfirmasi
  `konfirmasiData` seperti pengaturan lain); `PerluPerhatian.tsx` (bagian
  Kinerja, mode tanpa klik, mode "sembunyi bila kosong") di `/hris`, beranda
  Web/Desktop, dan `mobile/src/app/dashboard/page.tsx`; `HrisWorkspace` membaca
  parameter URL; `filesToCopy` ditambah `PerluPerhatian.tsx`.

### 24.8 Tidak dikerjakan di fase ini

- HRIS lengkap di Mobile dan bagan struktur organisasi (fase 10); rencana dan
  anggaran pelatihan (fase 11).
- Pelaporan BPJS/DJP/Wajib Lapor dan berkas transfer bank (sesudah fase 11).
- Pesan per penilaian kinerja (nama + nilai): hasil kinerja rahasia.
- Kejadian per pelamar dan per tahap seleksi (nama pelamar, Q-86).
- Grup Telegram per atasan atau per divisi; bot tetap satu arah ke grup bidang.
- Angka jendela kartu yang lain (SP, ulang tahun, rekrutmen) dan jam ringkasan
  stok sebagai pengaturan.

### 24.9 Langkah

| # | Langkah | Gerbang |
| :-- | :-- | :-- |
| 1 | **Angka pengingat**: enam entri `BATAS_PENGATURAN` + aturan silang (Rust ↔ TS), fragmen SQL `ingat_*`, SQL sumber dan kartu fase 8 memakai fragmen, id kontrak `:jauh`/`:dekat`, jam HR dari pengaturan, pesan menunggu menerima N. | `bun run sync:mobile`, lalu `bun test` `validations/telegram.test.ts` + `validations/hris.test.ts` + `services/telegram.test.ts`, `cargo test telegram` + `cargo test hris` (kedua workspace): angka bawaan, angka diubah, angka rusak = bawaan, dekat ≥ jauh ditolak, id tidak berubah saat angka diubah |
| 2 | **Aturan kembar enam kejadian**: bidang, label, id, SQL sumber, fungsi pesan, kunci draft. Belum dipanggil. | tes teks SQL dan vektor pesan Rust ↔ TS, SQL dijalankan di skema cloud |
| 3 | **Pengirim Rust dan Web**: kinerja dan rekrutmen di `catat_hrd`, per pengajuan di `catat_kejadian`, semuanya diparkir. | `catat_hrd_dari_data_cloud` diperluas + kembarannya "kejadian hrd": data dan pesan sama, dua kali tidak menggandakan, `aktif_sejak` dan 7 hari, keputusan gugur dan ganda tidak dikirim, isi rahasia tidak ada |
| 4 | **Kartu backend**: bagian Kinerja, `IZIN_PERHATIAN` 9. | `perhatian_menurut_izin` + "perhatian" diperluas, `web-rbac-boundary`, `audit:contract` (302/308 tetap) |
| 5 | **Layar**: isian angka di Organisasi, kartu di beranda dan Mobile, parameter URL `/hris`, `filesToCopy`; `CLAUDE.md` "HRIS fase 9", angka di dokumen skill; §24.13 "Sudah dibangun". | typecheck kedua workspace + Biome + `audit:docs`; `bun run check` penuh oleh pemilik |

### 24.10 Penanda yang ditinjau pemilik saat menyetujui

- **Fase 8 dan 9 dirilis bersama** (Q-113 (a)): fase 8 jangan dikirim ke klien
  sebelum fase 9 selesai. Id kontrak fase 8 (`:30`/`:7`) diganti `:jauh`/
  `:dekat` sebelum ada yang terkirim.
- Mengubah angka pengingat berlaku setelah pengaturannya terdorong ke cloud;
  perangkat offline yang menyimpannya baru berlaku saat online.
- Memperkecil angka (mis. dokumen 30 → 14) tidak membatalkan pengingat yang
  sudah tercatat; memperbesar angka bisa membuat pengingat langsung tercatat
  untuk yang kini masuk jendela.
- Per pengajuan menambah pesan di grup HRD: satu per pengajuan baru dan satu
  per keputusan. Ringkasan menunggu dan urgent tetap ada.
- Grup HRD membaca nama karyawan per pengajuan menurut Q-120; kinerja dan
  rekrutmen hanya angka dan judul lowongan.
- Kartu di beranda hanya muncul bila ada isinya; di `/hris` selalu.
- Di Mobile nama di kartu tidak bisa diklik.
- Hari pertama sakelar baru dinyalakan, ringkasan dan pengingat yang sedang di
  jendelanya terkirim hari itu (sama dengan fase 8).

### 24.11 Pertanyaan untuk pemilik

| No | Pertanyaan | Usulan | Alasan |
| :-- | :-- | :-- | :-- |
| Q-113 | Fase 8 dirilis sendiri dulu, atau ditahan dan dirilis bersama fase 9? | (a) ditahan, rilis bersama | Fase 8 belum di-commit; rilis bersama menghindari `gen:3`, pesan ganda antara build yang memakai angka tetap dan build yang memakai pengaturan, dan id kontrak yang tidak bisa diganti lagi |
| Q-114 | Angka mana yang bisa diatur? | Enam angka §24.3 (kontrak jauh/dekat, percobaan, dokumen, menunggu, jam HR) | Itu angka §11.3 yang ditunda di §23.7. Jendela kartu yang lain murni tampilan |
| Q-115 | Siapa yang mengatur angka pengingat? | `hr.org.manage`, di tab Organisasi bersama pengaturan HR lain | Angkanya aturan HR, bukan konfigurasi bot; Superadmin tetap mengatur Telegram |
| Q-116 | Id pengingat kontrak memakai tahap (`:jauh`/`:dekat`) atau angkanya (`:30`)? | Tahap | Dengan angka, mengubah H-30 menjadi H-14 di tengah jendela mengirim pengingat kedua untuk tahap yang sama |
| Q-117 | Kejadian kinerja: ringkasan "menunggu Final" harian dan ringkasan "periode berakhir", tanpa nama? | Ya keduanya, tanpa nama | Hasil kinerja rahasia (`CONFIDENTIAL_PERMISSIONS`); grup tidak punya RBAC |
| Q-118 | "Wajib dinilai" untuk ringkasan periode: semua karyawan Aktif yang rentang aktifnya beririsan dengan periode, atau hanya yang jabatannya punya template? | Semua yang beririsan | Template bawaan berlaku untuk jabatan tanpa pemetaan; yang belum punya template justru perlu terlihat |
| Q-119 | Kejadian rekrutmen: ringkasan pelamar baru harian (per lowongan, tanpa nama) dan lowongan yang tutup H-3? | Ya keduanya | Nama pelamar tetap tidak keluar (Q-86); judul lowongan bukan data pribadi |
| Q-120 | Isi pesan per pengajuan: (a) nama + kelompok + tanggal untuk semua; (b) seperti (a) tetapi Sakit tanpa nama ("1 pengajuan Sakit baru"); (c) tanpa nama sama sekali? | (b) | Q-108 menghapus nama karena "<nama>: Sakit" mendekati alasan sakit (Q-32). Kelompok lain tidak sepeka itu, dan pesan tanpa nama tidak bisa ditindaklanjuti |
| Q-121 | Per pengajuan: kirim saat diajukan DAN saat diputus? Klaim Reimburse ikut (tanpa nominal)? | Ya, ya; semuanya ke grup HRD | Satu mesin pengajuan; nominal tetap tidak pernah dikirim (Q-32) |
| Q-122 | Bagian Kinerja di kartu: siapa yang melihat, dan isinya? | `hr.performance.finalize` atau `hr.performance.view`; hanya angka | Pemegangnya sudah bisa membuka daftar penilaian; angka cukup untuk tahu ada yang menunggu |
| Q-123 | Kartu di beranda: selalu tampil, atau hanya bila ada isinya? | Hanya bila ada isinya | Beranda dipakai semua peran; "Tidak ada yang perlu perhatian" setiap hari hanya bising |
| Q-124 | Kartu di Mobile: nama tidak bisa diklik (tidak ada `/hris`), atau membuka `/karyawan`? | Tidak bisa diklik; tautan Pengajuan/Penilaian tetap | `/karyawan` Mobile tidak punya tab Kontrak/Dokumen/SP; membukanya tidak menunjukkan alasan nama itu muncul |

### 24.12 Jawaban fase 9 (12 Nov 2026)

Semua jawaban sesuai usulan §24.11, jadi isi §24.2–§24.10 tidak berubah.
Catatan Q-113: fase 8 sudah di-commit tetapi belum dirilis, jadi (a) tetap
berlaku: fase 8 ditahan dan dirilis bersama fase 9.

| No | Pertanyaan | Jawaban |
| :-- | :-- | :-- |
| Q-113 | Rilis fase 8 | (a) ditahan, dirilis bersama fase 9 (sudah di-commit, belum dirilis) |
| Q-114 | Angka yang bisa diatur | Enam angka §24.3 |
| Q-115 | Yang mengatur angka pengingat | `hr.org.manage`, tab Organisasi |
| Q-116 | Id pengingat kontrak | Tahap `:jauh`/`:dekat` |
| Q-117 | Kejadian kinerja | Ringkasan menunggu Final dan periode berakhir, tanpa nama |
| Q-118 | "Wajib dinilai" | Semua karyawan Aktif yang rentang aktifnya beririsan dengan periode |
| Q-119 | Kejadian rekrutmen | Pelamar baru harian per lowongan (tanpa nama) dan lowongan tutup H-3 |
| Q-120 | Isi pesan per pengajuan | (b): nama + kelompok + tanggal, kecuali Sakit tanpa nama |
| Q-121 | Per pengajuan diajukan dan diputus, klaim Reimburse ikut | Ya, ya, tanpa nominal; semuanya ke grup HRD |
| Q-122 | Bagian Kinerja di kartu | `hr.performance.finalize` atau `hr.performance.view`; hanya angka |
| Q-123 | Kartu di beranda | Hanya bila ada isinya |
| Q-124 | Klik nama di kartu Mobile | Tidak bisa diklik; tautan Pengajuan/Penilaian tetap (ditinjau lagi bila Mobile mendapat HRIS lengkap) |

### 24.13 Sudah dibangun (13 Nov 2026)

Langkah 1–5 dibangun tanpa perubahan skema (versi 42, sentinel `-2038`, 68
tabel snapshot, 90 rute, command Desktop 302 / Mobile 308, tanpa izin baru).
Gerbang yang dijalankan: `audit:contract` dan `audit:docs` lulus; `cargo test
telegram` Desktop dan Mobile 23 lulus (termasuk `ringkas_kinerja`,
`isi_pesan_hrd_fase9`, `sql_hrd_fase9_di_skema_cloud`,
`catat_hrd_fase9_dari_data_cloud`, `perhatian_kinerja`, dan
`catat_hrd_dari_data_cloud` yang diperluas dengan angka diubah dan rusak);
`cargo test hris` Desktop dan Mobile 11 lulus (termasuk `fragmen_ingat_sql`);
`bun test` `validations/telegram.test.ts`, `validations/hris.test.ts`,
`services/telegram.test.ts`, dan `web-rbac-boundary.test.ts` 59 lulus di
Web/Desktop (tiga berkas pertama 50 lulus di Mobile); typecheck dan Biome
kedua workspace bersih. `bun run check` penuh belum dijalankan (pemilik).
Layar belum dicoba di aplikasi yang berjalan, dan belum ada pesan yang
dikirim ke Telegram sungguhan.

Penyimpangan dan catatan, untuk ditinjau:

- **Id ringkasan pelamar** memakai tanggal hari ini (`hr-pelamar:<hari ini>`,
  isinya pelamar kemarin), sama dengan pola ringkasan harian fase 8.
- **"Paling lama sejak" ringkasan kinerja** = tanggal WIB `Ajukan` terakhir
  yang tercatat di cloud.
- **Ringkasan periode**: karyawan yang penilaiannya sudah Final tidak dihitung;
  yang Diajukan dihitung "diajukan", penilaian lain "masih draf".
- **Jendela "periode baru berakhir" di kartu = 1–7 hari**, sama dengan
  kejadian Telegram (§24.5 tidak menyebut lamanya).
- **Hitungan kinerja di kartu mencakup penilaian atas diri pemegang sesi**;
  isinya tetap angka saja.
- **Kartu di beranda dengan galat koneksi tetap tampil** ("Butuh koneksi ke
  database"); yang disembunyikan hanya saat memuat dan bila kosong.
- **Label sakelar fase 8** tidak lagi menyebut "30 dan 7 hari" atau "2 hari",
  karena angkanya kini pengaturan.
- **Tes fase 8 hanya menyalakan tujuh kejadian fase 8**; kejadian fase 9 punya
  tesnya sendiri, dan ringkasan periode "hari ini" di tes bersyarat karena
  bergantung tanggal kalender.
- **Tautan Penilaian di Mobile** membuka `/pengajuan?tab=penilaian`; halaman
  itu (milik Mobile) kini membaca parameter tersebut.

## 25. Urutan pengerjaan fase 10

**Disetujui pemilik (13 Nov 2026).** Ditulis setelah menelusuri kode
(13 Nov 2026); jawaban Q-125 sampai Q-136 di §25.12, semuanya sesuai usulan.
Isinya dua butir §15.1 "Urutan fase yang berlaku": HRIS lengkap di Mobile untuk
HRD (membalik Q-43) dan bagan struktur organisasi di Web, Desktop, dan Mobile.
Q-124 ditinjau ulang di sini. Rencana dan anggaran pelatihan tetap fase 11.

### 25.1 Temuan dari kode

- **Biner Mobile sudah memuat seluruh backend HRIS.** Ke-69 command
  `desktop_hr_*` sama persis di kedua `lib.rs`, kedua `build.rs`, dan kedua
  `capabilities/default.json` (69 izin `allow-desktop-hr-*` di masing-masing).
  `hris.rs`, `hr_pengajuan.rs`, `hr_keluar.rs`, `hr_kinerja.rs`,
  `hr_rekrutmen.rs`, `hr_pelatihan.rs`, `telegram.rs`, dan `commands.rs` ada di
  daftar salin `sync-rust-modules.ts`; semua gateway HRIS ada di
  `lib/gateways` (disalin `dirsToCopy`). Yang belum ada di Mobile hanya
  **layarnya**: fase 10 tidak butuh command, rute, izin, atau skema baru.
- **Komponen HRIS di Mobile hari ini** (`filesToCopy`): `PengajuanWorkspace`,
  `PembayaranReimburse`, `PenilaianKinerja`, `PerluPerhatian` (identik dengan
  Web/Desktop). Belum disalin: `HrisWorkspace`, `RincianKaryawan`,
  `JatahCutiPanel`, `SuratPeringatanPanel`, `cetakSuratPeringatan`,
  `KinerjaWorkspace`, `TemplateKinerja`, `KeluarWorkspace`,
  `RekrutmenWorkspace`, `PelatihanWorkspace`, `OrganisasiPanel`,
  `PengaturanPengajuan`, `berkas.ts`.
- **Dependensi komponen itu sudah ada di Mobile.** Di luar `components/hris/`
  mereka hanya mengimpor `PilihCari`, `KonfirmasiData`, `inventory/gaya` (sudah
  di `filesToCopy`) dan `lib/*` (sudah di `dirsToCopy`). Tidak ada yang
  mengimpor `Modal`, `PageHeader`, `FeedbackBanner`, atau `AppShell`, yang
  berbeda antara kedua workspace. Jadi seluruh `components/hris/` bisa disalin
  apa adanya; yang perlu disesuaikan hanya perilaku di bawah.
- **Bergantung pada sesuatu yang tidak ada (atau belum terbukti) di Mobile**:

  | Hal | Letak | Keadaan di Mobile |
  | :-- | :-- | :-- |
  | Cetak A4 (`window.print`) | `cetakSuratPeringatan.ts` lewat tombol di `SuratPeringatanPanel` | WebView Android tidak punya dialog cetak; pola yang ada menyembunyikan tombolnya (`!isMobileRuntime()` di `RincianSuratJalan`, `UpahPanel`) |
  | Buka berkas di tab baru (`window.open` atas URL blob) | `bukaBerkas` di `berkas.ts` (dokumen, CV, sertifikat) dan salinan sendiri di `PengajuanWorkspace` (`lihat`) | Belum terbukti; Tauri Android tidak membuka jendela baru, jadi diduga tidak terjadi apa-apa. Lampiran pengajuan di Mobile sudah memakai jalur ini sejak fase 2 dan belum pernah diuji di HP |
  | Unggah berkas (`<input type="file">`) | Dokumen, nota, CV, sertifikat | Sudah dipakai Mobile (lisensi, cadangan database, foto personil, lampiran pengajuan), jadi pemilih berkas Android berjalan. Tetapi foto kamera HP biasanya 2–5 MB, sedangkan batas berkas HRIS 1 MB (`MAKS_BERKAS_BASE64`): sebagian besar foto langsung dari kamera akan ditolak backend |
  | `window.confirm`, `window.prompt`, `window.alert` | `RincianKaryawan` (hapus berkas, hapus dokumen), `JatahCutiPanel` (alasan batal penyesuaian), `OrganisasiPanel` (galat Jadikan divisi) | Tidak ada kode Mobile yang memakainya hari ini; perilakunya di WebView Tauri belum terbukti |
  | Simpan berkas | `saveFileWithPicker` (`lib/client/download.ts`) | Sudah benar di Mobile: SAF lewat `mobile_save_file_to_device` (aturan 28, 46) |
  | Lebar layar | Daftar + rincian `lg:grid-cols-[22rem_1fr]` di `HrisWorkspace`, `KeluarWorkspace`, `RekrutmenWorkspace`, `PelatihanWorkspace`, `PenilaianKinerja` | Di bawah `lg` rincian jatuh DI BAWAH daftar (`max-h-[65vh]`), jadi di HP menekan nama tidak terlihat berbuah apa pun sampai layar digulir. `PenilaianKinerja` di `/pengajuan` Mobile sudah begini hari ini |
  | Baris tab | `HrisWorkspace` (7 tab), `RincianKaryawan` (9 tab) | `flex-wrap`, di HP 360 px menjadi 2–3 baris tombol |
  | Tabel lebar | `JatahCutiPanel` (`min-w-[34rem]` dalam `overflow-x-auto`), `KeluarWorkspace` | Tergulir di dalam kartunya sendiri; tidak memecah halaman |

- **Tanpa koneksi.** Data khusus cloud (`hr_profil`, `hr_dokumen*`, `hr_sp`,
  `hr_keluar*`, rekrutmen, pelatihan, lampiran pengajuan, kartu "Perlu
  perhatian") dibaca command lewat `TursoClient`; `hris::tak_terhubung`
  (dipakai bersama oleh `hr_pengajuan`, `hr_keluar`, `hr_kinerja`,
  `hr_rekrutmen`, `hr_pelatihan`) hanya memetakan `TURSO_NOT_CONFIGURED` ke
  "Data ini hanya tersimpan di database pusat dan butuh koneksi ke database.".
  Jaringan putus menghasilkan `TURSO_NETWORK_ERROR` "Gagal menghubungi database
  Turso: <galat reqwest>", yang memuat alamat database. Di laptop kantor itu
  jarang; di HP HRD itu keadaan sehari-hari.
- **Yang berjalan offline di perangkat** (SQLite lokal + outbox): daftar
  karyawan, tab Kerja dan Kontrak, Struktur, Organisasi (`desktop_hr_org`,
  termasuk `atasan_siklus` yang dihitung dari SQLite), jenis pengajuan dan
  aturan cuti, jatah cuti, penilaian kinerja (draf; Ajukan menjalankan sinkron
  dulu, Q-72), pembayaran reimburse.
- **Navigasi Mobile**: menu `/menu` dibangun dari `NAVIGATION_GROUPS` dan
  membuang butir ber-`desktopSaja`; satu-satunya butir itu adalah HRIS (grup
  SDM), dan satu-satunya pembaca bendera itu adalah `mobile/src/app/menu/page.tsx`.
  Navigasi bawah tetap Beranda, Karyawan, Scanner, Riwayat, Menu. Halaman
  Mobile dijaga dengan `router.replace("/dashboard")` (static export tidak
  punya `/forbidden`), pola `mobile/src/app/pengajuan/page.tsx`, dan
  `useSearchParams` dibungkus `Suspense`. `KARYAWAN_SHORTCUT_AREAS` (pintasan di
  `/karyawan` Mobile) belum memuat `hris`.
- **Struktur hari ini** (`Struktur` di `HrisWorkspace.tsx`): daftar berjenjang
  menurut `id_atasan`, berindentasi, dipotong di kedalaman 12. Komentarnya
  menulis "dikelompokkan per cabang" dan §16.6 menjanjikan "per cabang/divisi",
  tetapi kodenya tidak mengelompokkan: cabang hanya teks di tiap baris.
  Karyawan nonaktif dibuang; bawahan yang atasannya nonaktif naik ke puncak
  **tanpa tanda**; karyawan dalam `atasan_siklus` naik ke puncak bertanda.
  Setiap karyawan tanpa atasan menjadi baris puncak, jadi di perusahaan yang
  baru mulai mengisi atasan, puncaknya hampir seluruh karyawan.
- **Data bagan sudah tersedia di ketiga versi tanpa bacaan baru**:
  `getDaftarKaryawan` (nama, `id_atasan`, `id_cabang`, `id_divisi`,
  `id_jabatan`, `divisi`, `jabatan_status`, `status_aktif`, `id_keluar`) dan
  `ambilOrganisasi` (`cabang`, `divisi`, `jabatan`, `atasan_siklus`), keduanya
  `employees.view`, lokal di Desktop/Mobile dan cloud di Web.
- **Pemakaian ulang yang tersedia**: `optimizeImageFile`
  (`lib/client/image-optimizer.ts`, `fit: "shrink"`, dipakai
  `PersonnelPhotoField` dan `inventory/Pengajuan`) untuk mengecilkan foto;
  `saveFileWithPicker` untuk PDF; `PengajuanWorkspace` punya salinan
  `bacaBase64` sendiri yang sama dengan `berkas.ts`.
- **Kartu "Perlu perhatian" di Mobile** (`/dashboard`) hari ini tanpa
  `onPilihKaryawan` dan `onBukaRekrutmen` (Q-124); Kinerja membuka
  `/pengajuan?tab=penilaian`. Beranda Web/Desktop sudah membuka
  `/hris?karyawan=<id>&tab=<tab>`, `/hris?tab=kinerja`, `/hris?tab=rekrutmen`,
  dan `HrisWorkspace` sudah membaca parameter itu.
- Skema sekarang: v42, sentinel `-2038`, `REQUIRED_TABLE_COUNT` 102, 68 tabel
  snapshot, 90 rute, command Desktop 302 / Mobile 308, 26 kejadian Telegram,
  5 bidang. Fase 8 dan 9 sudah di-commit, belum dirilis (Q-113).

### 25.2 Model data: tanpa perubahan skema

Versi tetap 42, sentinel tetap `-2038`, tanpa tabel, kolom, indeks, rute, izin,
atau command baru (Desktop 302 / Mobile 308). `storage.rs`, `sync.rs`, DDL
`turso.rs`, `db-schema.ts`, `db-migrations.ts`, `PROMOTION_PLAN`, dan skrip
audit tidak disentuh. Satu perubahan Rust kecil di luar skema: `tak_terhubung`
(§25.3). Bagan dibangun dari data yang sudah dibaca tab Struktur (§25.5).

### 25.3 HRIS di Mobile untuk HRD

**Rute dan navigasi**

- Halaman baru `mobile/src/app/hris/page.tsx` (milik Mobile, tidak disalin):
  `MobileAppShell`, guard `canAccessArea(user, "hris")` →
  `router.replace("/dashboard")`, `HrisWorkspace` di dalam `Suspense`. Area
  tetap `hris` = `employees.view`, sama dengan Web/Desktop.
- `desktopSaja` dibuang dari butir HRIS di `navigation.ts`; karena tidak ada
  pemakai lain, bendera dan saringannya di `menu/page.tsx` ikut dihapus. HRIS
  muncul di Menu grup SDM untuk setiap pemegang `employees.view` (HRD, Atasan,
  Admin), sama dengan menu Web/Desktop.
- `hris` ditambahkan ke `KARYAWAN_SHORTCUT_AREAS`, jadi `/karyawan` Mobile
  punya pintasan ke HRIS. Navigasi bawah tidak berubah (lima slot sudah penuh).
- `components/hris` pindah dari empat entri `filesToCopy` ke satu entri
  `dirsToCopy`; komponennya tetap satu sumber di `web-desktop/`.

**Tab yang ikut** (Q-126 sampai Q-128): semua tab `/hris` dan semua tab
rincian karyawan, dijaga izin yang sama, karena backend-nya sudah ada di biner
dan memeriksa ulang (aturan 10). Pengecualiannya hanya yang secara fisik tidak
bisa di HP:

| Bagian | Di Mobile | Catatan |
| :-- | :-- | :-- |
| Karyawan + kartu "Perlu perhatian" + rincian (Kerja, Pribadi, Keuangan, Kontrak, Dokumen, Cuti, SP, Kinerja, Pelatihan) | ya | Cabang/divisi/jabatan/atasan tetap diubah dari `/karyawan` (`IsianOrganisasi`, sudah ada di Mobile) |
| Struktur (bagan, §25.5) | ya | |
| Kinerja (Penilaian, Template) | ya, Q-128 | Tanpa `modeHp`: Kembalikan, Final, Koreksi, dan Template ikut, tetap dijaga peta `boleh` backend. `/pengajuan` tab Penilaian tetap `modeHp` |
| Keluar | ya | Berlakukan/Batalkan sensitif dan butuh koneksi (khusus cloud) |
| Rekrutmen (termasuk Jadikan karyawan) | ya | Jadikan karyawan menulis SQLite + outbox di HP, jalur yang sama dengan Desktop |
| Pelatihan | ya | |
| Organisasi (master, jenis pengajuan, aturan cuti, angka pengingat, masa simpan pelamar) | ya, Q-127 | Membalik bagian "pengaturan Web/Desktop" Q-52 |
| Cetak SP A4 | **tidak** (Q-131) | Tombol disembunyikan `!isMobileRuntime()`, pola `UpahPanel`. SP tetap bisa dibuat, dilihat, dan dicabut di HP |

**Mode HP**: tidak ada prop `modeHp` baru untuk tata letak; penyesuaian §25.4
berlaku menurut lebar layar (Web di browser HP ikut untung), dan
`isMobileRuntime()` hanya dipakai untuk dua hal yang memang khas WebView: cetak
dan cara membuka berkas. `KinerjaWorkspace` tidak meneruskan `modeHp` (Q-128).

**Tanpa koneksi**

- Tab yang lokal berjalan penuh offline seperti di Desktop (§25.1).
- Tab khusus cloud menampilkan pesan backend apa adanya. `tak_terhubung`
  diperluas: `TURSO_NETWORK_ERROR` juga dipetakan ke pesan "butuh koneksi ke
  database" yang sama, supaya HP tanpa sinyal tidak menampilkan galat reqwest
  berisi alamat database. Satu fungsi di `hris.rs` (disalin ke Mobile),
  berlaku untuk semua modul HR khusus cloud, juga di Desktop.
- Tidak ada cache data khusus cloud di HP. Menyimpannya berarti menaruh NIK,
  rekening, dan pindaian KTP di SQLite perangkat yang mudah hilang, melawan
  Q-30/Q-45.

**Q-124 dibuka** (Q-132): di `/dashboard` Mobile, kartu diberi tautan yang
sama dengan beranda Web/Desktop: nama → `/hris?karyawan=<id>&tab=<tab>`,
Kinerja → `/hris?tab=kinerja`, lowongan → `/hris?tab=rekrutmen`, masing-masing
hanya bila `canAccessArea(user, "hris")` dan izin tabnya dipegang. Tautan
Pengajuan ke `/pengajuan` tetap. Tanpa area `hris`, Kinerja tetap membuka
`/pengajuan?tab=penilaian` seperti sekarang.

### 25.4 Penyesuaian layar HP pada komponen bersama

Semua di `web-desktop/src/components/hris/`, berlaku untuk ketiga versi.

1. **Daftar atau rincian** di bawah `lg`: bila ada yang dipilih, daftar
   disembunyikan dan rincian tampil dengan tombol "Kembali ke daftar"
   (`lg:hidden`); di `lg` ke atas tetap dua kolom. Lima pemakai
   (`HrisWorkspace`, `KeluarWorkspace`, `RekrutmenWorkspace`,
   `PelatihanWorkspace`, `PenilaianKinerja`) memakai satu pembungkus kecil
   `DaftarRincian.tsx` di `components/hris/`, bukan lima salinan kelas.
   `PenilaianKinerja` di `/pengajuan` Mobile ikut membaik.
2. **Baris tab** `HrisWorkspace` dan `RincianKaryawan`: satu baris yang bisa
   digulir mendatar (`flex-nowrap overflow-x-auto`) di bawah `sm`, tetap
   `flex-wrap` di atasnya.
3. **Dialog bawaan browser diganti** (empat tempat, §25.1): hapus berkas dan
   hapus dokumen memakai `konfirmasiData` dengan baris yang akan dihapus;
   alasan batal penyesuaian cuti menjadi isian alasan di baris itu (pola
   pembatalan kontrak); galat Jadikan divisi masuk pesan galat panel. Dengan
   begitu tidak ada yang bergantung pada perilaku `window.confirm/prompt/alert`
   di WebView.
4. **Membuka berkas** (Q-129): `bukaBerkas` menjadi satu-satunya jalur
   (`PengajuanWorkspace.lihat` dan salinan `bacaBase64`-nya dibuang, memakai
   `berkas.ts`). Web/Desktop tetap tab baru. Mobile: gambar tampil di dialog
   pratinjau (`<img>` dari data URL, tanpa salinan di HP); PDF diserahkan ke
   `saveFileWithPicker` (SAF), dengan kalimat bahwa salinannya tersimpan di
   folder yang dipilih.
5. **Foto besar diperkecil sebelum diunggah** (Q-130): di `berkas.ts`, gambar
   yang melebihi 1 MB dikecilkan dengan `optimizeImageFile` (`fit: "shrink"`,
   sisi terpanjang 2000 px, JPEG), lalu dicoba sekali lagi dengan mutu lebih
   rendah; MIME ikut menjadi `image/jpeg`. PDF tidak disentuh dan tetap ditolak
   bila > 1 MB. Atribut `accept` tidak berubah, jadi pemilih Android tetap
   menawarkan kamera.
6. **Cetak SP** disembunyikan di Mobile (Q-131).

### 25.5 Bagan struktur organisasi (Web, Desktop, Mobile)

**Sumber data**: `getDaftarKaryawan` + `ambilOrganisasi` yang sudah dimuat
`HrisWorkspace` (§25.1). Lokal di Desktop/Mobile, jadi bagan jalan offline;
cloud di Web. Tidak ada command, kueri, atau tabel baru.

**Aturan susun** (fungsi murni `susunBagan` di `validations/hris-bagan.ts`,
disalin ke Mobile lewat `lib/validations`; tanpa kembaran Rust karena hanya
layar yang membacanya, pola label box inventaris), diuji `bun test`:

- Simpul = karyawan `status_aktif = 'Aktif'` (yang keluar sudah Nonaktif,
  §20.4). Induk = `id_atasan` bila atasannya ada dan aktif.
- Karyawan dalam `atasan_siklus` menjadi akar bertanda "Atasan membentuk
  lingkaran" (`LABEL_TANDA_HRIS.atasan_siklus`, seperti sekarang). Bawahan yang
  atasannya nonaktif atau tidak dikenal menjadi akar bertanda baru "Atasan
  nonaktif" (hari ini naik diam-diam).
- **Karyawan tanpa atasan DAN tanpa bawahan tidak digambar sebagai kotak**
  (Q-135): mereka masuk kelompok "Belum punya atasan" per divisi, terlipat,
  dengan jumlahnya. Akar bagan = yang punya bawahan, ditambah akar bertanda.
- Urutan anak stabil menurut nama (lalu `id_unik`); kedalaman dijaga 12 seperti
  sekarang, walaupun siklus sudah disingkirkan lebih dulu.
- Isi kotak: nama, jabatan (`jabatan_status`), divisi, cabang, dan jumlah
  bawahan langsung/total. Tidak ada NIK, kontak, foto, gaji, atau status
  kontrak; isinya persis yang tab Struktur tampilkan hari ini.

**Cara menggambar, tanpa dependensi baru**: kotak `div` + garis penghubung
dari border dan pseudo-element Tailwind (`before:`/`after:`), tanpa SVG,
canvas, atau paket bagan; warna dari kelas gelap yang sudah ada (tema terang
lewat `globals.css`/variabel seperti komponen lain). Tidak ada CSS baru di
`globals.css` kedua workspace. Komponen `BaganOrganisasi.tsx` di
`components/hris/`.

**Tampilan** (Q-133, usulan (b)):

- **Bagan** (bawaan di layar `lg` ke atas): pohon atas-ke-bawah. Dua tingkat
  pertama terbuka, sisanya terlipat dengan tombol "+n bawahan" per kotak.
  Simpul yang bawahan langsungnya lebih dari 8 menumpuk anaknya ke bawah
  (kolom), bukan ke samping, supaya lebar tetap terkendali. Lebar yang tersisa
  digulir di dalam kartu bagan (`overflow-x-auto`), tidak pernah menggulir
  halaman.
- **Fokus** (bawaan di bawah `lg`, termasuk HP): satu tingkat sekaligus. Di
  atas rantai atasan sampai akar (kotak ringkas, bisa ditekan), di tengah kotak
  terpilih, di bawahnya bawahan langsung dalam kisi 1–2 kolom. Menekan kotak
  bawahan turun satu tingkat; menekan rantai naik. Tanpa pilihan, yang tampil
  akar-akar bagan. Selalu muat di 360 px tanpa gulir mendatar.
- Keduanya bisa dipilih di semua lebar (dua tombol) dan memakai keluaran
  `susunBagan` yang sama.
- Kotak cari di atas bagan: memilih karyawan membuka Fokus padanya (di Bagan:
  membuka rantai sampai dia).
- Tombol "Lihat rincian" di kotak terpilih membuka tab Karyawan pada orang itu
  (`setDipilih`), memakai alur yang sudah ada.

**Menurut unit** (Q-134): tampilan ketiga di tab Struktur, Cabang → Divisi →
karyawan (nama, jabatan) dengan `<details>` bawaan HTML dan jumlah per
kelompok; "Tanpa cabang" dan "Tanpa divisi" di akhir. Ini yang §16.6 janjikan
dan belum dibangun.

**Batas ukuran**: Bagan menggambar paling banyak 400 kotak sekaligus; bila
lebih, tingkat yang terbuka dikurangi dan tampil "Bagan dipersempit, pakai
Fokus atau cari". Fokus dan Menurut unit tidak dibatasi (Fokus satu tingkat,
unit terlipat). Kelompok "Belum punya atasan" menampilkan 200 nama pertama per
divisi lalu "dan k lainnya" (pola `LIMIT 200` kartu).

**Daftar berjenjang lama** (Q-134): diganti Bagan + Fokus + Menurut unit, karena
Fokus menggantikan fungsinya di HP dan Bagan di laptop. Pilar 2.2 meminta
persetujuan sebelum menghapusnya.

### 25.6 Hak akses

- **Tidak ada izin baru.** `catalog.ts`, seed role Rust,
  `CONFIDENTIAL_PERMISSIONS`, `SENSITIVE_MUTATION_PERMISSIONS`, dan
  `rbac-migration.test.ts` tidak berubah.
- `/hris` Mobile dijaga area `hris` (`employees.view`); tiap tab dan tombol
  memeriksa izinnya sendiri persis seperti Web/Desktop, dan backend memeriksa
  ulang (aturan 10). Halaman di HP tidak membuka data yang tidak terbuka di
  laptop untuk izin yang sama.
- Bagan dan Menurut unit: `employees.view` (Q-136), data yang sama dengan tab
  Struktur hari ini.
- Konsekuensi yang perlu disadari (penanda §25.10): data rahasia
  (`hr.personal.*`, `hr.finance.*`, `hr.document.*`) kini bisa dibuka dari HP
  oleh pemegang izinnya.

### 25.7 Command, rute, dan layar

- **Rust**: hanya `tak_terhubung` di `hris.rs` (+ tes), disalin ke Mobile.
  Command tetap Desktop 302 / Mobile 308; tidak ada pendaftaran baru di
  `lib.rs`, `build.rs`, atau `capabilities/default.json`.
- **Web**: tanpa rute baru, tanpa perubahan `/api/hris*`.
- **Logika**: `validations/hris-bagan.ts` (`susunBagan`) + tes.
- **Layar** (`web-desktop/src/components/hris/`, disalin seluruhnya):
  `BaganOrganisasi.tsx` (Bagan, Fokus, Menurut unit) menggantikan `Struktur` di
  `HrisWorkspace`; `DaftarRincian.tsx` dipakai lima layar daftar–rincian; baris
  tab gulir; `berkas.ts` (pratinjau gambar Mobile, PDF lewat SAF, perkecil
  foto); `PengajuanWorkspace` memakai `berkas.ts`; dialog bawaan diganti di
  `RincianKaryawan`, `JatahCutiPanel`, `OrganisasiPanel`; tombol cetak SP
  disembunyikan di Mobile.
- **Mobile**: `mobile/src/app/hris/page.tsx`; `dirsToCopy` + `components/hris`
  (empat entri `filesToCopy` HRIS dibuang); `navigation.ts` tanpa
  `desktopSaja`, `KARYAWAN_SHORTCUT_AREAS` + `hris`; `menu/page.tsx` tanpa
  saringan `desktopSaja`; `dashboard/page.tsx` tautan kartu (Q-132).

### 25.8 Tidak dikerjakan di fase ini

- Cetak SP dari HP, dan ekspor/cetak bagan (gambar atau PDF) di versi mana pun:
  PDF butuh `jspdf` yang belum disetujui; cetak bagan lebar dari browser tidak
  bisa dijamin rapi.
- Cache data khusus cloud di HP untuk dibaca offline (§25.3).
- Pengaman tambahan untuk HP (PIN aplikasi, kunci layar data rahasia, keluar
  otomatis lebih cepat di Mobile).
- Foto personil di kotak bagan (`personil_foto` berat dan di luar snapshot).
- Bagan menurut jabatan resmi (posisi kosong, struktur rencana): bagan hanya
  menggambar orang dan atasannya yang tercatat.
- Mengubah atasan dari bagan (seret-lepas): tetap dari form karyawan.
- Rencana dan anggaran pelatihan (fase 11); pelaporan BPJS/DJP/Wajib Lapor dan
  berkas transfer bank (sesudah fase 11).

### 25.9 Langkah

| # | Langkah | Gerbang |
| :-- | :-- | :-- |
| 1 | **Aturan bagan**: `susunBagan` di `validations/hris-bagan.ts` (akar, siklus, atasan nonaktif, kelompok "Belum punya atasan", urutan, kedalaman 12, batas 400 kotak, rantai untuk Fokus). | `bun test src/lib/validations/hris-bagan.test.ts`: siklus dari dua perangkat, atasan nonaktif bertanda, tanpa atasan tanpa bawahan tidak jadi kotak, urutan stabil, rantai Fokus sampai akar, batas kotak |
| 2 | **Bagan di Web/Desktop**: `BaganOrganisasi.tsx` (Bagan, Fokus, Menurut unit, cari, Lihat rincian) menggantikan `Struktur`. | typecheck + Biome; dicoba di Desktop pada tema gelap dan terang |
| 3 | **Layar HP komponen bersama**: `DaftarRincian.tsx` di lima layar, baris tab gulir, dialog bawaan diganti, `berkas.ts` (buka dan perkecil), `PengajuanWorkspace` memakai `berkas.ts`, cetak SP disembunyikan di Mobile. | typecheck + Biome; Web dicoba di lebar 360 px (devtools) |
| 4 | **Rust**: `tak_terhubung` memetakan `TURSO_NETWORK_ERROR`. | `cargo test hris` Desktop dan Mobile (tes baru: kedua kode menjadi pesan yang sama, kode lain diteruskan) |
| 5 | **Mobile**: `components/hris` ke `dirsToCopy`, `app/hris/page.tsx`, `desktopSaja` dibuang, pintasan `hris`, tautan kartu di `/dashboard`. | `bun run sync:mobile`, typecheck + Biome Mobile, `audit:contract` (302/308 tetap, tidak ada command hantu dari gateway yang kini dipakai layar Mobile) |
| 6 | Bagian `CLAUDE.md` "HRIS fase 10" (dan kalimat "Mobile tidak punya `/hris`" di fase 8/9 serta "`desktopSaja` di menu" di fase 1); catatan "Sudah dibangun" §25.13. | `audit:docs`; `bun run check` penuh oleh pemilik; uji HP (daftar di §25.10) oleh pemilik |

### 25.10 Penanda yang ditinjau pemilik saat menyetujui

- **Tanpa perubahan skema, command, rute, atau izin**: perangkat lama tetap
  sinkron; yang membedakan build hanya layarnya. HP HRD butuh APK baru.
- **Q-43 dibalik**, dan bila Q-127/Q-128 disetujui juga bagian "pengaturan
  Web/Desktop" Q-52 dan "Final dan template Web/Desktop" Q-72 untuk `/hris`.
  `/pengajuan` tab Penilaian di HP tetap tanpa Kembalikan/Final/Koreksi.
- **Data rahasia di HP**: NIK, KK, rekening, NPWP, BPJS, dan pindaian dokumen
  bisa dibuka dari HP pemegang izinnya. Tidak tersimpan di SQLite HP (khusus
  cloud), tetapi tampil di layar, dan PDF yang dibuka tersalin ke folder
  pilihan pengguna. HP yang hilang dalam keadaan login = sesi yang terbuka.
- **HRIS muncul di Menu HP untuk semua pemegang `employees.view`** (Atasan dan
  Admin juga), sama dengan Web/Desktop; isi tabnya tetap menurut izin.
- **Tab khusus cloud butuh sinyal**; tanpa sinyal pesannya "butuh koneksi ke
  database", kini juga untuk jaringan putus (di Desktop juga).
- **Foto diperkecil otomatis** di ketiga versi: berkas gambar yang tersimpan
  bisa lebih kecil resolusinya dan PNG menjadi JPEG. PDF > 1 MB tetap ditolak.
- **Cetak SP hanya Web/Desktop.**
- **Bagan**: karyawan nonaktif dan keluar tidak digambar; bawahan yang atasannya
  nonaktif tampil sebagai akar bertanda "Atasan nonaktif"; karyawan tanpa atasan
  dan tanpa bawahan hanya di kelompok "Belum punya atasan". Daftar berjenjang
  lama hilang (Q-134).
- **Lampiran pengajuan di Mobile berubah cara bukanya** (sudah di Mobile sejak
  fase 2 tetapi belum pernah diuji di HP).
- **Uji HP yang dibutuhkan** (ditunda pemilik sampai semua fase selesai):
  pemilih berkas dan kamera dari `<input type="file">`, foto kamera diperkecil
  di bawah 1 MB, pratinjau gambar, PDF lewat SAF, bagan Fokus dan gulir Bagan
  di dalam `PullToRefresh`, pesan tanpa sinyal di tab khusus cloud, Jadikan
  karyawan dari HP, Berlakukan keluar dari HP, tautan kartu `/dashboard` ke
  `/hris`.

### 25.11 Pertanyaan untuk pemilik

| No | Pertanyaan | Usulan | Alasan |
| :-- | :-- | :-- | :-- |
| Q-125 | Fase 10 dirilis bersama fase 8 dan 9 (keduanya sudah di-commit, belum dirilis), atau fase 8+9 dirilis dulu? | (a) bersama | Tidak ada ketergantungan teknis: fase 10 tanpa skema dan tanpa perubahan Telegram. Tetapi semua perangkat memang harus diperbarui untuk fase 8/9, HP HRD butuh APK baru untuk fase 10, dan uji HP yang ditunda cukup satu putaran. Pilih (b) bila pengingat Telegram HRD ingin berjalan lebih cepat |
| Q-126 | Tab mana yang ikut ke `/hris` Mobile? | Semua tab dan semua tab rincian, dijaga izin yang sama; hanya cetak SP yang tidak (Q-131) | "HRD harus bisa bekerja di laptop maupun HP" (§15.1). Backend semuanya sudah di biner Mobile; memotong tab hanya membuat HRD kembali ke laptop untuk hal tertentu |
| Q-127 | Tab Organisasi (master cabang/divisi/jabatan, jenis pengajuan, aturan cuti, angka pengingat, masa simpan pelamar) di HP? Q-52 dulu menaruh pengaturan pengajuan di Web/Desktop | Ya | Isinya formulir biasa yang dikonfirmasi `konfirmasiData` dan berjalan offline lewat outbox. Alternatif: hanya baca di HP |
| Q-128 | Di `/hris` Mobile, Kembalikan, Final, Koreksi, dan Template kinerja ikut (Q-72 menaruhnya di Web/Desktop)? | Ya untuk `/hris`; `/pengajuan` tab Penilaian tetap `modeHp` | Q-72 dibuat untuk atasan yang menilai dari HP. Final tetap butuh `hr.performance.finalize` (HRD), dan backend menolak bagi yang lain. Bila Final dianggap perlu layar lebar, `KinerjaWorkspace` meneruskan `modeHp` di Mobile |
| Q-129 | Membuka berkas (dokumen, nota, CV, sertifikat) di HP: (a) semua lewat simpan SAF; (b) gambar dipratinjau di layar, PDF lewat SAF; (c) gambar dipratinjau, PDF tidak bisa dibuka di HP? | (b) | Kebanyakan berkas adalah foto (KTP, nota). (a) meninggalkan salinan KTP di folder HP setiap kali dilihat. (c) tanpa salinan sama sekali, tetapi kontrak dan ijazah PDF tidak terbaca dari HP |
| Q-130 | Foto yang lebih dari 1 MB diperkecil otomatis sebelum diunggah, di ketiga versi? | Ya, hanya gambar; PDF tetap ditolak bila > 1 MB | Foto kamera HP 2–5 MB selalu ditolak batas 1 MB hari ini. Memperkecil di semua versi berarti satu jalur tanpa cabang khusus Mobile. Batas 1 MB tidak dinaikkan karena berkas disimpan base64 di cloud |
| Q-131 | Cetak SP di HP | Disembunyikan (pola surat jalan dan tanda terima upah) | WebView Android tidak punya dialog cetak; PDF butuh dependensi yang belum disetujui |
| Q-132 | Q-124 dibuka: nama di kartu "Perlu perhatian" Mobile bisa diklik ke `/hris?karyawan=<id>&tab=<tab>`, Kinerja ke `/hris?tab=kinerja`, lowongan ke `/hris?tab=rekrutmen`? | Ya, sama dengan beranda Web/Desktop | Alasan Q-124 (tidak ada `/hris` di Mobile) hilang di fase ini. Tanpa area `hris`, Kinerja tetap ke `/pengajuan?tab=penilaian` |
| Q-133 | Tampilan bagan: (a) satu pohon atas-ke-bawah di semua versi, digulir mendatar di HP; (b) pohon di laptop + Fokus (satu tingkat: rantai atasan, kotak terpilih, bawahan langsung) sebagai bawaan di HP, keduanya bisa dipilih; (c) Fokus saja di semua versi? | (b) | Pohon tiga tingkat dengan enam bawahan per orang ±1.000 px; di HP 360 px itu berarti menggulir dua arah di dalam `PullToRefresh`. Fokus selalu muat, dan di laptop pohon penuh adalah yang dimaksud "bergambar" (§15). Keduanya dari satu `susunBagan` |
| Q-134 | Tab Struktur: Bagan + Fokus + Menurut unit (cabang → divisi, terlipat), dan daftar berjenjang lama dihapus? | Ya | Menurut unit adalah janji §16.6 yang belum dibangun. Daftar lama digantikan Fokus di HP dan Bagan di laptop; menyimpannya berarti tiga cara melihat hierarki yang sama |
| Q-135 | Karyawan tanpa atasan dan tanpa bawahan: kotak di baris puncak, atau kelompok terlipat "Belum punya atasan" per divisi? | Kelompok terlipat | Selama atasan belum diisi, hampir semua karyawan tanpa atasan; sebagai kotak puncak mereka menenggelamkan struktur yang sudah ada. Kelompok itu juga menunjukkan siapa yang belum diisi atasannya |
| Q-136 | Siapa yang melihat bagan? | `employees.view`, sama dengan tab Struktur | Isinya nama, jabatan, divisi, cabang, dan atasan: data yang sudah terbuka dengan izin itu. Izin baru menambah peran tanpa melindungi data baru |

### 25.12 Jawaban fase 10 (13 Nov 2026)

Semua jawaban sesuai usulan §25.11, dan penanda §25.10 disetujui, jadi isi
§25.2–§25.10 tidak berubah. Dengan Q-134, penghapusan daftar berjenjang lama
disetujui (pilar 2.2).

| No | Pertanyaan | Jawaban |
| :-- | :-- | :-- |
| Q-125 | Rilis fase 10 | (a) bersama fase 8 dan 9 |
| Q-126 | Tab di `/hris` Mobile | Semua tab dan tab rincian, dijaga izin yang sama; kecuali cetak SP |
| Q-127 | Tab Organisasi di HP | Ya (membalik bagian pengaturan Q-52) |
| Q-128 | Kembalikan, Final, Koreksi, Template di `/hris` Mobile | Ya; `/pengajuan` tab Penilaian tetap `modeHp` |
| Q-129 | Membuka berkas di HP | (b): gambar dipratinjau di layar, PDF lewat SAF |
| Q-130 | Foto > 1 MB diperkecil otomatis | Ya, di ketiga versi, hanya gambar; PDF > 1 MB tetap ditolak |
| Q-131 | Cetak SP di HP | Disembunyikan |
| Q-132 | Klik nama di kartu Mobile (Q-124 dibuka) | Ya: `/hris?karyawan=<id>&tab=<tab>`, `/hris?tab=kinerja`, `/hris?tab=rekrutmen`; tanpa area `hris` Kinerja tetap ke `/pengajuan?tab=penilaian` |
| Q-133 | Tampilan bagan | (b): Bagan di laptop + Fokus sebagai bawaan di HP, keduanya bisa dipilih |
| Q-134 | Tab Struktur | Bagan + Fokus + Menurut unit; daftar berjenjang lama dihapus |
| Q-135 | Karyawan tanpa atasan dan tanpa bawahan | Kelompok terlipat "Belum punya atasan" per divisi |
| Q-136 | Yang melihat bagan | `employees.view`, tanpa izin baru |

### 25.13 Sudah dibangun (13 Nov 2026)

Langkah 1–6 dibangun tanpa perubahan skema (versi 42, sentinel `-2038`, 68
tabel snapshot, 90 rute, command Desktop 302 / Mobile 308, tanpa izin baru).
Gerbang yang dijalankan: `bun test validations/hris-bagan.test.ts` 13 lulus di
Web/Desktop dan Mobile, `validations/hris.test.ts` 11 lulus; `cargo test hris`
Desktop dan Mobile 12 lulus (termasuk `tak_terhubung_menyamakan_pesan_tanpa_koneksi`);
typecheck dan Biome kedua workspace bersih; `audit:contract` dan `audit:docs`
lulus. `bun run check` penuh belum dijalankan (pemilik). Layar belum dicoba di
aplikasi yang berjalan: gerbang "dicoba di Desktop pada tema gelap dan terang"
(langkah 2) dan "Web di lebar 360 px" (langkah 3) belum dilakukan, begitu pula
uji HP §25.10.

Penyimpangan dan catatan, untuk ditinjau:

- **`berkas.ts` menjadi `berkas.tsx`**, karena dialog pratinjau gambar Mobile
  butuh JSX. Jalur impornya tidak berubah; rujukan `berkas.ts` di §25.1–§25.9
  berarti berkas ini.
- **`siapkanBerkas`** adalah nama fungsi yang membaca dan memperkecil berkas
  untuk keempat unggahan (dokumen, CV, sertifikat, lampiran pengajuan). Foto
  yang diperkecil berganti nama menjadi `<nama>.jpg`. Bila mutu 0,7 pun masih
  > 1 MB, berkasnya tetap dikirim dan backend yang menolaknya.
- **PDF di Mobile**: nama berkas diberi `.pdf` bila tidak berekstensi; menutup
  dialog SAF tanpa pesan, gagal menyimpan "Berkas gagal disimpan.".
- **Konfirmasi hapus berkas/dokumen** memakai `konfirmasiData` apa adanya, jadi
  pertanyaannya tetap "Apakah data yang dicatat sudah benar?" dengan baris
  "Hapus berkas"/"Hapus dokumen" bertanda peringatan. Bila kalimatnya terasa
  janggal untuk hapus, perlu dialog konfirmasi hapus tersendiri.
- **Alasan batal penyesuaian cuti** selalu tampil sebagai isian di setiap
  baris yang masih bisa dibatalkan (pola pembatalan kontrak); tombol Batalkan
  baru aktif setelah alasan diisi.
- **`DaftarRincian` saat belum ada pilihan**: kolom rincian tetap tampil di
  bawah daftar di HP (teks "Pilih ...", panel Alasan di Keluar, tombol retensi
  di Rekrutmen), karena bagian itu hanya ada di kolom tersebut. Memilih di
  bawah `lg` menggulir halaman ke awal rincian.
- **Lingkaran atasan dihitung ulang** dari karyawan aktif dan digabung dengan
  `atasan_siklus`, supaya bagan tidak berputar walaupun organisasi belum
  termuat. Lingkaran yang melibatkan karyawan nonaktif tidak ditandai
  lingkaran: bawahannya tampil "Atasan nonaktif".
- **Label "Atasan nonaktif"** ditambahkan ke `LABEL_TANDA_HRIS`
  (`atasan_nonaktif`), bukan peta label kedua.
- **`kelompokUnit`** (Menurut unit) ditulis dan diuji bersama `susunBagan` di
  langkah 1. Kelompok divisi memakai teks `master_data.divisi`, kelompok
  cabang nama master cabang.
- **Urutan nama** tidak membedakan huruf besar/kecil (`localeCompare` `id`,
  `sensitivity: "base"`), lalu `id_unik`.
- **Batas 400 kotak**: tingkat bawaan dikurangi lebih dulu; bila akar saja
  sudah > 400, atau kotak yang dibuka pengguna melewati batas, pengisian
  berhenti per tingkat (tingkat atas utuh) dan kotak yang anaknya terpotong
  bertuliskan "n tidak digambar".
- **Memilih orang** dari cari, kelompok "Belum punya atasan", atau Menurut unit:
  di Bagan rantainya dibuka dan kotaknya digulir ke tengah; bila orang itu
  tidak ada di pohon, atau sedang di Menurut unit, tampilan pindah ke Fokus.
  Kelompok "Belum punya atasan" tampil di bawah Bagan dan Fokus, tidak di
  Menurut unit (yang sudah memuat semua orang).
- **Tautan Kinerja di `/dashboard` Mobile** butuh area `hris` dan salah satu
  dari empat izin `hr.performance.*` (sama dengan beranda Web/Desktop); tanpa
  itu tetap ke `/pengajuan?tab=penilaian` bila area `pengajuan` dan izin
  `assess`/`view` dipegang.
- **`hris` di urutan pertama** `KARYAWAN_SHORTCUT_AREAS`.
- **`tak_terhubung` mempertahankan kode** (`TURSO_NETWORK_ERROR` tetap
  `TURSO_NETWORK_ERROR`), hanya pesannya yang disamakan.
- **SKILL.md tidak disunting**: fase ini tanpa tabel, rute, atau command baru.

## 26. Urutan pengerjaan fase 11

**Disetujui pemilik (13 Nov 2026).** Ditulis setelah menelusuri kode (13 Nov
2026); jawaban Q-137 sampai Q-149 di §26.12, semuanya sesuai usulan. Isinya
butir terakhir §15.1 "Urutan fase yang berlaku": rencana dan anggaran
pelatihan (memperluas Q-26, yang di fase 7 dijawab "riwayat + sertifikat").
Bila §11.2, §15, §22.7, atau §22.10 dan bagian ini berbeda, **bagian ini yang
berlaku**.

### 26.1 Temuan dari kode

- **Pelatihan hari ini** (`hr_pelatihan.rs` ↔ `validations/hr-pelatihan.ts` +
  `services/hr-pelatihan.ts`, teks SQL kembar): `hr_pelatihan` menyimpan
  `nama`, `penyelenggara`, `tanggal_mulai`, `tanggal_selesai`, `lokasi`,
  `biaya` (INTEGER 0–1.000.000.000, satu total per pelatihan, Q-98),
  `keterangan`, jejak ubah, dan pembatalan sebagai kolom. **Tidak ada kolom
  divisi, cabang, periode, atau tautan rencana.** Status (`status_pelatihan` ↔
  `statusPelatihan`) diturunkan dari tanggal dan `dibatalkan_pada` terhadap
  tanggal WIB jam database (`hari_ini_cloud` ↔ `wibToday`).
- **Periode yang sudah dipakai layar adalah tahun kalender**:
  `DAFTAR_PELATIHAN_SQL` menyaring `strftime('%Y', l.tanggal_mulai) = ?1`, dan
  pemilih tahun `PelatihanWorkspace` menawarkan tahun depan sampai empat tahun
  ke belakang, jadi rencana tahun depan sudah bisa dipilih tanpa mengubah
  pemilihnya. Daftar memuat pelatihan yang dibatalkan; riwayat karyawan
  (`RIWAYAT_SQL`) tidak.
- **Biaya tidak pernah dibaca selain untuk ditampilkan.** Rincian menampilkan
  "±<biaya / jumlah peserta> per peserta" (pembagian tampilan, tidak disimpan).
  Tidak ada jurnal, status bayar, atau ringkasan biaya per tahun di mana pun.
- **Peserta tidak menyimpan divisinya.** `PESERTA_SQL` membaca
  `master_data.divisi` saat ini. Tidak ada riwayat perpindahan divisi di repo
  (`hr_kontrak` tanpa kolom organisasi, `master_data.id_divisi`/`divisi` =
  keadaan sekarang). Realisasi per divisi yang dihitung dari divisi peserta
  akan berpindah sendiri bila karyawannya pindah divisi.
- **Tidak ada konsep anggaran di repo.** Pencarian "anggaran"/"budget" hanya
  menemukan kata "pelanggaran". Dua pola terdekat:
  - `hr_jenis_pengajuan.batas_bulanan` (fase 4): angka pada baris master,
    jumlah dihitung di kode (`lewat_batas` ↔ `lewatBatas`), hasilnya **tanda,
    tidak menolak**. Pola tanda yang sama dipakai stok minus inventaris dan
    kuota lowongan (`lewat_kuota`).
  - `BATAS_PENGATURAN` (`hris.rs` ↔ `validations/hris.ts`, 12 kunci): satu
    angka per kunci di `setting_gex_system`, tersinkron ke semua perangkat
    termasuk terminal scanner. Cocok untuk satu angka perusahaan, tidak untuk
    pagu per divisi per tahun.
- **Pembukuan**: `keu_jurnal.sumber` CHECK berisi `Manual, Kasbon, Payroll,
  Inventaris, Cicilan, Pembatalan`; `keu_jurnal`, `keu_jurnal_baris`, dan
  `keu_akun` tersinkron. Sumber jurnal baru berarti membangun ulang CHECK di
  keempat lapis, dan perangkat yang belum diperbarui gagal menarik snapshot
  begitu ada jurnal bersumber baru (preseden v28). Bagan akun bawaan
  (`akun-bawaan.json`) **tidak punya akun Beban Pelatihan**: beban 5-1100
  sampai 5-1900, yang terdekat Beban Lain-lain 5-1900; kode 5-1660 masih
  kosong.
- **Divisi tersinkron dan ada di cloud** (`hr_divisi`, id `div-…`), jadi tabel
  khusus cloud bisa membaca nama divisi hidup lewat `LEFT JOIN` (Q-12), dan
  kunci `umum` tidak mungkin bertabrakan dengan id divisi.
- **Naik skema terjadi dari panggilan pertama.** Setiap command HR khusus cloud
  memanggil `hris::siap` → `ensure_schema_current`, yang menjalankan
  `ensure_schema` bila sentinel terbaru belum ada. Perangkat v43 pertama yang
  membuka tab Pelatihan (atau Web yang dideploy) menaikkan cloud ke v43, dan
  sejak itu perangkat v42 berhenti sinkron (`SCHEMA_VERSION_OUTDATED`). Build
  v42 tetap bisa memanggil command pelatihannya sendiri (sentinel `-2038`-nya
  ada), dan `UBAH_PELATIHAN_SQL` lamanya tidak menyentuh kolom baru.
- **Mobile sudah ikut tanpa kerja tambahan**: sejak fase 10 `components/hris`
  disalin utuh (`dirsToCopy`), `hr_pelatihan.rs` ada di daftar salin
  `sync-rust-modules.ts`, dan salinan Mobile `PelatihanWorkspace.tsx` serta
  `hr_pelatihan.rs` identik dengan sumbernya. Komponen baru di
  `components/hris/` ikut ke Mobile dengan sendirinya. Kalimat §22.9
  "Web/Desktop saja" sudah tidak berlaku (CLAUDE.md "HRIS fase 7" sudah menulis
  "Mobile ikut sejak fase 10").
- **RBAC**: `hr.training.view` dan `hr.training.manage` biasa (bukan sensitif,
  bukan rahasia), ikut paket HRD dan Admin; sort order seed Rust 1626 dan 1627,
  jadi izin baru (bila ada) 1628.
- **Command dan rute**: lima command `desktop_hr_training*` (`commands.rs`,
  baca dijaga `IZIN_PELATIHAN_BACA`, tulis `hr.training.manage`); rute
  `POST /api/hris/training` dengan peta `IZIN` per aksi, body 8 MB, `tahun`
  sudah divalidasi Zod 2000–2100.
- **Fase 10 di working tree**: dalam lingkup yang ditelusuri (modul pelatihan,
  gateway, `PelatihanWorkspace`, tab Pelatihan rincian, salinan Mobile) tidak
  ditemukan yang salah.
- Skema sekarang: v42, sentinel `-2038`, `REQUIRED_TABLE_COUNT` 102, 68 tabel
  snapshot, 90 rute, command Desktop 302 / Mobile 308.

### 26.2 Model data (skema v43, sentinel `-2039` `hris-pelatihan-rencana-v1`)

**Tanpa perubahan skema ditimbang dan ditolak** (Q-138): pagu dan rencana di
`setting_gex_system` berarti angka anggaran tersinkron ke setiap terminal
scanner, rencana (nama, divisi, bulan, estimasi) dipaksa menjadi teks JSON di
satu kunci, dan tidak ada tempat menautkan pelatihan ke rencananya.

**Dua tabel baru, khusus cloud** (pola Q-87: induknya `hr_pelatihan` khusus
cloud, layarnya sudah butuh koneksi, tidak ada pemakai offline). Hanya
`turso.rs` + `db-schema.ts`/`db-migrations.ts`; tidak di `storage.rs`, tidak di
`SNAPSHOT_TABLES`/`SNAPSHOT_SOURCES`, tanpa outbox dan rute kanonik (aturan
42). Tanpa `UNIQUE` selain PK.

| Tabel | Kolom |
| :-- | :-- |
| `hr_pelatihan_anggaran` | `id_anggaran` PK = `<tahun>:<id_divisi>` atau `<tahun>:umum` (deterministik: dua sesi yang mengisi pagu yang sama menulis baris yang sama, yang terakhir menang); `tahun` INTEGER NOT NULL CHECK 2000–2100; `id_divisi` (kosong = Umum); `nominal` INTEGER NOT NULL CHECK `nominal >= 0` (aturan 13); `catatan`; `dicatat_oleh` NOT NULL, `created_at`; `diubah_oleh`, `diubah_pada`. Indeks `tahun` |
| `hr_pelatihan_rencana` | `id_rencana` PK (`rcn-<acak>`); `tahun` INTEGER NOT NULL CHECK 2000–2100; `nama` NOT NULL; `id_divisi` (kosong = Umum); `bulan` INTEGER CHECK (`bulan IS NULL OR bulan BETWEEN 1 AND 12`); `peserta_rencana` INTEGER NOT NULL DEFAULT 0 CHECK `peserta_rencana >= 0`; `biaya_rencana` INTEGER NOT NULL DEFAULT 0 CHECK `biaya_rencana >= 0`; `penyelenggara`; `keterangan`; `dicatat_oleh` NOT NULL, `created_at`; `diubah_oleh`, `diubah_pada`; `dibatalkan_oleh`, `dibatalkan_pada`, `alasan_batal`. Indeks `tahun` |

**Satu kolom baru** `hr_pelatihan.id_rencana` TEXT (kosong = di luar rencana):
`CREATE TABLE` untuk database baru, `ensure_column` (`turso.rs`) dan
`hasColumn` (`db-migrations.ts`) untuk database lama; indeks
`idx_hr_pelatihan_rencana` dibuat SESUDAH kolomnya dipastikan ada (sesudah loop
`ensure_column` di Rust; di blok v43 `db-migrations.ts` langsung sesudah
`hasColumn`, pola `idx_hr_pengajuan_tukar` v38; aturan 20).

- Kedua jalur: `CURRENT_SCHEMA_VERSION`/`CLIENT_SCHEMA_VERSION` 43 (Desktop DAN
  Mobile), sentinel `-2039` di INSERT dan di `ensure_schema_current` (aturan
  21), `REQUIRED_TABLE_COUNT` 104, `isDatabaseSchemaReady` + 2 nama,
  `schema-consistency.test.ts` + 2, daftar tabel khusus cloud
  `audit-sync-contract.ts` + 2 (pengetatan), `PROMOTION_PLAN` + 2 dengan urutan
  `hr_pelatihan_anggaran`, `hr_pelatihan_rencana` → `hr_pelatihan` (kini
  `dependsOn` rencana) → `hr_pelatihan_peserta`.
- `CLOUD_MIRRORED_TABLES`, `storage.rs`, `sync.rs` (kecuali
  `CLIENT_SCHEMA_VERSION`), `apply_event_to_turso`, dan `CANONICAL_SYNC_ROUTES`
  tidak disentuh: tetap 68 tabel snapshot dan 90 rute. Tidak ada yang dibuang
  saat pindah database karena tidak ada salinan di perangkat.
- Tanpa seed. Tidak ada pengaturan baru di `BATAS_PENGATURAN`.
- **Perangkat lama**: tidak ada rute atau tabel snapshot yang tidak dikenalnya,
  tetapi begitu cloud v43, perangkat v42 berhenti sinkron sampai diperbarui
  (§26.1). Pelatihan yang diubah dari build v42 mempertahankan `id_rencana`
  karena SQL lamanya tidak menulis kolom itu.

### 26.3 Rencana pelatihan

**Isian** (`validasi_rencana` ↔ `validasiRencana`, Q-144): `tahun` 2000–2100;
`nama` 1–100 (spasi dirapikan seperti `validasi_pelatihan`); divisi opsional
(kosong = Umum; bila diisi harus ada dan aktif saat disimpan, kecuali nilainya
tidak berubah, pola lowongan §22.15); `bulan` opsional 1–12; `peserta_rencana`
0–9.999; `biaya_rencana` 0–1.000.000.000 (`MAKS_BIAYA` yang sama);
`penyelenggara` ≤ 100; `keterangan` ≤ 2.000.

**Tautan ke pelatihan**:

- Satu rencana bisa terlaksana lewat beberapa pelatihan (misalnya dua
  gelombang); satu pelatihan paling banyak satu rencana
  (`hr_pelatihan.id_rencana`).
- Diisi dari form pelatihan (pemilih `PilihCari` berisi rencana tidak batal di
  tahun `tanggal_mulai`). `validasi_pelatihan` ↔ `validasiPelatihan` menerima
  `id_rencana`; `simpan` memeriksa di cloud: rencana ada, tidak dibatalkan, dan
  `tahun` = tahun `tanggal_mulai` (`PESAN_RENCANA_TAHUN`). Mengubah tanggal
  pelatihan yang tertaut ke tahun lain ditolak dengan pesan yang sama; lepas
  tautannya dulu. Kosong = lepas.
- `INSERT_PELATIHAN_SQL` dan `UBAH_PELATIHAN_SQL` mendapat kolom `id_rencana`
  (teks kembar, diperiksa harfiah).

**Status rencana tidak disimpan** (`status_rencana` ↔ `statusRencana`, tanggal
WIB jam database, dinilai berurutan):

1. `Dibatalkan`: `dibatalkan_pada` terisi.
2. `Terlaksana`: ada pelatihan tertaut tidak batal yang `Selesai`.
3. `Berlangsung`: ada yang `Berlangsung`.
4. `Dijadwalkan`: ada yang `Dijadwalkan`.
5. `Terlewat`: tanpa pelatihan tertaut yang tidak batal, dan tahun rencana
   sudah lewat, atau `bulan` terisi dan bulan itu sudah lewat.
6. `Belum dijadwalkan`.

**Batal**: kolom, alasan wajib, sekali (pola `validasi_batal_pelatihan`);
ditolak selama masih ada pelatihan tertaut yang tidak dibatalkan
(`PESAN_RENCANA_TERTAUT`, pola "lepas peserta bersertifikat ditolak"). Rencana
tidak dihapus. Selama tidak batal semua isian boleh diubah; tahun tidak bisa
diubah selama ada pelatihan tertaut.

**Tanpa alur persetujuan** (Q-144): rencana adalah catatan HRD, bukan
pengajuan yang di-ACC.

### 26.4 Anggaran dan realisasi

**Pagu** (Q-140): satu angka per tahun per divisi, ditambah satu pagu "Umum"
per tahun untuk pelatihan yang tidak dibebankan ke divisi. Total pagu
perusahaan = jumlah semua pagu tahun itu; tidak ada pagu perusahaan terpisah
yang bisa bertentangan dengan jumlahnya. `validasi_pagu` ↔ `validasiPagu`:
`nominal` 0–100.000.000.000 (`MAKS_PAGU`, masih aman di `i64` dan `Number`),
`catatan` ≤ 1.000, divisi aktif saat pagu baru dibuat. Simpan = upsert berid
`<tahun>:<id_divisi|umum>`. **Hapus pagu** menghapus barisnya (tabel khusus
cloud, tidak ada perangkat yang menghidupkannya kembali). Pagu 0 berbeda dari
tanpa pagu: 0 berarti "tidak dianggarkan", tanpa baris berarti "belum diisi".
Tanpa riwayat revisi (Q-149): yang tersimpan hanya `diubah_oleh/pada`
terakhir.

**Beban divisi pelatihan** (Q-141 (a)): divisi rencana yang ditautkan.
Pelatihan tanpa rencana dibebankan ke Umum dan tampil di baris "Di luar
rencana". Tidak ada kolom divisi di `hr_pelatihan`, dan biaya tidak dibagi
menurut divisi peserta (§26.1: divisi peserta bergeser bila karyawannya
pindah).

**Realisasi** (Q-142), dari `hr_pelatihan.biaya` yang tidak dibatalkan, tahun
= tahun `tanggal_mulai`:

| Angka | Isi |
| :-- | :-- |
| Pagu | baris `hr_pelatihan_anggaran` |
| Direncanakan | Σ `biaya_rencana` rencana yang tidak dibatalkan |
| Terikat | Σ `biaya` pelatihan `Dijadwalkan` |
| Terpakai | Σ `biaya` pelatihan `Berlangsung` dan `Selesai` |
| Sisa | Pagu − Terikat − Terpakai (boleh minus) |

- Per kelompok (setiap divisi yang punya pagu, rencana, atau pelatihan
  tertaut, ditambah Umum) dan total tahun. Per rencana: estimasi
  (`biaya_rencana`) dibanding jumlah biaya pelatihan tertautnya, dan jumlah
  peserta rencana dibanding jumlah peserta sebenarnya.
- Dihitung di kode oleh fungsi murni `ringkas_anggaran` ↔ `ringkasAnggaran`
  (vektor uji sama), dari tiga bacaan polos bertahun: `PAGU_SQL`,
  `RENCANA_SQL`, `REALISASI_SQL` (pelatihan tahun itu: id, `id_rencana`,
  tanggal, `biaya`, `dibatalkan_pada`, jumlah peserta). SQL kembar diperiksa
  harfiah. Uang hanya dijumlahkan sebagai bilangan bulat; tidak ada pembagian
  yang disimpan.
- **Tanda, tidak menolak** (Q-143, pola `lewat_batas`, stok minus,
  `lewat_kuota`): `lewat_pagu` (Terikat + Terpakai > Pagu),
  `rencana_lewat_pagu` (Direncanakan > Pagu), `tanpa_pagu` (ada realisasi
  tetapi tidak ada baris pagu), dan per rencana `lewat_estimasi` (realisasi >
  `biaya_rencana`). Form pelatihan menampilkan sisa pagu kelompoknya sebelum
  disimpan dan memperingatkan bila simpanan itu melewatinya, lalu tetap
  menyimpan.
- Pelatihan yang dibatalkan otomatis keluar dari realisasi; status yang
  berganti karena tanggal (Dijadwalkan → Berlangsung) memindahkan biayanya dari
  Terikat ke Terpakai tanpa tulisan apa pun.

### 26.5 Pembukuan

- **Tetap jurnal manual** (Q-146, preseden Q-31 dan Q-98): tidak ada sumber
  jurnal baru, CHECK `keu_jurnal.sumber` tidak disentuh, tidak ada status
  "sudah dibayar", dan tidak ada akun bawaan baru. Pemilik yang ingin
  memisahkan beban pelatihan membuat akun "Beban Pelatihan" sendiri di bagan
  akun.
- **Realisasi = biaya yang dicatat di pelatihan**, bukan uang yang tercatat di
  jurnal. Keduanya bisa berbeda (penanda §26.10). Membaca realisasi dari jurnal
  butuh tautan jurnal ↔ pelatihan yang hari ini tidak ada.

### 26.6 Hak akses

- **Tanpa izin baru** (Q-145): membaca rencana, pagu, dan ringkasan
  `hr.training.view` atau `hr.training.manage`; menulis rencana,
  membatalkannya, dan mengisi atau menghapus pagu `hr.training.manage`.
  Alasannya: pemegang `manage` sudah mengisi `biaya` setiap pelatihan, yang
  menentukan realisasi; pagu tidak mengeluarkan uang.
- Akibatnya paket Admin juga bisa mengatur pagu (penanda §26.10). Bila pagu
  dianggap keputusan pimpinan, alternatifnya izin baru `hr.training.budget`
  (sort order 1628) di `catalog.ts`, seed `app_permission` Rust, paket HRD, dan
  `SENSITIVE_MUTATION_PERMISSIONS` + `NOT IN` seed Admin bila sensitif.
- Tidak ada akses baca dari `accounting.view`; Keuangan membaca lewat pemegang
  izin pelatihan atau berkas Excel.
- Area tetap `hris`; tab Pelatihan memeriksa izinnya sendiri, backend memeriksa
  ulang (aturan 10, 36).

### 26.7 Command, rute, dan layar

**Rust** (`hr_pelatihan.rs`, disalin ke Mobile; semua `async` lewat
`TursoClient`, pesan `tak_terhubung` tanpa koneksi; doc comment sebelum
`#[tauri::command]`, aturan 45):

| Command | Izin |
| :-- | :-- |
| `desktop_hr_training_plan` (satu tahun: pagu, rencana + status + tanda, ringkasan per kelompok) | `training.view` / `manage` |
| `desktop_hr_training_plan_save` (aksi `rencana` simpan/batal, `pagu` simpan/hapus) | `training.manage` |

Terdaftar di kedua `lib.rs`, kedua `build.rs`, dan kedua
`capabilities/default.json`. Command Desktop 302 → 304, Mobile 308 → 310.
Perubahan yang ada: `validasi_pelatihan` + `id_rencana`, `simpan` memeriksa
rencana dan tahun, `INSERT_PELATIHAN_SQL`/`UBAH_PELATIHAN_SQL` + kolom, dan
rincian pelatihan membawa nama dan status rencananya.

**Web**: kembaran di `validations/hr-pelatihan.ts` +
`services/hr-pelatihan.ts`; rute `/api/hris/training` mendapat aksi `rencana`
(baca) dan `rencana_simpan` (tulis) di peta `IZIN`, tanpa rute baru dan tanpa
`GET`; gateway `gateways/hr-pelatihan.ts` + `ambilRencanaPelatihan`,
`simpanRencanaPelatihan`.

**Layar** (`web-desktop/src/components/hris/`, otomatis ke Mobile lewat
`dirsToCopy`):

1. `PelatihanWorkspace`: pilihan "Pelatihan" / "Rencana dan anggaran" di atas
   daftar, memakai pemilih tahun yang sama.
2. `RencanaPelatihan.tsx` (baru): ringkasan per kelompok (Pagu, Direncanakan,
   Terikat, Terpakai, Sisa, tanda) dalam `overflow-x-auto`; isian pagu per
   baris (`hr.training.manage`); daftar rencana dengan status, estimasi,
   realisasi, dan peserta; form rencana dan pembatalannya. Daftar dan rincian
   memakai `DaftarRincian` seperti layar HRIS lain. `konfirmasiData` sebelum
   simpan rencana dan pagu; hapus pagu lewat `konfirmasiData` dengan baris
   bertanda peringatan (pola §25.13).
3. Form pelatihan: pemilih rencana dan sisa pagu kelompoknya; rincian
   pelatihan menampilkan rencananya.
4. Ekspor Excel (Q-147): satu berkas, sheet "Ringkasan" dan "Rencana", angka
   sebagai sel Angka lewat `AngkaExcel` (`lib/client/excel-export.ts`),
   disimpan lewat `saveFileWithPicker` (SAF di Mobile, aturan 46).
5. Mobile: tanpa berkas khusus; tabel tergulir di dalam kartunya dan
   `DaftarRincian` mengurus lebar HP.

### 26.8 Tidak dikerjakan di fase ini

- Jurnal otomatis biaya pelatihan, sumber jurnal baru, status "sudah dibayar",
  dan realisasi yang dibaca dari jurnal (Q-146).
- Akun bawaan "Beban Pelatihan".
- Biaya per peserta yang disimpan atau dibebankan ke divisi peserta (Q-141).
- Riwayat revisi pagu, dan alur persetujuan rencana atau pagu (Q-144, Q-149).
- Pagu per cabang, per jabatan, atau per kuartal; tahun buku yang tidak
  dimulai Januari (Q-139).
- Rencana per jabatan, matriks kompetensi, pelatihan wajib, dan ikatan dinas
  (sudah di §22.10).
- Kejadian Telegram dan bagian kartu "Perlu perhatian" untuk pagu terlewati
  atau rencana terlewat (Q-148).
- Ekspor PDF (butuh `jspdf`, belum disetujui).
- Pelaporan BPJS/DJP/Wajib Lapor dan berkas transfer bank (sesudah fase 11,
  §15.1).

### 26.9 Langkah

| # | Langkah | Gerbang |
| :-- | :-- | :-- |
| 1 | **Skema v43**: dua tabel khusus cloud dan kolom `hr_pelatihan.id_rencana` di `turso.rs` (`CREATE TABLE` + `ensure_column`, indeks sesudahnya) dan `db-schema.ts`/`db-migrations.ts` (blok v43: tabel, `hasColumn`, lalu indeks); sentinel `-2039` + `ensure_schema_current`; `CURRENT_SCHEMA_VERSION`/`CLIENT_SCHEMA_VERSION` 43 kedua workspace; `REQUIRED_TABLE_COUNT` 104; `isDatabaseSchemaReady`, `schema-consistency.test.ts`, `PROMOTION_PLAN`, daftar khusus cloud `audit-sync-contract.ts` masing-masing + 2; daftar sentinel di tes `turso.rs`; daftar versi `rbac-migration.test.ts` + 43 (langsung gagal begitu DDL v43 ada, pelajaran fase 7). `storage.rs`, `sync.rs`, `CLOUD_MIRRORED_TABLES` tidak disentuh. | `audit:schema` + `cargo test sentinel_2038_memicu_skema_rencana_pelatihan` (database bersentinel `-2038` mendapat dua tabel, kolom, dan indeks; data pelatihan lama utuh) di kedua workspace |
| 2 | **Aturan kembar**: `validasi_rencana`, `validasi_pagu`, `id_anggaran`, `status_rencana`, `ringkas_anggaran` (kelompok, Umum, Di luar rencana, tanda), `validasi_pelatihan` + `id_rencana`, pesan `PESAN_RENCANA_TAHUN`/`PESAN_RENCANA_TERTAUT`; teks SQL kembar (`PAGU_SQL`, `RENCANA_SQL`, `REALISASI_SQL`, SQL tulis rencana dan pagu, `INSERT_`/`UBAH_PELATIHAN_SQL`). Belum dipanggil. | `bun run sync:mobile`, lalu `bun test src/lib/validations/hr-pelatihan.test.ts` dan `cargo test hr_pelatihan` di kedua workspace: vektor sama, teks SQL harfiah |
| 3 | **Pendaftaran command**: dua command (kerangka + guard izin) di keempat tempat kedua workspace; aksi `rencana`/`rencana_simpan` di peta `IZIN` rute. Bila Q-145 memilih izin baru: `catalog.ts`, seed Rust, paket, daftar sensitif, `rbac-migration.test.ts`. | `audit:contract` (304/310, tanpa command hantu) + `web-rbac-boundary` |
| 4 | **Transaksi cloud** (Rust): baca tahun, simpan/batal rencana, simpan/hapus pagu, tautan di `simpan` pelatihan. | tes `TursoClient::local_file` `rencana_cloud_pagu_dan_realisasi`: tautan beda tahun ditolak; mengubah tanggal pelatihan tertaut ke tahun lain ditolak; batal rencana bertaut ditolak; pagu berid sama menimpa; ringkasan Terikat/Terpakai/Sisa dan tanda; pelatihan batal keluar dari realisasi; `UBAH_PELATIHAN_SQL` v42 (teks lama) mempertahankan `id_rencana` |
| 5 | **Web**: service, aksi rute, gateway. | `services/hr-pelatihan.test.ts` diperluas dengan alur langkah 4, data dan hasil sama |
| 6 | **Layar** §26.7 dan ekspor Excel; `bun run sync:mobile`; bagian `CLAUDE.md` "HRIS fase 11", angka di dokumen skill (versi, tabel khusus cloud, command); catatan "Sudah dibangun" §26.13. | typecheck kedua workspace + Biome + `audit:docs`; `bun run check` penuh oleh pemilik; dicoba di Desktop tema gelap dan terang, Web di lebar 360 px |

### 26.10 Penanda yang ditinjau pemilik saat menyetujui

- **Naik skema ke v43**: perangkat v42 berhenti sinkron sejak cloud dinaikkan,
  yang terjadi saat perangkat v43 pertama membuka layar HR khusus cloud atau
  Web v43 dideploy. Semua perangkat wajib diperbarui; dengan Q-137 (a) ini
  menumpang putaran pembaruan fase 8–10.
- **Realisasi adalah biaya yang dicatat di pelatihan**, bukan uang yang
  dijurnal atau dibayar. Biaya yang lupa diisi = realisasi 0.
- **Pelatihan Dijadwalkan sudah mengurangi sisa pagu** (Terikat), sebelum
  terlaksana.
- **Melewati pagu tidak pernah ditolak**, hanya ditandai dan diperingatkan.
- **Pelatihan tanpa rencana dibebankan ke Umum**, bukan ke divisi pesertanya;
  pelatihan untuk satu divisi harus punya rencana berdivisi agar masuk
  realisasi divisi itu.
- **Pagu bisa diubah dan dihapus tanpa riwayat**; yang tercatat hanya siapa
  dan kapan terakhir mengubah.
- **Admin ikut bisa mengatur pagu** karena `hr.training.manage` ada di paket
  Admin (bila Q-145 tanpa izin baru).
- Tahun pelatihan = tahun `tanggal_mulai`; pelatihan yang melewati tahun baru
  dihitung seluruhnya di tahun mulainya.
- Divisi yang dinonaktifkan tetap tampil dengan pagu dan realisasinya; pagu
  baru hanya untuk divisi aktif.
- Mobile ikut tanpa langkah khusus; HP HRD butuh APK baru (sudah dibutuhkan
  fase 10).

### 26.11 Pertanyaan untuk pemilik

| No | Pertanyaan | Usulan | Alasan |
| :-- | :-- | :-- | :-- |
| Q-137 | Fase 11 dirilis (a) bersama fase 8–10 (belum dirilis), atau (b) sesudahnya? | (a) | Fase 8–10 sudah menuntut semua perangkat diperbarui (kejadian Telegram diparkir) dan HP HRD butuh APK baru; fase 11 menaikkan skema, jadi cukup satu putaran pembaruan dan satu putaran uji HP. Pilih (b) bila fase 8–10 ingin cepat jalan: fase 11 lalu memaksa pembaruan kedua |
| Q-138 | Rencana dan pagu: tabel khusus cloud baru (v43), atau tanpa perubahan skema (kunci `setting_gex_system`)? | Tabel khusus cloud `hr_pelatihan_anggaran` dan `hr_pelatihan_rencana`, plus kolom `hr_pelatihan.id_rencana` | `setting_gex_system` tersinkron ke terminal scanner, satu kunci per angka tidak bisa memuat rencana berstruktur, dan tidak ada tempat menautkan pelatihan. Induknya sudah khusus cloud (Q-87) |
| Q-139 | Periode anggaran: tahun kalender, atau tahun buku yang bisa diatur (mis. April–Maret)? | Tahun kalender | Daftar pelatihan, pemilih tahun, dan laporan Pembukuan sudah per tahun kalender. Tahun buku butuh pengaturan baru dan pemetaan tanggal di semua bacaan |
| Q-140 | Tingkat pagu: (a) per divisi per tahun + satu pagu Umum, total = jumlahnya; (b) satu pagu perusahaan per tahun; (c) keduanya, pagu perusahaan sebagai batas atas? | (a) | Diminta "per divisi". (c) membuat dua angka yang bisa saling bertentangan; (a) tetap memberi total perusahaan sebagai jumlah |
| Q-141 | Biaya pelatihan dibebankan ke divisi mana: (a) divisi rencananya, tanpa rencana = Umum; (b) kolom divisi sendiri di pelatihan; (c) dibagi menurut divisi peserta? | (a) | Cukup satu kolom baru. (b) menambah kolom yang bisa berbeda dengan divisi rencananya. (c) bergeser sendiri bila peserta pindah divisi, karena repo tidak menyimpan riwayat divisi |
| Q-142 | Realisasi: Terpakai = Berlangsung + Selesai, Terikat = Dijadwalkan, Sisa = Pagu − keduanya; atau hanya Selesai yang dihitung? | Terpakai + Terikat, keduanya mengurangi sisa | Pelatihan terjadwal sudah menjanjikan uangnya; tanpa Terikat, sisa pagu tampak longgar sampai hari pelatihan |
| Q-143 | Pelatihan yang membuat pagu terlewati: ditandai dan diperingatkan, atau ditolak? | Tanda + peringatan, tetap tersimpan | Pola yang sudah ada (batas bulanan reimburse, stok minus, kuota lowongan). Menolak membuat pelatihan yang sudah terjadi tidak bisa dicatat sampai pagu diubah |
| Q-144 | Isian rencana: nama, divisi (opsional), bulan (opsional), jumlah peserta, estimasi biaya, penyelenggara, keterangan; satu rencana banyak pelatihan, satu pelatihan satu rencana, tahun wajib sama; tanpa persetujuan? | Ya | Cukup untuk "rencana vs realisasi" per divisi dan per pelatihan. Persetujuan rencana menambah alur keputusan seperti pengajuan tanpa diminta |
| Q-145 | Siapa mengatur pagu: (a) `hr.training.manage` tanpa izin baru; (b) izin baru `hr.training.budget` biasa (paket HRD dan Admin); (c) izin baru sensitif (paket HRD saja)? | (a) | Pemegang `manage` sudah mengisi biaya yang menentukan realisasi, dan pagu tidak mengeluarkan uang. Pilih (c) bila pagu adalah keputusan pimpinan yang tidak boleh diubah Admin |
| Q-146 | Pembukuan: (a) tetap jurnal manual tanpa akun baru; (b) manual + akun bawaan "Beban Pelatihan" 5-1660; (c) jurnal otomatis bersumber baru? | (a) | Preseden Q-31 dan Q-98. (c) membangun ulang CHECK `keu_jurnal.sumber` di keempat lapis dan memaksa semua perangkat diperbarui (preseden v28). (b) menyentuh seed `keu_akun` di ketiga lapis untuk satu akun yang bisa dibuat sendiri |
| Q-147 | Ekspor Excel ringkasan dan rencana per tahun? | Ya, sheet Ringkasan dan Rencana, ketiga versi | Keuangan biasanya membaca anggaran di Excel; `excel-export.ts` dan `AngkaExcel` sudah ada, Mobile lewat SAF |
| Q-148 | Telegram atau kartu "Perlu perhatian" untuk pagu terlewati dan rencana terlewat? | Tidak di fase ini | Tanda di layar cukup untuk HRD yang membuka tab Pelatihan. Kejadian baru menambah generasi parkir dan sakelar di kartu Notifikasi |
| Q-149 | Pagu: boleh diubah dan dihapus tanpa riwayat? Rencana: dibatalkan, tidak dihapus? | Ya, ya | Riwayat revisi pagu butuh tabel append-only tambahan dan belum ada laporan yang membacanya. Rencana dibatalkan supaya realisasi dan pelatihan tertautnya tetap terbaca |

### 26.12 Jawaban fase 11 (13 Nov 2026)

Semua jawaban sesuai usulan §26.11, dan penanda §26.10 disetujui, jadi isi
§26.2–§26.10 tidak berubah.

| No | Pertanyaan | Jawaban |
| :-- | :-- | :-- |
| Q-137 | Rilis fase 11 | (a) bersama fase 8–10 |
| Q-138 | Rencana dan pagu | Tabel khusus cloud `hr_pelatihan_anggaran`, `hr_pelatihan_rencana`, kolom `hr_pelatihan.id_rencana` (v43) |
| Q-139 | Periode anggaran | Tahun kalender |
| Q-140 | Tingkat pagu | (a) per divisi per tahun + pagu Umum, total = jumlahnya |
| Q-141 | Beban divisi pelatihan | (a) divisi rencananya, tanpa rencana = Umum |
| Q-142 | Realisasi | Terpakai (Berlangsung + Selesai) dan Terikat (Dijadwalkan) sama-sama mengurangi sisa |
| Q-143 | Pagu terlewati | Tanda + peringatan, tetap tersimpan |
| Q-144 | Isian rencana | Sesuai usulan; satu rencana banyak pelatihan, satu pelatihan satu rencana, tahun sama, tanpa persetujuan |
| Q-145 | Yang mengatur pagu | (a) `hr.training.manage`, tanpa izin baru |
| Q-146 | Pembukuan | (a) jurnal manual, tanpa akun bawaan baru |
| Q-147 | Ekspor Excel | Ya, sheet Ringkasan dan Rencana, ketiga versi |
| Q-148 | Telegram / kartu Perlu perhatian | Tidak di fase ini |
| Q-149 | Riwayat pagu dan rencana | Pagu boleh diubah dan dihapus tanpa riwayat; rencana dibatalkan, tidak dihapus |

### 26.13 Sudah dibangun (13 Nov 2026)

Langkah 1–6 dibangun: skema v43 (sentinel `-2039`, `REQUIRED_TABLE_COUNT` 104,
68 tabel snapshot, 90 rute), command Desktop 304 / Mobile 310, tanpa izin baru.
Gerbang yang dijalankan:

- `audit:schema` lulus (104 tabel wajib, 98 tabel dipromosikan);
  `audit:contract` lulus (304/310, tanpa command hantu); `audit:docs` lulus.
- `cargo test --lib` Desktop dan Mobile: `sentinel_20*` 14 lulus (termasuk
  `sentinel_2038_memicu_skema_rencana_pelatihan`), `provisioning_lokal_*`
  (Desktop), dan `hr_pelatihan` 7 lulus (termasuk
  `ringkas_anggaran_vektor_bersama` dan `rencana_cloud_pagu_dan_realisasi`
  dengan semua kasus langkah 4).
- `bun test` Web dan Mobile: `validations/hr-pelatihan.test.ts` (vektor
  kembar, teks SQL, pesan, dan konstanta harfiah terhadap kedua
  `hr_pelatihan.rs`), `services/hr-pelatihan.test.ts` (alur Web sama dengan
  alur Rust langkah 4), `web-rbac-boundary`, `schema-consistency`,
  `rbac-migration`, `database-promotion`.
- Typecheck kedua workspace dan Biome berkas yang diubah bersih.

`bun run check` penuh belum dijalankan (pemilik). Layar belum dicoba di
aplikasi yang berjalan: gerbang "Desktop tema gelap dan terang" dan "Web di
lebar 360 px" belum dilakukan.

Penyimpangan dan catatan, untuk ditinjau:

- **`REALISASI_SQL` juga membaca pelatihan tahun lain yang menautkan rencana
  tahun itu** (`… OR r.tahun = ?1`): build v42 masih bisa memindah tanggal
  pelatihan tanpa menyentuh `id_rencana` (§26.1). Realisasi kelompok tetap
  menurut tahun `tanggal_mulai` (§26.4); angka per rencana memakai semua
  pelatihan tertautnya dan bertanda **`beda_tahun`** bila ada yang tahunnya
  lain (tanda tambahan). `id_rencana` dan divisi dibaca dari rencana yang
  benar-benar ada, jadi tautan patah terhitung "di luar rencana".
- **Pesan keempat `PESAN_RENCANA_TAHUN_TERKUNCI`** untuk "tahun tidak bisa
  diubah selama ada pelatihan tertaut" (§26.3). Larangan ini dan larangan
  batal bertaut dieja ulang di `UBAH_RENCANA_SQL` / `BATAL_RENCANA_SQL`; bila
  statement itu mengubah 0 baris, pesannya dipilih dari keadaan terbaru.
  Satu celah tersisa: menautkan pelatihan tidak dijaga di statement yang sama,
  jadi pembatalan rencana tepat di sela pemeriksaan dan penulisan bisa
  meninggalkan pelatihan yang tertaut ke rencana batal.
- **SQL tambahan** `RENCANA_SATU_SQL` dan `TAUTAN_RENCANA_SQL` (kembar): satu
  bacaan untuk status rencana di rincian pelatihan, hitungan tertaut, dan
  larangan batal/ubah tahun.
- **Tahun dikirim sebagai INTEGER** di ketiga bacaan baru
  (`DAFTAR_PELATIHAN_SQL` lama tetap teks). Tahun di luar 2000–2100 ditolak.
- **Sisa kosong** untuk kelompok tanpa baris pagu; total pagu kosong hanya bila
  tahun itu tidak punya pagu sama sekali. Kelompok: Umum lebih dulu, lalu urut
  nama dan id divisi (perbandingan teks biasa, sama di Rust dan TS untuk huruf
  Latin). Kelompok hanya memuat divisi yang punya pagu, rencana tidak batal,
  atau pelatihan tertaut tahun itu; divisi lain diisi pagunya lewat tombol
  "Atur pagu".
- **Pesan divisi** "Divisi tidak ditemukan." / "Divisi sudah nonaktif." sama
  dengan lowongan.
- **Vektor `ringkas_anggaran` satu berkas JSON** dibaca kedua tes, bukan dua
  salinan literal.
- **Tes `sentinel_2037_memicu_skema_rekrutmen`**: angka indeks harapan 9 → 12,
  karena saringan `idx_hr_pelatihan_%` ikut menghitung tiga indeks v43.
- **Helper `bulat`/`nama_wajib`** ↔ `bulat`/`namaWajib` menggantikan pemeriksa
  bilangan dan nama di `validasi_pelatihan`; pesannya tidak berubah.
- **Layar**: pemilih tahun pindah ke atas, dipakai bersama kedua pilihan;
  daftar pelatihan kini berjudul "Pelatihan (n)". `PelatihanWorkspace`
  menerima `divisi` dari `HrisWorkspace` (organisasi yang sudah dimuat). Form
  pelatihan membaca rencana tahun `tanggal_mulai` sendiri, jadi pemilih rencana
  dan sisa pagu ikut berubah saat tanggal pindah tahun; rencana tertaut yang
  tidak ada di tahun itu ditandai dengan `PESAN_RENCANA_TAHUN`. Rincian rencana
  menampilkan estimasi, realisasi, selisih, peserta aktual dibanding rencana,
  dan pelatihan tertautnya. Hapus pagu memakai `konfirmasiData` dengan baris
  peringatan (pola §25.13).
- **SKILL.md** mendapat butir fase 11 di daftar §4.8; CLAUDE.md bagian "HRIS
  fase 11". `audit:docs` tidak memeriksa versi skema atau jumlah command.

## 27. Urutan pengerjaan fase 12: berkas transfer gaji ke bank

**Disetujui pemilik (13 Nov 2026).** Ditulis setelah menelusuri kode
(13 Nov 2026); jawaban Q-150 sampai Q-159 dan Q-173 sampai Q-176 di §27.11,
semuanya sesuai usulan §27.10 kecuali yang dicatat di sana. Isinya butir "Transfer
gaji ke bank" §15 / §15.1, yang dijadwalkan sesudah fase 11.

### 27.1 Temuan dari kode

- **Jumlah yang ditransfer sudah ada**: `payroll_items.net_salary` adalah gaji
  bersih AKHIR, sesudah kasbon dipotong dan reimbursement mode `gaji`
  ditambahkan (`net = pay.net − kasbon + reimburse`, pembekuan di
  `payroll/commands.rs` ↔ `computePayrollRecap`). Tidak ada angka lain yang
  perlu dihitung untuk berkas transfer.
- **Status run**: `DRAFT → SUBMITTED → REVIEWED → APPROVED → PAID` (atau
  `REJECTED`). `PAID` ditandai manual oleh pemegang `payroll.run.disburse`
  ("Tandai Dibayar & Kunci Slip"), dan saat itulah angsuran kasbon, jurnal
  `pay-<run>`, dan pemeriksaan reimburse ditulis. Aplikasi tidak tahu apakah
  uangnya benar-benar sudah ditransfer.
- **Rekening karyawan ada di `hr_profil`** (KHUSUS CLOUD, Q-30/Q-45): `bank`,
  `no_rekening`, `nama_rekening`, bagian "keuangan" yang dibaca
  `hr.finance.view` (rahasia, `CONFIDENTIAL_PERMISSIONS`) dan ditulis
  `hr.finance.manage` (sensitif). Jadi berkas transfer selalu butuh koneksi ke
  database, Desktop sekalipun.
- **`bank` teks bebas** (`teksTerbatas`, maks `MAKS_NAMA`), bukan kode. Satu
  bank bisa tertulis "BCA", "Bank BCA", "bca ", "Bank Central Asia". Transfer
  antarbank massal biasanya butuh kode bank (3 digit BI) atau kode BI-FAST/SKN.
  `no_rekening` hanya angka 5–20 digit (`PANJANG_REKENING`), `nama_rekening`
  teks bebas.
- **Ada izin `payroll.export`** ("Ekspor Laporan & Slip Gaji", sort 320) yang
  ditanam di seed tetapi **tidak dipakai guard mana pun** di Rust maupun Web.
- **Belum ada ekspor Excel apa pun di layar payroll**; slip dicetak lewat
  `SlipGajiPrintView`. Penulis Excel yang dipakai modul lain:
  `buildXlsxWorkbook` + `AngkaExcel` + `saveFileWithPicker` (SAF di Mobile,
  aturan 46).
- **`payroll_audit_logs`** (tersinkron, `action` tanpa CHECK) mencatat
  transisi status. Tidak ada rute outbox untuk baris log saja; satu-satunya
  rute yang menulisnya `payroll/transition-status`.
- **Pembayaran lain di luar gaji**: upah surat jalan (`drv_upah_bayar`),
  reimbursement mode `terpisah` dan cuti diuangkan (`hr_reimburse_bayar`),
  pesangon (jurnal manual). Ketiganya dicatat tanpa berkas transfer.
- **Format berkas transfer massal milik masing-masing bank**, tidak ada standar
  nasional. Contoh yang umum dipakai perusahaan: KlikBCA Bisnis (payroll/
  transfer massal), Mandiri Cash Management (MCM), BRI CMS / Qlola, BNI Direct.
  Format persisnya (CSV, teks lebar tetap, atau Excel; urutan kolom; baris
  kepala/total; kode rekening debet; tanggal efektif) berubah antar versi dan
  per kontrak layanan, jadi **tidak bisa ditebak**: setiap format dibangun dari
  contoh berkas asli bank pemilik (Q-151).

### 27.2 Model data (skema v44, sentinel `-2040` `payroll-transfer-v1`)

**Diubah atas permintaan pemilik (13 Nov 2026)**: daftar bank, rekening debet
perusahaan, dan bentuk berkas per bank diatur di **Pengaturan**, supaya bisa
diubah dan ditambah tanpa build baru. Usulan awal "daftar bank di kode, tanpa
skema" ditinggalkan.

**Tiga tabel baru, khusus cloud** (pola `app_telegram_setting`,
`hr_dokumen_jenis`): hanya `turso.rs` + `db-schema.ts`/`db-migrations.ts`,
tidak di `storage.rs`, snapshot, outbox, atau `CLOUD_MIRRORED_TABLES`. Isinya
hanya dibutuhkan berkas transfer dan profil keuangan karyawan, yang keduanya
sudah khusus cloud, dan tidak boleh ikut ke terminal scanner. Tanpa `UNIQUE`
selain PK; keunikan nama ditegakkan aplikasi.

| Tabel | Kolom |
| :-- | :-- |
| `app_bank` | `id_bank` PK (bawaan `bnk-<kode>`, buatan pengguna `bnk-<hex>`); `nama` NOT NULL (nama kanonik yang disimpan di `hr_profil.bank`); `kode` (3 digit kode bank BI, boleh kosong); `alias` (teks JSON larik nama lain, mis. `["BCA","Bank Central Asia","PT Bank Central Asia Tbk"]`); `is_aktif` 0/1; `is_bawaan` 0/1; `diubah_oleh`, `created_at`, `updated_at` |
| `app_bank_rekening` | `id_rekening` PK (`rek-<hex>`); `id_bank` NOT NULL; `no_rekening` NOT NULL (5–20 digit, `PANJANG_REKENING`); `nama_rekening` NOT NULL; `keterangan`; `is_aktif` 0/1; `diubah_oleh`, `created_at`, `updated_at` |
| `app_bank_format` | `id_format` PK (`fmt-<hex>`); `nama` NOT NULL; `id_bank` (bank sasaran, boleh kosong = umum); `jenis` CHECK `csv`/`txt`/`xlsx`; `pemisah` CHECK `,` `;` `\t` `|` atau kosong (xlsx); `pakai_judul` 0/1; `kutip` 0/1 (teks dibungkus kutip ganda); `desimal` 0/1 (nominal `1500000` atau `1500000.00`); `cakupan` CHECK `semua`/`sesama`/`antarbank`; `kolom` NOT NULL (teks JSON, §27.3); `maks_berita` INTEGER; `is_aktif` 0/1; `diubah_oleh`, `created_at`, `updated_at` |

- **Seed bank bawaan** `INSERT OR IGNORE` di `turso.rs` dan
  `db-migrations.ts` (pola `hr_keluar_alasan`), dari satu berkas
  `validations/bank-bawaan.json` (pola `akun-bawaan.json`): BCA, Mandiri, BSI,
  BRI, BNI, dan bank umum lain. Kode BI diverifikasi ulang di langkah 1 dan
  tetap bisa diubah di Pengaturan. Bank bawaan boleh diganti nama, alias, dan
  kodenya serta dinonaktifkan; tidak ada hapus untuk bank mana pun, karena
  `hr_profil.bank` merujuk namanya (Q-12).
- **Tanpa seed rekening dan format.** Rekening debet diisi perusahaan; format
  kustom dibuat sesudah contoh berkas bank diketahui.
- **`hr_profil.bank` tetap teks.** Isian bank di profil keuangan menjadi
  `PilihCari` dari `app_bank` aktif dan menyimpan `nama`. Data lama tidak
  ditulis ulang: pencocokan memakai `nama` dan `alias` sesudah huruf besar
  kecil dan spasi dirapikan (`cocok_bank` ↔ `cocokBank`). Ganti nama bank di
  Pengaturan menambahkan nama lamanya ke `alias` (pola `hr_divisi_nama`), jadi
  profil lama tetap cocok.
- Kedua jalur: `CURRENT_SCHEMA_VERSION`/`CLIENT_SCHEMA_VERSION` 44 (Desktop DAN
  Mobile), sentinel `-2040`, `REQUIRED_TABLE_COUNT` 107, `isDatabaseSchemaReady`
  dan `schema-consistency.test.ts` + 3, daftar khusus cloud
  `audit-sync-contract.ts` + 3, `PROMOTION_PLAN` + 3 (`app_bank` →
  `app_bank_rekening`, `app_bank_format`), daftar versi `rbac-migration.test.ts`
  + 44. Tetap 68 tabel snapshot dan 90 rute.

### 27.3 Isi berkas

**Sumber**: satu `payroll_runs` berstatus `APPROVED` atau `PAID` (Q-154),
satu rekening debet (`app_bank_rekening` aktif) yang dipilih saat mengunduh.
Baris = `payroll_items` run itu, digabung `hr_profil` (cloud) dan `app_bank`.

| Isian | Isi |
| :-- | :-- |
| `nama_karyawan`, `kode_karyawan` | `payroll_items.nama_karyawan` (beku saat run dibuat), `master_data.kode_karyawan` |
| `nama_bank`, `kode_bank` | `hr_profil.bank` → `app_bank` lewat `cocok_bank` |
| `no_rekening`, `nama_rekening` | `hr_profil` |
| `nominal` | `payroll_items.net_salary` (INTEGER rupiah) |
| `berita` | `Gaji <period_start> s.d. <period_end>`, dipangkas ke `maks_berita` |
| `rekening_debet`, `nama_debet` | rekening debet terpilih |
| `tanggal_efektif` | diisi saat mengunduh, bawaan tanggal WIB jam database |
| `nomor_urut` | 1, 2, 3, … menurut urutan baris |
| `teks_tetap` | teks yang diketik di format (mis. kode layanan bank) |

**Jenis transfer** per baris: `sesama` bila bank karyawan = bank rekening
debet, selain itu `antarbank`. Format ber-`cakupan` `sesama`/`antarbank` hanya
memuat baris jenis itu; baris lainnya masuk ringkasan "belum ada di berkas
ini", supaya dua berkas (sesama + antarbank) tidak tumpang tindih atau
tertinggal.

**Tanda, tidak menolak** (pola fase 4–11): baris yang tidak bisa ditransfer
tidak masuk berkas bank, tetapi tampil di layar dan di sheet "Perlu dibayar
manual":

- `tanpa_rekening` (bank atau nomor kosong),
- `bank_tidak_dikenal` (tidak cocok `app_bank`, atau banknya nonaktif),
- `tanpa_kode_bank` (format memakai `kode_bank` tetapi bank itu belum punya
  kode),
- `nominal_nol` (`net_salary` 0),
- `nama_berbeda` (nama pemilik rekening ≠ nama karyawan sesudah dirapikan;
  hanya peringatan, rekening atas nama keluarga bisa sah),
- `karyawan_keluar` (`master_data.id_keluar` terisi; tetap ditransfer, hanya
  diberi tahu).

**Tiga bentuk berkas** (Q-151):

1. **Excel umum, selalu ada**: sheet "Transfer" (semua isian, nominal sel
   Angka) + "Perlu dibayar manual" + "Ringkasan" (jumlah baris, total per bank
   dan per jenis, total = Σ `net_salary` run, dan selisih bila ada baris
   dikeluarkan).
2. **Format kustom dari Pengaturan** (`app_bank_format`): `kolom` adalah larik
   `{ "isian": <salah satu isian di atas>, "judul": <teks judul kolom>,
   "teks": <isi bila teks_tetap> }`, divalidasi persis di kedua sisi (isian
   dari daftar tetap, judul ≤ 60, teks ≤ 100, 1–30 kolom; aturan 37/43).
   Dirender fungsi murni `render_format` ↔ `renderFormat`: CSV/TXT dengan
   pemisah, kutip, dan desimal sesuai format; xlsx lewat `buildXlsxWorkbook`.
   Cukup untuk format bank berbentuk baris per penerima dengan kolom terpisah.
3. **Format bank khusus di kode**, hanya bila format bank itu tidak bisa
   dinyatakan dengan format kustom: teks lebar tetap, baris kepala/penutup
   berisi jumlah, total, atau checksum. Satu fungsi murni per bank dengan vektor
   dari contoh berkas asli. **Ditunda** sampai contoh berkas BCA, BSI, atau
   Mandiri didapat (§27.11).

Pratinjau 5 baris pertama tampil sebelum diunduh. Total nominal berkas wajib
sama dengan Σ `net_salary` baris yang masuk; dijumlahkan sebagai bilangan
bulat, tanpa pembagian (aturan 13).

### 27.4 Alur dan status

- Berkas diunduh dari run `APPROVED` (sebelum transfer) dan bisa diunduh ulang
  dari `PAID` (Q-154 (a)). Menandai `PAID` **tetap manual** sesudah transfer
  berhasil di bank (Q-155 (a)); aplikasi tidak menerima balikan dari bank.
- Setiap unduhan mencatat satu baris `payroll_audit_logs`
  `action = 'TRANSFER_EXPORT'` langsung di cloud (Q-156 (b), pola Berlakukan
  keluar fase 5): siapa, kapan, format, rekening debet, jumlah baris, total.
  Status run tidak berubah.
- Layar memperingatkan bila run sudah `PAID` atau sudah pernah diunduh, karena
  aplikasi tidak bisa mencegah unggahan ganda di internet banking.

### 27.5 Hak akses

- **Mengunduh berkas** membuka nomor rekening semua karyawan: wajib
  `payroll.run.disburse` **dan** `hr.finance.view` (Q-157 (a)), diperiksa di
  command dan rute.
- **Mengatur Pengaturan transfer** (bank, rekening debet, format):
  `payroll.config.manage`, yang hari ini khusus Superadmin
  (`SUPERADMIN_ONLY_PERMISSIONS`). Mengubah rekening debet atau urutan kolom
  bisa membuat uang masuk ke tempat yang salah, jadi pemegangnya sedikit
  (Q-173). Membaca daftar bank aktif cukup sesi, karena dipakai isian profil
  keuangan.

### 27.6 Command, rute, dan layar

- Rust (modul baru `desktop/transfer.rs`, disalin ke Mobile):
  `desktop_transfer_settings` (bank, rekening, format), 
  `desktop_transfer_settings_save` (aksi `bank`, `rekening`, `format`, masing-
  masing simpan/nonaktifkan), `desktop_payroll_transfer(run_id)` (baris +
  jenis + tanda + ringkasan; mencatat log saat `catat = true`). Berkas dirender
  di TS, sama untuk ketiga versi. Command Desktop 304 → 307, Mobile 310 → 313.
- Web: kembaran di `validations/transfer.ts` + `services/transfer.ts`, rute
  `POST /api/payroll/transfer` dengan peta `IZIN` per aksi, tanpa `GET`.
- Layar:
  1. **Pengaturan → kartu "Transfer bank"** (Web/Desktop): daftar bank (nama,
     kode, alias, aktif), rekening debet, dan format kustom dengan penyusun
     kolom (tambah, ubah urutan, hapus kolom) + pratinjau dari data contoh.
     `konfirmasiData` sebelum simpan; nomor rekening tampil utuh di ringkasan
     (bukan rahasia seperti token).
  2. **Rincian run → "Berkas transfer"** (`RunDetailClient`): pilih rekening
     debet, format, dan tanggal efektif; tabel baris bertanda; pratinjau;
     unduh lewat `saveFileWithPicker`.
  3. **Profil keuangan karyawan**: isian bank menjadi `PilihCari`; nilai lama
     yang tidak dikenal tetap tampil dengan tanda.
- Mobile: kartu Pengaturan tidak; tombol berkas transfer hanya bila layar run
  payroll ada di salinan Mobile (diperiksa saat eksekusi).

### 27.7 Tidak dikerjakan di fase ini

- Integrasi langsung API bank (H2H/SNAP): butuh kontrak bank, sertifikat, dan
  host eksternal di CSP Desktop (dilarang tanpa persetujuan).
- Membaca mutasi/rekening koran untuk menandai `PAID` otomatis.
- Format bank lebar tetap dengan baris kepala/penutup sebelum contohnya ada.
- Berkas transfer untuk upah surat jalan, reimbursement terpisah, cuti
  diuangkan, dan pesangon (Q-158).
- Validasi nama pemilik rekening ke bank (inquiry).
- Riwayat perubahan Pengaturan transfer selain `diubah_oleh`/`updated_at`.

### 27.8 Langkah

| # | Langkah | Gerbang |
| :-- | :-- | :-- |
| 1 | **Skema v44**: tiga tabel khusus cloud + seed `bank-bawaan.json`, sentinel `-2040`, versi 44 kedua workspace, `REQUIRED_TABLE_COUNT` 107, semua daftar + 3 | `audit:schema` + `cargo test sentinel_2039_memicu_skema_transfer` (database `-2039` mendapat tiga tabel dan seed bank) di kedua workspace |
| 2 | **Aturan kembar**: validasi bank (nama, kode, alias), rekening, format (`kolom` JSON), `cocok_bank`, susun baris + jenis + tanda + ringkasan; `render_format` ↔ `renderFormat`; SQL kembar | `bun test validations/transfer.test.ts` + `cargo test transfer` kedua workspace: vektor sama, SQL harfiah |
| 3 | **Command + rute + guard** (§27.5) | `audit:contract` (307/313) + `web-rbac-boundary` |
| 4 | **Transaksi/bacaan cloud** Rust: Pengaturan simpan/nonaktifkan, ganti nama bank menambah alias, baris transfer dari run APPROVED/PAID, log `TRANSFER_EXPORT` | tes `local_file` `transfer_cloud_pengaturan_dan_baris` |
| 5 | **Web**: service, rute, gateway | `services/transfer.test.ts`: alur langkah 4, data dan hasil sama |
| 6 | **Berkas**: Excel umum + render format kustom | tes teks CSV/TXT dan workbook: pemisah, kutip, desimal, cakupan, total |
| 7 | **Layar** §27.6, `sync:mobile`, CLAUDE.md, angka di skill, "Sudah dibangun" | typecheck + Biome + `audit:docs`; `bun run check` oleh pemilik |
| 8 | **Format bank khusus** BCA/BSI/Mandiri yang tidak bisa dinyatakan format kustom | **ditunda** sampai contoh berkas asli; vektor dari contoh itu |

### 27.9 Penanda yang ditinjau pemilik

- **Aplikasi menyiapkan berkas, bukan mentransfer.** Unggah ke internet
  banking dan otorisasi (token/approver bank) tetap manual.
- **Naik skema ke v44**: semua perangkat wajib diperbarui. Karena v43 fase 11
  belum dirilis, v44 sebaiknya ikut rilis yang sama (Q-159).
- **Format kustom yang salah susun menghasilkan berkas yang ditolak bank atau,
  lebih buruk, kolom tertukar.** Pratinjau dan transfer uji bernilai kecil
  sebelum dipakai untuk gaji sungguhan.
- **Nominal = gaji bersih yang dibekukan run**, termasuk kasbon dan
  reimbursement mode gaji. Gaji yang berubah sesudah berkas diunduh berarti
  run baru.
- **Rekening karyawan dibaca saat mengunduh**, tidak dibekukan di run.
- **Unggahan ganda tidak bisa dicegah aplikasi**, hanya diperingatkan.
- Bank bawaan tetap bisa diubah dan dinonaktifkan, tidak bisa dihapus.

### 27.10 Pertanyaan untuk pemilik

| No | Pertanyaan | Usulan | Alasan |
| :-- | :-- | :-- | :-- |
| Q-150 | Bank yang dipakai klien? | Dijawab: BCA, BSI, Mandiri | §27.11 |
| Q-151 | Bentuk berkas? | Excel umum + format kustom Pengaturan + format kode bila perlu | Format kustom menutup kebutuhan selama belum ada contoh |
| Q-152 | Daftar bank di mana? | Dijawab: Pengaturan (`app_bank`, v44) | §27.11 |
| Q-153 | Rekening debet di mana? | Dijawab: Pengaturan (`app_bank_rekening`) | §27.11 |
| Q-154 | Berkas dari run berstatus apa: (a) `APPROVED` dan `PAID`; (b) hanya `APPROVED`? | (a) | Unduh ulang sesudah dibayar berguna untuk arsip |
| Q-155 | Sesudah transfer: (a) tandai `PAID` manual; (b) otomatis saat berkas diunduh? | (a) | Mengunduh bukan bukti transfer berhasil; `PAID` memicu jurnal dan angsuran kasbon |
| Q-156 | Catat jejak unduhan? (a) tidak; (b) `payroll_audit_logs` `TRANSFER_EXPORT` | (b) | Siapa yang mengunduh rekening semua karyawan layak tercatat |
| Q-157 | Izin unduh: (a) `payroll.run.disburse` + `hr.finance.view`; (b) `payroll.export` + `hr.finance.view`; (c) izin baru sensitif? | (a) | Yang menandai dibayar adalah yang mentransfer |
| Q-158 | Upah surat jalan, reimbursement terpisah, cuti diuangkan, pesangon ikut? | Tidak di fase ini | Sumber dan statusnya berbeda; generator yang sama bisa dipakai sesudahnya |
| Q-159 | Rilis v44 bersama fase 8–11 (v43)? | Ya | Satu putaran pembaruan perangkat, bukan dua |
| Q-173 | Yang mengatur Pengaturan transfer: (a) `payroll.config.manage` (Superadmin); (b) `hr.finance.manage`; (c) izin baru sensitif `payroll.transfer.config`? | (a) | Rekening debet dan urutan kolom menentukan ke mana uang pergi |
| Q-174 | Format kustom boleh memilih cakupan `sesama`/`antarbank`? | Ya | Beberapa bank memisahkan berkas transfer sesama bank dan antarbank |
| Q-175 | Lebih dari satu rekening debet (mis. BCA dan Mandiri)? | Ya | Perusahaan bisa menggaji dari dua bank |
| Q-176 | Ganti nama bank di Pengaturan otomatis menambah nama lama ke alias? | Ya | Profil karyawan lama tetap cocok tanpa ditulis ulang |

### 27.11 Jawaban (13 Nov 2026)

- **Q-150**: belum ada klien (aplikasi belum dikomersialkan). Bank yang paling
  sering dipakai menurut pemilik: **BCA, BSI, Mandiri**; ketiganya wajib ada di
  `bank-bawaan.json` beserta aliasnya.
- **Q-151**: belum ada contoh berkas bank. Excel umum dan format kustom
  dibangun lebih dulu; format bank khusus (langkah 8) **ditunda sampai contoh
  berkas asli didapat** pemilik dari calon klien.
- **Q-152, Q-153**: daftar bank, rekening debet, dan bentuk berkas **diatur di
  Pengaturan** supaya bisa diubah dan ditambah (permintaan pemilik). §27.2–§27.6
  sudah ditulis ulang menurut jawaban ini.
- **Q-170**: fase 12 (transfer) dikerjakan lebih dulu.
- **Q-154 sampai Q-159 dan Q-173 sampai Q-176**: semuanya sesuai usulan
  §27.10 (disetujui pemilik 13 Nov 2026), dan penanda §27.9 disetujui.

**Fase 12 disetujui pemilik (13 Nov 2026)** dan siap dieksekusi per langkah
§27.8. Langkah 8 (format bank khusus) tetap menunggu contoh berkas asli.

### 27.12 Sudah dibangun (13 Nov 2026)

Langkah 1–7 dibangun: skema v44 (sentinel `-2040`, `REQUIRED_TABLE_COUNT` 107,
68 tabel snapshot, 90 rute), command Desktop 307 / Mobile 313, tanpa izin baru.
Langkah 8 ditunda sampai contoh berkas BCA, BSI, atau Mandiri didapat.
Gerbang yang dijalankan:

- `audit:schema` lulus (107 tabel wajib, 101 tabel dipromosikan);
  `audit:contract` lulus (307/313, tanpa command hantu); `audit:docs` lulus.
- `cargo test --lib` Desktop dan Mobile: `sentinel_20*` 15 lulus (termasuk
  `sentinel_2039_memicu_skema_transfer`: tiga tabel dan seed, seed tidak
  menimpa bank yang disunting), `provisioning_lokal_*` (Desktop), dan
  `transfer` 6 lulus (vektor bersama validasi/cocok/bentrok/susun dan
  `transfer_cloud_pengaturan_dan_baris`).
- `bun test` Web dan Mobile: `validations/transfer.test.ts` (vektor kembar dan
  teks harfiah terhadap kedua `transfer.rs`), `services/transfer.test.ts`
  (alur Web sama dengan langkah 4, teks catatan unduhan sama persis),
  `lib/client/berkas-transfer.test.ts` dan `excel-export.test.ts`,
  `web-rbac-boundary`, `schema-consistency`, `rbac-migration`,
  `database-promotion`.
- Typecheck kedua workspace dan Biome berkas yang diubah bersih; clippy bersih
  untuk `transfer.rs`.

`bun run check` penuh belum dijalankan (pemilik). Layar belum dicoba di
aplikasi yang berjalan (tema gelap dan terang, lebar 360 px, unduh di
Desktop/Android).

Penyimpangan dan catatan, untuk ditinjau:

- **Tidak ada paket bawaan yang bisa mengunduh berkas.** `payroll.run.disburse`
  ada di paket Admin dan `hr.finance.view` di paket HRD; Q-157 (a) mewajibkan
  keduanya, jadi hanya Superadmin atau role buatan sendiri. Paket tidak diubah;
  `web-rbac-boundary` mengunci keadaan ini.
- **`render_format` tidak punya kembaran Rust.** §27.3 menyebut kembar, §27.6
  menyatakan berkas dirender di TS; yang diikuti §27.6, karena perender Rust
  tidak pernah dipanggil.
- **Modul `transfer.rs`/`transfer.ts` lahir di langkah 1** (seed bank butuh
  tempat). `hris.rs` `PANJANG_REKENING` dijadikan `pub` supaya dipakai ulang.
- **Angka dan aturan yang tidak disebut §27**: alias paling banyak 20,
  `maks_berita` 1–200, judul kolom wajib 1–60 karakter, teks tetap boleh kosong
  (kolom kosong bank), tab/baris baru ditolak di judul dan teks. CHECK DDL
  tambahan: kode 3 digit, nomor rekening 5–20 digit, `xlsx` ⇔ pemisah kosong
  (`char(9)` = tab). Tanpa indeks untuk tiga tabel kecil ini.
- **Aturan tanda**: bank nonaktif = `bank_tidak_dikenal`; Excel umum tidak
  pernah `tanpa_kode_bank`; baris di luar cakupan punya daftar sendiri, bukan
  "manual"; nama pemilik rekening kosong tidak ditandai; `nominal_nol` =
  `net_salary` ≤ 0 (CHECK membuatnya hanya 0).
- **Parameter command**: `desktop_payroll_transfer(draft)` dengan `run_id`,
  `id_rekening`, `id_format`, `tanggal_efektif`, `catat`
  (`validasi_pilihan_transfer` ↔ `validasiPilihanTransfer`);
  `desktop_transfer_settings_save(jenis, id, draft)`; nonaktifkan = simpan
  `is_aktif = 0`. Rute dibuat di langkah 3, layanannya di langkah 5.
- **Rekening debet berbank nonaktif ditolak saat mengunduh** (pesan sama dengan
  rekening nonaktif); menonaktifkan bank di Pengaturan tetap tidak ditolak.
- **Keunikan diperiksa sebelum menulis**, tidak dalam satu statement: dua
  Superadmin yang menyimpan bersamaan bisa menghasilkan nama ganda.
- **Format berbank hanya ditawarkan untuk rekening debet bank itu** (layar);
  backend tidak memeriksa kecocokan bank format dan rekening debet.
- **Catatan `TRANSFER_EXPORT` berkunci urut abjad** supaya teksnya sama di Rust
  dan TS dengan atau tanpa fitur `preserve_order` serde_json. Ditulis sebelum
  berkas disimpan: pengguna yang membatalkan dialog simpan tetap tercatat
  mengunduh (yang dicatat adalah akses ke nomor rekening).
- **Berkas teks**: teks yang memuat pemisah, kutip, atau baris baru selalu
  dikutip walau format "tanpa kutip" (kolom tidak pernah bergeser); `desimal`
  hanya nominal dan hanya CSV/TXT (xlsx selalu sel Angka); CRLF, UTF-8 tanpa
  BOM; tanggal selalu `YYYY-MM-DD` (format kustom belum bisa memilih bentuk
  tanggal).
- **`buildXlsxWorkbook` mendapat opsi `tanpaJudul`** (aditif, bawaan tetap
  menulis judul) untuk format xlsx tanpa baris judul.
- **MSRV 1.77.2**: `Option::is_none_or` (1.82) diganti `map_or`.
- **Layar**: Pengaturan tab "Transfer Bank" dimuat hanya saat tabnya dibuka;
  isian bank profil keuangan memakai daftar bank aktif dan menampilkan nilai
  lama yang tidak dikenal beserta nasibnya di berkas ("dikenali sebagai …" atau
  "Perlu dibayar manual"); bila daftar bank gagal dimuat (database v43) isiannya
  tetap teks. Mobile punya `RunDetailClient` sendiri, jadi tab "Transfer" dipasang
  di sana dengan komponen bersama yang sama. Jejak unduhan di audit trail kedua
  layar tampil sebagai "Berkas transfer diunduh" dengan ringkasan terbaca.
- **Fungsi bantu baca database** `objek` ditulis ulang di
  `services/transfer.ts`; padanannya di layanan HR lain privat.

## 28. Urutan pengerjaan fase 14: pelaporan DJP, BPJS, dan Wajib Lapor

**Rancangan, menunggu persetujuan pemilik.** Semula ditulis sebagai fase 13;
sejak Q-161 (b) perbaikan rumus PPh 21 dan BPJS menjadi fase 13 dan bagian ini
fase 14 (§28.11). §15.1 mencatat alurnya belum
dipahami pemilik, jadi bagian ini dimulai dengan penjelasan (§28.1), lalu
temuan kode yang memengaruhi kebenaran angka (§28.2), baru rancangan.
Pertanyaan Q-160 sampai Q-172 di §28.10.

**Catatan sumber**: aturan di §28.1 ditulis dari pengetahuan umum tentang
peraturan sampai pertengahan 2026, bukan dari dokumen resmi terbaru. Nama
formulir, kode objek pajak, kolom template, dan tenggat **wajib dicek ulang**
dengan template resmi atau konsultan pajak pemilik sebelum langkah format
(Q-160). Aplikasi tidak mengirim apa pun ke DJP atau BPJS.

### 28.1 Penjelasan alur (untuk pemilik)

**DJP: PPh 21 karyawan (Coretax, sejak 2025).**

- Setiap bulan perusahaan (pemotong) memotong PPh 21 dari gaji, menyetorkannya
  (sekitar tanggal 15 bulan berikutnya), lalu melapor SPT Masa PPh 21/26
  (sekitar tanggal 20). Untuk setiap karyawan dibuat **bukti potong bulanan**
  (BPMP untuk pegawai tetap; pegawai tidak tetap/harian memakai bukti potong
  tersendiri). Di akhir tahun (atau saat karyawan keluar) dibuat **bukti
  potong tahunan A1**.
- Bulan Januari–November dipotong dengan **tarif efektif (TER)** dari bruto
  sebulan. Bulan terakhir (Desember atau bulan keluar) dihitung ulang setahun
  dengan **tarif Pasal 17**, dikurangi biaya jabatan, iuran pensiun/JHT pekerja,
  dan PTKP; selisihnya menjadi PPh bulan itu (bisa lebih bayar).
- Coretax menerima bukti potong diketik satu per satu atau **diimpor massal**
  lewat template Excel resmi DJP yang dikonversi ke XML. Data per karyawan:
  NIK (= NPWP 16 digit), status PTKP, kode objek pajak, penghasilan bruto,
  tarif/TER, PPh dipotong, masa pajak. Data pemotong: NPWP dan NITKU
  perusahaan.
- **Yang bisa dilakukan aplikasi**: menyusun rekap per bulan per karyawan dan
  berkas Excel berbentuk template impor Coretax, lalu HRD/keuangan
  mengimpornya sendiri.

**BPJS Ketenagakerjaan (SIPP) dan BPJS Kesehatan (e-Dabu).**

- Iuran dibayar bulanan berdasarkan **tagihan** yang dihitung BPJS dari data
  upah yang terdaftar di portal (BPJS TK sekitar tanggal 15, Kesehatan sekitar
  tanggal 10 bulan berikutnya). Komponen TK: JHT, JKK, JKM, JP; Kesehatan
  satu komponen, masing-masing bagian pekerja dan perusahaan.
- "Pelaporan" BPJS terutama berarti **menjaga data di portal sama dengan
  kenyataan**: menambah karyawan baru, menonaktifkan yang keluar, dan
  memperbarui upah (lewat unggah Excel/template portal), lalu mencocokkan
  tagihan dengan potongan di slip.
- **Yang bisa dilakukan aplikasi**: rekap iuran per karyawan per komponen per
  bulan dari angka yang benar-benar dipotong di payroll, dan daftar perubahan
  bulan itu (masuk, keluar, upah berubah) untuk diperbarui di portal; tanda
  bila karyawan dipotong BPJS tetapi nomor kepesertaannya kosong, atau
  sebaliknya.

**Wajib Lapor Ketenagakerjaan (WLKP, Kemnaker).**

- Perusahaan melapor data ketenagakerjaan saat berdiri/berubah dan secara
  berkala setiap tahun, lewat formulir daring (bukan unggah berkas gaji):
  jumlah tenaga kerja menurut jenis kelamin, status hubungan kerja
  (PKWT/PKWTT/harian/magang), pendidikan, jabatan, kewarganegaraan, rentang
  upah, kepesertaan BPJS, dan data perusahaan.
- **Yang bisa dilakukan aplikasi**: satu lembar rekap angka per tahun (atau per
  tanggal acuan) yang tinggal disalin ke formulir.

### 28.2 Temuan dari kode yang memengaruhi kebenaran laporan

Rumus gaji, pajak, dan BPJS **tidak diubah** fase ini (preseden fase 2–5),
tetapi laporan yang dibaca dari payroll mewarisi perilakunya:

- **TER dihitung per proses gaji, bukan per bulan** (`calculate_pph21_ter`
  menerima bruto satu run). Untuk gaji per jam yang diproses mingguan atau
  dua mingguan, bruto tiap run lebih kecil dari bruto sebulan, sehingga
  bracket TER lebih rendah dan PPh terpotong kurang.
- **BPJS juga per run**: batas upah (JP, Kesehatan) diterapkan per run, dan
  dasar iurannya bruto termasuk lembur.
- **Gaji harian tetap (`FLAT_DAILY`) tidak dipotong PPh 21 maupun BPJS sama
  sekali.** Pegawai harian di atas batas tarif harian tetap terutang PPh 21
  menurut aturan pegawai tidak tetap.
- **Tidak ada perhitungan ulang Desember/bulan keluar dengan Pasal 17.**
  Bracket `PASAL_17` ditanam di `tax_rules` tetapi tidak dipakai rumus mana pun.
  Akibatnya bukti potong A1 tidak bisa disusun dengan benar dari data
  sekarang.
- **Data pemotong belum ada**: `company_profile` tidak menyimpan NPWP, NITKU,
  atau nomor pendaftaran BPJS perusahaan.
- Data karyawan yang dibutuhkan sudah ada: NIK, NPWP, nomor BPJS (`hr_profil`,
  khusus cloud, `hr.finance.view`/`hr.personal.view`), PTKP (`salary_configs`),
  jenis kelamin, kontrak, pendidikan, jabatan (`master_data`, `hr_kontrak`,
  `hr_profil`), angka potongan per komponen di
  `payroll_items.breakdown_snapshot` (`bpjs[]`, `tax`).
- **Bulan sebuah run** di repo ini sudah ditetapkan = bulan `period_start`
  (jatah kasbon, schema v22). Laporan bulanan memakai aturan yang sama dan hanya
  run `PAID` (Q-162).

Usulan (Q-161): fase 13 **membaca angka apa adanya dan menandai** baris yang
terdampak temuan di atas; perbaikan rumus (TER bulanan, dasar BPJS, PPh harian,
rekonsiliasi Desember) menjadi **fase tersendiri sebelum atau sesudah** fase
13, karena menyentuh uang di dua bahasa dan butuh vektor uji resmi.

### 28.3 Model data

- **Data pemotong/pemberi kerja** (Q-163): NPWP perusahaan 16 digit, NITKU,
  nama penandatangan bukti potong, nomor pendaftaran BPJS TK dan Kesehatan.
  Usulan (a): tabel khusus cloud baru `app_lapor_setting` (key/value, pola
  `app_telegram_setting`), di versi skema berikutnya sesudah fase 12 (v44) dan
  fase 13, tidak tersinkron ke perangkat. Alternatif (b):
  kolom di `company_profile` (tabel platform tersinkron, aturan 29; menyentuh
  keempat lapis); (c) `setting_gex_system` (tersinkron ke terminal scanner).
- Tanpa tabel laporan: rekap dihitung saat dibuka dari `payroll_runs` +
  `payroll_items` + profil, tidak ada status "sudah dilapor" yang disimpan
  (Q-164 (a)).

### 28.4 Laporan yang disusun

1. **Rekap PPh 21 bulanan** (masa = bulan `period_start`, run `PAID`): per
   karyawan NIK/NPWP, nama, PTKP, kategori TER, bruto (Σ run bulan itu), PPh
   dipotong (Σ), jumlah run, tanda (`run_lebih_dari_satu` = TER per run,
   `harian_tanpa_pph`, `tanpa_nik`, `ptkp_kosong`). Total = Σ setoran bulan itu.
   Ekspor: Excel rekap + Excel berbentuk template impor Coretax (dibangun dari
   template resmi yang diberikan pemilik, Q-160).
2. **Rekap BPJS bulanan**: per karyawan nomor kepesertaan TK dan Kesehatan,
   dasar upah, setiap komponen (`JHT_EMP`, `JHT_CO`, `JP_EMP`, `JP_CO`,
   `JKK_CO`, `JKM_CO`, `BPJS_KES_EMP`, `BPJS_KES_CO`) dari
   `breakdown_snapshot.bpjs`, total pekerja/perusahaan. Tanda
   `dipotong_tanpa_nomor`, `bernomor_tanpa_potongan`, `run_lebih_dari_satu`.
   Daftar perubahan bulan itu: masuk (`tanggal_daftar`), keluar (`id_keluar`
   berlaku), upah berubah (`salary_configs.effective_date` di bulan itu).
3. **Rekap WLKP tahunan** (per tanggal acuan, bawaan 31 Desember atau hari
   ini): jumlah karyawan Aktif menurut L/P × jenis kontrak terakhir, menurut
   pendidikan, menurut jabatan, WNA (Q-166: belum ada kolom kewarganegaraan),
   kepesertaan BPJS (nomor terisi), rentang upah dari run terakhir.
4. **A1 tahunan**: Q-165. Usulan: belum disusun sampai rekonsiliasi Pasal 17
   ada; sementara disediakan rekap setahun (bruto, PPh dipotong, iuran
   pekerja) sebagai bahan konsultan.

Semua angka INTEGER rupiah, dijumlahkan tanpa pembagian; nominal dari
`payroll_items`, tidak dihitung ulang.

### 28.5 Hak akses

Laporan memuat NIK, NPWP, dan gaji semua karyawan. Usulan (Q-167): wajib
`payroll.export` (kini menganggur, cocok namanya) **dan** `hr.finance.view`;
pengaturan data pemotong `payroll.config.manage` (Superadmin saja). Area tetap
`payroll`; Mobile tidak (Q-168).

### 28.6 Command, rute, dan layar

- Rust: `desktop_report_tax_monthly`, `desktop_report_bpjs_monthly`,
  `desktop_report_wlkp`, `desktop_report_setting(_save)` (perkiraan 4–5
  command), bacaan payroll lokal + profil cloud. Web: aksi di rute payroll
  atau rute baru `POST /api/payroll/reports`.
- Layar: halaman "Pelaporan" di menu Penggajian (Web/Desktop), tiga tab
  (PPh 21, BPJS, Wajib Lapor), pemilih bulan/tahun, tabel bertanda, ekspor
  Excel; kartu "Data pemotong" di Pengaturan.

### 28.7 Tidak dikerjakan di fase ini

- Mengirim/menyetor ke Coretax, SIPP, e-Dabu, atau WLKP (tidak ada API terbuka
  untuk perusahaan kecil, dan CSP Desktop menolak host eksternal).
- Membuat kode billing, NTPN, atau menyimpan bukti setor.
- PPh 21 bukan pegawai (driver lepas, tenaga ahli), PPh 21 final pesangon,
  PPh 26.
- Perbaikan rumus payroll §28.2 (fase tersendiri, Q-161).
- Bukti potong A1 lengkap (Q-165).

### 28.8 Langkah (setelah Q dijawab)

| # | Langkah | Gerbang |
| :-- | :-- | :-- |
| 1 | Skema data pemotong (bila Q-163 (a): versi dan sentinel berikutnya sesudah fase 12 dan 13, tabel khusus cloud) | `audit:schema` + tes sentinel kedua workspace |
| 2 | Aturan murni rekap PPh 21, BPJS, WLKP + tanda (kembar Rust ↔ TS, SQL harfiah) | vektor sama |
| 3 | Command + rute + guard | `audit:contract` + `web-rbac-boundary` |
| 4 | Bacaan cloud/lokal Rust + Web | tes `local_file` + `services/*.test.ts`: bulan = `period_start`, hanya `PAID`, dua run sebulan dijumlah dan ditandai |
| 5 | Excel rekap ketiga laporan | tes workbook |
| 6 | Template impor Coretax (dari template resmi, Q-160) | vektor dari template |
| 7 | Layar, CLAUDE.md, "Sudah dibangun" | typecheck + Biome + `audit:docs`; `bun run check` oleh pemilik |

### 28.9 Penanda yang ditinjau pemilik

- **Aplikasi menyusun rekap dan berkas impor; melapor dan menyetor tetap
  manual** di portal masing-masing.
- **Angka laporan = angka yang dipotong payroll.** Bila rumus payroll keliru
  untuk suatu kasus (§28.2), laporan ikut keliru dan hanya ditandai.
- **A1 belum bisa disusun** tanpa rekonsiliasi Pasal 17.
- Aturan pajak/BPJS di §28.1 perlu diverifikasi dengan template dan konsultan
  sebelum format impor dibangun.

### 28.10 Pertanyaan untuk pemilik

| No | Pertanyaan | Usulan | Alasan |
| :-- | :-- | :-- | :-- |
| Q-160 | Bisa memberi template resmi terbaru (impor bukti potong Coretax, unggah upah SIPP/e-Dabu) atau kontak konsultan pajak? | Ya, sebelum langkah 6 | Format dan kolom resmi berubah; tidak boleh ditebak |
| Q-161 | Temuan §28.2 (TER per run, dasar BPJS, harian tanpa PPh, tanpa rekonsiliasi Desember): (a) fase 13 menandai saja, perbaikan rumus fase tersendiri; (b) perbaiki rumus dulu sebelum fase 13; (c) biarkan? | (a), lalu putuskan urutan fase perbaikan | Perbaikan rumus menyentuh uang di Rust dan TS dan butuh vektor resmi; laporan tetap berguna dengan tanda |
| Q-162 | Masa laporan: run `PAID` dengan `period_start` di bulan itu? | Ya | Sama dengan aturan kasbon; run yang belum dibayar belum dipotong |
| Q-163 | Data pemotong (NPWP, NITKU, penandatangan, nomor BPJS perusahaan): (a) tabel khusus cloud baru; (b) kolom `company_profile`; (c) `setting_gex_system`? | (a) | Tidak perlu ada di terminal scanner; (b) menyentuh keempat lapis tabel platform |
| Q-164 | Simpan status "sudah dilapor/disetor" per bulan? | Tidak di fase ini | Status di portal adalah sumber kebenarannya |
| Q-165 | A1 tahunan: (a) rekap setahun sebagai bahan konsultan; (b) tunggu rekonsiliasi Pasal 17? | (a) | A1 yang benar butuh perhitungan setahun yang belum ada |
| Q-166 | Ada karyawan WNA? Perlu kolom kewarganegaraan untuk WLKP? | Tanya klien | Belum ada kolomnya |
| Q-167 | Izin laporan: `payroll.export` + `hr.finance.view`? | Ya | `payroll.export` sudah ada dan belum dipakai |
| Q-168 | Pelaporan di Mobile? | Tidak | Pekerjaan bulanan meja keuangan; laporan lebar |
| Q-169 | PPh 21 bukan pegawai (driver lepas) dan pesangon ikut? | Tidak di fase ini | Sumber dan tarifnya berbeda |
| Q-170 | Urutan: fase 12 (transfer) lalu fase 13 (pelaporan)? | Ya | Transfer lebih jelas lingkupnya |
| Q-171 | Rekap BPJS memakai angka yang dipotong payroll, atau upah terdaftar di portal? | Yang dipotong payroll, dengan tanda | Upah terdaftar portal tidak ada di aplikasi |
| Q-172 | WLKP: tanggal acuan 31 Desember tahun lalu, atau bisa dipilih? | Bisa dipilih, bawaan 31 Desember | Laporan perubahan bisa diminta di tengah tahun |

### 28.11 Jawaban sementara (13 Nov 2026)

- **Q-160**: pemilik belum punya template resmi maupun konsultan; contoh akan
  diminta dari calon klien. Langkah 6 (template impor Coretax) menunggu itu.
- **Q-161: (b) perbaiki rumus dulu.** Alasan pemilik: ada perusahaan yang
  menggaji karyawannya dua minggu sekali, jadi TER per proses gaji langsung
  salah. Perbaikan rumus menjadi **fase 13 tersendiri** (rancangannya ditulis
  terpisah), dan pelaporan ini bergeser menjadi **fase 14**.
- **Q-170**: urutan yang berlaku: fase 12 berkas transfer, fase 13 perbaikan
  rumus PPh 21 dan BPJS, fase 14 pelaporan.
- Q-162 sampai Q-169, Q-171, dan Q-172 belum dijawab.

## 29. Urutan pengerjaan fase 13: perbaikan rumus PPh 21 dan BPJS

**Disetujui pemilik (13 Nov 2026)**: Q-177 sampai Q-192 sesuai usulan §29.11,
lihat §29.13. Ditulis 13 Nov 2026 setelah menelusuri kode dan regulasi. Isinya Q-161 (b): rumus
diperbaiki sebelum pelaporan fase 14 (§28). Bukan nasihat pajak: angka dan
aturan di §29.2 wajib dicocokkan dengan konsultan pajak sebelum dipakai klien.

### 29.1 Temuan dari kode

Diverifikasi ulang ke kode, bukan disalin dari §28.2. Semua item §28.2 benar,
tetapi tidak lengkap: butir 5 sampai 10 di bawah belum tercatat di sana.

1. **TER dihitung per proses gaji** (sesuai §28.2).
   `PayrollCalculator::calculate_employee_pay` (`payroll/engine.rs`) memanggil
   `calculate_pph21_ter(gross, ...)` dengan bruto SATU run; kembarannya
   `calculateEmployeePay` → `calculatePph21Ter` (`services/payroll-calculator.ts`).
   Tidak ada konsep masa pajak: `payroll_runs` hanya punya `period_start` /
   `period_end`, tanpa batas panjang, tanpa larangan tumpang tindih, dan dua
   run berperiode sama sama-sama berlaku. Run tidak bisa dihapus; `REJECTED`
   bisa kembali ke `DRAFT` (`PayrollStatus::can_transition_to`), dan item
   dibekukan sekali saat run dibuat.
2. **BPJS per run** (sesuai §28.2), dan dasarnya lebih lebar dari yang ditulis
   di sana: `calculate_bpjs(gross, ...)` memakai `gross = basic + overtime +
   allowance`, yaitu lembur DAN semua komponen ALLOWANCE (tetap maupun tidak).
   Batas upah diterapkan per run; tidak ada batas bawah. `bpjs_rules.component_code`
   `UNIQUE` di semua lapis, jadi satu komponen hanya punya satu baris:
   saringan `effective_date` di `load_bpjs_rules` tidak pernah memilih apa-apa,
   dan mengubah batas berarti menimpa. Seed JP `wage_cap` 10.042.300 (angka
   2024); yang berlaku sejak Maret 2026 11.086.300.
3. **`FLAT_DAILY` tanpa PPh dan BPJS** (sesuai §28.2): cabang awal
   `calculate_employee_pay`, keputusan NG-3 `prd-gaji.md`.
4. **Tanpa rekonsiliasi masa terakhir** (sesuai §28.2). Baris `PASAL_17` di
   `tax_rules` hanya dibaca layar config pajak.
5. **Tabel TER B dan TER C di seed salah.** `TAX_RULES_SEED_SQL`
   (`payroll_seed.rs`) TER A cocok 44 lapis. TER B benar sampai lapis 6, lalu
   memakai batas TER A (`tax_ter_b_7` 10.750.001–12.500.000 2%; seharusnya
   10.750.001–11.250.000 2%, lalu 2,5% dan 3%), 37 lapis, tertinggi 32%
   (seharusnya 40 lapis, 34% di atas 1.405.000.000). TER C benar sampai lapis 15,
   lalu salah (`tax_ter_c_16` 22.700.001–24.700.000 9%; seharusnya s.d.
   26.600.000), 39 lapis, tertinggi 32% (seharusnya 41, 34% di atas
   1.419.000.000). Contoh: K/1 bruto 12.000.000 dipotong 2% = 240.000,
   seharusnya 3% = 360.000; K/3 bruto 25.000.000 dipotong 10% = 2.500.000,
   seharusnya 9% = 2.250.000.
6. **Database yang hanya dimigrasi Web tidak punya TER sama sekali.** Seed di
   `db-migrations.ts` (blok `payroll-engine-foundation`) hanya menanam
   `PASAL_17` ber-id lama `tax-p17-*` dan BPJS ber-id dan kode lama (`JKK`,
   `JKM`, `KES_EMP`, `KES_CO`, JKK 0,24%, berlaku 2024-01-01). TER dan
   pembersihan `LEGACY_RATE_IDS` hanya ditanam `turso.rs` `ensure_schema`,
   yang berjalan bila Desktop/Mobile pernah tersambung. Pemasangan Web saja
   (image Docker, paket Windows, Vercel) membuat `calculatePph21Ter` tidak
   menemukan lapis apa pun: **PPh 21 selalu 0**, kecuali admin mengetik 125
   lapis sendiri. Urutan pembersihan dan seed di `turso.rs` saat baris lama
   berkode sama (`UNIQUE`) masih ada perlu diperiksa saat eksekusi.
7. **Bruto TER tidak memasukkan premi yang dibayar perusahaan.** `gross` tanpa
   JKK, JKM, dan BPJS Kesehatan bagian perusahaan; contoh resmi DJP (Tuan A,
   §29.2) memasukkannya.
8. **PTKP per run**: `salary_configs.ptkp_status` yang berlaku ≤
   `period_end`, sementara PMK 168 memakai keadaan awal tahun pajak (ragu,
   §29.2). Peta kategori benar (TK/0, TK/1, K/0 → A; TK/2, TK/3, K/1, K/2 → B;
   K/3 → C); nilai tak dikenal jatuh ke A.
9. **Komponen FIXED dihitung per run**, bukan per bulan (`calculate_components`
   dipanggil sekali per run). Tunjangan 500.000 "sebulan" dibayar dua kali
   untuk gaji dua mingguan. Bukan rumus pajak, tetapi menentukan bruto masa.
   Kasbon sudah per bulan (`TERPOTONG_BULAN_SQL`).
10. **PPh negatif belum dikenal di hilir.** `payroll_items.pph21_amount` tanpa
    CHECK (boleh negatif) dan `net_salary` CHECK ≥ 0. `susun_jurnal_payroll`
    (`loan.rs`) ↔ `susunJurnalPayroll` membuang baris kredit negatif, sehingga
    pengembalian PPh akan masuk `akun-potongan-gaji`. `SlipGajiPrintView`
    menampilkan PPh hanya bila `> 0`.

Kait yang dipakai rancangan:

- **Bulan sebuah run** sudah punya preseden: `TERPOTONG_BULAN_SQL` =
  `substr(r.period_start, 1, 7)` dan `r.status <> 'REJECTED'`.
- Urutan bersih: `net = gross − deduction − bpjs_employee − pph21` (≥ 0),
  lalu kasbon dipotong dari sisa (`potong_kasbon`), lalu reimbursement mode
  `gaji` ditambahkan. Rust menghitung ulang di `desktop_create_payroll_run`
  dengan fungsi yang sama; Web memakai hasil `computePayrollRecap` apa adanya.
- **Snapshot tarif** tidak punya tabel: `breakdown_snapshot.tax`
  (`category`, `rate_percentage`) dan `.bpjs[]` (`code`, `rate`, `wage_cap`,
  `nominal`).
- **Status pegawai tetap / tidak tetap tidak ada.** Yang terdekat:
  `master_data.jenis_personil` (`Pegawai`/`Kontrak`/`Harian`/`Magang`, dari
  kontrak terakhir lewat `JENIS_DARI_KONTRAK_SQL`, tersinkron) dan
  `salary_type`. Gaji keluar: `master_data.id_keluar` +
  `tanggal_selesai_aktif` (tersinkron, `KARYAWAN_REKAP_SQL`).
- Run dibuat dari SQLite lokal: run perangkat lain yang belum tersinkron tidak
  terlihat.
- Uang di TS memakai `number` (`roundMoney` = `Math.round`), Rust
  `rust_decimal` + `exact_decimal`. Vektor kembar yang menjaga keduanya sama.
- Mobile: `commands.rs`, `engine.rs`, `models.rs` disalin ke `payroll_admin/`
  dan `payroll_seed.rs` ikut daftar salin `sync-rust-modules.ts`; halaman
  payroll Mobile (`RunDetailClient`, `SlipDetailClient`) berkas terpisah.

### 29.2 Aturan menurut regulasi

Sumber utama: paparan resmi DJP "PMK 168 Tahun 2023 tentang PPh Pasal 21 TER"
(pajak.go.id, berisi tabel TER dan contoh hitung), PP 58/2023, Surat BPJS
Ketenagakerjaan B/1226/022026, Perpres 59/2024 Pasal 32. Pasal PMK yang disebut
"ragu" belum dicocokkan dengan teks PMK sendiri.

**Pegawai tetap** (termasuk PKWT yang dibayar teratur):

- Setiap masa selain masa terakhir: PPh = **TER bulanan × bruto sebulan**.
  Paparan DJP: "Gabung seluruh penghasilan Pegawai Tetap dalam 1 bulan". Batas
  atas lapis inklusif (5.400.000 masih 0%, 5.400.001 sudah 0,25%).
- Bruto termasuk premi JKK, JKM, dan BPJS Kesehatan yang dibayar pemberi
  kerja; iuran JHT dan JP bagian perusahaan tidak.
- **Masa pajak terakhir** (Desember, atau bulan berhenti bekerja): PPh setahun
  = Pasal 17 × PKP; PKP = bruto setahun − biaya jabatan − iuran pensiun/JHT/JP
  yang dibayar pegawai − zakat lewat pemberi kerja − PTKP, dibulatkan ke bawah
  ribuan penuh (UU PPh Pasal 17 ayat 4). PPh masa terakhir = PPh setahun − PPh
  masa sebelumnya. Kelebihan dikembalikan ke pegawai bersama bukti potong,
  paling lambat akhir bulan berikutnya (PMK 168 Pasal 21 ayat 1, ragu).
- Biaya jabatan 5%, paling banyak 500.000 per bulan bekerja (6.000.000
  setahun); contoh resign delapan bulan memakai 8 × 500.000.
- Pegawai yang berhenti tetapi tetap subjek pajak dalam negeri: **tidak
  disetahunkan**, PTKP penuh. Disetahunkan hanya bila meninggalkan Indonesia
  (di luar cakupan).
- PTKP: 54.000.000, + 4.500.000 kawin, + 4.500.000 per tanggungan (maks 3).
  Status yang dipakai: keadaan awal tahun pajak (ragu, belum dicocokkan pasal).
- Pasal 17: s.d. 60 jt 5%, s.d. 250 jt 15%, s.d. 500 jt 25%, s.d. 5 M 30%,
  di atasnya 35% (sesuai seed).

**Pegawai tidak tetap** (dibayar hanya bila bekerja: per hari, jam, unit,
atau borongan):

- Tidak dibayar bulanan: **TER harian** atas bruto sehari atau rata-rata bruto
  sehari: ≤ 450.000 0%; > 450.000 s.d. 2.500.000 0,5%; > 2.500.000 Pasal 17 ×
  50% × bruto.
- Dibayar bulanan: TER bulanan × bruto bulanan, Januari sampai Desember,
  **tanpa** rekonsiliasi Pasal 17.

**BPJS** (dasar = upah, yaitu gaji pokok + tunjangan tetap, tanpa lembur; ragu
untuk pekerja per jam dan harian lepas):

| Program | Pekerja | Perusahaan | Batas upah |
| :-- | :-- | :-- | :-- |
| JHT | 2% | 3,7% | tanpa batas |
| JP | 1% | 2% | 11.086.300 sejak Maret 2026 (10.547.400 Mar 2025–Feb 2026; 10.042.300 2024) |
| JKK | – | 0,24–1,74% menurut risiko | tanpa batas |
| JKM | – | 0,30% | tanpa batas |
| Kesehatan | 1% | 4% | atas 12.000.000; bawah UMP/UMK kecuali usaha mikro/kecil |

**Bahan vektor uji** (angka contoh resmi; "dihitung" = dihitung dari data
contoh karena kolom masa terakhir di paparan berupa gambar, wajib dicocokkan
dengan lampiran PMK):

| # | Kasus | Hasil |
| :-- | :-- | :-- |
| V1 | Tuan R, K/0, gaji 10.000.000, iuran pensiun 100.000 | Jan–Nov 2% = 200.000; setahun 2.715.000; Desember 515.000 |
| V2 | Tuan A, K/0, bruto setahun 450.960.000 (termasuk JKK+JKM 80.000/bulan), iuran pegawai 1.200.000, zakat 2.400.000 | Jan–Nov 50.120.000 (cocok paparan); dihitung: PKP 382.860.000, setahun 64.715.000, Desember 14.595.000 |
| V3 | Tuan D, TK/0, 17.500.000 × 8, berhenti 1 Sep, iuran 100.000 | Jan–Jul 8% = 9.800.000; dihitung: biaya jabatan 4.000.000, PKP 81.200.000, setahun 6.180.000, Agustus −3.620.000 (dikembalikan) |
| V4 | Tuan H, K/2, 6.800.000 | TER B 0,5% = 34.000 |
| V5 | Tuan G, TK/0, 65.605.059 | TER A 21% = 13.777.062 |
| V6 | K/1 12.000.000; K/3 25.000.000 | TER B 3% = 360.000; TER C 9% = 2.250.000 (temuan 5) |
| V7 | Tuan L, tidak tetap, 4.500.000 untuk 10 hari | rata-rata 450.000, 0% = 0 |
| V8 | Tuan M, tidak tetap, 3.000.000 sehari | 5% × 50% × 3.000.000 = 75.000 |
| V9 | Tuan N, tidak tetap dibayar bulanan, TK/0, 7.000.000 | TER A 1,25% = 87.500, termasuk Desember |
| V10 | Dua mingguan, TK/0, 2 run × 3.000.000 sebulan | sekarang 0 + 0; benar masa 6.000.000 × 0,75% = 45.000 (run 1: 0, run 2: 45.000) |
| V11 | JP dua mingguan, 2 run × 8.000.000 | sekarang 80.000 + 80.000; benar 1% × 11.086.300 = 110.863 |
| V12 | Batas lapis TER A | 5.400.000 → 0; 5.400.001 → 13.500 |

### 29.3 Rancangan rumus

Satu modul murni kembar `payroll/pajak.rs` (ikut daftar salin
`payroll_admin`) ↔ `validations/pajak.ts`, vektor V1–V12 di
`validations/pajak.vektor.json` (dibaca Rust lewat `include_str!`, pola
`transfer.vektor.json`). Semua uang `i64`/INTEGER rupiah; Rust `rust_decimal`
`MidpointAwayFromZero`; TS bilangan bulat (persen tarif diubah ke per sepuluh
ribu lewat `persen_ke_basis` ↔ `persenKeBasis`, tarif dengan lebih dari dua
desimal ditolak saat disimpan), tanpa `Math.round` atas pecahan.

**Masa dan run pembanding.** `masa = substr(period_start, 1, 7)` (Q-177).
"Sudah dipotong di masa ini" = item karyawan yang sama di run lain bermasa
sama, `status <> 'REJECTED'` (preseden kasbon, Q-190). SQL kembar
`RUN_MASA_SQL` dan `RUN_TAHUN_SQL` mengembalikan per item: bruto pajak, PPh,
dasar BPJS, dan nominal per kode BPJS dari `breakdown_snapshot`. Gateway
Desktop/Mobile menjalankan `syncNow()` sebelum membuat run (preseden Q-72).

**Status pajak** `status_pph` ↔ `statusPph` (Q-178 (a)): `jenis_personil`
`Pegawai`/`Kontrak` → tetap, `Harian` → tidak tetap; selain itu menurut
`salary_type` (`HOURLY` tetap, `FLAT_DAILY` tidak tetap).

**Urutan per karyawan per run**: BPJS masa → premi perusahaan → bruto pajak →
PPh → `net` seperti sekarang (PPh negatif menambah `net`) → kasbon →
reimbursement (tidak berubah).

1. **BPJS per masa.** `dasar_run = basic + Σ ALLOWANCE bertanda dasar BPJS`
   (Q-181), tanpa lembur. `D_masa = Σ dasar run pembanding + dasar_run`. Per
   kode: `iuran_masa = round(tarif × min(D_masa, wage_cap))`; potongan run =
   `iuran_masa − Σ nominal kode itu di run pembanding`, paling kecil 0. Run lama
   ikut lewat `nominal`-nya. `FLAT_DAILY` tetap tanpa BPJS (Q-182).
2. **Bruto pajak** = `gross_salary` + JKK, JKM, BPJS Kesehatan bagian
   perusahaan run ini (`KODE_PREMI`, termasuk kode lama Web `JKK`, `JKM`,
   `KES_CO`). Untuk item lama tanpa kunci `pajak` dihitung ulang dengan cara
   yang sama dari `gross_salary` dan `breakdown_snapshot.bpjs`.
3. **Tetap, masa biasa**: `B_masa = Σ bruto pajak pembanding + bruto run`;
   `P_masa = round(TER(kategori, B_masa) × B_masa)`; potongan = `P_masa − Σ PPh
   pembanding`, paling kecil 0 (lebih potong tengah tahun ditandai
   `lebih_potong_masa` dan diselesaikan masa terakhir). TER bulanan naik
   monoton, jadi potongan run kedua tidak pernah negatif kecuali run lama
   dihitung dengan tarif yang salah.
4. **Tetap, masa terakhir** (masa Desember, atau masa = bulan
   `tanggal_selesai_aktif` bila `id_keluar` terisi saat run dibuat):
   `B_tahun` = bruto pajak semua item berstatus tetap tahun itu sampai run ini;
   `BJ = min(round(5% × B_tahun), 500.000 × jumlah masa berbruto)`;
   `IP` = Σ `JHT_EMP` + `JP_EMP` tahun itu; `PKP = max(0, ⌊(B_tahun − BJ − IP −
   PTKP) / 1000⌋ × 1000)`; `P_tahun` = Pasal 17 dari `tax_rules` `PASAL_17`;
   potongan = `P_tahun − Σ PPh tahun itu sebelum run ini`, **boleh negatif**
   (Q-189). Setiap run Desember menghitung ulang, jadi run terakhir bulan itu
   yang menuntaskan. PTKP dari status awal tahun (Q-180).
5. **Tidak tetap, run bukan sebulan penuh**: `hari = days_present` (0 dengan
   bruto > 0 dihitung 1 dan ditandai `tanpa_hari`). `bruto ≤ 450.000 × hari` →
   0; `≤ 2.500.000 × hari` → `round(0,5% × bruto)`; di atasnya Pasal 17 atas
   50% × bruto run (Q-191). Tanpa masa dan tanpa rekonsiliasi.
6. **Tidak tetap, run sebulan penuh** (`period_start` tanggal 1 dan
   `period_end` akhir bulan yang sama, Q-179): rumus 3, tanpa masa terakhir.

**Konstanta** PTKP, biaya jabatan, dan TER harian di
`validations/pajak-bawaan.json` (Q-187, pola `akun-bawaan.json`). TER bulanan
dan Pasal 17 tetap di `tax_rules`.

**Snapshot.** `breakdown_snapshot` mendapat kunci `pajak` (`versi`, `masa`,
`status`, `metode` `TER_BULANAN` / `TER_HARIAN` / `PASAL_17_HARIAN` /
`PASAL_17_TERAKHIR`, `kategori`, `tarif`, `bruto_pajak`, `premi`,
`bruto_masa`, `sudah_dipotong`, `hari`, dan untuk masa terakhir `bruto_tahun`,
`biaya_jabatan`, `iuran_pensiun`, `ptkp`, `pkp`, `pph_setahun`) dan
`bpjs_masa` (`dasar_run`, `dasar_masa`). `tax` dan `bpjs` tetap untuk slip
lama. Tanpa kolom baru di `payroll_items`.

**Tanda, tidak menolak**: `lebih_potong_masa`, `lintas_bulan` (Q-183),
`tanpa_hari`, `rumus_lama` (run pembanding tanpa kunci `pajak`),
`status_pajak_berubah` (item tahun itu berstatus berbeda; masa terakhir hanya
menjumlah item tetap), `komponen_per_run` (Q-184).

### 29.4 Run lama

- **Tidak ada run yang dihitung ulang**, berstatus apa pun. Rumus baru hanya
  untuk run yang dibuat sesudah pembaruan; run terbuka yang dibuat sebelumnya
  tetap berangka lama dan ditandai `rumus_lama` (Q-185).
- Angka run lama masuk perhitungan sebagai "sudah dipotong": run baru pertama
  di masa yang sudah punya run lama menambal kekurangannya, dan masa terakhir
  2026 mengoreksi seluruh tahun, termasuk kekurangan atau kelebihan akibat
  TER B/C yang salah. **Potongan Desember 2026 bisa besar**, atau berupa
  pengembalian.
- **Slip** (`SlipGajiPrintView`, Mobile `SlipDetailClient`): PPh tampil bila
  `!== 0` dengan label metode ("TER A 1,25%", "Masa terakhir (Pasal 17)",
  "Pengembalian PPh 21" bila negatif); item tanpa kunci `pajak` tetap
  ditampilkan seperti sekarang.
- **Jurnal `pay-<run>`**: `susun_jurnal_payroll` ↔ `susunJurnalPayroll`
  menaruh total PPh negatif di DEBIT `akun-utang-pph21`; vektor baru di kedua
  tes.
- **Kasbon**: aturan tidak berubah, tetap dipotong dari `net` sesudah PPh.
  Pengembalian PPh memperbesar ruang potong kasbon bulan itu.
- **Reimburse mode `gaji`**: tidak berubah; tetap di luar bruto dan di luar
  pajak. `periksa_reimburse_run` tidak tersentuh.
- **Berkas transfer fase 12**: tetap `net_salary`; pengembalian PPh otomatis
  ikut.
- **Karyawan keluar (fase 5)**: masa terakhir hanya terjadi bila Berlakukan
  sudah tersinkron sebelum run bulan itu dibuat. Bila Berlakukan menyusul,
  rekonsiliasi tertinggal; run susulan untuk bulan itu akan menghitungnya,
  tetapi run susulan juga mengulang komponen FIXED karyawan lain (temuan 9).
  Batalkan keluar sesudah run terakhir tidak membatalkan rekonsiliasinya.

### 29.5 Model data dan sinkronisasi

**Usulan: skema v45, sentinel `-2041` `payroll-pajak-masa-v1`.** Rumusnya
sendiri tidak butuh kolom (status dari `jenis_personil`, konstanta di JSON,
jejak di `breakdown_snapshot`), tetapi tiga hal butuh migrasi data yang hanya
berjalan bila versi naik (Web: `isDatabaseSchemaReady` membandingkan
`MAX(version)`; Rust: sentinel di `ensure_schema_current`):

1. **Koreksi TER B dan C** di `turso.rs` dan `db-migrations.ts`: `UPDATE` baris
   `tax_ter_b_7..37` dan `tax_ter_c_16..39` HANYA bila nilainya masih sama
   dengan seed lama, lalu `INSERT OR IGNORE` `tax_ter_b_38..40` dan
   `tax_ter_c_40..41` (Q-186). `tax_rules` tersinkron (`conflict_column` `id`,
   `delete_missing: false`), jadi perangkat menerimanya lewat snapshot; seed
   lokal ikut dibetulkan untuk pemasangan baru.
2. **Seed tarif satu sumber**: TER, Pasal 17, dan BPJS bawaan dipindah ke
   `validations/tarif-bawaan.json`, dibaca `payroll_seed.rs` lewat
   `include_str!` dan `db-migrations.ts` lewat import; Web akhirnya menanam TER
   (temuan 6). Baris lama Web (`tax-p17-*`, `bpjs-jkk`, …) dibersihkan Web juga
   dengan daftar `LEGACY_RATE_IDS` yang sama.
3. **Batas JP 11.086.300**, berlaku 2026-03-01, hanya untuk baris yang masih
   bernilai seed 10.042.300 (Q-186).
4. **Bila Q-181 (a)**: kolom `payroll_components.dasar_bpjs INTEGER NOT NULL
   DEFAULT 0 CHECK (dasar_bpjs IN (0,1))`, tabel tersinkron, keempat lapis:
   `storage.rs` kedua workspace (CREATE + `ensure_column`), `turso.rs` (DDL,
   `ensure_column`, handler komponen menimpa hanya bila payload membawa
   kuncinya), `sync.rs` (`SNAPSHOT_TABLES.columns` dan payload
   `ensure_unsynced_payroll_data_enqueued`), `db-schema.ts`/`db-migrations.ts`
   (`hasColumn`), `models.rs`, gateway, Zod `.strict()` rute
   `config/components`.

Daftar yang ikut: `CURRENT_SCHEMA_VERSION`/`CLIENT_SCHEMA_VERSION` 45 (Desktop
dan Mobile), sentinel `-2041` (INSERT dan `ensure_schema_current`),
`isDatabaseSchemaReady`, `schema-consistency.test.ts`, daftar versi
`rbac-migration.test.ts`. Tanpa tabel baru: `REQUIRED_TABLE_COUNT` tetap 107,
68 tabel snapshot, 90 rute, `PROMOTION_PLAN` tetap. Perangkat v44 berhenti
sinkron begitu cloud v45 (Q-188).

### 29.6 Hak akses

Tanpa izin baru. Membuat run `payroll.run.create`, tarif dan komponen
`payroll.config.manage`, seperti sekarang.

### 29.7 Command, rute, dan layar

- Tanpa command atau rute baru (Desktop 307 / Mobile 313). Berubah:
  `desktop_get_payroll_recap`, `desktop_create_payroll_run` (Rust, salinan
  `payroll_admin` ikut), `computePayrollRecap` dan `POST /api/payroll/runs`
  (Web), simpan komponen bila Q-181 (a).
- Rekap dan rincian run: kolom PPh dan BPJS menampilkan metode dan tanda;
  ringkasan run menyebut berapa item bertanda `rumus_lama`.
- Form komponen: centang "Tunjangan tetap (dasar BPJS)" bila Q-181 (a).
- Halaman aturan pajak: kartu baca-saja PTKP, biaya jabatan, dan TER harian
  dari JSON; halaman BPJS: catatan bahwa batas JP berubah setiap Maret.
- Halaman payroll Mobile disunting manual (bukan salinan).

### 29.8 Tidak dikerjakan di fase ini

- Zakat/sumbangan keagamaan lewat pemberi kerja, PPh 21 DTP, gross-up
  (tunjangan pajak), pegawai dengan dua pemberi kerja, WNA yang meninggalkan
  Indonesia (disetahunkan), PPh 26, bukan pegawai, pesangon final.
- Pemisahan penghasilan teratur dan tidak teratur (THR/bonus): semua komponen
  diperlakukan sama.
- Batas bawah UMP/UMK BPJS Kesehatan (data upah minimum tidak ada) dan anggota
  keluarga tambahan.
- Generasi tarif `bpjs_rules` (tetap `UNIQUE component_code`, ditimpa).
- Komponen FIXED sebagai jatah per bulan (Q-184), BPJS untuk `FLAT_DAILY`
  (Q-182).
- Pengembalian PPh lewat jalur selain run gaji.

### 29.9 Langkah

| # | Langkah | Gerbang |
| :-- | :-- | :-- |
| 1 | **Skema v45**: `tarif-bawaan.json`, koreksi TER B/C dan JP bersyarat, seed TER di Web, pembersihan id lama Web, kolom `dasar_bpjs` bila Q-181 (a) | `audit:schema` + `cargo test sentinel_2040_mengoreksi_tarif` (baris seed lama dikoreksi, baris yang disunting admin tidak) kedua workspace + tes migrasi Web (database baru punya 125 lapis TER) |
| 2 | **Aturan kembar** `pajak.rs` ↔ `pajak.ts`: status, TER bulanan/harian, masa terakhir, BPJS masa, bruto pajak, tanda | `bun test validations/pajak.test.ts` + `cargo test pajak` kedua workspace, vektor V1–V12 dari JSON yang sama |
| 3 | **SQL kembar** `RUN_MASA_SQL`/`RUN_TAHUN_SQL` + integrasi rekap dan pembekuan Rust | tes SQLite: dua run sebulan, masa Desember, karyawan keluar, run lama tanpa `pajak`, run `REJECTED` diabaikan |
| 4 | **Web** `computePayrollRecap` + rute run | `services/*.test.ts`: data langkah 3, hasil sama |
| 5 | **Hilir**: jurnal PPh negatif, slip Web dan Mobile, layar §29.7 | vektor jurnal kembar; typecheck + Biome |
| 6 | `sync:mobile`, CLAUDE.md, `prd-gaji.md`, angka di skill, "Sudah dibangun" | `audit:contract` + `audit:docs`; `bun run check` oleh pemilik |

### 29.10 Penanda yang ditinjau pemilik

- **Gaji bersih berubah** untuk karyawan dengan lebih dari satu run sebulan,
  PTKP kategori B/C, karyawan yang dipotong BPJS di atas batas JP, dan semua
  karyawan tetap di Desember. Premi JKK/JKM/Kesehatan perusahaan kini menaikkan
  PPh sedikit.
- **Desember 2026 menanggung koreksi setahun** dari tarif dan rumus lama.
- `FLAT_DAILY` mulai dipotong PPh bila rata-rata di atas 450.000 sehari.
- Dua perangkat offline yang membuat run di masa yang sama tidak saling
  melihat; kekurangannya terkoreksi di masa terakhir, tidak dicegah.
- Pengembalian PPh dibayar lewat gaji bersih; pemilik wajib memastikan setoran
  dan pelaporannya sesuai (fase 14).
- Naik ke v45: semua perangkat wajib diperbarui.
- Aturan §29.2 wajib dicek konsultan pajak sebelum dipakai klien.

### 29.11 Pertanyaan untuk pemilik

| No | Pertanyaan | Usulan | Alasan |
| :-- | :-- | :-- | :-- |
| Q-177 | Masa pajak sebuah run: (a) bulan `period_start`; (b) bulan `period_end`; (c) bulan saat ditandai `PAID`? | (a) | Sama dengan kasbon; (c) belum diketahui saat run dihitung |
| Q-178 | Pegawai tetap atau tidak tetap: (a) dari `jenis_personil` (kontrak), lalu jenis gaji; (b) kolom baru di `salary_configs`? | (a) | Tanpa kolom; kontrak sudah menyatakan hubungan kerja |
| Q-179 | Pegawai tidak tetap "dibayar bulanan" bila run tepat satu bulan kalender? | Ya | Selain itu TER harian |
| Q-180 | PTKP: (a) status yang berlaku 1 Januari (atau konfigurasi pertama tahun itu); (b) konfigurasi per run seperti sekarang? | (a) | PMK memakai keadaan awal tahun (perlu dicek konsultan) |
| Q-181 | Dasar BPJS: (a) gaji pokok + tunjangan yang ditandai "tetap" (kolom baru, bawaan tidak ditandai); (b) gaji pokok saja; (c) bruto tanpa lembur? | (a) | Regulasi: gaji pokok + tunjangan tetap; aplikasi tidak bisa menebak mana yang tetap |
| Q-182 | `FLAT_DAILY` tetap tanpa BPJS? | Ya, fase ini | Keputusan NG-3; harian lepas punya aturan kepesertaan sendiri |
| Q-183 | Run yang melintasi dua bulan: (a) boleh, masa = bulan `period_start`, ditandai; (b) ditolak? | (a) | Gaji mingguan wajar melintasi akhir bulan |
| Q-184 | Komponen FIXED untuk gaji lebih dari satu run sebulan: (a) tetap per run, ditandai; (b) jatah per bulan seperti kasbon? | (a), (b) fase sendiri | Mengubah komponen menyentuh semua slip; pajak tetap benar atas bruto yang dibayar |
| Q-185 | Run terbuka saat pembaruan: (a) biarkan berangka lama, ditandai; (b) wajib ditolak dan dibuat ulang? | (a) | Pemilik bisa menolak sendiri; masa terakhir mengoreksi |
| Q-186 | Koreksi otomatis TER B/C dan batas JP: (a) hanya baris yang masih sama dengan seed; (b) timpa semua; (c) admin manual? | (a) | Tarif yang sengaja diubah admin tidak ditimpa |
| Q-187 | PTKP, biaya jabatan, TER harian: (a) konstanta JSON di kode; (b) tabel yang bisa diubah di layar? | (a) | Jarang berubah; (b) butuh membangun ulang CHECK `tax_rules` di empat lapis |
| Q-188 | Rilis v45 bersama v43–v44 (fase 8–12)? | Ya | Satu putaran pembaruan perangkat |
| Q-189 | Lebih bayar di masa terakhir: (a) dikembalikan lewat gaji bersih run itu; (b) PPh 0, kelebihan diurus manual? | (a) | Kewajiban pemotong menurut PMK 168 |
| Q-190 | Run yang dihitung "sudah dipotong": (a) semua kecuali `REJECTED`, termasuk `DRAFT`; (b) hanya `APPROVED`/`PAID`? | (a) | Sama dengan kasbon; (b) membuat dua run terbuka sebulan sama-sama memotong penuh |
| Q-191 | Pegawai tidak tetap di atas 2.500.000 sehari: Pasal 17 atas 50% bruto run? | Ya, ditandai | Jarang; cara pasti untuk beberapa hari perlu dicek konsultan |
| Q-192 | Pegawai yang status pajaknya berubah di tengah tahun (Harian → PKWT): masa terakhir hanya menjumlah masa berstatus tetap? | Ya, ditandai | Penghasilan saat tidak tetap sudah final per pembayaran |

### 29.12 Dampak ke rancangan fase 14 (§28)

Dicatat di sini; §28 tidak disunting.

- §28.2 sebagian besar selesai oleh fase ini. Tanda `run_lebih_dari_satu` dan
  `harian_tanpa_pph` di §28.4 hilang; gantinya `rumus_lama` untuk item tanpa
  kunci `pajak`.
- Rekap PPh 21 bulanan membaca `breakdown_snapshot.pajak`: masa (Q-177, sama
  dengan Q-162), bruto = `bruto_pajak` (termasuk premi), metode dan kategori,
  dan pemisahan pegawai tetap (BPMP) dari tidak tetap (bukti potong harian)
  lewat `pajak.status`.
- A1 tahunan (Q-165) menjadi mungkin dari kunci masa terakhir (`bruto_tahun`,
  `biaya_jabatan`, `iuran_pensiun`, `ptkp`, `pkp`, `pph_setahun`); usulan
  Q-165 perlu ditulis ulang.
- Rekap BPJS memakai `bpjs_masa.dasar_masa` dengan batas per masa, lebih dekat
  ke tagihan portal; Q-171 tetap relevan untuk upah terdaftar.
- Data pemotong (Q-163) bila tabel baru: versi sesudah v45, yaitu v46 /
  sentinel `-2042`.

### 29.13 Jawaban (13 Nov 2026)

- **Q-177 sampai Q-192**: semuanya sesuai usulan §29.11, dan penanda §29.10
  disetujui. Karena Q-181 (a), langkah 1 memuat kolom
  `payroll_components.dasar_bpjs`.
- Eksekusi per langkah §29.9 di sesi terpisah. Sebelum langkah 2, angka masa
  terakhir V2 dan V3 (§29.2) yang masih "dihitung" dicocokkan dengan lampiran
  PMK 168 bila tersedia; bila tidak, vektor itu ditandai sebagai hitungan
  sendiri di berkas vektornya.

### 29.14 Sudah dibangun (13 Nov 2026)

Langkah 1–6 dibangun: skema v45 (sentinel `-2041` `payroll-pajak-masa-v1`,
`REQUIRED_TABLE_COUNT` 107, 68 tabel snapshot, 90 rute), command Desktop 307 /
Mobile 313, tanpa izin baru. Gerbang yang dijalankan:

- `audit:schema` lulus; `audit:contract` lulus (307/313); `audit:docs` lulus.
- `cargo test --lib` Desktop dan Mobile, masing-masing 75 lulus (pajak,
  payroll, loan, sentinel, storage, hr_pengajuan, engine), termasuk
  `sentinel_2040_mengoreksi_tarif` (seed lama dikoreksi ke 125 lapis TER,
  lapis dan batas JP yang disunting admin tidak ditimpa, baris lama Web
  `bpjs-jht-emp` diganti seed baru, kolom `dasar_bpjs` lahir, handler komponen
  mempertahankan penanda bila kuncinya absen), `payroll_seed::tests`,
  `payroll::pajak::tests` (vektor V1–V12, tepi, pembanding),
  `payroll::commands::tests_pajak` (dua run sebulan, Desember dengan run
  lama, karyawan keluar, `REJECTED`/tahun lalu/masa sesudahnya diabaikan,
  PTKP awal tahun), dan `jurnal_payroll` (pengembalian PPh).
- `bun test` per berkas dengan `--no-env-file`, 67 berkas di setiap workspace
  (`services/`, `validations/`, `server/operational/`, `rbac/`, `server/`),
  0 gagal; termasuk `pajak.test.ts` (vektor sama dan teks harfiah terhadap
  kedua `pajak.rs`), `tarif-bawaan.test.ts`, `payroll-pajak.test.ts` (data
  langkah 3 di skema Web, ditambah `computePayrollRecap` ujung ke ujung),
  `schema-consistency` (database baru 125 lapis TER; database v44 dikoreksi
  bersyarat), `loan.test.ts`.
- Typecheck kedua workspace dan Biome berkas yang diubah bersih; `cargo check`
  tanpa peringatan baru.

`bun run check` penuh belum dijalankan (pemilik). Layar belum dicoba di
aplikasi yang berjalan (tema gelap dan terang, lebar 360 px).

Penyimpangan dan catatan, untuk ditinjau:

- **Angka TER B/C ditulis dari tabel PP 58/2023**, lalu dicocokkan dengan
  semua titik di §29.1 dan vektor V4/V6; belum disalin dari dokumen resmi.
  V2 Desember dan V3 Agustus ditandai `hitungan sendiri` di berkas vektor
  (lampiran PMK 168 tidak tersedia); zakat V2 digabung ke iuran pensiun
  karena zakat di luar cakupan (§29.8), PKP-nya sama.
- **Urutan seed diperbaiki** (§29.1 butir 6 terbukti): seed TER/BPJS kini
  berjalan sesudah `purge_legacy_rate_rows` di `turso.rs` dan sesudah
  pembersihan id lama di `db-migrations.ts`. Menyangkut uang: pembersihan id
  lama Web juga membuang suntingan admin pada baris itu (mis. JKK 0,24% Web
  menjadi `JKK_CO` 0,54%); Rust sudah begini sejak dulu.
- **Koreksi JP dicocokkan lewat `component_code`**, bukan id. Karena
  `bpjs_rules` satu baris per kode, run Januari–Februari 2026 yang dibuat
  sesudah pembaruan juga memakai batas 11.086.300 (sejalan §29.8).
- **Satu SQL pembanding**: `RUN_TAHUN_SQL` saja; himpunan masa diambil dari
  hasilnya (`RUN_MASA_SQL` tidak dibuat). Dasar BPJS item lama = `gross_salary`
  (rumus lama memang memotong atas bruto; `FLAT_DAILY` lama 0); status item
  lama dari jenis gaji.
- **Tanda tambahan** di luar §29.3: `tarif_tidak_ada` (tidak ada lapis
  TER/Pasal 17 yang cocok, PPh 0; di masa terakhir tidak mengembalikan apa
  pun) dan, untuk BPJS, `tarif_tidak_sah` di `bpjs_masa.tanda`.
- **Pasal 17 harian (Q-191)**: dasar 50% dibulatkan ke rupiah lebih dulu.
- **Konstanta seed** tetap bernama `TAX_RULES_SEED_SQL`/`BPJS_RULES_SEED_SQL`
  (kini SQL berparameter) karena `audit:contract` memeriksa nama itu; skrip
  audit tidak diubah.
- **Uji engine lama berubah sengaja**: BPJS per jam kini atas gaji pokok saja
  kecuali tunjangan bertanda (Q-181 (a)).
- **Validasi tarif** (§29.3) dipasang di empat command simpan tarif dan rute
  `config/tax|bpjs`; rute `config/components` mendapat Zod `.strict()`
  (sebelumnya tanpa validasi), `created_at` boleh terbawa dan diabaikan.
- **`PayrollRecapRow`** mendapat `jenis_personil`, `keluar_pada`,
  `ptkp_awal_tahun`, `pajak` (Rust dan TS). Snapshot `tax.rate_percentage`
  kini `null` untuk metode Pasal 17.
- **MSRV 1.77.2**: `is_none_or` di `pajak.rs` diganti `map_or`.
- **Layar**: slip menampilkan PPh bila `!== 0` dengan label metode
  ("PPh 21 TER A 2%", "masa terakhir (Pasal 17)", "Pengembalian PPh 21");
  Mobile menulis pengembalian sebagai `+` berwarna hijau. Rincian run kedua
  versi menampilkan label dan tanda di bawah angka PPh, plus catatan jumlah
  slip `rumus_lama`. Kartu konstanta dan catatan JP di
  `components/payroll/KonstantaPajak.tsx` (di `filesToCopy`). Rekap pratinjau
  sebelum membuat run belum menampilkan metode (nilai `pajak` sudah ada di
  baris rekap).
