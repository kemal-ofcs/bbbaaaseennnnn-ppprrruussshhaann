mod administration;
pub mod commands;
pub mod config;
pub mod face_match;
// Hari kerja shift: SALINAN `desktop/hari_kerja.rs` oleh sync-rust-modules.ts.
mod hari_kerja;
// Inventaris: SALINAN `desktop/inventory.rs` oleh sync-rust-modules.ts.
mod inventory;
// Pembelian cicilan: SALINAN `desktop/cicilan.rs` oleh sync-rust-modules.ts.
mod cicilan;
// Pengajuan pembelian: SALINAN `desktop/inventory_pengajuan.rs` oleh sync-rust-modules.ts.
mod inventory_pengajuan;
// Pembukuan: SALINAN `desktop/accounting.rs` oleh sync-rust-modules.ts.
mod accounting;
// Kasbon: SALINAN `desktop/loan.rs` oleh sync-rust-modules.ts.
mod loan;
// Tutup buku: SALINAN `desktop/tutup_buku.rs` oleh sync-rust-modules.ts.
mod tutup_buku;
// Perjalanan driver: SALINAN `desktop/driver.rs` oleh sync-rust-modules.ts.
mod driver;
// HRIS: SALINAN `desktop/hris.rs` oleh sync-rust-modules.ts.
mod hris;
// HRIS fase 2: SALINAN `desktop/hr_pengajuan.rs` oleh sync-rust-modules.ts.
mod hr_pengajuan;
// HRIS fase 5: SALINAN `desktop/hr_keluar.rs` oleh sync-rust-modules.ts.
mod hr_keluar;
// HRIS fase 6: SALINAN `desktop/hr_kinerja.rs` oleh sync-rust-modules.ts.
mod hr_kinerja;
// HRIS fase 7: SALINAN `desktop/hr_rekrutmen.rs` dan `desktop/hr_pelatihan.rs`
// oleh sync-rust-modules.ts.
mod hr_rekrutmen;
mod hr_pelatihan;
// HRIS fase 12: SALINAN `desktop/transfer.rs` oleh sync-rust-modules.ts.
mod transfer;
// Notifikasi grup Telegram: SALINAN `desktop/telegram.rs` oleh sync-rust-modules.ts.
pub mod telegram;
// Lisensi offline Ed25519: SALINAN `desktop/license.rs` oleh sync-rust-modules.ts.
pub mod license;
pub mod models;
mod operational;
mod payroll_seed;
mod scanner;
pub mod secrets;
pub mod sql_backend;
pub mod storage;
pub mod sync;
mod time_policy;
pub mod turso;

pub mod portability;
pub mod payroll;
// Administrasi payroll: SALINAN modul Desktop oleh scripts/sync-rust-modules.ts.
pub mod payroll_admin;
pub mod share;
// Khusus Mobile (di luar daftar salin): deteksi lokasi palsu lewat JNI.
pub mod device_location;
pub use config::MobileState;
