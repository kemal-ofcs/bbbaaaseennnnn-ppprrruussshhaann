# PRD — Perjalanan Driver (draf 1, belum dieksekusi)

Status: **semua pertanyaan sudah dijawab (9 Nov 2026).** Jawabannya ada di
§12 dan urutan pengerjaannya di §13. Belum ada kode yang ditulis.

---

## 1. Masalah

Driver jarang datang ke kantor, jadi scan QR di terminal tidak menggambarkan
kerjanya. Yang perlu diketahui kantor setiap hari:

- kapan driver berangkat dari pool, tiba dan selesai di setiap tempat muat dan
  bongkar, dan kapan pengiriman hari itu selesai;
- apa yang terjadi di jalan (macet, kendaraan rusak) dan kenapa terlambat;
- kendaraan dan driver yang diganti di tengah jalan;
- perjalanan yang batal sebelum berangkat, beserta alasannya;
- bukti untuk setiap laporan: foto di tempat, koordinat, kendaraan, nama
  driver, waktu, dan nama perusahaan.

## 2. Apakah fitur ini masuk aplikasi ini?

**Rekomendasi: ya, sebagai modul "Perjalanan Driver" yang punya izin
sendiri.** Alasannya, hampir semua bahannya sudah ada:

| Kebutuhan | Yang sudah ada |
| :-- | :-- |
| Identitas driver | `master_data` (personil, divisi, status aktif) |
| Foto bukti dari kamera langsung | pola `absensi_foto` + kamera pemindai (aturan 14) |
| Koordinat | `lib/client/geolocation.ts`, izin `ACCESS_FINE_LOCATION` di APK |
| Pencocokan lokasi | rumus Haversine + validasi `geofence.ts` |
| Nama perusahaan di stempel | `company_profile` |
| Offline-first + sinkronisasi | outbox, snapshot, empat lapisan |
| Hak akses | RBAC + `require_permission` |
| Pemberitahuan kendala ke grup | modul Telegram (v33) |

Kalau dibuat sebagai aplikasi terpisah, identitas driver terputus dari data
karyawan dan payroll, dan seluruh infrastruktur sinkronisasi harus dibangun
ulang.

**Batasnya:** kalau nanti yang diminta berkembang menjadi pelacakan live di
peta, BBM, servis armada, uang jalan, tanda tangan penerima, atau rute
optimal, itu sudah sistem manajemen transportasi (TMS). Lebih baik dibuat
sebagai produk terpisah daripada ditumpuk di aplikasi absensi.

**Perubahan arsitektur yang paling besar** bukan tabel perjalanannya, tetapi
pola pemakaiannya: selama ini satu perangkat (terminal) dipakai banyak
karyawan, sedangkan di sini **setiap driver memakai HP-nya sendiri dan login
sendiri**. Dampaknya ke akun (§7) dan lisensi perangkat (§7.3, (Q-1)).

## 3. Istilah

| Istilah | Arti |
| :-- | :-- |
| **Perjalanan** | **Satu surat jalan** (Q-2), dari berangkat sampai selesai. Kendaraan dan driver bisa berganti di tengahnya; perjalanannya tetap sama. Satu driver bisa menjalankan beberapa surat jalan dalam sehari, satu per satu. |
| **Laporan** | Satu kejadian dalam perjalanan (tiba, selesai, kendala, ganti, dan seterusnya). Selalu berisi foto, koordinat, dan waktu. |
| **Titik** | Tempat muat atau bongkar yang dikunjungi. Jumlahnya tidak dibatasi. |
| **Lokasi terdaftar** | Pool, gudang, atau pelanggan yang koordinat dan radiusnya disimpan (opsional). (Q-6) |
| **Dispatcher** | Petugas kantor yang membuat dan mengatur perjalanan. |

## 4. Alur

### 4.1 Alur normal

```
Direncanakan ──(Berangkat dari pool)──► Berjalan
  Berjalan:  Tiba Muat → Selesai Muat   (diulang untuk setiap tempat muat)
             Tiba Bongkar → Selesai Bongkar   (diulang untuk setiap tempat bongkar)
             Kendala                    (kapan saja, perjalanan tetap berjalan)
  ──(Selesai)──► Selesai
```

- Setelah `Selesai Muat`, layar driver menawarkan dua tombol: **"Ke tempat muat
  berikutnya"** atau **"Berangkat ke bongkar"**. Driver tidak perlu tahu sejak
  awal berapa tempat yang akan didatangi, jadi rencana titik di awal tidak
  wajib.
- `Selesai Muat` berarti "barang sudah masuk kendaraan, bersiap ke titik
  berikutnya", dan `Selesai Bongkar` sama untuk bongkar. Tidak ada laporan
  Berangkat terpisah di antara titik (Q-3).
- Satu titik dibuka sekaligus: `Tiba` berikutnya ditolak **di perangkat**
  sampai titik yang terbuka diselesaikan.
- Urutan muat dan bongkar boleh berselang-seling (muat A, bongkar B, muat C)
  untuk pengiriman multi-drop.

