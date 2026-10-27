import { execSync } from "node:child_process";

// Recria o banco de testes (test.db) a partir do schema antes de rodar a suíte.
export default function setup() {
  execSync("npx prisma db push --force-reset", {
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: "file:./test.db" },
  });
}
