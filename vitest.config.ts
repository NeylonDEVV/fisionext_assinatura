import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    globalSetup: ["tests/global-setup.ts"], // recria test.db a partir do schema
    fileParallelism: false, // os testes compartilham o mesmo test.db
    env: {
      DATABASE_URL: "file:./test.db",
      AUTH_SECRET: "chave-de-teste-com-mais-de-trinta-e-dois-caracteres",
    },
  },
  resolve: { alias: { "@": path.resolve(__dirname, "src") } },
});
