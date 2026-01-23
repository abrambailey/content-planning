-- Migration 7: Views
-- cp_calendar_view, cp_author_workload

-- ============================================================================
-- cp_calendar_view: Unified calendar with content + events
-- Combines content items (scheduled/due dates) with calendar events
-- ============================================================================
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
  ae.name AS assigned_editor_name
FROM public.cp_content_items ci
LEFT JOIN public.cp_workflow_statuses ws ON ci.workflow_status_id = ws.id
LEFT JOIN public.cp_content_types ct ON ci.content_type_id = ct.id
LEFT JOIN public.cp_campaigns c ON ci.campaign_id = c.id
LEFT JOIN public.authors aa ON ci.assigned_author_id = aa.id
LEFT JOIN public.authors ae ON ci.assigned_editor_id = ae.id
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
  ae.name AS assigned_editor_name
FROM public.cp_content_items ci
LEFT JOIN public.cp_workflow_statuses ws ON ci.workflow_status_id = ws.id
LEFT JOIN public.cp_content_types ct ON ci.content_type_id = ct.id
LEFT JOIN public.cp_campaigns c ON ci.campaign_id = c.id
LEFT JOIN public.authors aa ON ci.assigned_author_id = aa.id
LEFT JOIN public.authors ae ON ci.assigned_editor_id = ae.id
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

-- ============================================================================
-- cp_author_workload: Workload summary per author
-- Shows current assignments and upcoming deadlines
-- ============================================================================
CREATE OR REPLACE VIEW public.cp_author_workload AS
SELECT
  a.id AS author_id,
  a.name AS author_name,
  a.slug AS author_slug,
  a.avatar_url,

  -- Total active assignments
  COUNT(DISTINCT aa.id) FILTER (WHERE aa.completed_at IS NULL) AS active_assignments,

  -- Assignments by role
  COUNT(DISTINCT aa.id) FILTER (WHERE aa.role = 'author' AND aa.completed_at IS NULL) AS as_author,
  COUNT(DISTINCT aa.id) FILTER (WHERE aa.role = 'editor' AND aa.completed_at IS NULL) AS as_editor,
  COUNT(DISTINCT aa.id) FILTER (WHERE aa.role = 'reviewer' AND aa.completed_at IS NULL) AS as_reviewer,

  -- Items by workflow status
  COUNT(DISTINCT ci.id) FILTER (
    WHERE ws.slug = 'draft' AND aa.completed_at IS NULL
  ) AS items_in_draft,
  COUNT(DISTINCT ci.id) FILTER (
    WHERE ws.slug = 'in_review' AND aa.completed_at IS NULL
  ) AS items_in_review,
  COUNT(DISTINCT ci.id) FILTER (
    WHERE ws.slug = 'approved' AND aa.completed_at IS NULL
  ) AS items_approved,
  COUNT(DISTINCT ci.id) FILTER (
    WHERE ws.slug = 'scheduled' AND aa.completed_at IS NULL
  ) AS items_scheduled,

  -- Overdue items
  COUNT(DISTINCT aa.id) FILTER (
    WHERE aa.due_date < CURRENT_DATE
    AND aa.completed_at IS NULL
  ) AS overdue_items,

  -- Due this week
  COUNT(DISTINCT aa.id) FILTER (
    WHERE aa.due_date >= CURRENT_DATE
    AND aa.due_date <= CURRENT_DATE + INTERVAL '7 days'
    AND aa.completed_at IS NULL
  ) AS due_this_week,

  -- Completed this month
  COUNT(DISTINCT aa.id) FILTER (
    WHERE aa.completed_at >= DATE_TRUNC('month', CURRENT_DATE)
  ) AS completed_this_month,

  -- Next deadline
  MIN(aa.due_date) FILTER (
    WHERE aa.due_date >= CURRENT_DATE
    AND aa.completed_at IS NULL
  ) AS next_deadline

FROM public.authors a
LEFT JOIN public.cp_author_assignments aa ON a.id = aa.author_id
LEFT JOIN public.cp_content_items ci ON aa.content_item_id = ci.id
LEFT JOIN public.cp_workflow_statuses ws ON ci.workflow_status_id = ws.id
GROUP BY a.id, a.name, a.slug, a.avatar_url;

