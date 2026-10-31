const messageChain = (err: unknown): string => {
  const parts: string[] = [];
  let current: unknown = err;
  // Drizzle wraps the original D1 error in `cause`, so we walk the chain
  while (current instanceof Error && parts.length < 5) {
    parts.push(current.message);
    current = current.cause;
  }
  return parts.join(" | ");
};

export const isUniqueViolation = (err: unknown) =>
  messageChain(err).includes("UNIQUE constraint failed");

export const isForeignKeyViolation = (err: unknown) =>
  messageChain(err).includes("FOREIGN KEY constraint failed");
