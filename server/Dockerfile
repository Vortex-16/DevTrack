# DevTrack Server Dockerfile (Production)
# ═══════════════════════════════════════════════════════════════════════════
# Multi-stage build for minimal image size and maximum security.
# ═══════════════════════════════════════════════════════════════════════════

# Stage 1: Dependencies
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

# Stage 2: Runner
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=9000

# Security: Run as non-root node user
USER node

# Copy dependencies & app code
COPY --chown=node:node --from=deps /app/node_modules ./node_modules
COPY --chown=node:node . .

EXPOSE 9000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:9000/api/health || exit 1

CMD ["node", "server.js"]
