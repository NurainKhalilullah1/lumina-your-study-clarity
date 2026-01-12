-- Fix security warning: Set search_path for delete_own_account function
CREATE OR REPLACE FUNCTION public.delete_own_account()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
begin
  -- This deletes the user from the Authentication system
  -- Because we used "ON DELETE CASCADE" in your tables, 
  -- this SINGLE line automatically deletes their Assignments, Courses, and Profile too.
  delete from auth.users where id = auth.uid();
end;
$function$;