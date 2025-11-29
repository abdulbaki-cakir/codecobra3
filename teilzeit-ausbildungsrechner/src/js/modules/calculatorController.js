// Importiere die getrennten Module
import * as View from "./calculatorView.js";
import * as Validation from "./input-validation.js";
import { scrollToCalculator } from "./navigation.js";
import * as Service from "./calculatorService.js";

let currentStep = 1;

/**
 * Haupt-Event-Handler für die Berechnung (auf "Weiter" in Schritt 2).
 */
function handleCalculation() {
  // 1. Alle Inputs holen
  const inputs = View.getFormInputs();

  // 2. Die KOMPLETTE Berechnung durchführen (Verkürzung + Teilzeit + Mindestdauer)
  const finalResults = Service.calculateFinalResults(inputs);

  // 3. Das Ergebnis an die View übergeben zum Anzeigen
  View.renderResults(finalResults);
}

/**
 * INITIALISIERUNG:
 * Startet die gesamte Logik für den Rechner.
 */
export function initializeCalculator() {
  // --- 1. Radio-Buttons mit Selects verknüpfen ---
  View.linkRadiosToSelect("age-radio", "age-select");
  View.linkRadiosToSelect("school-finish-radio", "school-finish");
  View.linkRadiosToSelect("experience-radio", "experience-select");
  View.linkRadiosToSelect("apprenticeship-radio", "apprenticeship-select");
  View.linkRadiosToSelect("study-radio", "study-select");
  View.linkRadiosToSelect("child-care-radio", "child-care-select");
  View.linkRadiosToSelect("family-care-radio", "family-care-select");

  // --- 2. Button-Listener (Navigation & Aktionen) ---
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
      scrollToCalculator();
    });
  }

  if (nextBtn2) {
    nextBtn2.addEventListener("click", () => {
      // HIER WAR DER FEHLER: Wir rufen jetzt die korrigierte Funktion auf
      handleCalculation();

      currentStep = 3;
      View.showStep(currentStep);
      scrollToCalculator();
    });
  }

  if (backBtn3) {
    backBtn3.addEventListener("click", () => {
      currentStep = 2;
      View.showStep(currentStep);
      scrollToCalculator();
    });
  }

  // --- 3. Initialen Zustand setzen ---
  View.showStep(currentStep);
  View.setupPartTimeSwitch();

  // --- 4. VALIDIERUNGS-LISTENER ---
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
