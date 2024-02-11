FROM node:20-alpine3.18

USER root

RUN apk add -u ffmpeg

WORKDIR /usr/src/app

COPY package.json .
COPY pnpm-lock.yaml .
RUN npm i -g pnpm
RUN pnpm i
RUN pnpm dist

COPY . .

ENV NODE_ENV production

CMD ["node", "dist/index.js"]