# ─────────────────────────────────────────────────────────────
# FrontOffice (React / Vite) — build statique servi par nginx (non-root, OpenShift)
# ─────────────────────────────────────────────────────────────
# Étape 1 : build de l'application
FROM docker.io/library/node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# Vite lit .env.production (VITE_BACKOFFICE_URL) pendant ce build
RUN npm run build

# Étape 2 : service via nginx non-root (écoute sur 8080 — compatible SCC restricted)
FROM docker.io/nginxinc/nginx-unprivileged:1.27-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 8080
