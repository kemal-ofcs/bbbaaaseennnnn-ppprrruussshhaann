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
pub use config::MobileState;
