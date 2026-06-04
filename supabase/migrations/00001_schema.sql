-- School Management System - Full Schema
-- Supports CBC (Competency Based Curriculum) and 8-4-4 systems

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ====================
-- SCHOOLS
-- ====================
CREATE TABLE schools (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  email TEXT,
  code TEXT UNIQUE, -- school registration code
  logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================
-- PROFILES (extends auth.users)
-- ====================
CREATE TYPE user_role AS ENUM ('admin', 'teacher', 'parent', 'staff');

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'teacher',
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================
-- ACADEMIC YEARS / TERMS
-- ====================
CREATE TABLE academic_terms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- e.g., "Term 1", "Term 2", "Term 3"
  academic_year INTEGER NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_current BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================
-- CLASSES
-- ====================
CREATE TABLE classes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- e.g., "Grade 1", "Form 1", "Standard 7"
  section TEXT, -- e.g., "East", "West", "Blue", "Gold"
  curriculum_type TEXT CHECK (curriculum_type IN ('cbc', '8-4-4', 'both')) DEFAULT 'cbc',
  academic_term_id UUID REFERENCES academic_terms(id),
  capacity INTEGER DEFAULT 45,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================
-- SUBJECTS
-- ====================
CREATE TABLE subjects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT, -- e.g., "ENG", "MATH", "SCI"
  category TEXT CHECK (category IN ('academic', 'co-curricular')) DEFAULT 'academic',
  curriculum_type TEXT CHECK (curriculum_type IN ('cbc', '8-4-4', 'both')) DEFAULT 'both',
  is_compulsory BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================
-- STUDENTS
-- ====================
CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  admission_number TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  date_of_birth DATE,
  gender TEXT CHECK (gender IN ('male', 'female', 'other')),
  class_id UUID REFERENCES classes(id),
  enrollment_date DATE DEFAULT CURRENT_DATE,
  status TEXT CHECK (status IN ('active', 'transferred', 'graduated', 'withdrawn')) DEFAULT 'active',
  photo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================
-- STUDENT-PARENT RELATIONSHIP
-- ====================
CREATE TYPE relationship_type AS ENUM ('father', 'mother', 'guardian', 'other');

CREATE TABLE student_parents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  relationship relationship_type DEFAULT 'other',
  is_primary_contact BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, parent_id)
);

-- ====================
-- 8-4-4 ASSESSMENTS
-- ====================
CREATE TYPE assessment_type AS ENUM ('midterm', 'endterm', 'cat', 'quiz', 'assignment');

CREATE TABLE assessments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  class_id UUID REFERENCES classes(id),
  subject_id UUID REFERENCES subjects(id),
  academic_term_id UUID REFERENCES academic_terms(id),
  name TEXT NOT NULL, -- e.g., "End Term 1 Exam 2025"
  type assessment_type NOT NULL DEFAULT 'endterm',
  max_score DECIMAL(5,2) DEFAULT 100,
  date DATE NOT NULL,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE assessment_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assessment_id UUID REFERENCES assessments(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  score DECIMAL(5,2) NOT NULL,
  grade TEXT, -- e.g., "A", "B+", "C", computed or manual
  remarks TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(assessment_id, student_id)
);

-- ====================
-- CBC COMPETENCY TRACKING
-- ====================
CREATE TYPE cbc_rating AS ENUM ('E', 'B', 'A', 'P');
-- E = Exceeding Expectations
-- B = Meeting Expectations
-- A = Approaching Expectations
-- P = Below Expectations

CREATE TABLE cbc_strands (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  strand_code TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE cbc_sub_strands (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  strand_id UUID REFERENCES cbc_strands(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sub_strand_code TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE cbc_competency_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  sub_strand_id UUID REFERENCES cbc_sub_strands(id) ON DELETE CASCADE,
  academic_term_id UUID REFERENCES academic_terms(id),
  teacher_id UUID REFERENCES profiles(id),
  rating cbc_rating NOT NULL,
  notes TEXT,
  date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, sub_strand_id, academic_term_id)
);

-- ====================
-- CO-CURRICULAR ACTIVITIES
-- ====================
CREATE TYPE co_curricular_category AS ENUM (
  'sports', 'music', 'drama', 'debate', 'scouts', 
  'clubs', 'arts', 'community_service', 'other'
);

CREATE TABLE co_curricular_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category co_curricular_category NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TYPE progress_level AS ENUM ('beginner', 'developing', 'competent', 'excellent', 'outstanding');

CREATE TABLE co_curricular_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  activity_id UUID REFERENCES co_curricular_activities(id) ON DELETE CASCADE,
  academic_term_id UUID REFERENCES academic_terms(id),
  teacher_id UUID REFERENCES profiles(id),
  progress_level progress_level DEFAULT 'developing',
  achievements TEXT, -- e.g., "Won 1st place in inter-school competition"
  notes TEXT,
  date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, activity_id, academic_term_id)
);

-- ====================
-- REPORTS
-- ====================
CREATE TYPE report_template AS ENUM ('cbc', '8-4-4', 'combined');
CREATE TYPE report_status AS ENUM ('draft', 'published');

CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  academic_term_id UUID REFERENCES academic_terms(id),
  generated_by UUID REFERENCES profiles(id),
  template_type report_template NOT NULL DEFAULT 'combined',
  status report_status DEFAULT 'draft',
  content JSONB, -- full report data stored as JSON
  pdf_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, academic_term_id, template_type)
);

-- ====================
-- ATTENDANCE
-- ====================
CREATE TYPE attendance_status AS ENUM ('present', 'absent', 'late', 'excused');

CREATE TABLE attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  class_id UUID REFERENCES classes(id),
  date DATE NOT NULL,
  status attendance_status NOT NULL DEFAULT 'present',
  remarks TEXT,
  marked_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, date)
);

-- ====================
-- INDEXES
-- ====================
CREATE INDEX idx_profiles_school ON profiles(school_id);
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_students_school ON students(school_id);
CREATE INDEX idx_students_class ON students(class_id);
CREATE INDEX idx_students_admission ON students(admission_number);
CREATE INDEX idx_assessment_scores_student ON assessment_scores(student_id);
CREATE INDEX idx_assessment_scores_assessment ON assessment_scores(assessment_id);
CREATE INDEX idx_cbc_records_student ON cbc_competency_records(student_id);
CREATE INDEX idx_cbc_records_term ON cbc_competency_records(academic_term_id);
CREATE INDEX idx_cocurricular_records_student ON co_curricular_records(student_id);
CREATE INDEX idx_attendance_student ON attendance(student_id);
CREATE INDEX idx_attendance_date ON attendance(date);
CREATE INDEX idx_reports_student ON reports(student_id);
CREATE INDEX idx_student_parents_parent ON student_parents(parent_id);
CREATE INDEX idx_student_parents_student ON student_parents(student_id);

-- ====================
-- ROW LEVEL SECURITY
-- ====================
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE academic_terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE cbc_strands ENABLE ROW LEVEL SECURITY;
ALTER TABLE cbc_sub_strands ENABLE ROW LEVEL SECURITY;
ALTER TABLE cbc_competency_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE co_curricular_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE co_curricular_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_parents ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies: users can see data from their own school
CREATE POLICY school_isolation ON schools
  FOR ALL USING (id IN (
    SELECT school_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY profile_access ON profiles
  FOR ALL USING (school_id IN (
    SELECT school_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY student_access ON students
  FOR ALL USING (school_id IN (
    SELECT school_id FROM profiles WHERE id = auth.uid()
  ));

-- Similarly for other tables (simplified for migration)
-- In production, add more granular policies per role