### 4.1a Surat jalan (Q-2, Q-7, Q-11, Q-14)

Surat jalan **hanya dibuat dispatcher** sebelum perjalanan, lalu dicetak dan
dibawa driver untuk ditunjukkan di tempat muat dan bongkar. Driver tidak bisa
membuat surat jalan.

**Penomoran.** Aplikasi membuat nomornya sendiri dengan awalan yang diatur di
Pengaturan, misalnya `KRS-` atau `KOS-`, diikuti tahun-bulan dan nomor urut:
`KRS-2611-001`. Nomor urut kembali ke 001 setiap bulan (Q-18).

- Nomor urut dihitung dari data di perangkat. Dua komputer dispatcher yang
  sama-sama offline bisa memberi nomor yang sama. Tidak ada UNIQUE di database
  (aturan 32): nomor kembar ditandai "nomor ganda" di daftar, dan dispatcher
  diminta memberi nomor baru **sebelum dicetak**. Ini memang akan terjadi,
  karena ada lebih dari satu perangkat dispatcher (Q-19).
- Surat jalan yang sudah dicetak tetap boleh diberi nomor baru, tetapi
  aplikasi memperingatkan "sudah dicetak, cetak ulang".
- Mengganti awalan tidak mengubah nomor surat jalan yang sudah ada.

**Cetak.** Surat jalan dicetak dari aplikasi. Isinya: nama dan logo
perusahaan, nomor, tanggal, driver, kendaraan (jenis + plat), kategori tujuan,
daftar muatan per tempat muat (§4.1b), dan kolom tanda tangan pengirim,
driver, dan penerima. Ukuran kertas A4 (Q-20).

**Upah per surat jalan (Q-7, Q-15–Q-17).**

- Ada dua daftar tarif yang bisa diubah: **jenis kendaraan** (contoh: Truk
  Rp150.000, CDD Rp100.000, CDE Rp50.000) dan **kategori tujuan** (contoh:
  Antar Kota Rp150.000, Luar Kota Rp200.000, Beda Pulau Rp400.000). Nama dan
  tarifnya diatur sendiri oleh pemegang `trip.tariff`, dan isinya boleh
  ditambah. Upah surat jalan = tarif jenis kendaraan + tarif kategori tujuan
  (Q-21); contohnya Truk + Luar Kota = Rp350.000.
- Kategori tujuan dipilih dispatcher satu per surat jalan.
- **Tarif dikunci saat surat jalan dibuat.** Mengubah tarif tidak mengubah
  surat jalan lama. Tarif disimpan sebagai `INTEGER` rupiah (aturan 13).
- Upahnya untuk driver yang menutup `Selesai`; dispatcher boleh memindahkannya
  ke driver lain (Q-16).
- Surat jalan `Tidak Jalan` atau `Dibatalkan` **tidak dibayar** (Q-17).
- Kendaraan yang diganti di tengah jalan tidak mengubah tarif: yang dipakai
  tetap jenis kendaraan saat surat jalan dibuat, dan dispatcher boleh
  mengubahnya lewat `trip.tariff` (Q-22).
- **Dibayar terpisah dari gaji (Q-25)**, supaya gaji pokok tetap diatur di
  payroll. Lihat §4.1c.

### 4.1b Muatan (Q-10)

Muatan dicatat untuk laporan polisi bila ada kendala dan untuk mencocokkan
dengan pesanan. Setiap baris muatan berisi: tempat muat, nama barang, jenis
barang, kuantitas + satuan (dus, karung, pcs, dan seterusnya, diketik bebas),
dan berat (kg, dua desimal, disimpan ×100 sebagai `INTEGER` seperti pola
`SKALA_DESIMAL` inventaris).

- Dispatcher mengisinya saat membuat surat jalan (sesuai pesanan), dan isinya
  ikut tercetak.
- Saat `Selesai Muat`, driver mengonfirmasi jumlah yang benar-benar dimuat di
  tempat itu (wajib, Q-23). Jumlah yang berbeda dari surat jalan ditandai
  "Perlu ditinjau".
- **Bongkar dicatat per tempat (Q-24).** Saat `Selesai Bongkar`, driver
  mengisi barang dan jumlah yang diturunkan di tempat itu. Saat `Selesai`,
  barang yang dimuat tetapi belum tercatat dibongkar (sisa ≠ 0) ditandai
  "Perlu ditinjau", karena bisa berarti barang hilang, retur, atau salah
  ketik.
- Tempat bongkar setiap barang ditentukan dispatcher di surat jalan dan ikut
  tercetak (`drv_muatan.tempat_bongkar`). Saat bongkar, daftar barang untuk
  tempat itu sudah terisi, dan driver tinggal mengonfirmasi atau
  membetulkan jumlahnya (Q-27).
- Muatan ini barang pelanggan, **tidak terhubung ke modul Inventaris** dan
  tidak mengubah stok.

### 4.1c Pembayaran upah surat jalan (Q-25, terpisah dari gaji)

