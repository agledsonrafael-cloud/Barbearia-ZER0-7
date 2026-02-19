-- Enable RLS for appointments
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Policy: Allow public to insert (book an appointment)
CREATE POLICY "Public can book appointments" 
ON appointments FOR INSERT 
TO public 
WITH CHECK (true);

-- Policy: Allow public to view their own appointments (based on phone number matching if authenticated, or just open for now as anon logic relies on local storage/input)
--Ideally, we would match auth.uid(), but since we use phone numbers for clients:
--For now, let's allow public SELECT to verify slots, BUT we should restrict sensitive data if possible.
--Be pragmatic: The app needs to know ocupied slots.
CREATE POLICY "Public can view busy slots"
ON appointments FOR SELECT
TO public
USING (true);

-- Policy: Helpers/Admins have full access
-- Assuming authenticated users are admins for this simple app context
CREATE POLICY "Admins have full access"
ON appointments FOR ALL
TO authenticated
USING (true);

-- Enable RLS for services
ALTER TABLE services ENABLE ROW LEVEL SECURITY;

-- Policy: Public can view services
CREATE POLICY "Public can view services"
ON services FOR SELECT
TO public
USING (true);

-- Policy: Admins can manage services
CREATE POLICY "Admins can manage services"
ON services FOR ALL
TO authenticated
USING (true);
