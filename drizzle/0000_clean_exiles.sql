CREATE TABLE `launch_subscribers` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`interest` text NOT NULL,
	`consent_text` text NOT NULL,
	`consent_version` text NOT NULL,
	`created_at` text NOT NULL,
	`removal_hash` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `launch_subscribers_email_unique` ON `launch_subscribers` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `subscriber_removal_hash` ON `launch_subscribers` (`removal_hash`);--> statement-breakpoint
CREATE TABLE `signup_limits` (
	`bucket` text PRIMARY KEY NOT NULL,
	`attempts` integer NOT NULL,
	`expires_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `limits_expiration` ON `signup_limits` (`expires_at`);