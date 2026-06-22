# Next.js SaaS frontend image. Build from repository root.
# docker build -f ops/deployment/nextjs.Dockerfile -t trading/nextjs-frontend:local .

FROM node:18-alpine AS builder

WORKDIR /workspace/nextjs
COPY nextjs/package.json nextjs/yarn.lock ./
COPY nextjs/prisma ./prisma

RUN yarn install --frozen-lockfile

COPY nextjs ./

# Generate Prisma client and build Next.js
RUN npx prisma generate
RUN yarn build

FROM node:18-alpine AS runtime

WORKDIR /workspace/nextjs

COPY --from=builder --chown=node:node /workspace/nextjs/package.json ./
COPY --from=builder --chown=node:node /workspace/nextjs/yarn.lock ./
COPY --from=builder --chown=node:node /workspace/nextjs/next.config.mjs ./
COPY --from=builder --chown=node:node /workspace/nextjs/public ./public
COPY --from=builder --chown=node:node /workspace/nextjs/.next ./.next
COPY --from=builder --chown=node:node /workspace/nextjs/node_modules ./node_modules
COPY --from=builder --chown=node:node /workspace/nextjs/prisma ./prisma

ENV PORT=3000
ENV NODE_ENV=production
ENV SERVICE_MODE=managed_saas

USER node

EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --retries=5 CMD node -e "fetch('http://127.0.0.1:' + (process.env.PORT || 3000)).then(r => process.exit(r.status < 500 ? 0 : 1)).catch(() => process.exit(1))"
CMD ["yarn", "start"]
