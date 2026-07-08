# Next.js SaaS frontend production image. Build from repository root.
# docker build -f ops/deployment/nextjs.Dockerfile -t trading/nextjs-frontend:local .

# --- Stage 1: Dependencies ---
FROM node:22-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /workspace/nextjs

COPY nextjs/package.json nextjs/yarn.lock ./
COPY nextjs/prisma ./prisma
COPY nextjs/prisma.config.ts ./

RUN yarn install --frozen-lockfile && yarn cache clean

# --- Stage 2: Builder ---
FROM node:22-alpine AS builder
WORKDIR /workspace/nextjs

COPY --from=deps /workspace/nextjs/node_modules ./node_modules
COPY nextjs ./

ARG DATABASE_URL=postgresql://build:build@127.0.0.1:5432/build
ENV DATABASE_URL=${DATABASE_URL}
ENV NEXT_TELEMETRY_DISABLED=1

RUN npx prisma generate
RUN yarn build

# --- Stage 3: Runner ---
FROM node:22-alpine AS runner
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
