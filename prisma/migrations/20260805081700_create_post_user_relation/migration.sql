-- AddForeignKey
ALTER TABLE `posts` ADD CONSTRAINT `posts_create_user_id_fkey` FOREIGN KEY (`create_user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `posts` ADD CONSTRAINT `posts_updated_user_id_fkey` FOREIGN KEY (`updated_user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `posts` ADD CONSTRAINT `posts_deleted_user_id_fkey` FOREIGN KEY (`deleted_user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
