import { initializeCalculator } from "./modules/calculatorController.js";
import { setupPdfExport } from "./modules/pdfExport.js";
import { initializeLanguageSwitcher } from "./modules/language.js";

// Hauptfunktion, die die App startet
async function main() {
  setTimeout(() => {
    // Rechner initialisieren
    initializeCalculator();

    // PDF-Export initialisieren
    setupPdfExport();

    // Spracheswechsler initialisieren
    initializeLanguageSwitcher();
  }, 0);
}

main();
