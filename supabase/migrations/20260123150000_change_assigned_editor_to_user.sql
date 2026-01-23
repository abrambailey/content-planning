-- Change assigned_editor_id from referencing authors to auth.users
-- This allows selecting any registered user as an editor

-- Drop the calendar view first (it depends on assigned_editor_id)
DROP VIEW IF EXISTS public.cp_calendar_view;

-- Drop the existing foreign key constraint
ALTER TABLE public.cp_content_items
  DROP CONSTRAINT IF EXISTS cp_content_items_assigned_editor_id_fkey;

-- Change the column type from BIGINT to UUID to match auth.users.id
ALTER TABLE public.cp_content_items
  ALTER COLUMN assigned_editor_id TYPE UUID USING NULL;

-- Add the new foreign key constraint to auth.users
ALTER TABLE public.cp_content_items
  ADD CONSTRAINT cp_content_items_assigned_editor_id_fkey
  FOREIGN KEY (assigned_editor_id) REFERENCES auth.users(id) ON DELETE SET NULL;

-- Recreate the index for the new column type
DROP INDEX IF EXISTS idx_cp_content_items_assigned_editor_id;
CREATE INDEX idx_cp_content_items_assigned_editor_id ON public.cp_content_items(assigned_editor_id);

-- Create a view to expose registered users with their profiles
-- This joins auth.users with user_profiles for the editor dropdown
CREATE OR REPLACE VIEW public.registered_users AS
SELECT
  u.id,
  u.email,
  COALESCE(p.display_name, split_part(u.email, '@', 1)) as display_name,
  p.avatar_url
FROM auth.users u
LEFT JOIN public.user_profiles p ON p.id = u.id
ORDER BY COALESCE(p.display_name, u.email);

-- Grant select to authenticated users
GRANT SELECT ON public.registered_users TO authenticated;

-- Recreate cp_calendar_view to use registered_users for editor instead of authors
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
  NULL::BIGINT AS calendar_event_id,
  aa.name AS assigned_author_name,
  ae.display_name AS assigned_editor_name
FROM public.cp_content_items ci
LEFT JOIN public.cp_workflow_statuses ws ON ci.workflow_status_id = ws.id
LEFT JOIN public.cp_content_types ct ON ci.content_type_id = ct.id
LEFT JOIN public.cp_campaigns c ON ci.campaign_id = c.id
LEFT JOIN public.authors aa ON ci.assigned_author_id = aa.id
LEFT JOIN public.registered_users ae ON ci.assigned_editor_id = ae.id
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
  '#EF4444' AS color, -- Red for due dates
  ci.priority,
  ct.name AS content_type_name,
  ct.icon AS content_type_icon,
  ws.name AS status_name,
  c.name AS campaign_name,
  ci.campaign_id,
  NULL::BIGINT AS calendar_event_id,
  aa.name AS assigned_author_name,
  ae.display_name AS assigned_editor_name
FROM public.cp_content_items ci
LEFT JOIN public.cp_workflow_statuses ws ON ci.workflow_status_id = ws.id
LEFT JOIN public.cp_content_types ct ON ci.content_type_id = ct.id
LEFT JOIN public.cp_campaigns c ON ci.campaign_id = c.id
LEFT JOIN public.authors aa ON ci.assigned_author_id = aa.id
LEFT JOIN public.registered_users ae ON ci.assigned_editor_id = ae.id
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
  ce.id AS calendar_event_id,
  NULL AS assigned_author_name,
  NULL AS assigned_editor_name
FROM public.cp_calendar_events ce
LEFT JOIN public.cp_campaigns c ON ce.campaign_id = c.id;
