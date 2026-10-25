---
description: Merapikan komentar kode dan teks antarmuka pada berkas yang baru diubah di repo Absensi SPPG memakai aturan antislop, lalu menulis ringkasannya ke `.claude/ANTISLOP.md`
---

# Workflow: antislop

Jalankan seluruh prosedur dari skill [jalankan-antislop](file:///c:/dev/absensi-perusahaan/.agents/skills/jalankan-antislop/SKILL.md):

## Langkah Eksekusi

1. **Tentukan Cakupan Berkas yang Berubah:**
   Jalankan dua perintah ini dari root repository dan gabungkan hasilnya:
   ```bash
   git diff --name-only
   git ls-files --others --exclude-standard
   ```

2. **Buang dari Cakupan (Dilewati):**
   - Berkas konfigurasi agent dan log: `CLAUDE.md`, `AGENTS.md`, semua isi `.agents/`, `.claude/`.
   - Direktori build dan dependensi: `node_modules/`, `out/`, `target/`, `gen/`.
   - Berkas kunci dan data: `*.lock`, `bun.lock*`, `package.json`, data JSON, database `*.db`, berkas gambar/dokumen.
   - Salinan Mobile turunan: `mobile/src/lib/**`, `mobile/src/types/**`, dan `mobile/src-tauri/src/mobile/**` yang dihasilkan skrip sinkronisasi. Jika ada yang perlu diubah, ubah padanannya di `web-desktop` lalu catat di ringkasan bahwa `bun run sync:mobile` harus dijalankan ulang.
   - Berkas tes (`*.spec.ts`, `*.test.ts`, `*.test.tsx`) dan modul tes Rust (`#[cfg(test)]`).

3. **Muat Aturan Antislop yang Relevan:**
   - Aturan inti: `antislop`
   - Komentar kode: `antislop-code`
   - Tampilan UI / CSS: `antislop-ui`
   - Teks, judul, pesan antarmuka: `antislop-copywriting`
   - Tata letak ponsel: `antislop-layoutmobile`
   - Kontras dan fokus: `antislop-human` (hanya laporkan, jangan ubah warna)

4. **Sunting dengan Batasan Ketat:**
   - **Boleh**: komentar bertele-tele / AI-slop, teks antarmuka berbahasa Indonesia yang generik atau kaku.
   - **Dilarang**: logika pemrograman, nama fungsi/variabel/tipe, query SQL, kunci JSON, kode galat (`VALIDATION_ERROR`, dll.), nilai enum atau status (`'Koreksi Admin'`, `'Menunggu'`, `'Aktif'`, dll.), route kanonik outbox, parameter IPC, kunci storage/setting, dan teks yang diuji di test suite.
   - **DILARANG mengubah**: penanda audit (`shortcut:`, `-- batas:`, `-- sengaja-utuh:`) dan urutan doc comment `///` sebelum `#[tauri::command]`.
   - **Jangan** jalankan `bun run check` dan **jangan** membuat commit git.

5. **Tulis / Timpa `.claude/ANTISLOP.md`:**
   Format sesuai template di [SKILL.md](file:///c:/dev/absensi-perusahaan/.agents/skills/jalankan-antislop/SKILL.md) (maksimal 40 baris):
   - Waktu (WIB), hash commit, jumlah berkas disunting.
   - Daftar berkas yang disunting dan ringkasan perubahannya.
   - Daftar berkas yang dilewati beserta alasannya.
   - Tindakan lanjutan / "Perlu tindakan" (jika ada).

6. **Balas ke Percakapan:**
   Maksimal 3 baris: status selesai/tidak, jumlah berkas disunting, dan instruksi bahwa langkah berikutnya adalah menjalankan skill `jalankan-check` (`/check`).
