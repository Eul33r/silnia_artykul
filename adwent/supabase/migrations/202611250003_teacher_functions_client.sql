-- ============================================================
-- MATEMATYCZNY ADWENT 2026
-- Funkcje dostępne dla nauczycieli z panelu (klient)
-- ============================================================

-- Pobieranie statystyk dla pulpitu nauczyciela
-- Liczba zadań, uczniów, ostatnia aktywność
CREATE OR REPLACE FUNCTION public.get_teacher_dashboard_stats()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY INVOKER
AS $$
    SELECT jsonb_build_object(
        'total_tasks', (
            SELECT COUNT(*)
            FROM public.advent_tasks
            WHERE edition_id = (
                SELECT id FROM public.advent_editions 
                WHERE EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM NOW())
                LIMIT 1
            )
        ),
        'published_tasks', (
            SELECT COUNT(*)
            FROM public.advent_tasks
            WHERE edition_id = (
                SELECT id FROM public.advent_editions 
                WHERE EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM NOW())
                LIMIT 1
            )
            AND is_published = true
        ),
        'total_students', (
            SELECT COUNT(*)
            FROM public.users
            WHERE role = 'student'
        ),
        'recent_activity', (
            SELECT MAX(created_at)
            FROM public.user_attempts
            WHERE student_id IN (
                SELECT id FROM public.users WHERE role = 'student'
            )
        )
    );
$$;


-- Pobieranie listy zadań dla nauczyciela
-- Z informacją czy są rozwiązania
CREATE OR REPLACE FUNCTION public.get_teacher_tasks()
RETURNS TABLE (
    id uuid,
    day_number smallint,
    title text,
    category text,
    difficulty smallint,
    unlock_at timestamptz,
    is_published boolean,
    has_solution boolean,
    created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY INVOKER
AS $$
    SELECT 
        t.id,
        t.day_number,
        t.title,
        t.category,
        t.difficulty,
        t.unlock_at,
        t.is_published,
        CASE WHEN s.task_id IS NOT NULL THEN true ELSE false END as has_solution,
        t.created_at
    FROM public.advent_tasks t
    LEFT JOIN private.task_solutions s ON s.task_id = t.id
    WHERE t.edition_id = (
        SELECT id FROM public.advent_editions 
        WHERE EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM NOW())
        LIMIT 1
    )
    ORDER BY t.day_number ASC;
$$;


-- Pobieranie szczegółów zadania wraz z rozwiązaniem
CREATE OR REPLACE FUNCTION public.get_task_with_solution(p_task_id uuid)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY INVOKER
AS $$
    SELECT jsonb_build_object(
        'task', jsonb_build_object(
            'id', t.id,
            'day_number', t.day_number,
            'title', t.title,
            'category', t.category,
            'difficulty', t.difficulty,
            'content', t.content,
            'answer_type', t.answer_type,
            'points', t.points,
            'unlock_at', t.unlock_at,
            'is_published', t.is_published
        ),
        'solution', CASE 
            WHEN s.task_id IS NULL THEN NULL
            ELSE jsonb_build_object(
                'correct_answer', s.correct_answer,
                'tolerance', s.tolerance,
                'hint', s.hint,
                'explanation', s.explanation
            )
        END
    )
    FROM public.advent_tasks t
    LEFT JOIN private.task_solutions s ON s.task_id = t.id
    WHERE t.id = p_task_id;
$$;


-- Tworzenie nowego zadania
CREATE OR REPLACE FUNCTION public.create_task(
    p_day_number smallint,
    p_title text,
    p_category text,
    p_difficulty smallint,
    p_content jsonb,
    p_answer_type text DEFAULT 'numeric',
    p_points integer DEFAULT 10,
    p_is_published boolean DEFAULT false
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    v_task_id uuid;
    v_edition_id uuid;
BEGIN
    -- Pobierz ID edycji na bieżący rok
    SELECT id INTO v_edition_id
    FROM public.advent_editions 
    WHERE EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM NOW())
    LIMIT 1;
    
    IF v_edition_id IS NULL THEN
        RAISE EXCEPTION 'No edition found for current year';
    END IF;

    INSERT INTO public.advent_tasks (
        edition_id,
        day_number,
        title,
        category,
        difficulty,
        content,
        answer_type,
        points,
        is_published,
        unlock_at
    )
    VALUES (
        v_edition_id,
        p_day_number,
        p_title,
        p_category,
        p_difficulty,
        p_content,
        p_answer_type,
        p_points,
        p_is_published,
        (DATE '2026-12-01' + (p_day_number - 1) || ' days')::timestamptz
    )
    RETURNING id INTO v_task_id;

    RETURN v_task_id;
