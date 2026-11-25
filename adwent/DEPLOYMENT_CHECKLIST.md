# ✅ Checklist Wdrażania - Panel Nauczyciela

## 📋 Pre-deployment

- [ ] Sprawdzić czy wszystkie pliki są na miejscu
- [ ] Przetestować logowanie
- [ ] Sprawdzić responsywność na mobilnych urządzeniach
- [ ] Sprawdzić kompatybilność przeglądarek

## 🗄️ Baza Danych

### Migracja

- [ ] Uruchomić `202611170001_initial_schema.sql` w Supabase SQL Editor
- [ ] Sprawdzić czy wszystkie tabele zostały utworzone
- [ ] Sprawdzić czy RLS policies są aktywne
- [ ] Sprawdzić czy indeksy zostały utworzone

### Polecenie sprawdzenia

```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' OR table_schema = 'private';
```

Powinno być:
- ✅ profiles
- ✅ advent_editions
- ✅ advent_tasks
- ✅ task_attempts
- ✅ task_progress
- ✅ task_solutions (w schemacie `private`)

## 🔐 Konfiguracja Supabase

### Authentykacja

- [ ] Włączyć Email provider (Settings > Auth > Email)
- [ ] Skonfigurować SMTP (opcjonalnie)
- [ ] Dodać nauczyciela poprzez Auth > Users
- [ ] Ustawić jego rolę na `teacher` w profilu

### RLS Policies

- [ ] Sprawdzić czy są włączone dla każdej tabeli
- [ ] Przetestować dostęp jako uczeń
- [ ] Przetestować dostęp jako nauczyciel
- [ ] Sprawdzić czy `private.task_solutions` są niedostępne dla studentów

```sql
-- Sprawdzenie RLS
SELECT schemaname, tablename, rowsecurity
FROM pg_tables 
WHERE schemaname IN ('public', 'private');
```

## 🌐 Hosting

### Opcje

- [ ] GitHub Pages
- [ ] Vercel
- [ ] Netlify
- [ ] Własny serwer

### Pliki do uploadu

```
adwent/
├── *.html (wszystkie)
├── *.css  (wszystkie)
├── *.js   (wszystkie)
├── js/    (folder)
├── assets/ (jeśli jest)
└── css/   (jeśli jest)
```

## 🧪 Testy Funkcjonalne

### Panel Nauczyciela

#### Zalogowanie
- [ ] Zalogować się jako nauczyciel
- [ ] Sprawdzić czy pokazuje się panel nauczyciela
- [ ] Sprawdzić czy jest link "Panel Nauczyciela" w dashboard

#### Sekcja: Pulpit
- [ ] Sprawdzić czy ładują się statystyki (mogą być 0)
- [ ] Sprawdzić czy jest lista ostatnich odpowiedzi (pusta ok)
- [ ] Sprawdzić czy są ikony i opisy

#### Sekcja: Zadania
- [ ] Kliknąć na dzień w kalendarzu
- [ ] Sprawdzić czy otwiera się modal
- [ ] Wpisać dane:
  - Dzień: 1
  - Tytuł: "Test Task 1"
  - Kategoria: Algebra
  - Trudność: 2
  - Typ odpowiedzi: numeric
  - Punkty: 1
  - Treść: "2 + 2 = ?"
- [ ] Kliknąć "Zapisz zadanie"
- [ ] Sprawdzić czy zadanie pojawia się w kalendarzu (żółty kolor = szkic)
- [ ] Kliknąć ikonę 🔓 aby opublikować
- [ ] Sprawdzić czy zmienił się kolor na zielony

#### Sekcja: Odpowiedzi i Rozwiązania
- [ ] Wybrać zadanie z listy dropdown'u
- [ ] Wpisać odpowiedź: "4"
- [ ] Wpisać wyjaśnienie: "2 + 2 = 4"
- [ ] Kliknąć "Zapisz rozwiązanie"
- [ ] Sprawdzić toast powiadomienia (sukces)

#### Sekcja: Uczniowie
- [ ] Kliknąć "+ Nowy uczeń"
- [ ] Wpisać dane:
  - Imię i nazwisko: "Jan Test"
  - Email: "jan.test@example.com"
  - Klasa: "1A"
  - Hasło: (auto-generated)
- [ ] Kliknąć "Zapisz ucznia"
- [ ] Sprawdzić czy pojawia się w tabeli

**Import zbiorczy:**
- [ ] Przejść do zakładki "Import zbiorczy"
- [ ] Wkleić CSV:
  ```
  Maria,Test,1A
  Piotr,Test,1B
  ```
- [ ] Kliknąć "Importuj uczniów"
- [ ] Sprawdzić czy są 2 nowych uczniów
- [ ] Sprawdzić czy są przypisani do klas (filtr)

**Filtrowanie:**
- [ ] Napisać "Jan" w polu szukania
- [ ] Sprawdzić czy pokazuje się tylko Jan
- [ ] Wybrać klasa "1B" z dropdown'u
- [ ] Sprawdzić czy pokazuje się tylko 1B

### Panel Ucznia

#### Zalogowanie
- [ ] Zalogować się jako uczeń
- [ ] Sprawdzić czy działa logowanie
- [ ] Sprawdzić czy widać postęp 0/24

