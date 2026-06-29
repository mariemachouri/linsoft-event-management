# ─────────────────────────────────────────────────────────────
# BackOffice (Angular 12) — build statique servi par nginx (non-root, OpenShift)
# ─────────────────────────────────────────────────────────────
# Étape 1 : build de l'application (script npm "build" → ng build prod, sortie dans dist/)
FROM docker.io/library/node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
# --legacy-peer-deps : le projet a des dépendances de pairs anciennes (Angular 12)
RUN npm install --legacy-peer-deps
COPY . .
# "build" = cross-env NODE_OPTIONS=--openssl-legacy-provider CI=false ng build
RUN npm run build

# Étape 2 : service via nginx non-root (port 8080)
FROM docker.io/nginxinc/nginx-unprivileged:1.27-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 8080
