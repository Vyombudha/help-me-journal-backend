FROM node:22-slim

# Prisma needs OpenSSL at runtime
RUN apt-get update -y \
    && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install all deps (tsx and typescript are devDependencies but "npm start" uses tsx)
COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Generate the Prisma client into generated/prisma.
# The config file is named prisma7.config.ts, so it must be passed explicitly.
RUN npx prisma generate --config prisma7.config.ts

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

# Apply pending migrations, then start the API
CMD ["sh", "-c", "npx prisma migrate deploy --config prisma7.config.ts && npm start"]