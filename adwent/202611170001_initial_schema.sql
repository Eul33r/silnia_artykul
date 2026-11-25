
-- ============================================================
-- MATEMATYCZNY ADWENT
-- Initial database schema
-- Edition: 2026
-- ============================================================

-- 1. PRIVATE SCHEMA
-- ============================================================

CREATE SCHEMA IF NOT EXISTS private;

REVOKE ALL ON SCHEMA private FROM PUBLIC;
REVOKE ALL ON SCHEMA private FROM anon;
REVOKE ALL ON SCHEMA private FROM authenticated;


-- 2. USER PROFILES
-- ============================================================

CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id)
        ON DELETE CASCADE,

    display_name TEXT NOT NULL,
    class_name TEXT,

    role TEXT NOT NULL DEFAULT 'student'
        CHECK (role IN ('student', 'teacher')),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Użytkownik może odczytać wyłącznie swój profil.
CREATE POLICY "Users can read own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);


-- 3. ADVENT EDITIONS
-- ============================================================

CREATE TABLE public.advent_editions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    year INTEGER NOT NULL UNIQUE,

    timezone TEXT NOT NULL DEFAULT 'Europe/Warsaw',

    starts_at TIMESTAMPTZ NOT NULL,
    ends_at TIMESTAMPTZ NOT NULL,

    is_active BOOLEAN NOT NULL DEFAULT FALSE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT valid_edition_dates
        CHECK (ends_at > starts_at)
);

ALTER TABLE public.advent_editions ENABLE ROW LEVEL SECURITY;


-- 4. ADVENT TASKS
-- ============================================================

CREATE TABLE public.advent_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    edition_id UUID NOT NULL
        REFERENCES public.advent_editions(id)
        ON DELETE CASCADE,

    day_number SMALLINT NOT NULL
        CHECK (day_number BETWEEN 1 AND 24),

    title TEXT NOT NULL,

    category TEXT NOT NULL,

    difficulty SMALLINT NOT NULL
        CHECK (difficulty BETWEEN 1 AND 5),

    answer_type TEXT NOT NULL
        CHECK (
            answer_type IN (
                'single_choice',
                'multiple_choice',
                'numeric',
                'text'
            )
        ),

    content JSONB NOT NULL DEFAULT '{}'::JSONB,

    options JSONB,

    points INTEGER NOT NULL DEFAULT 1
        CHECK (points > 0),

    is_published BOOLEAN NOT NULL DEFAULT FALSE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE (edition_id, day_number)
);

ALTER TABLE public.advent_tasks ENABLE ROW LEVEL SECURITY;


-- 5. PRIVATE TASK SOLUTIONS
-- ============================================================

CREATE TABLE private.task_solutions (
    task_id UUID PRIMARY KEY
        REFERENCES public.advent_tasks(id)
        ON DELETE CASCADE,

    correct_answer JSONB NOT NULL,

    tolerance NUMERIC,

    explanation JSONB,

    hint JSONB
);


-- 6. TASK ATTEMPTS
-- ============================================================

CREATE TABLE public.task_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL
        REFERENCES public.profiles(id)
        ON DELETE CASCADE,

    task_id UUID NOT NULL
        REFERENCES public.advent_tasks(id)
        ON DELETE CASCADE,

    submitted_answer JSONB NOT NULL,

    is_correct BOOLEAN NOT NULL,

    points_awarded INTEGER NOT NULL DEFAULT 0
        CHECK (points_awarded >= 0),

    attempted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.task_attempts ENABLE ROW LEVEL SECURITY;


-- 7. TASK PROGRESS
-- ============================================================

CREATE TABLE public.task_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL
        REFERENCES public.profiles(id)
        ON DELETE CASCADE,

    task_id UUID NOT NULL
        REFERENCES public.advent_tasks(id)
        ON DELETE CASCADE,

    attempts_count INTEGER NOT NULL DEFAULT 0,

    is_completed BOOLEAN NOT NULL DEFAULT FALSE,

    best_points INTEGER NOT NULL DEFAULT 0,

    completed_at TIMESTAMPTZ,

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE (user_id, task_id)
);

ALTER TABLE public.task_progress ENABLE ROW LEVEL SECURITY;


-- 8. INDEXES
-- ============================================================

CREATE INDEX idx_tasks_edition
ON public.advent_tasks(edition_id);

CREATE INDEX idx_attempts_user
ON public.task_attempts(user_id);

CREATE INDEX idx_attempts_task
ON public.task_attempts(task_id);

CREATE INDEX idx_progress_user
ON public.task_progress(user_id);

CREATE INDEX idx_progress_task
ON public.task_progress(task_id);


-- 9. USER PROFILE CREATION
-- ============================================================

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
        'student'
    );

    RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();


-- 10. INITIAL EDITION: 2026
-- ============================================================

INSERT INTO public.advent_editions (
    year,
    timezone,
    starts_at,
    ends_at,
    is_active
)
VALUES (
    2026,
    'Europe/Warsaw',
    '2026-12-01 00:00:00 Europe/Warsaw',
    '2026-12-25 00:00:00 Europe/Warsaw',
    TRUE
);


-- ============================================================
-- END OF INITIAL MIGRATION
-- ============================================================
