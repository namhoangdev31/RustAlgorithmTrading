# Next.js SaaS frontend & worker production image. Build from repository root.
# docker build -f ops/deployment/nextjs.Dockerfile --target runner -t trading/nextjs-frontend:local .
# docker build -f ops/deployment/nextjs.Dockerfile --target worker -t trading/lepoship-worker:local .

# --- Stage 1: Dependencies ---
FROM node:22-bookworm-slim AS deps
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /workspace/nextjs

COPY nextjs/package.json nextjs/yarn.lock ./
COPY nextjs/prisma ./prisma
COPY nextjs/prisma.config.ts ./

RUN yarn install --frozen-lockfile && yarn cache clean

# --- Stage 2: Builder ---
FROM node:22-bookworm-slim AS builder
WORKDIR /workspace/nextjs

COPY --from=deps /workspace/nextjs/node_modules ./node_modules
COPY nextjs ./

ARG DATABASE_URL=postgresql://build:build@127.0.0.1:5432/build
ENV DATABASE_URL=${DATABASE_URL}
ENV NEXT_TELEMETRY_DISABLED=1

RUN npx prisma generate
RUN yarn build

# --- Stage 3: Runner (Frontend) ---
FROM node:22-bookworm-slim AS runner
WORKDIR /workspace/nextjs

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=builder /workspace/nextjs/package.json ./package.json
COPY --from=builder /workspace/nextjs/yarn.lock ./yarn.lock
COPY --from=builder /workspace/nextjs/node_modules ./node_modules
COPY --from=builder /workspace/nextjs/.next ./.next
COPY --from=builder /workspace/nextjs/public ./public
COPY --from=builder /workspace/nextjs/prisma ./prisma
COPY --from=builder /workspace/nextjs/prisma.config.ts ./prisma.config.ts

EXPOSE 3000
CMD ["yarn", "start"]

# --- Stage 4: Worker (LepoShip) ---
FROM node:22-bookworm-slim AS worker
WORKDIR /workspace/nextjs

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Install scanner runtime dependencies
RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates clamav git unzip zip \
  && rm -rf /var/lib/apt/lists/*

# Copy security tool binaries from official images
COPY --from=aquasec/trivy:0.60.0 /usr/local/bin/trivy /usr/local/bin/trivy
COPY --from=anchore/syft:v1.20.0 /syft /usr/local/bin/syft
COPY --from=gitleaks/gitleaks:v8.24.2 /usr/bin/gitleaks /usr/local/bin/gitleaks

# Copy full built workspace context
COPY --from=builder /workspace/nextjs /workspace/nextjs

CMD ["yarn", "lepoship:worker"]

