import Database from "bun:sqlite";
import path from "node:path";
import fs from "node:fs";

const localAppData =
  process.env.LOCALAPPDATA ||
  path.resolve(process.env.USERPROFILE || "", "AppData/Local");
const targetDbPath = path.join(
  localAppData,
  "id.absensi.perusahaan",
  "desktop-security.db",
);

console.log("Target DB:", targetDbPath);

if (!fs.existsSync(targetDbPath)) {
  console.log("File desktop-security.db tidak ditemukan.");
  process.exit(0);
}

const db = new Database(targetDbPath);

console.log("\n=== company_profile in desktop-security.db ===");
console.log(JSON.stringify(db.query("SELECT * FROM company_profile").all(), null, 2));

console.log("\n=== id_card_template in desktop-security.db ===");
console.log(
  JSON.stringify(
    db
      .query(
        "SELECT id, name, orientation, is_active, created_at, updated_at, length(front_bg_url) as front_bg_len, length(back_bg_url) as back_bg_len, length(elements_json) as elem_len FROM id_card_template",
      )
      .all(),
    null,
    2,
  ),
);

console.log("\n=== outbox for settings in desktop-security.db ===");
console.log(
  JSON.stringify(
    db
      .query(
        "SELECT event_id, domain, operation, entity_key, status, last_error FROM desktop_sync_outbox WHERE domain LIKE '%company%' OR domain LIKE '%template%' OR domain LIKE '%setting%'",
      )
      .all(),
    null,
    2,
  ),
);
