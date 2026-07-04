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

# Some hosts (e.g. Oracle Cloud) have no working IPv6 egress. Node's Happy-Eyeballs
# otherwise attempts IPv6 first and hangs, causing node-gyp to time out (ETIMEDOUT)
# fetching Node headers to compile @discordjs/opus (no arm64-musl prebuild exists).
# Forcing IPv4-first resolution makes the native build reliable.
ENV NODE_OPTIONS=--dns-result-order=ipv4first

# @discordjs/opus vendors libopus, whose ARM/NEON path (celt_neon_intr.c) has an
# implicit function declaration that GCC 14+ (Alpine) treats as a hard error. The
# symbol is defined elsewhere in libopus, so downgrading it to a warning compiles
# and links cleanly. Only affects the aarch64 native build.
ENV CFLAGS="-Wno-error=implicit-function-declaration"
ENV CXXFLAGS="-Wno-error=implicit-function-declaration"

# Install from the frozen lockfile for reproducible, supply-chain-safe builds.
# allowBuilds in pnpm-workspace.yaml whitelists which packages may run scripts.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm build

ENV NODE_ENV production

CMD ["node", "dist/index.js"]
