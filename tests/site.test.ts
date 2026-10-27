import { describe, expect, it } from "vitest";
import { contactHref, siteConfig } from "@/lib/site";

describe("siteConfig", () => {
  it("guarda só os dígitos do WhatsApp e lê o e-mail", () => {
    const c = siteConfig({ SITE_WHATSAPP: "+55 (61) 99999-1111", SITE_EMAIL: " oi@fisionext.com.br " });
    expect(c.whatsapp).toBe("5561999991111");
    expect(c.email).toBe("oi@fisionext.com.br");
  });
  it("planos ficam escondidos, a menos que SITE_SHOW_PRICING seja 'true'", () => {
    expect(siteConfig({}).showPricing).toBe(false);
    expect(siteConfig({ SITE_SHOW_PRICING: "1" }).showPricing).toBe(false);
    expect(siteConfig({ SITE_SHOW_PRICING: "true" }).showPricing).toBe(true);
  });
});

describe("contactHref", () => {
  it("prefere o WhatsApp, com mensagem pronta", () => {
    const href = contactHref(siteConfig({ SITE_WHATSAPP: "5561999991111", SITE_EMAIL: "oi@x.com" }))!;
    expect(href.startsWith("https://wa.me/5561999991111?text=")).toBe(true);
    expect(decodeURIComponent(href.split("text=")[1])).toMatch(/Quero testar o FisioNext/);
  });
  it("usa o e-mail quando não há WhatsApp válido", () => {
    expect(contactHref(siteConfig({ SITE_WHATSAPP: "123", SITE_EMAIL: "oi@x.com" }))).toMatch(/^mailto:oi@x\.com\?subject=/);
  });
  it("sem contato configurado, não inventa link", () => {
    expect(contactHref(siteConfig({}))).toBeNull();
  });
});

describe("cadastro público e teste grátis", () => {
  it("o cadastro só abre com SIGNUP_ENABLED=true", () => {
    expect(siteConfig({}).signupEnabled).toBe(false);
    expect(siteConfig({ SIGNUP_ENABLED: "1" }).signupEnabled).toBe(false);
    expect(siteConfig({ SIGNUP_ENABLED: "true" }).signupEnabled).toBe(true);
  });
  it("duração do teste: 14 dias por padrão, ou o valor válido configurado", () => {
    expect(siteConfig({}).trialDays).toBe(14);
    expect(siteConfig({ TRIAL_DAYS: "7" }).trialDays).toBe(7);
    expect(siteConfig({ TRIAL_DAYS: "0" }).trialDays).toBe(14);
    expect(siteConfig({ TRIAL_DAYS: "abc" }).trialDays).toBe(14);
    expect(siteConfig({ TRIAL_DAYS: "-3" }).trialDays).toBe(14);
  });
});
