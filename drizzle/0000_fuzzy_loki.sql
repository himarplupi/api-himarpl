CREATE TABLE `accounts` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`type` text NOT NULL,
	`provider` text NOT NULL,
	`provider_account_id` text NOT NULL,
	`refresh_token` text,
	`access_token` text,
	`expires_at` integer,
	`token_type` text,
	`scope` text,
	`id_token` text,
	`session_state` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `accounts_provider_provider_account_id_key` ON `accounts` (`provider`,`provider_account_id`);--> statement-breakpoint
CREATE TABLE `_DepartmentToUser` (
	`department_id` text NOT NULL,
	`user_id` text NOT NULL,
	FOREIGN KEY (`department_id`) REFERENCES `departments`(`id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `department_id_idx` ON `_DepartmentToUser` (`department_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `_DepartmentToUser_AB_unique` ON `_DepartmentToUser` (`department_id`,`user_id`);--> statement-breakpoint
CREATE TABLE `departments` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`acronym` text NOT NULL,
	`image` text,
	`description` text,
	`type` text DEFAULT 'BE' NOT NULL,
	`created_at` integer DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` integer DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`period_year` integer NOT NULL,
	FOREIGN KEY (`period_year`) REFERENCES `periods`(`year`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `_PeriodToUser` (
	`period_id` text NOT NULL,
	`user_id` text NOT NULL,
	FOREIGN KEY (`period_id`) REFERENCES `periods`(`id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `period_id_idx` ON `_PeriodToUser` (`period_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `_PeriodToUser_AB_unique` ON `_PeriodToUser` (`period_id`,`user_id`);--> statement-breakpoint
CREATE TABLE `periods` (
	`id` text PRIMARY KEY NOT NULL,
	`logo` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`year` integer NOT NULL,
	`created_at` integer DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` integer DEFAULT (CURRENT_TIMESTAMP) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `periods_year_key` ON `periods` (`year`);--> statement-breakpoint
CREATE UNIQUE INDEX `periods_name_key` ON `periods` (`name`);--> statement-breakpoint
CREATE TABLE `_PositionToUser` (
	`position_id` text NOT NULL,
	`user_id` text NOT NULL,
	FOREIGN KEY (`position_id`) REFERENCES `positions`(`id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `position_id_idx` ON `_PositionToUser` (`position_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `_PositionToUser_AB_unique` ON `_PositionToUser` (`position_id`,`user_id`);--> statement-breakpoint
CREATE TABLE `positions` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`created_at` integer DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` integer DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`department_id` text,
	FOREIGN KEY (`department_id`) REFERENCES `departments`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `post_tags` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`slug` text NOT NULL,
	`created_at` integer DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` integer DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`parent_id` text,
	FOREIGN KEY (`parent_id`) REFERENCES `post_tags`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `post_tags_slug_key` ON `post_tags` (`slug`);--> statement-breakpoint
CREATE UNIQUE INDEX `post_tags_title_key` ON `post_tags` (`title`);--> statement-breakpoint
CREATE TABLE `_PostToPostTag` (
	`post_id` text NOT NULL,
	`post_tag_id` text NOT NULL,
	FOREIGN KEY (`post_id`) REFERENCES `posts`(`id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`post_tag_id`) REFERENCES `post_tags`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `_PostToPostTag_AB_unique` ON `_PostToPostTag` (`post_id`,`post_tag_id`);--> statement-breakpoint
CREATE INDEX `post_id_idx` ON `_PostToPostTag` (`post_id`);--> statement-breakpoint
CREATE TABLE `posts` (
	`id` text PRIMARY KEY NOT NULL,
	`author_id` text NOT NULL,
	`title` text NOT NULL,
	`meta_title` text NOT NULL,
	`slug` text NOT NULL,
	`content` text NOT NULL,
	`rawHtml` text NOT NULL,
	`image` text,
	`created_at` integer DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` integer DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`published_at` numeric,
	FOREIGN KEY (`author_id`) REFERENCES `users`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `posts_author_id_slug_key` ON `posts` (`author_id`,`slug`);--> statement-breakpoint
CREATE TABLE `programs` (
	`id` text PRIMARY KEY NOT NULL,
	`content` text NOT NULL,
	`department_id` text NOT NULL,
	FOREIGN KEY (`department_id`) REFERENCES `departments`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`sessionToken` text NOT NULL,
	`user_id` text NOT NULL,
	`expires` numeric NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `sessions_sessionToken_key` ON `sessions` (`sessionToken`);--> statement-breakpoint
CREATE TABLE `social_medias` (
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`username` text NOT NULL,
	`url` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `social_medias_user_id_name_username_key` ON `social_medias` (`user_id`,`name`,`username`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text,
	`email` text,
	`email_verified` numeric,
	`image` text,
	`username` text,
	`bio` text,
	`role` text DEFAULT 'member' NOT NULL,
	`last_login_at` integer,
	`created_at` integer DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` integer DEFAULT (CURRENT_TIMESTAMP) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_username_key` ON `users` (`username`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_key` ON `users` (`email`);--> statement-breakpoint
CREATE TABLE `verification_tokens` (
	`identifier` text NOT NULL,
	`token` text NOT NULL,
	`expires` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `verification_tokens_identifier_token_key` ON `verification_tokens` (`identifier`,`token`);--> statement-breakpoint
CREATE UNIQUE INDEX `verification_tokens_token_key` ON `verification_tokens` (`token`);
