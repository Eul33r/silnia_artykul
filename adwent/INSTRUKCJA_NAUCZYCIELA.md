# 👨‍🏫 Instrukcja dla Nauczyciela - Matematyczny Adwent

Witamy! Ta instrukcja poprowadzi Cię krok po kroku przez panel nauczyciela.

## 📱 Zalogowanie

1. Otwórz w przeglądarce: **[twoja-domena]/adwent/index.html**
2. Kliknij "Zaloguj się"
3. Wpisz email nauczyciela i hasło
4. Kliknij przycisk "🎓 Panel Nauczyciela"

✅ **Jesteś w panelu nauczyciela!**

---

## 🎯 Panel nauczyciela - 4 sekcje

### 1️⃣ PULPIT (📊 Dashboard)

**Tutaj widzisz statystyki:**

- 📋 **Utworzone zadania** - ile zadań masz przygotowane
- 🚀 **Opublikowane zadania** - ile uczniów może rozwiązywać
- 👥 **Aktywni uczniowie** - ilu uczniów rozwiązywało zadania ostatnio
- ⏱️ **Ostatnia aktywność** - kiedy ostatnio ktoś wysłał odpowiedź
- 📊 **Ostatnie odpowiedzi** - lista najnowszych prób rozwiązania

**Co tutaj robić?**
- Obserwować postępy uczniów
- Sprawdzać czy uczniowie są aktywni
- Widzieć kiedy ostatnio ktoś rozwiązywał zadania

---

### 2️⃣ ZADANIA (📝 Zarządzanie Zadaniami)

**Tutaj tworzysz i edytujesz zadania na każdy dzień.**

#### Plan na 24 dni:

W kalendarzu widzisz 24 pola (dni):
- 🟡 **Żółte** = Szkic (niedokończone)
- 🟢 **Zielone** = Opublikowane (uczniowie mogą rozwiązywać)
- ⚫ **Ciemne** = Brak zadania

#### Jak dodać nowe zadanie?

**Metoda 1: Kliknij na dzień w kalendarzu**
```
1. Kliknij na dowolne pole (np. dzień 1)
2. Otworzy się modal z formularzem
3. Wypełnij pola (patrz poniżej)
4. Kliknij "Zapisz zadanie"
```

**Metoda 2: Kliknij "+ Dodaj zadanie"**
```
1. Kliknij przycisk w górze
2. Wybierz dzień z listy (1-24)
3. Wypełnij formularz
4. Zapisz
```

#### Co wpisać w formularz zadania?

| Pole | Przykład | Opis |
|------|----------|------|
| **Dzień (1-24)** | 1 | Na który dzień to zadanie? |
| **Tytuł zadania** | Równanie kwadratowe | Krótka nazwa zadania |
| **Kategoria** | Algebra | Wybirz: Algebra, Geometria, Kombinatoryka, Teoria liczb, Logika |
| **Trudność (1-5)** | 2 | 1 = bardzo łatwe, 5 = bardzo trudne |
| **Typ odpowiedzi** | Liczba | Jak uczniowie będą odpowiadać? (liczba/tekst/wybór) |
| **Punkty** | 2 | Ile punktów za poprawną odpowiedź? |
| **Treść zadania** | Rozwiąż: x² + 2x - 3 = 0 | Pełne zadanie (możesz wpisać HTML) |

#### Po zapisaniu zadania:

Zadanie pojawia się w kalendarzu w **kolorze żółtym** (szkic).

#### Jak opublikować zadanie?

Zadanie musi mieć rozwiązanie zanim uczniowie będą mieli dostęp!

1. Najpierw dodaj rozwiązanie (patrz sekcja 3)
2. Wróć do "Zadania"
3. Kliknij ikonę 🔓 (odsłonięta tarcza)
4. Zadanie zmienia kolor na 🟢 zielony
5. ✅ Uczniowie mogą teraz je rozwiązywać!

#### Aby cofnąć publikację:

Kliknij ikonę 🔒 (zamknięta tarcza). Zadanie wraca do statusu "Szkic".

---

### 3️⃣ ODPOWIEDZI I ROZWIĄZANIA (✓ Odpowiedzi)

**Tutaj definiujesz prawidłową odpowiedź dla każdego zadania.**

#### Workflow:

1. **Wybierz zadanie** z dropdown'u
   ```
   "Dzień 1: Równanie liniowe"
   "Dzień 2: Pole trójkąta"
   ...
   ```

2. **Wpisz pola:**

   | Pole | Wymagane? | Przykład |
   |------|-----------|---------|
   | **Poprawna odpowiedź** | ✅ | 4 |
   | **Tolerancja** | ⚫ | 0.01 |
   | **Wyjaśnienie** | ⚫ | Sposób rozwiązania |
   | **Podpowiedź** | ⚫ | Wskazówka dla uczniów |

3. **Kliknij "Zapisz rozwiązanie"**

