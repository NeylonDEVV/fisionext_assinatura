#!/bin/sh
set -e
[ -n "$AUTH_SECRET" ] && [ "${#AUTH_SECRET}" -ge 32 ] || { echo "ERRO: AUTH_SECRET ausente ou com menos de 32 caracteres."; exit 1; }
mkdir -p /data/backups
# Aplica o schema no banco (recusa mudanças que apagariam dados).
npx prisma db push
exec npm start
