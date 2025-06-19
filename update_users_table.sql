-- Add 'google_id' column to store the user's unique Google identifier
-- This column will hold the unique ID provided by Google for the user.
-- It's set to NULL by default as existing users won't have it, and UNIQUE to ensure no two users share the same Google ID.
ALTER TABLE users ADD COLUMN google_id VARCHAR(255) NULL UNIQUE;

-- Add 'is_verified' column to mark users verified through Google
-- This column indicates whether the user's email has been verified.
-- Users signing up via Google are considered verified as Google handles email verification.
-- Defaults to FALSE for existing users or users created through other means (if any in the future).
ALTER TABLE users ADD COLUMN is_verified BOOLEAN DEFAULT FALSE;

-- Modify 'password_hash' column to allow NULL values
-- This change is necessary because users authenticating via Google OAuth will not have a locally stored password.
-- Making this column nullable accommodates such users.
-- For existing users with passwords, their password_hash remains unchanged.
-- This command is specific to MySQL.
ALTER TABLE users MODIFY COLUMN password_hash VARCHAR(255) NULL;

-- Note for PostgreSQL users:
-- If you were using PostgreSQL, the equivalent command to make password_hash nullable would be:
-- ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;

-- After running these commands, you should update your application code:
-- 1. When a user signs up/logs in with Google:
--    - Store their Google ID in the 'google_id' column.
--    - Set 'is_verified' to TRUE.
--    - The 'password_hash' column will be NULL for these users.
-- 2. Ensure your user model and authentication logic correctly handle users who may not have a password_hash
--    (i.e., they are Google OAuth users).
-- 3. Existing users who registered with a password will retain their 'password_hash' and 'is_verified' will be FALSE
--    unless updated by another process. They will have a NULL 'google_id' until they link their Google account.
