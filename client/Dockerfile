# DevTrack Client Dockerfile (Production Build + Nginx)
# ═══════════════════════════════════════════════════════════════════════════
# Stage 1: Build Vite React application
# Stage 2: Serve static assets via lightweight Nginx Alpine
# ═══════════════════════════════════════════════════════════════════════════

# Stage 1: Build
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Nginx Serve
FROM nginx:alpine AS runner
COPY --from=build /app/dist /usr/share/nginx/html

# Nginx config for React single-page app fallback routing
RUN echo $'server {\n\
    listen 80;\n\
    location / {\n\
        root /usr/share/nginx/html;\n\
        index index.html index.htm;\n\
        try_files $uri $uri/ /index.html;\n\
    }\n\
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
