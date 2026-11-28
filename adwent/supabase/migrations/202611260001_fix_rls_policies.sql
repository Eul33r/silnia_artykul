-- ============================================================
-- FIX: Add missing RLS policies for teacher panel
-- ============================================================

-- Enable RLS on private.task_solutions if not already enabled
ALTER TABLE IF EXISTS private.task_solutions ENABLE ROW LEVEL SECURITY;

-- Update trigger to allow setting teacher role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    INSERT INTO public.profiles (
        id,
        display_name,
        class_name,
        role
    )
    VALUES (
        NEW.id,
        COALESCE(
            NEW.raw_user_meta_data ->> 'display_name',
            'Uczeń'
        ),
        NEW.raw_user_meta_data ->> 'class_name',
        COALESCE(
            NULLIF(NEW.raw_user_meta_data ->> 'role', ''),
            'student'
        )
    );

    RETURN NEW;
END;
$$;

-- Allow authenticated users to read advent_editions
CREATE POLICY "Authenticated can read advent editions"
ON public.advent_editions
FOR SELECT
TO authenticated
USING (true);

-- Allow authenticated users to read published tasks or all tasks if teacher
CREATE POLICY "Authenticated can read published tasks"
ON public.advent_tasks
FOR SELECT
TO authenticated
USING (is_published = true);

-- Allow teachers to insert tasks
CREATE POLICY "Teachers can insert tasks"
ON public.advent_tasks
FOR INSERT
TO authenticated
WITH CHECK (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'teacher'
));

-- Allow teachers to update tasks
CREATE POLICY "Teachers can update tasks"
ON public.advent_tasks
FOR UPDATE
TO authenticated
USING (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'teacher'
))
WITH CHECK (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'teacher'
));

-- Allow teachers to delete tasks
CREATE POLICY "Teachers can delete tasks"
ON public.advent_tasks
FOR DELETE
TO authenticated
USING (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'teacher'
));

-- Allow authenticated users to read own task attempts
CREATE POLICY "Users can read own task attempts"
ON public.task_attempts
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Allow authenticated users to insert task attempts
CREATE POLICY "Users can insert task attempts"
ON public.task_attempts
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Allow authenticated users to read own task progress
CREATE POLICY "Users can read own task progress"
ON public.task_progress
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Allow authenticated users to update own task progress
CREATE POLICY "Users can update own task progress"
ON public.task_progress
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Allow authenticated users to insert task progress
CREATE POLICY "Users can insert task progress"
ON public.task_progress
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Users can read own profile
CREATE POLICY "Users can read own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Users can update own profile
CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Allow system trigger to insert profiles
CREATE POLICY "System can insert profiles"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow teachers to read task solutions
CREATE POLICY "Teachers can read task solutions"
ON private.task_solutions
FOR SELECT
TO authenticated
USING (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'teacher'
));

-- Allow teachers to insert task solutions
CREATE POLICY "Teachers can insert task solutions"
ON private.task_solutions
FOR INSERT
TO authenticated
WITH CHECK (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'teacher'
));

-- Allow teachers to update task solutions
CREATE POLICY "Teachers can update task solutions"
ON private.task_solutions
FOR UPDATE
TO authenticated
USING (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'teacher'
))
WITH CHECK (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'teacher'
));

-- Allow teachers to delete task solutions
CREATE POLICY "Teachers can delete task solutions"
ON private.task_solutions
FOR DELETE
TO authenticated
USING (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'teacher'
));
