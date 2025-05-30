# === Build Stage ===
FROM node:lts-alpine3.20 AS builder

# Abhängigkeiten für native Module
RUN apk add --no-cache libc6-compat

# Arbeitsverzeichnis setzen
WORKDIR /app

# Abhängigkeiten installieren
COPY package*.json ./
RUN npm install --omit=dev

# Restliche Projektdateien kopieren
COPY . .

# App für Produktion bauen
RUN npm run build

# === Production Stage ===
FROM node:lts-alpine3.20 AS runner

# Minimale Abhängigkeiten
RUN apk add --no-cache libc6-compat

# Arbeitsverzeichnis
WORKDIR /app

# Nur das Nötigste kopieren
COPY --from=builder /app/.output/ ./

# Prisma & SQLlite
COPY .env ./server/

# Port (je nach Nuxt-Version: Nuxt 3 nutzt standardmäßig 3000)
EXPOSE 3000

# Startbefehl
CMD ["node", "server/index.mjs"]
