-- Migration 1: Foundation Tables
-- cp_workflow_statuses, cp_content_types, cp_tags

-- ============================================================================
-- cp_workflow_statuses: Editorial workflow stages
-- ============================================================================
CREATE TABLE public.cp_workflow_statuses (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  slug VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  color VARCHAR(7) DEFAULT '#6B7280', -- Hex color for UI
  is_initial BOOLEAN DEFAULT FALSE, -- Starting status for new content
  is_terminal BOOLEAN DEFAULT FALSE, -- Final statuses (published/archived)
  allowed_transitions JSONB DEFAULT '[]'::JSONB, -- Array of valid next status slugs
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure only one initial status
CREATE UNIQUE INDEX idx_cp_workflow_statuses_single_initial
  ON public.cp_workflow_statuses (is_initial)
  WHERE is_initial = TRUE;

CREATE INDEX idx_cp_workflow_statuses_display_order ON public.cp_workflow_statuses(display_order);

-- ============================================================================
-- cp_content_types: Content classifications
-- ============================================================================
CREATE TABLE public.cp_content_types (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  slug VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  icon VARCHAR(50), -- Icon name for UI (e.g., 'article', 'video', 'guide')
  default_workflow_status_id BIGINT REFERENCES public.cp_workflow_statuses(id) ON DELETE SET NULL,
  metadata_schema JSONB DEFAULT '{}'::JSONB, -- JSON Schema for type-specific fields
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_cp_content_types_is_active ON public.cp_content_types(is_active);
CREATE INDEX idx_cp_content_types_display_order ON public.cp_content_types(display_order);

-- ============================================================================
-- cp_tags: Flexible tagging system with groupings
-- ============================================================================
CREATE TABLE public.cp_tags (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  slug VARCHAR(100) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  color VARCHAR(7) DEFAULT '#6B7280', -- Hex color for UI
  tag_group VARCHAR(50), -- For grouping tags (e.g., 'topic', 'audience', 'product')
  parent_id BIGINT REFERENCES public.cp_tags(id) ON DELETE SET NULL, -- Hierarchical tags
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_cp_tags_tag_group ON public.cp_tags(tag_group);
CREATE INDEX idx_cp_tags_parent_id ON public.cp_tags(parent_id);
CREATE INDEX idx_cp_tags_is_active ON public.cp_tags(is_active);

-- ============================================================================
-- Triggers for updated_at
-- ============================================================================
CREATE TRIGGER on_cp_workflow_statuses_updated
  BEFORE UPDATE ON public.cp_workflow_statuses
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER on_cp_content_types_updated
  BEFORE UPDATE ON public.cp_content_types
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER on_cp_tags_updated
  BEFORE UPDATE ON public.cp_tags
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- Seed Data: Workflow Statuses
-- ============================================================================
INSERT INTO public.cp_workflow_statuses (slug, name, description, color, is_initial, is_terminal, allowed_transitions, display_order)
VALUES
  ('draft', 'Draft', 'Initial draft stage - content is being created', '#9CA3AF', TRUE, FALSE, '["in_review"]'::JSONB, 1),
  ('in_review', 'In Review', 'Content is being reviewed by editor', '#F59E0B', FALSE, FALSE, '["draft", "approved", "needs_revision"]'::JSONB, 2),
  ('needs_revision', 'Needs Revision', 'Content requires changes based on review feedback', '#EF4444', FALSE, FALSE, '["draft", "in_review"]'::JSONB, 3),
  ('approved', 'Approved', 'Content has been approved and is ready for scheduling', '#10B981', FALSE, FALSE, '["scheduled", "published"]'::JSONB, 4),
  ('scheduled', 'Scheduled', 'Content is scheduled for future publication', '#6366F1', FALSE, FALSE, '["approved", "published"]'::JSONB, 5),
  ('published', 'Published', 'Content has been published', '#059669', FALSE, TRUE, '["archived"]'::JSONB, 6),
  ('archived', 'Archived', 'Content has been archived and is no longer active', '#6B7280', FALSE, TRUE, '[]'::JSONB, 7);

-- ============================================================================
-- Seed Data: Content Types
-- ============================================================================
INSERT INTO public.cp_content_types (slug, name, description, icon, display_order)
VALUES
  ('article', 'Article', 'Standard blog article or news piece', 'file-text', 1),
  ('guide', 'Guide', 'In-depth how-to guide or tutorial', 'book-open', 2),
  ('review', 'Review', 'Product or service review', 'star', 3),
  ('comparison', 'Comparison', 'Product comparison or versus article', 'git-compare', 4),
  ('news', 'News', 'News announcement or press release', 'newspaper', 5),
  ('video', 'Video', 'Video content with accompanying text', 'video', 6);

-- Update content types with default workflow status (draft)
UPDATE public.cp_content_types
SET default_workflow_status_id = (SELECT id FROM public.cp_workflow_statuses WHERE slug = 'draft');

-- ============================================================================
-- Enable RLS (policies added in migration 6)
-- ============================================================================
ALTER TABLE public.cp_workflow_statuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cp_content_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cp_tags ENABLE ROW LEVEL SECURITY;
