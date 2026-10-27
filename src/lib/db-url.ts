import path from "node:path";

/**
 * Resolve DATABASE_URL de forma idêntica para o Prisma CLI e para o app:
 * "file:./dev.db" vira um caminho absoluto a partir do diretório atual (raiz do projeto).
 * Caminhos já absolutos (ex.: file:/data/fisionext.db no Docker) ficam como estão.
 */
export function resolveDbUrl(raw: string = process.env.DATABASE_URL ?? "file:./dev.db") {
  if (!raw.startsWith("file:")) return raw;
  const p = raw.slice(5);
  return path.isAbsolute(p) ? raw : `file:${path.resolve(process.cwd(), p).replace(/\\/g, "/")}`;
}