#### Rozwiązywanie zadania
- [ ] Kliknąć na dzień 1
- [ ] Sprawdzić czy pokazuje się treść zadania
- [ ] Sprawdzić czy jest pole do wpisania odpowiedzi
- [ ] Wpisać "4"
- [ ] Kliknąć "Wyślij"
- [ ] Sprawdzić czy pokazuje się "Poprawnie ✓"
- [ ] Sprawdzić czy licznik zmienił się na 1/24

#### Błędna odpowiedź
- [ ] Kliknąć na dzień 2
- [ ] Wpisać błędną odpowiedź (np. "0")
- [ ] Kliknąć "Wyślij"
- [ ] Sprawdzić czy pokazuje się "Błędnie ✗"
- [ ] Sprawdzić czy licznik nie zmienił się

## 🔄 Integracja

### Nawigacja między stronami

- [ ] Z index.html → calendar.html (uczniowie)
- [ ] Z index.html → teacher.html (nauczyciele)
- [ ] Z teacher.html → index.html (link w topbar)
- [ ] Z calendar.html → index.html (link w topbar)
- [ ] Wylogowanie działa wszędzie

## 🎨 UI/UX

- [ ] Kolory są prawidłowe
- [ ] Tekst jest czytelny (kontrast)
- [ ] Przyciski są klikalne i reagują
- [ ] Modalne zamykają się klawiszem ESC
- [ ] Toasty pojawiają się i znikają
- [ ] Animacje są płynne
- [ ] Brak dziwnych błędów CSS

## 📱 Responsywność

Przetestować na:
- [ ] Desktop (1920x1080)
- [ ] Tablet (768x1024)
- [ ] Mobile (375x667)

Sprawdzić:
- [ ] Nawigacja jest czytelna
- [ ] Tabele się nie zbiją
- [ ] Modalne są pełnoekranowe na mobile
- [ ] Tekst się nie overlappuje
- [ ] Przyciski są dostatecznie duże

## 🌐 Przeglądarki

Przetestować na:
- [ ] Chrome (najnowsza wersja)
- [ ] Firefox (najnowsza wersja)
- [ ] Safari (najnowsza wersja)
- [ ] Edge (najnowsza wersja)

## 🔒 Bezpieczeństwo

- [ ] Sprawdzić czy uczniowie nie mogą edytować zadań
- [ ] Sprawdzić czy uczniowie nie mogą widać rozwiązań
- [ ] Sprawdzić czy uczniowie nie mogą dodawać uczniów
- [ ] Sprawdzić czy nauczyciele mogą edytować tylko swoje zadania
- [ ] Sprawdzić czy RLS policies blokują nieautoryzowany dostęp

## 🐛 Debugowanie

### Konsolowe błędy

```javascript
// Otwórz F12 Console
// Sprawdź czy są błędy JavaScript
```

### Network tab

- [ ] Sprawdzić czy są 404 błędy
- [ ] Sprawdzić czy żądania do Supabase są 200 OK
- [ ] Sprawdzić czy RLS nie blokuje autoryzowanych żądań

## 📊 Performance

- [ ] Załadowanie strony < 3 sekundy
- [ ] Odpowiedź na akcję < 1 sekunda
- [ ] Brak memory leaks
- [ ] Brak nieskończonych ładowań

## 📝 Dokumentacja

- [ ] README.md jest kompletny
- [ ] TEACHER_PANEL.md opisuje wszystkie funkcje
- [ ] SEED_DATA.sql ma przykłady
- [ ] Kod ma komentarze w trudnych miejscach

## 🚀 Produkcja

### Pre-launch

- [ ] Backup bazy danych
- [ ] Sprawdzić czy HTTPS jest włączony
- [ ] Sprawdzić czy jest robots.txt
- [ ] Sprawdzić czy jest privacy policy (opcjonalnie)

### Post-launch

- [ ] Monitorować błędy w konsoli Supabase
- [ ] Monitorować wydajność
- [ ] Zbierać feedback od użytkowników
- [ ] Przygotować plan aktualizacji

## 📞 Support

W przypadku problemów:

1. Sprawdzić konsolę przeglądarki (F12)
2. Sprawdzić Network tab
3. Sprawdzić Supabase Logs
4. Czytać TEACHER_PANEL.md
5. Czytać README.md

## ✨ Funkcjonalności do przyszłości

- [ ] Wykresy statystyk (Chart.js)
- [ ] Export wyników (CSV)
- [ ] Email notyfikacje
- [ ] Dark/Light mode toggle
- [ ] Multi-language support
- [ ] Mobile app (React Native/Flutter)
- [ ] Video tutorials
- [ ] Leaderboard
- [ ] Achievements/Badges

---

## 📋 Ostateczna kontrola

- [ ] Wszystkie checklisty są zaznaczone
- [ ] Kod jest czysty i sformatowany
- [ ] Brak TODO komentarzy w kodzie
- [ ] Dokumentacja jest kompletna
- [ ] Backup bazy jest zrobiony
- [ ] Team jest wyszkolony
- [ ] Użytkownicy mają instrukcje
- [ ] ✅ **GOTOWE DO PRODUKCJI**

---

**Ostatnia aktualizacja:** Grudzień 2026
**Wersja:** 1.0.0
