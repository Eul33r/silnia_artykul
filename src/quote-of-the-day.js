const QUOTES_API_URL =
    "https://script.google.com/macros/s/AKfycbx-LqozmSbpyNiXAsQ0ugVFRVWJSfdFmmPBUKZBhuBcFOclXEqNSsXHXj1sp4Z7jA4TZA/exec";


document.addEventListener("DOMContentLoaded", () => {
    loadQuoteOfTheDay();
});


async function loadQuoteOfTheDay() {
    const quoteEn = document.getElementById("quote-en");
    const quotePl = document.getElementById("quote-pl");
    const quoteAuthor = document.getElementById("quote-author");
    const translationToggle = document.getElementById(
        "quote-translation-toggle"
    );

    if (!quoteEn || !quotePl || !quoteAuthor) {
        return;
    }

    try {
        // ========================================================
        // DATA
        // ========================================================

        const today = getTodayString();

        // ========================================================
        // API
        // ========================================================

        const response = await fetch(
            `${QUOTES_API_URL}?date=${today}`
        );

        if (!response.ok) {
            throw new Error(
                "Nie udało się pobrać cytatu."
            );
        }

        const data = await response.json();

        if (!data.success) {
            throw new Error(
                "Nieprawidłowa odpowiedź API."
            );
        }

        // ========================================================
        // BRAK CYTATU
        // ========================================================

        const quote = data.quote;

        if (!quote) {
            quoteEn.textContent =
                "Brak cytatu na dzisiaj.";

            quotePl.textContent = "";
            quoteAuthor.textContent = "";

            if (translationToggle) {
                translationToggle.hidden = true;
            }

            return;
        }

        // ========================================================
        // WYŚWIETLENIE CYTATU
        // ========================================================

        quoteEn.textContent = quote.quote_en;
        quotePl.textContent = quote.quote_pl;
        quoteAuthor.textContent = quote.author;

        // ========================================================
        // TŁUMACZENIE
        // ========================================================

        if (translationToggle) {
            translationToggle.hidden = !quote.quote_pl;

            translationToggle.addEventListener(
                "click",
                () => {
                    const isHidden = quotePl.hidden;

                    quotePl.hidden = !isHidden;

                    translationToggle.textContent =
                        isHidden
                            ? "🇵🇱 Ukryj tłumaczenie"
                            : "🇵🇱 Pokaż tłumaczenie";

                    translationToggle.setAttribute(
                        "aria-expanded",
                        String(isHidden)
                    );
                }
            );
        }

    } catch (error) {
        console.error(
            "Cytat dnia:",
            error
        );

        quoteEn.textContent =
            "Nie udało się załadować cytatu.";
    }
}


function getTodayString() {
    const now = new Date();

    const year = now.getFullYear();
    const month = String(
        now.getMonth() + 1
    ).padStart(2, "0");

    const day = String(
        now.getDate()
    ).padStart(2, "0");

    return `${year}-${month}-${day}`;
}