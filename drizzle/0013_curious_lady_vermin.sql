CREATE TABLE `commerceStoreDataPolicies` (
	`storeId` varchar(64) NOT NULL,
	`customerDataRetentionDays` int,
	`orderRecordRetentionDays` int,
	`auditRecordRetentionDays` int,
	`policyReference` varchar(255),
	`recoveryProcedureReference` varchar(255),
	`lastRecoveryTestedAt` timestamp,
	`legalReviewAcknowledged` boolean NOT NULL DEFAULT false,
	`notes` varchar(1000),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `commerceStoreDataPolicies_storeId` PRIMARY KEY(`storeId`)
);
--> statement-breakpoint
ALTER TABLE `commerceStoreDataPolicies` ADD CONSTRAINT `commerceStoreDataPolicies_storeId_commerceStores_id_fk` FOREIGN KEY (`storeId`) REFERENCES `commerceStores`(`id`) ON DELETE cascade ON UPDATE no action;