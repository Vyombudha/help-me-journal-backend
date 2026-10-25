FROM oven/bun:1

WORKDIR /app

# OpenSSL for Prisma
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Install dependencies first (faster rebuilds)
COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile

COPY . .
RUN bunx prisma generate

ENV PORT=8080
EXPOSE 8080

CMD ["bun","run" , "./src/server.ts"]
