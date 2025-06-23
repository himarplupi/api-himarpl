import {
  sqliteTable,
  uniqueIndex,
  foreignKey,
  text,
  numeric,
  integer,
  index,
} from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";

export const postTags = sqliteTable(
  "post_tags",
  {
    id: text()
      .primaryKey()
      .notNull()
      .$defaultFn(() => createId()),
    title: text().notNull(),
    slug: text().notNull(),
    createdAt: integer("created_at", { mode: "timestamp" })
      .default(sql`(CURRENT_TIMESTAMP)`)
      .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .default(sql`(CURRENT_TIMESTAMP)`)
      .notNull(),
    parentId: text("parent_id"),
  },
  (table) => [
    uniqueIndex("post_tags_slug_key").on(table.slug),
    uniqueIndex("post_tags_title_key").on(table.title),
    foreignKey(() => ({
      columns: [table.parentId],
      foreignColumns: [table.id],
      name: "post_tags_parent_id_post_tags_id_fk",
    }))
      .onUpdate("cascade")
      .onDelete("cascade"),
  ]
);

export const posts = sqliteTable(
  "posts",
  {
    id: text()
      .primaryKey()
      .notNull()
      .$defaultFn(() => createId()),
    authorId: text("author_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" }),
    title: text().notNull(),
    metaTitle: text("meta_title").notNull(),
    slug: text().notNull(),
    content: text().notNull(),
    rawHtml: text().notNull(),
    image: text(),
    createdAt: integer("created_at", { mode: "timestamp" })
      .default(sql`(CURRENT_TIMESTAMP)`)
      .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .default(sql`(CURRENT_TIMESTAMP)`)
      .notNull(),
    publishedAt: numeric("published_at"),
  },
  (table) => [
    uniqueIndex("posts_author_id_slug_key").on(table.authorId, table.slug),
  ]
);

export const programs = sqliteTable("programs", {
  id: text()
    .primaryKey()
    .notNull()
    .$defaultFn(() => createId()),
  content: text().notNull(),
  departmentId: text("department_id")
    .notNull()
    .references(() => departments.id, {
      onDelete: "cascade",
      onUpdate: "cascade",
    }),
});

export const positions = sqliteTable("positions", {
  id: text()
    .primaryKey()
    .notNull()
    .$defaultFn(() => createId()),
  name: text().notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .default(sql`(CURRENT_TIMESTAMP)`)
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .default(sql`(CURRENT_TIMESTAMP)`)
    .notNull(),
  departmentId: text("department_id").references(() => departments.id, {
    onDelete: "cascade",
    onUpdate: "cascade",
  }),
});

export const departments = sqliteTable("departments", {
  id: text()
    .primaryKey()
    .notNull()
    .$defaultFn(() => createId()),
  name: text().notNull(),
  acronym: text().notNull(),
  image: text(),
  description: text(),
  type: text().default("BE").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .default(sql`(CURRENT_TIMESTAMP)`)
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .default(sql`(CURRENT_TIMESTAMP)`)
    .notNull(),
  periodYear: integer("period_year")
    .notNull()
    .references(() => periods.year, {
      onDelete: "cascade",
      onUpdate: "cascade",
    }),
});

export const periods = sqliteTable(
  "periods",
  {
    id: text()
      .primaryKey()
      .notNull()
      .$defaultFn(() => createId()),
    logo: text().notNull(),
    name: text().notNull(),
    description: text(),
    year: integer().notNull(),
    createdAt: integer("created_at", { mode: "timestamp" })
      .default(sql`(CURRENT_TIMESTAMP)`)
      .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .default(sql`(CURRENT_TIMESTAMP)`)
      .notNull(),
  },
  (table) => [
    uniqueIndex("periods_year_key").on(table.year),
    uniqueIndex("periods_name_key").on(table.name),
  ]
);

