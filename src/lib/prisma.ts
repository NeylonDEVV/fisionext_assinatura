import { PrismaClient } from "@/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { resolveDbUrl } from "./db-url";

const g = globalThis as unknown as { prisma?: PrismaClient };
const make = () => new PrismaClient({ adapter: new PrismaBetterSqlite3({ url: resolveDbUrl() }) });

export const prisma = g.prisma ?? make();
if (process.env.NODE_ENV !== "production") g.prisma = prisma;
