// Importiere die getrennten Module
import * as View from "./calculatorView.js";
import * as Validation from "./input-validation.js";
import { initializeTooltips } from "./tooltips.js";
// NEUER IMPORT der Scroll-Funktion
import { scrollToCalculator } from "./navigation.js";

let currentStep = 1;

/**
 * INITIALISIERUNG:
 * Startet die gesamte Logik für den Rechner.
 */
export function initializeCalculator() {
  // --- 1. Button-Listener (Navigation & Aktionen) ---
  const nextBtn1 = document.getElementById("next-btn-1");
  const backBtn2 = document.getElementById("back-btn-2");
  const nextBtn2 = document.getElementById("next-btn-2");
  const backBtn3 = document.getElementById("back-btn-3");

  if (nextBtn1) {
    nextBtn1.addEventListener("click", () => {
      // Validierung
      const isVollzeitValid = Validation.validateVollzeitstunden(true);
      const isWochenstundenValid = Validation.validateWochenstunden(true);
      const isVollzeitMonateValid = Validation.validateVollzeitMonate(true);

      // Nur bei Erfolg weitergehen UND scrollen
      if (isVollzeitValid && isWochenstundenValid && isVollzeitMonateValid) {
        currentStep = 2;
        View.showStep(currentStep);
        scrollToCalculator();
      }
    });
  }

  if (backBtn2) {
    backBtn2.addEventListener("click", () => {
      currentStep = 1;
      View.showStep(currentStep);
      scrollToCalculator(); // Zurück-Buttons scrollen immer
    });
  }

  if (nextBtn2) {
    nextBtn2.addEventListener("click", () => {
      // HINWEIS: Hier muss noch deine Step 2 Validierung hin
      const isStep2Valid = true; // Platzhalter

      if (isStep2Valid) {
        currentStep = 3;
        View.showStep(currentStep);
        scrollToCalculator();
      }
    });
  }

  if (backBtn3) {
    backBtn3.addEventListener("click", () => {
      currentStep = 2;
      View.showStep(currentStep);
      scrollToCalculator(); // Zurück-Buttons scrollen immer
    });
  }

  // --- 2. Initialen Zustand setzen ---
  View.showStep(currentStep);
  View.setupPartTimeSwitch();
  initializeTooltips();

  // --- 3. VALIDIERUNGS-LISTENER (Unverändert) ---
  const vollzeitInput = document.getElementById("vollzeitstunden");
  const wochenstundenInput = document.getElementById("wochenstunden");
  const vollzeitMonateInput = document.getElementById("vollzeit-monate");
  const dauerSelect = document.getElementById("ausbildungsdauer");

  if (vollzeitInput) {
    const validateVollzeit = () => {
      Validation.validateVollzeitstunden(true);
      if (wochenstundenInput.value.trim() !== "") {
        Validation.validateWochenstunden(false);
      }
    };
    vollzeitInput.addEventListener("blur", validateVollzeit);
    vollzeitInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        vollzeitInput.blur();
      }
    });
  }

  if (wochenstundenInput) {
    const validateWochenstunden = () => {
      Validation.validateWochenstunden(true);
    };
    wochenstundenInput.addEventListener("blur", validateWochenstunden);
    wochenstundenInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        wochenstundenInput.blur();
      }
    });
  }

  if (vollzeitMonateInput) {
    const validateMonate = () => {
      Validation.validateVollzeitMonate(true);
    };
    vollzeitMonateInput.addEventListener("blur", validateMonate);
    vollzeitMonateInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        vollzeitMonateInput.blur();
      }
    });
  }

  if (dauerSelect) {
    dauerSelect.addEventListener("change", () => {
      Validation.validateVollzeitMonate(false);
    });
  }

  const partTimeRadios = document.querySelectorAll(
    'input[name="part-time-start-radio"]',
  );
  partTimeRadios.forEach((radio) => {
    radio.addEventListener("change", () => {
      Validation.validateVollzeitMonate(false);
    });
  });
}