- Layar **Rekap Upah Surat Jalan** menampilkan, per driver dan rentang
  tanggal, surat jalan `Selesai` yang belum dibayar beserta totalnya.
- **"Tandai dibayar"** mencatat satu pembayaran per driver (tanggal, total,
  dan daftar surat jalannya) ke tabel tersendiri. Kolom di surat jalan tidak
  ditimpa. Surat jalan yang sudah masuk satu pembayaran tidak bisa masuk
  pembayaran lain, dan upahnya tidak bisa dipindah ke driver lain. Pembatalan
  pembayaran memakai pola `batal-<id>` dan memerlukan izin sensitif.
- Pembukuan dicatat **manual** lewat jurnal biasa di Keuangan (Q-28). Tidak
  ada sumber jurnal baru, jadi CHECK `keu_jurnal.sumber` tidak disentuh.
- Bisa diekspor ke Excel dan dicetak sebagai tanda terima upah.

### 4.2 Kendala (poin 3)

Laporan `Kendala` dengan jenis tetap: `Macet`, `Kendaraan Rusak`, `Ban`,
`Kecelakaan`, `Cuaca`, `Antre Muat/Bongkar`, `Lainnya` (wajib diisi
keterangan), ditambah perkiraan keterlambatan dalam menit (opsional).
Perjalanan tetap berjalan. Kendala bisa dikirim ke grup Telegram (fase 3).

### 4.3 Ganti kendaraan dan driver (poin 4 dan 5)

Laporan `Ganti Kendaraan` atau `Ganti Driver` dicatat pada perjalanan yang
sama. Kendaraan dan driver yang sedang bertugas **diturunkan dari laporan
ganti terakhir**, tidak disimpan sebagai kolom yang ditimpa.

Skenario dari permintaan:

| Kejadian | Cara mencatat |
| :-- | :-- |
| Mobil 1 belum muat atau batal muat, diganti mobil 2 | `Ganti Kendaraan` pada perjalanan mobil 1 |
| Mobil 1 rusak setelah muat, muatan dipindah ke mobil 2 | `Kendala: Kendaraan Rusak`, lalu `Ganti Kendaraan` dengan foto di lokasi pemindahan |
| Mobil 3 selesai bongkar, lalu dipakai muat di tempat mobil 1 | Perjalanan mobil 3 ditutup `Selesai`, lalu perjalanan mobil 1 dialihkan dengan `Ganti Kendaraan` + `Ganti Driver` ke mobil 3 dan drivernya |

**Siapa yang mencatat ganti (Q-4):** pada dasarnya dispatcher. Dalam keadaan
darurat (misalnya tidak ada sinyal), driver boleh mencatatnya langsung dengan
alasan dan foto wajib:

- **Ganti kendaraan darurat** dicatat dari HP driver yang sedang bertugas.
- **Ambil alih darurat** dicatat dari HP driver pengganti, karena dialah yang
  ada di lokasi. Syaratnya, perjalanan itu sudah tersinkron ke HP-nya; kalau
  belum, ia harus menunggu sinyal atau dispatcher.
- Ganti darurat **langsung berlaku**, karena persetujuan tidak bisa ditunggu
  saat offline. Statusnya "Menunggu persetujuan" di layar dispatcher, lalu
  dispatcher menyetujui atau menolak. Bila ditolak, dispatcher mencatat ganti
  yang benar.
- Bila ada sinyal, driver bisa memilih **minta izin dulu**. Permintaan itu
  muncul di layar dispatcher dan baru berlaku setelah disetujui. (Q-13)

Setelah diganti, driver lama tidak
bisa lagi melapor di perjalanan itu, tetapi laporan yang sudah dikirimnya
(termasuk yang masih offline) tetap diterima.

### 4.4 Batal (poin 6)

- Sebelum berangkat: laporan `Tidak Jalan` dengan alasan wajib. Foto opsional,
  karena driver mungkin tidak pernah ke lokasi.
- Di tengah jalan: laporan `Dibatalkan` dengan alasan dan foto wajib.

### 4.5 Status

Status **tidak disimpan**, diturunkan dari laporan (pola inventaris dan
cicilan): `Tidak Jalan`, `Dibatalkan`, `Selesai`, `Berjalan`, `Direncanakan`.
Fungsi turunannya dieja kembar di Rust ↔ TS dan diuji dengan vektor yang sama.

## 5. Laporan dan stempel foto (poin 7)

### 5.1 Isi setiap laporan

| Data | Sumber | Catatan |
| :-- | :-- | :-- |
| Foto | kamera langsung (`getUserMedia`) | **Tidak ada pilihan dari galeri.** |
| Koordinat + akurasi (m) | `navigator.geolocation`, akurasi tinggi | Laporan ditolak di perangkat bila GPS mati, dan diberi peringatan bila akurasinya > 100 m (ambang bisa diatur). |
| Nama lokasi | lokasi terdaftar terdekat dalam radius, atau ketikan driver | Tanpa alamat jalan otomatis, lihat (Q-5). |
| Kendaraan | dari perjalanan (ganti terakhir) | jenis + identitas (plat/nomor) |
| Driver | dari sesi login | Tidak pernah dari payload. |
| Waktu | lihat §6.1 | |
| Perusahaan | `company_profile` | |

