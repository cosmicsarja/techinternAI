-- Allow companies to insert student profiles for seeding purposes
-- Drop the old INSERT policy
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

-- Create new policy that allows companies and admins to seed student profiles
CREATE POLICY "Users can insert profiles" ON public.profiles 
FOR INSERT TO authenticated 
WITH CHECK (
  -- Allow if inserting own profile
  auth.uid() = id 
  OR 
  -- Allow if the authenticated user is a company or admin
  (SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1) IN ('admin', 'company')
);

-- Create a function to handle seeding that bypasses RLS
CREATE OR REPLACE FUNCTION public.seed_student_profiles(students JSONB[])
RETURNS TABLE(success BOOLEAN, message TEXT, inserted_count INT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  student JSONB;
  inserted_count INT := 0;
BEGIN
  -- Only allow admins and companies to seed
  IF (SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1) NOT IN ('admin', 'company') THEN
    RETURN QUERY SELECT false, 'Permission denied. Only admins and companies can seed students.'::TEXT, 0;
    RETURN;
  END IF;

  FOREACH student IN ARRAY students LOOP
    INSERT INTO public.profiles (name, email, role, skill_score, github_url, avatar_url, bio, created_at, updated_at)
    VALUES (
      student->>'name',
      student->>'email',
      'student'::app_role,
      (student->>'skill_score')::INTEGER,
      student->>'github_url',
      student->>'avatar_url',
      student->>'bio',
      NOW(),
      NOW()
    )
    ON CONFLICT (email) DO NOTHING;
    
    IF FOUND THEN
      inserted_count := inserted_count + 1;
    END IF;
  END LOOP;

  RETURN QUERY SELECT true, 'Successfully seeded students'::TEXT, inserted_count;
END;
$$;
