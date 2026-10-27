# Página pública (landing)

Fica em `/` (arquivo `src/app/page.tsx`) e é visível sem login. Quem já está logado é levado direto ao dashboard.

## Configurar o contato (obrigatório antes de divulgar)
No `.env` (ou `.env.production` no servidor), sem refazer o build:
```
SITE_WHATSAPP=5561999999999     # DDI + DDD + número, só dígitos
SITE_EMAIL=contato@seudominio.com.br
SITE_SHOW_PRICING=false
SIGNUP_ENABLED=false   # "true" troca o botão por 'Começar teste grátis' e abre /cadastro
TRIAL_DAYS=14
```
- Com WhatsApp, o botão "Quero testar gratuitamente" abre a conversa com a mensagem pronta. Sem WhatsApp, usa o e-mail.
- **Sem nenhum dos dois**, a página mostra só "Entrar no sistema" (não há para onde enviar interessados).
- `SITE_SHOW_PRICING=true` mostra a seção **Planos** com os valores de `src/lib/plans.ts`. Eles ainda são exemplos: só ligue depois de definir os preços reais.

## Antes de publicar, revise o texto
- A seção "Dados de saúde pedem cuidado" lista **cópias de segurança diárias** e **HTTPS**: só mantenha se você configurou o backup e o domínio com HTTPS (docs/DEPLOY.md).
- Não há depoimentos nem números de clientes de propósito. Só inclua quando existirem de verdade.
- O texto fala em "teste gratuito" sem prazo. Quando o cadastro automático existir, diga o prazo.
- Falta publicar **Termos de uso** e **Política de privacidade** (peça a um advogado) antes de abrir cadastro automático ou coletar dados de interessados.

## Visual
Títulos em Bricolage Grotesque (carregada pelo Next, sem arquivos extras), texto na Plus Jakarta Sans do sistema. A demonstração da abertura
(`src/components/landing/agenda-demo.tsx`) usa nomes fictícios: troque os dados no próprio arquivo, se quiser.

## Indexação
A landing pode aparecer em buscas; o sistema (login, dashboard etc.) não (`src/app/robots.ts`).