### 5.2 Stempel di foto

Teks dicetak ke foto di canvas sebelum disimpan, misalnya:

```
PT Contoh Logistik
Tiba Bongkar · Gudang Cikarang 2
Budi Santoso · Truk B 1234 XYZ
-6.28512, 107.17023 (±8 m)
08 Nov 2026 14:32:05 WIB
```

**Stempel hanya tampilan.** Yang menjadi acuan adalah kolom di baris laporan;
stempel bisa saja dipalsukan orang yang mengedit foto. Hash SHA-256 foto
disimpan di baris laporan (yang ikut sinkron), jadi foto yang ditukar
belakangan bisa terdeteksi.

### 5.3 "Muncul lokasinya di mana" (Q-5: koordinat saja)

Aplikasi ini offline-first dan CSP-nya tidak mengizinkan host luar (aturan 15),
jadi **tidak ada peta tertanam dan tidak ada alamat otomatis** di fase 1.
Pengganti:

- nama lokasi terdaftar bila koordinatnya berada dalam radius;
- tombol **"Buka di Maps"** yang membuka aplikasi peta di HP atau browser
  (tautan keluar, bukan request dari aplikasi);
- koordinat dan akurasi ditampilkan sebagai teks.

## 6. Keamanan dan pencegahan bug

### 6.1 Manipulasi jam

Jam HP bisa diubah driver, dan laporan offline tidak bisa memakai jam
server saat itu juga. Mitigasinya:

1. Simpan **tiga waktu**: `waktu_perangkat`, `waktu_gps` (stempel waktu fix
   GPS), dan `diterima_cloud` (`datetime('now')` di handler cloud, sama seperti
   aturan 19).
2. Tandai **"Jam perangkat tidak wajar"** bila selisih `waktu_gps` dan
   `waktu_perangkat` lebih dari 5 menit. ⚠ Perlu diuji di HP nyata: sebagian
   WebView mengisi `position.timestamp` dengan jam sistem. Kalau ternyata
   begitu, pemeriksaan ini dibuang, jangan dipercaya.
3. Tandai laporan yang `waktu_perangkat`-nya mundur dibanding laporan
   sebelumnya di perjalanan yang sama.
4. Laporan yang sampai di cloud jauh setelah kejadian ditampilkan "dikirim
   terlambat (offline)", bukan dianggap curang.

### 6.2 GPS palsu (aplikasi Fake GPS)

WebView tidak bisa membedakan lokasi palsu dari yang asli. Mitigasinya:

- **Fase 1:** tandai perpindahan yang mustahil, yaitu kecepatan di antara dua
  laporan berurutan lebih dari 150 km/jam (Haversine ÷ selisih waktu), atau
  akurasi persis 0 m. Foto tetap menjadi bukti utama.
- **Fase 2 (opsional):** command native `mobile_location_is_mock`, yang membaca
  `Location.isMock()` di Android 12+ (aturan 27: berawalan `mobile_`, dipanggil
  di dalam `if (isMobileRuntime())`).

Semua tanda di atas berakhir di daftar **"Perlu ditinjau"** dispatcher. Tidak
ada yang ditolak otomatis, karena GPS di dalam gudang memang sering meleset.

### 6.3 Foto

- Hanya dari kamera langsung. Input berkas atau galeri tidak disediakan.
- Diperkecil ke sisi terpanjang 960 px, JPEG kualitas 0,6, sekitar 100 KB
  (maksimal 200.000 karakter base64). Memakai ulang
  `optimizeImageDataUrl` (`lib/client/image-optimizer.ts`, mode `shrink`)
  yang sudah memampatkan foto personil ke maks 500 KB, hanya dengan batas
  lebih kecil. Pembandingnya, foto bukti absensi (`scan-photo.ts`) 480×360
  ≈ 30–60 KB, terlalu kecil untuk membaca plat dan stempel. Itu masih cukup untuk membaca wajah,
  plat, dan teks stempel. Perkiraannya 20 driver × 10 laporan ≈ 20 MB/hari,
  atau sekitar 1,8 GB untuk 90 hari. MIME hanya `image/jpeg`,
  diperiksa Rust **sebelum** masuk SQLite dan outbox, serta oleh CHECK cloud
  (aturan 43).
- Disimpan di luar snapshot (pola `absensi_foto`): didorong per foto, ditarik
  per id saat dibuka.
- **Masa simpan 90 hari (Q-9).** Setelah itu foto dihapus otomatis, sedangkan
  baris laporan, koordinat, dan `foto_sha256` tetap ada. Batasnya dihitung
  jam database (`datetime('now','-90 days')`, aturan 19). Mulai 7 hari
  sebelum terhapus, layar dispatcher menampilkan peringatan "N foto akan
  dihapus, unduh dulu". Penghapusan berjalan sebagai tugas berkala, seperti
  `AutoTelegramRunner`, di cloud dan juga di salinan lokal perangkat.
