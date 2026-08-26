CREATE TABLE `commerceTaxRates` (
	`id` varchar(64) NOT NULL,
	`storeId` varchar(64) NOT NULL,
	`name` varchar(128) NOT NULL,
	`countryCode` varchar(2) NOT NULL DEFAULT 'DZ',
	`regions` json NOT NULL,
	`rateBasisPoints` int NOT NULL,
	`appliesToShipping` boolean NOT NULL DEFAULT false,
	`active` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `commerceTaxRates_id` PRIMARY KEY(`id`),
	CONSTRAINT `commerceTaxRateStoreNameUnique` UNIQUE(`storeId`,`name`)
);
--> statement-breakpoint
ALTER TABLE `commerceOrders` MODIFY COLUMN `customerId` int;--> statement-breakpoint
ALTER TABLE `commerceOrders` ADD `customerProfileId` varchar(64);--> statement-breakpoint
ALTER TABLE `commerceOrders` ADD `paymentStatus` enum('PENDING','AWAITING_REVIEW','PAID','FAILED','CANCELED','REFUNDED','PARTIALLY_REFUNDED') DEFAULT 'PENDING' NOT NULL;--> statement-breakpoint
ALTER TABLE `commerceOrders` ADD `fulfillmentStatus` enum('UNFULFILLED','PARTIALLY_FULFILLED','FULFILLED','CANCELLED','RETURNED') DEFAULT 'UNFULFILLED' NOT NULL;--> statement-breakpoint
ALTER TABLE `commerceOrders` ADD `paymentMethod` varchar(64);--> statement-breakpoint
ALTER TABLE `commerceOrders` ADD `taxCents` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `commerceOrders` ADD `shippingAddressSnapshot` json;--> statement-breakpoint
ALTER TABLE `commerceOrders` ADD `billingAddressSnapshot` json;--> statement-breakpoint
ALTER TABLE `commerceOrders` ADD `taxLines` json;--> statement-breakpoint
UPDATE `commerceOrders` SET `taxLines` = JSON_ARRAY() WHERE `taxLines` IS NULL;--> statement-breakpoint
ALTER TABLE `commerceOrders` MODIFY COLUMN `taxLines` json NOT NULL;--> statement-breakpoint
ALTER TABLE `commerceOrders` ADD `placedAt` timestamp;--> statement-breakpoint
ALTER TABLE `commerceOrders` ADD `cancelledAt` timestamp;--> statement-breakpoint
ALTER TABLE `commerceTaxRates` ADD CONSTRAINT `commerceTaxRates_storeId_commerceStores_id_fk` FOREIGN KEY (`storeId`) REFERENCES `commerceStores`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `commerceTaxRateStoreActiveIdx` ON `commerceTaxRates` (`storeId`,`active`);--> statement-breakpoint
ALTER TABLE `commerceOrders` ADD CONSTRAINT `commerceOrders_customerProfileId_commerceCustomers_id_fk` FOREIGN KEY (`customerProfileId`) REFERENCES `commerceCustomers`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `commerceOrderStoreProfileIdx` ON `commerceOrders` (`storeId`,`customerProfileId`,`createdAt`);
