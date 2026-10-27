FROM node:22-bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ ca-certificates \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app

COPY package*.json prisma.config.ts ./
COPY prisma ./prisma
RUN DATABASE_URL="file:/tmp/build.db" npm ci

COPY . .
RUN DATABASE_URL="file:/tmp/build.db" npx prisma generate \
    && DATABASE_URL="file:/tmp/build.db" npm run build

ENV NODE_ENV=production PORT=3000 HOSTNAME=0.0.0.0
EXPOSE 3000
RUN chmod +x docker-entrypoint.sh
ENTRYPOINT ["./docker-entrypoint.sh"]
