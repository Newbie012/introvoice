FROM node:20-alpine3.18

USER root

RUN apk add -u ffmpeg python3 build-base

WORKDIR /usr/src/app

COPY package.json .
COPY pnpm-lock.yaml .
RUN npm i -g pnpm
RUN pnpm i

COPY . .

RUN pnpm build

ENV NODE_ENV production

CMD ["node", "dist/index.js"]