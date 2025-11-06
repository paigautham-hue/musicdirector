CREATE TABLE `comments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`albumId` int NOT NULL,
	`content` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `comments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `follows` (
	`id` int AUTO_INCREMENT NOT NULL,
	`followerId` int NOT NULL,
	`followingId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `follows_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `likes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`albumId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `likes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `albums` ADD `viewCount` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `promptTemplates` ADD `visibility` enum('private','public') DEFAULT 'private' NOT NULL;--> statement-breakpoint
ALTER TABLE `promptTemplates` ADD `usageCount` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `bio` text;--> statement-breakpoint
ALTER TABLE `users` ADD `avatarUrl` text;--> statement-breakpoint
CREATE INDEX `userId_idx` ON `comments` (`userId`);--> statement-breakpoint
CREATE INDEX `albumId_idx` ON `comments` (`albumId`);--> statement-breakpoint
CREATE INDEX `createdAt_idx` ON `comments` (`createdAt`);--> statement-breakpoint
CREATE INDEX `followerId_idx` ON `follows` (`followerId`);--> statement-breakpoint
CREATE INDEX `followingId_idx` ON `follows` (`followingId`);--> statement-breakpoint
CREATE INDEX `unique_follower_following` ON `follows` (`followerId`,`followingId`);--> statement-breakpoint
CREATE INDEX `userId_idx` ON `likes` (`userId`);--> statement-breakpoint
CREATE INDEX `albumId_idx` ON `likes` (`albumId`);--> statement-breakpoint
CREATE INDEX `unique_user_album` ON `likes` (`userId`,`albumId`);