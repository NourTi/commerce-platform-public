CREATE TABLE `commercePrivacyRequests` (
	`id` varchar(64) NOT NULL,
	`userId` int NOT NULL,
	`type` enum('EXPORT','ERASURE') NOT NULL,
	`status` enum('REQUESTED','UNDER_REVIEW','COMPLETED','REJECTED') NOT NULL DEFAULT 'REQUESTED',
	`note` varchar(1000),
	`resolution` varchar(1000),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `commercePrivacyRequests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `commercePrivacyRequests` ADD CONSTRAINT `commercePrivacyRequests_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `commercePrivacyRequestUserStatusIdx` ON `commercePrivacyRequests` (`userId`,`status`,`createdAt`);