END;
$$;


-- Aktualizowanie zadania
CREATE OR REPLACE FUNCTION public.update_task(
    p_task_id uuid,
    p_day_number smallint,
    p_title text,
    p_category text,
    p_difficulty smallint,
    p_content jsonb,
    p_points integer
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
    UPDATE public.advent_tasks
    SET
        day_number = p_day_number,
        title = p_title,
        category = p_category,
        difficulty = p_difficulty,
        content = p_content,
        points = p_points,
        updated_at = NOW()
    WHERE id = p_task_id;
    
    RETURN FOUND;
END;
$$;


-- Zmiana statusu publikacji zadania
CREATE OR REPLACE FUNCTION public.toggle_task_publish(
    p_task_id uuid,
    p_is_published boolean
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
    UPDATE public.advent_tasks
    SET
        is_published = p_is_published,
        updated_at = NOW()
    WHERE id = p_task_id;
    
    RETURN FOUND;
END;
$$;


-- Zapisywanie rozwiązania zadania (odpowiedź, tolerancja, wyjaśnienie, podpowiedź)
CREATE OR REPLACE FUNCTION public.save_task_solution(
    p_task_id uuid,
    p_correct_answer jsonb,
    p_tolerance numeric,
    p_explanation jsonb,
    p_hint jsonb
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
    INSERT INTO private.task_solutions (
        task_id,
        correct_answer,
        tolerance,
        explanation,
        hint
    )
    VALUES (
        p_task_id,
        p_correct_answer,
        p_tolerance,
        p_explanation,
        p_hint
    )
    ON CONFLICT (task_id)
    DO UPDATE SET
        correct_answer = EXCLUDED.correct_answer,
        tolerance = EXCLUDED.tolerance,
        explanation = EXCLUDED.explanation,
        hint = EXCLUDED.hint,
        updated_at = NOW();
    
    RETURN true;
END;
$$;


-- Pobieranie listy uczniów
CREATE OR REPLACE FUNCTION public.get_students_list()
RETURNS TABLE (
    id uuid,
    first_name text,
    last_name text,
    class text,
    email text,
    created_at timestamptz,
    last_activity timestamptz
)
LANGUAGE sql
STABLE
SECURITY INVOKER
AS $$
    SELECT 
        u.id,
        u.first_name,
        u.last_name,
        u.class,
        u.email,
        u.created_at,
        (SELECT MAX(created_at) FROM public.user_attempts WHERE student_id = u.id) as last_activity
    FROM public.users u
    WHERE u.role = 'student'
    ORDER BY u.last_name, u.first_name;
$$;


-- Tworzenie nowego ucznia
CREATE OR REPLACE FUNCTION public.create_student(
    p_first_name text,
    p_last_name text,
    p_class text,
    p_email text
)
RETURNS TABLE (
    student_id uuid,
    generated_password text
)
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    v_user_id uuid;
    v_password text;
BEGIN
    -- Generowanie hasła
    v_password := substring(
        'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
        FROM (random() * 61)::int + 1 FOR 1
    ) || substring(
        'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
        FROM (random() * 61)::int + 1 FOR 1
    ) || substring(
        'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
        FROM (random() * 61)::int + 1 FOR 1
    ) || substring(
        'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
        FROM (random() * 61)::int + 1 FOR 1
    ) || substring(
        'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
        FROM (random() * 61)::int + 1 FOR 1
    ) || substring(
        'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
        FROM (random() * 61)::int + 1 FOR 1
    ) || substring(
        'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
        FROM (random() * 61)::int + 1 FOR 1
    ) || substring(
        'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
        FROM (random() * 61)::int + 1 FOR 1
    ) || substring(
        'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
        FROM (random() * 61)::int + 1 FOR 1
    ) || substring(
        'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
        FROM (random() * 61)::int + 1 FOR 1
    ) || substring(
        'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
        FROM (random() * 61)::int + 1 FOR 1
    ) || substring(
        'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
        FROM (random() * 61)::int + 1 FOR 1
    );

    -- Wstawienie użytkownika
    INSERT INTO public.users (
        first_name,
        last_name,
        class,
        email,
        password_hash,
        role
    )
    VALUES (
        p_first_name,
        p_last_name,
        p_class,
        p_email,
        crypt(v_password, gen_salt('bf')),
        'student'
    )
    RETURNING id INTO v_user_id;

    RETURN QUERY SELECT v_user_id, v_password;
END;
$$;


-- Resetowanie hasła ucznia
CREATE OR REPLACE FUNCTION public.reset_student_password(p_student_id uuid)
RETURNS TABLE (
    new_password text
)
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    v_password text;
BEGIN
    -- Generowanie nowego hasła (12 znaków)
    v_password := substring(
        'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
        FROM (random() * 61)::int + 1 FOR 1
    ) || substring(
        'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
        FROM (random() * 61)::int + 1 FOR 1
    ) || substring(
        'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
        FROM (random() * 61)::int + 1 FOR 1
    ) || substring(
        'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
        FROM (random() * 61)::int + 1 FOR 1
    ) || substring(
        'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
        FROM (random() * 61)::int + 1 FOR 1
    ) || substring(
        'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
        FROM (random() * 61)::int + 1 FOR 1
    ) || substring(
        'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
        FROM (random() * 61)::int + 1 FOR 1
    ) || substring(
        'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
        FROM (random() * 61)::int + 1 FOR 1
    ) || substring(
        'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
        FROM (random() * 61)::int + 1 FOR 1
    ) || substring(
        'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
        FROM (random() * 61)::int + 1 FOR 1
    ) || substring(
        'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
        FROM (random() * 61)::int + 1 FOR 1
    ) || substring(
        'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
        FROM (random() * 61)::int + 1 FOR 1
    );

    -- Aktualizacja hasła
    UPDATE public.users
    SET password_hash = crypt(v_password, gen_salt('bf'))
    WHERE id = p_student_id;

    RETURN QUERY SELECT v_password;
END;
$$;


-- Pobieranie szczegółów ucznia z postępem
CREATE OR REPLACE FUNCTION public.get_student_details(p_student_id uuid)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY INVOKER
AS $$
    SELECT jsonb_build_object(
        'id', u.id,
        'first_name', u.first_name,
        'last_name', u.last_name,
        'class', u.class,
        'email', u.email,
        'created_at', u.created_at,
        'total_attempts', (
            SELECT COUNT(*)
            FROM public.user_attempts
            WHERE student_id = u.id
        ),
        'correct_answers', (
            SELECT COUNT(*)
            FROM public.user_attempts
            WHERE student_id = u.id AND is_correct = true
        ),
        'recent_activity', (
            SELECT MAX(created_at)
            FROM public.user_attempts
            WHERE student_id = u.id
        )
    )
    FROM public.users u
    WHERE u.id = p_student_id;
$$;


-- ============================================================
-- Uprawnienia dostępu
-- ============================================================

-- Wszystkie funkcje dostępne dla authenticated nauczycieli
GRANT EXECUTE ON FUNCTION public.get_teacher_dashboard_stats() 
TO authenticated;

GRANT EXECUTE ON FUNCTION public.get_teacher_tasks() 
TO authenticated;

GRANT EXECUTE ON FUNCTION public.get_task_with_solution(uuid) 
TO authenticated;

GRANT EXECUTE ON FUNCTION public.create_task(smallint, text, text, smallint, jsonb, text, integer, boolean) 
TO authenticated;

GRANT EXECUTE ON FUNCTION public.update_task(uuid, smallint, text, text, smallint, jsonb, integer) 
TO authenticated;

GRANT EXECUTE ON FUNCTION public.toggle_task_publish(uuid, boolean) 
TO authenticated;

GRANT EXECUTE ON FUNCTION public.save_task_solution(uuid, jsonb, numeric, jsonb, jsonb) 
TO authenticated;

GRANT EXECUTE ON FUNCTION public.get_students_list() 
TO authenticated;

GRANT EXECUTE ON FUNCTION public.create_student(text, text, text, text) 
TO authenticated;

GRANT EXECUTE ON FUNCTION public.reset_student_password(uuid) 
TO authenticated;

GRANT EXECUTE ON FUNCTION public.get_student_details(uuid) 
TO authenticated;
