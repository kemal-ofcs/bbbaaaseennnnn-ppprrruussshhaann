# HASIL.md — hasil `bun run check`

- Waktu: 2026-11-26 22:23 WIB
- Commit: 7275736 (+ 276 berkas berubah/baru, belum commit)
- Perintah: `bun run check` (root)
- Exit code: 0
- Status: **LULUS**
- Log penuh: `.claude/check.log`

## Gate yang gagal

| Gate | Status |
|---|---|
| `audit:schema` | Lulus |
| `audit:contract` (94 rute, 68 tabel snapshot) | Lulus |
| `audit:docs` | Lulus |
| `audit:kontras` | Lulus |
| `web-desktop` (Biome 669 berkas, typecheck, bun test, cargo test 480) | Lulus |
| `mobile` (Biome 488 berkas, typecheck, bun test, cargo test 484) | Lulus |

## Galat (maks 10, urutan kemunculan)
Tidak ada.

## Catatan
- Biome Mobile: 5 peringatan `noImportantStyles` di `mobile/src/app/globals.css` (blok login, sudah ada sebelum PRD ini), bukan galat.
- Langkah 8 PRD UI navy + emas: antislop (`.claude/ANTISLOP.md`) lalu check ini.
