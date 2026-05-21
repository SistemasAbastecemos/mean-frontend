# Etapa 1: build Angular
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json ./
RUN npm install
COPY . .
RUN npm run build

# Etapa 2: servir con Nginx
FROM nginx:1.25-alpine
COPY --from=builder /app/dist/mean-frontend/browser /usr/share/nginx/html

RUN printf '#!/bin/sh\nsed -i "s/RAILWAY_PORT/${PORT:-80}/g" /etc/nginx/conf.d/default.conf\nnginx -g "daemon off;"\n' > /start.sh && chmod +x /start.sh

RUN printf 'server {\n  listen RAILWAY_PORT;\n  root /usr/share/nginx/html;\n  index index.html;\n  location / {\n    try_files $uri $uri/ /index.html;\n  }\n}\n' > /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["/start.sh"]
