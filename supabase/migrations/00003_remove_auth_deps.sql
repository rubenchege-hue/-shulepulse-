-- Remove auth dependencies since we disabled authentication
-- 1. Drop FK constraint on profiles.id referencing auth.users
-- 2. Drop all RLS policies (they depend on auth.uid() which no longer works)
-- 3. Disable RLS on all tables

-- Drop foreign key constraint
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- Drop RLS policies on all tables
DROP POLICY IF EXISTS school_isolation ON schools;
DROP POLICY IF EXISTS profile_access ON profiles;
DROP POLICY IF EXISTS student_access ON students;

-- Also drop any auto-generated policies
DO $$
DECLARE
  _tbl TEXT;
  _pol TEXT;
BEGIN
  FOR _tbl IN
    SELECT unnest(ARRAY[
      'schools', 'profiles', 'students', 'classes', 'subjects',
      'academic_terms', 'assessments', 'assessment_scores',
      'cbc_strands', 'cbc_sub_strands', 'cbc_competency_records',
      'co_curricular_activities', 'co_curricular_records',
      'reports', 'attendance', 'student_parents'
    ])
  LOOP
    FOR _pol IN
      SELECT policyname FROM pg_policies WHERE tablename = _tbl
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON %I', _pol, _tbl);
    END LOOP;
  END LOOP;
END $$;

-- Disable RLS on all tables
ALTER TABLE schools DISABLE ROW LEVEL SECURITY;
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE students DISABLE ROW LEVEL SECURITY;
ALTER TABLE classes DISABLE ROW LEVEL SECURITY;
ALTER TABLE subjects DISABLE ROW LEVEL SECURITY;
ALTER TABLE academic_terms DISABLE ROW LEVEL SECURITY;
ALTER TABLE assessments DISABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_scores DISABLE ROW LEVEL SECURITY;
ALTER TABLE cbc_strands DISABLE ROW LEVEL SECURITY;
ALTER TABLE cbc_sub_strands DISABLE ROW LEVEL SECURITY;
ALTER TABLE cbc_competency_records DISABLE ROW LEVEL SECURITY;
ALTER TABLE co_curricular_activities DISABLE ROW LEVEL SECURITY;
ALTER TABLE co_curricular_records DISABLE ROW LEVEL SECURITY;
ALTER TABLE reports DISABLE ROW LEVEL SECURITY;
ALTER TABLE attendance DISABLE ROW LEVEL SECURITY;
ALTER TABLE student_parents DISABLE ROW LEVEL SECURITY;
