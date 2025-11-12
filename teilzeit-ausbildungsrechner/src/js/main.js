import { initializeCalculator } from "./modules/calculatorController.js";

// KORRIGIERT: Importiere alle Navigations-Funktionen vom neuen Pfad
import {
  initializeNavigation,
  initializeFooterNavigation,
} from "./modules/navigation.js"; // Pfad & Tippfehler ('from' statt 'in') korrigiert

// Hauptfunktion, die die App startet
async function main() {
  setTimeout(() => {
    initializeCalculator();

    // Rufe alle Navigations-Funktionen auf
    initializeNavigation();
    initializeFooterNavigation();
  }, 0);
}

main();
