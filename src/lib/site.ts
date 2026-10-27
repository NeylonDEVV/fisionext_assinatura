// Configuração da página pública. Lida em tempo de execução (a landing é renderizada a cada pedido),
// então basta definir as variáveis no .env.production, sem refazer o build.
const digits = (s: string) => s.replace(/\D/g, "");

export function siteConfig(env: Record<string, string | undefined> = process.env) {
  return {
    whatsapp: digits(env.SITE_WHATSAPP ?? ""), // com DDI e DDD, ex.: 5561999999999
    email: (env.SITE_EMAIL ?? "").trim(),
    showPricing: env.SITE_SHOW_PRICING === "true",
    signupEnabled: env.SIGNUP_ENABLED === "true", // só abra depois de ter Termos de uso e Política de privacidade
    trialDays: Number.isInteger(Number(env.TRIAL_DAYS)) && Number(env.TRIAL_DAYS) > 0 ? Number(env.TRIAL_DAYS) : 14,
  };
}

/** Link do botão "Quero testar": WhatsApp, e-mail ou nada (nesse caso a página oferece só "Entrar"). */
export function contactHref(cfg: ReturnType<typeof siteConfig> = siteConfig()): string | null {
  const msg = "Olá! Quero testar o FisioNext na minha clínica.";
  if (cfg.whatsapp.length >= 12) return `https://wa.me/${cfg.whatsapp}?text=${encodeURIComponent(msg)}`;
  if (cfg.email) return `mailto:${cfg.email}?subject=${encodeURIComponent("Quero testar o FisioNext")}&body=${encodeURIComponent(msg)}`;
  return null;
}
