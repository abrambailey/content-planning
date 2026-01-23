-- Add label and custom product support to best list products

-- Add label column for product badges (e.g., "Overall Best", "Best Value")
ALTER TABLE cp_best_list_products ADD COLUMN label VARCHAR(100);

-- Make product_id nullable to support custom/one-off products
ALTER TABLE cp_best_list_products ALTER COLUMN product_id DROP NOT NULL;

-- Add columns for custom products (not in the database)
ALTER TABLE cp_best_list_products ADD COLUMN custom_product_name VARCHAR(300);
ALTER TABLE cp_best_list_products ADD COLUMN custom_product_brand VARCHAR(100);

-- Drop the unique constraint and recreate it to allow multiple custom products
ALTER TABLE cp_best_list_products DROP CONSTRAINT IF EXISTS cp_best_list_products_content_item_id_product_id_key;

-- Create a new unique constraint that handles nullable product_id
-- For database products: unique on (content_item_id, product_id) where product_id is not null
-- For custom products: no uniqueness constraint (same custom name can appear multiple times if needed)
CREATE UNIQUE INDEX idx_best_list_products_unique_db_product
  ON cp_best_list_products(content_item_id, product_id)
  WHERE product_id IS NOT NULL;

-- Add check constraint: must have either product_id OR custom_product_name
ALTER TABLE cp_best_list_products ADD CONSTRAINT chk_product_or_custom
  CHECK (product_id IS NOT NULL OR custom_product_name IS NOT NULL);
