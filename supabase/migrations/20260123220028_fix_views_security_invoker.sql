-- Fix SECURITY DEFINER issue on views
-- Views should use security_invoker = true to respect RLS policies
-- of the underlying tables based on the querying user

ALTER VIEW public.cp_author_workload SET (security_invoker = true);
ALTER VIEW public.cp_calendar_view SET (security_invoker = true);
ALTER VIEW public.cp_campaign_summary SET (security_invoker = true);
ALTER VIEW public.cp_content_pipeline SET (security_invoker = true);
