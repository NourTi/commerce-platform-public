CREATE TABLE `commerceExtensions` (
	`id` varchar(64) NOT NULL,
	`storeId` varchar(64) NOT NULL,
	`key` varchar(128) NOT NULL,
	`name` varchar(255) NOT NULL,
	`status` enum('DISABLED','ENABLED') NOT NULL DEFAULT 'DISABLED',
	`configuration` json NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `commerceExtensions_id` PRIMARY KEY(`id`),
	CONSTRAINT `commerceExtensionStoreKeyUnique` UNIQUE(`storeId`,`key`)
);
--> statement-breakpoint
CREATE TABLE `commercePageSections` (
	`id` varchar(64) NOT NULL,
	`pageId` varchar(64) NOT NULL,
	`type` varchar(64) NOT NULL,
	`sortOrder` int NOT NULL,
	`visible` boolean NOT NULL DEFAULT true,
	`settings` json NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `commercePageSections_id` PRIMARY KEY(`id`),
	CONSTRAINT `commerceSectionPageSortUnique` UNIQUE(`pageId`,`sortOrder`)
);
--> statement-breakpoint
CREATE TABLE `commercePages` (
	`id` varchar(64) NOT NULL,
	`storeId` varchar(64) NOT NULL,
	`handle` varchar(128) NOT NULL,
	`title` varchar(255) NOT NULL,
	`status` enum('DRAFT','PUBLISHED') NOT NULL DEFAULT 'DRAFT',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `commercePages_id` PRIMARY KEY(`id`),
	CONSTRAINT `commercePageStoreHandleUnique` UNIQUE(`storeId`,`handle`)
);
--> statement-breakpoint
CREATE TABLE `commerceStoreMembers` (
	`id` varchar(64) NOT NULL,
	`storeId` varchar(64) NOT NULL,
	`userId` int NOT NULL,
	`role` enum('OWNER','MANAGER','MERCHANDISER','ANALYST') NOT NULL DEFAULT 'MERCHANDISER',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `commerceStoreMembers_id` PRIMARY KEY(`id`),
	CONSTRAINT `commerceStoreMemberUnique` UNIQUE(`storeId`,`userId`)
);
--> statement-breakpoint
CREATE TABLE `commerceStores` (
	`id` varchar(64) NOT NULL,
	`workspaceId` varchar(64) NOT NULL,
	`name` varchar(255) NOT NULL,
	`handle` varchar(128) NOT NULL,
	`status` enum('DRAFT','ACTIVE','PAUSED') NOT NULL DEFAULT 'DRAFT',
	`defaultLocale` varchar(8) NOT NULL DEFAULT 'en',
	`currency` varchar(3) NOT NULL DEFAULT 'USD',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `commerceStores_id` PRIMARY KEY(`id`),
	CONSTRAINT `commerceStoreHandleUnique` UNIQUE(`handle`)
);
--> statement-breakpoint
CREATE TABLE `commerceThemes` (
	`id` varchar(64) NOT NULL,
	`storeId` varchar(64) NOT NULL,
	`name` varchar(255) NOT NULL,
	`preset` varchar(64) NOT NULL,
	`tokens` json NOT NULL,
	`isActive` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `commerceThemes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `commerceWorkspaces` (
	`id` varchar(64) NOT NULL,
	`name` varchar(255) NOT NULL,
	`slug` varchar(128) NOT NULL,
	`ownerId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `commerceWorkspaces_id` PRIMARY KEY(`id`),
	CONSTRAINT `commerceWorkspaceSlugUnique` UNIQUE(`slug`)
);
--> statement-breakpoint
ALTER TABLE `commerceCarts` DROP INDEX `commerceCartSessionKeyUnique`;--> statement-breakpoint
ALTER TABLE `commerceProducts` DROP INDEX `commerceProductHandleUnique`;--> statement-breakpoint
ALTER TABLE `commercePromotions` DROP INDEX `commercePromotionCodeUnique`;--> statement-breakpoint
DROP INDEX `commerceCartStatusUpdatedIdx` ON `commerceCarts`;--> statement-breakpoint
DROP INDEX `commerceOrderCustomerIdx` ON `commerceOrders`;--> statement-breakpoint
DROP INDEX `commerceOrderStatusIdx` ON `commerceOrders`;--> statement-breakpoint
DROP INDEX `commerceProductStatusCategoryIdx` ON `commerceProducts`;--> statement-breakpoint
DROP INDEX `commercePromotionActiveIdx` ON `commercePromotions`;--> statement-breakpoint
ALTER TABLE `commerceCarts` ADD `storeId` varchar(64);--> statement-breakpoint
ALTER TABLE `commerceOrders` ADD `storeId` varchar(64);--> statement-breakpoint
ALTER TABLE `commerceProducts` ADD `storeId` varchar(64);--> statement-breakpoint
ALTER TABLE `commercePromotions` ADD `storeId` varchar(64);--> statement-breakpoint
INSERT INTO `commerceWorkspaces` (`id`, `name`, `slug`, `ownerId`) SELECT CONCAT('workspace_', `ownerId`), CONCAT('Workspace ', `ownerId`), CONCAT('workspace-', `ownerId`), `ownerId` FROM (SELECT DISTINCT `ownerId` FROM `commerceProducts`) AS owners ON DUPLICATE KEY UPDATE `id` = `id`;--> statement-breakpoint
INSERT INTO `commerceStores` (`id`, `workspaceId`, `name`, `handle`, `status`, `defaultLocale`, `currency`) SELECT CONCAT('store_', `ownerId`), CONCAT('workspace_', `ownerId`), CONCAT('Store ', `ownerId`), CONCAT('store-', `ownerId`), 'ACTIVE', 'en', 'USD' FROM (SELECT DISTINCT `ownerId` FROM `commerceProducts`) AS owners ON DUPLICATE KEY UPDATE `id` = `id`;--> statement-breakpoint
INSERT INTO `commerceStoreMembers` (`id`, `storeId`, `userId`, `role`) SELECT CONCAT('member_', `ownerId`), CONCAT('store_', `ownerId`), `ownerId`, 'OWNER' FROM (SELECT DISTINCT `ownerId` FROM `commerceProducts`) AS owners ON DUPLICATE KEY UPDATE `id` = `id`;--> statement-breakpoint
INSERT INTO `commerceThemes` (`id`, `storeId`, `name`, `preset`, `tokens`, `isActive`) SELECT CONCAT('theme_', `ownerId`, '_editorial'), CONCAT('store_', `ownerId`), 'Editorial start', 'EDITORIAL', JSON_OBJECT('ink','#171717','paper','#f7f5f0','accent','#e96526','surface','#ffffff','radius','0px'), true FROM (SELECT DISTINCT `ownerId` FROM `commerceProducts`) AS owners ON DUPLICATE KEY UPDATE `id` = `id`;--> statement-breakpoint
INSERT INTO `commercePages` (`id`, `storeId`, `handle`, `title`, `status`) SELECT CONCAT('page_', `ownerId`, '_home'), CONCAT('store_', `ownerId`), 'home', 'Homepage', 'PUBLISHED' FROM (SELECT DISTINCT `ownerId` FROM `commerceProducts`) AS owners ON DUPLICATE KEY UPDATE `id` = `id`;--> statement-breakpoint
INSERT INTO `commercePageSections` (`id`, `pageId`, `type`, `sortOrder`, `visible`, `settings`) SELECT CONCAT('section_', `ownerId`, '_hero'), CONCAT('page_', `ownerId`, '_home'), 'HERO', 1, true, JSON_OBJECT('eyebrow','New collection','heading','Design a storefront that keeps moving.','body','A visual system connected to your real catalog, order flow, and campaigns.','actionLabel','Shop the collection') FROM (SELECT DISTINCT `ownerId` FROM `commerceProducts`) AS owners ON DUPLICATE KEY UPDATE `id` = `id`;--> statement-breakpoint
INSERT INTO `commerceExtensions` (`id`, `storeId`, `key`, `name`, `status`, `configuration`) SELECT CONCAT('ext_', `ownerId`, '_capture'), CONCAT('store_', `ownerId`), 'customer-capture', 'Customer capture', 'ENABLED', JSON_OBJECT('provider','native') FROM (SELECT DISTINCT `ownerId` FROM `commerceProducts`) AS owners ON DUPLICATE KEY UPDATE `id` = `id`;--> statement-breakpoint
UPDATE `commerceProducts` SET `storeId` = CONCAT('store_', `ownerId`) WHERE `storeId` IS NULL;--> statement-breakpoint
UPDATE `commerceCarts` SET `storeId` = COALESCE((SELECT `p`.`storeId` FROM `commerceCartLines` AS `l` INNER JOIN `commerceVariants` AS `v` ON `l`.`variantId` = `v`.`id` INNER JOIN `commerceProducts` AS `p` ON `v`.`productId` = `p`.`id` WHERE `l`.`cartId` = `commerceCarts`.`id` LIMIT 1), (SELECT `id` FROM `commerceStores` ORDER BY `createdAt` ASC LIMIT 1)) WHERE `storeId` IS NULL;--> statement-breakpoint
UPDATE `commerceOrders` SET `storeId` = COALESCE((SELECT `p`.`storeId` FROM `commerceOrderLines` AS `l` INNER JOIN `commerceVariants` AS `v` ON `l`.`variantId` = `v`.`id` INNER JOIN `commerceProducts` AS `p` ON `v`.`productId` = `p`.`id` WHERE `l`.`orderId` = `commerceOrders`.`id` LIMIT 1), (SELECT `id` FROM `commerceStores` ORDER BY `createdAt` ASC LIMIT 1)) WHERE `storeId` IS NULL;--> statement-breakpoint
UPDATE `commercePromotions` SET `storeId` = (SELECT `id` FROM `commerceStores` ORDER BY `createdAt` ASC LIMIT 1) WHERE `storeId` IS NULL;--> statement-breakpoint
ALTER TABLE `commerceCarts` MODIFY `storeId` varchar(64) NOT NULL;--> statement-breakpoint
ALTER TABLE `commerceOrders` MODIFY `storeId` varchar(64) NOT NULL;--> statement-breakpoint
ALTER TABLE `commerceProducts` MODIFY `storeId` varchar(64) NOT NULL;--> statement-breakpoint
ALTER TABLE `commercePromotions` MODIFY `storeId` varchar(64) NOT NULL;--> statement-breakpoint
ALTER TABLE `commerceCarts` ADD CONSTRAINT `commerceStoreCartSessionKeyUnique` UNIQUE(`storeId`,`sessionKey`);--> statement-breakpoint
ALTER TABLE `commerceProducts` ADD CONSTRAINT `commerceStoreProductHandleUnique` UNIQUE(`storeId`,`handle`);--> statement-breakpoint
ALTER TABLE `commercePromotions` ADD CONSTRAINT `commerceStorePromotionCodeUnique` UNIQUE(`storeId`,`code`);--> statement-breakpoint
ALTER TABLE `commerceExtensions` ADD CONSTRAINT `commerceExtensions_storeId_commerceStores_id_fk` FOREIGN KEY (`storeId`) REFERENCES `commerceStores`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `commercePageSections` ADD CONSTRAINT `commercePageSections_pageId_commercePages_id_fk` FOREIGN KEY (`pageId`) REFERENCES `commercePages`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `commercePages` ADD CONSTRAINT `commercePages_storeId_commerceStores_id_fk` FOREIGN KEY (`storeId`) REFERENCES `commerceStores`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `commerceStoreMembers` ADD CONSTRAINT `commerceStoreMembers_storeId_commerceStores_id_fk` FOREIGN KEY (`storeId`) REFERENCES `commerceStores`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `commerceStoreMembers` ADD CONSTRAINT `commerceStoreMembers_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `commerceStores` ADD CONSTRAINT `commerceStores_workspaceId_commerceWorkspaces_id_fk` FOREIGN KEY (`workspaceId`) REFERENCES `commerceWorkspaces`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `commerceThemes` ADD CONSTRAINT `commerceThemes_storeId_commerceStores_id_fk` FOREIGN KEY (`storeId`) REFERENCES `commerceStores`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `commerceWorkspaces` ADD CONSTRAINT `commerceWorkspaces_ownerId_users_id_fk` FOREIGN KEY (`ownerId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `commerceExtensionStoreIdx` ON `commerceExtensions` (`storeId`);--> statement-breakpoint
CREATE INDEX `commerceSectionPageIdx` ON `commercePageSections` (`pageId`);--> statement-breakpoint
CREATE INDEX `commercePageStoreIdx` ON `commercePages` (`storeId`);--> statement-breakpoint
CREATE INDEX `commerceStoreMemberUserIdx` ON `commerceStoreMembers` (`userId`);--> statement-breakpoint
CREATE INDEX `commerceStoreWorkspaceIdx` ON `commerceStores` (`workspaceId`);--> statement-breakpoint
CREATE INDEX `commerceThemeStoreIdx` ON `commerceThemes` (`storeId`);--> statement-breakpoint
CREATE INDEX `commerceWorkspaceOwnerIdx` ON `commerceWorkspaces` (`ownerId`);--> statement-breakpoint
ALTER TABLE `commerceCarts` ADD CONSTRAINT `commerceCarts_storeId_commerceStores_id_fk` FOREIGN KEY (`storeId`) REFERENCES `commerceStores`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `commerceOrders` ADD CONSTRAINT `commerceOrders_storeId_commerceStores_id_fk` FOREIGN KEY (`storeId`) REFERENCES `commerceStores`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `commerceProducts` ADD CONSTRAINT `commerceProducts_storeId_commerceStores_id_fk` FOREIGN KEY (`storeId`) REFERENCES `commerceStores`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `commercePromotions` ADD CONSTRAINT `commercePromotions_storeId_commerceStores_id_fk` FOREIGN KEY (`storeId`) REFERENCES `commerceStores`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `commerceStoreCartStatusUpdatedIdx` ON `commerceCarts` (`storeId`,`status`,`updatedAt`);--> statement-breakpoint
CREATE INDEX `commerceOrderStoreCustomerIdx` ON `commerceOrders` (`storeId`,`customerId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `commerceOrderStoreStatusIdx` ON `commerceOrders` (`storeId`,`status`,`createdAt`);--> statement-breakpoint
CREATE INDEX `commerceProductStoreStatusCategoryIdx` ON `commerceProducts` (`storeId`,`status`,`category`);--> statement-breakpoint
CREATE INDEX `commerceStorePromotionActiveIdx` ON `commercePromotions` (`storeId`,`active`);
