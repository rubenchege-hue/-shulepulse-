-- ============================================================
-- SHULEPULSE - DEMO SEED DATA
-- ============================================================
-- Run migrations 00001, 00002, and 00003 first, then this seed.
-- No auth required — uses fixed UUIDs for profiles.
-- ============================================================

DO $$
DECLARE
  _school_id UUID := gen_random_uuid();

  -- Fixed UUIDs for demo profiles (must match src/constants.ts)
  _admin_id  UUID := '00000000-0000-0000-0000-000000000000';
  _parent_id UUID := '00000000-0000-0000-0000-000000000001';
  _teacher_id UUID := gen_random_uuid();

  -- Terms
  _t1 UUID := gen_random_uuid();
  _t2 UUID := gen_random_uuid();
  _t3 UUID := gen_random_uuid();

  -- Classes
  _g1e UUID := gen_random_uuid();
  _g1w UUID := gen_random_uuid();
  _g2  UUID := gen_random_uuid();
  _g3  UUID := gen_random_uuid();
  _g4  UUID := gen_random_uuid();
  _f1  UUID := gen_random_uuid();
  _f2  UUID := gen_random_uuid();

  -- Subjects
  _math UUID := gen_random_uuid();
  _eng  UUID := gen_random_uuid();
  _kisw UUID := gen_random_uuid();
  _sci  UUID := gen_random_uuid();
  _sst  UUID := gen_random_uuid();
  _agri UUID := gen_random_uuid();
  _cre  UUID := gen_random_uuid();
  _hist UUID := gen_random_uuid();
  _chem UUID := gen_random_uuid();
  _bio  UUID := gen_random_uuid();
  _phy  UUID := gen_random_uuid();

  -- Strands
  _sn UUID;

  -- Students
  _s1  UUID := gen_random_uuid();
  _s2  UUID := gen_random_uuid();
  _s3  UUID := gen_random_uuid();
  _s4  UUID := gen_random_uuid();
  _s5  UUID := gen_random_uuid();
  _s6  UUID := gen_random_uuid();
  _s7  UUID := gen_random_uuid();
  _s8  UUID := gen_random_uuid();
  _s9  UUID := gen_random_uuid();
  _s10 UUID := gen_random_uuid();
  _s11 UUID := gen_random_uuid();
  _s12 UUID := gen_random_uuid();
  _s13 UUID := gen_random_uuid();
  _s14 UUID := gen_random_uuid();
  _s15 UUID := gen_random_uuid();
  _s16 UUID := gen_random_uuid();
  _s17 UUID := gen_random_uuid();
  _s18 UUID := gen_random_uuid();
  _s19 UUID := gen_random_uuid();
  _s20 UUID := gen_random_uuid();
  _s21 UUID := gen_random_uuid();
  _s22 UUID := gen_random_uuid();

  -- Additional Assessments
  _amg1_mid UUID := gen_random_uuid();
  _akg1     UUID := gen_random_uuid();
  _amg1w    UUID := gen_random_uuid();
  _aeg1w    UUID := gen_random_uuid();
  _akg1w    UUID := gen_random_uuid();
  _amg2     UUID := gen_random_uuid();
  _aeg2     UUID := gen_random_uuid();
  _asg2     UUID := gen_random_uuid();
  _amg3_e   UUID := gen_random_uuid();
  _aeg3_e   UUID := gen_random_uuid();
  _amg4     UUID := gen_random_uuid();
  _aeg4     UUID := gen_random_uuid();
  _asg4     UUID := gen_random_uuid();
  _akh1     UUID := gen_random_uuid();
  _ahh1     UUID := gen_random_uuid();
  _ach1     UUID := gen_random_uuid();
  _amf2     UUID := gen_random_uuid();
  _aef2     UUID := gen_random_uuid();
  _abf2     UUID := gen_random_uuid();

  -- Activities
  _af  UUID := gen_random_uuid();
  _an  UUID := gen_random_uuid();
  _aat UUID := gen_random_uuid();
  _ad  UUID := gen_random_uuid();
  _ade UUID := gen_random_uuid();
  _am  UUID := gen_random_uuid();
  _ayf UUID := gen_random_uuid();

  -- Assessments
  _amg1 UUID := gen_random_uuid();
  _aeg1 UUID := gen_random_uuid();
  _asg3 UUID := gen_random_uuid();
  _amf1 UUID := gen_random_uuid();
  _aef1 UUID := gen_random_uuid();

  _ss_id UUID;

