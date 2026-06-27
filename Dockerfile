FROM node:22-alpine

USER root

# System dependencies: ffmpeg for audio, build toolchain to compile native
# modules (e.g. @discordjs/opus) from source on musl/Alpine.
RUN apk add --update && \
    apk add --no-cache ca-certificates git curl build-base python3 g++ make ffmpeg

WORKDIR /usr/src/app

# Pin pnpm via corepack using the integrity-hashed "packageManager" field.
# COREPACK_ENABLE_DOWNLOAD_PROMPT=0 keeps the download non-interactive in CI.
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable

# Install from the frozen lockfile for reproducible, supply-chain-safe builds.
# allowBuilds in pnpm-workspace.yaml whitelists which packages may run scripts.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm build

ENV NODE_ENV production

CMD ["node", "dist/index.js"]
