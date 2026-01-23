-- Replace single assigned_author_id/assigned_editor_id with multi-user assignments
-- Both authors and editors are now selected from registered users (auth.users)

-- Drop views that depend on these columns
DROP VIEW IF EXISTS public.cp_calendar_view;

-- Create the new content assignments table (references auth.users, supports multiple per role)
CREATE TABLE public.cp_content_assignments (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  content_item_id BIGINT NOT NULL REFERENCES public.cp_content_items(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL CHECK (role IN ('author', 'editor', 'reviewer', 'contributor')),
  assigned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(content_item_id, user_id, role)
);

CREATE INDEX idx_cp_content_assignments_content_item_id ON public.cp_content_assignments(content_item_id);
CREATE INDEX idx_cp_content_assignments_user_id ON public.cp_content_assignments(user_id);
CREATE INDEX idx_cp_content_assignments_role ON public.cp_content_assignments(role);

-- Enable RLS
ALTER TABLE public.cp_content_assignments ENABLE ROW LEVEL SECURITY;

-- RLS policies for content assignments
CREATE POLICY "Users can view all content assignments"
  ON public.cp_content_assignments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Editors can manage content assignments"
  ON public.cp_content_assignments FOR ALL
  TO authenticated
  USING (public.cp_user_is_editor_or_above());

-- Trigger for updated_at
CREATE TRIGGER on_cp_content_assignments_updated
  BEFORE UPDATE ON public.cp_content_assignments
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Drop the old single-assignment columns
ALTER TABLE public.cp_content_items
  DROP COLUMN IF EXISTS assigned_author_id,
  DROP COLUMN IF EXISTS assigned_editor_id;

-- Recreate cp_calendar_view without author/editor columns (they come from assignments now)
CREATE OR REPLACE VIEW public.cp_calendar_view AS
-- Content items with scheduled dates
SELECT
  'content_item' AS item_type,
  ci.id AS item_id,
  ci.title,
  ci.scheduled_date AS start_date,
  ci.scheduled_time AS start_time,
  ci.scheduled_date AS end_date,
  ci.scheduled_time AS end_time,
  FALSE AS all_day,
  ws.color,
  ci.priority,
  ct.name AS content_type_name,
  ct.icon AS content_type_icon,
  ws.name AS status_name,
  c.name AS campaign_name,
  ci.campaign_id,
  NULL::BIGINT AS calendar_event_id
FROM public.cp_content_items ci
LEFT JOIN public.cp_workflow_statuses ws ON ci.workflow_status_id = ws.id
LEFT JOIN public.cp_content_types ct ON ci.content_type_id = ct.id
LEFT JOIN public.cp_campaigns c ON ci.campaign_id = c.id
WHERE ci.scheduled_date IS NOT NULL

UNION ALL

-- Content items with due dates (but no scheduled date)
SELECT
  'content_due' AS item_type,
  ci.id AS item_id,
  ci.title || ' (Due)' AS title,
  ci.due_date AS start_date,
  NULL::TIME AS start_time,
  ci.due_date AS end_date,
  NULL::TIME AS end_time,
  TRUE AS all_day,
  '#EF4444' AS color,
  ci.priority,
  ct.name AS content_type_name,
  ct.icon AS content_type_icon,
  ws.name AS status_name,
  c.name AS campaign_name,
  ci.campaign_id,
  NULL::BIGINT AS calendar_event_id
FROM public.cp_content_items ci
LEFT JOIN public.cp_workflow_statuses ws ON ci.workflow_status_id = ws.id
LEFT JOIN public.cp_content_types ct ON ci.content_type_id = ct.id
LEFT JOIN public.cp_campaigns c ON ci.campaign_id = c.id
WHERE ci.due_date IS NOT NULL
  AND ci.scheduled_date IS NULL
  AND ws.is_terminal = FALSE

UNION ALL

-- Calendar events
SELECT
  'calendar_event' AS item_type,
  ce.id AS item_id,
  ce.title,
  ce.start_date,
  ce.start_time,
  ce.end_date,
  ce.end_time,
  ce.all_day,
  ce.color,
  NULL AS priority,
  ce.event_type AS content_type_name,
  CASE ce.event_type
    WHEN 'meeting' THEN 'users'
    WHEN 'deadline' THEN 'alert-circle'
    WHEN 'milestone' THEN 'flag'
    WHEN 'reminder' THEN 'bell'
    ELSE 'calendar'
  END AS content_type_icon,
  ce.event_type AS status_name,
  c.name AS campaign_name,
  ce.campaign_id,
  ce.id AS calendar_event_id
FROM public.cp_calendar_events ce
LEFT JOIN public.cp_campaigns c ON ce.campaign_id = c.id;

-- Grant permissions
GRANT SELECT ON public.cp_calendar_view TO authenticated;
GRANT SELECT ON public.cp_calendar_view TO service_role;
