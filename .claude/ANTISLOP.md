# ANTISLOP.md - hasil antislop

- Waktu: 2026-11-27 23:01 WIB
- Commit: d5bde97
- Berkas disunting: 0 (audit pasca-implementasi bersih)

## Ringkasan Audit Pasca-Implementasi
- **Komentar kode (`antislop-code`)**: Komentar di `web-desktop/src/app/globals.css`, `mobile/src/app/globals.css`, dan `web-desktop/src/components/ui/PilihCari.tsx` singkat (1-2 baris), menjelaskan alasan teknis serta rasio kontras WCAG nyata (`>= 3:1` untuk kontrol form `#7685ab` / `#7584aa`, `>= 4,5:1` untuk teks), tanpa banner dekoratif dan `0` karakter em dash.
- **Visual & Tata Letak (`antislop-ui`)**:
  - Border emas global yang memicu kebisingan visual dihapus seluruhnya (pengurangan bersih 36 baris kode).
  - Hierarki 3 lapis *tone-on-tone* diterapkan merata: kanvas anti-silau `#eef2f7`, kartu utama `#ffffff` ber-hairline netral `#d8e1ee`, dan permukaan grup/sub-kotak `#e7edf5`.
  - Masalah *button box di dalam box* dihilangkan pada `TabBar` (rel segmen lembut `--app-tab-track`), deretan chip preset tanggal/audit, dan sub-kotak `PerluPerhatian`.
  - `PilihCari` disatukan menjadi satu kotak dropdown utuh sejajar dengan `<select>`.
  - Badge duplikat `Menunggu Jam Absen` di `audit-absensi` dan emoji dekoratif pada tab/filter `history` dibersihkan.
- **Kontras & Aksesibilitas (`antislop-human`)**: `bun run audit:kontras` lulus (`0` pelanggaran pada 1.400 potongan className), indikator `:focus-visible` dan atribut ARIA pada `TabBar` serta `PilihCari` terjaga penuh.

## Dilewati (sudah bersih)
- `web-desktop/src/app/globals.css` & `mobile/src/app/globals.css`
- `web-desktop/src/components/ui/PilihCari.tsx` & `mobile/src/components/ui/PilihCari.tsx`
- `web-desktop/src/components/ui/StatusBadge.tsx` & `mobile/src/components/ui/StatusBadge.tsx`
- `web-desktop/src/components/hris/PerluPerhatian.tsx` & `mobile/src/components/hris/PerluPerhatian.tsx`
- `web-desktop/src/app/dashboard/page.tsx`
- `web-desktop/src/app/history/page.tsx`
- `web-desktop/src/app/audit-absensi/page.tsx` & `mobile/src/app/audit-absensi/page.tsx`
- `web-desktop/src/app/payroll/page.tsx` & `mobile/src/app/payroll/page.tsx`
- `web-desktop/src/app/operators/page.tsx`

## Perlu tindakan
Tidak ada.
