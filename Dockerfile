FROM oven/bun:1.3.10-slim AS deps

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --production

FROM oven/bun:1.3.10-slim AS production

RUN groupadd -r mocksmith && useradd -r -g mocksmith mocksmith
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN mkdir -p /app/database && chown -R mocksmith:mocksmith /app

USER mocksmith

EXPOSE 6543

CMD ["bun", "src/index.ts"]
