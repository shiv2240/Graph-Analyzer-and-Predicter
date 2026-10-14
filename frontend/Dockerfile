FROM node:20-alpine AS base

WORKDIR /app
RUN npm install -g pnpm

COPY package.json ./
RUN pnpm install

COPY tsconfig.json vite.config.ts tailwind.config.ts postcss.config.js index.html ./
COPY src ./src

EXPOSE 5173

CMD ["pnpm", "dev", "--host"]
