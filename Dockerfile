FROM node:24-alpine

WORKDIR /app

RUN npm install --global pnpm@12.6.0

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm prisma:generate

EXPOSE 3333

CMD ["pnpm", "dev"]
