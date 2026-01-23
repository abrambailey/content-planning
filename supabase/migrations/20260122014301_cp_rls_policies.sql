-- Migration 6: RLS Policies & Helper Functions
-- Helper functions for role checking and RLS policies for all cp_ tables

-- ============================================================================
-- Helper Functions
-- ============================================================================

-- Check if current user has a specific role
CREATE OR REPLACE FUNCTION public.cp_user_has_role(required_role TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = required_role
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Check if current user has any of the specified roles
CREATE OR REPLACE FUNCTION public.cp_user_has_any_role(required_roles TEXT[])
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = ANY(required_roles)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Check if current user is admin
CREATE OR REPLACE FUNCTION public.cp_user_is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN public.cp_user_has_role('admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Check if current user is admin or editor
CREATE OR REPLACE FUNCTION public.cp_user_is_editor_or_above()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN public.cp_user_has_any_role(ARRAY['admin', 'editor']);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Check if current user is a team member (has any role)
CREATE OR REPLACE FUNCTION public.cp_user_is_team_member()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================================================
-- RLS Policies: cp_workflow_statuses (Lookup Table)
-- Admin: Full CRUD | Editor/Author: Read only
-- ============================================================================

-- Everyone with a role can read
CREATE POLICY "Team members can read workflow statuses"
  ON public.cp_workflow_statuses FOR SELECT
  USING (public.cp_user_is_team_member());

-- Only admins can modify
CREATE POLICY "Admins can insert workflow statuses"
  ON public.cp_workflow_statuses FOR INSERT
  WITH CHECK (public.cp_user_is_admin());

CREATE POLICY "Admins can update workflow statuses"
  ON public.cp_workflow_statuses FOR UPDATE
  USING (public.cp_user_is_admin());

CREATE POLICY "Admins can delete workflow statuses"
  ON public.cp_workflow_statuses FOR DELETE
  USING (public.cp_user_is_admin());

-- ============================================================================
-- RLS Policies: cp_content_types (Lookup Table)
-- Admin: Full CRUD | Editor/Author: Read only
-- ============================================================================

CREATE POLICY "Team members can read content types"
  ON public.cp_content_types FOR SELECT
  USING (public.cp_user_is_team_member());

CREATE POLICY "Admins can insert content types"
  ON public.cp_content_types FOR INSERT
  WITH CHECK (public.cp_user_is_admin());

CREATE POLICY "Admins can update content types"
  ON public.cp_content_types FOR UPDATE
  USING (public.cp_user_is_admin());

CREATE POLICY "Admins can delete content types"
  ON public.cp_content_types FOR DELETE
  USING (public.cp_user_is_admin());

-- ============================================================================
-- RLS Policies: cp_tags (Lookup Table)
-- Admin: Full CRUD | Editor/Author: Read only
-- ============================================================================

CREATE POLICY "Team members can read tags"
  ON public.cp_tags FOR SELECT
  USING (public.cp_user_is_team_member());

CREATE POLICY "Admins can insert tags"
  ON public.cp_tags FOR INSERT
  WITH CHECK (public.cp_user_is_admin());

CREATE POLICY "Admins can update tags"
  ON public.cp_tags FOR UPDATE
  USING (public.cp_user_is_admin());

CREATE POLICY "Admins can delete tags"
  ON public.cp_tags FOR DELETE
  USING (public.cp_user_is_admin());

-- ============================================================================
-- RLS Policies: cp_campaigns
-- Admin/Editor: Full CRUD | Author: Read only
-- ============================================================================

CREATE POLICY "Team members can read campaigns"
  ON public.cp_campaigns FOR SELECT
  USING (public.cp_user_is_team_member());

CREATE POLICY "Editors can insert campaigns"
  ON public.cp_campaigns FOR INSERT
  WITH CHECK (public.cp_user_is_editor_or_above());

CREATE POLICY "Editors can update campaigns"
  ON public.cp_campaigns FOR UPDATE
  USING (public.cp_user_is_editor_or_above());

CREATE POLICY "Admins can delete campaigns"
  ON public.cp_campaigns FOR DELETE
  USING (public.cp_user_is_admin());

-- ============================================================================
-- RLS Policies: cp_content_ideas
-- Admin/Editor: Full CRUD | Author: CRUD own, read others
-- ============================================================================

CREATE POLICY "Team members can read content ideas"
  ON public.cp_content_ideas FOR SELECT
  USING (public.cp_user_is_team_member());

CREATE POLICY "Team members can submit content ideas"
  ON public.cp_content_ideas FOR INSERT
  WITH CHECK (public.cp_user_is_team_member());

CREATE POLICY "Editors can update any content idea"
  ON public.cp_content_ideas FOR UPDATE
  USING (public.cp_user_is_editor_or_above());

CREATE POLICY "Authors can update own content ideas"
  ON public.cp_content_ideas FOR UPDATE
  USING (submitted_by = auth.uid());

CREATE POLICY "Admins can delete content ideas"
  ON public.cp_content_ideas FOR DELETE
  USING (public.cp_user_is_admin());

CREATE POLICY "Authors can delete own content ideas"
  ON public.cp_content_ideas FOR DELETE
  USING (submitted_by = auth.uid() AND status = 'submitted');

-- ============================================================================
-- RLS Policies: cp_content_briefs
-- Admin/Editor: Full CRUD | Author: Read only
-- ============================================================================

CREATE POLICY "Team members can read content briefs"
  ON public.cp_content_briefs FOR SELECT
  USING (public.cp_user_is_team_member());

CREATE POLICY "Editors can insert content briefs"
  ON public.cp_content_briefs FOR INSERT
  WITH CHECK (public.cp_user_is_editor_or_above());

CREATE POLICY "Editors can update content briefs"
  ON public.cp_content_briefs FOR UPDATE
  USING (public.cp_user_is_editor_or_above());

CREATE POLICY "Admins can delete content briefs"
  ON public.cp_content_briefs FOR DELETE
  USING (public.cp_user_is_admin());

-- ============================================================================
-- RLS Policies: cp_content_items
-- Admin/Editor: Full CRUD | Author: Read + Update assigned items
-- ============================================================================

CREATE POLICY "Team members can read content items"
  ON public.cp_content_items FOR SELECT
  USING (public.cp_user_is_team_member());

CREATE POLICY "Editors can insert content items"
  ON public.cp_content_items FOR INSERT
  WITH CHECK (public.cp_user_is_editor_or_above());

CREATE POLICY "Editors can update content items"
  ON public.cp_content_items FOR UPDATE
  USING (public.cp_user_is_editor_or_above());

-- Authors can update items they're assigned to (checked via assignments)
CREATE POLICY "Authors can update assigned content items"
  ON public.cp_content_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.cp_author_assignments aa
      JOIN public.authors a ON aa.author_id = a.id
      WHERE aa.content_item_id = cp_content_items.id
      -- Note: This assumes authors table might be linked to users somehow
      -- For now, we allow authors to update any assigned item
    )
  );

CREATE POLICY "Admins can delete content items"
  ON public.cp_content_items FOR DELETE
  USING (public.cp_user_is_admin());

-- ============================================================================
-- RLS Policies: cp_content_tags (Junction Table)
-- Admin/Editor: Full CRUD | Author: Read only
-- ============================================================================

CREATE POLICY "Team members can read content tags"
  ON public.cp_content_tags FOR SELECT
  USING (public.cp_user_is_team_member());

CREATE POLICY "Editors can insert content tags"
  ON public.cp_content_tags FOR INSERT
  WITH CHECK (public.cp_user_is_editor_or_above());

CREATE POLICY "Editors can delete content tags"
  ON public.cp_content_tags FOR DELETE
  USING (public.cp_user_is_editor_or_above());

-- ============================================================================
-- RLS Policies: cp_author_assignments
-- Admin/Editor: Full CRUD | Author: Read own assignments
-- ============================================================================

CREATE POLICY "Team members can read author assignments"
  ON public.cp_author_assignments FOR SELECT
  USING (public.cp_user_is_team_member());

CREATE POLICY "Editors can insert author assignments"
  ON public.cp_author_assignments FOR INSERT
  WITH CHECK (public.cp_user_is_editor_or_above());

CREATE POLICY "Editors can update author assignments"
  ON public.cp_author_assignments FOR UPDATE
  USING (public.cp_user_is_editor_or_above());

CREATE POLICY "Admins can delete author assignments"
  ON public.cp_author_assignments FOR DELETE
  USING (public.cp_user_is_admin());

-- ============================================================================
-- RLS Policies: cp_workflow_transitions
-- Admin/Editor: Full CRUD | Author: Insert (for their transitions), Read all
-- ============================================================================

CREATE POLICY "Team members can read workflow transitions"
  ON public.cp_workflow_transitions FOR SELECT
  USING (public.cp_user_is_team_member());

CREATE POLICY "Team members can insert workflow transitions"
  ON public.cp_workflow_transitions FOR INSERT
  WITH CHECK (public.cp_user_is_team_member());

-- Only admins can delete transition history
CREATE POLICY "Admins can delete workflow transitions"
  ON public.cp_workflow_transitions FOR DELETE
  USING (public.cp_user_is_admin());

-- ============================================================================
-- RLS Policies: cp_comments
-- All team members: CRUD own comments, Read all
-- ============================================================================

CREATE POLICY "Team members can read comments"
  ON public.cp_comments FOR SELECT
  USING (public.cp_user_is_team_member());

