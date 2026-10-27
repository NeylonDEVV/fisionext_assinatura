export default function robots() {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/login", "/dashboard", "/agenda", "/pilates", "/pacientes", "/historico", "/financeiro", "/equipe", "/assinatura", "/api/"],
    },
  };
}
