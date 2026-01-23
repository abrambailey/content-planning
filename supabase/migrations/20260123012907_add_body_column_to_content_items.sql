-- Add body column to cp_content_items for Editor.js rich text content
ALTER TABLE cp_content_items
ADD COLUMN body jsonb DEFAULT NULL;

-- Add comment describing the column
COMMENT ON COLUMN cp_content_items.body IS 'Editor.js JSON content for the content item body';