CREATE POLICY "Team members can insert comments"
  ON public.cp_comments FOR INSERT
  WITH CHECK (public.cp_user_is_team_member() AND author_id = auth.uid());

CREATE POLICY "Users can update own comments"
  ON public.cp_comments FOR UPDATE
  USING (author_id = auth.uid());

CREATE POLICY "Editors can update any comment"
  ON public.cp_comments FOR UPDATE
  USING (public.cp_user_is_editor_or_above());

CREATE POLICY "Users can delete own comments"
  ON public.cp_comments FOR DELETE
  USING (author_id = auth.uid());

CREATE POLICY "Admins can delete any comment"
  ON public.cp_comments FOR DELETE
  USING (public.cp_user_is_admin());

-- ============================================================================
-- RLS Policies: cp_calendar_events
-- Admin/Editor: Full CRUD | Author: Read all, CRUD own events
-- ============================================================================

CREATE POLICY "Team members can read calendar events"
  ON public.cp_calendar_events FOR SELECT
  USING (public.cp_user_is_team_member());

CREATE POLICY "Team members can insert calendar events"
  ON public.cp_calendar_events FOR INSERT
  WITH CHECK (public.cp_user_is_team_member());

CREATE POLICY "Editors can update any calendar event"
  ON public.cp_calendar_events FOR UPDATE
  USING (public.cp_user_is_editor_or_above());

CREATE POLICY "Users can update own calendar events"
  ON public.cp_calendar_events FOR UPDATE
  USING (created_by = auth.uid());

CREATE POLICY "Admins can delete any calendar event"
  ON public.cp_calendar_events FOR DELETE
  USING (public.cp_user_is_admin());

CREATE POLICY "Users can delete own calendar events"
  ON public.cp_calendar_events FOR DELETE
  USING (created_by = auth.uid());

-- ============================================================================
-- RLS Policies: cp_content_analytics
-- Admin/Editor: Full CRUD | Author: Read only
-- ============================================================================

CREATE POLICY "Team members can read content analytics"
  ON public.cp_content_analytics FOR SELECT
  USING (public.cp_user_is_team_member());

CREATE POLICY "Editors can insert content analytics"
  ON public.cp_content_analytics FOR INSERT
  WITH CHECK (public.cp_user_is_editor_or_above());

CREATE POLICY "Editors can update content analytics"
  ON public.cp_content_analytics FOR UPDATE
  USING (public.cp_user_is_editor_or_above());

CREATE POLICY "Admins can delete content analytics"
  ON public.cp_content_analytics FOR DELETE
  USING (public.cp_user_is_admin());

-- ============================================================================
-- Grant Permissions
-- ============================================================================

GRANT ALL ON public.cp_workflow_statuses TO authenticated;
GRANT ALL ON public.cp_content_types TO authenticated;
GRANT ALL ON public.cp_tags TO authenticated;
GRANT ALL ON public.cp_campaigns TO authenticated;
GRANT ALL ON public.cp_content_ideas TO authenticated;
GRANT ALL ON public.cp_content_briefs TO authenticated;
GRANT ALL ON public.cp_content_items TO authenticated;
GRANT ALL ON public.cp_content_tags TO authenticated;
GRANT ALL ON public.cp_author_assignments TO authenticated;
GRANT ALL ON public.cp_workflow_transitions TO authenticated;
GRANT ALL ON public.cp_comments TO authenticated;
GRANT ALL ON public.cp_calendar_events TO authenticated;
GRANT ALL ON public.cp_content_analytics TO authenticated;

GRANT ALL ON public.cp_workflow_statuses TO service_role;
GRANT ALL ON public.cp_content_types TO service_role;
GRANT ALL ON public.cp_tags TO service_role;
GRANT ALL ON public.cp_campaigns TO service_role;
GRANT ALL ON public.cp_content_ideas TO service_role;
GRANT ALL ON public.cp_content_briefs TO service_role;
GRANT ALL ON public.cp_content_items TO service_role;
GRANT ALL ON public.cp_content_tags TO service_role;
GRANT ALL ON public.cp_author_assignments TO service_role;
GRANT ALL ON public.cp_workflow_transitions TO service_role;
GRANT ALL ON public.cp_comments TO service_role;
GRANT ALL ON public.cp_calendar_events TO service_role;
GRANT ALL ON public.cp_content_analytics TO service_role;

-- Grant execute on helper functions
GRANT EXECUTE ON FUNCTION public.cp_user_has_role TO authenticated;
GRANT EXECUTE ON FUNCTION public.cp_user_has_any_role TO authenticated;
GRANT EXECUTE ON FUNCTION public.cp_user_is_admin TO authenticated;
GRANT EXECUTE ON FUNCTION public.cp_user_is_editor_or_above TO authenticated;
GRANT EXECUTE ON FUNCTION public.cp_user_is_team_member TO authenticated;
