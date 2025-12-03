FROM node:20-alpine AS deps
WORKDIR /app
RUN npm install -g pnpm
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile

FROM node:20-alpine AS builder
WORKDIR /app
RUN npm install -g pnpm
ARG DATABASE_URL
ARG DIRECT_DATABASE_URL
ARG NODE_ENV=production
ARG NEXT_TELEMETRY_DISABLED=1

ENV DATABASE_URL=$DATABASE_URL
ENV DIRECT_DATABASE_URL=$DIRECT_DATABASE_URL
ENV NODE_ENV=$NODE_ENV
ENV NEXT_TELEMETRY_DISABLED=$NEXT_TELEMETRY_DISABLED
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs
RUN npm install -g pnpm
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
USER nextjs
EXPOSE 3000
CMD ["pnpm","start"]
