-- Function to delete a user by email
CREATE OR REPLACE FUNCTION delete_user_by_email(p_email TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Get the user ID
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = p_email;

  -- If user exists, delete related data and user
  IF v_user_id IS NOT NULL THEN
    -- Delete from fractitoken_transactions
    DELETE FROM public.fractitoken_transactions
    WHERE user_id = v_user_id::text;

    -- Delete from fractitoken_balances
    DELETE FROM public.fractitoken_balances
    WHERE user_id = v_user_id::text;

    -- Delete from chat_history
    DELETE FROM public.chat_history
    WHERE user_id = v_user_id::text;

    -- Delete from auth.users
    DELETE FROM auth.users
    WHERE id = v_user_id;
  END IF;
END;
$$; 