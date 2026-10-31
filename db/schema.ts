// src/db/schema.ts
import { sqliteTable, text, integer, unique } from "drizzle-orm/sqlite-core";

// SQLite has no enums, so we keep the values in arrays and use them as text constraints
export const WORKSPACE_STATUSES = [
  "IN_PROGRESS",
  "COMPLETED",
  "ABANDONED",
] as const;

export const MOODS = [
  "HAPPY",
  "CALM",
  "SAD",
  "ANGRY",
  "ANXIOUS",
  "EXCITED",
  "TIRED",
  "NEUTRAL",
] as const;

export type WorkspaceStatus = (typeof WORKSPACE_STATUSES)[number];
export type Mood = (typeof MOODS)[number];

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date())
    .$onUpdate(() => new Date()),
});

export const workspaces = sqliteTable(
  "workspaces",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    name: text("name").notNull(),
    description: text("description").notNull(),
    ownerId: text("owner_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    isDefault: integer("is_default", { mode: "boolean" })
      .notNull()
      .default(false),
    status: text("status", { enum: WORKSPACE_STATUSES })
      .notNull()
      .default("IN_PROGRESS"),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date())
      .$onUpdate(() => new Date()),
  },
  (t) => [unique().on(t.ownerId, t.name)],
);

export const pages = sqliteTable(
  "pages",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    title: text("title").notNull(),
    content: text("content").notNull().default(""),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    templateConfig: text("template_config", { mode: "json" }).$type<
      Record<string, unknown>
    >(),
    moods: text("moods", { mode: "json" })
      .$type<Mood[]>()
      .notNull()
      .$defaultFn(() => []),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date())
      .$onUpdate(() => new Date()),
  },
  (t) => [unique().on(t.workspaceId, t.title)],
);

import { relations } from "drizzle-orm";

export const usersRelations = relations(users, ({ many }) => ({
  workspaces: many(workspaces),
}));

export const workspacesRelations = relations(workspaces, ({ one, many }) => ({
  owner: one(users, { fields: [workspaces.ownerId], references: [users.id] }),
  pages: many(pages),
}));

export const pagesRelations = relations(pages, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [pages.workspaceId],
    references: [workspaces.id],
  }),
}));

export type Workspace = typeof workspaces.$inferSelect;
export type User = typeof users.$inferSelect;
export type Page = typeof pages.$inferSelect;
