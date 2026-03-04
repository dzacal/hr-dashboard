-- v2 migration: employee active status + PTO leave categories

-- Mark employees as active (true) or inactive (false, no longer with company)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true NOT NULL;

-- Leave category for PTO requests
ALTER TABLE pto_requests ADD COLUMN IF NOT EXISTS leave_category text DEFAULT 'vacation';
