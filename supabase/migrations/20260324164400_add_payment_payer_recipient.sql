-- Add payer_id and recipient_id columns to payments table
ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS payer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS recipient_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Drop over-broad policies and recreate with proper column checks
DROP POLICY IF EXISTS "Auth users can view payments" ON public.payments;
DROP POLICY IF EXISTS "Companies can insert payments" ON public.payments;
DROP POLICY IF EXISTS "Admins and companies can update payments" ON public.payments;

CREATE POLICY "Auth users can view payments" ON public.payments
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Companies can insert payments" ON public.payments
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = payer_id);

CREATE POLICY "Admins and companies can update payments" ON public.payments
  FOR UPDATE TO authenticated USING (
    auth.uid() = payer_id OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );
