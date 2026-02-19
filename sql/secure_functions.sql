-- Function to get busy slots without exposing client data
CREATE OR REPLACE FUNCTION get_busy_slots(query_date text)
RETURNS TABLE (time text)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT a.time
  FROM appointments a
  WHERE a.date = query_date
  AND a.status NOT IN ('cancelled');
END;
$$;

-- Function to get client appointments safely
CREATE OR REPLACE FUNCTION get_client_appointments(phone_number text)
RETURNS SETOF appointments
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM appointments a
  WHERE a.client_phone = phone_number
  ORDER BY a.date ASC, a.time ASC;
END;
$$;

-- Secure the appointments table
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Remove the overly permissive policy if it exists
DROP POLICY IF EXISTS "Public can view busy slots" ON appointments;
DROP POLICY IF EXISTS "Public can view all" ON appointments;

-- Allow public to INSERT (Book)
CREATE POLICY "Public can book" 
ON appointments FOR INSERT 
TO public 
WITH CHECK (true);

-- Allow authenticated (Admins) full access
CREATE POLICY "Admins full access" 
ON appointments FOR ALL 
TO authenticated 
USING (true);

-- NOTE: Public SELECT is now DISABLED on the table directly.
-- Clients must use the RPC functions defined above.
