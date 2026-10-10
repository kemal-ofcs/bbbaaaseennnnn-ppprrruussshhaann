// Cocokkan argumen invokeDesktop("cmd", { ... }) dengan parameter Rust-nya.
// Tauri v2 mengharapkan camelCase; snake_case diam-diam menjadi None.
// Regex-nya kasar: objek bersarang bisa muncul sebagai "extra" palsu. Buka
// berkasnya sebelum menyimpulkan apa pun.
// Jalankan dari root repo: bun .claude/skills/audit-perbaiki-sppg/scripts/ipc-args.ts
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, sep } from "node:path";

const walk = (d: string, ext: RegExp): string[] =>
  readdirSync(d).flatMap((f) => {
    const p = join(d, f);
    return statSync(p).isDirectory() ? walk(p, ext) : ext.test(f) ? [p] : [];
  });
const camel = (s: string) => s.replace(/_([a-z0-9])/g, (_, c: string) => c.toUpperCase());

const rust = new Map<string, string[]>();
for (const f of [...walk("web-desktop/src-tauri/src", /\.rs$/), ...walk("mobile/src-tauri/src", /\.rs$/)]) {
  const s = readFileSync(f, "utf8");
  for (const m of s.matchAll(/#\[tauri::command[^\]]*\][\s\S]{0,200}?\bfn\s+([a-z_0-9]+)\s*(?:<[^>]*>)?\(([\s\S]*?)\)\s*->/g)) {
    const params = [...m[2].matchAll(/([a-z_][a-z0-9_]*)\s*:\s*([^,]+)/g)]
      .filter((x) => !/State<|AppHandle|Window|WebviewWindow/.test(x[2]))
      .map((x) => camel(x[1]));
    rust.set(m[1], params);
  }
}

for (const f of [...walk("web-desktop/src", /\.tsx?$/), ...walk("mobile/src", /\.tsx?$/)]) {
  const s = readFileSync(f, "utf8");
  for (const m of s.matchAll(/invokeDesktop(?:<[\s\S]*?>)?\(\s*"([a-z_0-9]+)"\s*(?:,\s*(\{[\s\S]*?\})\s*)?\)/g)) {
    const expected = rust.get(m[1]);
    if (!expected) {
      console.log(`COMMAND RUST TIDAK ADA: ${m[1]} (${f})`);
      continue;
    }
    let depth = 0;
    let flat = "";
    for (const ch of (m[2] ?? "{}").slice(1, -1)) {
      if ("{[(".includes(ch)) depth++;
      else if ("}])".includes(ch)) depth--;
      else if (depth === 0) flat += ch;
    }
    const keys = flat.split(",").map((k) => k.trim().split(/[:\s]/)[0]).filter((k) => k && !k.startsWith("..."));
    const extra = keys.filter((k) => !expected.includes(k));
    const snake = keys.filter((k) => k.includes("_"));
    if (extra.length || snake.length) {
      console.log(`${m[1]} | extra: ${extra.join(",")} | snake_case: ${snake.join(",")} | ${f.split(sep).join("/")}`);
    }
  }
}
