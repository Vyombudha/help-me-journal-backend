const testUrl = process.env.TEST_DATABASE_URL;

if (!testUrl) {
  throw new Error(
    "TEST_DATABASE_URL is not set. Point it at a throwaway Postgres database.",
  );
}

// Safety: never let the test run wipe your real database
if (testUrl === process.env.DATABASE_URL) {
  throw new Error(
    "TEST_DATABASE_URL must be different from DATABASE_URL (tests reset the DB).",
  );
}

process.env.DATABASE_URL = testUrl;

// Drops everything and re-applies all migrations => clean DB every run
const res = Bun.spawnSync(
  [
    "bunx",
    "prisma",
    "migrate",
    "reset",
    "--force",
    "--config",
    "prisma7.config.ts",
  ],
  { env: process.env, stdout: "inherit", stderr: "inherit" },
);

if (res.exitCode !== 0) throw new Error("Test DB reset failed");
