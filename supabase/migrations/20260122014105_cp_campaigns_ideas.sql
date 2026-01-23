-- Migration 2: Campaigns & Ideas
-- cp_campaigns, cp_content_ideas

-- ============================================================================
-- cp_campaigns: Marketing campaigns and editorial themes
-- ============================================================================
CREATE TABLE public.cp_campaigns (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  slug VARCHAR(200) NOT NULL UNIQUE,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  goals TEXT, -- Campaign objectives/KPIs
  start_date DATE,
  end_date DATE,
  status VARCHAR(20) DEFAULT 'planning' CHECK (status IN ('planning', 'active', 'completed', 'cancelled')),
  color VARCHAR(7) DEFAULT '#6366F1', -- Hex color for calendar UI
  release_id BIGINT REFERENCES public.releases(id) ON DELETE SET NULL, -- Link to product launch
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}'::JSONB, -- Flexible metadata (budget, channels, etc.)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_cp_campaigns_status ON public.cp_campaigns(status);
CREATE INDEX idx_cp_campaigns_start_date ON public.cp_campaigns(start_date);
CREATE INDEX idx_cp_campaigns_end_date ON public.cp_campaigns(end_date);
CREATE INDEX idx_cp_campaigns_release_id ON public.cp_campaigns(release_id);
CREATE INDEX idx_cp_campaigns_created_by ON public.cp_campaigns(created_by);

-- ============================================================================
-- cp_content_ideas: Backlog of ideas before becoming briefs
-- ============================================================================
CREATE TABLE public.cp_content_ideas (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  title VARCHAR(300) NOT NULL,
  description TEXT,
  source VARCHAR(100), -- Where the idea came from (e.g., 'team', 'seo', 'customer', 'competitor')
  potential_keywords JSONB DEFAULT '[]'::JSONB, -- Initial keyword ideas
  target_audience TEXT,
  estimated_effort VARCHAR(20) CHECK (estimated_effort IN ('low', 'medium', 'high')),
  priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status VARCHAR(20) DEFAULT 'submitted' CHECK (status IN ('submitted', 'under_review', 'approved', 'rejected', 'converted')),
  content_type_id BIGINT REFERENCES public.cp_content_types(id) ON DELETE SET NULL,
  campaign_id BIGINT REFERENCES public.cp_campaigns(id) ON DELETE SET NULL,
  submitted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  vote_count INTEGER DEFAULT 0, -- Simple voting system
  votes JSONB DEFAULT '[]'::JSONB, -- Array of {user_id, vote: 1/-1, timestamp}
  notes TEXT,
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_cp_content_ideas_status ON public.cp_content_ideas(status);
CREATE INDEX idx_cp_content_ideas_priority ON public.cp_content_ideas(priority);
CREATE INDEX idx_cp_content_ideas_content_type_id ON public.cp_content_ideas(content_type_id);
CREATE INDEX idx_cp_content_ideas_campaign_id ON public.cp_content_ideas(campaign_id);
CREATE INDEX idx_cp_content_ideas_submitted_by ON public.cp_content_ideas(submitted_by);
CREATE INDEX idx_cp_content_ideas_vote_count ON public.cp_content_ideas(vote_count DESC);

-- ============================================================================
-- Triggers for updated_at
-- ============================================================================
CREATE TRIGGER on_cp_campaigns_updated
  BEFORE UPDATE ON public.cp_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER on_cp_content_ideas_updated
  BEFORE UPDATE ON public.cp_content_ideas
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- Enable RLS (policies added in migration 6)
-- ============================================================================
ALTER TABLE public.cp_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cp_content_ideas ENABLE ROW LEVEL SECURITY;
