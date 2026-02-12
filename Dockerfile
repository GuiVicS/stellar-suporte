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

# Instala apenas dependências de produção
COPY package*.json ./
RUN npm ci --omit=dev

# Copia arquivos necessários para runtime
COPY --from=builder /app/dist ./dist
COPY server ./server

# Diretório de dados persistentes (montado via volume appdata)
RUN mkdir -p /data
VOLUME ["/data"]

EXPOSE 3000

# Backend Node servirá o frontend e a API
CMD ["node", "server/index.js"]

