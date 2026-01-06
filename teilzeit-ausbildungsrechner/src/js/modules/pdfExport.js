import { getTranslation } from "./language";

export function setupPdfExport() {
  const btn = document.querySelector(".pdf-btn");
  if (!btn) return;

  btn.addEventListener("click", async () => {
    const detailsWrapper = document.getElementById("details-wrapper");
    const chartCanvas = document.getElementById("results-chart");

    // jsPDF aus CDN holen
    // eslint-disable-next-line new-cap
    const pdf = new window.jspdf.jsPDF("p", "mm", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();
    let y = 20;

    /* ---------------------------------------------------------
                 1) HEADER – OFFIZIELLER LOOK
              --------------------------------------------------------- */
    pdf.setFontSize(22);
    pdf.setFont("helvetica", "bold");
    pdf.text(
      t("pdf_title", "Ausbildungsrechner – Analysebericht"),
      pageWidth / 2,
      y,
      { align: "center" }
    );
    y += 8;

    pdf.setLineWidth(0.5);
    pdf.line(15, y, pageWidth - 15, y);
    y += 10;

    const duration =
      document.getElementById("final-duration-result")?.textContent ?? "--";
    const shortening =
      document.getElementById("shortening-card-value")?.textContent ?? "--";
    const remaining =
      document.getElementById("new-full-time-card-value")?.textContent ?? "--";
    const extension =
      document.getElementById("extension-card-value")?.textContent ?? "--";

    // Reihenfolge: Zusammenfassung, Detaillierte Erklärung, Balkendiagramm

    pdf.setFontSize(16);
    pdf.setFont("helvetica", "bold");
    pdf.text(t("pdf_summary_heading", "Zusammenfassung"), 15, y);

    y += 10;

    pdf.setFontSize(12);
    pdf.setFont("helvetica", "normal");
    pdf.text(
      tp("pdf_summary_total", `Gesamtausbildungsdauer: ${duration}`, { duration }),
      15,
      y
    );
    y += 6;

    pdf.text(
      tp("pdf_summary_shortening", `Gesamte Verkürzung: ${shortening} Monate`, { shortening }),
      15,
      y
    );
    y += 6;

    pdf.text(
      tp("pdf_summary_remaining", `Restdauer nach Verkürzung: ${remaining} Monate`, { remaining }),
      15,
      y
    );
    y += 6;

    pdf.text(
      tp("pdf_summary_extension", `Verlängerung durch Teilzeit: ${extension} Monate`, { extension }),
      15,
      y
    );
    y += 10;

    pdf.line(15, y, pageWidth - 15, y); // Trennlinie
    y += 10;

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(16);
    pdf.text(t("pdf_details_heading", "Detaillierte Erklärung"), 15, y);
    y += 10;

    const detailCards = detailsWrapper.querySelectorAll(".result-card");

    detailCards.forEach((card) => {
      if (y > 260) {
        pdf.addPage();
        y = 20;
      }

      const titleText =
        card.querySelector(".result-card-title")?.textContent ?? "";
      const numberText =
        card.querySelector(".result-card-number")?.textContent ?? "";
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

    if (chartCanvas) {
      pdf.addPage();
      y = 20;

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(16);
      pdf.text(t("pdf_chart_heading", "Grafische Übersicht"), 15, y);

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

    /* ---------------------------------------------------------
                 5) FOOTER
              --------------------------------------------------------- */
    pdf.setFontSize(10);
    pdf.text(
      t(
        "pdf_footer_note",
        "Hinweis: Diese Berechnung dient der Orientierung und stellt keine Rechtsberatung dar."
      ),
      pageWidth / 2,
      290,
      { align: "center" }
    );


    // 5a) PDF als Blob generieren
    const pdfBlob = pdf.output("blob");

    // 5b) Temporäre URL für den Blob erzeugen
    const pdfUrl = URL.createObjectURL(pdfBlob);

    // 5c) URL in einem neuen Tab öffnen
    window.open(pdfUrl, "_blank");

    // Optional: Die temporäre URL nach einer kurzen Verzögerung freigeben
    // (Der Browser kümmert sich meist selbst darum, aber es ist guter Stil)
    setTimeout(() => URL.revokeObjectURL(pdfUrl), 10000);
  });
}
function t(key, fallback = "") {
  const v = getTranslation(key);
  return v && v.trim() ? v : fallback;
}
function tp(key, template, params = {}) {
  let v = getTranslation(key);
  if (!v || !v.trim()) {
    v = template;
  }
  for (const [k, val] of Object.entries(params)) {
    v = v.replaceAll(`{${k}}`, String(val));
  }
  return v;
}
