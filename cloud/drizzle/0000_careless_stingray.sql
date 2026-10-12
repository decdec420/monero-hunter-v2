CREATE TABLE `devices` (
	`id` text PRIMARY KEY NOT NULL,
	`payload` text NOT NULL,
	`received_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `ledger` (
	`id` text PRIMARY KEY NOT NULL,
	`kind` text NOT NULL,
	`cents` integer NOT NULL,
	`description` text NOT NULL,
	`reference` text NOT NULL,
	`occurred_at` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `ledger_reference_unique` ON `ledger` (`reference`);--> statement-breakpoint
CREATE TABLE `observations` (
	`bucket` integer PRIMARY KEY NOT NULL,
	`price` real NOT NULL,
	`network` real NOT NULL,
	`source_at` integer NOT NULL,
	`captured_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `plans` (
	`id` text PRIMARY KEY NOT NULL,
	`payload` text NOT NULL,
	`created_at` integer NOT NULL
);
