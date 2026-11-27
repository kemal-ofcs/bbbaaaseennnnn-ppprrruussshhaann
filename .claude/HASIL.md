# HASIL.md — hasil `bun run check`

- Waktu: 2026-11-27 21:26 WIB
- Commit: beaa5cb (+ 3 berkas berubah, belum commit)
- Perintah: `bun run check` (root)
- Exit code: 0
- Status: **LULUS**
- Log penuh: `.claude/check.log`

## Gate yang gagal
| Gate | Status |
| :--- | :--- |
| `audit:schema` (`scripts/schema-audit.ts`) | Lulus |
| `audit:contract` (`.agents/skills/absensi-sppg-rules/scripts/audit-sync-contract.ts`) | Lulus |
| `audit:docs` (`.agents/skills/absensi-sppg-rules/scripts/audit-docs.ts`) | Lulus |
| `audit:kontras` (`scripts/audit-kontras.ts`) | Lulus |
| `web-desktop` (`lint` + `typecheck` + `bun test` + `cargo test`) | Lulus |
| `mobile` (`lint` + `typecheck` + `bun test` + `cargo test`) | Lulus |

## Galat (maks 10, urutan kemunculan)
Tidak ada galat.

## Catatan
- `web-desktop`: Biome bersih, `tsc` bersih, seluruh tes TS lulus, `cargo test` 480 passed / 0 failed.
- `mobile`: Biome bersih (tanpa `!important` baru), `tsc` bersih, seluruh tes TS lulus, `cargo test` 484 passed / 0 failed.
