---
name: jalankan-antislop
description: Merapikan komentar kode dan teks antarmuka pada berkas yang baru diubah di repo Absensi SPPG memakai aturan antislop, lalu menulis ringkasannya ke `.claude/ANTISLOP.md`. Gunakan setiap kali user menyebut antislop, "rapikan komentar", "bersihkan teks", atau "sebelum check". Jalankan SEBELUM skill `jalankan-check`.
---

# Jalankan antislop pada berkas yang berubah

Tugasmu: menyunting komentar dan teks yang dilihat pengguna pada berkas yang berubah. Jangan menyentuh logika. Jangan menjalankan `bun run check` dan jangan commit.

## Langkah

1. **Tentukan cakupan.** Jalankan dua perintah ini dari root repo (`c:/dev/absensi-perusahaan`) dan gabungkan hasilnya:

   ```bash
   git diff --name-only
   git ls-files --others --exclude-standard
   ```

2. **Buang dari cakupan** berkas berikut dan catat alasannya di bagian "Dilewati":
   - `CLAUDE.md`, `AGENTS.md`, semua isi `.agents/`, `.claude/`, `node_modules/`, `out/`, `target/`, `gen/`.
   - Berkas kunci dan data: `*.lock`, `bun.lock*`, `package.json`, `*.json` data (misalnya `libur-nasional.json`), `*.db`, dan aset gambar/dokumen.
   - **Salinan Mobile yang dihasilkan skrip sinkronisasi**:
     `mobile/src/lib/**`, `mobile/src/types/**`, dan `mobile/src-tauri/src/mobile/**` yang punya padanan di `web-desktop`. Berkas itu ditimpa saat sinkronisasi (`bun run sync:mobile`). Bila ada yang perlu diubah, ubah padanannya di `web-desktop` lalu tulis di ringkasan bahwa `bun run sync:mobile` harus dijalankan ulang.
   - Berkas tes (`*.spec.ts`, `*.test.ts`, `*.test.tsx`) dan modul tes Rust (`#[cfg(test)]`): vektor dan fixture adalah data.

3. **Muat aturan antislop.** Baca skill antislop inti lebih dulu, lalu hanya sub-skill yang sesuai jenis berkas:
   - Komentar kode: `antislop-code`
   - Tampilan `.tsx` / CSS: `antislop-ui`
   - Teks, judul, pesan galat yang dilihat pengguna: `antislop-copywriting`
   - Tata letak ponsel: `antislop-layoutmobile`
   - Kontras dan fokus: `antislop-human` (hanya laporkan, jangan ubah warna)

4. **Sunting dengan batas ketat arsitektur Absensi SPPG:**
   - **Boleh**: komentar bertele-tele / AI-slop, teks antarmuka berbahasa Indonesia yang generik atau kaku.
   - **Dilarang keras**: logika bisnis, nama fungsi/variabel/tipe, query SQL, kunci JSON, kode galat (`VALIDATION_ERROR`, `TOTP_REQUIRED`, `TOTP_INVALID`, dll.), nilai enum atau status kanonik yang dibandingkan di tempat lain (`'Koreksi Admin'`, `'Menunggu'`, `'Aktif'`, `'Nonaktif'`), 66 route outbox kanonik, parameter IPC (`camelCase` di frontend, `snake_case` di Rust), kunci `localStorage`/setting, dan teks yang diuji di test suite.
   - **DILARANG mengubah atau memindahkan** urutan doc comments `///` sebelum atribut `#[tauri::command]` pada berkas Rust (Aturan 45: penempatan atribut wajib tepat setelah doc comment agar regex audit tidak gagal).
   - **Jangan hapus atau ubah** komentar penanda audit dan proteksi: `shortcut:`, `-- batas:`, `-- sengaja-utuh:`.
   - Label formulir harus tetap menyebut FUNGSI kontrol ("Filter divisi", "Pilih shift"), bukan nilai terpilih.

5. **Tulis `.claude/ANTISLOP.md`** (timpa), maksimal 40 baris:

   ```markdown
   # ANTISLOP.md — hasil antislop

   - Waktu: <tanggal dan jam WIB>
   - Commit: <hash pendek> (+ <N> berkas berubah, belum commit)
   - Berkas disunting: <jumlah>

   ## Disunting
   - `<berkas>` — <jenis: komentar | teks UI> — <satu baris apa yang berubah>

   ## Dilewati
   - `<berkas>` — <alasan>

   ## Perlu tindakan
   <kosong bila tidak ada; mis. "jalankan bun run sync:mobile">
   ```

6. **Balas user maksimal tiga baris**: status selesai atau tidak, jumlah berkas disunting, dan bahwa langkah berikutnya adalah menjalankan skill [jalankan-check](file:///c:/dev/absensi-perusahaan/.agents/skills/jalankan-check/SKILL.md) (atau workflow `/check`).

## Aturan

- Jangan menempelkan isi berkas atau diff ke percakapan.
- Bila tidak ada yang perlu diubah, tulis itu di `.claude/ANTISLOP.md` dan jangan menyunting apa pun.
- Jangan memperbaiki bug yang kamu temukan saat antislop; catat di "Perlu tindakan".
