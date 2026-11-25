-- ============================================================
-- SEED DATA FOR TESTING - Matematyczny Adwent 2026
-- Run this after initial_schema.sql to populate test data
-- ============================================================

-- ============================================================
-- 1. TEST ACCOUNTS
-- ============================================================

-- Teacher account (manual creation via Auth UI)
-- Email: teacher@example.com
-- Password: teacher123
-- Role: teacher
-- Name: Pan Profesor

-- Student accounts (can be created via teacher panel import)
-- Email: jan.kowalski@example.com
-- Password: (generated)
-- Email: maria.nowak@example.com
-- Password: (generated)

-- ============================================================
-- 2. SAMPLE TASKS (5 examples)
-- ============================================================

-- Get the edition ID first (should be 2026)
-- Then run these inserts:

INSERT INTO public.advent_tasks (
    edition_id,
    day_number,
    title,
    category,
    difficulty,
    answer_type,
    content,
    options,
    points,
    is_published
) VALUES
-- Day 1: Easy algebra
(
    (SELECT id FROM public.advent_editions WHERE year = 2026 LIMIT 1),
    1,
    'Równanie liniowe',
    'algebra',
    1,
    'numeric',
    '{"text": "Rozwiąż równanie: 2x + 5 = 13<br><strong>Odpowiedź:</strong>"}',
    NULL,
    1,
    true
),
-- Day 2: Medium geometry
(
    (SELECT id FROM public.advent_editions WHERE year = 2026 LIMIT 1),
    2,
    'Pole trójkąta',
    'geometry',
    2,
    'numeric',
    '{"text": "Trójkąt ma podstawę 10 cm i wysokość 8 cm. Jakie jest jego pole (w cm²)?<br><strong>Odpowiedź:</strong>"}',
    NULL,
    2,
    true
),
-- Day 3: Medium combinatorics
(
    (SELECT id FROM public.advent_editions WHERE year = 2026 LIMIT 1),
    3,
    'Silnia',
    'combinatorics',
    2,
    'numeric',
    '{"text": "Ile jest permutacji zbioru {A, B, C, D}?<br><strong>Odpowiedź:</strong>"}',
    NULL,
    2,
    true
),
-- Day 4: Hard number theory
(
    (SELECT id FROM public.advent_editions WHERE year = 2026 LIMIT 1),
    4,
    'Liczby pierwsze',
    'number-theory',
    3,
    'single_choice',
    '{"text": "Ile dzielników naturalnych ma liczba 24?"}',
    '{"choices": ["4", "6", "8", "10"]}',
    3,
    true
),
-- Day 5: Draft (not published)
(
    (SELECT id FROM public.advent_editions WHERE year = 2026 LIMIT 1),
    5,
    'Funkcja kwadratowa',
    'algebra',
    3,
    'text',
    '{"text": "Podaj wierzchołek paraboli y = x² - 4x + 3 w postaci (a, b)<br><strong>Odpowiedź:</strong>"}',
    NULL,
    3,
    false
);

-- ============================================================
-- 3. SAMPLE SOLUTIONS (for tasks 1-4)
-- ============================================================

INSERT INTO private.task_solutions (task_id, correct_answer, tolerance, explanation, hint) VALUES
-- Task 1 solution
(
    (SELECT id FROM public.advent_tasks WHERE day_number = 1 LIMIT 1),
    '4',
    0.0,
    '{"text": "<strong>Rozwiązanie krok po kroku:</strong><br>1. 2x + 5 = 13<br>2. 2x = 13 - 5<br>3. 2x = 8<br>4. x = 8 ÷ 2<br>5. <strong>x = 4</strong>"}',
    '{"text": "Przenieś 5 na drugą stronę, dzieląc przez 2"}'
),
-- Task 2 solution
(
    (SELECT id FROM public.advent_tasks WHERE day_number = 2 LIMIT 1),
    '40',
    0.5,
    '{"text": "<strong>Pole trójkąta = (podstawa × wysokość) ÷ 2</strong><br>= (10 × 8) ÷ 2<br>= 80 ÷ 2<br>= <strong>40 cm²</strong>"}',
    '{"text": "Użyj wzoru: P = ½ × a × h"}'
),
-- Task 3 solution
(
    (SELECT id FROM public.advent_tasks WHERE day_number = 3 LIMIT 1),
    '24',
    0.0,
    '{"text": "<strong>Permutacje zbioru 4-elementowego = 4!</strong><br>= 4 × 3 × 2 × 1<br>= <strong>24</strong>"}',
    '{"text": "To jest silnia liczby 4"}'
),
-- Task 4 solution
(
    (SELECT id FROM public.advent_tasks WHERE day_number = 4 LIMIT 1),
    '8',
    0.0,
    '{"text": "<strong>Dzielniki naturalne liczby 24:</strong><br>1, 2, 3, 4, 6, 8, 12, 24<br>Razem: <strong>8 dzielników</strong>"}',
    '{"text": "Rozbij 24 na czynniki pierwsze: 2³ × 3"}'
);

