# Colocando o FisioNext no ar (VPS + Docker)

Receita para um VPS Ubuntu 22.04/24.04 com Docker. HTTPS é automático (Caddy + Let's Encrypt).

## 1. Antes de começar
- Um VPS (de preferência com servidor no Brasil) e acesso SSH.
- Um domínio apontando para o IP do VPS (registro **A**). O HTTPS só funciona depois que o DNS propagar.

## 2. Preparar o servidor
```bash
curl -fsSL https://get.docker.com | sh
sudo ufw allow OpenSSH && sudo ufw allow 80 && sudo ufw allow 443 && sudo ufw enable
```

## 3. Enviar o projeto
Envie o `fisionext.zip` (scp, SFTP) e descompacte em `/opt/fisionext`:
```bash
sudo apt-get install -y unzip
sudo mkdir -p /opt && sudo unzip fisionext.zip -d /opt && cd /opt/fisionext
```

## 4. Configurar
```bash
cp .env.production.example .env.production
nano .env.production      # preencha DOMAIN e AUTH_SECRET
```
Gere o `AUTH_SECRET` com `openssl rand -base64 32`. **Guarde esse valor**: se mudar, todos precisam entrar de novo.

## 5. Subir
```bash
docker compose up -d --build
docker compose logs -f app      # espere "Ready"; Ctrl+C para sair
curl https://SEU-DOMINIO/api/health    # deve responder {"status":"ok"}
```
O primeiro build leva alguns minutos. O banco fica no volume Docker `fisionext-data` e sobrevive a atualizações.

## 6. Criar os usuários (Sinara e Antonio)
Cada profissional tem o próprio login. Crie o primeiro como **administrador** (quem gerencia a equipe):
```bash
docker compose exec -e ADMIN_NAME='Sinara' -e ADMIN_EMAIL=sinara@clinica.com -e ADMIN_PASSWORD='uma-senha-forte-com-10+' -e ADMIN_ROLE=ADMIN -e ADMIN_REGISTRATION='11-123456-F' -e ADMIN_CLINIC='Nome da clínica' -e ADMIN_SPECIALTY=FISIOTERAPIA app npm run admin:create
```
Depois, entre no sistema e cadastre o segundo em **Equipe → Novo profissional** (nome, e-mail, registro no conselho, perfil e senha inicial).
Se preferir pelo terminal, repita o comando com `-e ADMIN_ROLE=PROFISSIONAL` e o mesmo `ADMIN_CLINIC` (o usuário entra na clínica que já existe com esse nome).
`ADMIN_SPECIALTY` aceita FISIOTERAPIA, NUTRICAO ou PSICOLOGIA. Clínicas criadas por aqui já nascem com acesso liberado.

Clínicas novas podem se cadastrar sozinhas em **/cadastro**, com teste grátis, mas só depois que você ligar `SIGNUP_ENABLED=true` (veja docs/MULTICLINICA.md).

- **Administrador:** gerencia a equipe (cadastrar, redefinir senha, desativar). **Profissional:** usa agenda, pacientes e financeiro.
- Rodar o comando de novo com o mesmo e-mail **redefine a senha** (e o perfil). Se ficar sem acesso de administrador, é assim que se recupera.
- Quem for desativado perde o acesso imediatamente; o histórico (evoluções, admissões, sessões) continua no nome dele.
- O banco de produção começa vazio (os dados de exemplo só existem em desenvolvimento).

## 6b. Cobrança (opcional)
Para cobrar a assinatura pela Asaas, preencha `ASAAS_*` no `.env.production` e configure o webhook: veja **docs/ASAAS.md**.

## 7. Backup diário
```bash
crontab -e
0 2 * * * cd /opt/fisionext && docker compose exec -T app node scripts/backup.mjs >> /var/log/fisionext-backup.log 2>&1
```
Mantém os 14 últimos em `/data/backups` (dentro do volume). **Isso não protege contra perda do servidor**: copie os backups para fora, por exemplo:
```bash
docker compose cp app:/data/backups ./backups   # depois envie ./backups para outro lugar (rclone, scp, drive)
```

### Restaurar um backup
```bash
docker compose stop app
docker compose run --rm --no-deps --entrypoint sh app -c "ls /data/backups"
docker compose run --rm --no-deps --entrypoint sh app -c "cp /data/backups/ARQUIVO.db /data/fisionext.db"
docker compose up -d
```
**Teste a restauração uma vez antes de depender dela.**

## 8. Atualizar para uma versão nova
Envie os arquivos novos por cima (mantenha `.env.production`) e rode:
```bash
docker compose up -d --build
```
Antes, faça um backup manual: `docker compose exec -T app node scripts/backup.mjs`.
Se a nova versão alterar tabelas de um jeito que apagaria dados, o container recusa subir (e os dados ficam intactos) até alguém avaliar a mudança.

## 9. Testar em casa antes
Com `DOMAIN=localhost` no `.env.production`, `docker compose up -d --build` sobe em `https://localhost` (o navegador avisa do certificado local).

## Problemas comuns
| Sintoma | Causa provável |
|---|---|
| Container reinicia sem parar | veja `docker compose logs app`; geralmente `AUTH_SECRET` ausente ou < 32 caracteres |
| Site sem HTTPS | DNS ainda não aponta para o servidor, ou portas 80/443 bloqueadas |
| "Muitas tentativas" no login | bloqueio de 15 min após 5 erros; reinicie com `docker compose restart app` se precisar liberar |
