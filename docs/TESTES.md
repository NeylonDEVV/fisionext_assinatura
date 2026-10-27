# Testes

Há três camadas. Todas usam o banco **de teste** (`test.db`), nunca o banco real.

## 1. Testes automáticos (Vitest) — `npm test`
```bash
npm install
npm run check      # typecheck + testes
npm test           # só os testes
```
Antes de rodar, a suíte recria o `test.db` a partir do schema (`tests/global-setup.ts`). Cobre:
- **Regras puras:** CPF e máscaras, formas de pagamento (sem boleto, crédito x débito), validação do cadastro,
  cálculo de saldos (por origem e por operadora), recebido por forma de pagamento, atraso e a vencer,
  sessão JWT, segredo fraco em produção e limite de tentativas de login.
- **Multi-clínica:** isolamento entre clínicas (leitura, alteração, exclusão, criação com `clinicId` forçado, agregações e as ações com ids de outra clínica),
  mesmo CPF em clínicas diferentes, e-mail único na plataforma, cadastro em etapas com teste grátis e acesso após o teste.
- **Áreas (fisioterapia, nutrição, psicologia):** consistência da configuração de cada área, tipos de atendimento, métrica (dor, peso, bem-estar),
  avaliação inicial por área, IMC, registros restritos na psicologia, gráfico de evolução, histórico de atendimentos e exportação em CSV.
- **Cobrança (Asaas):** regras de status da assinatura (eventos fora de ordem e repetidos), cliente da API (endereços, cabeçalhos,
  chave de sandbox x produção, erros), webhook (token, idempotência, cobrança de outro cliente) e as ações assinar, atualizar e cancelar
  (com a Asaas simulada; nenhum teste chama a Asaas de verdade).
- **Agendas e equipe:** pilates separado das consultas, profissional da sessão, cadastro/desativação/redefinição de senha
  de usuários (sempre sobra um administrador ativo), usuário desativado não entra, autoria de evoluções e admissões.
- **Ações com banco real:** login e logout (inclusive o bloqueio após 5 erros), cadastro de paciente (CPF inválido e
  duplicado, plano de saúde exige operadora), admissão (consentimento, evolução inicial criada uma única vez,
  dor limitada a 0–10), agendamento com cobrança e baixa de pagamento (aceita PIX, dinheiro, crédito e débito; recusa boleto).

## 2. Testes de navegador (Playwright) — `npm run test:e2e`
Percorrem o sistema de verdade: rotas protegidas, login com senha errada, login/logout, cadastro e fluxo principal.
```bash
npx playwright install chromium   # só na primeira vez
npm run db:reset                  # cria o admin e os dados de exemplo
npm run test:e2e
```
Usam `admin@fisionext.com / fisio1234` (ou `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`).

## 3. Checklist manual (antes de entregar)
Rode `npm run db:reset && npm run dev` e confira o que os testes não veem (aparência e uso real):

- [ ] **Agenda** mostra só consultas e **Pilates** só aulas de pilates (e a aula em turma agrupa os alunos do mesmo horário)
- [ ] Filtro por profissional (Sinara / Antonio) funciona nas duas agendas
- [ ] **Equipe** (só administrador): cadastrar profissional, redefinir senha, desativar e reativar; o profissional comum não vê o menu
- [ ] Sinara e Antonio entram cada um com o próprio e-mail e o nome aparece nas evoluções e admissões que registrarem
- [ ] **Assinatura** (sandbox da Asaas, veja docs/ASAAS.md): assinar, ver a fatura, pagar no sandbox e o status virar 'Em dia'; cancelar
- [ ] **Isolamento:** crie duas contas em /cadastro (ou use as de demonstração), cadastre um paciente em uma e confirme que a outra não o vê, nem pela URL
- [ ] **Cada área:** entre em `nutri@fisionext.com` (nutrição) e `psi@fisionext.com` (psicologia) e confira o formulário de avaliação, os tipos de consulta, a métrica e os termos
- [ ] **Psicologia:** o registro escrito por um profissional não aparece para o outro; só os dados da sessão (data, tipo, situação)
- [ ] **Histórico:** filtros por período, profissional e paciente, paginação e exportar CSV (abre no Excel)
- [ ] **Teste grátis:** conta nova mostra o aviso de dias restantes; com o prazo vencido, só a tela Assinatura abre
- [ ] Telas boas no celular e no computador; sidebar e animações fluidas
- [ ] Formulário de admissão: "Continuar" bloqueia se faltar a queixa principal; consentimento obrigatório ao concluir
- [ ] Origem "Plano de saúde" mostra operadora e carteirinha; as outras origens escondem esses campos
- [ ] Financeiro: "Dar baixa" move o valor de "A receber" para "Recebido" na origem correta
- [ ] `/api/health` responde `{"status":"ok"}` sem login

**Produção (no servidor)**
- [ ] HTTPS ativo e http redirecionando para https
- [ ] `docker compose exec -T app node scripts/backup.mjs` gera arquivo em `/data/backups`
- [ ] Restauração de um backup testada
- [ ] Senha do admin e `AUTH_SECRET` definidos por você (não os de exemplo)