- **Unduh massal.** Dispatcher memilih laporan berdasarkan tanggal, driver,
  atau surat jalan, lalu memakai "pilih semua" dan mengunduh satu berkas ZIP.
  Nama berkas di dalamnya `<nomor SJ>_<urutan>_<jenis laporan>.jpg`. ZIP
  dibuat oleh penulis ZIP yang sudah ada di `excel-export.ts` (tanpa library
  baru) dan disimpan lewat `saveFileWithPicker` (aturan 28 dan 46). Foto yang
  belum ada di perangkat diambil dari cloud satu per satu dengan indikator
  kemajuan, jadi unduh massal butuh internet. Izin: `trip.view`.

### 6.4 Hak akses (RBAC)

| Izin | Untuk | Sensitif? |
| :-- | :-- | :-- |
| `trip.report` | driver: melapor di perjalanan yang **sedang ditugaskan kepadanya** | tidak |
| `trip.view` | melihat semua perjalanan, laporan, foto, dan daftar "Perlu ditinjau" | tidak |
| `trip.manage` | membuat atau mengubah rencana, mengganti kendaraan/driver, menandai Tidak Jalan | tidak |
| `trip.cancel` | membatalkan perjalanan yang sudah berjalan | **ya** |
| `fleet.manage` | master kendaraan, jenis kendaraan, kategori tujuan, dan lokasi terdaftar | tidak |
| `trip.tariff` | mengubah tarif jenis kendaraan dan kategori tujuan, serta memindahkan upah surat jalan ke driver lain | **ya** (uang) |
| `trip.pay` | mencatat dan membatalkan pembayaran upah surat jalan | **ya** (uang) |

`trip.manage` (dispatcher) membuat dan mencetak surat jalan. Driver tidak
memegangnya (Q-11).

- `trip.report` saja **tidak cukup**: command juga wajib memeriksa bahwa
  driver yang sedang bertugas di perjalanan itu (menurut laporan ganti
  terakhir di database perangkat) adalah `id_karyawan` milik sesi. Ini
  pemeriksaan cakupan seperti aturan 44.
- Driver hanya melihat perjalanannya sendiri: daftar perjalanan untuk
  `trip.report` disaring di query, bukan di UI.
- Halaman `/perjalanan` dan `/driver` memasang `canAccessArea` (aturan 36).

### 6.5 Sinkronisasi dan offline

- **Laporan append-only, berid tetap yang dibuat sekali per penekanan
  tombol.** Penekanan ganda atau retry menghasilkan PK yang sama, jadi tidak
  tercatat dua kali (`isSubmittingRef` + id dibuat sebelum submit).
- **Cloud tidak pernah menolak laporan karena urutan atau status** (misalnya
  Tiba Bongkar sebelum Selesai Muat, atau laporan dari driver yang sudah
  diganti). Menolaknya akan membuat outbox macet permanen. Urutan diperiksa di
  perangkat, sedangkan kejanggalan dari offline tampil di "Perlu ditinjau".
- Dua dispatcher yang mengganti kendaraan secara offline sama-sama tercatat;
  yang berlaku adalah laporan dengan `waktu_perangkat` terakhir, dan keduanya
  tampil di riwayat.
- Tanpa `UNIQUE` di kolom bisnis (aturan 32). Plat nomor unik ditegakkan
  dengan `assert_unique`, dan kembaran dari offline ditandai.
- Validasi enum, koordinat (−90..90, −180..180), akurasi, dan panjang teks
  dilakukan di Rust sebelum menulis (aturan 43), dengan CHECK yang sama di
  cloud.

### 6.6 Privasi

- Lokasi **hanya diambil saat driver menekan tombol lapor**. Tidak ada
  pelacakan latar belakang: tidak perlu izin background location, baterai
  aman, dan tidak menyentuh privasi di luar jam kerja.
- Koordinat dan foto hanya terlihat oleh pemegang `trip.view`.

## 7. Akun driver

### 7.1 Login

Driver memakai akun `master_operator` biasa dengan role bawaan baru
**"Driver"** (hanya `trip.report`). Akun itu dihubungkan ke personil lewat
kolom baru `master_operator.id_karyawan`. Aturannya:

- satu personil aktif = paling banyak satu akun aktif (ditegakkan di aplikasi);
- personil yang dinonaktifkan membuat akunnya ikut ditolak saat login dan saat
  melapor;
- login offline di HP memakai fallback yang sudah ada. 2FA untuk role Driver
  opsional (Q-8).

### 7.2 Driver tanpa HP

Driver tanpa HP pribadi bisa dibantu HP kantor yang dibawa di kendaraan: akun
HP itu tetap akun driver yang sedang bertugas, dan ganti driver berarti ganti
login. (Q-8)

### 7.3 Lisensi

Setiap HP driver adalah satu perangkat di daftar `perangkat` lisensi LIS1
(maksimal 200). Sepuluh driver berarti sepuluh slot perangkat tambahan, yang
berpengaruh ke harga sewa atau beli. **Q-1: ya, dihitung seperti perangkat
lain**, jadi kode lisensi tidak berubah.

