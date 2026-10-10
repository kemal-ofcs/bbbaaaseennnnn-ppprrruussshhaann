// Pastikan modul Rust salinan mobile identik dengan sumbernya di web-desktop.
// Jalankan dari root repo: bun .claude/skills/audit-perbaiki-sppg/scripts/drift.ts
import { readFileSync } from "node:fs";

const adapt = (c: string) =>
  c
    .replaceAll("DesktopState", "MobileState")
    .replaceAll("DesktopSyncStatus", "MobileSyncStatus")
    .replaceAll("DesktopLoginResult", "MobileLoginResult")
    .replaceAll("DesktopRuntimeStatus", "MobileRuntimeStatus")
    .replaceAll("DesktopSession", "MobileSession")
    .replaceAll("desktop-security.db", "mobile-security.db")
    .replaceAll("crate::desktop::", "crate::mobile::")
    .replaceAll("use crate::desktop", "use crate::mobile")
    .replaceAll("super::super::desktop", "super::super::mobile");

// Harus sama dengan daftar di mobile/scripts/sync-rust-modules.ts.
const pairs: [string, string][] = [
  ...["sync", "operational", "administration", "scanner", "commands", "payroll_seed", "turso", "sql_backend", "portability", "time_policy"].map(
    (f): [string, string] => [`desktop/${f}.rs`, `mobile/${f}.rs`],
  ),
  ...["mod", "commands", "engine", "models"].map(
    (f): [string, string] => [`desktop/payroll/${f}.rs`, `mobile/payroll_admin/${f}.rs`],
  ),
];

let drift = 0;
for (const [src, dst] of pairs) {
  const a = adapt(readFileSync(`web-desktop/src-tauri/src/${src}`, "utf8")).replace(/\r/g, "");
  const b = readFileSync(`mobile/src-tauri/src/${dst}`, "utf8").replace(/\r/g, "");
  if (a !== b) {
    drift++;
    console.log(`DRIFT ${src} -> ${dst}`);
  }
}
console.log(drift ? `${drift} berkas drift. Jalankan: bun run sync:mobile` : "Semua salinan identik.");
process.exit(drift ? 1 : 0);
