FROM node:24-alpine AS builder

WORKDIR /usr/src/app

RUN corepack enable

COPY package.json pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm run build


FROM caddy:2-alpine

WORKDIR /srv

# Copie le build Angular
COPY --from=builder /usr/src/app/dist/kanbano/browser ./

# Copie le Caddyfile
COPY Caddyfile /etc/caddy/Caddyfile

EXPOSE 80

CMD ["caddy", "run", "--config", "/etc/caddy/Caddyfile"]