### 7.4 Absensi driver (jawaban untuk "driver utama juga absen?")

**Rekomendasi: ya, semua driver tetap absen masuk/pulang biasa**, baik driver
utama maupun cadangan. Alasannya:

- Absensi dan surat jalan menjawab dua hal berbeda. Absensi mencatat hadir,
  jam kerja, lembur, dan BPJS; surat jalan mencatat upah per pengiriman.
- **Risiko bug kalau driver utama tidak absen:** Generate Alfa akan menandai
  driver Alfa setiap hari karena tidak ada scan, dan payroll memotongnya.
**Keputusan (Q-26): di pool tidak ada terminal scan, jadi driver tidak
dihitung Alfa otomatis.** Penerapannya (disetujui, Q-29):

- Seseorang **tidak dijadikan Alfa** pada tanggal D bila ia mengirim
  setidaknya satu laporan perjalanan pada D. Aturan ini tidak memakai penanda
  "ini driver", jadi driver cadangan yang tidak datang dan tidak punya surat
  jalan tetap bisa Alfa. Aturannya dieja kembar di Generate Alfa dan audit
  absensi (Rust ↔ TS), di sebelah `wajib_masuk` / `wajibMasuk`.
- Fitur penugasan backup karyawan (`backup_karyawan`) tetap terpisah dari
  "Ganti Driver" di surat jalan. Yang pertama mengatur absensi dan shift,
  yang kedua mengatur siapa yang membawa surat jalan.

**Dampak ke gaji pokok.** Skema gaji yang ada hanya `HOURLY` dan `FLAT_DAILY`,
dan keduanya dihitung dari data absensi. Driver yang tidak scan akan bergaji
pokok **nol**. Keputusannya (Q-30): gaji pokok driver memakai `FLAT_DAILY`,
dan **hari yang punya laporan perjalanan dari driver itu dihitung hari
hadir** di rekap payroll (Rust `payroll/commands.rs` ↔ `payroll-recap.ts`).
Rumus gaji, pajak, BPJS, dan kasbon tidak disentuh. Hari yang sudah punya
scan absensi tidak dihitung dua kali.

Aturan Alfa dan hari hadir ini **masuk fase 1**. Tanpanya, begitu driver
mulai memakai fitur ini, mereka akan jadi Alfa setiap hari dan bergaji pokok
nol.

## 8. Model data (usulan)

Semua tabel bawah ikut sinkron kecuali yang ditandai. Nama dan kolom final
menunggu jawaban §12.

| Tabel | Isi | Snapshot |
| :-- | :-- | :-- |
| `drv_jenis_kendaraan` | id, nama (bawaan: Truk, CDD, CDE, Pickup, Box, Motor, Bajaj, Lainnya), tarif `INTEGER`, `status_aktif`. Berupa daftar yang bisa diubah, bukan CHECK enum, karena tarifnya melekat di sini. | ya, `delete_missing: false` |
| `drv_kategori_tujuan` | id, nama (bawaan: Antar Kota, Luar Kota, Beda Pulau), tarif `INTEGER`, `status_aktif` | ya, `delete_missing: false` |
| `drv_kendaraan` | id, id_jenis, identitas (plat/nomor), nama, `status_aktif` | ya, `delete_missing: false` |
| `drv_bongkar` | id, id_laporan (`Selesai Bongkar`), id_muatan, qty `INTEGER`, berat_kg_x100 `INTEGER`. Dikirim dalam event `trip-report/create` yang sama. | ya, append-only, `delete_missing: false` |
| `drv_upah_bayar` | id, id_karyawan, tanggal, total `INTEGER`, daftar id surat jalan, dicatat_oleh, dibatalkan (pola `batal-<id>`) | ya, `delete_missing: false` |
| `drv_muatan` | id, id_perjalanan, tempat_muat, tempat_bongkar (rencana, opsional), nama_barang, jenis_barang, qty `INTEGER`, satuan, berat_kg_x100 `INTEGER`, qty_dimuat / berat_dimuat_x100 (konfirmasi driver, kosong = belum) | ya, `delete_missing: true` + `PendingGuard::induk_tertunda` (pola baris pengajuan) |
| `drv_lokasi` | id, nama, jenis (`Pool`, `Muat`, `Bongkar`, `Lainnya`), lat, lng, radius_m, `status_aktif` | ya, `delete_missing: false` |
| `drv_perjalanan` | id, tanggal, id_karyawan awal, id_kendaraan awal, **nomor surat jalan (dibuat aplikasi, unik di aplikasi, bukan constraint DB)**, id_kategori_tujuan, tarif_kendaraan + tarif_tujuan (dikunci saat dibuat), id_karyawan_upah (kosong = penutup `Selesai`), catatan, dibuat_oleh, dibuat_pada | ya, `delete_missing: false` |
| `drv_laporan` | id, id_perjalanan, jenis, jenis_kendala, terlambat_menit, id_lokasi, nama_lokasi, lat, lng, akurasi_m, waktu_perangkat, waktu_gps, diterima_cloud, id_karyawan (pelapor), id_karyawan_baru / id_kendaraan_baru (untuk ganti), keterangan, foto_sha256, kode_operator | ya, append-only, `delete_missing: false` |
| `drv_laporan_foto` | id_laporan, foto_mime, foto_base64 | **tidak** (pola `absensi_foto`) |

