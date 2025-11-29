FROM node:20-alpine

WORKDIR /app

COPY package.json pnpm-lock.yaml ./

RUN npm install -g pnpm && pnpm install --frozen-lockfile

COPY . .

ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_PUSHER_KEY
ARG NEXT_PUBLIC_PUSHER_CLUSTER

RUN pnpm run build

EXPOSE 8080

CMD ["pnpm", "run", "start"]
