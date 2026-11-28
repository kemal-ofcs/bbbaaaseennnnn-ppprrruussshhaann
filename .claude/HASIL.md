# HASIL.md - hasil `bun run check`

- Waktu: 2026-11-27 23:01 WIB
- Commit: d5bde97
- Perintah: `bun run check` (root)
- Exit code: 0
- Status: **LULUS**
- Log penuh: `.claude/check.log`

## Ringkasan Gate
| Gate | Status |
| :--- | :--- |
| `audit:schema` (`scripts/schema-audit.ts`) | Lulus |
| `audit:contract` (`.agents/skills/absensi-sppg-rules/scripts/audit-sync-contract.ts`) | Lulus |
| `audit:docs` (`.agents/skills/absensi-sppg-rules/scripts/audit-docs.ts`) | Lulus |
| `audit:kontras` (`scripts/audit-kontras.ts`) | Lulus (0 pelanggaran dari 1.400 className) |
| `web-desktop` (`lint` 670 berkas + `typecheck` + `bun test` + `cargo test` 480 lulus) | Lulus |
| `mobile` (`lint` 490 berkas + `typecheck` + `bun test` + `cargo test` 484 lulus) | Lulus |

## Galat
Tidak ada galat.

## Catatan
- Total tes TypeScript/Bun di kedua workspace: 1.825 lulus / 0 gagal (termasuk `PilihCari.test.ts` dan `TabBar.test.ts`).
- Total tes Rust: `web-desktop` 480 passed / 0 failed, `mobile` 484 passed / 0 failed.
