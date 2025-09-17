-- Drop the is_admin function since it references non-existent user_roles table
DROP FUNCTION IF EXISTS public.is_admin(uuid);

-- Update the beneficiaries RLS policies to remove admin dependency
DROP POLICY IF EXISTS "Permitir lectura a administradores" ON public.beneficiaries;
DROP POLICY IF EXISTS "Only admins can read full beneficiary data" ON public.beneficiaries;

-- Update the beneficiary_prizes RLS policies to remove admin dependency  
DROP POLICY IF EXISTS "Permitir acceso completo a administradores" ON public.beneficiary_prizes;

-- Create simplified policies for the current application needs
-- These match the existing functionality without requiring authentication
CREATE POLICY "Enable read access for all users" 
ON public.beneficiaries 
FOR SELECT 
USING (true);

CREATE POLICY "Enable insert access for all users" 
ON public.beneficiaries 
FOR INSERT 
WITH CHECK (true);