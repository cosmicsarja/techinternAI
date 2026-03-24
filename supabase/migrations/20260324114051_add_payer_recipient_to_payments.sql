-- Add payer_id and recipient_id to payments table
ALTER TABLE payments ADD COLUMN payer_id UUID REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE payments ADD COLUMN recipient_id UUID REFERENCES profiles(id) ON DELETE SET NULL;

-- Create indexes for the new columns
CREATE INDEX idx_payments_payer_id ON payments(payer_id);
CREATE INDEX idx_payments_recipient_id ON payments(recipient_id);

-- Update RLS policies to allow users to view payments where they are the payer or recipient
CREATE POLICY "Users can view their own payments (payer)" 
  ON payments FOR SELECT 
  USING (auth.uid() = payer_id);

CREATE POLICY "Users can view their own payments (recipient)" 
  ON payments FOR SELECT 
  USING (auth.uid() = recipient_id);

-- Companies can insert payments
CREATE POLICY "Companies can insert payments" 
  ON payments FOR INSERT 
  WITH CHECK (
    auth.uid() = payer_id AND 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'company'
    )
  );
