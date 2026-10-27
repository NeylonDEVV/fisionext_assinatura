import { test, expect, type Page } from "@playwright/test";

const EMAIL = process.env.SEED_ADMIN_EMAIL ?? "admin@fisionext.com";
const PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "fisio1234";

function randomCpf() {
  const dv = (a: number[]) => { const s = a.reduce((t, d, i) => t + d * (a.length + 1 - i), 0); const r = (s * 10) % 11; return r === 10 ? 0 : r; };
  const n = Array.from({ length: 9 }, () => Math.floor(Math.random() * 10));
  const d1 = dv(n);
  return [...n, d1, dv([...n, d1])].join("");
}

async function login(page: Page) {
  await page.goto("/login");
  await page.getByLabel("E-mail").fill(EMAIL);
  await page.getByLabel("Senha").fill(PASSWORD);
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL(/\/dashboard/);
}

test("rotas protegidas redirecionam para o login", async ({ page }) => {
  for (const path of ["/dashboard", "/agenda", "/pacientes", "/financeiro"]) {
    await page.goto(path);
    await expect(page).toHaveURL(/\/login/);
  }
});

test("senha errada mostra erro", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("E-mail").fill(EMAIL);
  await page.getByLabel("Senha").fill("senha-errada");
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page.getByRole("alert")).toHaveText("E-mail ou senha incorretos.");
});

test("login, navegação e logout", async ({ page }) => {
  await login(page);
  await expect(page.getByText("Agenda de hoje")).toBeVisible();
  await page.getByRole("link", { name: "Financeiro" }).first().click();
  await expect(page.getByText("Saldo por origem do paciente")).toBeVisible();
  await page.getByRole("button", { name: "Sair" }).first().click();
  await expect(page).toHaveURL(/\/login/);
});

test("cadastra paciente e conclui a admissão", async ({ page }) => {
  await login(page);
  await page.goto("/pacientes/novo");
  await page.getByLabel("Nome completo").fill("Paciente E2E Teste");
  await page.getByLabel("CPF").fill(randomCpf());
  await page.getByLabel("Data de nascimento").fill("1990-01-15");
  await page.getByLabel("Telefone / WhatsApp").fill("61999990000");
  await page.getByRole("button", { name: "Cadastrar e iniciar admissão" }).click();

  await expect(page).toHaveURL(/\/admissao$/);
  await page.getByLabel("Queixa principal").fill("Dor no joelho");
  await page.getByRole("button", { name: "Continuar" }).click();
  await page.getByRole("button", { name: "Continuar" }).click();
  await page.getByLabel("Diagnóstico fisioterapêutico").fill("Condropatia patelar");
  await page.getByLabel("Objetivos do tratamento").fill("Reduzir dor e recuperar função");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Concluir admissão" }).click();

  await expect(page).toHaveURL(/\/pacientes\/[^/]+$/);
  await expect(page.getByText("Admissão pendente")).toHaveCount(0);
});

test("pilates tem agenda própria, separada das consultas", async ({ page }) => {
  await login(page);
  await page.goto("/pilates");
  await expect(page.getByRole("heading", { name: "Pilates" })).toBeVisible();
  await expect(page.getByText("Diego Souza").first()).toBeVisible();
  await page.goto("/agenda");
  await expect(page.getByRole("heading", { name: "Agenda" })).toBeVisible();
  await expect(page.getByText("Diego Souza")).toHaveCount(0);
});

test("administrador vê a equipe com a Sinara e o Antonio", async ({ page }) => {
  await login(page);
  await page.getByRole("link", { name: "Equipe" }).first().click();
  await expect(page.getByText("Sinara", { exact: true })).toBeVisible();
  await expect(page.getByText("Antonio", { exact: true })).toBeVisible();
});

test("a página inicial é pública e leva ao login; o sistema continua protegido", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("seu consultório");
  await page.getByRole("tab", { name: "Pilates" }).click();
  await expect(page.getByText("Ana R.")).toBeVisible();
  await page.getByRole("link", { name: "Entrar" }).first().click();
  await expect(page).toHaveURL(/\/login/);
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login/);
});
