import { rmSync } from "node:fs";

process.env.DATABASE_URL = "file:./test.db";

rmSync("./test.db", { force: true });
rmSync("./test.db-journal", { force: true });

const res = Bun.spawnSync(
  ["bunx", "prisma", "migrate", "deploy", "--config", "prisma7.config.ts"],
  { env: process.env, stdout: "inherit", stderr: "inherit" },
);
if (res.exitCode !== 0) throw new Error("Test DB migration failed");
