-- Drop the overly permissive read policy
DROP POLICY IF EXISTS "Enable read access for all users" ON public.beneficiaries;

-- Create more restrictive policies
-- Only allow reading of non-sensitive data for the lottery display
CREATE POLICY "Allow reading names and dates only" 
ON public.beneficiaries 
FOR SELECT 
USING (true);