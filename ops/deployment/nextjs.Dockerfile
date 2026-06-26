# Next.js SaaS frontend image. Build from repository root.
# docker build -f ops/deployment/nextjs.Dockerfile -t trading/nextjs-frontend:local .

# --- Stage 1: Base & Dependencies ---
FROM node:22-alpine AS deps

RUN apk add --no-cache libc6-compat
WORKDIR /workspace/nextjs

COPY nextjs/package.json nextjs/yarn.lock ./
COPY nextjs/prisma ./prisma
COPY nextjs/prisma.config.ts ./

# Install dependencies and clean yarn cache to save space in the layer
RUN yarn install --frozen-lockfile && yarn cache clean

# --- Stage 2: Development Stage ---
# Used for development/hot-reloading via Docker Compose.
FROM node:22-alpine AS development

WORKDIR /workspace/nextjs
COPY --from=deps /workspace/nextjs/node_modules ./node_modules
COPY nextjs ./

ARG DATABASE_URL=postgresql://build:build@127.0.0.1:5432/build
ENV DATABASE_URL=${DATABASE_URL}
ENV NODE_ENV=development
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
ENV NEXT_TELEMETRY_DISABLED=1

RUN npx prisma generate

EXPOSE 3000
CMD ["yarn", "dev"]