- `jenis` laporan: `Berangkat`, `Tiba Muat`, `Selesai Muat`, `Tiba Bongkar`,
  `Selesai Bongkar`, `Kendala`, `Ganti Kendaraan`, `Ganti Driver`,
  `Tidak Jalan`, `Dibatalkan`, `Selesai`. Dieja identik di CHECK keempat
  lapis, validator Rust, dan TS.
- Koordinat disimpan `REAL` (bukan uang, jadi aturan 13 tidak berlaku).
- Rute kanonik: `vehicle-type/save`, `trip-destination/save`, `vehicle/save`,
  `trip-place/save`, `trip/save` (header + seluruh muatan dalam satu event,
  pola `accounting-journal/post`), `trip-report/create` (konfirmasi muatan
  menumpang di event `Selesai Muat`), `trip-report-photo/save`.
- Awalan nomor surat jalan disimpan di `setting_gex_system`
  (`sj_prefix`).
- `master_operator.id_karyawan` (cloud-only) ditambah lewat `CREATE` +
  `ALTER` di kedua jalur.
- Skema versi 34, sentinel Rust `-2030`, dan `ensure_schema_current` ikut naik
  (aturan 21).
- **Batas yang diketahui:** `drv_laporan` ditarik utuh setiap pulsa, seperti
  mutasi inventaris. Dengan 20 driver × 10 laporan per hari, jumlahnya sekitar
  73.000 baris per tahun. Kalau terasa lambat, tambahkan tarikan berjendela
  waktu (misalnya 60 hari) untuk HP berole Driver saja.

## 9. Layar

| Layar | Siapa | Isi |
| :-- | :-- | :-- |
| `/driver` (Mobile utama) | Driver | Perjalanan hari ini, **satu tombol besar untuk langkah berikutnya**, tombol Kendala, riwayat laporan hari itu, dan antrean offline ("3 laporan belum terkirim"). |
| `/perjalanan` (Web/Desktop) | Dispatcher | Daftar per tanggal dan status, buat rencana, rincian linimasa laporan + foto + "Buka di Maps", ganti kendaraan/driver, tandai Tidak Jalan, dan tab **Perlu ditinjau**. |
| `/perjalanan` tab Kendaraan & Lokasi | `fleet.manage` | Master kendaraan dan lokasi terdaftar (ambil koordinat dari HP saat berdiri di lokasi). |

- Halaman Mobile ditulis terpisah (pola paritas mobile), komponen bersama
  masuk `filesToCopy`.
- `konfirmasiData` dipasang di form master dan rencana, **tidak** di tombol
  lapor driver. Laporan sudah punya pratinjau foto + stempel sebelum dikirim,
  dan itu menjadi konfirmasinya.
- Tanpa canvas 3D di layar kamera.

## 10. Fase

| Fase | Isi |
| :-- | :-- |
| **1** | Master kendaraan, jenis + tarif, kategori tujuan + tarif, lokasi, akun Driver, surat jalan + nomor otomatis + muatan + cetak, semua jenis laporan + foto + stempel + GPS, konfirmasi muatan, status turunan, linimasa dispatcher, tanda tinjau (jam mundur, kecepatan mustahil, akurasi buruk, lapor dari luar radius, nomor ganda, muatan beda), unduh foto massal (ZIP), penghapusan foto 90 hari, aturan tidak-Alfa + hari hadir gaji harian dari laporan perjalanan. |
| **2** | Rekap dan pembayaran upah surat jalan (terpisah dari gaji, jurnal manual), rekap/ekspor Excel per driver, kendaraan, dan tanggal, deteksi lokasi palsu native, serta pemeriksaan jam GPS bila lolos uji §6.1. |
| **3** | Notifikasi Telegram (kendala, perjalanan selesai, tidak jalan) ke bidang baru `armada`. |

## 11. Di luar cakupan

Pelacakan live dan peta tertanam, alamat otomatis (reverse geocoding), BBM
dan uang jalan, servis armada, tanda tangan penerima di layar (cukup di
kertas surat jalan), dan optimasi rute.

## 12. Pertanyaan terbuka

**Sudah dijawab (8–9 Nov 2026):**