export const socialMedias = sqliteTable(
  "social_medias",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" }),
    name: text().notNull(),
    username: text().notNull(),
    url: text().notNull(),
  },
  (table) => [
    uniqueIndex("social_medias_user_id_name_username_key").on(
      table.userId,
      table.name,
      table.username
    ),
  ]
);

export const users = sqliteTable(
  "users",
  {
    id: text()
      .primaryKey()
      .notNull()
      .$defaultFn(() => createId()),
    name: text(),
    email: text(),
    emailVerified: integer("email_verified", { mode: "timestamp" }),
    image: text(),
    username: text(),
    bio: text(),
    role: text().default("member").notNull(),
    lastLoginAt: integer("last_login_at", { mode: "timestamp" }),
    createdAt: integer("created_at", { mode: "timestamp" })
      .default(sql`(CURRENT_TIMESTAMP)`)
      .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .default(sql`(CURRENT_TIMESTAMP)`)
      .notNull(),
  },
  (table) => [
    uniqueIndex("users_username_key").on(table.username),
    uniqueIndex("users_email_key").on(table.email),
  ]
);

export const accounts = sqliteTable(
  "accounts",
  {
    id: text()
      .primaryKey()
      .notNull()
      .$defaultFn(() => createId()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" }),
    type: text().notNull(),
    provider: text().notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refreshToken: text("refresh_token"),
    accessToken: text("access_token"),
    expiresAt: integer("expires_at"),
    tokenType: text("token_type"),
    scope: text(),
    idToken: text("id_token"),
    sessionState: text("session_state"),
  },
  (table) => [
    uniqueIndex("accounts_provider_provider_account_id_key").on(
      table.provider,
      table.providerAccountId
    ),
  ]
);

export const sessions = sqliteTable(
  "sessions",
  {
    id: text()
      .primaryKey()
      .notNull()
      .$defaultFn(() => createId()),
    sessionToken: text().notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" }),
    expires: numeric().notNull(),
  },
  (table) => [uniqueIndex("sessions_sessionToken_key").on(table.sessionToken)]
);

export const verificationTokens = sqliteTable(
  "verification_tokens",
  {
    identifier: text().notNull(),
    token: text().notNull(),
    expires: integer({ mode: "timestamp" }).notNull(),
  },
  (table) => [
    uniqueIndex("verification_tokens_identifier_token_key").on(
      table.identifier,
      table.token
    ),
    uniqueIndex("verification_tokens_token_key").on(table.token),
  ]
);

export const postToPostTag = sqliteTable(
  "_PostToPostTag",
  {
    postId: text("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade", onUpdate: "cascade" }),
    postTagId: text("post_tag_id")
      .notNull()
      .references(() => postTags.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
  },
  (table) => [
    uniqueIndex("_PostToPostTag_AB_unique").on(table.postId, table.postTagId),
    index("post_id_idx").on(table.postId),
  ]
);

export const positionToUser = sqliteTable(
  "_PositionToUser",
  {
    positionId: text("position_id")
      .notNull()
      .references(() => positions.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" }),
  },
  (table) => [
    index("position_id_idx").on(table.positionId),
    uniqueIndex("_PositionToUser_AB_unique").on(table.positionId, table.userId),
  ]
);

export const departmentToUser = sqliteTable(
  "_DepartmentToUser",
  {
    departmentId: text("department_id")
      .notNull()
      .references(() => departments.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" }),
  },
  (table) => [
    index("department_id_idx").on(table.departmentId),
    uniqueIndex("_DepartmentToUser_AB_unique").on(
      table.departmentId,
      table.userId
    ),
  ]
);

export const periodToUser = sqliteTable(
  "_PeriodToUser",
  {
    periodId: text("period_id")
      .notNull()
      .references(() => periods.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" }),
  },
  (table) => [
    index("period_id_idx").on(table.periodId),
    uniqueIndex("_PeriodToUser_AB_unique").on(table.periodId, table.userId),
  ]
);
