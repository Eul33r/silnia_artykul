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

-- Allow authenticated users to read published tasks
CREATE POLICY "Authenticated can read published tasks"
ON public.advent_tasks
FOR SELECT
TO authenticated
USING (is_published = true OR auth.uid() IN (
    SELECT id FROM public.profiles WHERE role = 'teacher'
));

-- Allow teachers to insert tasks
CREATE POLICY "Teachers can insert tasks"
ON public.advent_tasks
FOR INSERT
TO authenticated
WITH CHECK (
    auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'teacher')
);

-- Allow teachers to update their own tasks
CREATE POLICY "Teachers can update tasks"
ON public.advent_tasks
FOR UPDATE
TO authenticated
USING (
    auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'teacher')
)
WITH CHECK (
    auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'teacher')
);

-- Allow teachers to delete their own tasks
CREATE POLICY "Teachers can delete tasks"
ON public.advent_tasks
FOR DELETE
TO authenticated
USING (
    auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'teacher')
);

-- Allow authenticated users to read task attempts
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

-- Allow authenticated users to read task progress
CREATE POLICY "Users can read own task progress"
ON public.task_progress
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Allow authenticated users to update task progress
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

-- Allow teachers to read all student profiles
CREATE POLICY "Teachers can read all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
    auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'teacher')
    OR auth.uid() = id
);

-- Allow teachers to update student profiles
CREATE POLICY "Teachers can update profiles"
ON public.profiles
FOR UPDATE
TO authenticated
USING (
    auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'teacher')
    OR auth.uid() = id
)
WITH CHECK (
    auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'teacher')
    OR auth.uid() = id
);

-- Allow teachers to insert new student profiles (this is usually done via trigger, but needed for signUp)
CREATE POLICY "Teachers can insert profiles"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (
    auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'teacher')
    OR auth.uid() = id
);

-- Allow teachers to read task solutions
CREATE POLICY "Teachers can read task solutions"
ON private.task_solutions
FOR SELECT
TO authenticated
USING (
    auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'teacher')
);

-- Allow teachers to insert task solutions
CREATE POLICY "Teachers can insert task solutions"
ON private.task_solutions
FOR INSERT
TO authenticated
WITH CHECK (
    auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'teacher')
);

-- Allow teachers to update task solutions
CREATE POLICY "Teachers can update task solutions"
ON private.task_solutions
FOR UPDATE
TO authenticated
USING (
    auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'teacher')
)
WITH CHECK (
    auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'teacher')
);

-- Allow teachers to delete task solutions
CREATE POLICY "Teachers can delete task solutions"
ON private.task_solutions
FOR DELETE
TO authenticated
USING (
    auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'teacher')
);
