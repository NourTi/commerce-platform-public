CREATE TABLE `commerceStoreHandoffs` (
	`id` varchar(64) NOT NULL,
	`storeId` varchar(64) NOT NULL,
	`createdBy` int NOT NULL,
	`token` varchar(64) NOT NULL,
	`label` varchar(255) NOT NULL,
	`status` enum('DRAFT','SHARED','APPROVED') NOT NULL DEFAULT 'DRAFT',
	`expiresAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `commerceStoreHandoffs_id` PRIMARY KEY(`id`),
	CONSTRAINT `commerceHandoffTokenUnique` UNIQUE(`token`)
);
--> statement-breakpoint
CREATE TABLE `commerceStorePreferences` (
	`storeId` varchar(64) NOT NULL,
	`dashboardView` enum('OVERVIEW','CATALOG','ORDERS','MARKETING','STUDIO','EXTENSIONS') NOT NULL DEFAULT 'OVERVIEW',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `commerceStorePreferences_storeId` PRIMARY KEY(`storeId`)
);
--> statement-breakpoint
ALTER TABLE `commerceStoreHandoffs` ADD CONSTRAINT `commerceStoreHandoffs_storeId_commerceStores_id_fk` FOREIGN KEY (`storeId`) REFERENCES `commerceStores`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `commerceStoreHandoffs` ADD CONSTRAINT `commerceStoreHandoffs_createdBy_users_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `commerceStorePreferences` ADD CONSTRAINT `commerceStorePreferences_storeId_commerceStores_id_fk` FOREIGN KEY (`storeId`) REFERENCES `commerceStores`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `commerceHandoffStoreCreatedIdx` ON `commerceStoreHandoffs` (`storeId`,`createdAt`);