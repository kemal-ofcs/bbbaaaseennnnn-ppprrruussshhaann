---
name: jalankan-check
description: Menjalankan gerbang kualitas `bun run check` di root repo Absensi SPPG dan menulis ringkasannya ke `.claude/HASIL.md`. Gunakan setiap kali user meminta menjalankan check, tes, verifikasi, quality gate, atau mengatakan "cek hasilnya", "jalankan check", "sudah selesai, tolong verifikasi".
---

# Jalankan check dan tulis HASIL.md

Tugasmu hanya MENJALANKAN dan MELAPORKAN. Jangan memperbaiki kode kecuali user meminta secara eksplisit.

## Langkah

1. Dari root repo (`c:/dev/absensi-perusahaan`), pastikan folder `.claude` ada, lalu jalankan dan alihkan SELURUH output ke berkas log. Jangan menampilkan output mentahnya ke percakapan:

   ```bash
   bun run check > .claude/check.log 2>&1; echo "exit=$?"
   ```

2. Kumpulkan metadata git:

   ```bash
   git rev-parse --short HEAD
   git status --short
   ```

3. Baca `.claude/check.log` secukupnya (cari baris `error`, `FAIL`, `✗`, `panicked`, `no such column`, `warning: unused`). Jangan membaca seluruh berkas bila hasilnya hijau; cukup baris ringkasan akhir tiap gate.

4. TIMPA `.claude/HASIL.md` dengan format persis ini:

   ```markdown
   # HASIL.md — hasil `bun run check`

   - Waktu: <tanggal dan jam WIB>
   - Commit: <hash pendek> (+ <N> berkas berubah, belum commit)
   - Perintah: `bun run check` (root)
   - Exit code: <angka>
   - Status: **LULUS** atau **GAGAL**
   - Log penuh: `.claude/check.log`

   ## Gate yang gagal
   <tabel: Gate | Status (Lulus / GAGAL / tidak sempat jalan)>
   Catatan gate di repo Absensi SPPG:
   - `audit:schema` (scripts/schema-audit.ts)
   - `audit:contract` (.agents/skills/absensi-sppg-rules/scripts/audit-sync-contract.ts)
   - `audit:docs` (.agents/skills/absensi-sppg-rules/scripts/audit-docs.ts)
   - `web-desktop` (`lint` + `typecheck` + `bun test` + `cargo test`)
   - `mobile` (`lint` + `typecheck` + `bun test` + `cargo test`)

   ## Galat (maks 10, urutan kemunculan)
   1. `<file>:<baris>` — <gate>: <pesan galat singkat>

   ## Catatan
   <kosong bila tidak ada; hanya fakta dari log>
   ```

5. Balas user dalam MAKSIMAL tiga baris: status, jumlah galat, dan bahwa hasilnya ada di `.claude/HASIL.md`.

## Aturan Arsitektur Absensi SPPG

- Jangan menempelkan log mentah ke percakapan maupun ke `HASIL.md`.
- DILARANG memodifikasi atau melonggarkan skrip audit (`audit-sync-contract.ts`, `schema-audit.ts`, dll.) demi membuat check lulus secara semu (Aturan 35).
- Playwright E2E (`test:e2e`) terpisah dari pipeline `bun run check`.
- Bila `bun run check` tidak bisa dijalankan sama sekali (bun tidak ada, folder salah), tulis itu di `HASIL.md` sebagai GAGAL dengan pesan galatnya.
- Bila user meminta hanya gerbang cepat (misal `/check quick`), jalankan `bun run check:quick > .claude/check.log 2>&1; echo "exit=$?"` dan catat perintah `bun run check:quick` di baris `Perintah`.
