-- Auto-assign admin role to specific emails, editor to everyone else

CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS TRIGGER AS $$
DECLARE
  admin_emails TEXT[] := ARRAY['abram@hearingtracker.com', 'brian@hearingtracker.com'];
BEGIN
  IF NEW.email = ANY(admin_emails) THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id) DO UPDATE SET role = 'admin';
  ELSE
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'editor')
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure existing admin emails have admin role
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'
FROM auth.users
WHERE email IN ('abram@hearingtracker.com', 'brian@hearingtracker.com')
ON CONFLICT (user_id) DO UPDATE SET role = 'admin';
