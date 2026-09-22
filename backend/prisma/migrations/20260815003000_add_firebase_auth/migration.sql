-- Preserve the existing external identity column while making Firebase its
-- explicit source of truth for Phase 5C.
ALTER TABLE `User`
  CHANGE COLUMN `externalAuthSubject` `firebaseUid` VARCHAR(191) NULL,
  ADD COLUMN `emailVerified` BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN `photoUrl` VARCHAR(2048) NULL,
  ADD COLUMN `lastLoginAt` DATETIME(3) NULL;

ALTER TABLE `User`
  RENAME INDEX `User_externalAuthSubject_key` TO `User_firebaseUid_key`;
