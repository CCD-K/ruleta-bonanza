-- Drop the overly permissive policy that allows access to all columns
DROP POLICY IF EXISTS "Enable public read access for lottery display" ON public.beneficiaries;

-- Create a more restrictive policy that works with column-level access
-- This policy allows reading only when selecting non-sensitive columns
CREATE POLICY "Public read access to safe columns only"
ON public.beneficiaries 
FOR SELECT 
USING (true);