| # | Jawaban |
| :-- | :-- |
| Q-1 | HP driver dihitung slot lisensi seperti perangkat lain. |
| Q-2 | Satu perjalanan = satu surat jalan. |
| Q-3 | `Selesai Muat` = barang sudah masuk, bersiap ke titik berikutnya. |
| Q-4 | Ganti kendaraan/driver oleh dispatcher; darurat boleh driver langsung, atau minta izin dulu. |
| Q-5 | Koordinat saja, tanpa alamat otomatis. |
| Q-6 | Nama tempat boleh diketik bebas; lokasi terdaftar hanya membantu. |
| Q-7 | Upah dihitung per surat jalan. |
| Q-8 | Driver tanpa HP boleh memakai HP kantor; 2FA tidak wajib. |
| Q-9 | Foto disimpan 90 hari lalu dihapus otomatis, dengan unduh massal untuk backup. Ukuran diperkecil. |
| Q-10 | Muatan dicatat per tempat muat: barang, jenis, kuantitas, berat. |
| Q-11 | Surat jalan hanya dibuat dispatcher, dicetak, lalu dibawa driver. |
| Q-12 | Jenis kendala cukup. Jenis kendaraan ditambah CDD dan CDE (dari contoh tarif). |
| Q-13 | Ya, ada jalur minta izin dulu (lihat Q-4). |
| Q-14 | Nomor dibuat aplikasi dengan awalan dari Pengaturan (`KRS-001`). |
| Q-15 | Tarif per jenis kendaraan dan per kategori tujuan. |
| Q-16 | Upah untuk driver yang menutup `Selesai`; dispatcher boleh mengubahnya. |
| Q-17 | Surat jalan batal atau tidak jalan tidak dibayar. |
| Q-18 | Nomor `KRS-2611-001`, kembali ke 001 setiap bulan. |
| Q-19 | Ada lebih dari satu perangkat dispatcher; nomor ganda ditandai. |
| Q-20 | Kertas A4. |
| Q-21 | Tarif dijumlah (kendaraan + tujuan) dan diatur sendiri. |
| Q-22 | Tarif tetap jenis kendaraan awal; dispatcher boleh mengubahnya. |
| Q-23 | Driver wajib mengonfirmasi jumlah muat. |
| Q-24 | Barang yang turun dicatat per tempat bongkar. |
| Q-25 | Upah surat jalan dibayar terpisah dari gaji. |
| Q-26 | Di pool tidak ada terminal; driver tidak dihitung Alfa otomatis. |

| Q-27 | Tempat bongkar setiap barang ditentukan dispatcher di surat jalan; driver mengonfirmasi. |
| Q-28 | Pembayaran upah dicatat ke Pembukuan secara manual. |
| Q-29 | Tidak Alfa bila ada laporan perjalanan di tanggal itu. |
| Q-30 | Gaji pokok driver harian; hari yang punya laporan perjalanan dihitung hadir. |

Tidak ada pertanyaan yang masih terbuka.

## 13. Urutan pengerjaan fase 1

Setiap langkah diselesaikan dan diperiksa sebelum langkah berikutnya dimulai.
Langkah 1–4 tanpa UI, supaya kontraknya teruji lebih dulu.

| # | Langkah | Gerbang |
| :-- | :-- | :-- |
| 1 | **Skema v34**: semua tabel `drv_*` di keempat lapis, `master_operator.id_karyawan`, kunci `sj_prefix`, sentinel `-2030`, dan `ensure_schema_current` naik. | `audit:schema` |
| 2 | **Aturan domain kembar** `desktop/driver.rs` ↔ `validations/driver.ts` + `services/driver.ts`: validasi, status turunan, nomor surat jalan, upah, tanda tinjau (jam mundur, kecepatan, akurasi, radius, nomor ganda, selisih muat/bongkar), dan batas foto. Diuji dengan vektor yang sama di kedua bahasa. | `bun test` + `cargo test` |
| 3 | **Sinkronisasi**: rute kanonik, handler cloud (tidak pernah menolak karena urutan), `SNAPSHOT_TABLES` = `SNAPSHOT_SOURCES`, dan foto di luar snapshot. | `audit:contract` |
| 4 | **RBAC dan akun**: izin baru, role bawaan Driver, pemeriksaan cakupan "driver yang sedang bertugas", dan hubungan akun ↔ personil. | tes Rust + `web-rbac-boundary` |
| 5 | **Absensi dan gaji**: aturan tidak-Alfa dan hari hadir `FLAT_DAILY` dari laporan perjalanan (Rust ↔ TS). | tes Alfa + payroll yang sudah ada tetap lulus |
| 6 | **Layar dispatcher** (Web/Desktop): master armada dan tarif, surat jalan + muatan + cetak A4, linimasa, Perlu ditinjau, unduh ZIP, dan setujui/tolak ganti darurat. | Playwright untuk form dan guard |
| 7 | **Layar driver** (Mobile): kamera + GPS + stempel, laporan, konfirmasi muat/bongkar, ganti darurat, dan antrean offline. | **Uji di HP nyata**: jam GPS (§6.1), akurasi di dalam gudang, offline lalu sinkron |
| 8 | **Penghapusan foto 90 hari** + peringatan 7 hari. | tes jam database |

Setelah langkah 8: bagian ringkas di `CLAUDE.md` (pola bagian modul lain),
lalu `bun run check` penuh oleh pemilik repositori.
