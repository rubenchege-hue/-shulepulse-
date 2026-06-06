// Database types matching the Supabase schema

export type UserRole = "admin" | "teacher" | "parent" | "staff";
export type CurriculumType = "cbc" | "8-4-4" | "both";
export type SubjectCategory = "academic" | "co-curricular";
export type Gender = "male" | "female" | "other";
export type StudentStatus = "active" | "transferred" | "graduated" | "withdrawn";
export type RelationshipType = "father" | "mother" | "guardian" | "other";
export type AssessmentType = "midterm" | "endterm" | "cat" | "quiz" | "assignment";
export type CbcRating = "E" | "B" | "A" | "P";
export type CoCurricularCategory = "sports" | "music" | "drama" | "debate" | "scouts" | "clubs" | "arts" | "community_service" | "other";
export type ProgressLevel = "beginner" | "developing" | "competent" | "excellent" | "outstanding";
export type ReportTemplate = "cbc" | "8-4-4" | "combined";
export type ReportStatus = "draft" | "published";
export type AttendanceStatus = "present" | "absent" | "late" | "excused";

export interface School {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  code: string | null;
  logo_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  school_id: string | null;
  role: UserRole;
  first_name: string;
  last_name: string;
  phone: string | null;
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AcademicTerm {
  id: string;
  school_id: string;
  name: string;
  academic_year: number;
  start_date: string;
  end_date: string;
  is_current: boolean;
  created_at: string;
}

export interface Class {
  id: string;
  school_id: string;
  name: string;
  section: string | null;
  curriculum_type: CurriculumType;
  academic_term_id: string | null;
  teacher_id: string | null;
  capacity: number;
  created_at: string;
}

export interface Subject {
  id: string;
  school_id: string;
  name: string;
  code: string | null;
  category: SubjectCategory;
  curriculum_type: CurriculumType;
  is_compulsory: boolean;
  created_at: string;
}

export interface Student {
  id: string;
  school_id: string;
  admission_number: string;
  first_name: string;
  last_name: string;
  date_of_birth: string | null;
  gender: Gender | null;
  class_id: string | null;
  enrollment_date: string;
  status: StudentStatus;
  photo_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface StudentWithClass extends Student {
  classes?: Class;
}

export interface StudentParent {
  id: string;
  student_id: string;
  parent_id: string;
  relationship: RelationshipType;
  is_primary_contact: boolean;
  created_at: string;
}

export interface Assessment {
  id: string;
  school_id: string;
  class_id: string | null;
  subject_id: string | null;
  academic_term_id: string | null;
  name: string;
  type: AssessmentType;
  max_score: number;
  date: string;
  created_by: string | null;
  created_at: string;
}

export interface AssessmentScore {
  id: string;
  assessment_id: string;
  student_id: string;
  score: number;
  grade: string | null;
  remarks: string | null;
  created_at: string;
}

export interface CbcStrand {
  id: string;
  school_id: string;
  subject_id: string;
  name: string;
  strand_code: string | null;
  description: string | null;
  created_at: string;
}

export interface CbcSubStrand {
  id: string;
  strand_id: string;
  name: string;
  sub_strand_code: string | null;
  description: string | null;
  created_at: string;
}

export interface CbcCompetencyRecord {
  id: string;
  student_id: string;
  sub_strand_id: string;
  academic_term_id: string | null;
  teacher_id: string | null;
  rating: CbcRating;
  notes: string | null;
  date: string;
  created_at: string;
}

export interface CoCurricularActivity {
  id: string;
  school_id: string;
  name: string;
  category: CoCurricularCategory;
  description: string | null;
  is_active: boolean;
  created_at: string;
}

export interface CoCurricularRecord {
  id: string;
  student_id: string;
  activity_id: string;
  academic_term_id: string | null;
  teacher_id: string | null;
  progress_level: ProgressLevel;
  achievements: string | null;
  notes: string | null;
  date: string;
  created_at: string;
}

export interface Report {
  id: string;
  student_id: string;
  academic_term_id: string;
  generated_by: string | null;
  template_type: ReportTemplate;
  status: ReportStatus;
  content: Record<string, unknown> | null;
  pdf_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Attendance {
  id: string;
  student_id: string;
  class_id: string | null;
  date: string;
  status: AttendanceStatus;
  remarks: string | null;
  marked_by: string | null;
  created_at: string;
}

// Helper type for full student profile with related data
export interface StudentFullProfile extends Student {
  class?: Class;
  parents?: (Profile & { relationship: RelationshipType; is_primary_contact: boolean })[];
}
