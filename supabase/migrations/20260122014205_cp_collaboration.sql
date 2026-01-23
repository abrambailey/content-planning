-- Migration 4: Collaboration
-- cp_author_assignments, cp_workflow_transitions, cp_comments, cp_calendar_events

-- ============================================================================
-- cp_author_assignments: Track author/editor workload with due dates
-- ============================================================================
CREATE TABLE public.cp_author_assignments (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  content_item_id BIGINT NOT NULL REFERENCES public.cp_content_items(id) ON DELETE CASCADE,
  author_id BIGINT NOT NULL REFERENCES public.authors(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL CHECK (role IN ('author', 'editor', 'reviewer', 'contributor')),
  assigned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  due_date DATE,
  completed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(content_item_id, author_id, role)
);

CREATE INDEX idx_cp_author_assignments_content_item_id ON public.cp_author_assignments(content_item_id);
CREATE INDEX idx_cp_author_assignments_author_id ON public.cp_author_assignments(author_id);
CREATE INDEX idx_cp_author_assignments_role ON public.cp_author_assignments(role);
CREATE INDEX idx_cp_author_assignments_due_date ON public.cp_author_assignments(due_date);
CREATE INDEX idx_cp_author_assignments_completed_at ON public.cp_author_assignments(completed_at) WHERE completed_at IS NULL;

-- ============================================================================
-- cp_workflow_transitions: Audit log of all status changes
-- ============================================================================
CREATE TABLE public.cp_workflow_transitions (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  content_item_id BIGINT NOT NULL REFERENCES public.cp_content_items(id) ON DELETE CASCADE,
  from_status_id BIGINT REFERENCES public.cp_workflow_statuses(id) ON DELETE SET NULL,
  to_status_id BIGINT NOT NULL REFERENCES public.cp_workflow_statuses(id) ON DELETE CASCADE,
  transitioned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reason TEXT, -- Optional reason for transition
  metadata JSONB DEFAULT '{}'::JSONB, -- Additional context
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_cp_workflow_transitions_content_item_id ON public.cp_workflow_transitions(content_item_id);
CREATE INDEX idx_cp_workflow_transitions_from_status_id ON public.cp_workflow_transitions(from_status_id);
CREATE INDEX idx_cp_workflow_transitions_to_status_id ON public.cp_workflow_transitions(to_status_id);
CREATE INDEX idx_cp_workflow_transitions_transitioned_by ON public.cp_workflow_transitions(transitioned_by);
CREATE INDEX idx_cp_workflow_transitions_created_at ON public.cp_workflow_transitions(created_at DESC);

-- ============================================================================
-- cp_comments: Threaded comments on content items, briefs, and ideas
-- ============================================================================
CREATE TABLE public.cp_comments (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

  -- Polymorphic relationship
  commentable_type VARCHAR(50) NOT NULL CHECK (commentable_type IN ('content_item', 'content_brief', 'content_idea')),
  commentable_id BIGINT NOT NULL,

  -- Comment content
  body TEXT NOT NULL,
  body_html TEXT, -- Rendered HTML for rich text

  -- Threading
  parent_id BIGINT REFERENCES public.cp_comments(id) ON DELETE CASCADE,

  -- Author
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Resolution tracking (for feedback/review comments)
  is_resolved BOOLEAN DEFAULT FALSE,
  resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  resolved_at TIMESTAMPTZ,

  -- Mentions/notifications
  mentions JSONB DEFAULT '[]'::JSONB, -- Array of user IDs mentioned

  -- Metadata
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for polymorphic lookup
CREATE INDEX idx_cp_comments_commentable ON public.cp_comments(commentable_type, commentable_id);
CREATE INDEX idx_cp_comments_parent_id ON public.cp_comments(parent_id);
CREATE INDEX idx_cp_comments_author_id ON public.cp_comments(author_id);
CREATE INDEX idx_cp_comments_is_resolved ON public.cp_comments(is_resolved) WHERE is_resolved = FALSE;
CREATE INDEX idx_cp_comments_created_at ON public.cp_comments(created_at DESC);

-- ============================================================================
-- cp_calendar_events: Non-content calendar items (meetings, deadlines, milestones)
-- ============================================================================
CREATE TABLE public.cp_calendar_events (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  title VARCHAR(300) NOT NULL,
  description TEXT,
  event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('meeting', 'deadline', 'milestone', 'reminder', 'other')),

  -- Timing
  start_date DATE NOT NULL,
  start_time TIME,
  end_date DATE,
  end_time TIME,
  all_day BOOLEAN DEFAULT FALSE,
  timezone VARCHAR(50) DEFAULT 'UTC',

  -- Recurrence (simplified)
  is_recurring BOOLEAN DEFAULT FALSE,
  recurrence_rule JSONB, -- iCal RRULE-like structure

  -- Associations
  campaign_id BIGINT REFERENCES public.cp_campaigns(id) ON DELETE SET NULL,
  content_item_id BIGINT REFERENCES public.cp_content_items(id) ON DELETE SET NULL,

  -- Participants
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  attendees JSONB DEFAULT '[]'::JSONB, -- Array of user IDs

  -- Display
  color VARCHAR(7) DEFAULT '#6366F1',

  -- Metadata
  location TEXT,
  meeting_link TEXT,
  notes TEXT,
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_cp_calendar_events_start_date ON public.cp_calendar_events(start_date);
CREATE INDEX idx_cp_calendar_events_end_date ON public.cp_calendar_events(end_date);
CREATE INDEX idx_cp_calendar_events_event_type ON public.cp_calendar_events(event_type);
CREATE INDEX idx_cp_calendar_events_campaign_id ON public.cp_calendar_events(campaign_id);
CREATE INDEX idx_cp_calendar_events_content_item_id ON public.cp_calendar_events(content_item_id);
CREATE INDEX idx_cp_calendar_events_created_by ON public.cp_calendar_events(created_by);

-- ============================================================================
-- Triggers for updated_at
-- ============================================================================
CREATE TRIGGER on_cp_author_assignments_updated
  BEFORE UPDATE ON public.cp_author_assignments
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER on_cp_comments_updated
  BEFORE UPDATE ON public.cp_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER on_cp_calendar_events_updated
  BEFORE UPDATE ON public.cp_calendar_events
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- Enable RLS (policies added in migration 6)
-- ============================================================================
ALTER TABLE public.cp_author_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cp_workflow_transitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cp_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cp_calendar_events ENABLE ROW LEVEL SECURITY;
