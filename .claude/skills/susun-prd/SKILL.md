---
name: susun-prd
description: >-
  Ubah ide fitur menjadi PRD siap kerja, tanpa menulis kode. Pakai untuk "buat PRD", "spesifikasi",
  "rancang dulu fitur X", atau ide fitur besar yang belum punya rencana. Bukan untuk mengerjakan
  fitur (`sppg-fullstack`) atau mencari ide fitur (`rekomendasi-fitur`).
---

# Susun PRD

1. **Pahami dulu, tanpa kode.** Cek `MEMORY.md` (keputusan yang sudah ditutup tidak ditanya ulang),
   aturan domain di `CLAUDE.md` dan `.agents/skills/absensi-sppg-rules/`, lalu telusuri kode
   secukupnya untuk temuan nyata `file:baris`. Pola PRD yang ada: `prd-gaji.md`, `prd-driver.md`.
2. **Ambigu?** Maksimal 5 pertanyaan bernomor (`Q-1` …), masing-masing dengan rekomendasi, lalu
   berhenti. Lewati bila sudah jelas.
3. **Tulis** `prd-<topik>.md` di root. Fitur besar dipecah per fase di dalam berkas. Bagian:
   - Masalah dan tujuan · Keputusan pemilik (bertanggal)
   - Alur pengguna (per peran: karyawan, atasan, admin/HRD, keuangan, bila relevan)
   - Wajib ada (per fase bila besar) · Di luar cakupan
   - Kriteria penerimaan yang bisa diuji, sebut platform bila berbeda (Web/Desktop/Mobile)
   - Catatan teknis: tabel/kolom dan statusnya (tersinkron atau khusus cloud), izin baru vs izin
     bawaan role, aturan yang dieja kembar TS ↔ Rust, invarian yang berlaku (dirujuk, tidak disalin)
   - Temuan dari kode · Urutan pengerjaan (langkah + bukti selesai: tes/audit) · Pertanyaan terbuka
4. **Jawab di chat** cukup: tautan berkas, ringkasan 3 baris, pertanyaan terbuka.
