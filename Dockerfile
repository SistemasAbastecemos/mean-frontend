# ── Frontend Dockerfile (multi-stage) ───────────────────────
# Etapa 1: build Angular
FROM node:20-alpine AS builder

WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

COPY . .
RUN npm run build

# Etapa 2: servir con Nginx
FROM nginx:1.25-alpine

# Copiar build de Angular
COPY --from=builder /app/dist/mean-frontend/browser /usr/share/nginx/html

# Config Nginx: redirigir todo a index.html (Angular routing)
RUN printf 'server {\n\
  listen 80;\n\
  root /usr/share/nginx/html;\n\
  index index.html;\n\
  location / {\n\
    try_files $uri $uri/ /index.html;\n\
  }\n\
}\n' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
