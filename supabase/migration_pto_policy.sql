-- ============================================================
-- PTO Policy Migration
-- Run this in Supabase Dashboard > SQL Editor
-- ============================================================

-- 1. Add employee_type column to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS employee_type text NOT NULL DEFAULT 'non_executive'
  CHECK (employee_type IN ('non_executive', 'executive'));

-- 2. Add prior year carryover balance (manually entered by admin, in hours)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS pto_carryover_hours numeric(6,2) NOT NULL DEFAULT 0;

-- 3. Rename days_requested to hours_requested in pto_requests
--    (hours are used throughout the PTO policy)
ALTER TABLE public.pto_requests
  RENAME COLUMN days_requested TO hours_requested;

-- 4. Drop the old manual accrual rate (now auto-computed from employee_type + service months)
ALTER TABLE public.profiles
  DROP COLUMN IF EXISTS pto_accrual_rate;

-- ============================================================
-- Done. employee_type is visible/editable by admins only
-- (enforced in application layer — RLS policies unchanged).
-- ============================================================
