# HASIL.md — hasil `bun run check`

- Waktu: 28 Oktober 2026, 18:07 WIB
- Commit: d3144fa (+ 1 berkas log berubah, belum commit)
- Perintah: `bun run check` (root)
- Exit code: 0
- Status: **LULUS**
- Log penuh: `.claude/check.log`

## Gate yang gagal
| Gate | Status |
| :--- | :--- |
| `audit:schema` | Lulus |
| `audit:contract` | Lulus |
| `audit:docs` | Lulus |
| `web-desktop` (`lint` + `typecheck` + `bun test` + `cargo test`) | Lulus |
| `mobile` (`lint` + `typecheck` + `bun test` + `cargo test`) | Lulus |

## Galat (maks 10, urutan kemunculan)
Tidak ada.

## Catatan
- Seluruh 4 lapisan skema konsisten: 439 kolom pada 37 tabel snapshot hadir di sisi lokal dan cloud.
- Kontrak sync kanonik valid (65 route kanonik, 199 command web-desktop, 204 command mobile).
- `web-desktop`: Biome check bersih, TypeScript check bersih, Bun test lulus, Cargo test 315 lulus (0 gagal).
- `mobile`: Biome check bersih (357 files), TypeScript check bersih, Bun test lulus, Cargo test 318 lulus (0 gagal).
