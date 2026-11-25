# Supabase Setup - SQL Functions dla Panelu Nauczyciela

## 📋 Przegląd

Aby panel nauczyciela działał prawidłowo, musisz wdrożyć SQL Functions do Supabase. Funkcje te udostępniają API do zarządzania zadaniami i uczniami.

## 🔧 Metoda 1: Użycie Supabase SQL Editor (Zalecane)

### Krok 1: Otwórz Supabase Dashboard
1. Przejdź do https://app.supabase.com
2. Zaloguj się na swój projekt
3. Kliknij **SQL Editor** w lewym menu

### Krok 2: Wdróż Migration
1. Kliknij **New Query**
2. Skopiuj zawartość z: `adwent/supabase/migrations/202611250003_teacher_functions_client.sql`
3. Wklej do SQL Editora
4. Kliknij **Run** (lub Ctrl+Enter)

### Krok 3: Sprawdź czy Functions się utworzyły
1. Przejdź do **Database** → **Functions** w Supabase Dashboard
2. Powinieneś zobaczyć 10 nowych funkcji:
   - ✅ `get_teacher_dashboard_stats()`
   - ✅ `get_teacher_tasks()`
   - ✅ `get_task_with_solution(uuid)`
   - ✅ `create_task(...)`
   - ✅ `update_task(...)`
   - ✅ `toggle_task_publish(...)`
   - ✅ `save_task_solution(...)`
   - ✅ `get_students_list()`
   - ✅ `create_student(...)`
   - ✅ `reset_student_password(...)`
   - ✅ `get_student_details(uuid)`

## 🛠️ Metoda 2: Użycie Supabase CLI (Zaawansowane)

Jeśli masz zainstalowany Supabase CLI:

```bash
# W katalogu projektu
supabase db push

# lub konkretny migration
supabase migration new teacher_functions_client
# Skopiuj zawartość SQL do nowo utworzonego pliku
# Następnie:
supabase db push
```

## 🔐 Bezpieczeństwo

Wszystkie funkcje:
- ✅ Mają `SECURITY INVOKER` - wykonują się z uprawnieniami użytkownika
- ✅ Są dostępne tylko dla `authenticated` użytkowników (nauczyciele)
- ✅ Nie są dostępne dla `anon` (gościa)
- ✅ Nie mogą być wywoływane przez studenta (jeśli dobrze ustawisz RLS)

## 📝 Funkcje SQL - Opis

### Dashboard Stats
```sql
SELECT public.get_teacher_dashboard_stats()
-- Zwraca: total_tasks, published_tasks, total_students, recent_activity
```

### Zarządzanie Zadaniami
```sql
-- Pobierz wszystkie zadania
SELECT * FROM public.get_teacher_tasks()

-- Pobierz szczegóły zadania z rozwiązaniem
SELECT public.get_task_with_solution(task_id::uuid)

-- Stwórz nowe zadanie
SELECT public.create_task(
  p_day_number => 1,
  p_title => 'Zadanie na dzień 1',
  p_category => 'arytmetyka',
  p_difficulty => 2,
  p_content => '{"question": "Ile to 2+2?"}'::jsonb
)

-- Zaaktualizuj zadanie
SELECT public.update_task(
  p_task_id => task_id::uuid,
  p_day_number => 1,
  p_title => 'Nowy tytuł',
  p_category => 'arytmetyka',
  p_difficulty => 2,
  p_content => '{"question": "Ile to 3+3?"}'::jsonb,
  p_points => 10
)

-- Zmień status publikacji
SELECT public.toggle_task_publish(task_id::uuid, true)

-- Zapisz rozwiązanie
SELECT public.save_task_solution(
  p_task_id => task_id::uuid,
  p_correct_answer => '4'::jsonb,
  p_tolerance => 0.1,
  p_explanation => '{"text": "Wyjaśnienie..."}'::jsonb,
  p_hint => '{"text": "Podpowiedź..."}'::jsonb
)
```

### Zarządzanie Uczniami
```sql
-- Pobierz wszystkich uczniów
SELECT * FROM public.get_students_list()

-- Pobierz szczegóły ucznia
SELECT public.get_student_details(student_id::uuid)

-- Stwórz nowego ucznia
SELECT * FROM public.create_student(
  p_first_name => 'Jan',
  p_last_name => 'Kowalski',
  p_class => 'IB',
  p_email => 'jan@example.com'
)

-- Resetuj hasło ucznia
SELECT * FROM public.reset_student_password(student_id::uuid)
```

## 🧪 Testowanie

Po wdrożeniu funkcji, przetestuj je w SQL Editora:

```sql
-- Test: Pobierz statystyki
SELECT public.get_teacher_dashboard_stats();

-- Test: Pobierz listę zadań
SELECT * FROM public.get_teacher_tasks();

-- Test: Pobierz listę uczniów
SELECT * FROM public.get_students_list();
```

## 🚀 Integracja z teacher.js

Funkcje SQL są gotowe do użycia z `teacher.js`. Panel nauczyciela będzie je callować poprzez:

```javascript
// Przykład z teacher.js
const { data, error } = await supabase.rpc('get_teacher_dashboard_stats')
const { data: tasks, error: tasksError } = await supabase.rpc('get_teacher_tasks')
```

## ⚠️ Troubleshooting

### "Permission denied for schema private"
- Sprawdź czy `private.task_solutions` tabela istnieje
- Sprawdź RLS policies na tabeli `private.task_solutions`

### "Function does not exist"
- Upewnij się że migration 202611250003 się poprawnie wdrożyła
- Sprawdź czy funkcje pojawiają się w SQL Editor → Functions

### "Invalid JSON input"
- Pamiętaj żeby przesłać dane jako `jsonb`: `'{"key": "value"}'::jsonb`

## 📚 Więcej Informacji

- [Supabase SQL Functions Docs](https://supabase.com/docs/guides/database/functions)
- [RLS Policies](https://supabase.com/docs/guides/auth/row-level-security)
- [Private Schema Pattern](https://supabase.com/docs/guides/auth/row-level-security?queryGroups=private-schema)

## ✅ Checklist

- [ ] Migration 202611250003 wdrożona w Supabase
- [ ] 10+ funkcji widoczne w Database → Functions
- [ ] Funkcje testują się w SQL Editora
- [ ] teacher.js może je callować (brak 403/404 errów)
- [ ] RLS policies poprawnie zabezpieczają dane
- [ ] Dashboard ładuje się bez błędów
