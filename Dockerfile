FROM node:22-alpine

USER root

# Install system dependencies exactly like @discordjs/opus CI
RUN apk add --update && \
    apk add --no-cache ca-certificates git curl build-base python3 g++ make ffmpeg

WORKDIR /usr/src/app

COPY package.json .

# Use npm install --build-from-source to compile native modules (like @discordjs/opus CI)
RUN npm install --build-from-source

COPY . .

# Install pnpm and build the project
RUN npm i -g pnpm
RUN pnpm build

ENV NODE_ENV production

CMD ["node", "dist/index.js"]