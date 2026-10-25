# HASIL.md — hasil `bun run check`

- Waktu: 26 Oktober 2026, 06:02 WIB
- Commit: c470d22 (+ 21 berkas berubah, belum commit)
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
Tidak ada galat (0 galat).

## Catatan
- `audit:schema`: 51 tabel cloud Rust, 48 tabel lokal Rust, 50 tabel Web. Seluruh lapisan skema konsisten.
- `audit:contract`: 55 route kanonik dan 33 tabel snapshot konsisten; 186 command web-desktop dan 191 command mobile terdaftar & terdefinisi.
- `audit:docs`: 55 rute kanonik, 33 tabel snapshot, 15 izin sensitif, dan 3 provider database cocok.
- `web-desktop`: Biome check 467 file bersih, TypeScript typecheck lolos tanpa error, Bun test lolos (0 fail), Cargo test lolos (297 passed, 0 failed).
- `mobile`: Biome check bersih, TypeScript typecheck lolos tanpa error, Bun test lolos (0 fail), Cargo test lolos (300 passed, 0 failed).
