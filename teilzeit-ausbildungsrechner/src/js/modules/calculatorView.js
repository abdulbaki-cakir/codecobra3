import { resetVollzeitMonateValidation } from "./input-validation.js";

export function getFormInputs() {
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

  return {
    originalDuration: parseInt(
      document.getElementById("ausbildungsdauer").value,
      10,
    ),
    fullTimeHours:
      parseInt(document.getElementById("vollzeitstunden").value, 10) || 40,
    partTimeHours:
      parseInt(document.getElementById("wochenstunden").value, 10) || 0,
    initialFullTimeMonths:
      parseInt(document.getElementById("vollzeit-monate").value, 10) || 0,
    selections,
  };
}

export const linkRadiosToSelect = (radioGroupName, selectElementId) => {
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

export function showStep(stepNumber) {
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
        resetVollzeitMonateValidation();
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

function updateProgress(currentStep) {
  const progressLine = document.getElementById("progress-line");
  const progressSteps = document.querySelectorAll(".progress-container .step");

  progressSteps.forEach((step) => {
    const stepNum = parseInt(step.dataset.step);
    step.classList.toggle("active", stepNum <= currentStep);
  });

  let progressPercentage = 0;
  if (currentStep === 1) progressPercentage = 20;
  else if (currentStep === 2) progressPercentage = 50;
  else progressPercentage = 100;

  if (progressLine) {
    progressLine.style.width = progressPercentage + "%";
  }
}

/**
 * Malt die finalen Ergebnisse auf die Seite.
 */
export function renderResults(data) {
  const {
    originalDuration,
    fullTimeHours,
    partTimeHours,
    partTimeHoursAvailable,
    initialFullTimeMonths,
    shorteningResult,
    officialShorteningMonths,
    capWasHitShortening,
    remainingFullTimeEquivalent,
    finalExtensionMonths,
    finalTotalDuration,
    gracePeriod,
  } = data;

  const partTimeCard = document.querySelector(".part-time-card");

  // 1. "Geleistete Zeit"-Karte
  const servedTimeCard = document.querySelector(".served-time-card");
  const servedTimeValue = document.getElementById("served-card-value");
  const servedTimeDetailsDiv = document.getElementById(
    "detailed-served-time-card",
  );
  if (servedTimeCard && servedTimeValue && servedTimeDetailsDiv) {
    let noteElement = servedTimeDetailsDiv.querySelector(".cap-message");
    if (initialFullTimeMonths > 0) {
      servedTimeCard.style.display = "flex";
      servedTimeValue.textContent = initialFullTimeMonths;
      if (!noteElement) {
        noteElement = document.createElement("p");
        noteElement.classList.add("cap-message");
        servedTimeDetailsDiv.appendChild(noteElement);
      }
      noteElement.innerHTML =
        "<i><strong>Hinweis: Dies ist keine Verkürzung, sondern geleistete Zeit.</strong></i>";
      noteElement.style.display = "block";
    } else {
      servedTimeCard.style.display = "none";
      if (noteElement) noteElement.style.display = "none";
    }
  }

  // 2. Verkürzungs-Karte
  document.getElementById("original-duration-header").textContent =
    `${originalDuration} Monate`;
  document.getElementById("shortening-card-value").textContent =
    officialShorteningMonths;
  const detailedShorteningsDiv = document.getElementById(
    "detailed-shortenings-card",
  );
  detailedShorteningsDiv.innerHTML = "";

  // 1. Prüfen: Wurde Schulabschluss schon von der Logik erfasst?
  const hasSchoolEntry = shorteningResult.details.some(
    (d) =>
      d.reason.toLowerCase().includes("schulabschluss") ||
      d.reason.toLowerCase().includes("abitur") ||
      d.reason.toLowerCase().includes("reife") ||
      d.reason.toLowerCase().includes("hauptschule"),
  );

  // 2. Wenn nicht (weil 0 Monate), prüfen wir genau, was angeklickt wurde
  if (!hasSchoolEntry) {
    const selectedRadio = document.querySelector(
      'input[name="school-finish-radio"]:checked',
    );

    if (selectedRadio && selectedRadio.value === "0") {
      // Text des Labels holen
      const labelSpan = selectedRadio
        .closest(".radio-card-option")
        .querySelector(".radio-label");
      const reasonText = labelSpan ? labelSpan.textContent.trim() : "";

      if (reasonText === "Hauptschulabschluss") {
        shorteningResult.details.unshift({
          reason: reasonText,
          months: 0,
          isVariable: false,
        });
      }
    }
  }
  // --- FIX ENDE ---

  if (shorteningResult.details.length > 0) {
    shorteningResult.details.forEach((detail) => {
      const p = document.createElement("p");
      p.classList.add("detailed-shortening-item");

      // Fallunterscheidung: 0 Monate vs. echte Verkürzung
      if (detail.months === 0) {
        p.innerHTML = `${detail.reason}: <strong>0 Monate Verkürzung</strong>`;
        p.style.color = "#555";
      } else {
        // Echte Verkürzung
        const prefix = detail.isVariable ? "bis zu " : "";
        p.innerHTML = `${detail.reason}: <strong>${prefix}${detail.months} Monate Verkürzung</strong>`;
      }

      detailedShorteningsDiv.appendChild(p);
    });
  } else {
    detailedShorteningsDiv.innerHTML =
      '<p class="no-shortening-message">Keine Verkürzungsgründe ausgewählt.</p>';
  }

  if (capWasHitShortening) {
    const capMessage = document.createElement("p");
    capMessage.classList.add("cap-message");
    capMessage.innerHTML =
      "<i><strong>Hinweis: Maximal zulässige Verkürzung erreicht.</strong></i>";
    detailedShorteningsDiv.appendChild(capMessage);
  }

  // 3. Neue Vollzeit-Karte
  const newFullTimeCard = document.querySelector(".new-full-time-card");
  const newFullTimeValue = document.getElementById("new-full-time-card-value");
  if (newFullTimeCard && newFullTimeValue) {
    newFullTimeCard.style.display = "flex";
    newFullTimeValue.textContent = remainingFullTimeEquivalent;
    document.getElementById("detailed-new-full-time-card").innerHTML =
      "<p>Dies ist die verbleibende Restdauer in Vollzeit (nach Anrechnung und Abzug der geleisteten Zeit).</p>";
  }

  // 4. Teilzeit-Verlängerungs-Karte
  if (partTimeHoursAvailable) {
    partTimeCard.style.display = "flex";
    document.getElementById("extension-card-value").textContent =
      finalExtensionMonths;
    const partTimeDetailsDiv = document.getElementById(
      "detailed-part-time-card",
    );

    partTimeDetailsDiv.innerHTML = "";

    if (finalExtensionMonths === 0) {
      partTimeDetailsDiv.innerHTML = `<p class="detailed-part-time-item">Die Reduzierung auf <strong>${partTimeHours}h</strong> führt zu einer geringfügigen Verlängerung von ≤ ${gracePeriod} Monaten, die in der Praxis oft ignoriert wird.</p>`;
    } else {
      partTimeDetailsDiv.innerHTML = `<p class="detailed-part-time-item">Die Reduzierung der wöchentlichen Arbeitszeit von <strong>${fullTimeHours}h</strong> auf <strong>${partTimeHours}h</strong> für die verbleibende Dauer führt zu einer Verlängerung <strong>um ${finalExtensionMonths} Monate</strong>.</p>`;
    }

    document.getElementById("final-duration-result").textContent =
      `${finalTotalDuration} Monate`;
  } else {
    partTimeCard.style.display = "none";
    document.getElementById("final-duration-result").textContent =
      `${finalTotalDuration} Monate`;
  }

  // Aufräumen alter Elemente
  const existingBox = document.getElementById("average-hours-box");
  if (existingBox) existingBox.remove();

  const existingEarlyBox = document.getElementById("early-admission-box");
  if (existingEarlyBox) existingEarlyBox.remove();
}
