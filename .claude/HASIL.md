# HASIL.md — hasil `bun run check`

- Waktu: 2026-11-27 06:18 WIB
- Commit: 964e081 (+ 31 berkas berubah, belum commit)
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
- `web-desktop`: Biome 670 berkas bersih, `tsc` bersih, seluruh tes TS lulus, `cargo test` 480 passed / 0 failed (memakai linker `rust-lld.exe` dan `run_with_context`).
- `mobile`: Biome 490 berkas bersih, `tsc` bersih, seluruh tes TS lulus, `cargo test` 484 passed / 0 failed (memakai linker `rust-lld.exe`).
