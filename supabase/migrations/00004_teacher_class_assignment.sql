-- Add teacher_id to classes for homeroom/form teacher assignment
-- A class can have one designated teacher

ALTER TABLE classes ADD COLUMN IF NOT EXISTS teacher_id UUID REFERENCES profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_classes_teacher ON classes(teacher_id);
