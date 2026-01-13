// Importiere die getrennten Module
import * as View from "./calculatorView.js";
import * as Validation from "./input-validation.js";
import { scrollToCalculator } from "./navigation.js";
import * as Service from "./calculatorService.js";
import { setupDetailsToggle } from "./calculatorView.js";

let currentStep = 1;

/**
 * Steuert den Ablauf der Berechnung: Daten holen -> Rechnen -> Anzeigen
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
 * Haupt-Initialisierung: Setzt Event-Listener, Validierung und UI-Logik auf.
 */
export function initializeCalculator() {
  // --- UI-Logik: Radio-Buttons mit Dropdowns verknüpfen ---
  View.linkRadiosToSelect("age-radio", "age-select");
  View.linkRadiosToSelect("school-finish-radio", "school-finish");
  View.linkRadiosToSelect("experience-radio", "experience-select");
  View.linkRadiosToSelect("apprenticeship-radio", "apprenticeship-select");
  View.linkRadiosToSelect("study-radio", "study-select");
  // Falls "child-care" im HTML existiert (im vorherigen Code war es family-care, hier ist beides sicherheitshalber):
  View.linkRadiosToSelect("child-care-radio", "child-care-select");
  View.linkRadiosToSelect("family-care-radio", "family-care-select");

  // --- Navigation & Flow-Steuerung ---
  const nextBtn1 = document.getElementById("next-btn-1");
  const backBtn2 = document.getElementById("back-btn-2");
  const nextBtn2 = document.getElementById("next-btn-2");
  const backBtn3 = document.getElementById("back-btn-3");

  // Schritt 1 -> Schritt 2 (Mit Validierung)
  if (nextBtn1) {
    nextBtn1.addEventListener("click", () => {
      const isVollzeitValid = Validation.validateVollzeitstunden(true);
      const isWochenstundenValid = Validation.validateWochenstunden(true);
      const isVollzeitMonateValid = Validation.validateVollzeitMonate(true);

      if (isVollzeitValid && isWochenstundenValid && isVollzeitMonateValid) {
        currentStep = 2;
        View.showStep(currentStep);
        scrollToCalculator();
      }
    });
  }

  // Zurück zu Schritt 1
  if (backBtn2) {
    backBtn2.addEventListener("click", () => {
      currentStep = 1;
      View.showStep(currentStep);
      scrollToCalculator();
    });
  }

  // Schritt 2 -> Schritt 3 (Berechnung auslösen)
  if (nextBtn2) {
    nextBtn2.addEventListener("click", () => {
      handleCalculation();
      currentStep = 3;
      View.showStep(currentStep);
      scrollToCalculator();
    });
  }

  // Zurück zu Schritt 2
  if (backBtn3) {
    backBtn3.addEventListener("click", () => {
      currentStep = 2;
      View.showStep(currentStep);
      scrollToCalculator();
    });
  }

  // --- Reset Button Integration ---
  setupResetButton();

  // --- Initialen UI-Zustand setzen ---
  View.showStep(currentStep);
  View.setupPartTimeSwitch();

  // --- Live-Validierung (Blur & Enter Events) ---
  setupLiveValidation(); // (Code ausgelagert in Helper unten für Lesbarkeit)

  // Global: Toggle-Logik für Details aktivieren
  setupDetailsToggle();
}

/**
 * Hilfsfunktion: Setzt die Live-Validierung auf
 */
function setupLiveValidation() {
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
    vollzeitInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        vollzeitInput.blur();
      }
    });
  }

  if (wochenstundenInput) {
    const validateWochenstunden = () => {
      Validation.validateWochenstunden(true);
    };
    wochenstundenInput.addEventListener("blur", validateWochenstunden);
    wochenstundenInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        wochenstundenInput.blur();
      }
    });
  }

  if (vollzeitMonateInput) {
    const validateMonate = () => {
      Validation.validateVollzeitMonate(true);
    };
    vollzeitMonateInput.addEventListener("blur", validateMonate);
    vollzeitMonateInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
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

/**
 * Logik für den Reset-Button (Soft-Reset ohne Page Reload)
 */
function setupResetButton() {
  const resetBtn = document.getElementById("reset-btn");

  if (resetBtn) {
    resetBtn.onclick = null; // Entfernt inline onclicks, falls vorhanden

    resetBtn.addEventListener("click", (e) => {
      e.preventDefault();

      // 1. Hole das versteckte Element mit dem Text
      const msgElement = document.getElementById("reset-confirm-msg");

      // 2. Fallback, falls Element fehlt: Deutscher Standardtext
      let message =
        "Möchten Sie den Rechner wirklich zurücksetzen? Alle Ihre Eingaben gehen verloren.";

      // 3. Wenn Element da ist, nimm den Textinhalt und SÄUBERE ihn
      if (msgElement && msgElement.textContent.trim() !== "") {
        // .replace(/\s+/g, ' ') -> Ersetzt alle Zeilenumbrüche und Tabulatoren durch ein einzelnes Leerzeichen
        // .trim() -> Entfernt Leerzeichen ganz am Anfang und Ende
        message = msgElement.textContent.replace(/\s+/g, " ").trim();
      }

      // 4. Browser-Dialog anzeigen
      const confirmReset = confirm(message);

      if (confirmReset) {
        resetCalculator();
      }
    });
  }
}

/**
 * Führt den eigentlichen Reset durch
 */
function resetCalculator() {
  // 1. State zurücksetzen
  currentStep = 1;

  // 2. Text-Inputs leeren
  const inputsToClear = ["vollzeitstunden", "wochenstunden", "vollzeit-monate"];
  inputsToClear.forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });

  // 3. Selects auf Standard setzen
  const dauerSelect = document.getElementById("ausbildungsdauer");
  if (dauerSelect) dauerSelect.value = "36"; // Standardwert

  // 4. Radio Groups auf erste Option (Index 0) zurücksetzen
  // Diese Liste muss mit den 'name'-Attributen im HTML übereinstimmen
  const radioGroups = [
    "part-time-start-radio",
    "family-care-radio",
    "age-radio",
    "school-finish-radio",
    "apprenticeship-radio",
    "experience-radio",
    "study-radio",
  ];

  radioGroups.forEach((name) => {
    const radios = document.getElementsByName(name);
    if (radios.length > 0) {
      radios[0].checked = true;
      // Event triggern, damit versteckte Inputs/Selects aktualisiert werden (via View.linkRadiosToSelect)
      radios[0].dispatchEvent(new Event("change"));
    }
  });

  // 5. Validierungs-Meldungen ausblenden
  const warnings = document.querySelectorAll(".validation-popup");
  warnings.forEach((el) => (el.style.display = "none"));

  const vollzeitMonateContainer = document.getElementById(
    "vollzeit-monate-input",
  );
  const separator = document.getElementById("vollzeit-monate-separator");
  if (vollzeitMonateContainer) vollzeitMonateContainer.classList.add("hidden");
  if (separator) separator.classList.add("hidden");

  // 7. View aktualisieren (Zeige Schritt 1, setze Progress Bar zurück)
  View.showStep(1);

  // 8. Nach oben scrollen
  window.scrollTo({ top: 0, behavior: "smooth" });
}
