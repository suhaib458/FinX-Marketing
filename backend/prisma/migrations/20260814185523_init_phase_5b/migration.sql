-- CreateTable
CREATE TABLE `User` (
    `id` VARCHAR(36) NOT NULL,
    `externalAuthSubject` VARCHAR(191) NULL,
    `email` VARCHAR(320) NOT NULL,
    `name` VARCHAR(160) NOT NULL,
    `role` ENUM('USER', 'ADMIN') NOT NULL DEFAULT 'USER',
    `status` ENUM('ACTIVE', 'SUSPENDED') NOT NULL DEFAULT 'ACTIVE',
    `planCode` VARCHAR(50) NOT NULL DEFAULT 'free',
    `onboardingCompleted` BOOLEAN NOT NULL DEFAULT false,
    `locale` VARCHAR(10) NOT NULL DEFAULT 'ar',
    `timezone` VARCHAR(64) NOT NULL DEFAULT 'Asia/Amman',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    UNIQUE INDEX `User_externalAuthSubject_key`(`externalAuthSubject`),
    UNIQUE INDEX `User_email_key`(`email`),
    INDEX `User_status_deletedAt_idx`(`status`, `deletedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Brand` (
    `id` VARCHAR(36) NOT NULL,
    `userId` VARCHAR(36) NOT NULL,
    `businessName` VARCHAR(160) NOT NULL,
    `businessDescription` TEXT NULL,
    `category` VARCHAR(120) NULL,
    `targetAudience` TEXT NULL,
    `productService` VARCHAR(300) NULL,
    `productDescription` TEXT NULL,
    `price` DECIMAL(12, 3) NULL,
    `currency` CHAR(3) NOT NULL DEFAULT 'JOD',
    `website` VARCHAR(2048) NULL,
    `username` VARCHAR(191) NULL,
    `primaryColor` CHAR(7) NULL,
    `secondaryColor` CHAR(7) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    INDEX `Brand_userId_deletedAt_createdAt_idx`(`userId`, `deletedAt`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Asset` (
    `id` VARCHAR(36) NOT NULL,
    `userId` VARCHAR(36) NOT NULL,
    `brandId` VARCHAR(36) NULL,
    `type` ENUM('LOGO', 'PRODUCT_IMAGE', 'GENERATED_IMAGE', 'ANALYTICS_SCREENSHOT') NOT NULL,
    `status` ENUM('PENDING', 'READY', 'FAILED') NOT NULL DEFAULT 'PENDING',
    `storageKey` VARCHAR(512) NOT NULL,
    `publicUrl` VARCHAR(2048) NULL,
    `mimeType` VARCHAR(128) NOT NULL,
    `byteSize` BIGINT NOT NULL,
    `width` INTEGER NULL,
    `height` INTEGER NULL,
    `metadata` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    UNIQUE INDEX `Asset_storageKey_key`(`storageKey`),
    INDEX `Asset_userId_type_status_idx`(`userId`, `type`, `status`),
    INDEX `Asset_brandId_deletedAt_idx`(`brandId`, `deletedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CreditWallet` (
    `id` VARCHAR(36) NOT NULL,
    `userId` VARCHAR(36) NOT NULL,
    `balance` INTEGER NOT NULL DEFAULT 0,
    `version` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `CreditWallet_userId_key`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CreditLedger` (
    `id` VARCHAR(36) NOT NULL,
    `walletId` VARCHAR(36) NOT NULL,
    `userId` VARCHAR(36) NOT NULL,
    `direction` ENUM('CREDIT', 'DEBIT') NOT NULL,
    `type` ENUM('INITIAL_GRANT', 'RESERVATION', 'SETTLEMENT', 'REFUND', 'ADJUSTMENT') NOT NULL,
    `amount` INTEGER NOT NULL,
    `balanceAfter` INTEGER NOT NULL,
    `idempotencyKey` VARCHAR(191) NOT NULL,
    `description` VARCHAR(500) NULL,
    `referenceType` VARCHAR(100) NULL,
    `referenceId` VARCHAR(191) NULL,
    `metadata` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `CreditLedger_userId_createdAt_idx`(`userId`, `createdAt`),
    INDEX `CreditLedger_walletId_createdAt_idx`(`walletId`, `createdAt`),
    UNIQUE INDEX `CreditLedger_walletId_idempotencyKey_key`(`walletId`, `idempotencyKey`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `GenerationJob` (
    `id` VARCHAR(36) NOT NULL,
    `userId` VARCHAR(36) NOT NULL,
    `brandId` VARCHAR(36) NULL,
    `tool` ENUM('SOCIAL_POST', 'AD_DESIGN', 'CONTENT_IDEAS', 'CAMPAIGN') NOT NULL,
    `status` ENUM('QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED') NOT NULL DEFAULT 'QUEUED',
    `input` JSON NOT NULL,
    `modelIdentifier` VARCHAR(191) NULL,
    `providerRequestId` VARCHAR(191) NULL,
    `creditCost` INTEGER NOT NULL,
    `idempotencyKey` VARCHAR(191) NOT NULL,
    `errorCode` VARCHAR(100) NULL,
    `errorMessage` TEXT NULL,
    `startedAt` DATETIME(3) NULL,
    `completedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `GenerationJob_userId_status_createdAt_idx`(`userId`, `status`, `createdAt`),
    INDEX `GenerationJob_brandId_createdAt_idx`(`brandId`, `createdAt`),
    UNIQUE INDEX `GenerationJob_userId_idempotencyKey_key`(`userId`, `idempotencyKey`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `GeneratedContent` (
    `id` VARCHAR(36) NOT NULL,
    `userId` VARCHAR(36) NOT NULL,
    `brandId` VARCHAR(36) NULL,
    `generationJobId` VARCHAR(36) NOT NULL,
    `originalContentId` VARCHAR(36) NULL,
    `tool` ENUM('SOCIAL_POST', 'AD_DESIGN', 'CONTENT_IDEAS', 'CAMPAIGN') NOT NULL,
    `language` VARCHAR(10) NOT NULL,
    `platform` VARCHAR(80) NULL,
    `title` VARCHAR(300) NULL,
    `content` JSON NOT NULL,
    `submittedParameters` JSON NOT NULL,
    `savedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    INDEX `GeneratedContent_userId_deletedAt_createdAt_idx`(`userId`, `deletedAt`, `createdAt`),
    INDEX `GeneratedContent_userId_savedAt_createdAt_idx`(`userId`, `savedAt`, `createdAt`),
    INDEX `GeneratedContent_userId_tool_platform_createdAt_idx`(`userId`, `tool`, `platform`, `createdAt`),
    INDEX `GeneratedContent_brandId_createdAt_idx`(`brandId`, `createdAt`),
    INDEX `GeneratedContent_originalContentId_idx`(`originalContentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Brand` ADD CONSTRAINT `Brand_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Asset` ADD CONSTRAINT `Asset_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Asset` ADD CONSTRAINT `Asset_brandId_fkey` FOREIGN KEY (`brandId`) REFERENCES `Brand`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CreditWallet` ADD CONSTRAINT `CreditWallet_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CreditLedger` ADD CONSTRAINT `CreditLedger_walletId_fkey` FOREIGN KEY (`walletId`) REFERENCES `CreditWallet`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CreditLedger` ADD CONSTRAINT `CreditLedger_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `GenerationJob` ADD CONSTRAINT `GenerationJob_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `GenerationJob` ADD CONSTRAINT `GenerationJob_brandId_fkey` FOREIGN KEY (`brandId`) REFERENCES `Brand`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `GeneratedContent` ADD CONSTRAINT `GeneratedContent_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `GeneratedContent` ADD CONSTRAINT `GeneratedContent_brandId_fkey` FOREIGN KEY (`brandId`) REFERENCES `Brand`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `GeneratedContent` ADD CONSTRAINT `GeneratedContent_generationJobId_fkey` FOREIGN KEY (`generationJobId`) REFERENCES `GenerationJob`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `GeneratedContent` ADD CONSTRAINT `GeneratedContent_originalContentId_fkey` FOREIGN KEY (`originalContentId`) REFERENCES `GeneratedContent`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
