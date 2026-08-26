CREATE TABLE `commerceAuditEvents` (
	`id` varchar(64) NOT NULL,
	`storeId` varchar(64) NOT NULL,
	`actorUserId` int,
	`actorType` enum('MERCHANT','CUSTOMER','SYSTEM','PROVIDER') NOT NULL,
	`action` varchar(128) NOT NULL,
	`entityType` varchar(64) NOT NULL,
	`entityId` varchar(64) NOT NULL,
	`data` json NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `commerceAuditEvents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `commerceCustomerAddresses` (
	`id` varchar(64) NOT NULL,
	`customerId` varchar(64) NOT NULL,
	`type` enum('SHIPPING','BILLING','BOTH') NOT NULL DEFAULT 'BOTH',
	`label` varchar(128),
	`firstName` varchar(128) NOT NULL,
	`lastName` varchar(128) NOT NULL,
	`company` varchar(255),
	`line1` varchar(255) NOT NULL,
	`line2` varchar(255),
	`city` varchar(128) NOT NULL,
	`region` varchar(128),
	`postalCode` varchar(32),
	`countryCode` varchar(2) NOT NULL DEFAULT 'DZ',
	`phone` varchar(64),
	`isDefault` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `commerceCustomerAddresses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `commerceCustomerAuthTokens` (
	`id` varchar(64) NOT NULL,
	`customerId` varchar(64) NOT NULL,
	`type` enum('SIGN_IN','VERIFY_EMAIL','PASSWORD_RESET') NOT NULL,
	`tokenHash` varchar(128) NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`consumedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `commerceCustomerAuthTokens_id` PRIMARY KEY(`id`),
	CONSTRAINT `commerceCustomerAuthTokenHashUnique` UNIQUE(`tokenHash`)
);
--> statement-breakpoint
CREATE TABLE `commerceCustomers` (
	`id` varchar(64) NOT NULL,
	`storeId` varchar(64) NOT NULL,
	`userId` int,
	`email` varchar(320) NOT NULL,
	`phone` varchar(64),
	`firstName` varchar(128),
	`lastName` varchar(128),
	`status` enum('GUEST','REGISTERED','BLOCKED') NOT NULL DEFAULT 'GUEST',
	`preferredLocale` varchar(8) NOT NULL DEFAULT 'ar',
	`emailVerifiedAt` timestamp,
	`marketingConsentAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `commerceCustomers_id` PRIMARY KEY(`id`),
	CONSTRAINT `commerceCustomerStoreEmailUnique` UNIQUE(`storeId`,`email`)
);
--> statement-breakpoint
CREATE TABLE `commerceDeliveryRates` (
	`id` varchar(64) NOT NULL,
	`zoneId` varchar(64) NOT NULL,
	`name` varchar(128) NOT NULL,
	`methodCode` varchar(64) NOT NULL,
	`amountCents` int NOT NULL,
	`minSubtotalCents` int NOT NULL DEFAULT 0,
	`maxSubtotalCents` int,
	`codAvailable` boolean NOT NULL DEFAULT true,
	`estimatedMinDays` int,
	`estimatedMaxDays` int,
	`active` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `commerceDeliveryRates_id` PRIMARY KEY(`id`),
	CONSTRAINT `commerceDeliveryRateZoneMethodUnique` UNIQUE(`zoneId`,`methodCode`)
);
--> statement-breakpoint
CREATE TABLE `commerceDeliveryZones` (
	`id` varchar(64) NOT NULL,
	`storeId` varchar(64) NOT NULL,
	`name` varchar(128) NOT NULL,
	`countryCode` varchar(2) NOT NULL DEFAULT 'DZ',
	`regions` json NOT NULL,
	`enabled` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `commerceDeliveryZones_id` PRIMARY KEY(`id`),
	CONSTRAINT `commerceDeliveryZoneStoreNameUnique` UNIQUE(`storeId`,`name`)
);
--> statement-breakpoint
CREATE TABLE `commerceFulfillments` (
	`id` varchar(64) NOT NULL,
	`orderId` varchar(64) NOT NULL,
	`storeId` varchar(64) NOT NULL,
	`status` enum('UNFULFILLED','PARTIALLY_FULFILLED','FULFILLED','CANCELLED','RETURNED') NOT NULL DEFAULT 'UNFULFILLED',
	`cashSettlementStatus` enum('NOT_APPLICABLE','EXPECTED','COLLECTED_BY_CARRIER','REMITTED_TO_MERCHANT','FAILED_DELIVERY','RETURNED_TO_SENDER','DISPUTED') NOT NULL DEFAULT 'NOT_APPLICABLE',
	`notes` text,
	`fulfilledAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `commerceFulfillments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `commerceNotifications` (
	`id` varchar(64) NOT NULL,
	`storeId` varchar(64) NOT NULL,
	`customerId` varchar(64),
	`orderId` varchar(64),
	`channel` enum('EMAIL','SMS') NOT NULL,
	`type` varchar(128) NOT NULL,
	`recipient` varchar(320) NOT NULL,
	`status` enum('QUEUED','SENT','DELIVERED','FAILED','SUPPRESSED') NOT NULL DEFAULT 'QUEUED',
	`providerMessageId` varchar(191),
	`locale` varchar(8) NOT NULL DEFAULT 'ar',
	`payload` json NOT NULL,
	`sentAt` timestamp,
	`deliveredAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `commerceNotifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `commercePaymentAttempts` (
	`id` varchar(64) NOT NULL,
	`orderId` varchar(64) NOT NULL,
	`storeId` varchar(64) NOT NULL,
	`provider` enum('CASH_ON_DELIVERY','BANK_TRANSFER','CHARGILY_PAY','MANUAL') NOT NULL,
	`method` varchar(64) NOT NULL,
	`status` enum('PENDING','PROCESSING','PAID','FAILED','CANCELED','AWAITING_REVIEW','EXPIRED','REFUNDED','PARTIALLY_REFUNDED') NOT NULL DEFAULT 'PENDING',
	`amountCents` int NOT NULL,
	`currency` varchar(3) NOT NULL,
	`externalCheckoutId` varchar(191),
	`externalPaymentId` varchar(191),
	`checkoutUrl` varchar(1024),
	`idempotencyKey` varchar(191) NOT NULL,
	`metadata` json NOT NULL,
	`paidAt` timestamp,
	`expiresAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `commercePaymentAttempts_id` PRIMARY KEY(`id`),
	CONSTRAINT `commercePaymentAttemptIdempotencyUnique` UNIQUE(`idempotencyKey`),
	CONSTRAINT `commercePaymentAttemptProviderExternalUnique` UNIQUE(`provider`,`externalCheckoutId`)
);
--> statement-breakpoint
CREATE TABLE `commercePaymentEvents` (
	`id` varchar(64) NOT NULL,
	`storeId` varchar(64) NOT NULL,
	`paymentAttemptId` varchar(64),
	`provider` enum('CASH_ON_DELIVERY','BANK_TRANSFER','CHARGILY_PAY','MANUAL') NOT NULL,
	`externalEventId` varchar(191) NOT NULL,
	`type` varchar(128) NOT NULL,
	`signatureStatus` enum('VERIFIED','REJECTED','NOT_APPLICABLE') NOT NULL DEFAULT 'NOT_APPLICABLE',
	`processingStatus` enum('RECEIVED','PROCESSED','IGNORED','FAILED') NOT NULL DEFAULT 'RECEIVED',
	`payload` json NOT NULL,
	`payloadDigest` varchar(128) NOT NULL,
	`errorMessage` text,
	`processedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `commercePaymentEvents_id` PRIMARY KEY(`id`),
	CONSTRAINT `commercePaymentEventStoreProviderExternalUnique` UNIQUE(`storeId`,`provider`,`externalEventId`)
);
--> statement-breakpoint
CREATE TABLE `commercePaymentProviders` (
	`id` varchar(64) NOT NULL,
	`storeId` varchar(64) NOT NULL,
	`provider` enum('CASH_ON_DELIVERY','BANK_TRANSFER','CHARGILY_PAY','MANUAL') NOT NULL,
	`status` enum('DISABLED','TEST','ACTIVE','ERROR') NOT NULL DEFAULT 'DISABLED',
	`displayName` varchar(128) NOT NULL,
	`configuration` json NOT NULL,
	`credentialReference` varchar(128),
	`webhookSecretReference` varchar(128),
	`lastCheckedAt` timestamp,
	`lastError` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `commercePaymentProviders_id` PRIMARY KEY(`id`),
	CONSTRAINT `commercePaymentProviderStoreTypeUnique` UNIQUE(`storeId`,`provider`)
);
--> statement-breakpoint
CREATE TABLE `commerceRefunds` (
	`id` varchar(64) NOT NULL,
	`orderId` varchar(64) NOT NULL,
	`storeId` varchar(64) NOT NULL,
	`paymentAttemptId` varchar(64),
	`returnId` varchar(64),
	`status` enum('PENDING','SUCCEEDED','FAILED','CANCELED','MANUAL_REVIEW') NOT NULL DEFAULT 'PENDING',
	`amountCents` int NOT NULL,
	`currency` varchar(3) NOT NULL,
	`reason` varchar(128) NOT NULL,
	`externalRefundId` varchar(191),
	`initiatedByUserId` int,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `commerceRefunds_id` PRIMARY KEY(`id`),
	CONSTRAINT `commerceRefundProviderExternalUnique` UNIQUE(`externalRefundId`)
);
--> statement-breakpoint
CREATE TABLE `commerceReturns` (
	`id` varchar(64) NOT NULL,
	`orderId` varchar(64) NOT NULL,
	`storeId` varchar(64) NOT NULL,
	`status` enum('REQUESTED','APPROVED','REJECTED','RECEIVED','CLOSED','CANCELLED') NOT NULL DEFAULT 'REQUESTED',
	`reason` varchar(128) NOT NULL,
	`customerNote` text,
	`merchantNote` text,
	`requestedAt` timestamp NOT NULL DEFAULT (now()),
	`resolvedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `commerceReturns_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `commerceShipmentEvents` (
	`id` varchar(64) NOT NULL,
	`shipmentId` varchar(64) NOT NULL,
	`externalEventId` varchar(191),
	`status` varchar(64) NOT NULL,
	`occurredAt` timestamp NOT NULL,
	`details` json NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `commerceShipmentEvents_id` PRIMARY KEY(`id`),
	CONSTRAINT `commerceShipmentEventShipmentExternalUnique` UNIQUE(`shipmentId`,`externalEventId`)
);
--> statement-breakpoint
CREATE TABLE `commerceShipments` (
	`id` varchar(64) NOT NULL,
	`fulfillmentId` varchar(64) NOT NULL,
	`provider` varchar(64) NOT NULL DEFAULT 'MANUAL',
	`externalShipmentId` varchar(191),
	`carrier` varchar(128),
	`serviceName` varchar(128),
	`trackingNumber` varchar(191),
	`trackingUrl` varchar(1024),
	`labelStorageKey` varchar(512),
	`status` enum('PENDING','LABEL_CREATED','IN_TRANSIT','OUT_FOR_DELIVERY','DELIVERED','FAILED','RETURNED','CANCELLED') NOT NULL DEFAULT 'PENDING',
	`cashDueCents` int NOT NULL DEFAULT 0,
	`cashRemittedCents` int NOT NULL DEFAULT 0,
	`shippedAt` timestamp,
	`deliveredAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `commerceShipments_id` PRIMARY KEY(`id`),
	CONSTRAINT `commerceShipmentProviderExternalUnique` UNIQUE(`provider`,`externalShipmentId`)
);
--> statement-breakpoint
CREATE TABLE `commerceStoreCommercialSettings` (
	`storeId` varchar(64) NOT NULL,
	`legalName` varchar(255),
	`businessEmail` varchar(320),
	`businessPhone` varchar(64),
	`countryCode` varchar(2) NOT NULL DEFAULT 'DZ',
	`taxRegistrationNumber` varchar(128),
	`taxEnabled` boolean NOT NULL DEFAULT false,
	`checkoutRequiresAccount` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `commerceStoreCommercialSettings_storeId` PRIMARY KEY(`storeId`)
);
--> statement-breakpoint
CREATE TABLE `commerceStorePlans` (
	`storeId` varchar(64) NOT NULL,
	`planKey` varchar(64) NOT NULL DEFAULT 'STARTER',
	`status` enum('TRIAL','ACTIVE','PAST_DUE','PAUSED','CANCELLED') NOT NULL DEFAULT 'TRIAL',
	`billingProvider` varchar(64),
	`externalSubscriptionId` varchar(191),
	`entitlementSnapshot` json NOT NULL,
	`currentPeriodEndsAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `commerceStorePlans_storeId` PRIMARY KEY(`storeId`)
);
--> statement-breakpoint
ALTER TABLE `commerceAuditEvents` ADD CONSTRAINT `commerceAuditEvents_storeId_commerceStores_id_fk` FOREIGN KEY (`storeId`) REFERENCES `commerceStores`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `commerceAuditEvents` ADD CONSTRAINT `commerceAuditEvents_actorUserId_users_id_fk` FOREIGN KEY (`actorUserId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `commerceCustomerAddresses` ADD CONSTRAINT `commerceCustomerAddresses_customerId_commerceCustomers_id_fk` FOREIGN KEY (`customerId`) REFERENCES `commerceCustomers`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `commerceCustomerAuthTokens` ADD CONSTRAINT `commerceCustomerAuthTokens_customerId_commerceCustomers_id_fk` FOREIGN KEY (`customerId`) REFERENCES `commerceCustomers`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `commerceCustomers` ADD CONSTRAINT `commerceCustomers_storeId_commerceStores_id_fk` FOREIGN KEY (`storeId`) REFERENCES `commerceStores`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `commerceCustomers` ADD CONSTRAINT `commerceCustomers_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `commerceDeliveryRates` ADD CONSTRAINT `commerceDeliveryRates_zoneId_commerceDeliveryZones_id_fk` FOREIGN KEY (`zoneId`) REFERENCES `commerceDeliveryZones`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `commerceDeliveryZones` ADD CONSTRAINT `commerceDeliveryZones_storeId_commerceStores_id_fk` FOREIGN KEY (`storeId`) REFERENCES `commerceStores`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `commerceFulfillments` ADD CONSTRAINT `commerceFulfillments_orderId_commerceOrders_id_fk` FOREIGN KEY (`orderId`) REFERENCES `commerceOrders`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `commerceFulfillments` ADD CONSTRAINT `commerceFulfillments_storeId_commerceStores_id_fk` FOREIGN KEY (`storeId`) REFERENCES `commerceStores`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `commerceNotifications` ADD CONSTRAINT `commerceNotifications_storeId_commerceStores_id_fk` FOREIGN KEY (`storeId`) REFERENCES `commerceStores`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `commerceNotifications` ADD CONSTRAINT `commerceNotifications_customerId_commerceCustomers_id_fk` FOREIGN KEY (`customerId`) REFERENCES `commerceCustomers`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `commerceNotifications` ADD CONSTRAINT `commerceNotifications_orderId_commerceOrders_id_fk` FOREIGN KEY (`orderId`) REFERENCES `commerceOrders`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `commercePaymentAttempts` ADD CONSTRAINT `commercePaymentAttempts_orderId_commerceOrders_id_fk` FOREIGN KEY (`orderId`) REFERENCES `commerceOrders`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `commercePaymentAttempts` ADD CONSTRAINT `commercePaymentAttempts_storeId_commerceStores_id_fk` FOREIGN KEY (`storeId`) REFERENCES `commerceStores`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `commercePaymentEvents` ADD CONSTRAINT `commercePaymentEvents_storeId_commerceStores_id_fk` FOREIGN KEY (`storeId`) REFERENCES `commerceStores`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `commercePaymentEvents` ADD CONSTRAINT `cpe_payment_attempt_fk` FOREIGN KEY (`paymentAttemptId`) REFERENCES `commercePaymentAttempts`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `commercePaymentProviders` ADD CONSTRAINT `commercePaymentProviders_storeId_commerceStores_id_fk` FOREIGN KEY (`storeId`) REFERENCES `commerceStores`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `commerceRefunds` ADD CONSTRAINT `commerceRefunds_orderId_commerceOrders_id_fk` FOREIGN KEY (`orderId`) REFERENCES `commerceOrders`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `commerceRefunds` ADD CONSTRAINT `commerceRefunds_storeId_commerceStores_id_fk` FOREIGN KEY (`storeId`) REFERENCES `commerceStores`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `commerceRefunds` ADD CONSTRAINT `commerceRefunds_paymentAttemptId_commercePaymentAttempts_id_fk` FOREIGN KEY (`paymentAttemptId`) REFERENCES `commercePaymentAttempts`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `commerceRefunds` ADD CONSTRAINT `commerceRefunds_returnId_commerceReturns_id_fk` FOREIGN KEY (`returnId`) REFERENCES `commerceReturns`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `commerceRefunds` ADD CONSTRAINT `commerceRefunds_initiatedByUserId_users_id_fk` FOREIGN KEY (`initiatedByUserId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `commerceReturns` ADD CONSTRAINT `commerceReturns_orderId_commerceOrders_id_fk` FOREIGN KEY (`orderId`) REFERENCES `commerceOrders`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `commerceReturns` ADD CONSTRAINT `commerceReturns_storeId_commerceStores_id_fk` FOREIGN KEY (`storeId`) REFERENCES `commerceStores`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `commerceShipmentEvents` ADD CONSTRAINT `commerceShipmentEvents_shipmentId_commerceShipments_id_fk` FOREIGN KEY (`shipmentId`) REFERENCES `commerceShipments`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `commerceShipments` ADD CONSTRAINT `commerceShipments_fulfillmentId_commerceFulfillments_id_fk` FOREIGN KEY (`fulfillmentId`) REFERENCES `commerceFulfillments`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `commerceStoreCommercialSettings` ADD CONSTRAINT `commerceStoreCommercialSettings_storeId_commerceStores_id_fk` FOREIGN KEY (`storeId`) REFERENCES `commerceStores`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `commerceStorePlans` ADD CONSTRAINT `commerceStorePlans_storeId_commerceStores_id_fk` FOREIGN KEY (`storeId`) REFERENCES `commerceStores`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `commerceAuditStoreEntityIdx` ON `commerceAuditEvents` (`storeId`,`entityType`,`entityId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `commerceAuditActorIdx` ON `commerceAuditEvents` (`actorUserId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `commerceCustomerAddressCustomerIdx` ON `commerceCustomerAddresses` (`customerId`,`isDefault`);--> statement-breakpoint
CREATE INDEX `commerceCustomerAuthCustomerTypeIdx` ON `commerceCustomerAuthTokens` (`customerId`,`type`,`expiresAt`);--> statement-breakpoint
CREATE INDEX `commerceCustomerStoreUserIdx` ON `commerceCustomers` (`storeId`,`userId`);--> statement-breakpoint
CREATE INDEX `commerceDeliveryRateZoneActiveIdx` ON `commerceDeliveryRates` (`zoneId`,`active`);--> statement-breakpoint
CREATE INDEX `commerceDeliveryZoneStoreEnabledIdx` ON `commerceDeliveryZones` (`storeId`,`enabled`);--> statement-breakpoint
CREATE INDEX `commerceFulfillmentStoreStatusIdx` ON `commerceFulfillments` (`storeId`,`status`,`createdAt`);--> statement-breakpoint
CREATE INDEX `commerceFulfillmentOrderIdx` ON `commerceFulfillments` (`orderId`);--> statement-breakpoint
CREATE INDEX `commerceNotificationStoreStatusIdx` ON `commerceNotifications` (`storeId`,`status`,`createdAt`);--> statement-breakpoint
CREATE INDEX `commerceNotificationCustomerIdx` ON `commerceNotifications` (`customerId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `commerceNotificationProviderMessageIdx` ON `commerceNotifications` (`providerMessageId`);--> statement-breakpoint
CREATE INDEX `commercePaymentAttemptOrderIdx` ON `commercePaymentAttempts` (`orderId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `commercePaymentAttemptStoreStatusIdx` ON `commercePaymentAttempts` (`storeId`,`status`,`createdAt`);--> statement-breakpoint
CREATE INDEX `commercePaymentEventAttemptIdx` ON `commercePaymentEvents` (`paymentAttemptId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `commercePaymentEventStoreStatusIdx` ON `commercePaymentEvents` (`storeId`,`processingStatus`,`createdAt`);--> statement-breakpoint
CREATE INDEX `commercePaymentProviderStoreStatusIdx` ON `commercePaymentProviders` (`storeId`,`status`);--> statement-breakpoint
CREATE INDEX `commerceRefundOrderIdx` ON `commerceRefunds` (`orderId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `commerceRefundStoreStatusIdx` ON `commerceRefunds` (`storeId`,`status`,`createdAt`);--> statement-breakpoint
CREATE INDEX `commerceReturnStoreStatusIdx` ON `commerceReturns` (`storeId`,`status`,`createdAt`);--> statement-breakpoint
CREATE INDEX `commerceReturnOrderIdx` ON `commerceReturns` (`orderId`);--> statement-breakpoint
CREATE INDEX `commerceShipmentEventShipmentOccurredIdx` ON `commerceShipmentEvents` (`shipmentId`,`occurredAt`);--> statement-breakpoint
CREATE INDEX `commerceShipmentFulfillmentIdx` ON `commerceShipments` (`fulfillmentId`);--> statement-breakpoint
CREATE INDEX `commerceShipmentTrackingIdx` ON `commerceShipments` (`trackingNumber`);--> statement-breakpoint
CREATE INDEX `commerceStorePlanProviderIdx` ON `commerceStorePlans` (`billingProvider`,`externalSubscriptionId`);
