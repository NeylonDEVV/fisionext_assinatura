// Backup consistente do SQLite (seguro com o sistema rodando). Mantém os N mais recentes.
import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

const dbPath = (process.env.DATABASE_URL ?? "file:./dev.db").replace(/^file:/, "");
const dir = process.env.BACKUP_DIR ?? path.join(path.dirname(dbPath), "backups");
const keep = Number(process.env.BACKUP_KEEP ?? 14);

fs.mkdirSync(dir, { recursive: true });
const out = path.join(dir, `fisionext-${new Date().toISOString().replace(/[:.]/g, "-")}.db`);
const db = new Database(dbPath, { readonly: true, fileMustExist: true });
await db.backup(out);
db.close();

const files = fs.readdirSync(dir).filter((f) => /^fisionext-.*\.db$/.test(f)).sort();
for (const f of files.slice(0, Math.max(0, files.length - keep))) fs.unlinkSync(path.join(dir, f));
console.log("Backup concluído:", out);
