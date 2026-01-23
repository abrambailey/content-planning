-- Migration: Content Attachments and Links
-- Adds storage bucket and tables for content item attachments, links, and comment attachments

-- ============================================================================
-- Storage bucket for content attachments
-- ============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('content-attachments', 'content-attachments', false)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for storage
CREATE POLICY "Authenticated users can upload attachments"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'content-attachments');

CREATE POLICY "Authenticated users can view attachments"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'content-attachments');

CREATE POLICY "Authenticated users can delete own attachments"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'content-attachments');

-- ============================================================================
-- cp_content_attachments: Files attached to content items
-- ============================================================================
CREATE TABLE public.cp_content_attachments (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  content_item_id BIGINT NOT NULL REFERENCES public.cp_content_items(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size BIGINT,
  mime_type VARCHAR(100),
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_cp_content_attachments_content_item_id ON public.cp_content_attachments(content_item_id);

-- ============================================================================
-- cp_content_links: External resource links for content items
-- ============================================================================
CREATE TABLE public.cp_content_links (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  content_item_id BIGINT NOT NULL REFERENCES public.cp_content_items(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  name VARCHAR(200),
  description TEXT,
  link_type VARCHAR(50) DEFAULT 'resource',
  display_order INT DEFAULT 0,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_cp_content_links_content_item_id ON public.cp_content_links(content_item_id);

-- ============================================================================
-- cp_comment_attachments: Files attached to comments
-- ============================================================================
CREATE TABLE public.cp_comment_attachments (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  comment_id BIGINT NOT NULL REFERENCES public.cp_comments(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size BIGINT,
  mime_type VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_cp_comment_attachments_comment_id ON public.cp_comment_attachments(comment_id);

-- ============================================================================
-- Add storyblok_url column to cp_content_items
-- ============================================================================
ALTER TABLE public.cp_content_items
ADD COLUMN IF NOT EXISTS storyblok_url TEXT;

-- ============================================================================
-- Enable RLS on new tables
-- ============================================================================
ALTER TABLE public.cp_content_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cp_content_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cp_comment_attachments ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS Policies
-- ============================================================================
CREATE POLICY "Authenticated can manage content attachments" ON public.cp_content_attachments
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated can manage content links" ON public.cp_content_links
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated can manage comment attachments" ON public.cp_comment_attachments
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
