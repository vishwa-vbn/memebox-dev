-- CreateTable
CREATE TABLE `MediaLike` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `mediaId` BIGINT NOT NULL,
    `userId` BIGINT NOT NULL,

    UNIQUE INDEX `MediaLike_mediaId_userId_key`(`mediaId`, `userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `MediaLike` ADD CONSTRAINT `MediaLike_mediaId_fkey` FOREIGN KEY (`mediaId`) REFERENCES `Media`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MediaLike` ADD CONSTRAINT `MediaLike_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
