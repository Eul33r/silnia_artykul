# 🚀 Szybki Start - Panel Nauczyciela

Zacznij z panelem nauczyciela w 5 minut!

## 1️⃣ Zalogowanie

```
URL: /adwent/index.html
Email: teacher@example.com
Hasło: (ustawione w Supabase Auth)
```

Kliknij "🎓 Panel Nauczyciela" → Przejdź do `/adwent/teacher.html`

## 2️⃣ Dodaj pierwsze zadanie

1. **Kliknij na dzień** (np. dzień 1) w kalendarzu
2. **Wpisz dane:**
   - Tytuł: "Moje pierwsze zadanie"
   - Kategoria: Algebra
   - Trudność: 2
   - Typ: Numeric
   - Treść: "2 + 2 = ?"
3. **Kliknij "Zapisz zadanie"**

## 3️⃣ Dodaj rozwiązanie

1. **Przejdź do "Odpowiedzi i Rozwiązania"**
2. **Wybierz zadanie** z dropdown'u
3. **Wpisz odpowiedź:** `4`
4. **Opcjonalnie:** Dodaj wyjaśnienie
5. **Kliknij "Zapisz rozwiązanie"**

## 4️⃣ Opublikuj zadanie

1. **Wróć do "Zadania"**
2. **Kliknij ikonę 🔓** (Opublikuj)
3. **Zadanie jest teraz widoczne dla uczniów**

## 5️⃣ Dodaj uczniów

### Opcja A: Ręcznie

1. **Przejdź do "Uczniowie"**
2. **Kliknij "+ Nowy uczeń"**
3. **Wpisz:**
   - Imię i nazwisko
   - Email
   - Klasa
4. **Kliknij "Zapisz ucznia"**

### Opcja B: Import CSV

1. **Kliknij zakładkę "Import zbiorczy"**
2. **Wklej dane:**
   ```
   Jan,Kowalski,1A
   Maria,Nowak,1A
   ```
3. **Kliknij "Importuj uczniów"**

## ✅ Gotowe!

Uczniowie mogą teraz:
- 📱 Zalogować się
- 📅 Widzieć opublikowane zadania
- ✏️ Rozwiązywać zadania
- 📊 Zbierać punkty

## 🎯 Co dalej?

- 📖 Przeczytaj [TEACHER_PANEL.md](./TEACHER_PANEL.md) dla pełnej dokumentacji
- 🧪 Użyj [SEED_DATA.sql](./SEED_DATA.sql) aby zaladować przykładowe dane
- ✅ Sprawdź [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) przed wdrażaniem

---

## 🆘 Troubleshooting

| Problem | Rozwiązanie |
|---------|------------|
| Nie widzę panelu nauczyciela | Zaloguj się jako nauczyciel (role: teacher) |
| Zadania się nie zapisują | Sprawdź konsolę (F12) czy są błędy |
| Uczniowie nie widzą zadań | Sprawdź czy zadania są opublikowane (zielony kolor) |
| Brak uczniów w liście | Dodaj uczniów ręcznie lub przez import CSV |

## 📞 Potrzebna pomoc?

1. Sprawdź `README.md`
2. Sprawdź `TEACHER_PANEL.md`
3. Czytaj komentarze w kodzie
4. Sprawdź konsolę przeglądarki (F12)

---

**🎉 Miłego nauczania z Matematycznym Adwentem!**

[Powrót do README](./README.md)
