// Daftar #[tauri::command] yang TIDAK memanggil require_permission.
// Hasilnya daftar kandidat, bukan vonis: login, reset password, dan status
// bootstrap memang sah tanpa sesi. Periksa sisanya satu per satu.
// Jalankan dari root repo: bun .claude/skills/audit-perbaiki-sppg/scripts/command-guards.ts
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, sep } from "node:path";

const walk = (d: string): string[] =>
  readdirSync(d).flatMap((f) => {
    const p = join(d, f);
    return statSync(p).isDirectory() ? walk(p) : f.endsWith(".rs") ? [p] : [];
  });

for (const root of ["web-desktop/src-tauri/src", "mobile/src-tauri/src"]) {
  for (const file of walk(root)) {
    for (const part of readFileSync(file, "utf8").split("#[tauri::command]").slice(1)) {
      const name = part.match(/fn\s+([a-z0-9_]+)/)?.[1];
      const end = part.indexOf("\n}\n");
      const body = part.slice(0, end < 0 ? part.length : end);
      if (body.includes("require_permission(")) continue;
      const other = /require_session|is_superadmin|ensure_bootstrap_window_open/.exec(body)?.[0] ?? "TANPA GUARD";
      console.log(`${file.split(sep).join("/")} :: ${name} -> ${other}`);
    }
  }
}
