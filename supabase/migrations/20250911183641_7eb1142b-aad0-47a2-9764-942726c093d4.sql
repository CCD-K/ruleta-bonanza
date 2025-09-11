-- Create a public read policy for non-sensitive columns only
-- This policy will be enforced at the application level by selecting only safe columns
CREATE POLICY "Enable public read access for lottery display" 
ON public.beneficiaries 
FOR SELECT 
USING (true);