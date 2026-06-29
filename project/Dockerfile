# ── Stage 1: build ───────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Build-time public env var so $env/static/public also works
ARG PUBLIC_POCKETBASE_URL=http://68.183.79.68:8080
ENV PUBLIC_POCKETBASE_URL=${PUBLIC_POCKETBASE_URL}

RUN npm run build

# ── Stage 2: production image ────────────────────────────────────
FROM node:22-alpine

WORKDIR /app

COPY --from=builder /app/build ./build
COPY --from=builder /app/package*.json ./
RUN npm ci --omit=dev

EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

CMD ["node", "build/index.js"]
