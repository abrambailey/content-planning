-- Migration 5: Analytics
-- cp_content_analytics

-- ============================================================================
-- cp_content_analytics: Daily performance metrics per content item
-- ============================================================================
CREATE TABLE public.cp_content_analytics (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  content_item_id BIGINT NOT NULL REFERENCES public.cp_content_items(id) ON DELETE CASCADE,
  date DATE NOT NULL,

  -- Traffic metrics
  page_views INTEGER DEFAULT 0,
  unique_visitors INTEGER DEFAULT 0,
  avg_time_on_page INTEGER, -- In seconds
  bounce_rate NUMERIC(5,2), -- Percentage

  -- Engagement metrics
  scroll_depth NUMERIC(5,2), -- Average percentage scrolled
  social_shares INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,

  -- SEO metrics
  organic_traffic INTEGER DEFAULT 0,
  keyword_rankings JSONB DEFAULT '{}'::JSONB, -- {keyword: position}
  backlinks_count INTEGER DEFAULT 0,

  -- Conversion metrics
  conversions INTEGER DEFAULT 0,
  conversion_rate NUMERIC(5,4), -- Percentage with precision
  revenue NUMERIC(12,2), -- If applicable

  -- Source breakdown
  traffic_sources JSONB DEFAULT '{}'::JSONB, -- {source: count}
  device_breakdown JSONB DEFAULT '{}'::JSONB, -- {device_type: count}
  geo_breakdown JSONB DEFAULT '{}'::JSONB, -- {country: count}

  -- Additional metrics
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure one record per content item per day
  UNIQUE(content_item_id, date)
);

CREATE INDEX idx_cp_content_analytics_content_item_id ON public.cp_content_analytics(content_item_id);
CREATE INDEX idx_cp_content_analytics_date ON public.cp_content_analytics(date DESC);
CREATE INDEX idx_cp_content_analytics_page_views ON public.cp_content_analytics(page_views DESC);

-- Composite index for common queries
CREATE INDEX idx_cp_content_analytics_item_date ON public.cp_content_analytics(content_item_id, date DESC);

-- ============================================================================
-- Triggers for updated_at
-- ============================================================================
CREATE TRIGGER on_cp_content_analytics_updated
  BEFORE UPDATE ON public.cp_content_analytics
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- Enable RLS (policies added in migration 6)
-- ============================================================================
ALTER TABLE public.cp_content_analytics ENABLE ROW LEVEL SECURITY;
