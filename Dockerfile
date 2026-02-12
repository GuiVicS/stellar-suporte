FROM node:20-alpine AS builder

WORKDIR /app

# Instala dependências para build
COPY package*.json ./
RUN npm ci

# Copia código-fonte e gera build do frontend
COPY . .
RUN npm run build

# ============================
# Imagem de produção
# ============================
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

# wget necessário para healthcheck
RUN apk add --no-cache wget

# Instala apenas dependências de produção
COPY package*.json ./
RUN npm ci --omit=dev

# Copia arquivos necessários para runtime
COPY --from=builder /app/dist ./dist
COPY server ./server

# Diretório de dados persistentes (montado via volume appdata)
RUN mkdir -p /data
VOLUME ["/data"]

# Variáveis de ambiente com defaults sensatos
ENV PORT=3000
ENV INSTALL_CONFIG_PATH=/data/config.json

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:3000/api/health || exit 1

# Backend Node servirá o frontend e a API
CMD ["node", "server/index.js"]

