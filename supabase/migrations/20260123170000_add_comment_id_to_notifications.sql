-- Add comment_id column to notifications for linking to specific comments
ALTER TABLE notifications ADD COLUMN comment_id bigint REFERENCES cp_comments(id) ON DELETE SET NULL;

-- Index for efficient lookups
CREATE INDEX idx_notifications_comment_id ON notifications(comment_id) WHERE comment_id IS NOT NULL;
