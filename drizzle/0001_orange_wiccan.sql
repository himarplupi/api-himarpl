DROP INDEX "accounts_provider_provider_account_id_key";--> statement-breakpoint
DROP INDEX "department_id_idx";--> statement-breakpoint
DROP INDEX "_DepartmentToUser_AB_unique";--> statement-breakpoint
DROP INDEX "period_id_idx";--> statement-breakpoint
DROP INDEX "_PeriodToUser_AB_unique";--> statement-breakpoint
DROP INDEX "periods_year_key";--> statement-breakpoint
DROP INDEX "periods_name_key";--> statement-breakpoint
DROP INDEX "position_id_idx";--> statement-breakpoint
DROP INDEX "_PositionToUser_AB_unique";--> statement-breakpoint
DROP INDEX "post_tags_slug_key";--> statement-breakpoint
DROP INDEX "post_tags_title_key";--> statement-breakpoint
DROP INDEX "_PostToPostTag_AB_unique";--> statement-breakpoint
DROP INDEX "post_id_idx";--> statement-breakpoint
DROP INDEX "posts_author_id_slug_key";--> statement-breakpoint
DROP INDEX "sessions_sessionToken_key";--> statement-breakpoint
DROP INDEX "social_medias_user_id_name_username_key";--> statement-breakpoint
DROP INDEX "users_username_key";--> statement-breakpoint
DROP INDEX "users_email_key";--> statement-breakpoint
DROP INDEX "verification_tokens_identifier_token_key";--> statement-breakpoint
DROP INDEX "verification_tokens_token_key";--> statement-breakpoint
ALTER TABLE `users` ALTER COLUMN "email_verified" TO "email_verified" integer;--> statement-breakpoint
CREATE UNIQUE INDEX `accounts_provider_provider_account_id_key` ON `accounts` (`provider`,`provider_account_id`);--> statement-breakpoint
CREATE INDEX `department_id_idx` ON `_DepartmentToUser` (`department_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `_DepartmentToUser_AB_unique` ON `_DepartmentToUser` (`department_id`,`user_id`);--> statement-breakpoint
CREATE INDEX `period_id_idx` ON `_PeriodToUser` (`period_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `_PeriodToUser_AB_unique` ON `_PeriodToUser` (`period_id`,`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `periods_year_key` ON `periods` (`year`);--> statement-breakpoint
CREATE UNIQUE INDEX `periods_name_key` ON `periods` (`name`);--> statement-breakpoint
CREATE INDEX `position_id_idx` ON `_PositionToUser` (`position_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `_PositionToUser_AB_unique` ON `_PositionToUser` (`position_id`,`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `post_tags_slug_key` ON `post_tags` (`slug`);--> statement-breakpoint
CREATE UNIQUE INDEX `post_tags_title_key` ON `post_tags` (`title`);--> statement-breakpoint
CREATE UNIQUE INDEX `_PostToPostTag_AB_unique` ON `_PostToPostTag` (`post_id`,`post_tag_id`);--> statement-breakpoint
CREATE INDEX `post_id_idx` ON `_PostToPostTag` (`post_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `posts_author_id_slug_key` ON `posts` (`author_id`,`slug`);--> statement-breakpoint
CREATE UNIQUE INDEX `sessions_sessionToken_key` ON `sessions` (`sessionToken`);--> statement-breakpoint
CREATE UNIQUE INDEX `social_medias_user_id_name_username_key` ON `social_medias` (`user_id`,`name`,`username`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_username_key` ON `users` (`username`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_key` ON `users` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `verification_tokens_identifier_token_key` ON `verification_tokens` (`identifier`,`token`);--> statement-breakpoint
CREATE UNIQUE INDEX `verification_tokens_token_key` ON `verification_tokens` (`token`);