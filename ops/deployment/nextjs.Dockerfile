# Next.js SaaS frontend image. Build from repository root.
# docker build -f ops/deployment/nextjs.Dockerfile -t trading/nextjs-frontend:local .

FROM node:22-alpine AS builder

WORKDIR /workspace/nextjs
COPY nextjs/package.json nextjs/yarn.lock ./
COPY nextjs/prisma ./prisma
COPY nextjs/prisma.config.ts ./

RUN yarn install --frozen-lockfile

COPY nextjs ./

ARG DATABASE_URL=postgresql://build:build@127.0.0.1:5432/build
ENV DATABASE_URL=${DATABASE_URL}
ENV NEXT_TELEMETRY_DISABLED=1

RUN npx prisma generate
RUN yarn build

FROM node:22-alpine AS migrate

WORKDIR /workspace/nextjs

COPY --from=builder --chown=node:node /workspace/nextjs/package.json ./
COPY --from=builder --chown=node:node /workspace/nextjs/yarn.lock ./
COPY --from=builder --chown=node:node /workspace/nextjs/prisma.config.ts ./
COPY --from=builder --chown=node:node /workspace/nextjs/node_modules ./node_modules
COPY --from=builder --chown=node:node /workspace/nextjs/prisma ./prisma

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

USER node

CMD ["./node_modules/.bin/prisma", "migrate", "deploy"]

FROM node:22-alpine AS runtime

WORKDIR /workspace/nextjs

COPY --from=builder --chown=node:node /workspace/nextjs/public ./public
COPY --from=builder --chown=node:node /workspace/nextjs/.next/standalone ./
COPY --from=builder --chown=node:node /workspace/nextjs/.next/static ./.next/static

ENV PORT=3000
ENV HOSTNAME=0.0.0.0
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV SERVICE_MODE=managed_saas

USER node

EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --retries=5 CMD node -e "fetch('http://127.0.0.1:' + (process.env.PORT || 3000)).then(r => process.exit(r.status < 500 ? 0 : 1)).catch(() => process.exit(1))"
CMD ["node", "server.js"]
