# Memasang Absensi Perusahaan di server sendiri

Panduan ini untuk teknisi yang memasang aplikasi di server milik perusahaan.
Server tidak perlu internet untuk berjalan sehari-hari. Bila image diterima
sebagai berkas `.tar`, pemasangannya pun tidak butuh internet: berkas itu
memuat ketiga image yang dipakai, termasuk database dan proxy. Yang harus
sudah terpasang di server hanya Docker.

Untuk server Windows tanpa Docker ada paket terpisah dengan panduannya sendiri
(`absensi-perusahaan-<versi>-windows.zip`).

## Yang dibutuhkan

- Komputer atau server dengan Docker dan Docker Compose.
- Image aplikasi dari Kemal Office Studio: sebagai satu berkas `.tar`, atau
  sebagai alamat registry beserta aksesnya.
- Alamat IP tetap untuk server di jaringan kantor, atau satu nama domain.

## Langkah pemasangan

1. Salin folder ini ke server.
2. Siapkan image-nya dengan salah satu cara:
   - Berkas `.tar`: `docker load -i absensi-perusahaan-<versi>.tar`
   - Registry: `docker login <alamat-registry>`
3. Salin `.env.example` menjadi `.env`, lalu isi `KOS_SITE_ADDRESS` dan
   `KOS_SETUP_TOKEN`. Pada paket berkas `.tar`, `KOS_WEB_IMAGE` sudah terisi.
   Pada jalur registry, isi dengan alamat yang Anda terima.
   Token bisa dibuat dengan `openssl rand -base64 32`.
4. Jalankan `docker compose up -d`.
5. Buka `https://<KOS_SITE_ADDRESS>/setup` di browser. Halaman itu menampilkan
   kode server, berawalan `S-`. Kirim kode itu kepada Kemal Office Studio untuk
   mendapatkan lisensi.
6. Setelah lisensi diterima, kembali ke `/setup`: isi token, data akun
   Superadmin, dan tempel teks lisensinya.
7. Cetak atau salin delapan kode pemulihan yang tampil. Kode itu hanya tampil
   sekali, dan menjadi satu-satunya jalan masuk bila password Superadmin
   terlupa.
8. Kosongkan `KOS_SETUP_TOKEN` di `.env`, lalu jalankan `docker compose up -d`
   sekali lagi.

## Lisensi

Kode server terikat pada database, bukan pada komputernya. Memindahkan folder
`data/database` ke server lain tidak mengubah kodenya, dan lisensinya tetap
berlaku. Database yang dibuat baru mendapat kode baru dan butuh lisensi baru.

Bila lisensi dikunci ke sebuah alamat, aplikasi hanya bisa dibuka lewat alamat
itu. Membukanya lewat alamat lain menampilkan layar aktivasi.

Saat masa sewa berakhir, aplikasi tetap bisa dibuka dalam mode baca-saja: data
bisa dilihat dan diekspor, tetapi tidak bisa diubah. Superadmin memasang
lisensi perpanjangan dari Pengaturan, bagian Lisensi.

## Peringatan sertifikat di jaringan lokal

Dengan `KOS_TLS=internal`, server membuat sertifikatnya sendiri, sehingga
browser menampilkan peringatan pada kunjungan pertama. Ada dua cara
menanganinya:

- Lanjutkan lewat peringatan itu di setiap perangkat.
- Pasang sertifikat akar server di setiap perangkat supaya peringatannya
  hilang. Berkasnya ada di
  `data/caddy/caddy/pki/authorities/local/root.crt`.

HTTPS tidak bisa dilewati. Browser hanya mengizinkan kamera, yang dipakai
pemindai QR dan foto bukti, pada alamat HTTPS.

## Cadangan

Seluruh data ada di folder `data/database`. Hentikan layanan dengan
`docker compose stop`, salin folder itu ke tempat lain, lalu jalankan
`docker compose start`.

## Memperbarui aplikasi

Ganti versi pada `KOS_WEB_IMAGE` di `.env`, lalu:

- Berkas `.tar`: muat berkas versi baru dengan `docker load -i <berkas>`, lalu
  jalankan `docker compose up -d`.
- Registry: jalankan `docker compose pull`, lalu `docker compose up -d`.

Data tidak tersentuh: ia ada di folder `data/`, di luar image.

## Aplikasi Desktop dan Mobile

Port database tidak dibuka secara bawaan. Bila hanya versi Web yang dipakai,
biarkan tertutup. Bila Desktop atau Mobile perlu menyambung ke database ini,
pasang autentikasinya lebih dulu, baru buka port-nya:

1. Buat kunci dan token database. Jalankan di folder ini, setelah
   `KOS_WEB_IMAGE` di `.env` terisi:

   ```
   docker compose run --rm --no-deps --entrypoint node \
     -v "$PWD/buat-token-database.mjs:/buat-token-database.mjs:ro" \
     web /buat-token-database.mjs
   ```

   Keluarannya dua baris, `KOS_DATABASE_JWT_KEY=...` dan
   `KOS_DATABASE_AUTH_TOKEN=...`. Ganti dua baris yang masih kosong di `.env`
   dengan keduanya.
2. Di `docker-compose.yml`, pada layanan `database`, hapus tanda `#` di depan
   baris `environment:`, `ports:`, dan baris di bawah masing-masing. Ganti
   `192.168.1.10` dengan alamat IP server.
3. Jalankan `docker compose up -d`.
4. Di Desktop atau Mobile, pilih server libSQL sendiri dengan alamat
   `http://<IP server>:8080`, lalu isi tokennya dengan nilai
   `KOS_DATABASE_AUTH_TOKEN`.

Sebelum membuka port, perhatikan hal berikut:

- **Token memberi akses penuh ke seluruh data**, melewati login dan hak akses
  aplikasi. Simpan seperti password Superadmin dan pasang hanya di perangkat
  milik perusahaan.
- **Lalu lintas ke port 8080 tidak dienkripsi.** Siapa pun di jaringan yang
  sama bisa menyadap token dan data. Letakkan server dan perangkat karyawan
  yang memakai aplikasi di jaringan yang terpisah dari WiFi tamu.
- **Jangan buka port 8080 ke internet.** Perangkat yang dipakai di luar kantor
  menyambung lewat VPN (misalnya WireGuard atau Tailscale), atau pakai Turso
  Cloud.
- **Bila perangkat hilang atau karyawan keluar**, ulangi langkah 1 dan 3, lalu
  isi token baru di setiap perangkat yang masih dipakai. Kunci baru langsung
  mematikan semua token lama.
