-- Create function to check email domain
CREATE OR REPLACE FUNCTION public.check_email_domain()
RETURNS trigger AS $$
BEGIN
  -- Check if email ends with @illinois.edu
  IF NEW.email NOT LIKE '%@illinois.edu' THEN
    RAISE EXCEPTION 'Only illinois.edu email addresses are allowed';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to check email domain on user creation
CREATE TRIGGER check_email_domain_trigger
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.check_email_domain();
