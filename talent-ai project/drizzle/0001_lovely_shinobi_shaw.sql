CREATE TABLE `achievements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`candidateId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` longtext,
	`date` varchar(10),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `achievements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `activity` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`activityType` varchar(100) NOT NULL,
	`description` text,
	`candidateId` int,
	`jobId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `activity_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `analytics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`totalCandidates` int NOT NULL DEFAULT 0,
	`totalJobs` int NOT NULL DEFAULT 0,
	`aiMatches` int NOT NULL DEFAULT 0,
	`interviews` int NOT NULL DEFAULT 0,
	`hiringRate` decimal(5,2) DEFAULT '0',
	`topSkills` json,
	`candidateDistribution` json,
	`experienceDistribution` json,
	`hiringFunnel` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `analytics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `candidates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`firstName` varchar(255) NOT NULL,
	`lastName` varchar(255) NOT NULL,
	`email` varchar(320) NOT NULL,
	`phone` varchar(20),
	`location` varchar(255),
	`summary` longtext,
	`status` enum('new','reviewed','shortlisted','rejected','hired') NOT NULL DEFAULT 'new',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `candidates_id` PRIMARY KEY(`id`),
	CONSTRAINT `candidates_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `certifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`candidateId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`issuer` varchar(255),
	`issueDate` varchar(10),
	`expiryDate` varchar(10),
	`credentialUrl` varchar(512),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `certifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `education` (
	`id` int AUTO_INCREMENT NOT NULL,
	`candidateId` int NOT NULL,
	`institution` varchar(255) NOT NULL,
	`degree` varchar(255) NOT NULL,
	`fieldOfStudy` varchar(255),
	`startDate` varchar(10),
	`endDate` varchar(10),
	`grade` varchar(10),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `education_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `experience` (
	`id` int AUTO_INCREMENT NOT NULL,
	`candidateId` int NOT NULL,
	`company` varchar(255) NOT NULL,
	`position` varchar(255) NOT NULL,
	`description` longtext,
	`startDate` varchar(10),
	`endDate` varchar(10),
	`isCurrent` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `experience_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `jobs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` longtext NOT NULL,
	`requirements` longtext,
	`location` varchar(255),
	`status` enum('draft','published','closed') NOT NULL DEFAULT 'draft',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `jobs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `languages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`candidateId` int NOT NULL,
	`language` varchar(255) NOT NULL,
	`proficiency` enum('beginner','intermediate','advanced','fluent','native') DEFAULT 'intermediate',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `languages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `projects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`candidateId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` longtext,
	`technologies` json,
	`url` varchar(512),
	`startDate` varchar(10),
	`endDate` varchar(10),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `projects_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rankings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`jobId` int NOT NULL,
	`candidateId` int NOT NULL,
	`overallScore` decimal(5,2) NOT NULL,
	`skillsScore` decimal(5,2),
	`experienceScore` decimal(5,2),
	`projectsScore` decimal(5,2),
	`educationScore` decimal(5,2),
	`certificationsScore` decimal(5,2),
	`activityScore` decimal(5,2),
	`matchedSkills` json,
	`missingSkills` json,
	`explanation` longtext,
	`strengths` json,
	`weaknesses` json,
	`skillGaps` json,
	`interviewQuestions` json,
	`rank` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `rankings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `resumes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`candidateId` int NOT NULL,
	`fileName` varchar(255) NOT NULL,
	`fileUrl` text NOT NULL,
	`fileKey` varchar(512) NOT NULL,
	`parsedData` json,
	`isPrimary` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `resumes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `skills` (
	`id` int AUTO_INCREMENT NOT NULL,
	`candidateId` int NOT NULL,
	`skillName` varchar(255) NOT NULL,
	`proficiency` enum('beginner','intermediate','advanced','expert') DEFAULT 'intermediate',
	`yearsOfExperience` decimal(5,2),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `skills_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('user','admin','recruiter') NOT NULL DEFAULT 'recruiter';