BEGIN
  -- ============================================================
  -- 1. SCHOOL
  -- ============================================================
  INSERT INTO schools (id, name, address, phone, email, code)
  VALUES (_school_id, 'Moi Educational Centre',
          '123 Kenyatta Avenue, Nairobi',
          '+254 712 345 678', 'info@moieducation.ac.ke', 'MEC001');

  -- ============================================================
  -- 2. PROFILES (Admin, Parent, Teacher)
  -- ============================================================
  INSERT INTO profiles (id, school_id, role, first_name, last_name, phone, is_active)
  VALUES
    (_admin_id,  _school_id, 'admin',   'Jane',   'Kamau',  '+254 712 345 678', true),
    (_parent_id, _school_id, 'parent',  'Grace',  'Kimani', '+254 723 456 789', true),
    (_teacher_id,_school_id, 'teacher', 'John',   'Mwangi', '+254 734 567 890', true);

  -- ============================================================
  -- 3. ACADEMIC TERMS (2025)
  -- ============================================================
  INSERT INTO academic_terms (id, school_id, name, academic_year, start_date, end_date, is_current)
  VALUES
    (_t1, _school_id, 'Term 1', 2025, '2025-01-13', '2025-04-04', false),
    (_t2, _school_id, 'Term 2', 2025, '2025-05-05', '2025-08-08', true),
    (_t3, _school_id, 'Term 3', 2025, '2025-09-01', '2025-11-21', false);

  -- ============================================================
  -- 5. CLASSES
  -- ============================================================
  INSERT INTO classes (id, school_id, name, section, curriculum_type, academic_term_id, capacity)
  VALUES
    (_g1e, _school_id, 'Grade 1', 'East', 'cbc',  _t2, 45),
    (_g1w, _school_id, 'Grade 1', 'West', 'cbc',  _t2, 45),
    (_g2,  _school_id, 'Grade 2', NULL,   'cbc',  _t2, 45),
    (_g3,  _school_id, 'Grade 3', NULL,   'cbc',  _t2, 45),
    (_g4,  _school_id, 'Grade 4', NULL,   'cbc',  _t2, 45),
    (_f1,  _school_id, 'Form 1',  NULL,   '8-4-4', _t2, 45),
    (_f2,  _school_id, 'Form 2',  NULL,   '8-4-4', _t2, 45);

  -- ============================================================
  -- 6. SUBJECTS
  -- ============================================================
  INSERT INTO subjects (id, school_id, name, code, category, curriculum_type, is_compulsory)
  VALUES
    (_math, _school_id, 'Mathematics',              'MATH', 'academic', 'both',  true),
    (_eng,  _school_id, 'English',                  'ENG',  'academic', 'both',  true),
    (_kisw, _school_id, 'Kiswahili',                'KISW', 'academic', 'both',  true),
    (_sci,  _school_id, 'Science & Technology',     'SCI',  'academic', 'cbc',   true),
    (_sst,  _school_id, 'Social Studies',           'SST',  'academic', 'cbc',   true),
    (_agri, _school_id, 'Agriculture',              'AGR',  'academic', 'cbc',   false),
    (_cre,  _school_id, 'Religious Education (CRE)','CRE',  'academic', '8-4-4', false),
    (_hist, _school_id, 'History & Government',     'HIST', 'academic', '8-4-4', true),
    (_chem, _school_id, 'Chemistry',                'CHEM', 'academic', '8-4-4', true),
    (_bio,  _school_id, 'Biology',                  'BIO',  'academic', '8-4-4', true),
    (_phy,  _school_id, 'Physics',                  'PHY',  'academic', '8-4-4', true);

  -- ============================================================
  -- 7. CBC STRANDS & SUB-STRANDS
  -- ============================================================
  INSERT INTO cbc_strands (id, school_id, subject_id, name, strand_code, description)
  VALUES (gen_random_uuid(), _school_id, _math, 'Numbers', 'NUM', 'Understanding numbers and operations')
  RETURNING id INTO _sn;
  INSERT INTO cbc_sub_strands (strand_id, name, sub_strand_code, description) VALUES
    (_sn, 'Counting and place value',        'NUM-01', 'Count, read and write numbers up to 100'),
    (_sn, 'Addition and subtraction',        'NUM-02', 'Add and subtract numbers up to 100'),
    (_sn, 'Multiplication and division',     'NUM-03', 'Basic multiplication and division facts'),
    (_sn, 'Fractions',                       'NUM-04', 'Recognize and work with halves and quarters');

  INSERT INTO cbc_strands (id, school_id, subject_id, name, strand_code, description)
  VALUES (gen_random_uuid(), _school_id, _math, 'Measurement', 'MEA', 'Length, mass, capacity, time and money')
  RETURNING id INTO _sn;
  INSERT INTO cbc_sub_strands (strand_id, name, sub_strand_code, description) VALUES
    (_sn, 'Length, mass and capacity',       'MEA-01', 'Measure and compare length, mass and capacity'),
    (_sn, 'Time',                            'MEA-02', 'Tell time and understand calendars'),
    (_sn, 'Money',                           'MEA-03', 'Identify and work with Kenyan currency');

  INSERT INTO cbc_strands (id, school_id, subject_id, name, strand_code, description)
  VALUES (gen_random_uuid(), _school_id, _math, 'Geometry', 'GEO', 'Shapes, position and direction')
  RETURNING id INTO _sn;
  INSERT INTO cbc_sub_strands (strand_id, name, sub_strand_code, description) VALUES
    (_sn, 'Shapes',                          'GEO-01', 'Identify and describe 2D and 3D shapes'),
    (_sn, 'Position and direction',          'GEO-02', 'Describe position and movement');

  INSERT INTO cbc_strands (id, school_id, subject_id, name, strand_code, description)
  VALUES (gen_random_uuid(), _school_id, _math, 'Data Handling', 'DAT', 'Collecting, organizing and presenting data')
  RETURNING id INTO _sn;
  INSERT INTO cbc_sub_strands (strand_id, name, sub_strand_code, description) VALUES
    (_sn, 'Collecting and presenting data',  'DAT-01', 'Collect data and present using simple graphs');

  INSERT INTO cbc_strands (id, school_id, subject_id, name, strand_code, description)
  VALUES (gen_random_uuid(), _school_id, _eng, 'Listening and Speaking', 'LS', 'Oral language and communication')
  RETURNING id INTO _sn;
  INSERT INTO cbc_sub_strands (strand_id, name, sub_strand_code, description) VALUES
    (_sn, 'Oral language',                   'LS-01', 'Express ideas and feelings orally'),
    (_sn, 'Pronunciation',                   'LS-02', 'Pronounce sounds and words correctly');

  INSERT INTO cbc_strands (id, school_id, subject_id, name, strand_code, description)
  VALUES (gen_random_uuid(), _school_id, _eng, 'Reading', 'READ', 'Phonics and reading comprehension')
  RETURNING id INTO _sn;
  INSERT INTO cbc_sub_strands (strand_id, name, sub_strand_code, description) VALUES
    (_sn, 'Phonics',                         'READ-01', 'Recognize letter sounds and blend words'),
    (_sn, 'Comprehension',                   'READ-02', 'Read and understand simple texts');

  INSERT INTO cbc_strands (id, school_id, subject_id, name, strand_code, description)
  VALUES (gen_random_uuid(), _school_id, _eng, 'Writing', 'WRIT', 'Handwriting and composition')
  RETURNING id INTO _sn;
  INSERT INTO cbc_sub_strands (strand_id, name, sub_strand_code, description) VALUES
    (_sn, 'Handwriting',                     'WRIT-01', 'Write legibly with correct letter formation'),
    (_sn, 'Composition',                     'WRIT-02', 'Write simple sentences and paragraphs');

  INSERT INTO cbc_strands (id, school_id, subject_id, name, strand_code, description)
  VALUES (gen_random_uuid(), _school_id, _sci, 'Living Things', 'LT', 'Plants, animals and human beings')
  RETURNING id INTO _sn;
  INSERT INTO cbc_sub_strands (strand_id, name, sub_strand_code, description) VALUES
    (_sn, 'Plants',                          'LT-01', 'Identify common plants and their parts'),
    (_sn, 'Animals',                         'LT-02', 'Identify common animals and their habitats');

  INSERT INTO cbc_strands (id, school_id, subject_id, name, strand_code, description)
  VALUES (gen_random_uuid(), _school_id, _sci, 'Environment', 'ENV', 'Weather, water, soil and energy')
  RETURNING id INTO _sn;
  INSERT INTO cbc_sub_strands (strand_id, name, sub_strand_code, description) VALUES
    (_sn, 'Weather',                         'ENV-01', 'Observe and describe weather conditions'),
    (_sn, 'Water and soil',                  'ENV-02', 'Identify sources of water and soil types');

  -- ============================================================
  -- 8. STUDENTS
  -- ============================================================
  INSERT INTO students (id, school_id, admission_number, first_name, last_name, date_of_birth, gender, class_id, enrollment_date, status)
  VALUES
    (_s1,  _school_id, 'MEC/2025/001', 'Brian',   'Kimani',    '2018-03-15', 'male',   _g1e, '2025-01-13', 'active'),
    (_s2,  _school_id, 'MEC/2025/002', 'Faith',   'Wanjiku',   '2018-06-22', 'female', _g1e, '2025-01-13', 'active'),
    (_s3,  _school_id, 'MEC/2025/003', 'James',   'Ochieng',   '2018-01-10', 'male',   _g1e, '2025-01-13', 'active'),
    (_s4,  _school_id, 'MEC/2025/004', 'Mary',    'Akinyi',    '2018-11-05', 'female', _g1w, '2025-01-13', 'active'),
    (_s5,  _school_id, 'MEC/2025/005', 'Peter',   'Kamau',     '2018-09-18', 'male',   _g1w, '2025-01-13', 'active'),
    (_s6,  _school_id, 'MEC/2025/006', 'Sarah',   'Chebet',    '2017-04-20', 'female', _g2,  '2025-01-13', 'active'),
    (_s7,  _school_id, 'MEC/2025/007', 'David',   'Mwangi',    '2017-07-14', 'male',   _g2,  '2025-01-13', 'active'),
    (_s8,  _school_id, 'MEC/2025/008', 'Esther',  'Nyambura',  '2016-02-28', 'female', _g3,  '2025-01-13', 'active'),
    (_s9,  _school_id, 'MEC/2025/009', 'Kevin',   'Otieno',    '2016-08-12', 'male',   _g3,  '2025-01-13', 'active'),
    (_s10, _school_id, 'MEC/2025/010', 'Grace',   'Njoki',     '2009-05-03', 'female', _f1,  '2025-01-13', 'active'),
    (_s11, _school_id, 'MEC/2025/011', 'Samuel',  'Kiprop',    '2009-12-19', 'male',   _f1,  '2025-01-13', 'active'),
    (_s12, _school_id, 'MEC/2025/012', 'Cynthia', 'Wambui',    '2008-04-07', 'female', _f2,  '2025-01-13', 'active'),
    -- Grade 1 West (2 more)
    (_s13, _school_id, 'MEC/2025/013', 'Daniel',  'Mutua',     '2018-10-02', 'male',   _g1w, '2025-01-13', 'active'),
    (_s14, _school_id, 'MEC/2025/014', 'Aisha',   'Hassan',    '2018-12-15', 'female', _g1w, '2025-01-13', 'active'),
    -- Grade 2 (2 more)
    (_s15, _school_id, 'MEC/2025/015', 'John',    'Kiprono',   '2017-05-08', 'male',   _g2,  '2025-01-13', 'active'),
    (_s16, _school_id, 'MEC/2025/016', 'Nancy',   'Wangeci',   '2017-10-30', 'female', _g2,  '2025-01-13', 'active'),
    -- Grade 3 (2 more)
    (_s17, _school_id, 'MEC/2025/017', 'Patrick', 'Omondi',    '2016-03-17', 'male',   _g3,  '2025-01-13', 'active'),
    (_s18, _school_id, 'MEC/2025/018', 'Diana',   'Chepkoech', '2016-09-22', 'female', _g3,  '2025-01-13', 'active'),
    -- Grade 4 (2 new)
    (_s19, _school_id, 'MEC/2025/019', 'Michael', 'Njenga',    '2015-02-11', 'male',   _g4,  '2025-01-13', 'active'),
    (_s20, _school_id, 'MEC/2025/020', 'Susan',   'Akinyi',    '2015-07-25', 'female', _g4,  '2025-01-13', 'active'),
    -- Form 1 (1 more)
    (_s21, _school_id, 'MEC/2025/021', 'Joseph',  'Njoroge',   '2009-11-03', 'male',   _f1,  '2025-01-13', 'active'),
    -- Form 2 (1 more)
    (_s22, _school_id, 'MEC/2025/022', 'Martha',  'Kendi',     '2008-08-19', 'female', _f2,  '2025-01-13', 'active');

  -- ============================================================
  -- 9. STUDENT-PARENT LINKS (after students are inserted)
  -- ============================================================
  INSERT INTO student_parents (student_id, parent_id, relationship, is_primary_contact)
  VALUES
    (_s1, _parent_id, 'mother', true),
    (_s2, _parent_id, 'mother', true),
    (_s3, _parent_id, 'mother', false);

  -- ============================================================
  -- 10. CO-CURRICULAR ACTIVITIES
  -- ============================================================
  INSERT INTO co_curricular_activities (id, school_id, name, category, description, is_active)
  VALUES
    (_af,  _school_id, 'Football',           'sports',  'Inter-class and inter-school tournaments', true),
    (_an,  _school_id, 'Netball',            'sports',  'Netball team practice and competitions', true),
    (_aat, _school_id, 'Athletics',          'sports',  'Track and field events', true),
    (_ad,  _school_id, 'Drama Club',         'drama',   'Theatre productions and storytelling', true),
    (_ade, _school_id, 'Debate Club',        'debate',  'Public speaking and debating competitions', true),
    (_am,  _school_id, 'Music Band',         'music',   'School band, choir, and music festivals', true),
    (_ayf, _school_id, 'Young Farmers Club', 'clubs',   'Gardening and agricultural projects', true);

  -- ============================================================
  -- 11. ASSESSMENTS & SCORES
  -- ============================================================
  INSERT INTO assessments (id, school_id, class_id, subject_id, academic_term_id, name, type, max_score, date, created_by)
  VALUES
    (_amg1, _school_id, _g1e, _math, _t2, 'End Term 1 Mathematics - Grade 1 East', 'endterm', 100, '2025-03-24', _admin_id),
    (_aeg1, _school_id, _g1e, _eng,  _t2, 'End Term 1 English - Grade 1 East',    'endterm', 100, '2025-03-25', _admin_id),
    (_asg3, _school_id, _g3,  _sci,  _t2, 'CAT 1 Science - Grade 3',              'cat',      50, '2025-06-12', _admin_id),
    (_amf1, _school_id, _f1,  _math, _t2, 'End Term 1 Mathematics - Form 1',      'endterm', 100, '2025-03-26', _admin_id),
    (_aef1, _school_id, _f1,  _eng,  _t2, 'End Term 1 English - Form 1',          'endterm', 100, '2025-03-27', _admin_id);

  INSERT INTO assessment_scores (assessment_id, student_id, score, grade) VALUES
    (_amg1, _s1, 78, 'B+'), (_amg1, _s2, 92, 'A'), (_amg1, _s3, 65, 'B-'),
    (_aeg1, _s1, 82, 'A-'), (_aeg1, _s2, 88, 'A'), (_aeg1, _s3, 71, 'B+'),
    (_asg3, _s8, 42, 'A'), (_asg3, _s9, 35, 'B+'),
    (_amf1, _s10, 81, 'A-'), (_amf1, _s11, 58, 'C+'),
    (_aef1, _s10, 76, 'B+'), (_aef1, _s11, 64, 'B-');

  -- ============================================================
  -- 12. CBC COMPETENCY RECORDS
  -- ============================================================
  SELECT id INTO _ss_id FROM cbc_sub_strands WHERE sub_strand_code = 'NUM-01';
  INSERT INTO cbc_competency_records (student_id, sub_strand_id, academic_term_id, teacher_id, rating, notes, date) VALUES
    (_s1, _ss_id, _t2, _admin_id, 'B', 'Can count up to 50 confidently',            '2025-06-10'),
    (_s2, _ss_id, _t2, _admin_id, 'E', 'Counts beyond 100 and does simple addition','2025-06-10'),
    (_s3, _ss_id, _t2, _admin_id, 'A', 'Working on counting beyond 30',             '2025-06-10');

  SELECT id INTO _ss_id FROM cbc_sub_strands WHERE sub_strand_code = 'NUM-02';
  INSERT INTO cbc_competency_records (student_id, sub_strand_id, academic_term_id, teacher_id, rating, notes, date) VALUES
    (_s1, _ss_id, _t2, _admin_id, 'B', 'Can add and subtract within 20',           '2025-06-17'),
    (_s2, _ss_id, _t2, _admin_id, 'E', 'Adding and subtracting within 50',         '2025-06-17'),
    (_s3, _ss_id, _t2, _admin_id, 'A', 'Needs practice with subtraction',          '2025-06-17');

  SELECT id INTO _ss_id FROM cbc_sub_strands WHERE sub_strand_code = 'LS-01';
  INSERT INTO cbc_competency_records (student_id, sub_strand_id, academic_term_id, teacher_id, rating, notes, date) VALUES
    (_s1, _ss_id, _t2, _admin_id, 'B', 'Expresses ideas clearly',                  '2025-06-12'),
    (_s2, _ss_id, _t2, _admin_id, 'E', 'Excellent vocabulary and expression',      '2025-06-12'),
    (_s3, _ss_id, _t2, _admin_id, 'A', 'Shy to speak in front of class',           '2025-06-12');

  SELECT id INTO _ss_id FROM cbc_sub_strands WHERE sub_strand_code = 'READ-01';
  INSERT INTO cbc_competency_records (student_id, sub_strand_id, academic_term_id, teacher_id, rating, notes, date) VALUES
    (_s4, _ss_id, _t2, _admin_id, 'B', 'Good phonics recognition',                 '2025-06-14'),
    (_s5, _ss_id, _t2, _admin_id, 'P', 'Struggling with blending sounds',          '2025-06-14');

  SELECT id INTO _ss_id FROM cbc_sub_strands WHERE sub_strand_code = 'LT-01';
  INSERT INTO cbc_competency_records (student_id, sub_strand_id, academic_term_id, teacher_id, rating, notes, date) VALUES
    (_s6, _ss_id, _t2, _admin_id, 'E', 'Knows all common plants and their uses',   '2025-06-20'),
    (_s7, _ss_id, _t2, _admin_id, 'B', 'Can identify most common plants',          '2025-06-20');

  SELECT id INTO _ss_id FROM cbc_sub_strands WHERE sub_strand_code = 'MEA-01';
  INSERT INTO cbc_competency_records (student_id, sub_strand_id, academic_term_id, teacher_id, rating, notes, date) VALUES
    (_s8, _ss_id, _t2, _admin_id, 'B', 'Can measure length in cm and m',           '2025-06-22'),
    (_s9, _ss_id, _t2, _admin_id, 'A', 'Confused between cm and m',                '2025-06-22');

  -- ============================================================
  -- 13. CO-CURRICULAR RECORDS
  -- ============================================================
  INSERT INTO co_curricular_records (student_id, activity_id, academic_term_id, teacher_id, progress_level, achievements, notes, date)
  VALUES
    (_s1,  _af,  _t2, _admin_id, 'competent',   'Top scorer in inter-class tournament (5 goals)',    'Good teamwork skills',                '2025-06-15'),
    (_s3,  _af,  _t2, _admin_id, 'developing',  NULL,                                                 'Attends practice regularly, improving','2025-06-15'),
    (_s2,  _ad,  _t2, _admin_id, 'excellent',   'Best actress in school drama festival',             'Very expressive performer',            '2025-06-18'),
    (_s6,  _an,  _t2, _admin_id, 'competent',   'Team captain - led team to 2nd place',              'Good leadership skills',               '2025-06-16'),
    (_s8,  _ade, _t2, _admin_id, 'excellent',   'Won best speaker in zonal debate',                  'Articulate and confident speaker',     '2025-06-20'),
    (_s10, _am,  _t2, _admin_id, 'outstanding', 'Lead vocalist - won gold at music festival',        'Exceptional musical talent',           '2025-06-22'),
    (_s12, _ayf, _t2, _admin_id, 'competent',   'Best vegetable garden project',                     'Diligent and hardworking',             '2025-06-14');

  -- ============================================================
  -- 14. ATTENDANCE
  -- ============================================================
  INSERT INTO attendance (student_id, class_id, date, status, marked_by)
  VALUES
    (_s1,  _g1e, '2025-06-09', 'present', _admin_id),
    (_s2,  _g1e, '2025-06-09', 'present', _admin_id),
    (_s3,  _g1e, '2025-06-09', 'late',    _admin_id),
    (_s1,  _g1e, '2025-06-10', 'present', _admin_id),
    (_s2,  _g1e, '2025-06-10', 'present', _admin_id),
    (_s3,  _g1e, '2025-06-10', 'absent',  _admin_id),
    (_s1,  _g1e, '2025-06-11', 'present', _admin_id),
    (_s2,  _g1e, '2025-06-11', 'present', _admin_id),
    (_s3,  _g1e, '2025-06-11', 'present', _admin_id),
    (_s10, _f1,  '2025-06-09', 'present', _admin_id),
    (_s11, _f1,  '2025-06-09', 'present', _admin_id),
    (_s10, _f1,  '2025-06-10', 'present', _admin_id),
    (_s11, _f1,  '2025-06-10', 'excused', _admin_id);

  -- ============================================================
  -- 15. REPORTS
  -- ============================================================
  INSERT INTO reports (student_id, academic_term_id, generated_by, template_type, status)
  VALUES
    (_s1,  _t1, _admin_id, 'combined', 'published'),
    (_s2,  _t1, _admin_id, 'combined', 'published'),
    (_s10, _t1, _admin_id, '8-4-4',   'published');

  -- ============================================================
  -- SUMMARY
  -- ============================================================
  RAISE NOTICE '╔══════════════════════════════════════════════╗';
  RAISE NOTICE '║     SHULEPULSE — SEED DATA LOADED           ║';
  RAISE NOTICE '╠══════════════════════════════════════════════╣';
  RAISE NOTICE '║  School: Moi Educational Centre (Nairobi)   ║';
  RAISE NOTICE '║  Classes: Grade 1-4 CBC + Form 1-2 8-4-4   ║';
  RAISE NOTICE '║  Students: 12                               ║';
  RAISE NOTICE '║  Subjects: 11                               ║';
  RAISE NOTICE '║  CBC Strands: 9 strands / 20 sub-strands    ║';
  RAISE NOTICE '║  Activities: 7 co-curricular                ║';
  RAISE NOTICE '║  Assessments: 5 (with scores entered)       ║';
  RAISE NOTICE '║  CBC Records: 15 competency ratings         ║';
  RAISE NOTICE '║  Co-Curricular Records: 7 entries           ║';
  RAISE NOTICE '║  Attendance: 13 entries                     ║';
  RAISE NOTICE '║  Reports: 3 published                       ║';
  RAISE NOTICE '║  Parent: Grace Kimani (3 linked children)   ║';
  RAISE NOTICE '╚══════════════════════════════════════════════╝';

END $$;
