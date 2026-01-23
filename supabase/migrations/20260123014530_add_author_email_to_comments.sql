-- Add author_email column to cp_comments to store the email at comment creation time
-- This avoids needing admin API access to fetch user emails later
ALTER TABLE cp_comments
ADD COLUMN author_email text;

-- Backfill existing comments with email from auth.users (if accessible)
-- This runs as a privileged migration so it should work
UPDATE cp_comments c
SET author_email = u.email
FROM auth.users u
WHERE c.author_id::uuid = u.id
AND c.author_email IS NULL;
