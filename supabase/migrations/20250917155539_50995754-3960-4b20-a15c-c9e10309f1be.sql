-- Drop the security definer view that's causing the security issue
-- This view is not being used in the application code
DROP VIEW IF EXISTS public.beneficiaries_public;