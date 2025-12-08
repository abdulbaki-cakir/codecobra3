import { initializeCalculator } from "./modules/calculatorController.js";
import { setupPdfExport } from "./modules/pdfExport.js";
import {
  initializeNavigation,
  initializeFooterNavigation,
} from "./modules/navigation.js";
import { initializeLanguageSwitcher } from "./modules/language.js";

// Hauptfunktion, die die App startet
async function main() {
  setTimeout(() => {
    // Rechner initialisieren
    initializeCalculator();

    // PDF-Export initialisieren
    setupPdfExport();

    // Navigation & Sprache
    initializeNavigation();
    initializeFooterNavigation();
    initializeLanguageSwitcher();
  }, 0);
}

main();
