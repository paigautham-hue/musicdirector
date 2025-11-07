CREATE TABLE `playlistRatings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`playlistId` int NOT NULL,
	`rating` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `playlistRatings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `userId_idx` ON `playlistRatings` (`userId`);--> statement-breakpoint
CREATE INDEX `playlistId_idx` ON `playlistRatings` (`playlistId`);--> statement-breakpoint
CREATE INDEX `unique_user_playlist` ON `playlistRatings` (`userId`,`playlistId`);