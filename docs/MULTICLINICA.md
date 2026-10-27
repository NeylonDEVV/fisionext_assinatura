# Multi-clínica e áreas de atuação

O FisioNext atende várias clínicas na mesma instalação, cada uma de uma área: **fisioterapia, nutrição ou psicologia**.

## Como o isolamento funciona
- `Clinic` é a clínica (o "tenant"). Usuários, pacientes, sessões, evoluções, avaliações e pagamentos dos pacientes carregam um `clinicId`.
- O app nunca fala com o banco "solto": `requireTenant()` (src/lib/tenant.ts) identifica o usuário, a clínica e a especialidade e entrega um
  cliente do banco (`db`) **já filtrado pela clínica**. Toda leitura, alteração e exclusão recebe o `clinicId` no filtro, e toda criação grava o `clinicId`,
  mesmo que alguém tente forçar outro (src/lib/scope.ts).
- As ações também conferem que o paciente e o profissional informados pertencem à clínica antes de gravar.
- Usam o banco sem filtro, de propósito: login (o e-mail é único na plataforma), cadastro, webhook da Asaas e a tela de assinatura.
- Testes: `tests/isolation.test.ts` cria duas clínicas e tenta ler e alterar os dados de uma pela outra.
- Regra para o futuro: **código novo usa `db` de `requireTenant()`, nunca `prisma` direto**, exceto nos casos acima.

## Acesso, teste grátis e assinatura
- Cadastro em **/cadastro** (3 etapas: área, conta e consultório; aceite dos termos): cria a clínica, o administrador e o teste grátis (`TRIAL_DAYS`, padrão 14) e já entra.
- O cadastro só abre com `SIGNUP_ENABLED=true`. **Não ligue antes de ter Termos de uso e Política de privacidade revisados** (as páginas /termos e /privacidade são provisórias).
- Acesso liberado: assinatura ativa, aguardando o 1º pagamento ou vencida (tolerância, com aviso); teste dentro do prazo; cancelada até o fim do período pago.
- Teste vencido sem assinatura: só a tela **Assinatura** abre. Os dados ficam guardados.

## Áreas de atuação (src/lib/specialties.ts)
Uma configuração por área define: vocabulário (sessão/consulta, admissão/avaliação nutricional/avaliação inicial), tipos de atendimento,
formulário da avaliação inicial (etapas, campos e quais são obrigatórios), métrica de evolução (dor, peso, bem-estar), conselho profissional
(CREFITO, CRN, CRP) e se os registros são restritos. As telas e ações só leem essa configuração.

| | Fisioterapia | Nutrição | Psicologia |
|---|---|---|---|
| Atendimentos | 8 tipos + agenda de Pilates | primeira consulta, retorno, acompanhamento, avaliação corporal | individual, casal, família, avaliação, orientação de pais |
| Avaliação inicial | anamnese, avaliação física, diagnóstico e plano | anamnese, avaliação alimentar e corporal (com IMC), diagnóstico e plano | acolhimento, avaliação inicial (com triagem de risco), hipótese e plano |
| Evolução | dor de 0 a 10 | peso em kg | bem-estar de 0 a 10 (opcional) |
| Registros | visíveis à clínica | visíveis à clínica | **só o autor lê o conteúdo** |

**Para criar uma área nova**, copie uma das três em `specialties.ts`, ajuste e registre em `SPECIALTIES`. Os tipos de atendimento não podem repetir chaves entre áreas.

## Histórico de atendimentos
Tela **Histórico** (e exportação em CSV): atendimentos por período, profissional, paciente e situação, com totais (realizados, faltas, cancelamentos, pacientes atendidos).
Cada profissional vê o próprio histórico; o administrador pode ver todos. Na psicologia, só o administrador vê os de outros profissionais.
No perfil do paciente há o histórico de consultas dele.

## Decisões que precisam da sua validação
1. **Registros restritos na psicologia** (só o autor lê o conteúdo): é uma decisão de privacidade minha. Confirme com um psicólogo e com as normas do CFP.
2. **Origem "Parceria":** o nome é genérico. A clínica-piloto chamava de "Amor Saúde"; se quiser, dá para tornar o nome configurável por clínica.
3. **Tolerância de fatura vencida:** hoje o acesso continua liberado com aviso. Defina o prazo e o que bloquear.
4. **Limite de profissionais por plano** (Individual 1, Clínica até 3): ainda não é aplicado.

## O que ainda não existe (importante antes de vender em escala)
- **Banco de dados:** continua SQLite (um arquivo, um servidor). Serve para começar com poucas clínicas. Antes de crescer, migrar para **Postgres** (com cópias contínuas e, como camada extra de segurança, *row-level security*).
- **Confirmação de e-mail e recuperação de senha:** o cadastro não confirma o e-mail e quem esquece a senha depende do administrador. Precisa de um serviço de e-mail.
- **Painel seu (dono da plataforma):** ver clínicas, status e uso. Hoje só pelo banco.
- **Exportação e exclusão de dados por clínica** (LGPD) e **contrato de tratamento de dados**.
- **Cobrança:** o plano da clínica ainda não limita nada, e a fatura vencida só avisa.
- Nada disso foi testado de ponta a ponta com várias clínicas reais: rode `npm run check`, `npm run test:e2e` e o checklist em docs/TESTES.md.
