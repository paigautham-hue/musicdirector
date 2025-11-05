CREATE TABLE `creditTransactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`amount` int NOT NULL,
	`type` enum('purchase','usage','refund','admin_adjustment') NOT NULL,
	`description` text NOT NULL,
	`paymentId` int,
	`albumId` int,
	`balanceBefore` int NOT NULL,
	`balanceAfter` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `creditTransactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `payments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`stripeSessionId` varchar(255) NOT NULL,
	`stripePaymentIntentId` varchar(255),
	`amount` int NOT NULL,
	`currency` varchar(3) NOT NULL DEFAULT 'usd',
	`status` enum('pending','completed','failed','refunded') NOT NULL DEFAULT 'pending',
	`productId` varchar(64) NOT NULL,
	`creditsGranted` int NOT NULL,
	`customerEmail` varchar(320),
	`customerName` text,
	`metadata` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	CONSTRAINT `payments_id` PRIMARY KEY(`id`),
	CONSTRAINT `payments_stripeSessionId_unique` UNIQUE(`stripeSessionId`)
);
--> statement-breakpoint
CREATE INDEX `userId_idx` ON `creditTransactions` (`userId`);--> statement-breakpoint
CREATE INDEX `type_idx` ON `creditTransactions` (`type`);--> statement-breakpoint
CREATE INDEX `createdAt_idx` ON `creditTransactions` (`createdAt`);--> statement-breakpoint
CREATE INDEX `userId_idx` ON `payments` (`userId`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `payments` (`status`);--> statement-breakpoint
CREATE INDEX `createdAt_idx` ON `payments` (`createdAt`);