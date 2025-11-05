ALTER TABLE `albums` ADD `visibility` enum('private','public') DEFAULT 'private' NOT NULL;--> statement-breakpoint
ALTER TABLE `albums` ADD `playCount` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `musicGenerationQuota` int DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `musicGenerationsUsed` int DEFAULT 0 NOT NULL;