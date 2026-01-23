-- Migration 3: Briefs & Content Items
-- cp_content_briefs, cp_content_items, cp_content_tags

-- ============================================================================
-- cp_content_briefs: Planning documents with requirements, keywords, outlines
-- ============================================================================
CREATE TABLE public.cp_content_briefs (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  title VARCHAR(300) NOT NULL,
  slug VARCHAR(300),

  -- Content requirements
  summary TEXT, -- Executive summary of what the content should achieve
  target_audience TEXT,
  content_goals TEXT, -- What should the reader learn/do after reading?
  tone_and_style TEXT, -- Writing style guidelines

  -- SEO & Keywords
  primary_keyword VARCHAR(200),
  secondary_keywords JSONB DEFAULT '[]'::JSONB, -- Array of keywords
  search_intent VARCHAR(50), -- informational, transactional, navigational, commercial
  target_word_count INTEGER,

  -- Structure
  outline JSONB DEFAULT '[]'::JSONB, -- Structured outline with headings/sections
  required_sections JSONB DEFAULT '[]'::JSONB, -- Must-have sections
  internal_links JSONB DEFAULT '[]'::JSONB, -- Suggested internal link targets
  external_references JSONB DEFAULT '[]'::JSONB, -- Research sources/references

  -- Relationships
  idea_id BIGINT REFERENCES public.cp_content_ideas(id) ON DELETE SET NULL, -- Source idea
  content_type_id BIGINT REFERENCES public.cp_content_types(id) ON DELETE SET NULL,
  campaign_id BIGINT REFERENCES public.cp_campaigns(id) ON DELETE SET NULL,

  -- Status & Assignment
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'ready', 'assigned', 'in_progress', 'completed')),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,

  -- Metadata
  competitor_examples JSONB DEFAULT '[]'::JSONB, -- URLs of competitor content for reference
  notes TEXT,
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_cp_content_briefs_status ON public.cp_content_briefs(status);
CREATE INDEX idx_cp_content_briefs_idea_id ON public.cp_content_briefs(idea_id);
CREATE INDEX idx_cp_content_briefs_content_type_id ON public.cp_content_briefs(content_type_id);
CREATE INDEX idx_cp_content_briefs_campaign_id ON public.cp_content_briefs(campaign_id);
CREATE INDEX idx_cp_content_briefs_created_by ON public.cp_content_briefs(created_by);

-- ============================================================================
-- cp_content_items: Central tracking table linking briefs to stories
-- ============================================================================
CREATE TABLE public.cp_content_items (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  title VARCHAR(300) NOT NULL,
  slug VARCHAR(300),

  -- Type & Classification
  content_type_id BIGINT REFERENCES public.cp_content_types(id) ON DELETE SET NULL,

  -- Related Records
  brief_id BIGINT REFERENCES public.cp_content_briefs(id) ON DELETE SET NULL,
  story_id BIGINT REFERENCES public.stories(id) ON DELETE SET NULL, -- Link to Storyblok content
  draft_story_id BIGINT REFERENCES public.draft_stories(id) ON DELETE SET NULL,
  campaign_id BIGINT REFERENCES public.cp_campaigns(id) ON DELETE SET NULL,
  release_id BIGINT REFERENCES public.releases(id) ON DELETE SET NULL, -- Product launch coordination

  -- Workflow
  workflow_status_id BIGINT REFERENCES public.cp_workflow_statuses(id) ON DELETE SET NULL,

  -- Assignment (using authors table for author/editor)
  assigned_author_id BIGINT REFERENCES public.authors(id) ON DELETE SET NULL,
  assigned_editor_id BIGINT REFERENCES public.authors(id) ON DELETE SET NULL,

  -- Scheduling & Dates
  due_date DATE,
  scheduled_date DATE,
  scheduled_time TIME,
  publish_date TIMESTAMPTZ,

  -- Priority & Urgency
  priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),

  -- SEO Metadata
  seo_metadata JSONB DEFAULT '{}'::JSONB, -- title, description, canonical, etc.

  -- Social Metadata
  social_metadata JSONB DEFAULT '{}'::JSONB, -- og:title, og:description, twitter:card, etc.

  -- General Metadata
  metadata JSONB DEFAULT '{}'::JSONB,
  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Foreign key indexes
CREATE INDEX idx_cp_content_items_content_type_id ON public.cp_content_items(content_type_id);
CREATE INDEX idx_cp_content_items_brief_id ON public.cp_content_items(brief_id);
CREATE INDEX idx_cp_content_items_story_id ON public.cp_content_items(story_id);
CREATE INDEX idx_cp_content_items_draft_story_id ON public.cp_content_items(draft_story_id);
CREATE INDEX idx_cp_content_items_campaign_id ON public.cp_content_items(campaign_id);
CREATE INDEX idx_cp_content_items_release_id ON public.cp_content_items(release_id);
CREATE INDEX idx_cp_content_items_workflow_status_id ON public.cp_content_items(workflow_status_id);
CREATE INDEX idx_cp_content_items_assigned_author_id ON public.cp_content_items(assigned_author_id);
CREATE INDEX idx_cp_content_items_assigned_editor_id ON public.cp_content_items(assigned_editor_id);

-- Query indexes
CREATE INDEX idx_cp_content_items_due_date ON public.cp_content_items(due_date);
CREATE INDEX idx_cp_content_items_scheduled_date ON public.cp_content_items(scheduled_date);
CREATE INDEX idx_cp_content_items_publish_date ON public.cp_content_items(publish_date);
CREATE INDEX idx_cp_content_items_priority ON public.cp_content_items(priority);

-- ============================================================================
-- cp_content_tags: Junction table for content-tag relationships
-- ============================================================================
CREATE TABLE public.cp_content_tags (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  content_item_id BIGINT NOT NULL REFERENCES public.cp_content_items(id) ON DELETE CASCADE,
  tag_id BIGINT NOT NULL REFERENCES public.cp_tags(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(content_item_id, tag_id)
);

CREATE INDEX idx_cp_content_tags_content_item_id ON public.cp_content_tags(content_item_id);
CREATE INDEX idx_cp_content_tags_tag_id ON public.cp_content_tags(tag_id);

-- ============================================================================
-- Triggers for updated_at
-- ============================================================================
CREATE TRIGGER on_cp_content_briefs_updated
  BEFORE UPDATE ON public.cp_content_briefs
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER on_cp_content_items_updated
  BEFORE UPDATE ON public.cp_content_items
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- Enable RLS (policies added in migration 6)
-- ============================================================================
ALTER TABLE public.cp_content_briefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cp_content_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cp_content_tags ENABLE ROW LEVEL SECURITY;
