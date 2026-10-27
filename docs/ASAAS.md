# Cobrança da assinatura com a Asaas

O FisioNext cobra a mensalidade de cada clínica pela Asaas: **Pix, boleto ou cartão, na fatura**. O sistema cria o cliente e a
assinatura mensal na Asaas, recebe os avisos de pagamento (webhook) e mostra o status na tela **Assinatura** (só administrador).
O sistema **não guarda dados de cartão**: o pagamento acontece na página da Asaas.

## 1. Criar a conta e a chave (comece pelo sandbox)
1. Crie uma conta de testes em **sandbox.asaas.com** (dinheiro de mentira).
2. No painel: **Integrações → Chaves de API → Gerar chave**. A chave aparece **uma única vez**: copie na hora.
3. A chave começa com `$aact_hmlg_` (sandbox) ou `$aact_prod_` (produção). Sandbox e produção têm chaves e endereços diferentes.

## 2. Configurar o `.env`
```
ASAAS_ENV="sandbox"
ASAAS_API_KEY="aact_hmlg_XXXXXXXX"     # cole SEM o "$" inicial; o sistema acrescenta
ASAAS_WEBHOOK_TOKEN="..."              # 32+ caracteres aleatórios, diferente da chave da API
```
Gerar o token: `node -e "console.log(require('crypto').randomBytes(24).toString('hex'))"`.
Sem o `$` porque o `.env` trata `$` como variável e cortaria a chave. Se o sistema avisar que a chave de produção está em
ambiente sandbox (ou o contrário), é proteção: ajuste `ASAAS_ENV`.

## 3. Configurar o webhook na Asaas
No painel: **Menu do usuário → Integrações → Webhooks → Novo webhook**.
- **URL:** `https://SEU-DOMINIO/api/webhooks/asaas`
  (para testar do seu computador, use o endereço do túnel Cloudflare: `https://....trycloudflare.com/api/webhooks/asaas`)
- **Token de autenticação:** o mesmo valor de `ASAAS_WEBHOOK_TOKEN`.
- **Eventos:** `PAYMENT_CREATED`, `PAYMENT_UPDATED`, `PAYMENT_CONFIRMED`, `PAYMENT_RECEIVED`, `PAYMENT_OVERDUE`,
  `PAYMENT_DELETED`, `PAYMENT_REFUNDED`, `SUBSCRIPTION_DELETED`, `SUBSCRIPTION_INACTIVATED`.
  Se algum nome não aparecer na lista do painel, sem problema: o botão **Atualizar** da tela Assinatura busca tudo direto na Asaas.

A Asaas entrega os avisos "pelo menos uma vez" (pode repetir ou chegar fora de ordem). O sistema já lida com isso:
registra cada evento, ignora repetidos e recalcula o status a partir das cobranças. Se o seu servidor ficar fora do ar, a Asaas
reenvia; eventos não entregues por cerca de 14 dias se perdem, e o botão **Atualizar** recupera.
Você pode ver cada entrega em **Integrações → Logs de Webhooks**.

## 4. Testar no sandbox
1. Entre como administrador → **Assinatura** → escolha o plano e a forma de pagamento → **Assinar**.
2. A fatura aparece na lista (**Abrir fatura**). No sandbox, marque a cobrança como paga pelo painel da Asaas (ou pague a fatura de teste).
3. Em alguns segundos o status vira **Em dia** e aparece "Pago até ...". Se não virar, clique em **Atualizar** e veja os Logs de Webhooks.
4. Teste também: fatura vencida (status **Pagamento vencido** e aviso vermelho no topo) e **Cancelar assinatura**.

## 5. Ir para produção
1. Tenha a conta de produção aprovada pela Asaas.
2. Gere a chave de produção (`$aact_prod_...`) e crie o webhook de produção (mesma URL e token; o webhook do sandbox não vale em produção).
3. No `.env.production`: `ASAAS_ENV=production`, `ASAAS_API_KEY=<chave de produção sem o $>`, `ASAAS_WEBHOOK_TOKEN=<token>`.
4. `docker compose up -d --build`. Faça uma assinatura de teste com um valor real baixo antes de divulgar.

## Preços e taxas
Os planos e valores em `src/lib/plans.ts` são **exemplos**: defina os reais depois da validação com os fisioterapeutas.
As taxas da Asaas mudam: consulte **asaas.com/precos-e-taxas** e inclua no cálculo da margem. O Pix costuma ser a forma mais barata para você.

## Segurança
- A chave da API fica só no servidor (`.env.production`), nunca no código nem no git. Se vazar, gere outra e revogue a antiga no painel.
- O webhook só aceita chamadas com o token correto e responde 503 se o token não estiver configurado.
- Defesa extra opcional: liberar no firewall apenas os IPs da Asaas para a rota do webhook (lista na documentação deles).

## O que ainda não existe (próximos passos)
- **Renovação automática no cartão:** hoje cada mês gera uma fatura (Pix, boleto ou cartão, paga na página da Asaas). A cobrança
  recorrente automática no cartão exige tokenização ou link de pagamento recorrente; dá para adicionar depois.
- **Bloqueio por inadimplência:** hoje há só o aviso para o administrador. Bloquear ou limitar o acesso é decisão de produto
  (prazo de tolerância, o que bloquear).
- **Teste gratuito (trial) e troca de plano.**
- **Nota fiscal do serviço (NFS-e)**, a combinar com o contador.
- **Multi-clínica:** hoje há uma única clínica (`Clinic`). Quando o sistema atender várias, cada uma terá a sua assinatura.
