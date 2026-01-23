-- Product segments table for saving filter + sort combinations
CREATE TABLE product_segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  filters JSONB NOT NULL DEFAULT '{}',
  sort_primary TEXT,
  sort_primary_desc BOOLEAN DEFAULT true,
  sort_secondary TEXT,
  sort_secondary_desc BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add index for user lookups
CREATE INDEX idx_product_segments_user_id ON product_segments(user_id);

-- Enable Row Level Security
ALTER TABLE product_segments ENABLE ROW LEVEL SECURITY;

-- Users can only manage their own segments
CREATE POLICY "Users can manage own segments"
  ON product_segments FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
