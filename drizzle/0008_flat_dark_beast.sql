CREATE TABLE `commerceInventoryMovements` (
	`id` varchar(64) NOT NULL,
	`storeId` varchar(64) NOT NULL,
	`variantId` varchar(64) NOT NULL,
	`delta` int NOT NULL,
	`reason` enum('MANUAL_ADJUSTMENT','ORDER_RESERVATION','ORDER_CANCELLATION','RETURN_RESTOCK','IMPORT') NOT NULL,
	`referenceType` varchar(64),
	`referenceId` varchar(64),
	`actorUserId` int,
	`note` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `commerceInventoryMovements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `commerceVariants` ADD `barcode` varchar(128);--> statement-breakpoint
ALTER TABLE `commerceInventoryMovements` ADD CONSTRAINT `commerceInventoryMovements_storeId_commerceStores_id_fk` FOREIGN KEY (`storeId`) REFERENCES `commerceStores`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `commerceInventoryMovements` ADD CONSTRAINT `commerceInventoryMovements_variantId_commerceVariants_id_fk` FOREIGN KEY (`variantId`) REFERENCES `commerceVariants`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `commerceInventoryMovements` ADD CONSTRAINT `commerceInventoryMovements_actorUserId_users_id_fk` FOREIGN KEY (`actorUserId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `commerceInventoryMovementStoreVariantCreatedIdx` ON `commerceInventoryMovements` (`storeId`,`variantId`,`createdAt`);