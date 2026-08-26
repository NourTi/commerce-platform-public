CREATE TABLE `commerceProductMedia` (
	`id` varchar(64) NOT NULL,
	`productId` varchar(64) NOT NULL,
	`variantId` varchar(64),
	`kind` enum('GALLERY','HOVER') NOT NULL DEFAULT 'GALLERY',
	`storageKey` varchar(512) NOT NULL,
	`url` varchar(1024) NOT NULL,
	`altText` varchar(255) NOT NULL,
	`sortOrder` int NOT NULL DEFAULT 0,
	`cropX` int NOT NULL DEFAULT 50,
	`cropY` int NOT NULL DEFAULT 50,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `commerceProductMedia_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `commerceProductMedia` ADD CONSTRAINT `commerceProductMedia_productId_commerceProducts_id_fk` FOREIGN KEY (`productId`) REFERENCES `commerceProducts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `commerceProductMedia` ADD CONSTRAINT `commerceProductMedia_variantId_commerceVariants_id_fk` FOREIGN KEY (`variantId`) REFERENCES `commerceVariants`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `commerceProductMediaProductIdx` ON `commerceProductMedia` (`productId`,`sortOrder`);--> statement-breakpoint
CREATE INDEX `commerceProductMediaVariantIdx` ON `commerceProductMedia` (`variantId`);