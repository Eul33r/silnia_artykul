# 🎓 Panel Nauczyciela - Matematyczny Adwent 2026

Kompletny panel zarządzania dla nauczycieli. Umożliwia tworzenie, edycję i publikację zadań matematycznych, zarządzanie uczniami oraz monitorowanie ich postępów.

## 📋 Spis treści

- [Dostęp do panelu](#dostęp-do-panelu)
- [1. Pulpit (Dashboard)](#1-pulpit-dashboard)
- [2. Zarządzanie Zadaniami](#2-zarządzanie-zadaniami)
- [3. Odpowiedzi i Rozwiązania](#3-odpowiedzi-i-rozwiązania)
- [4. Zarządzanie Uczniami](#4-zarządzanie-uczniami)
- [Instrukcje implementacji](#instrukcje-implementacji)

---

## 🔐 Dostęp do panelu

### Wymagania:
- Zalogowana konto nauczyciela (rola: `teacher`)
- Link dostępny: `/adwent/teacher.html`

### Nawigacja:
1. Zaloguj się na swoje konto nauczyciela
2. Na panelu głównym (`dashboard.html`) kliknij przycisk "🎓 Panel Nauczyciela"
3. Zostaniesz przekierowany na `/adwent/teacher.html`

---

## 1️⃣ Pulpit (Dashboard)

Główny widok panelu z kluczowymi statystykami i przeglądem aktywności.

### Wyświetlane statystyki:

📋 **Utworzone zadania** - Liczba wszystkich zadań w obecnej edycji
- Licznik wszystkich zadań (opublikowanych i szkiców)

🚀 **Opublikowane zadania** - Liczba zadań dostępnych dla uczniów
- Tylko zadania ze statusem `is_published = true`

👤 **Aktywni uczniowie** - Liczba uczniów, którzy rozwiązywali zadania w ostatnich 7 dni
- Licznik unikatowych użytkowników z ostatnich 7 dni

⏱️ **Ostatnia aktywność** - Czas ostatniej wysłanej odpowiedzi
- Relatywna godzina (np. "2h temu", "wczoraj")

### Sekcje:

**Statystyki rozwiązań** (do rozwijania)
- Wykres przygotowawczy dla wizualizacji danych
- Będzie zawierał: % poprawności, rozkład trudności, itd.

**Ostatnie odpowiedzi uczniów**
- Lista 10 ostatnich wysłanych odpowiedzi
- Wyświetla: imię ucznia, zadanie, status (✓/✗), godzinę
- Automatycznie się odświeża

---

## 2️⃣ Zarządzanie Zadaniami

Sekcja do tworzenia, edycji i publikacji 24 zadań adwentowych.

### Interfejs:

**Kalendarz zadań** (siatka 6x4)
- Każde pole reprezentuje jeden dzień (1-24)
- Kolory wskazują status:
  - 🟡 **Żółty**: Szkic (niezakończone)
  - 🟢 **Zielony**: Opublikowane (dostępne dla uczniów)
  - ⚫ **Ciemny**: Brak zadania

### Workflow zadania:

#### 1. Dodanie nowego zadania
- Kliknij przycisk "+ Dodaj zadanie" lub na puste pole w kalendarzu
- Otworzy się modal z formularzem

#### 2. Formularz zadania

| Pole | Typ | Wymagane | Opis |
|------|-----|----------|------|
| **Dzień (1-24)** | Liczba | ✅ | Numer dnia w kalendarzu |
| **Tytuł zadania** | Tekst | ✅ | np. "Równanie kwadratowe" |
| **Kategoria** | Select | ✅ | algebra, geometria, kombinatoryka, teoria liczb, logika |
| **Trudność (1-5)** | Liczba | ✅ | Skala od 1 (najłatwe) do 5 (najtrudniejsze) |
| **Typ odpowiedzi** | Select | ✅ | single_choice, multiple_choice, numeric, text |
| **Punkty** | Liczba | ✅ | Ilość punktów za poprawne rozwiązanie |
| **Treść zadania** | HTML | ✅ | Pełna zawartość zadania (może zawierać HTML) |

#### 3. Zapisanie zadania
- Kliknij "Zapisz zadanie"
- Zadanie pojawia się w kalendarzu w statusie "Szkic"

#### 4. Edycja zadania
- Kliknij na istniejące zadanie w kalendarzu
- Modyfikuj pola
- Kliknij "Zapisz zadanie"

#### 5. Publikacja zadania
- Kliknij ikonę 🔓 (Opublikuj) w karcie zadania
- Zadanie staje się dostępne dla uczniów
- Status zmienia się na 📢 Opublikowane (zielony)

#### 6. Wycofanie publikacji
- Kliknij ikonę 🔒 (Wycofaj) w karcie zadania
- Uczniowie nie widzą już zadania
- Status powraca na 📝 Szkic

---

## 3️⃣ Odpowiedzi i Rozwiązania

Zarządzanie poprawnymi odpowiedziami, tolerancją, wyjaśnieniami i podpowiedziami.

### Workflow:

#### 1. Wybór zadania
- Otwórz sekcję "Odpowiedzi i Rozwiązania"
- Wybierz zadanie z listy dropdown'u
- Format: "Dzień X: Tytuł zadania"

#### 2. Formularz rozwiązania

| Pole | Typ | Wymagane | Opis |
|------|-----|----------|------|
| **Poprawna odpowiedź** | Tekst | ✅ | Dokładna odpowiedź (np. "5", "π", "tak") |
| **Tolerancja (dla liczb)** | Liczba | ⚫ | Margines błędu (np. 0.01 dla liczb zmiennoprzecinkowych) |
| **Wyjaśnienie rozwiązania** | HTML | ⚫ | Krok po kroku jak rozwiązać zadanie |
| **Podpowiedź** | HTML | ⚫ | Opcjonalna podpowiedź dla uczniów |

#### 3. Zapisanie rozwiązania
- Kliknij "Zapisz rozwiązanie"
- Dane są przechowywane w tabeli `private.task_solutions`
- Odpowiedź jest teraz widoczna dla uczniów (jeśli zadanie opublikowane)

### Notatki:
- Pola **Wyjaśnienie** i **Podpowiedź** są opcjonalne
- Tolerancja dotyczy tylko odpowiedzi liczbowych
- Wyjaśnienia mogą zawierać HTML i formułki matematyczne

---

## 4️⃣ Zarządzanie Uczniami

Pełne zarządzanie kontami uczniów, przypisywaniem do klas i monitorowaniem postępów.

### Dwie zakładki:

#### 📋 Lista uczniów

**Tabela z informacjami:**

| Kolumna | Opis |
|---------|------|
| **Imię i nazwisko** | Pełna nazwa ucznia |
| **Klasa** | Przypisana klasa (np. 1A) |
| **Aktywność** | Ostatnia godzina rozwiązywania zadania |
| **Postęp** | Liczba ukończonych zadań (X/24) |
| **Akcje** | Przyciski: Edytuj, Reset hasła |

**Filtry:**
- 🔍 Wyszukiwanie po nazwie
- 🏫 Filtr po klasie

**Funkcje:**
- ✏️ **Edytuj** - Zmień dane ucznia (imię, klasę)
- 🔑 **Reset hasła** - Wygeneruj nowe hasło czasowe

#### 📥 Import zbiorczy

**Importuj uczniów z CSV:**

```csv
Imię,Nazwisko,Klasa
Jan,Kowalski,1A
Maria,Nowak,1A
Piotr,Lewandowski,1B
```

Format:
- Rozdzielanie kolumn: przecinkami `,`
- Kolumny: imię, nazwisko, klasa
- Opcjonalnie: klasa (jeśli pusta, uczeń będzie bez przypisanej klasy)

Proces:
1. Przejdź do zakładki "Import zbiorczy"
2. Wklej dane CSV
3. Kliknij "Importuj uczniów"
4. Każdy uczeń otrzyma unikalny email i tymczasowe hasło
5. Dane są wyświetlane w toście powiadomienia

### Dodawanie ucznia ręcznie:

1. Kliknij "+ Nowy uczeń"
2. Uzupełnij formularz:
   - **Imię i nazwisko** (wymagane)
   - **Email** (wymagane, musi być unikalny)
   - **Klasa** (wymagane)
   - **Hasło tymczasowe** (wygenerowane automatycznie)
3. Kliknij "Zapisz ucznia"
4. Uczeń otrzyma hasło w toście powiadomienia

### Edycja ucznia:

1. Kliknij przycisk "Edytuj" w tabeli
2. Zmień imię lub klasę
3. Kliknij "Zapisz ucznia"

---

## 🛠️ Instrukcje Implementacji

### Struktury plików:

```
adwent/
├── teacher.html          # Struktura HTML panelu
├── teacher.css           # Style CSS
├── teacher.js            # Logika JavaScript
├── calendar.css          # Wspólne style (dziedziczy)
├── js/
│   ├── auth.js          # Funkcje autentykacji
│   └── supabase.js       # Klient Supabase
└── 202611170001_initial_schema.sql  # Schemat bazy
```

### Wymagane tabele w Supabase:

Wszystkie tabele są już zdefiniowane w `202611170001_initial_schema.sql`:

- `profiles` - Profile użytkowników (uczniów i nauczycieli)
- `advent_editions` - Edycje kalendarza (2026, 2027, itd.)
- `advent_tasks` - Zadania (24 na edycję)
- `private.task_solutions` - Rozwiązania (prywatne dane)
- `task_attempts` - Próby rozwiązania
- `task_progress` - Postęp uczniów

### RLS (Row Level Security) Policy:

- Nauczyciele mogą edytować tylko w obrębie ich roli
- Uczniowie mogą widać tylko opublikowane zadania
- Rozwiązania są w schemacie `private` (niedostępne dla studentów)

### Funkcje dostępne w teacher.js:

**Dashboard:**
- `loadDashboard()` - Załaduj statystyki
- `loadRecentAttempts()` - Ostatnie odpowiedzi
- `formatTime()` - Formatowanie czasu

**Zadania:**
- `loadTasks()` - Załaduj wszystkie zadania
- `openTaskModal()` - Otwórz modal edycji
- `saveTask()` - Zapisz zadanie
- `toggleTaskPublish()` - Zmień status publikacji

**Rozwiązania:**
- `loadSolutions()` - Załaduj listę zadań
- `loadSolutionForm()` - Załaduj formularz
- `saveSolution()` - Zapisz rozwiązanie

**Uczniowie:**
- `loadStudents()` - Załaduj listę
- `openStudentModal()` - Modal ucznia
- `saveStudent()` - Zapisz ucznia
- `importBulkStudents()` - Import CSV
- `filterStudents()` - Filtrowanie

**Utility:**
- `showToast()` - Powiadomienia
- `generatePassword()` - Generator haseł

---

## 🎨 Style i Responsywność

Wszystkie komponenty:
- ✅ Responsywne (desktop, tablet, mobile)
- ✅ Dark mode (z palety kolorów z calendar.css)
- ✅ Dostępne (ARIA labels, keyboard navigation)
- ✅ Animacje i przejścia

### Kolory:
- 🟡 Gold (`--gold: #f2c879`) - Akcent
- 🟢 Zielony (`--green: #70c6a0`) - Sukces
- 🔴 Czerwony (`--red: #c85b60`) - Błąd
- ⚪ Tekst (`--text: #f5f3ed`) - Tekst główny
- ⚫ Tło (`--night: #101a32`) - Ciemne tło

---

## 🚀 Następne kroki

### Do dodania w przyszłości:
1. ✅ Eksport wyników do CSV
2. ✅ Wykresy statystyk (Chart.js)
3. ✅ Zaawansowane filtry
4. ✅ Duplikowanie zadań z poprzednich lat
5. ✅ Szablon kopiowania dla całej klasy
6. ✅ Harmonogram automatycznego publikowania (cron jobs)
7. ✅ Email notyfikacje
8. ✅ Backup i restore

---

## 📞 Support

W przypadku pytań lub problemów, sprawdź:
1. Konsolę przeglądarki (F12) pod kątem błędów JavaScript
2. Network tab - sprawdź requesty do Supabase
3. Status RLS policies w Supabase dashboard

---

**Ostatnia aktualizacja:** Grudzień 2026
**Wersja:** 1.0.0
