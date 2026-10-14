FROM node:20-alpine AS base

WORKDIR /app
RUN npm install -g pnpm

COPY package.json ./
RUN pnpm install --frozen-lockfile

COPY tsconfig.json ./
COPY src ./src

RUN pnpm build

EXPOSE 3001

ENV NODE_ENV=production

CMD ["node", "dist/server.js"]
