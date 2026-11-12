import { MiddlewareHandler } from "hono";
import { AppEnv } from "../shared/types/hono";
import { createRequireAuth } from "../shared/middleware/auth.middleware";
import { createHonoServer } from "../app";

const noClerk: MiddlewareHandler<AppEnv> = async (_c, next) => next();

type User = {
  id: string;
  firstName: string;
  emailAddress: string;
};

export type NullUser = {
  id: null;
  firstName: string;
  emailAddress: string;
};

export const USER_1: User = {
  id: "test_user_1",
  firstName: "test_user_1_name",
  emailAddress: "test_user_1@example.com",
};

export const USER_2: User = {
  id: "test_user_2",
  firstName: "test_user_2_name",
  emailAddress: "test_user_2@example.com",
};

export function makeApp(user: User | NullUser = USER_1) {
  const auth = createRequireAuth(
    () => user.id,
    async () => ({
      firstName: user.firstName,
      emailAddresses: [{ emailAddress: user.emailAddress }],
    }),
  );
  return createHonoServer(noClerk, auth);
}

export function json(method: string, body?: unknown) {
  return {
    method,
    headers: { "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  };
}
