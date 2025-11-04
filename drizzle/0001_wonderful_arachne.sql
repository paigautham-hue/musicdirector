CREATE TABLE `albums` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`theme` text NOT NULL,
	`platform` varchar(64) NOT NULL,
	`description` text,
	`coverUrl` text,
	`coverPrompt` text,
	`score` int,
	`vibe` text,
	`language` varchar(64) DEFAULT 'en',
	`audience` text,
	`influences` text,
	`trackCount` int NOT NULL DEFAULT 10,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `albums_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `auditLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`action` varchar(128) NOT NULL,
	`payload` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `auditLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `featureFlags` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(128) NOT NULL,
	`enabled` boolean NOT NULL DEFAULT false,
	`description` text,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `featureFlags_id` PRIMARY KEY(`id`),
	CONSTRAINT `featureFlags_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `knowledgeUpdates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`weekStart` timestamp NOT NULL,
	`contentMd` text NOT NULL,
	`status` enum('draft','published') NOT NULL DEFAULT 'draft',
	`sources` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`publishedAt` timestamp,
	CONSTRAINT `knowledgeUpdates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `moderationFlags` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`objectType` varchar(64) NOT NULL,
	`objectId` int NOT NULL,
	`reason` text NOT NULL,
	`status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
	`reviewedBy` int,
	`reviewedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `moderationFlags_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `platformConstraints` (
	`id` int AUTO_INCREMENT NOT NULL,
	`platform` varchar(64) NOT NULL,
	`field` varchar(64) NOT NULL,
	`maxChars` int,
	`notes` text,
	`sourceUrl` text,
	`bestPractices` text,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `platformConstraints_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ratings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`albumId` int,
	`trackId` int,
	`rating` int NOT NULL,
	`review` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ratings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `trackAssets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`trackId` int NOT NULL,
	`type` enum('prompt','lyrics','art_prompt','art_url','preview_url','platform_payload','structure','production_notes','alternate_1','alternate_2') NOT NULL,
	`content` text NOT NULL,
	`variant` varchar(64),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `trackAssets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tracks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`albumId` int NOT NULL,
	`index` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`tempoBpm` varchar(64),
	`key` varchar(32),
	`moodTags` text,
	`score` int,
	`scoreBreakdown` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tracks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `plan` varchar(64) DEFAULT 'free' NOT NULL;--> statement-breakpoint
CREATE INDEX `userId_idx` ON `albums` (`userId`);--> statement-breakpoint
CREATE INDEX `platform_idx` ON `albums` (`platform`);--> statement-breakpoint
CREATE INDEX `createdAt_idx` ON `albums` (`createdAt`);--> statement-breakpoint
CREATE INDEX `userId_idx` ON `auditLogs` (`userId`);--> statement-breakpoint
CREATE INDEX `action_idx` ON `auditLogs` (`action`);--> statement-breakpoint
CREATE INDEX `createdAt_idx` ON `auditLogs` (`createdAt`);--> statement-breakpoint
CREATE INDEX `weekStart_idx` ON `knowledgeUpdates` (`weekStart`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `knowledgeUpdates` (`status`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `moderationFlags` (`status`);--> statement-breakpoint
CREATE INDEX `objectType_idx` ON `moderationFlags` (`objectType`);--> statement-breakpoint
CREATE INDEX `platform_idx` ON `platformConstraints` (`platform`);--> statement-breakpoint
CREATE INDEX `userId_idx` ON `ratings` (`userId`);--> statement-breakpoint
CREATE INDEX `albumId_idx` ON `ratings` (`albumId`);--> statement-breakpoint
CREATE INDEX `trackId_idx` ON `ratings` (`trackId`);--> statement-breakpoint
CREATE INDEX `trackId_idx` ON `trackAssets` (`trackId`);--> statement-breakpoint
CREATE INDEX `type_idx` ON `trackAssets` (`type`);--> statement-breakpoint
CREATE INDEX `albumId_idx` ON `tracks` (`albumId`);