-- Auto-create profile (and school for admins) on user signup
-- This trigger runs after INSERT on auth.users

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  _school_id UUID;
  _role TEXT;
  _first_name TEXT;
  _last_name TEXT;
  _school_name TEXT;
BEGIN
  -- Extract metadata
  _role := COALESCE(NEW.raw_user_meta_data ->> 'role', 'teacher');
  _first_name := COALESCE(NEW.raw_user_meta_data ->> 'first_name', 'Unknown');
  _last_name := COALESCE(NEW.raw_user_meta_data ->> 'last_name', 'User');
  _school_name := NEW.raw_user_meta_data ->> 'school_name';

  -- If user is an admin, create a school first
  IF _role = 'admin' AND _school_name IS NOT NULL THEN
    INSERT INTO public.schools (name, email)
    VALUES (_school_name, NEW.email)
    RETURNING id INTO _school_id;
  ELSE
    -- For non-admin users, school_id must be provided in metadata
    _school_id := (NEW.raw_user_meta_data ->> 'school_id')::UUID;
  END IF;

  -- Create the profile
  INSERT INTO public.profiles (id, school_id, role, first_name, last_name, is_active)
  VALUES (NEW.id, _school_id, _role::user_role, _first_name, _last_name, true);

  RETURN NEW;
END;
$$;

-- Drop trigger first in case re-running migration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