-- ============================================================================
-- cp_content_pipeline: Content pipeline summary by status
-- ============================================================================
CREATE OR REPLACE VIEW public.cp_content_pipeline AS
SELECT
  ws.id AS status_id,
  ws.slug AS status_slug,
  ws.name AS status_name,
  ws.color AS status_color,
  ws.display_order,
  ws.is_initial,
  ws.is_terminal,
  COUNT(ci.id) AS item_count,
  COUNT(ci.id) FILTER (WHERE ci.priority = 'urgent') AS urgent_count,
  COUNT(ci.id) FILTER (WHERE ci.priority = 'high') AS high_priority_count,
  COUNT(ci.id) FILTER (WHERE ci.due_date < CURRENT_DATE) AS overdue_count,
  ARRAY_AGG(DISTINCT ct.name) FILTER (WHERE ct.name IS NOT NULL) AS content_types
FROM public.cp_workflow_statuses ws
LEFT JOIN public.cp_content_items ci ON ws.id = ci.workflow_status_id
LEFT JOIN public.cp_content_types ct ON ci.content_type_id = ct.id
GROUP BY ws.id, ws.slug, ws.name, ws.color, ws.display_order, ws.is_initial, ws.is_terminal
ORDER BY ws.display_order;

-- ============================================================================
-- cp_campaign_summary: Campaign overview with content counts
-- ============================================================================
CREATE OR REPLACE VIEW public.cp_campaign_summary AS
SELECT
  c.id AS campaign_id,
  c.slug,
  c.name,
  c.description,
  c.status,
  c.color,
  c.start_date,
  c.end_date,
  r.name AS release_name,

  -- Content counts
  COUNT(DISTINCT ci.id) AS total_content_items,
  COUNT(DISTINCT ci.id) FILTER (WHERE ws.slug = 'published') AS published_items,
  COUNT(DISTINCT ci.id) FILTER (WHERE ws.slug = 'draft') AS draft_items,
  COUNT(DISTINCT ci.id) FILTER (WHERE ws.slug IN ('in_review', 'needs_revision')) AS in_progress_items,
  COUNT(DISTINCT ci.id) FILTER (WHERE ws.slug = 'scheduled') AS scheduled_items,

  -- Ideas and briefs
  COUNT(DISTINCT idea.id) AS total_ideas,
  COUNT(DISTINCT idea.id) FILTER (WHERE idea.status = 'approved') AS approved_ideas,
  COUNT(DISTINCT brief.id) AS total_briefs,

  -- Calendar events
  COUNT(DISTINCT ce.id) AS calendar_events,

  -- Progress percentage
  CASE
    WHEN COUNT(DISTINCT ci.id) > 0
    THEN ROUND((COUNT(DISTINCT ci.id) FILTER (WHERE ws.slug = 'published')::NUMERIC / COUNT(DISTINCT ci.id)) * 100, 1)
    ELSE 0
  END AS completion_percentage

FROM public.cp_campaigns c
LEFT JOIN public.releases r ON c.release_id = r.id
LEFT JOIN public.cp_content_items ci ON c.id = ci.campaign_id
LEFT JOIN public.cp_workflow_statuses ws ON ci.workflow_status_id = ws.id
LEFT JOIN public.cp_content_ideas idea ON c.id = idea.campaign_id
LEFT JOIN public.cp_content_briefs brief ON c.id = brief.campaign_id
LEFT JOIN public.cp_calendar_events ce ON c.id = ce.campaign_id
GROUP BY c.id, c.slug, c.name, c.description, c.status, c.color, c.start_date, c.end_date, r.name;

-- ============================================================================
-- Grant permissions on views
-- ============================================================================
GRANT SELECT ON public.cp_calendar_view TO authenticated;
GRANT SELECT ON public.cp_author_workload TO authenticated;
GRANT SELECT ON public.cp_content_pipeline TO authenticated;
GRANT SELECT ON public.cp_campaign_summary TO authenticated;

GRANT SELECT ON public.cp_calendar_view TO service_role;
GRANT SELECT ON public.cp_author_workload TO service_role;
GRANT SELECT ON public.cp_content_pipeline TO service_role;
GRANT SELECT ON public.cp_campaign_summary TO service_role;
