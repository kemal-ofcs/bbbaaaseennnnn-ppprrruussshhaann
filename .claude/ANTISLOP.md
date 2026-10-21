# ANTISLOP.md: hasil antislop

- Waktu: 2026-10-21 02:14 WIB
- Commit: 102c63f (+ 17 berkas berubah/baru, belum commit)
- Berkas disunting: 7
- Cakupan: hanya baris yang berubah untuk fitur pemilih karyawan dan Ubah massal

## Disunting
- `web-desktop/src/lib/validations/stabilization.ts`: komentar: doc `draftKaryawanDariBaris`: tiga baris jadi dua, "DAN" kapital dihapus
- `web-desktop/src/components/personnel/aturanUbahMassal.ts`: komentar: contoh field sekolah (`id_rombel`, `unit`) diganti `divisi`, `id_shift`; baris pembuka dirapikan
- `web-desktop/src/app/karyawan/page.tsx`: teks UI: label shift Ubah massal memakai " - " (bukan en dash), sama dengan /operational
- `mobile/src/app/karyawan/page.tsx`: teks UI + komentar: label shift sama; separator dekoratif `// ─── Ubah massal ───` dihapus
- `mobile/src/components/personnel/aturanUbahMassal.ts`: salinan hasil `sync:mobile` dari padanan web-desktop

- `web-desktop/src/app/operational/page.tsx`: teks UI: emoji di tab, judul, dan tombol (🛠️ 👥 📥 💾 ➕ 📁 ✨) dihapus; ⚠️ di dua dialog diganti `<Icon name="alert">`
- `mobile/src/app/operational/page.tsx`: teks UI: ✨ di opsi "Otomatis" dihapus
- `web-desktop/src/lib/validations/stabilization.ts`: teks UI: pesan validasi shift "antara X–Y menit" jadi "antara X dan Y menit", sama dengan pesan lain

## Dilewati
- `*.test.ts`: fixture adalah data
- `mobile/src/components/**`, `mobile/src/lib/**`: salinan hasil sinkronisasi (diperbarui lewat `bun run sync:mobile`)
- `mobile/scripts/sync-frontend-lib.ts`, kedua halaman /operational, `PilihPersonil.tsx`, `UbahMassal.tsx`, `aturanPilihPersonil.ts`: tidak ada temuan

## Perlu tindakan
- Tidak ada. `sync:mobile` sudah dijalankan; `bun run check:quick` ulang lulus (exit 0) setelah semua suntingan.
