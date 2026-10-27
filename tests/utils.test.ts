import { describe, expect, it } from "vitest";
import { addDays, brl, initials, startOfDay } from "@/lib/utils";

describe("utils", () => {
  it("brl formata centavos em reais", () => {
    expect(brl(15000).replace(/\s/g, " ")).toBe("R$ 150,00");
    expect(brl(0).replace(/\s/g, " ")).toBe("R$ 0,00");
    expect(brl(123456).replace(/\s/g, " ")).toBe("R$ 1.234,56");
  });
  it("initials usa as duas primeiras palavras", () => {
    expect(initials("ana beatriz lima")).toBe("AB");
    expect(initials("Carla")).toBe("C");
  });
  it("startOfDay zera a hora", () => {
    expect(startOfDay(new Date(2026, 9, 11, 15, 30)).getTime()).toBe(new Date(2026, 9, 11).getTime());
  });
  it("addDays soma dias", () => {
    const d = new Date(2026, 9, 11);
    expect(addDays(d, 2).getTime() - d.getTime()).toBe(2 * 864e5);
  });
});
