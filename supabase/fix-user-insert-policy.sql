-- Fix: Allow users to create their own profile on registration

CREATE POLICY "Users can insert their own profile" ON public.users
  FOR INSERT
  WITH CHECK (auth.uid() = id);
