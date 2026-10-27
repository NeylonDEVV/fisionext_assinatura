import { prisma } from "./prisma";

// Modelos que pertencem a uma clínica. Clinic, BillingPayment e BillingEvent são tratados à parte.
const SCOPED = new Set(["User", "Patient", "Appointment", "Evolution", "Admission", "Payment"]);
const FILTERED = new Set([
  "findFirst", "findFirstOrThrow", "findMany", "findUnique", "findUniqueOrThrow", "count", "aggregate", "groupBy",
  "update", "updateMany", "delete", "deleteMany", "upsert",
]);

/**
 * Cliente do banco já filtrado pela clínica: toda leitura, alteração e exclusão recebe `clinicId` no filtro,
 * e toda criação grava o `clinicId`. É a principal barreira contra misturar dados de clínicas diferentes.
 */
export function forClinic(clinicId: string) {
  return prisma.$extends({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          if (!SCOPED.has(model)) return query(args);
          const a: any = { ...(args as object) };
          if (FILTERED.has(operation)) a.where = { ...(a.where ?? {}), clinicId };
          if (operation === "create") a.data = { ...a.data, clinicId };
          if (operation === "createMany") a.data = (Array.isArray(a.data) ? a.data : [a.data]).map((d: object) => ({ ...d, clinicId }));
          if (operation === "upsert") a.create = { ...a.create, clinicId };
          return query(a);
        },
      },
    },
  });
}
export type ClinicDb = ReturnType<typeof forClinic>;
