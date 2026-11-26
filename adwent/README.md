# 🎄 Matematyczny Adwent 2026

Interaktywny kalendarz adwentowy z codziennymi wyzwaniami matematycznymi dla uczniów. Pełna platforma z panelem nauczyciela, systemem punktów i śledzeniem postępów.

## 🌟 Cechy

- 📅 **24 dni, 24 wyzwania** - Nowe zadanie co dzień
- 👨‍🎓 **Panel ucznia** - Elegancka strona do rozwiązywania zadań
- 🎓 **Panel nauczyciela** - Pełne zarządzanie zadaniami i uczniami
- 🏆 **System punktów** - Motywacja poprzez osiągnięcia
- 📊 **Statystyki** - Monitoring postępów
- 🔐 **Bezpieczeństwo** - Supabase z RLS

## 📚 Dokumentacja

### 🚀 Zacznij tutaj

- **[🎓 QUICK_START.md](./QUICK_START.md)** - Szybki start (5 minut)
- **[👨‍🏫 INSTRUKCJA_NAUCZYCIELA.md](./INSTRUKCJA_NAUCZYCIELA.md)** - Instrukcja dla nauczycieli (PL)

### 📖 Pełna dokumentacja

- **[README.md](./README.md)** - Pełny przegląd projektu
- **[TEACHER_PANEL.md](./TEACHER_PANEL.md)** - Szczegółowa instrukcja panelu nauczyciela
- **[IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)** - Podsumowanie implementacji

### 🛠️ Dla administratorów

- **[DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)** - Checklist wdrażania do produkcji
- **[SEED_DATA.sql](./SEED_DATA.sql)** - Dane testowe

---

## 📁 Struktura projektu

```
adwent/
├── 📄 HTML
│   ├── index.html          # Strona główna / dashboard
│   ├── login.html          # Logowanie
│   ├── calendar.html       # Panel ucznia (główny)
│   ├── dashboard.html      # Menu główne
│   └── teacher.html        # 🎓 Panel nauczyciela
│
├── 🎨 Styling
│   ├── calendar.css        # Wspólne style (zmienne, topbar, przyciski)
│   └── teacher.css         # 🎓 Style panelu nauczyciela
│
├── ⚙️ JavaScript
│   ├── calendar.js         # Logika kalendarza ucznia
│   ├── teacher.js          # 🎓 Logika panelu nauczyciela
│   └── js/
│       ├── auth.js         # Autentykacja (login, role check)
│       └── supabase.js     # Inicjalizacja klienta Supabase
│
├── 🗄️ Baza danych
│   └── 202611170001_initial_schema.sql  # Schemat SQL
│
├── 📚 Dokumentacja
│   ├── README.md           # Ten plik
│   ├── QUICK_START.md      # 🚀 Szybki start
│   ├── TEACHER_PANEL.md    # 🎓 Instrukcja panelu nauczyciela
│   ├── INSTRUKCJA_NAUCZYCIELA.md  # 👨‍🏫 Instrukcja dla nauczycieli
│   ├── IMPLEMENTATION_SUMMARY.md  # 📊 Podsumowanie
│   ├── DEPLOYMENT_CHECKLIST.md   # ✅ Checklist wdrażania
│   └── SEED_DATA.sql       # 🧪 Dane testowe
│
└── 🛠️ Supabase
    └── functions/          # Edge functions (opcjonalnie)
```

## 🚀 Szybki Start

### 1. Wymagania

- Konto Supabase (bezpłatne)
- Przeglądarka internetowa (Chrome, Firefox, Safari, Edge)

### 2. Konfiguracja Supabase

