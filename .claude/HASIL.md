# HASIL.md — hasil `bun run check`

- Waktu: 29 Oktober 2026, 06:53 WIB
- Commit: f03610e (+ 95 berkas berubah, belum commit)
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
- Skema 4 lapisan konsisten: 483 kolom pada 41 tabel snapshot hadir di sisi lokal dan cloud (57 tabel operasional terverifikasi).
- Kontrak sinkronisasi valid: 70 rute kanonik, 41 tabel snapshot, 204 command web-desktop, 209 command mobile.
- Dokumentasi sinkron: 70 rute kanonik, 41 tabel snapshot, 16 izin sensitif, 3 provider database.
- `web-desktop`: Biome check bersih, TypeScript check bersih, Bun test lulus, Cargo test 327 lulus (0 gagal).
- `mobile`: Biome check bersih (363 berkas), TypeScript check bersih, Bun test lulus, Cargo test 330 lulus (0 gagal).
