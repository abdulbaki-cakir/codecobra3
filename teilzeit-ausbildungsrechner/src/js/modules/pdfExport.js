export function setupPdfExport() {
    const btn = document.querySelector(".pdf-btn");
    if (!btn) return;
  
    btn.addEventListener("click", async () => {
      const target = document.querySelector(".results-container");
      const detailsWrapper = document.getElementById("details-wrapper");
      const detailsBtn = document.getElementById("toggle-details-btn");
  
      if (!target) {
        alert("Ergebnisbereich nicht gefunden");
        return;
      }
  
      // Zustand merken (Details ein-/ausgeklappt)
      const wasHidden = detailsWrapper?.classList.contains("hidden");
  
      // Für PDF alles ausklappen
      if (wasHidden) {
        detailsWrapper.classList.remove("hidden");
        if (detailsBtn) {
          detailsBtn.textContent = "Detaillierte Erklärung einklappen ▲";
        }
      }
  
      // DOM kurz „setzen lassen“
      await new Promise((resolve) => setTimeout(resolve, 200));
  
      // Screenshot des Ergebnisbereichs
      const canvas = await window.html2canvas(target, { scale: 2 });
      const imgData = canvas.toDataURL("image/png");
  
      // jsPDF aus UMD-Namespace holen
      // eslint-disable-next-line new-cap
      const pdf = new window.jspdf.jsPDF("p", "mm", "a4");
  
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
  
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
  
      let heightLeft = imgHeight;
      let position = 0;
  
      // Erste Seite
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
  
      // Weitere Seiten, falls nötig
      while (heightLeft > 0) {
        pdf.addPage();
        position = heightLeft - imgHeight;
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
  
      pdf.save("Ausbildungsrechner.pdf");
  
      // Ursprünglichen Zustand wiederherstellen
      if (wasHidden) {
        detailsWrapper.classList.add("hidden");
        if (detailsBtn) {
          detailsBtn.textContent = "Detaillierte Erklärung anzeigen ▼";
        }
      }
    });
  }
  