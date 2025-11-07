CREATE TABLE `playlistTracks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`playlistId` int NOT NULL,
	`trackId` int NOT NULL,
	`position` int NOT NULL,
	`addedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `playlistTracks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `playlists` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`coverImage` text,
	`visibility` enum('private','public') NOT NULL DEFAULT 'private',
	`playCount` int NOT NULL DEFAULT 0,
	`likeCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `playlists_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `playlistId_idx` ON `playlistTracks` (`playlistId`);--> statement-breakpoint
CREATE INDEX `trackId_idx` ON `playlistTracks` (`trackId`);--> statement-breakpoint
CREATE INDEX `unique_playlist_track` ON `playlistTracks` (`playlistId`,`trackId`);--> statement-breakpoint
CREATE INDEX `userId_idx` ON `playlists` (`userId`);--> statement-breakpoint
CREATE INDEX `visibility_idx` ON `playlists` (`visibility`);--> statement-breakpoint
CREATE INDEX `createdAt_idx` ON `playlists` (`createdAt`);