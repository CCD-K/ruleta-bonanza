-- Drop the current policy that still exposes all data
DROP POLICY IF EXISTS "Allow reading names and dates only" ON public.beneficiaries;

-- Create a restrictive policy that only allows admins to read full data
CREATE POLICY "Only admins can read full beneficiary data" 
ON public.beneficiaries 
FOR SELECT 
USING (is_admin(auth.uid()));

-- Create a public view that only exposes non-sensitive data for the lottery
CREATE OR REPLACE VIEW public.beneficiaries_public AS
SELECT 
  id,
  name,
  date,
  created_at
FROM public.beneficiaries;

-- Grant access to the public view
GRANT SELECT ON public.beneficiaries_public TO anon, authenticated;