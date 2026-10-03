-- ==============================================================================
-- VFSTR Ph.D PART-TIME SCHOLAR TRACKING SYSTEM
-- SUPABASE POSTGRESQL PRODUCTION DATABASE SCHEMA & INITIAL SEED DATA
-- ==============================================================================
-- Instructions:
-- 1. Open your Supabase Project Dashboard (https://supabase.com/dashboard)
-- 2. Click on "SQL Editor" in the left sidebar
-- 3. Click "New Query", paste this entire script, and click "Run" (Ctrl+Enter)
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. DROP TABLES IF PREVIOUSLY CREATED (CLEAN REBUILD)
DROP TABLE IF EXISTS part_time_dc_meetings_attended CASCADE;
DROP TABLE IF EXISTS part_time_courses_completed_details CASCADE;
DROP TABLE IF EXISTS part_time_fdps_attended CASCADE;
DROP TABLE IF EXISTS part_time_conference_papers CASCADE;
DROP TABLE IF EXISTS part_time_journal_papers CASCADE;
DROP TABLE IF EXISTS part_time_monthly_submissions CASCADE;
DROP TABLE IF EXISTS part_time_scholar_profiles CASCADE;
DROP TABLE IF EXISTS portal_otps CASCADE;
DROP TABLE IF EXISTS part_time_admin_users CASCADE;

-- ==============================================================================
-- TABLE 1: part_time_scholar_profiles
-- Stores permanent master profile data for part-time research scholars
-- ==============================================================================
CREATE TABLE part_time_scholar_profiles (
  reg_no VARCHAR(50) PRIMARY KEY,
  scholar_name VARCHAR(150) NOT NULL,
  guide_name VARCHAR(150) NOT NULL,
  department VARCHAR(100) NOT NULL,
  ra_type VARCHAR(50) DEFAULT 'Industry', -- Employement: 'Industry' or 'Academic'
  date_of_joining DATE,
  scholar_contact VARCHAR(50),
  supervisor_contact VARCHAR(50),
  courses_completed INT DEFAULT 0,
  bank_account_no VARCHAR(100) DEFAULT '',
  bank_name VARCHAR(100) DEFAULT 'State Bank of India',
  ifsc_code VARCHAR(50) DEFAULT 'SBIN0001234',
  end_of_ra DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- TABLE 2: part_time_monthly_submissions
-- Stores monthly progress report submissions from scholars
-- ==============================================================================
CREATE TABLE part_time_monthly_submissions (
  id VARCHAR(64) PRIMARY KEY,
  reg_no VARCHAR(50) NOT NULL REFERENCES part_time_scholar_profiles(reg_no) ON DELETE CASCADE,
  scholar_name VARCHAR(150) NOT NULL,
  guide_name VARCHAR(150),
  department VARCHAR(100),
  ra_type VARCHAR(50) DEFAULT 'Industry',
  date_of_joining DATE,
  scholar_contact VARCHAR(50),
  supervisor_contact VARCHAR(50),
  current_month VARCHAR(20) NOT NULL,
  courses_completed INT DEFAULT 0,
  forget_thumbs INT DEFAULT 0,
  leaves_taken INT DEFAULT 0,
  avg_spent_stayed VARCHAR(100) DEFAULT '',
  academic_load VARCHAR(100) DEFAULT '',
  bank_account_no VARCHAR(100) DEFAULT '',
  bank_name VARCHAR(100) DEFAULT 'State Bank of India',
  ifsc_code VARCHAR(50) DEFAULT 'SBIN0001234',
  end_of_ra DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT part_time_reg_month_unique UNIQUE (reg_no, current_month)
);

-- ==============================================================================
-- TABLE 3: part_time_courses_completed_details
-- Child records for coursework (Internal or NPTEL with Formative/Summative scores)
-- ==============================================================================
CREATE TABLE part_time_courses_completed_details (
  id BIGSERIAL PRIMARY KEY,
  submission_id VARCHAR(64) NOT NULL REFERENCES part_time_monthly_submissions(id) ON DELETE CASCADE,
  course_code VARCHAR(50),
  course_name VARCHAR(255) NOT NULL,
  course_type VARCHAR(50) DEFAULT 'Internal',
  credits VARCHAR(20),
  formative_marks VARCHAR(20),
  summative_marks VARCHAR(20),
  grade VARCHAR(50),
  cgpa VARCHAR(20),
  result VARCHAR(20),
  completion_date DATE
);

-- ==============================================================================
-- TABLE 4: part_time_journal_papers
-- Child records for research journal paper progress
-- ==============================================================================
CREATE TABLE part_time_journal_papers (
  id BIGSERIAL PRIMARY KEY,
  submission_id VARCHAR(64) NOT NULL REFERENCES part_time_monthly_submissions(id) ON DELETE CASCADE,
  title TEXT,
  journal_name VARCHAR(255) NOT NULL,
  status VARCHAR(100) DEFAULT 'Communicated',
  status_date DATE
);

-- ==============================================================================
-- TABLE 5: part_time_conference_papers
-- Child records for conference paper presentations
-- ==============================================================================
CREATE TABLE part_time_conference_papers (
  id BIGSERIAL PRIMARY KEY,
  submission_id VARCHAR(64) NOT NULL REFERENCES part_time_monthly_submissions(id) ON DELETE CASCADE,
  title TEXT,
  conference_name VARCHAR(255) NOT NULL,
  status VARCHAR(100) DEFAULT 'Communicated',
  status_date DATE
);

-- ==============================================================================
-- TABLE 6: part_time_fdps_attended
-- Child records for conferences, workshops, guest lectures & FDPs attended
-- ==============================================================================
CREATE TABLE part_time_fdps_attended (
  id BIGSERIAL PRIMARY KEY,
  submission_id VARCHAR(64) NOT NULL REFERENCES part_time_monthly_submissions(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100) DEFAULT 'Workshop',
  organizer VARCHAR(255),
  event_date DATE
);

-- ==============================================================================
-- TABLE 7: part_time_dc_meetings_attended
-- Child records for Doctoral Committee (DC) reviews & milestone recommendations
-- ==============================================================================
CREATE TABLE part_time_dc_meetings_attended (
  id BIGSERIAL PRIMARY KEY,
  submission_id VARCHAR(64) NOT NULL REFERENCES part_time_monthly_submissions(id) ON DELETE CASCADE,
  scholar_id VARCHAR(50),
  dc_name VARCHAR(255) DEFAULT 'DC Meeting',
  last_dc_date DATE,
  comments TEXT,
  regulation VARCHAR(50) DEFAULT 'R22',
  rating VARCHAR(50),
  recommendations VARCHAR(255) DEFAULT 'In Progress'
);

-- ==============================================================================
-- TABLE 8: portal_otps
-- Manages secure one-time passcode verification for scholars
-- ==============================================================================
CREATE TABLE portal_otps (
  id BIGSERIAL PRIMARY KEY,
  emp_id VARCHAR(50) NOT NULL,
  mobile VARCHAR(20),
  portal VARCHAR(50) DEFAULT 'part-time-phd',
  otp_code VARCHAR(10) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- TABLE 9: part_time_admin_users
-- Authorized administrative logins for Dean R&D review console
-- ==============================================================================
CREATE TABLE part_time_admin_users (
  id BIGSERIAL PRIMARY KEY,
  email VARCHAR(150) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'Dean R&D',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- INDEXES FOR OPTIMAL QUERY PERFORMANCE
-- ==============================================================================
CREATE INDEX idx_pt_profiles_reg_no ON part_time_scholar_profiles(LOWER(reg_no));
CREATE INDEX idx_pt_submissions_reg_no ON part_time_monthly_submissions(LOWER(reg_no));
CREATE INDEX idx_pt_submissions_month ON part_time_monthly_submissions(current_month);
CREATE INDEX idx_pt_otps_lookup ON portal_otps(LOWER(emp_id), otp_code, is_verified);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Configures open read/write access for public scholar submissions & OTP flow
-- ==============================================================================
ALTER TABLE part_time_scholar_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE part_time_monthly_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE part_time_courses_completed_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE part_time_journal_papers ENABLE ROW LEVEL SECURITY;
ALTER TABLE part_time_conference_papers ENABLE ROW LEVEL SECURITY;
ALTER TABLE part_time_fdps_attended ENABLE ROW LEVEL SECURITY;
ALTER TABLE part_time_dc_meetings_attended ENABLE ROW LEVEL SECURITY;
ALTER TABLE portal_otps ENABLE ROW LEVEL SECURITY;
ALTER TABLE part_time_admin_users ENABLE ROW LEVEL SECURITY;

-- Permissive public policies for the client application
CREATE POLICY "Public Read Profiles" ON part_time_scholar_profiles FOR SELECT USING (true);
CREATE POLICY "Public Update Profiles" ON part_time_scholar_profiles FOR UPDATE USING (true);
CREATE POLICY "Public Insert Profiles" ON part_time_scholar_profiles FOR INSERT WITH CHECK (true);

CREATE POLICY "Public Read Submissions" ON part_time_monthly_submissions FOR SELECT USING (true);
CREATE POLICY "Public Insert Submissions" ON part_time_monthly_submissions FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Update Submissions" ON part_time_monthly_submissions FOR UPDATE USING (true);
CREATE POLICY "Public Delete Submissions" ON part_time_monthly_submissions FOR DELETE USING (true);

CREATE POLICY "Public Read Courses" ON part_time_courses_completed_details FOR SELECT USING (true);
CREATE POLICY "Public Insert Courses" ON part_time_courses_completed_details FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Delete Courses" ON part_time_courses_completed_details FOR DELETE USING (true);

CREATE POLICY "Public Read Journals" ON part_time_journal_papers FOR SELECT USING (true);
CREATE POLICY "Public Insert Journals" ON part_time_journal_papers FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Delete Journals" ON part_time_journal_papers FOR DELETE USING (true);

CREATE POLICY "Public Read Conferences" ON part_time_conference_papers FOR SELECT USING (true);
CREATE POLICY "Public Insert Conferences" ON part_time_conference_papers FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Delete Conferences" ON part_time_conference_papers FOR DELETE USING (true);

CREATE POLICY "Public Read FDPs" ON part_time_fdps_attended FOR SELECT USING (true);
CREATE POLICY "Public Insert FDPs" ON part_time_fdps_attended FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Delete FDPs" ON part_time_fdps_attended FOR DELETE USING (true);

CREATE POLICY "Public Read DCs" ON part_time_dc_meetings_attended FOR SELECT USING (true);
CREATE POLICY "Public Insert DCs" ON part_time_dc_meetings_attended FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Delete DCs" ON part_time_dc_meetings_attended FOR DELETE USING (true);

CREATE POLICY "Public Read OTPs" ON portal_otps FOR SELECT USING (true);
CREATE POLICY "Public Insert OTPs" ON portal_otps FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Update OTPs" ON portal_otps FOR UPDATE USING (true);

CREATE POLICY "Public Read Admin Users" ON part_time_admin_users FOR SELECT USING (true);

-- ==============================================================================
-- INITIAL SEED DATA: 8 VERIFIED PART-TIME SCHOLAR MASTER PROFILES
-- ==============================================================================
INSERT INTO part_time_scholar_profiles 
(reg_no, scholar_name, guide_name, department, ra_type, date_of_joining, scholar_contact, supervisor_contact, courses_completed)
VALUES
('231PT01004', 'Mrs. T. Lakshmi Prasanna', 'Dr. S. Anil Kumar', 'Bio-Tech', 'Academic', '2023-07-08', '9846342281', '9440556677', 4),
('231PT06012', 'Mr. P. Srinivasa Rao', 'Dr. N. Usha Rani', 'ECE', 'Industry', '2023-08-15', '9988776655', '9440234567', 4),
('241PT03001', 'Mr. G. Ravindra Babu', 'Dr. P. Sundara Kumar', 'Civil', 'Industry', '2024-08-01', '9346299591', '9848554433', 4),
('241PT04005', 'Ms. K. Srilatha', 'Dr. Jyosthna Devi Bodapati', 'ACSE', 'Academic', '2024-09-04', '9876543210', '9849123456', 3),
('241PT12002', 'Ms. Ch. Hymavathi Devi', 'Dr. K. Kalpana', 'MBA', 'Academic', '2024-08-01', '9652794187', '9988112233', 4),
('251PT01001', 'Dr. / Mr. V. Ramesh Kumar', 'Dr. K. Phani Kumar', 'CSE', 'Industry', '2024-07-31', '9848012345', '9440154321', 1),
('251PT08003', 'Mr. M. Venkat Reddy', 'Dr. Sanjay Kumar Gupta', 'Mechanical', 'Industry', '2025-07-10', '9177994914', '9876543210', 2),
('251PT36001', 'Mr. B. Koteswara Rao', 'Dr. M. Sabareesh', 'Pharmacy', 'Industry', '2025-04-07', '9948399412', '9876501234', 3)
ON CONFLICT (reg_no) DO UPDATE SET
  scholar_name = EXCLUDED.scholar_name,
  guide_name = EXCLUDED.guide_name,
  department = EXCLUDED.department,
  ra_type = EXCLUDED.ra_type,
  date_of_joining = EXCLUDED.date_of_joining,
  scholar_contact = EXCLUDED.scholar_contact,
  supervisor_contact = EXCLUDED.supervisor_contact,
  courses_completed = EXCLUDED.courses_completed;

-- ==============================================================================
-- INITIAL SEED DATA: DEMO MONTHLY SUBMISSIONS
-- ==============================================================================
INSERT INTO part_time_monthly_submissions
(id, reg_no, scholar_name, guide_name, department, ra_type, date_of_joining, scholar_contact, supervisor_contact, current_month, courses_completed)
VALUES
('pt_sub_231PT06012_2026_08', '231PT06012', 'Mr. P. Srinivasa Rao', 'Dr. N. Usha Rani', 'ECE', 'Industry', '2023-08-15', '9988776655', '9440234567', '2026-08', 4),
('pt_sub_241PT04005_2026_08', '241PT04005', 'Ms. K. Srilatha', 'Dr. Jyosthna Devi Bodapati', 'ACSE', 'Academic', '2024-09-04', '9876543210', '9849123456', '2026-08', 3),
('pt_sub_241PT12002_2026_08', '241PT12002', 'Ms. Ch. Hymavathi Devi', 'Dr. K. Kalpana', 'MBA', 'Academic', '2024-08-01', '9652794187', '9988112233', '2026-08', 4),
('pt_sub_251PT01001_2026_08', '251PT01001', 'Dr. / Mr. V. Ramesh Kumar', 'Dr. K. Phani Kumar', 'CSE', 'Industry', '2024-07-31', '9848012345', '9440154321', '2026-08', 1),
('pt_sub_251PT08003_2026_07', '251PT08003', 'Mr. M. Venkat Reddy', 'Dr. Sanjay Kumar Gupta', 'Mechanical', 'Industry', '2025-07-10', '9177994914', '9876543210', '2026-07', 2)
ON CONFLICT (id) DO NOTHING;

-- Seed Journal Papers for Demo Submissions
INSERT INTO part_time_journal_papers (submission_id, title, journal_name, status, status_date)
VALUES
('pt_sub_231PT06012_2026_08', 'Deep Learning Architectures for Industrial IoT Edge Nodes', 'IEEE Transactions on Industrial Informatics', 'Accepted', '2026-08-15'),
('pt_sub_241PT04005_2026_08', 'Transformer Models for Low-Resource Indic Languages', 'ACM Computing Surveys', 'Communicated', '2026-08-10'),
('pt_sub_251PT01001_2026_08', 'Zero-Trust Cloud Identity Federation in Enterprise Environments', 'Journal of Cloud Computing (Springer)', 'Under Review', '2026-08-20'),
('pt_sub_251PT08003_2026_07', 'Thermo-Mechanical Analysis of Friction Stir Welded Composites', 'Materials Today: Proceedings', 'Accepted', '2026-07-25')
ON CONFLICT DO NOTHING;

-- Seed Conference Papers for Demo Submissions
INSERT INTO part_time_conference_papers (submission_id, title, conference_name, status, status_date)
VALUES
('pt_sub_231PT06012_2026_08', 'Real-Time Edge Sensor Fusion Using TinyML', 'IEEE International Conference on Advanced Computing (ICAC 2026)', 'Presented', '2026-06-20'),
('pt_sub_241PT04005_2026_08', 'Empirical Study on Multilingual Text Summarization', 'ACL 2026 Findings', 'Accepted', '2026-07-18')
ON CONFLICT DO NOTHING;

-- Seed Course Details for Demo Submissions
INSERT INTO part_time_courses_completed_details (submission_id, course_code, course_name, course_type, credits, formative_marks, summative_marks, grade, cgpa, result, completion_date)
VALUES
('pt_sub_231PT06012_2026_08', '21EC801', 'Research Methodology & IPR', 'Internal', '4', '38', '56', '9.4 (Pass)', '9.4', 'Pass', '2024-01-15'),
('pt_sub_231PT06012_2026_08', 'NPTEL23CS12', 'Deep Learning for Computer Vision', 'NPTEL', '3', '24', '62', '86% (Pass)', '8.6', 'Pass', '2024-05-20'),
('pt_sub_251PT01001_2026_08', '24CS801', 'Research Methodology & Technical Writing', 'Internal', '4', '36', '54', '9.0 (Pass)', '9.0', 'Pass', '2025-06-10')
ON CONFLICT DO NOTHING;

-- Seed DC Meetings for Demo Submissions
INSERT INTO part_time_dc_meetings_attended (submission_id, scholar_id, dc_name, last_dc_date, comments, regulation, rating, recommendations)
VALUES
('pt_sub_231PT06012_2026_08', '231PT06012', 'Comprehensive Viva & DC-2', '2026-05-22', 'Research problem formulated well. Good progress on hardware implementation.', 'R22', 'Excellent', 'In Progress'),
('pt_sub_241PT04005_2026_08', '241PT04005', 'DC-1 Research Plan Approval', '2025-11-14', 'Literature review completed. Recommended to focus on benchmark datasets.', 'R22', 'Very Good', 'In Progress')
ON CONFLICT DO NOTHING;

-- Seed Dean R&D Administrative User (Password: passowrd123)
-- bcrypt hash for passowrd123 is $2a$10$wE8wI3a8qB9zC/a/yWzQ6.gWJjKjB7oK8K7q2S2V6lS2q5P2Y6Z8G
INSERT INTO part_time_admin_users (email, password_hash, role)
VALUES ('dean_rd@vignan.ac.in', '$2a$10$wE8wI3a8qB9zC/a/yWzQ6.gWJjKjB7oK8K7q2S2V6lS2q5P2Y6Z8G', 'Dean R&D')
ON CONFLICT (email) DO NOTHING;

-- ==============================================================================
-- SCHEMA & SEED COMPLETE
-- ==============================================================================
