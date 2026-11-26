
-- ============================================================
-- MATEMATYCZNY ADWENT 2026
-- Bezpieczne operacje panelu nauczyciela
-- ============================================================

-- Pobieranie listy zadań wraz z rozwiązaniami.
-- Funkcja dostępna wyłącznie przez service_role.

CREATE OR REPLACE FUNCTION public.admin_list_advent_tasks(
    p_edition_id uuid
)
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT COALESCE(
        jsonb_agg(
            jsonb_build_object(
                'id', t.id,
                'edition_id', t.edition_id,
                'day_number', t.day_number,
                'unlock_at', t.unlock_at,
                'title', t.title,
                'category', t.category,
                'difficulty', t.difficulty,
                'answer_type', t.answer_type,
                'content', t.content,
                'points', t.points,
                'is_published', t.is_published,
                'solution',
                    CASE
                        WHEN s.task_id IS NULL THEN NULL
                        ELSE jsonb_build_object(
                            'correct_answer', s.correct_answer,
                            'tolerance', s.tolerance,
                            'hint', s.hint,
                            'explanation', s.explanation
                        )
                    END
            )
            ORDER BY t.day_number
        ),
        '[]'::jsonb
    )
    FROM public.advent_tasks AS t
    LEFT JOIN private.task_solutions AS s
        ON s.task_id = t.id
    WHERE t.edition_id = p_edition_id;
$$;


-- Tworzenie i aktualizowanie zadania wraz z rozwiązaniem.

CREATE OR REPLACE FUNCTION public.admin_save_advent_task(
    p_task_id uuid,
    p_edition_id uuid,
    p_day_number smallint,
    p_unlock_at timestamptz,
    p_title text,
    p_category text,
    p_difficulty smallint,
    p_points integer,
    p_is_published boolean,
    p_content jsonb,
    p_correct_answer jsonb,
    p_tolerance numeric,
    p_hint jsonb,
    p_explanation jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_task_id uuid;
BEGIN
    -- Poprawna odpowiedź musi być liczbą JSON.
    IF p_correct_answer IS NULL
       OR jsonb_typeof(p_correct_answer) <> 'number' THEN
        RAISE EXCEPTION 'Correct answer must be a JSON number';
    END IF;

    IF p_tolerance IS NOT NULL AND p_tolerance < 0 THEN
        RAISE EXCEPTION 'Tolerance cannot be negative';
    END IF;

    IF p_task_id IS NULL THEN

        INSERT INTO public.advent_tasks (
            edition_id,
            day_number,
            unlock_at,
            title,
            category,
            difficulty,
            answer_type,
            content,
            options,
            points,
            is_published
        )
        VALUES (
            p_edition_id,
            p_day_number,
            p_unlock_at,
            p_title,
            p_category,
            p_difficulty,
            'numeric',
            p_content,
            NULL,
            p_points,
            p_is_published
        )
        RETURNING id INTO v_task_id;

    ELSE

        UPDATE public.advent_tasks
        SET
            day_number = p_day_number,
            unlock_at = p_unlock_at,
            title = p_title,
            category = p_category,
            difficulty = p_difficulty,
            answer_type = 'numeric',
            content = p_content,
            options = NULL,
            points = p_points,
            is_published = p_is_published
        WHERE id = p_task_id
          AND edition_id = p_edition_id
        RETURNING id INTO v_task_id;

        IF v_task_id IS NULL THEN
            RAISE EXCEPTION 'Task not found in selected edition';
        END IF;

    END IF;

    -- Zapis odpowiedzi do prywatnego schematu.
    INSERT INTO private.task_solutions (
        task_id,
        correct_answer,
        tolerance,
        hint,
        explanation
    )
    VALUES (
        v_task_id,
        p_correct_answer,
        p_tolerance,
        p_hint,
        p_explanation
    )
    ON CONFLICT (task_id)
    DO UPDATE SET
        correct_answer = EXCLUDED.correct_answer,
        tolerance = EXCLUDED.tolerance,
        hint = EXCLUDED.hint,
        explanation = EXCLUDED.explanation;

    RETURN v_task_id;
END;
$$;


-- Blokujemy bezpośrednie wywoływanie funkcji przez uczniów.
REVOKE ALL ON FUNCTION
    public.admin_list_advent_tasks(uuid)
FROM PUBLIC, anon, authenticated;

REVOKE ALL ON FUNCTION
    public.admin_save_advent_task(
        uuid, uuid, smallint, timestamptz,
        text, text, smallint, integer, boolean,
        jsonb, jsonb, numeric, jsonb, jsonb
    )
FROM PUBLIC, anon, authenticated;


-- Dostęp wyłącznie dla backendu.
GRANT EXECUTE ON FUNCTION
    public.admin_list_advent_tasks(uuid)
TO service_role;

GRANT EXECUTE ON FUNCTION
    public.admin_save_advent_task(
        uuid, uuid, smallint, timestamptz,
        text, text, smallint, integer, boolean,
        jsonb, jsonb, numeric, jsonb, jsonb
    )
TO service_role;