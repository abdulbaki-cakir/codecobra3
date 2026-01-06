import { getTranslation, applyTranslations } from "./language";

export function setupPdfExport() {
  const btn = document.querySelector(".pdf-btn");
  if (!btn) return;

  btn.addEventListener("click", async () => {
    const detailsWrapper = document.getElementById("details-wrapper");
    const chartCanvas = document.getElementById("results-chart");

    // 1. Aktuelle Sprache merken
    const currentLangAttribute = document.documentElement.lang || "de";
    // Wir schauen: Ist es Deutsch? Falls nein, wollen wir für das PDF Englisch erzwingen.
    const isGerman = currentLangAttribute.startsWith("de");
    const targetLang = isGerman ? currentLangAttribute : "en";

    // Originalsprache speichern, damit wir zurückwechseln können (falls wir wechseln müssen)
    const originalLang = currentLangAttribute.includes("de")
      ? currentLangAttribute
      : sessionStorage.getItem("tzr-language") || "en";

    // 2. TEMPORÄRER SPRACHWECHSEL (Der "Ghost Switch")
    // Wenn wir z.B. auf UA sind, wechseln wir jetzt kurz hart auf EN.
    if (!isGerman) {
      // Wir nutzen deine applyTranslations Funktion aus language.js
      await applyTranslations("en");

      // WICHTIG: Kurze Pause (50ms), damit deine App Zeit hat,
      // auf das 'app:language-changed' Event zu reagieren und die Zahlen/Texte neu zu rendern.
      await new Promise((resolve) => setTimeout(resolve, 50));
    }

    // --- PDF GENERIERUNG START ---
    // Ab hier ist der DOM (die Seite) entweder Deutsch oder Englisch.
    // Wir können jetzt einfach alles "abschreiben" (textContent), wie in der deutschen Version.

    // eslint-disable-next-line new-cap
    const pdf = new window.jspdf.jsPDF("p", "mm", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();
    let y = 20;

    // Helper: Liest Text direkt aus der (jetzt übersetzten) Datenbank
    function t(key, fallback = "") {
      return getTranslation(key) || fallback;
    }

    // Helper: Ersetzt Platzhalter (nutzt auch die Datenbank)
    function tp(key, template, params = {}) {
      let v = getTranslation(key);
      if (!v) v = template;
      for (const [k, val] of Object.entries(params)) {
        v = v.replaceAll(`{${k}}`, String(val));
      }
      return v;
    }

    // --- 1) HEADER ---
    pdf.setFontSize(22);
    pdf.setFont("helvetica", "bold");
    pdf.text(t("pdf_title", "Ausbildungsrechner"), pageWidth / 2, y, {
      align: "center",
    });
    y += 8;

    pdf.setLineWidth(0.5);
    pdf.line(15, y, pageWidth - 15, y);
    y += 10;

    // Werte aus dem DOM holen (Diese sind jetzt entweder DE oder EN aktualisiert)
    const duration =
      document.getElementById("final-duration-result")?.textContent ?? "--";
    const shortening =
      document.getElementById("shortening-card-value")?.textContent ?? "--";
    const remaining =
      document.getElementById("new-full-time-card-value")?.textContent ?? "--";
    const extension =
      document.getElementById("extension-card-value")?.textContent ?? "--";

    // --- 2) ZUSAMMENFASSUNG ---
    pdf.setFontSize(16);
    pdf.setFont("helvetica", "bold");
    pdf.text(t("pdf_summary_heading", "Zusammenfassung"), 15, y);
    y += 10;

    pdf.setFontSize(12);
    pdf.setFont("helvetica", "normal");

    // Da wir die Sprache gewechselt haben, gibt tp() jetzt den englischen Satz zurück!
    pdf.text(
      tp("pdf_summary_total", "Gesamt: {duration}", { duration }),
      15,
      y,
    );
    y += 6;
    pdf.text(
      tp("pdf_summary_shortening", "Verkürzung: {shortening}", { shortening }),
      15,
      y,
    );
    y += 6;
    pdf.text(
      tp("pdf_summary_remaining", "Restdauer: {remaining}", { remaining }),
      15,
      y,
    );
    y += 6;
    pdf.text(
      tp("pdf_summary_extension", "Verlängerung: {extension}", { extension }),
      15,
      y,
    );
    y += 10;

    pdf.line(15, y, pageWidth - 15, y);
    y += 10;

    // --- 3) DETAILLIERTE ERKLÄRUNG ---
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(16);
    pdf.text(t("pdf_details_heading", "Details"), 15, y);
    y += 10;

    const detailCards = detailsWrapper.querySelectorAll(".result-card");

    detailCards.forEach((card) => {
      if (y > 260) {
        pdf.addPage();
        y = 20;
      }

      // Titel & Nummer holen
      // Da die App jetzt auf Englisch steht, ist textContent bereits Englisch!
      // Wir müssen keine komplizierte Logik mehr anwenden.
      const titleText =
        card.querySelector(".result-card-title")?.textContent.trim() || "";
      const numberText =
        card.querySelector(".result-card-number")?.textContent.trim() || "";

      // Das hier ist der Schlüssel für die Details:
      // Wir holen uns einfach alle Paragraphen. Da die App auf Englisch steht,
      // beinhalten diese Paragraphen den vollen englischen Text ("You plan to work full-time...").
      const paragraphs = [...card.querySelectorAll("p")].map((p) =>
        p.textContent.trim(),
      );

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(13);
      pdf.text(`• ${titleText}: ${numberText}`, 15, y);
      y += 6;

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(11);

      paragraphs.forEach((text) => {
        if (!text) return;
        const lines = pdf.splitTextToSize(text, pageWidth - 30);

        if (y + lines.length * 6 > 280) {
          pdf.addPage();
          y = 20;
        }

        pdf.text(lines, 20, y);
        y += lines.length * 6 + 2;
      });

      y += 6;
    });

    // --- 4) CHART ---
    if (chartCanvas) {
      pdf.addPage();
      y = 20;
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(16);
      pdf.text(t("pdf_chart_heading", "Chart"), 15, y);
      y += 10;

      const chartIMG = chartCanvas.toDataURL("image/png", 1.0);
      const imgWidth = 170;
      const imgHeight = (chartCanvas.height / chartCanvas.width) * imgWidth;
      pdf.addImage(
        chartIMG,
        "PNG",
        (pageWidth - imgWidth) / 2,
        y,
        imgWidth,
        imgHeight,
      );
      y += imgHeight + 12;
    }

    // --- 5) FOOTER ---
    pdf.setFontSize(10);
    pdf.text(t("pdf_footer_note", "Hinweis..."), pageWidth / 2, 290, {
      align: "center",
    });

    // --- 6) FERTIGSTELLEN & ZURÜCKSETZEN ---
    const pdfBlob = pdf.output("blob");
    const pdfUrl = URL.createObjectURL(pdfBlob);
    window.open(pdfUrl, "_blank");

    // GANZ WICHTIG: Wenn wir die Sprache geändert haben, stellen wir sie sofort wieder her!
    if (!isGerman && originalLang) {
      await applyTranslations(originalLang);
    }

    setTimeout(() => URL.revokeObjectURL(pdfUrl), 10000);
  });
}
