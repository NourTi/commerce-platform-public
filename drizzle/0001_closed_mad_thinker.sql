CREATE TABLE `commerceCartLines` (
	`id` varchar(64) NOT NULL,
	`cartId` varchar(64) NOT NULL,
	`variantId` varchar(64) NOT NULL,
	`quantity` int NOT NULL,
	`unitPriceCents` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `commerceCartLines_id` PRIMARY KEY(`id`),
	CONSTRAINT `commerceCartVariantUnique` UNIQUE(`cartId`,`variantId`)
);
--> statement-breakpoint
CREATE TABLE `commerceCarts` (
	`id` varchar(64) NOT NULL,
	`sessionKey` varchar(128) NOT NULL,
	`status` enum('OPEN','CONVERTED','ABANDONED') NOT NULL DEFAULT 'OPEN',
	`promotionCode` varchar(64),
	`currency` varchar(3) NOT NULL DEFAULT 'USD',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `commerceCarts_id` PRIMARY KEY(`id`),
	CONSTRAINT `commerceCartSessionKeyUnique` UNIQUE(`sessionKey`)
);
--> statement-breakpoint
CREATE TABLE `commerceOrderLines` (
	`id` varchar(64) NOT NULL,
	`orderId` varchar(64) NOT NULL,
	`variantId` varchar(64) NOT NULL,
	`title` varchar(255) NOT NULL,
	`sku` varchar(128) NOT NULL,
	`quantity` int NOT NULL,
	`unitPriceCents` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `commerceOrderLines_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `commerceOrders` (
	`id` varchar(64) NOT NULL,
	`orderNumber` varchar(64) NOT NULL,
	`customerId` int NOT NULL,
	`email` varchar(320) NOT NULL,
	`status` enum('PENDING_PAYMENT','CONFIRMED','FULFILLED','CANCELLED') NOT NULL DEFAULT 'PENDING_PAYMENT',
	`currency` varchar(3) NOT NULL DEFAULT 'USD',
	`subtotalCents` int NOT NULL,
	`discountCents` int NOT NULL DEFAULT 0,
	`shippingCents` int NOT NULL DEFAULT 0,
	`totalCents` int NOT NULL,
	`promotionCode` varchar(64),
	`shippingMethod` varchar(32) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `commerceOrders_id` PRIMARY KEY(`id`),
	CONSTRAINT `commerceOrderNumberUnique` UNIQUE(`orderNumber`)
);
--> statement-breakpoint
CREATE TABLE `commerceProducts` (
	`id` varchar(64) NOT NULL,
	`handle` varchar(128) NOT NULL,
	`title` varchar(255) NOT NULL,
	`subtitle` varchar(255) NOT NULL,
	`description` text NOT NULL,
	`category` varchar(64) NOT NULL,
	`status` enum('DRAFT','PUBLISHED','ARCHIVED') NOT NULL DEFAULT 'DRAFT',
	`ownerId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `commerceProducts_id` PRIMARY KEY(`id`),
	CONSTRAINT `commerceProductHandleUnique` UNIQUE(`handle`)
);
--> statement-breakpoint
CREATE TABLE `commercePromotions` (
	`id` varchar(64) NOT NULL,
	`code` varchar(64) NOT NULL,
	`type` enum('PERCENT','FIXED') NOT NULL,
	`value` int NOT NULL,
	`minSubtotalCents` int NOT NULL DEFAULT 0,
	`active` boolean NOT NULL DEFAULT true,
	`startsAt` timestamp,
	`endsAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `commercePromotions_id` PRIMARY KEY(`id`),
	CONSTRAINT `commercePromotionCodeUnique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `commerceVariants` (
	`id` varchar(64) NOT NULL,
	`productId` varchar(64) NOT NULL,
	`sku` varchar(128) NOT NULL,
	`title` varchar(255) NOT NULL,
	`priceCents` int NOT NULL,
	`compareAtCents` int,
	`inventoryQty` int NOT NULL DEFAULT 0,
	`options` json NOT NULL,
	`isDefault` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `commerceVariants_id` PRIMARY KEY(`id`),
	CONSTRAINT `commerceVariantSkuUnique` UNIQUE(`sku`)
);
--> statement-breakpoint
ALTER TABLE `commerceCartLines` ADD CONSTRAINT `commerceCartLines_cartId_commerceCarts_id_fk` FOREIGN KEY (`cartId`) REFERENCES `commerceCarts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `commerceCartLines` ADD CONSTRAINT `commerceCartLines_variantId_commerceVariants_id_fk` FOREIGN KEY (`variantId`) REFERENCES `commerceVariants`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `commerceOrderLines` ADD CONSTRAINT `commerceOrderLines_orderId_commerceOrders_id_fk` FOREIGN KEY (`orderId`) REFERENCES `commerceOrders`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `commerceOrderLines` ADD CONSTRAINT `commerceOrderLines_variantId_commerceVariants_id_fk` FOREIGN KEY (`variantId`) REFERENCES `commerceVariants`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `commerceOrders` ADD CONSTRAINT `commerceOrders_customerId_users_id_fk` FOREIGN KEY (`customerId`) REFERENCES `users`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `commerceProducts` ADD CONSTRAINT `commerceProducts_ownerId_users_id_fk` FOREIGN KEY (`ownerId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `commerceVariants` ADD CONSTRAINT `commerceVariants_productId_commerceProducts_id_fk` FOREIGN KEY (`productId`) REFERENCES `commerceProducts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `commerceCartLineCartIdx` ON `commerceCartLines` (`cartId`);--> statement-breakpoint
CREATE INDEX `commerceCartStatusUpdatedIdx` ON `commerceCarts` (`status`,`updatedAt`);--> statement-breakpoint
CREATE INDEX `commerceOrderLineOrderIdx` ON `commerceOrderLines` (`orderId`);--> statement-breakpoint
CREATE INDEX `commerceOrderCustomerIdx` ON `commerceOrders` (`customerId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `commerceOrderStatusIdx` ON `commerceOrders` (`status`,`createdAt`);--> statement-breakpoint
CREATE INDEX `commerceProductStatusCategoryIdx` ON `commerceProducts` (`status`,`category`);--> statement-breakpoint
CREATE INDEX `commerceProductOwnerIdx` ON `commerceProducts` (`ownerId`);--> statement-breakpoint
CREATE INDEX `commercePromotionActiveIdx` ON `commercePromotions` (`active`);--> statement-breakpoint
CREATE INDEX `commerceVariantProductIdx` ON `commerceVariants` (`productId`);