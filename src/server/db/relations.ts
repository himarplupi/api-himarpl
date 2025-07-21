import { relations } from "drizzle-orm/relations";
import {
  postTags,
  users,
  posts,
  departments,
  programs,
  positions,
  periods,
  socialMedias,
  accounts,
  sessions,
  postToPostTag,
  positionToUser,
  departmentToUser,
  periodToUser,
} from "./schema";

export const postTagsRelations = relations(postTags, ({ one, many }) => ({
  postTag: one(postTags, {
    fields: [postTags.parentId],
    references: [postTags.id],
    relationName: "postTags_parentId_postTags_id",
  }),
  postTags: many(postTags, {
    relationName: "postTags_parentId_postTags_id",
  }),
  postToPostTags: many(postToPostTag),
}));

export const postsRelations = relations(posts, ({ one, many }) => ({
  user: one(users, {
    fields: [posts.authorId],
    references: [users.id],
  }),
  postToPostTags: many(postToPostTag),
}));

export const usersRelations = relations(users, ({ many }) => ({
  posts: many(posts),
  socialMedias: many(socialMedias),
  accounts: many(accounts),
  sessions: many(sessions),
  positionToUsers: many(positionToUser),
  departmentToUsers: many(departmentToUser),
  periodToUsers: many(periodToUser),
}));

export const programsRelations = relations(programs, ({ one }) => ({
  department: one(departments, {
    fields: [programs.departmentId],
    references: [departments.id],
  }),
}));

export const departmentsRelations = relations(departments, ({ one, many }) => ({
  programs: many(programs),
  positions: many(positions),
  period: one(periods, {
    fields: [departments.periodYear],
    references: [periods.year],
  }),
  departmentToUsers: many(departmentToUser),
}));

export const positionsRelations = relations(positions, ({ one, many }) => ({
  department: one(departments, {
    fields: [positions.departmentId],
    references: [departments.id],
  }),
  positionToUsers: many(positionToUser),
}));

export const periodsRelations = relations(periods, ({ many }) => ({
  departments: many(departments),
  periodToUsers: many(periodToUser),
}));

export const socialMediasRelations = relations(socialMedias, ({ one }) => ({
  user: one(users, {
    fields: [socialMedias.userId],
    references: [users.id],
  }),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const postToPostTagRelations = relations(postToPostTag, ({ one }) => ({
  post: one(posts, {
    fields: [postToPostTag.postId],
    references: [posts.id],
  }),
  postTag: one(postTags, {
    fields: [postToPostTag.postTagId],
    references: [postTags.id],
  }),
}));

export const positionToUserRelations = relations(positionToUser, ({ one }) => ({
  user: one(users, {
    fields: [positionToUser.userId],
    references: [users.id],
  }),
  position: one(positions, {
    fields: [positionToUser.positionId],
    references: [positions.id],
  }),
}));

export const departmentToUserRelations = relations(
  departmentToUser,
  ({ one }) => ({
    user: one(users, {
      fields: [departmentToUser.userId],
      references: [users.id],
    }),
    department: one(departments, {
      fields: [departmentToUser.departmentId],
      references: [departments.id],
    }),
  })
);

export const periodToUserRelations = relations(periodToUser, ({ one }) => ({
  user: one(users, {
    fields: [periodToUser.userId],
    references: [users.id],
  }),
  period: one(periods, {
    fields: [periodToUser.periodId],
    references: [periods.id],
  }),
}));