-- ============================================================
-- 4. SAMPLE ATTEMPTS (simulated student activity)
-- ============================================================

-- Get student IDs from profiles table (after creating test accounts)
-- Then uncomment and run:

/*
INSERT INTO public.task_attempts (user_id, task_id, submitted_answer, is_correct, points_awarded, attempted_at) VALUES
-- Student 1 solves task 1 correctly
(
    (SELECT id FROM public.profiles WHERE display_name = 'Jan Kowalski' LIMIT 1),
    (SELECT id FROM public.advent_tasks WHERE day_number = 1 LIMIT 1),
    '{"answer": "4"}',
    true,
    1,
    NOW() - INTERVAL '2 days'
),
-- Student 1 attempts task 2 incorrectly
(
    (SELECT id FROM public.profiles WHERE display_name = 'Jan Kowalski' LIMIT 1),
    (SELECT id FROM public.advent_tasks WHERE day_number = 2 LIMIT 1),
    '{"answer": "35"}',
    false,
    0,
    NOW() - INTERVAL '1 day 20 hours'
),
-- Student 1 solves task 2 correctly on second try
(
    (SELECT id FROM public.profiles WHERE display_name = 'Jan Kowalski' LIMIT 1),
    (SELECT id FROM public.advent_tasks WHERE day_number = 2 LIMIT 1),
    '{"answer": "40"}',
    true,
    2,
    NOW() - INTERVAL '1 day'
),
-- Student 2 solves task 1
(
    (SELECT id FROM public.profiles WHERE display_name = 'Maria Nowak' LIMIT 1),
    (SELECT id FROM public.advent_tasks WHERE day_number = 1 LIMIT 1),
    '{"answer": "4"}',
    true,
    1,
    NOW() - INTERVAL '1 day'
);
*/

-- ============================================================
-- 5. SAMPLE PROGRESS (track completion)
-- ============================================================

/*
INSERT INTO public.task_progress (user_id, task_id, attempts_count, is_completed, best_points, completed_at, updated_at) VALUES
-- Jan Kowalski: completed tasks 1 and 2
(
    (SELECT id FROM public.profiles WHERE display_name = 'Jan Kowalski' LIMIT 1),
    (SELECT id FROM public.advent_tasks WHERE day_number = 1 LIMIT 1),
    1,
    true,
    1,
    NOW() - INTERVAL '2 days',
    NOW() - INTERVAL '2 days'
),
(
    (SELECT id FROM public.profiles WHERE display_name = 'Jan Kowalski' LIMIT 1),
    (SELECT id FROM public.advent_tasks WHERE day_number = 2 LIMIT 1),
    2,
    true,
    2,
    NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '1 day'
),
-- Maria Nowak: completed task 1
(
    (SELECT id FROM public.profiles WHERE display_name = 'Maria Nowak' LIMIT 1),
    (SELECT id FROM public.advent_tasks WHERE day_number = 1 LIMIT 1),
    1,
    true,
    1,
    NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '1 day'
);
*/

-- ============================================================
-- NOTES FOR TESTING
-- ============================================================

-- To populate student accounts via import:
-- 1. Go to teacher.html
-- 2. Navigate to "Uczniowie" section
-- 3. Click "Import zbiorczy" tab
-- 4. Paste this CSV:
--
--    Jan,Kowalski,1A
--    Maria,Nowak,1A
--    Piotr,Lewandowski,1B
--    Anna,Kamińska,1B
--
-- 5. Click "Importuj uczniów"

-- To test the system:
-- 1. Create a teacher account via login.html
-- 2. Navigate to teacher.html
-- 3. Add a few tasks (days 1-5)
-- 4. Add solutions for each task
-- 5. Publish tasks
-- 6. Create student accounts
-- 7. Log in as student and solve tasks
-- 8. Check progress in teacher panel

-- ============================================================
-- END OF SEED DATA
-- ============================================================
