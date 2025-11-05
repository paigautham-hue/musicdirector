CREATE TABLE `apiUsageLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`endpoint` varchar(255) NOT NULL,
	`method` varchar(10) NOT NULL,
	`statusCode` int NOT NULL,
	`latencyMs` int NOT NULL,
	`userId` int,
	`errorMessage` text,
	`timestamp` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `apiUsageLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `healthMetrics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`metricName` varchar(128) NOT NULL,
	`metricValue` varchar(255) NOT NULL,
	`metricType` varchar(64) NOT NULL,
	`tags` text,
	`timestamp` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `healthMetrics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `llmUsageLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`model` varchar(64) NOT NULL,
	`operation` varchar(128) NOT NULL,
	`promptTokens` int NOT NULL,
	`completionTokens` int NOT NULL,
	`totalTokens` int NOT NULL,
	`costUsd` varchar(20) NOT NULL,
	`latencyMs` int NOT NULL,
	`success` boolean NOT NULL,
	`errorMessage` text,
	`userId` int,
	`timestamp` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `llmUsageLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `endpoint_idx` ON `apiUsageLogs` (`endpoint`);--> statement-breakpoint
CREATE INDEX `timestamp_idx` ON `apiUsageLogs` (`timestamp`);--> statement-breakpoint
CREATE INDEX `userId_idx` ON `apiUsageLogs` (`userId`);--> statement-breakpoint
CREATE INDEX `metricName_idx` ON `healthMetrics` (`metricName`);--> statement-breakpoint
CREATE INDEX `timestamp_idx` ON `healthMetrics` (`timestamp`);--> statement-breakpoint
CREATE INDEX `model_idx` ON `llmUsageLogs` (`model`);--> statement-breakpoint
CREATE INDEX `timestamp_idx` ON `llmUsageLogs` (`timestamp`);--> statement-breakpoint
CREATE INDEX `operation_idx` ON `llmUsageLogs` (`operation`);