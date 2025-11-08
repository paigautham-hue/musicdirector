ALTER TABLE `albums` MODIFY COLUMN `visibility` enum('private','public') NOT NULL DEFAULT 'public';--> statement-breakpoint
ALTER TABLE `playlists` MODIFY COLUMN `visibility` enum('private','public') NOT NULL DEFAULT 'public';--> statement-breakpoint
ALTER TABLE `promptTemplates` MODIFY COLUMN `visibility` enum('private','public') NOT NULL DEFAULT 'public';