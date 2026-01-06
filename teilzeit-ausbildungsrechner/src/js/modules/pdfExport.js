import { getTranslation, applyTranslations } from "./language";

export function setupPdfExport() {
  const btn = document.querySelector(".pdf-btn");
  if (!btn) return;

  btn.addEventListener("click", async () => {
    const detailsWrapper = document.getElementById("details-wrapper");
    const chartCanvas = document.getElementById("results-chart");

    // 1. Aktuelle Sprache ermitteln
    const currentLangAttribute = document.documentElement.lang || "de";

    // Prüfen: Ist es Deutsch (de, de_easy)?
    const isGerman = currentLangAttribute.startsWith("de");

    // Originalsprache speichern für den Reset später
    // (Falls session storage leer ist, fallback auf HTML Attribut oder 'en')
    const originalLang =
      sessionStorage.getItem("tzr-language") || currentLangAttribute;

    /* ---------------------------------------------------------
           2. GHOST SWITCH: Temporärer Sprachwechsel
           Wenn NICHT Deutsch (z.B. UA, TR), wechseln wir kurz auf Englisch.
           Dadurch lädt die App die englischen Texte und füllt alle Zahlen neu.
        --------------------------------------------------------- */
    if (!isGerman) {
      await applyTranslations("en");

      // Kurze Pause (50ms), damit der Browser das DOM aktualisieren kann
      await new Promise((resolve) => setTimeout(resolve, 50));
    }

    /* ---------------------------------------------------------
           3. PDF GENERIERUNG
           Der Browser zeigt jetzt entweder Deutsch oder Englisch an.
           Wir lesen einfach ab, was da steht.
        --------------------------------------------------------- */

    // eslint-disable-next-line new-cap
    const pdf = new window.jspdf.jsPDF("p", "mm", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();
    let y = 20;

    // Helper für einfache Übersetzungen (liest direkt aus dem Speicher)
    function t(key, fallback = "") {
      return getTranslation(key) || fallback;
    }

    // Helper für Template-Strings (z.B. "Dauer: {duration}")
    function tp(key, template, params = {}) {
      let v = getTranslation(key);
      if (!v) v = template;
      for (const [k, val] of Object.entries(params)) {
        v = v.replaceAll(`{${k}}`, String(val));
      }
      return v;
    }

    // --- HEADER ---
    pdf.setFontSize(22);
    pdf.setFont("helvetica", "bold");
    pdf.text(t("pdf_title", "Ausbildungsrechner"), pageWidth / 2, y, {
      align: "center",
    });
    y += 8;

    pdf.setLineWidth(0.5);
    pdf.line(15, y, pageWidth - 15, y);
    y += 10;

    // Werte holen (jetzt garantiert in DE oder EN formatiert)
    const duration =
      document.getElementById("final-duration-result")?.textContent ?? "--";
    const shortening =
      document.getElementById("shortening-card-value")?.textContent ?? "--";
    const remaining =
      document.getElementById("new-full-time-card-value")?.textContent ?? "--";
    const extension =
      document.getElementById("extension-card-value")?.textContent ?? "--";

    // --- ZUSAMMENFASSUNG ---
    pdf.setFontSize(16);
    pdf.setFont("helvetica", "bold");
    pdf.text(t("pdf_summary_heading", "Zusammenfassung"), 15, y);
    y += 10;

    pdf.setFontSize(12);
    pdf.setFont("helvetica", "normal");

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

    // --- DETAILS ---
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

      // Titel & Nummer holen (textContent ist jetzt sauber, da Sprache gewechselt wurde)
      const titleText =
        card.querySelector(".result-card-title")?.textContent.trim() || "";
      const numberText =
        card.querySelector(".result-card-number")?.textContent.trim() || "";

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

    // --- CHART ---
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

    // --- FOOTER ---
    pdf.setFontSize(10);
    pdf.text(t("pdf_footer_note", "Hinweis..."), pageWidth / 2, 290, {
      align: "center",
    });

    // --- AUSGABE ---
    const pdfBlob = pdf.output("blob");
    const pdfUrl = URL.createObjectURL(pdfBlob);
    window.open(pdfUrl, "_blank");

    /* ---------------------------------------------------------
           4. RESET: Zurück zur Originalsprache
        --------------------------------------------------------- */
    if (!isGerman && originalLang) {
      await applyTranslations(originalLang);
    }

    setTimeout(() => URL.revokeObjectURL(pdfUrl), 10000);
  });
}
