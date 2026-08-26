CREATE TABLE `commerceSubscriptionInvoices` (
	`id` varchar(64) NOT NULL,
	`storeId` varchar(64) NOT NULL,
	`planKey` varchar(64) NOT NULL,
	`status` enum('PENDING_PAYMENT','AWAITING_REVIEW','PAID','VOID') NOT NULL DEFAULT 'PENDING_PAYMENT',
	`amountCents` int NOT NULL,
	`currency` varchar(3) NOT NULL DEFAULT 'DZD',
	`bankTransferReference` varchar(191),
	`dueAt` timestamp,
	`paidAt` timestamp,
	`metadata` json NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `commerceSubscriptionInvoices_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `commerceSubscriptionInvoices` ADD CONSTRAINT `commerceSubscriptionInvoices_storeId_commerceStores_id_fk` FOREIGN KEY (`storeId`) REFERENCES `commerceStores`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `commerceSubscriptionInvoiceStoreStatusIdx` ON `commerceSubscriptionInvoices` (`storeId`,`status`);--> statement-breakpoint
CREATE INDEX `commerceSubscriptionInvoiceDueIdx` ON `commerceSubscriptionInvoices` (`dueAt`);