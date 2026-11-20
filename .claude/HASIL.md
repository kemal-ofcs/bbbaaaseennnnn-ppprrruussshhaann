# HASIL.md — hasil `bun run check`

- Waktu: 20 November 2026 12:55 WIB
- Commit: 152878b (+ 26 berkas berubah/baru, belum commit)
- Perintah: `bun run check` (root)
- Exit code: 0
- Status: **LULUS**
- Log penuh: `.claude/check.log`

## Gate yang gagal
| Gate | Status |
| :--- | :--- |
| `audit:schema` (scripts/schema-audit.ts) | Lulus |
| `audit:contract` (.agents/skills/absensi-sppg-rules/scripts/audit-sync-contract.ts) | Lulus |
| `audit:docs` (.agents/skills/absensi-sppg-rules/scripts/audit-docs.ts) | Lulus |
| `web-desktop` (`lint` + `typecheck` + `bun test` + `cargo test`) | Lulus |
| `mobile` (`lint` + `typecheck` + `bun test` + `cargo test`) | Lulus |

## Galat (maks 10, urutan kemunculan)
(Tidak ada galat)

## Catatan
- Seluruh pengujian skema 4-layer, 90 rute kontrak sinkronisasi, dan audit dokumentasi berhasil 100%.
- TypeScript typecheck, Biome lint, Bun test, serta 477 cargo unit test di workspace mobile dan seluruh cargo unit test di web-desktop lulus tanpa kegagalan.
