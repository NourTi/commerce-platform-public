CREATE TABLE `configurationVersions` (
	`id` varchar(64) NOT NULL,
	`blueprintId` varchar(64) NOT NULL,
	`ownerId` int NOT NULL,
	`status` enum('DRAFT','QUOTED','ACCEPTED','PRODUCTION_RELEASED','CANCELLED') NOT NULL DEFAULT 'DRAFT',
	`selections` json NOT NULL,
	`validationResult` json NOT NULL,
	`priceTrace` json NOT NULL,
	`fingerprint` varchar(128) NOT NULL,
	`totalCents` int NOT NULL,
	`depositCents` int NOT NULL,
	`leadTimeDays` int NOT NULL,
	`rulesVersion` varchar(128) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `configurationVersions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `integrationOutbox` (
	`id` varchar(64) NOT NULL,
	`aggregateType` varchar(64) NOT NULL,
	`aggregateId` varchar(64) NOT NULL,
	`eventType` varchar(128) NOT NULL,
	`payload` json NOT NULL,
	`idempotencyKey` varchar(191) NOT NULL,
	`status` enum('PENDING','DELIVERED','FAILED') NOT NULL DEFAULT 'PENDING',
	`attemptCount` int NOT NULL DEFAULT 0,
	`deliveredAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `integrationOutbox_id` PRIMARY KEY(`id`),
	CONSTRAINT `outboxIdempotencyUnique` UNIQUE(`idempotencyKey`)
);
--> statement-breakpoint
CREATE TABLE `productBlueprints` (
	`id` varchar(64) NOT NULL,
	`slug` varchar(128) NOT NULL,
	`name` varchar(255) NOT NULL,
	`summary` text NOT NULL,
	`schemaVersion` int NOT NULL,
	`definition` json NOT NULL,
	`status` enum('DRAFT','PUBLISHED','ARCHIVED') NOT NULL DEFAULT 'DRAFT',
	`ownerId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `productBlueprints_id` PRIMARY KEY(`id`),
	CONSTRAINT `blueprintSlugUnique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `productionPassports` (
	`id` varchar(64) NOT NULL,
	`configurationId` varchar(64) NOT NULL,
	`quoteId` varchar(64) NOT NULL,
	`ownerId` int NOT NULL,
	`passportNumber` varchar(64) NOT NULL,
	`status` enum('QUEUED','RELEASED','IN_PROGRESS','COMPLETE','EXCEPTION') NOT NULL DEFAULT 'QUEUED',
	`specification` json NOT NULL,
	`idempotencyKey` varchar(191) NOT NULL,
	`releasedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `productionPassports_id` PRIMARY KEY(`id`),
	CONSTRAINT `passportConfigurationUnique` UNIQUE(`configurationId`),
	CONSTRAINT `passportNumberUnique` UNIQUE(`passportNumber`),
	CONSTRAINT `passportIdempotencyUnique` UNIQUE(`idempotencyKey`)
);
--> statement-breakpoint
CREATE TABLE `quotes` (
	`id` varchar(64) NOT NULL,
	`configurationId` varchar(64) NOT NULL,
	`ownerId` int NOT NULL,
	`reference` varchar(64) NOT NULL,
	`status` enum('DRAFT','SENT','ACCEPTED','EXPIRED','DECLINED') NOT NULL DEFAULT 'DRAFT',
	`totalCents` int NOT NULL,
	`depositCents` int NOT NULL,
	`validUntil` timestamp NOT NULL,
	`acceptedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `quotes_id` PRIMARY KEY(`id`),
	CONSTRAINT `quoteReferenceUnique` UNIQUE(`reference`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`openId` varchar(64) NOT NULL,
	`name` text,
	`email` varchar(320),
	`loginMethod` varchar(64),
	`role` enum('user','admin') NOT NULL DEFAULT 'user',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_openId_unique` UNIQUE(`openId`)
);
--> statement-breakpoint
ALTER TABLE `configurationVersions` ADD CONSTRAINT `configurationVersions_blueprintId_productBlueprints_id_fk` FOREIGN KEY (`blueprintId`) REFERENCES `productBlueprints`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `configurationVersions` ADD CONSTRAINT `configurationVersions_ownerId_users_id_fk` FOREIGN KEY (`ownerId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `productBlueprints` ADD CONSTRAINT `productBlueprints_ownerId_users_id_fk` FOREIGN KEY (`ownerId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `productionPassports` ADD CONSTRAINT `productionPassports_configurationId_configurationVersions_id_fk` FOREIGN KEY (`configurationId`) REFERENCES `configurationVersions`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `productionPassports` ADD CONSTRAINT `productionPassports_quoteId_quotes_id_fk` FOREIGN KEY (`quoteId`) REFERENCES `quotes`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `productionPassports` ADD CONSTRAINT `productionPassports_ownerId_users_id_fk` FOREIGN KEY (`ownerId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `quotes` ADD CONSTRAINT `quotes_configurationId_configurationVersions_id_fk` FOREIGN KEY (`configurationId`) REFERENCES `configurationVersions`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `quotes` ADD CONSTRAINT `quotes_ownerId_users_id_fk` FOREIGN KEY (`ownerId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `configurationOwnerCreatedIdx` ON `configurationVersions` (`ownerId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `configurationBlueprintIdx` ON `configurationVersions` (`blueprintId`);--> statement-breakpoint
CREATE INDEX `outboxStatusCreatedIdx` ON `integrationOutbox` (`status`,`createdAt`);--> statement-breakpoint
CREATE INDEX `blueprintOwnerIdx` ON `productBlueprints` (`ownerId`);--> statement-breakpoint
CREATE INDEX `passportOwnerCreatedIdx` ON `productionPassports` (`ownerId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `quoteOwnerCreatedIdx` ON `quotes` (`ownerId`,`createdAt`);