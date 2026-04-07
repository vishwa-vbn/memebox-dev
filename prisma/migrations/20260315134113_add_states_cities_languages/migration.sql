-- AlterTable
ALTER TABLE `Media` ADD COLUMN `cityId` BIGINT NULL,
    ADD COLUMN `languageId` BIGINT NULL,
    ADD COLUMN `stateId` BIGINT NULL;

-- CreateTable
CREATE TABLE `State` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `slug` VARCHAR(100) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `State_name_key`(`name`),
    UNIQUE INDEX `State_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `City` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `slug` VARCHAR(100) NULL,
    `stateId` BIGINT NOT NULL,

    INDEX `City_stateId_idx`(`stateId`),
    UNIQUE INDEX `City_name_stateId_key`(`name`, `stateId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Language` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `code` VARCHAR(10) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Language_name_key`(`name`),
    UNIQUE INDEX `Language_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `Media_stateId_idx` ON `Media`(`stateId`);

-- CreateIndex
CREATE INDEX `Media_cityId_idx` ON `Media`(`cityId`);

-- CreateIndex
CREATE INDEX `Media_languageId_idx` ON `Media`(`languageId`);

-- CreateIndex
CREATE INDEX `Media_stateId_cityId_idx` ON `Media`(`stateId`, `cityId`);

-- AddForeignKey
ALTER TABLE `Media` ADD CONSTRAINT `Media_stateId_fkey` FOREIGN KEY (`stateId`) REFERENCES `State`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Media` ADD CONSTRAINT `Media_cityId_fkey` FOREIGN KEY (`cityId`) REFERENCES `City`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Media` ADD CONSTRAINT `Media_languageId_fkey` FOREIGN KEY (`languageId`) REFERENCES `Language`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `City` ADD CONSTRAINT `City_stateId_fkey` FOREIGN KEY (`stateId`) REFERENCES `State`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
