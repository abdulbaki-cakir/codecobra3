import { initializeCalculator } from "./modules/calculatorController.js";

import {
  initializeNavigation,
  initializeFooterNavigation,
} from "./modules/navigation.js";
import { initializeLanguageSwitcher } from "./modules/language";

// Hauptfunktion, die die App startet
async function main() {
  setTimeout(() => {
    initializeCalculator();

    // Rufe alle Navigations-Funktionen auf
    initializeNavigation();
    initializeFooterNavigation();
    initializeLanguageSwitcher();
  }, 0);
}

main();
