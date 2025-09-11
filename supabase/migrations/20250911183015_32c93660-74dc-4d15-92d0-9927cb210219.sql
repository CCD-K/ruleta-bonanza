-- Create RLS policies for beneficiary_prizes table
CREATE POLICY "Enable read access for all users" 
ON public.beneficiary_prizes 
FOR SELECT 
USING (true);

CREATE POLICY "Enable insert access for all users" 
ON public.beneficiary_prizes 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Permitir acceso completo a administradores" 
ON public.beneficiary_prizes 
FOR ALL 
USING (is_admin(auth.uid()));