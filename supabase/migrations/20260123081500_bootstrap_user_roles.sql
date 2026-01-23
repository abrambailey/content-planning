-- Migration: Bootstrap user roles
-- Assigns roles to existing users and auto-assigns to new users

-- ============================================================================
-- Assign 'admin' role to all existing users (bootstrap)
-- ============================================================================
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'
FROM auth.users
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_roles ur
  WHERE ur.user_id = auth.users.id
)
ON CONFLICT (user_id) DO NOTHING;

-- ============================================================================
-- Create trigger function to auto-assign 'editor' role to new users
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto-assign 'editor' role to new users
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'editor')
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Create trigger on auth.users to auto-assign role
-- ============================================================================
DROP TRIGGER IF EXISTS on_auth_user_created_assign_role ON auth.users;

CREATE TRIGGER on_auth_user_created_assign_role
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_role();

-- ============================================================================
-- Grant necessary permissions
-- ============================================================================
GRANT EXECUTE ON FUNCTION public.handle_new_user_role TO service_role;
