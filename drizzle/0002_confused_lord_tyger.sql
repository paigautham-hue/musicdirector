CREATE TABLE `audioFiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`trackId` int NOT NULL,
	`jobId` int,
	`fileUrl` text NOT NULL,
	`fileKey` varchar(512) NOT NULL,
	`fileName` varchar(255) NOT NULL,
	`fileSize` int,
	`duration` int,
	`format` varchar(32),
	`waveformData` text,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `audioFiles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `musicJobs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`albumId` int NOT NULL,
	`trackId` int,
	`platform` varchar(64) NOT NULL,
	`status` enum('pending','processing','completed','failed') NOT NULL DEFAULT 'pending',
	`progress` int DEFAULT 0,
	`statusMessage` text,
	`platformJobId` varchar(255),
	`errorMessage` text,
	`retryCount` int DEFAULT 0,
	`startedAt` timestamp,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `musicJobs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `systemSettings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`key` varchar(128) NOT NULL,
	`value` text NOT NULL,
	`description` text,
	`updatedBy` int,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `systemSettings_id` PRIMARY KEY(`id`),
	CONSTRAINT `systemSettings_key_unique` UNIQUE(`key`)
);
--> statement-breakpoint
CREATE INDEX `trackId_idx` ON `audioFiles` (`trackId`);--> statement-breakpoint
CREATE INDEX `jobId_idx` ON `audioFiles` (`jobId`);--> statement-breakpoint
CREATE INDEX `albumId_idx` ON `musicJobs` (`albumId`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `musicJobs` (`status`);--> statement-breakpoint
CREATE INDEX `platformJobId_idx` ON `musicJobs` (`platformJobId`);