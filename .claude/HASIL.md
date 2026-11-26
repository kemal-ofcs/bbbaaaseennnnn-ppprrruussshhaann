# HASIL.md — hasil `bun run check`

- Waktu: 2026-11-27 00:05 WIB
- Commit: d57ce27 (+ 6 berkas berubah di luar `.claude/`, belum commit)
- Perintah: `bun run check` (root)
- Exit code: 0
- Status: **LULUS**
- Log penuh: `.claude/check.log`

## Gate yang gagal

| Gate | Status |
|---|---|
| `audit:schema` | Lulus |
| `audit:contract` | Lulus |
| `audit:docs` | Lulus |
| `audit:kontras` | Lulus |
| `web-desktop` (`lint` 669 berkas + `typecheck` + `bun test` + `cargo test` 480 lulus) | Lulus |
| `mobile` (`lint` 490 berkas + `typecheck` + `bun test` termasuk `MobileWebViewGuard.test.ts` + `cargo test` 484 lulus) | Lulus |

## Galat (maks 10, urutan kemunculan)
Tidak ada.

## Catatan
- Biome `mobile`: 5 peringatan `noImportantStyles` bawaan pada blok `.login-field` di `mobile/src/app/globals.css`, bukan galat.