1. Utwórz nowy projekt w [supabase.com](https://supabase.com)
2. Skopiuj URL i Publishable Key
3. Wklej do `js/supabase.js`:

```javascript
const SUPABASE_URL = 'twoj-url';
const SUPABASE_PUBLISHABLE_KEY = 'twoj-klucz';
```

### 3. Inicjalizacja bazy danych

1. Otwórz SQL Editor w Supabase
2. Wklej zawartość `202611170001_initial_schema.sql`
3. Wykonaj zapytanie

### 4. Uruchomienie

Otwórz w przeglądarce:
- Strona główna: `index.html`
- Panel ucznia: `calendar.html` (po zalogowaniu)
- **🎓 Panel nauczyciela: `teacher.html` (dla kont z rolą `teacher`)**

---

## 🎓 Panel Nauczyciela

### Cztery główne sekcje:

1. **📊 Pulpit** - Statystyki i monitoring aktywności
   - Liczba utworzonych i opublikowanych zadań
   - Liczba aktywnych uczniów
   - Ostatnie odpowiedzi

2. **📝 Zadania** - Zarządzanie 24 zadaniami
   - Tworzenie nowych zadań
   - Edycja istniejących
   - Publikowanie/cofanie publikacji
   - Kalendarz wizualny z statusem

3. **✓ Odpowiedzi i Rozwiązania** - Zarządzanie odpowiedziami
   - Definiowanie poprawnej odpowiedzi
   - Tolerancja dla liczb
   - Wyjaśnienia i podpowiedzi

4. **👥 Uczniowie** - Zarządzanie kontami
   - Dodawanie użytkowników
   - Import zbiorczy (CSV)
   - Filtrowanie i wyszukiwanie
   - Monitoring postępów

### Zaletami:

✅ Responsywny design (desktop/tablet/mobile)
✅ Intuitywny interfejs
✅ Pełna dokumentacja
✅ Dane testowe (SEED_DATA.sql)
✅ Bezpieczeństwo (RLS policies)
✅ Bez frameworków (czysty JS)

---

## 👥 Role użytkowników

### Uczeń (`role: student`)

- ✅ Przeglądanie opublikowanych zadań
- ✅ Rozwiązywanie zadań
- ✅ Zbieranie punktów
- ✅ Przeglądanie wyników
- ❌ Edycja zadań

**Strony dostępne:**
- `index.html` - Dashboard
- `calendar.html` - Główny panel z zadaniami
- `login.html` - Logowanie

### Nauczyciel (`role: teacher`)

- ✅ **Tworzenie zadań (do 24)**
- ✅ **Edycja treści zadań**
- ✅ **Publikowanie/wycofywanie zadań**
- ✅ **Zarządzanie odpowiedziami**
- ✅ **Zarządzanie kontami uczniów**
- ✅ **Import zbiorczy (CSV)**
- ✅ **Przeglądanie statystyk**
- ✅ **Monitoring postępów**

**Strony dostępne:**
- `index.html` - Dashboard z linkiem do panelu nauczyciela
- `teacher.html` - **Pełny panel zarządzania** 🎓
- `login.html` - Logowanie

---

## 🗂️ Architektura bazy danych

### Tabele główne

**profiles** - Profile użytkowników
```sql
id, display_name, class_name, role (student/teacher), created_at
```

**advent_editions** - Edycje kalendarza (roczniki)
```sql
id, year, timezone, starts_at, ends_at, is_active, created_at
```

**advent_tasks** - Zadania do rozwiązania
```sql
id, edition_id, day_number (1-24), title, category, difficulty (1-5),
answer_type, content, options, points, is_published, created_at
```

**private.task_solutions** ⚠️ PRYWATNE - Rozwiązania
```sql
task_id, correct_answer, tolerance, explanation, hint
```

**task_attempts** - Próby rozwiązania
```sql
id, user_id, task_id, submitted_answer, is_correct, points_awarded, attempted_at
```

**task_progress** - Postęp ucznia
```sql
id, user_id, task_id, attempts_count, is_completed, best_points, completed_at
```

---

## 🔒 Bezpieczeństwo (RLS)

Wszystkie tabele mają Row Level Security włączony:

```sql
-- Profil: uczniowie widzą tylko siebie
SELECT: auth.uid() = id

-- Zadania: widoczne dla wszystkich autentykowanych
SELECT: is_published = true (dla studentów)

-- Rozwiązania: tylko nauczyciele w schema private

-- Próby: każdy widzi swoje
SELECT: auth.uid() = user_id
INSERT: auth.uid() = user_id
```

---

## 🎨 Interfejs

### Design System

**Kolory (zmienne CSS):**
```css
--night: #101a32           /* Główne tło */
--night-deep: #0a1225      /* Głębokie tło */
--gold: #f2c879            /* Akcent */
--green: #70c6a0           /* Sukces */
--red: #c85b60             /* Błąd */
--text: #f5f3ed            /* Tekst */
--muted: #aab7ce           /* Tekst słaby */
```

**Font:**
- Inter (sans-serif) + Georgia (serif headings)

**Layout:**
- Mobile-first responsive design
- Flexbox/CSS Grid
- Smooth animations

---

## 📱 Responsywność

Breakpoints:
- 📱 Mobile: < 480px
- 💻 Tablet: 480px - 768px
- 🖥️ Desktop: > 768px

Wszystkie komponenty są:
- ✅ Dostępne (WCAG 2.1 AA)
- ✅ Keyboard navigable
- ✅ Touch-friendly
- ✅ Screen reader friendly

---

## 🧪 Testowanie

### Testy manualne

- ✅ Zalogowanie
- ✅ Dodanie zadania
- ✅ Edycja zadania
- ✅ Publikacja
- ✅ Dodanie rozwiązania
- ✅ Zarządzanie uczniami
- ✅ Import CSV
- ✅ Responsywność

### Dane testowe

Użyj **[SEED_DATA.sql](./SEED_DATA.sql)** aby załadować przykładowe dane.

---

## 📈 Możliwości rozszerzenia

### Krótkoterminowe
- [ ] Eksport wyników do CSV
- [ ] Wykresy statystyk (Chart.js)
- [ ] Duplikowanie zadań z poprzednich lat
- [ ] Zaplanowane publikowanie

### Średnioterminowe
- [ ] Email notyfikacje
- [ ] SMS reminders
- [ ] Mobile app (PWA)
- [ ] Leaderboard
- [ ] Achievements/Badges

### Długoterminowe
- [ ] Multi-language support
- [ ] Theme customization
- [ ] API dla integracji
- [ ] Analytics dashboard

---

## 🚀 Wdrażanie

Przed wdrażaniem do produkcji:

1. 📋 Przechodzą [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)
2. 🧪 Uruchom testy z SEED_DATA.sql
3. 🔐 Sprawdzić RLS policies
4. 📱 Testować na różnych urządzeniach
5. ✅ Zrobić backup bazy danych

---

## 📞 Support

W przypadku pytań lub problemów:

1. 📖 Przeczytaj [QUICK_START.md](./QUICK_START.md)
2. 📚 Przeczytaj [TEACHER_PANEL.md](./TEACHER_PANEL.md)
3. 👨‍🏫 Przeczytaj [INSTRUKCJA_NAUCZYCIELA.md](./INSTRUKCJA_NAUCZYCIELA.md)
4. 🛠️ Sprawdzić konsolę przeglądarki (F12)
5. 💬 Skontaktuj się z zespołem

---

## 🎉 Status

✅ **GOTOWE DO PRODUKCJI**

Wszystkie zaplanowane funkcje zostały zaimplementowane:
- ✅ 4 sekcje panelu nauczyciela
- ✅ Pełna dokumentacja (PL + EN)
- ✅ Responsywny design
- ✅ Bezpieczeństwo (RLS)
- ✅ System testów
- ✅ Dane testowe

---

**Ostatnia aktualizacja:** Grudzień 2026
**Wersja:** 1.0.0
**Autor:** Copilot
**Licencja:** Edukacyjna (free to use)

## Szybkie Linki

- 🚀 [Szybki Start](./QUICK_START.md)
- 🎓 [Panel Nauczyciela](./TEACHER_PANEL.md)
- 👨‍🏫 [Instrukcja dla Nauczycieli](./INSTRUKCJA_NAUCZYCIELA.md)
- 📊 [Podsumowanie Implementacji](./IMPLEMENTATION_SUMMARY.md)
- ✅ [Checklist Wdrażania](./DEPLOYMENT_CHECKLIST.md)
- 🧪 [Dane Testowe](./SEED_DATA.sql)

