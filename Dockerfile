# Pinned to alpine3.20 (musl 1.2.5) so @discordjs/opus installs its prebuilt
# arm64 binary — newer alpine ships musl 1.2.6, for which no prebuild is
# published, forcing a from-source compile. libstdc++ is the only runtime lib
# the prebuilt native addon needs; ffmpeg handles audio.
FROM node:22-alpine3.20

WORKDIR /usr/src/app

RUN apk add --no-cache ca-certificates ffmpeg libstdc++

# Pin pnpm via corepack using the integrity-hashed "packageManager" field.
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable

# Install from the frozen lockfile for reproducible, supply-chain-safe builds.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm build

ENV NODE_ENV=production

CMD ["node", "dist/index.js"]
