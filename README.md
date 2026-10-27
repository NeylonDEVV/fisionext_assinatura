# FisioNext

Gestão para clínica de fisioterapia: agenda, pacientes (cadastro completo e admissão), evolução e financeiro.
Next.js 14 · Prisma 7 (SQLite + better-sqlite3) · Tailwind · Framer Motion. Requer Node 20.19+.

## Desenvolvimento
```bash
npm install
npm run db:reset    # cria o banco com dados de exemplo (apaga o que existir)
npm run dev         # http://localhost:3000   logins de exemplo (senha fisio1234): admin@, sinara@, antonio@ (fisioterapia), nutri@ (nutrição) e psi@ (psicologia), todos @fisionext.com
npm run check       # typecheck + testes (Vitest, com banco de teste)
npm run test:e2e    # testes de navegador (Playwright, veja docs/TESTES.md)
```

## Produção
Veja **docs/DEPLOY.md** (Docker + HTTPS automático + backup). Checklist de testes em **docs/TESTES.md**.

## Scripts
| Comando | O que faz |
|---|---|
| `npm run setup` / `db:reset` | desenvolvimento: gera client, cria banco e dados de exemplo (`db:reset` apaga tudo) |
| `npm run admin:create` | cria/redefine um usuário (seguro em produção) |
| `npm run backup` | backup consistente do SQLite |
| `npm test` / `npm run check` | testes / testes + typecheck |

O seed de demonstração se recusa a rodar em produção. Configuração via `.env` (veja `.env.example`).

## Erro "The table main.User does not exist"
O banco existe mas está sem tabelas. Rode `npm run db:reset` (cria as tabelas e os dados de exemplo) e reinicie o `npm run dev`.
O arquivo `dev.db` fica sempre na raiz do projeto (o caminho é resolvido a partir da pasta onde o comando roda).
Se sobrou um `prisma/dev.db` de versões anteriores, pode apagar.

## Equipe e agendas
Multi-clínica para fisioterapia, nutrição e psicologia (veja **docs/MULTICLINICA.md**). Página pública em **/** (veja docs/LANDING.md). Cada profissional (Sinara, Antonio) tem o próprio login, criado pelo administrador em **Equipe**. A **Agenda** traz as consultas e o **Pilates** tem agenda própria.

## Cobrança (Asaas)
Assinatura mensal da clínica por Pix, boleto ou cartão, na tela **Assinatura** (administrador). Configuração e testes no sandbox em **docs/ASAAS.md**.