#### Co to jest "Tolerancja"?

Dla odpowiedzi liczbowych możesz dopuszczać błędy zaokrąglenia.

Przykład:
- Poprawna odpowiedź: **3.14159**
- Tolerancja: **0.01**
- Uczniowie mogą wpisać: 3.13, 3.14, 3.15 itp.

#### Wyjaśnienie i Podpowiedź

**Wyjaśnienie** (opcjonalne):
- Pokazuje się PO rozwiązaniu zadania
- Powinna zawierać krok-po-kroku jak rozwiązać
- Może zawierać HTML, formułki matematyczne

**Podpowiedź** (opcjonalna):
- Pokazuje się PRZED wysłaniem odpowiedzi
- Powinna być pomocna ale nie zdradzać odpowiedzi
- Pokazuje się gdy uczeń prosi o pomoc

---

### 4️⃣ UCZNIOWIE (👥 Zarządzanie Uczniami)

**Tutaj zarządzasz kontami uczniów.**

#### Dwie zakładki:

#### 📋 Lista uczniów

**Tabela z informacjami:**
- **Imię i nazwisko** - Pełna nazwa
- **Klasa** - Np. 1A, 1B
- **Aktywność** - Ostatnie zalogowanie
- **Postęp** - Ile zadań rozwiązanych (X/24)
- **Akcje** - Przyciski do edycji lub resetu hasła

**Funkcje:**

✏️ **Edytuj** - Zmień imię lub klasę ucznia

🔑 **Reset hasła** - Wygeneruj nowe hasło czasowe

🔍 **Szukaj** - Wpisz imię lub nazwisko aby znaleźć ucznia

📚 **Filtr po klasie** - Wybierz klasę aby zobaczyć tylko uczniów z tej klasy

#### 📥 Import zbiorczy (CSV)

**Najszybszy sposób na dodanie wielu uczniów!**

1. Kliknij zakładkę "Import zbiorczy"
2. Przygotuj dane w programie (Excel, Notepad):
   ```
   Jan,Kowalski,1A
   Maria,Nowak,1A
   Piotr,Lewandowski,1B
   Anna,Kamińska,1B
   ```
3. Wklej do pola tekstowego
4. Kliknij "Importuj uczniów"
5. ✅ Uczniowie zostali dodani!

**Format CSV:**
- Trzy kolumny rozdzielone przecinkami
- Każdy wiersz = jeden uczeń
- Kolumny: imię, nazwisko, klasa
- BEZ nagłówka (bez "Imię,Nazwisko,Klasa")

#### ➕ Dodawanie uczniów ręcznie

1. Kliknij "+ Nowy uczeń"
2. Wpisz:
   - **Imię i nazwisko** (np. "Jan Kowalski")
   - **Email** (np. "jan.kowalski@example.com")
   - **Klasa** (np. "1A")
3. Hasło będzie wygenerowane automatycznie
4. Kliknij "Zapisz ucznia"
5. Hasło pokaże się w powiadomieniu

---

## 📊 Praktyczny Przykład - Kompletny Workflow

Zawarliśmy Ci krok-po-kroku jak przygotować pierwsze zadanie:

### Dzień 1: Równanie liniowe

#### Krok 1: Dodaj zadanie

1. Kliknij pole "Dzień 1" w kalendarzu
2. Wypełnij:
   - Dzień: 1
   - Tytuł: "Równanie liniowe"
   - Kategoria: Algebra
   - Trudność: 1 (łatwe)
   - Typ: Numeric
   - Punkty: 1
   - Treść: "Rozwiąż: 2x + 5 = 13. Jaka jest wartość x?"
3. Kliknij "Zapisz zadanie" ✅

#### Krok 2: Dodaj rozwiązanie

1. Przejdź do sekcji "Odpowiedzi i Rozwiązania"
2. Wybierz "Dzień 1: Równanie liniowe" z dropdown'u
3. Wpisz:
   - Poprawna odpowiedź: **4**
   - Tolerancja: **0.0** (dokładna odpowiedź)
   - Wyjaśnienie: "2x + 5 = 13 → 2x = 8 → x = 4"
   - Podpowiedź: "Przenieś 5 na drugą stronę"
4. Kliknij "Zapisz rozwiązanie" ✅

#### Krok 3: Opublikuj zadanie

1. Wróć do sekcji "Zadania"
2. Kliknij ikonę 🔓 na polu "Dzień 1"
3. Pole zmienia kolor na 🟢 zielony
4. ✅ Uczniowie mogą teraz rozwiązywać to zadanie!

---

## ⚙️ Ustawienia i Opcje

### Kategorie zadań

- 📐 **Algebra** - Równania, funkcje, wielomiany
- 🎲 **Geometria** - Figury, kąty, pola
- 🔢 **Kombinatoryka** - Silnie, permutacje, kombinacje
- 🧮 **Teoria liczb** - Liczby pierwsze, podzielność
- 🧠 **Logika** - Zbiory, zdania, dowody

