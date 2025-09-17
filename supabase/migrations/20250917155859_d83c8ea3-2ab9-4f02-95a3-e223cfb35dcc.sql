-- First drop all policies that depend on the is_admin function
DROP POLICY IF EXISTS "Permitir lectura a administradores" ON public.beneficiaries;
DROP POLICY IF EXISTS "Only admins can read full beneficiary data" ON public.beneficiaries;
DROP POLICY IF EXISTS "Permitir acceso completo a administradores" ON public.beneficiary_prizes;

-- Now drop the is_admin function 
DROP FUNCTION IF EXISTS public.is_admin(uuid);

-- Ensure we have the correct policies for the application
-- Keep existing policies that work and don't depend on admin function
-- beneficiaries table should allow public read/insert for the roulette functionality
-- beneficiary_prizes table should allow public read/insert for prize tracking