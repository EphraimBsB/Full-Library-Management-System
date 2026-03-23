-- Drop existing email_verifications table if it exists
DROP TABLE IF EXISTS `email_verifications`;

-- Recreate email_verifications table with proper structure
CREATE TABLE `email_verifications` (
  `id` varchar(36) NOT NULL,
  `token` varchar(255) NOT NULL,
  `expiresAt` datetime NOT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `verifiedAt` datetime DEFAULT NULL,
  `isVerified` tinyint(1) NOT NULL DEFAULT 0,
  `userId` varchar(36) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UQ_email_verifications_token` (`token`),
  KEY `IDX_email_verifications_userId` (`userId`),
  KEY `IDX_email_verifications_expiresAt` (`expiresAt`),
  KEY `IDX_email_verifications_isVerified` (`isVerified`),
  CONSTRAINT `FK_email_verifications_userId` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add composite indexes for better performance
CREATE INDEX `IDX_email_verifications_userId_verified` ON `email_verifications` (`userId`, `isVerified`);
CREATE INDEX `IDX_email_verifications_expiresAt_verified` ON `email_verifications` (`expiresAt`, `isVerified`);
