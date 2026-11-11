# HASIL.md — hasil `bun run check`

- Waktu: 11 November 2026, 12:15 WIB
- Commit: 238601d (+ 96 berkas berubah, belum commit)
- Perintah: `bun run check` (root)
- Exit code: 1
- Status: **GAGAL**
- Log penuh: `.claude/check.log`

## Gate yang gagal

| Gate | Status |
| :--- | :--- |
| `audit:schema` | **GAGAL** |
| `audit:contract` | tidak sempat jalan |
| `audit:docs` | tidak sempat jalan |
| `web-desktop` | tidak sempat jalan |
| `mobile` | tidak sempat jalan |

## Galat (maks 10, urutan kemunculan)

1. `scripts/schema-audit.ts` — audit:schema: tabel 'hr_keluar' ada di Rust, TIDAK ada di Web
2. `scripts/schema-audit.ts` — audit:schema: tabel 'hr_keluar_alasan' ada di Rust, TIDAK ada di Web
3. `scripts/schema-audit.ts` — audit:schema: tabel 'hr_keluar_rincian' ada di Rust, TIDAK ada di Web
4. `scripts/schema-audit.ts` — audit:schema: tabel 'hr_sp' ada di Rust, TIDAK ada di Web
5. `scripts/schema-audit.ts` — audit:schema: master_data: kolom [id_keluar] ada di Rust, hilang di Web
6. `scripts/schema-audit.ts` — audit:schema: rencana promosi tidak sinkron dengan skema cloud (tabel tanpa keputusan: hr_keluar, hr_keluar_alasan, hr_keluar_rincian, hr_sp)

## Catatan
- DDL 4 tabel HRIS terminasi/SP (`hr_keluar`, `hr_keluar_alasan`, `hr_keluar_rincian`, `hr_sp`) dan kolom `master_data.id_keluar` telah ditambahkan di Rust (`turso.rs` / `storage.rs`), tetapi belum ditambahkan di jalur Web (`db-schema.ts`, `db-migrations.ts`) dan rencana promosi (`database-promotion.ts`).
