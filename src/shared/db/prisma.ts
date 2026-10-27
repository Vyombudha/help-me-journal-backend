import { env } from "cloudflare:workers";
import { PrismaClient } from "../../../generated/prisma/client.js";
import { PrismaD1 } from "@prisma/adapter-d1";

// D1 is accessed through a binding (no TCP connection), so a lazily created
// client that lives as long as the isolate is fine.
let client: PrismaClient | undefined;

const getClient = (): PrismaClient => {
  client ??= new PrismaClient({
    adapter: new PrismaD1((env as unknown as { DB: D1Database }).DB),
  });
  return client;
};

// Proxy keeps every `import { prisma }` in the services working unchanged.
export const prisma = new Proxy({} as PrismaClient, {
  get: (_t, prop) => Reflect.get(getClient(), prop),
});
