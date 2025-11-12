// --- NEUER IMPORT ---
import { resetVollzeitMonateValidation } from "./input-validation.js";

/**
 * Liest alle Eingabewerte aus dem Formular aus.
 * @returns {object} - Ein Objekt mit allen Rohwerten.
 */
export function getFormInputs() {
  // ... (Diese Funktion bleibt unverändert) ...
  const selections = {};
  const reasonIds = [
    "age-select",
    "school-finish",
    "experience-select",
    "apprenticeship-select",
    "study-select",
    "child-care-select",
    "family-care-select",
  ];
  reasonIds.forEach((id) => {
    const el = document.getElementById(id);
    if (el) selections[id] = el.value;
  });
}
/**
 * Verknüpft Radio-Buttons mit einem versteckten Select-Feld.
 */
export const linkRadiosToSelect = (radioGroupName, selectElementId) => {
  // ... (Diese Funktion bleibt unverändert) ...
  const radios = document.querySelectorAll(`input[name="${radioGroupName}"]`);
  const hiddenSelect = document.getElementById(selectElementId);
  if (radios.length > 0 && hiddenSelect) {
    radios.forEach((radio) => {
      radio.addEventListener("change", function () {
        hiddenSelect.value = this.value;
      });
    });
  }
};

/**
 * Zeigt den gewünschten Schritt an und blendet andere aus.
 * @param {number} stepNumber - Der Schritt, der angezeigt werden soll (1, 2, oder 3)
 */
export function showStep(stepNumber) {
  // ... (Diese Funktion bleibt unverändert) ...
  const allStepForms = [
    document.getElementById("step-1"),
    document.getElementById("step-2"),
    document.getElementById("step-3"),
  ];

  allStepForms.forEach((form, index) => {
    if (form) {
      form.classList.toggle("hidden", index + 1 !== stepNumber);
    }
  });
  updateProgress(stepNumber);
}

/**
 * Richtet das Ein-/Ausblenden des "Monate in Vollzeit"-Feldes ein.
 * (Aktualisiert, um resetVollzeitMonateValidation aufzurufen)
 */
export const setupPartTimeSwitch = () => {
  const radios = document.querySelectorAll(
    'input[name="part-time-start-radio"]',
  );
  const inputField = document.getElementById("vollzeit-monate-input");
  const vollzeitMonateInput = document.getElementById("vollzeit-monate");
  const separator = document.getElementById("vollzeit-monate-separator");

  const updateVisibility = (selectedValue) => {
    const isSwitchLater = selectedValue === "1";
    if (inputField && separator) {
      if (isSwitchLater) {
        inputField.classList.remove("hidden");
        separator.classList.remove("hidden");
        if (vollzeitMonateInput && vollzeitMonateInput.value === "0") {
          vollzeitMonateInput.value = "";
        }
      } else {
        inputField.classList.add("hidden");
        separator.classList.add("hidden");
        if (vollzeitMonateInput) {
          vollzeitMonateInput.value = "0";
        }

        // --- GEÄNDERT: Ruft die importierte Reset-Funktion auf ---
        resetVollzeitMonateValidation();
        // --- ENDE ÄNDERUNG ---
      }
    }
  };

  radios.forEach((radio) => {
    radio.addEventListener("change", function () {
      updateVisibility(this.value);
    });
  });

  const initialCheckedRadio = document.querySelector(
    'input[name="part-time-start-radio"]:checked',
  );
  if (initialCheckedRadio) {
    updateVisibility(initialCheckedRadio.value);
  }
};

/**
 * Aktualisiert die Fortschrittsanzeige (Punkte und Linie).
 */
function updateProgress(currentStep) {
  // ... (Diese Funktion bleibt unverändert) ...
  const progressLine = document.getElementById("progress-line");
  const progressSteps = document.querySelectorAll(".progress-container .step");

  progressSteps.forEach((step) => {
    const stepNum = parseInt(step.dataset.step);
    step.classList.toggle("active", stepNum <= currentStep);
  });

  let progressPercentage = 0;
  if (currentStep === 1) {
    progressPercentage = 20;
  } else if (currentStep === 2) {
    progressPercentage = 50;
  } else {
    progressPercentage = 100;
  }

  if (progressLine) {
    progressLine.style.width = progressPercentage + "%";
  }
}
