CREATE TABLE `promptTemplates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`theme` text NOT NULL,
	`vibe` text NOT NULL,
	`platform` varchar(64) NOT NULL,
	`language` varchar(64) NOT NULL DEFAULT 'en',
	`audience` text,
	`influences` text,
	`trackCount` int NOT NULL DEFAULT 10,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `promptTemplates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `userId_idx` ON `promptTemplates` (`userId`);--> statement-breakpoint
CREATE INDEX `createdAt_idx` ON `promptTemplates` (`createdAt`);