### Typy odpowiedzi

- 📝 **Tekst** - Uczeń wpisuje tekst
- 🔢 **Liczba** - Uczeń wpisuje liczbę (możliwa tolerancja)
- ○ **Wybór jednokrotny** - Uczeń wybiera JEDNĄ opcję
- ☑️ **Wybór wielokrotny** - Uczeń wybiera WIELE opcji

### Poziomy trudności

- ⭐ **1 (bardzo łatwe)** - Powtórzenie wiadomości
- ⭐⭐ **2 (łatwe)** - Standardowe zadania
- ⭐⭐⭐ **3 (średnie)** - Wymaga myślenia
- ⭐⭐⭐⭐ **4 (trudne)** - Wymaga znajomości
- ⭐⭐⭐⭐⭐ **5 (bardzo trudne)** - Dla najlepszych

---

## 🎓 Porady dla Nauczycieli

### 1. Przygotowanie przed Adwentem

- ✅ Przygotuj wszystkie 24 zadania z góry
- ✅ Każdego dnia sprawdź czy jest opublikowane
- ✅ Dodaj uczniów na początek

### 2. Monitorowanie Postępów

- 📊 Codziennie sprawdzaj "Pulpit" aby zobaczyć aktywność
- 👥 Przeglądaj "Uczniowie" aby zobaczyć kto nie rozwiązuje
- 💬 Możesz wysłać maila słabszym uczniom

### 3. Motywacja

- 🏆 Pokaż uczniom ranking na koniec miesiąca
- 🎁 Przygotuj nagrody dla tych którzy rozwiążą wszystko
- ⭐ Pochwal za poprawnie rozwiązane trudne zadania

### 4. Zarządzanie czasem

- 📅 Publikuj zadania codziennie rano
- ⏰ Ustaw deadline (np. do północy)
- 🔄 Cofnij publikację aby uczniowie mogli spróbować jeszcze raz

### 5. Treść zadań

- ✍️ Pisz zadania które są zaangażujące
- 🎨 Możesz używać HTML do formatowania
- 🔗 Możesz wpisać linki do dodatkowych materiałów
- 📐 Rysunki możesz wkleić jako obrazy (HTML img tag)

---

## ❓ FAQ - Częste Pytania

### Q: Mogę zmienić zadanie po opublikowaniu?
**A:** Tak! Kliknij na zadanie i edytuj. Zmiany będą widoczne dla uczniów.

### Q: Co jeśli uczeń nie może rozwiązać zadania?
**A:** Możesz cofnąć publikację aby uczeń mógł spróbować ponownie. Też możesz zmienić zadanie na łatwsze.

### Q: Mogę przywrócić poprzednie zadania z ubiegłego roku?
**A:** Niestety nie ma tej funkcji. Możesz skopiować-wkleić treść zadania ze starego dokumentu.

### Q: Jakie powinny być hasła uczniów?
**A:** System generuje 12-znakowe hasła. Możesz je zmienić jeśli chcesz coś prostszego.

### Q: Mogę usunąć ucznia?
**A:** Niestety nie ma tej funkcji w panelu. Skontaktuj się z administratorem.

### Q: Mogę exportować wyniki?
**A:** Niestety nie ma tej funkcji. Będzie dodana w przyszłości.

### Q: Co zrobić jeśli zapomnę hasła?
**A:** Zaloguj się na Supabase dashboard i zresetuj hasło.

---

## 🆘 Troubleshooting

| Problem | Co robić |
|---------|----------|
| Panel się nie ładuje | Sprawdź czy jesteś zalogowany jako nauczyciel |
| Zadanie się nie zapisuje | Sprawdź czy wypełniłeś wszystkie wymagane pola (gwiazdka *) |
| Uczniowie nie widzą zadań | Sprawdź czy zadania są opublikowane (zielony kolor) |
| Brak uczniów w liście | Dodaj ich poprzez "+ Nowy uczeń" lub import CSV |
| Hasło ucznia nie działa | Zresetuj hasło klikając przycisk "Reset hasła" |

---

## 📞 Potrzeba Pomocy?

1. 📖 Przeczytaj [QUICK_START.md](./QUICK_START.md) (5 minut)
2. 📚 Przeczytaj [TEACHER_PANEL.md](./TEACHER_PANEL.md) (szczegółowy opis)
3. 📋 Sprawdź [FAQ](#faq---częste-pytania) powyżej
4. 💬 Skontaktuj się z administratorem

---

## 🎉 Powodzenia z Adwentem!

Mamy nadzieję że uczniowie będą mieć dużo frajdy z matematycznym adwentem!

Jeśli masz sugestie jak ulepszyć panel nauczyciela, daj nam znać!

---

**Ostatnia aktualizacja:** Grudzień 2026
**Wersja:** 1.0.0
**Język:** Polski 🇵🇱
