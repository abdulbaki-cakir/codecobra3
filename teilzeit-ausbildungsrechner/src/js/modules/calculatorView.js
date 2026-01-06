import { resetVollzeitMonateValidation } from "./input-validation.js";
import { getTranslation, onLanguageChange } from "./language.js";
import infoIcon from "../../assets/icons/information.svg";

// Globaler Chart-State, damit wir das Diagramm beim Neu-Rendern zerstören können
let myResultsChart = null;
let lastRenderedResults = null;

const DEFAULT_PRIMARY_COLOR = "#b93137";
const DEFAULT_PRIMARY_RGB = { r: 185, g: 49, b: 55 };

const getPrimaryColor = () => {
  const value = getComputedStyle(document.documentElement).getPropertyValue(
    "--primary",
  );
  return value ? value.trim() : DEFAULT_PRIMARY_COLOR;
};

const hexToRgb = (hex) => {
  if (!hex) return DEFAULT_PRIMARY_RGB;
  const normalized = hex.replace("#", "");
  const full =
    normalized.length === 3
      ? normalized
          .split("")
          .map((c) => c + c)
          .join("")
      : normalized;

  if (full.length !== 6) return DEFAULT_PRIMARY_RGB;
  const intVal = parseInt(full, 16);
  if (Number.isNaN(intVal)) return DEFAULT_PRIMARY_RGB;

  return {
    r: (intVal >> 16) & 255,
    g: (intVal >> 8) & 255,
    b: intVal & 255,
  };
};

const getPrimaryRgba = (alpha = 1) => {
  const { r, g, b } = hexToRgb(getPrimaryColor());
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const formatTranslation = (key, replacements = {}) => {
  const template = getTranslation(key);
  if (!template) return "";
  return template.replace(/\{(\w+)\}/g, (match, k) =>
    Object.prototype.hasOwnProperty.call(replacements, k)
      ? replacements[k]
      : match,
  );
};

const formatOneDecimal = (value) => {
  const lang = document.documentElement.getAttribute("lang") || "de";
  return new Intl.NumberFormat(lang, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value);
};

/**
 * Sammelt alle Benutzereingaben aus dem DOM für die Berechnung.
 * Rückgabe ist ein sauberes Objekt, das der Service direkt verarbeiten kann.
 */
export function getFormInputs() {
  const selections = {};
  // IDs der Dropdowns/Hidden-Inputs für die Verkürzungsgründe
  const reasonIds = [
    "age-select",
    "school-finish",
    "experience-select",
    "apprenticeship-select",
    "study-select",
    "child-care-select",
    "family-care-select",
  ];

  // Werte auslesen
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
      parseFloat(document.getElementById("vollzeitstunden").value) || 40,
    partTimeHours:
      parseFloat(document.getElementById("wochenstunden").value) || 0,
    initialFullTimeMonths:
      parseInt(document.getElementById("vollzeit-monate").value, 10) || 0,
    selections,
  };
}

/**
 * Helper: Verbindet Custom-Radio-Buttons mit versteckten <select>-Feldern.
 * Dient dazu, die Logik (Values) von der Darstellung (Radios) zu trennen.
 */
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

/**
 * Steuert die Sichtbarkeit der Schritte (Step 1 -> 2 -> 3)
 * und aktualisiert die Progress-Bar oben.
 */
export function showStep(stepNumber) {
  const allStepForms = [
    document.getElementById("step-1"),
    document.getElementById("step-2"),
    document.getElementById("step-3"),
  ];

  allStepForms.forEach((form, index) => {
    if (form) {
      // Zeige nur das Formular an, dessen Index zum stepNumber passt
      form.classList.toggle("hidden", index + 1 !== stepNumber);
    }
  });

  updateProgress(stepNumber);
}

/**
 * Logik für die Frage: "Wann startet die Teilzeit?"
 * - Falls "Sofort" (Value 0): Input für Monate ausblenden & resetten.
 * - Falls "Später" (Value 1): Input einblenden.
 */
export const setupPartTimeSwitch = () => {
  const radios = document.querySelectorAll(
    'input[name="part-time-start-radio"]',
  );
  const inputField = document.getElementById("vollzeit-monate-input");
  const vollzeitMonateInput = document.getElementById("vollzeit-monate");
  const separator = document.getElementById("vollzeit-monate-separator");

  const updateVisibility = (selectedValue) => {
    const isSwitchLater = selectedValue === "1"; // "1" = Erst später wechseln

    if (inputField && separator) {
      if (isSwitchLater) {
        inputField.classList.remove("hidden");
        separator.classList.remove("hidden");
        // Wenn vorher "0" drin stand (vom Reset), leeren, damit User tippen kann
        if (vollzeitMonateInput && vollzeitMonateInput.value === "0") {
          vollzeitMonateInput.value = "";
        }
      } else {
        // Teilzeit ab Start -> Eingabefeld verstecken
        inputField.classList.add("hidden");
        separator.classList.add("hidden");
        // Wert logisch auf 0 setzen
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

  // Initiale Prüfung beim Laden
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
  const trackFactor = 2 / 3; // visually align the line with the three step icons

  // Aktiven Status der Kreise setzen
  progressSteps.forEach((step) => {
    const stepNum = parseInt(step.dataset.step, 10);
    step.classList.toggle("active", stepNum <= currentStep);
  });

  // Balkenbreite berechnen (0 -> 50 -> 100 bei drei Schritten)
  const totalSteps = progressSteps.length || 1;
  const clampedStep = Math.min(Math.max(currentStep, 1), totalSteps);
  const relativeProgress =
    totalSteps > 1 ? (clampedStep - 1) / (totalSteps - 1) : 0;
  const progressPercentage = relativeProgress * 100;

  if (progressLine) {
    const adjustedWidth = (progressPercentage * trackFactor).toFixed(2);
    progressLine.style.width = `${adjustedWidth}%`;
  }
}

/**
 * Kernfunktion der View: Nimmt das berechnete Ergebnisobjekt (data)
 * und befüllt damit die Ergebniskarten, Listen und das Diagramm im DOM.
 */
export function renderResults(data) {
  lastRenderedResults = data;
  // 1. Daten entpacken
  const {
    originalDuration,
    partTimeHours,
    fullTimeHours,
    partTimeHoursAvailable,
    initialFullTimeMonths,
    shorteningResult,
    officialShorteningMonths,
    capWasHitShortening,
    legalMinimumDuration,
    remainingFullTimeEquivalent,
    newFullTimeDuration,
    finalExtensionMonths,
    finalTotalDuration,
    extensionCapWasHit,
    gracePeriod,
    maxAllowedTotalDuration,
  } = data;

  const primaryColor = getPrimaryColor();

  // DOM-Elemente cachen
  const partTimeCard = document.querySelector(".part-time-card");
  const partTimeCardLeft = partTimeCard
    ? partTimeCard.querySelector(".result-card-left")
    : null;
  const finalResultBox = document.querySelector(".final-result-box");
  const dailyHoursEl = document.getElementById("final-daily-hours");
  const topErrorMsg = document.getElementById("global-cap-error");

  /* -----------------------------------------------------------
         BEREITS GELEISTETE ZEIT (Vollzeit vor Teilzeit)
      ----------------------------------------------------------- */
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

      // Hinweis hinzufügen, dass dies keine Verkürzung ist
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

  /* -----------------------------------------------------------
         VERKÜRZUNGSGRÜNDE (Liste generieren)
      ----------------------------------------------------------- */
  document.getElementById("original-duration-header").textContent =
    formatTranslation("duration_months", { months: originalDuration });

  document.getElementById("shortening-card-value").textContent =
    officialShorteningMonths;

  const detailedShorteningsDiv = document.getElementById(
    "detailed-shortenings-card",
  );
  detailedShorteningsDiv.innerHTML = ""; // Reset

  // 1. Array kopieren, um es zu manipulieren
  let shorteningDetails = [...shorteningResult.details];

  // 2. "Keinen der genannten" (-1 / reason_school_none) herausfiltern.
  // Wir wollen diesen Eintrag NICHT in der Liste anzeigen.
  shorteningDetails = shorteningDetails.filter(
    (d) => d.translationKey !== "reason_school_none",
  );

  // 3. Hauptschulabschluss explizit prüfen und hinzufügen, falls er fehlt (0 Monate)
  const hasSchoolEntry = shorteningDetails.some(
    (d) => d.translationKey === "reason_school_hauptschule",
  );

  if (!hasSchoolEntry) {
    const selectedRadio = document.querySelector(
      'input[name="school-finish-radio"]:checked',
    );

    // Hier prüfen wir nur auf "0" (Hauptschule).
    // "Keinen" ist jetzt "-1", fällt also hier durch.
    if (selectedRadio && selectedRadio.value === "0") {
      shorteningDetails.unshift({
        translationKey: "reason_school_hauptschule",
        reason: getTranslation("reason_school_hauptschule"), // Fallback
        months: 0,
        isVariable: false,
      });
    }
  }

  // 4. Liste aufbauen
  if (shorteningDetails.length > 0) {
    shorteningDetails.forEach((detail) => {
      const p = document.createElement("p");
      p.classList.add("detailed-shortening-item");

      const reasonLabel = detail.translationKey
        ? getTranslation(detail.translationKey) || detail.reason
        : detail.reason;

      let text;

      if (detail.months === 0) {
        // Dieser Fall tritt jetzt nur noch für Hauptschule (0) auf, nicht für Keinen (-1)
        text = formatTranslation("shortening_zero", { reason: reasonLabel });
        p.style.color = "#555";
      } else if (detail.isVariable) {
        text = formatTranslation("shortening_variable", {
          reason: reasonLabel,
          months: detail.months,
        });
      } else {
        text = formatTranslation("shortening_fixed", {
          reason: reasonLabel,
          months: detail.months,
        });
      }

      p.innerHTML = text;
      detailedShorteningsDiv.appendChild(p);
    });
  } else {
    // 5. Wenn Liste leer ist (z.B. User wählte "Keinen" -> Liste wurde oben geleert),
    // zeige "Keine Verkürzung".
    detailedShorteningsDiv.innerHTML = `
      <p class="no-shortening-message">
        ${getTranslation("shortening_none")}
      </p>
    `;
  }

  // Warnung, wenn Max-Verkürzung (Mindestdauer) erreicht wurde
  if (capWasHitShortening) {
    const capMessage = document.createElement("p");
    capMessage.classList.add("cap-message");
    const capText =
      getTranslation("result_shortening_cap") ||
      "Hinweis: Maximal zulaessige Verkuerzung erreicht.";
    capMessage.innerHTML = `<i><strong>${capText}</strong></i><br>`;
    detailedShorteningsDiv.appendChild(capMessage);
  }

  /* -----------------------------------------------------------
         RESTDAUER & TEILZEIT-VERLÄNGERUNG
      ----------------------------------------------------------- */
  const newFullTimeCard = document.querySelector(".new-full-time-card");
  if (newFullTimeCard) {
    newFullTimeCard.style.display = "flex";
    document.getElementById("new-full-time-card-value").textContent =
      remainingFullTimeEquivalent;
    document.getElementById("detailed-new-full-time-card").innerHTML =
      `<p>${getTranslation("result_remaining_detail")}</p>`;
  }

  // Falls Teilzeit gewählt wurde
  if (partTimeHoursAvailable) {
    if (partTimeCard) partTimeCard.style.display = "flex";
    if (finalResultBox) finalResultBox.style.backgroundColor = primaryColor;
    document.getElementById("extension-card-value").textContent =
      finalExtensionMonths;

    const partTimeDetailsDiv = document.getElementById(
      "detailed-part-time-card",
    );
    if (partTimeDetailsDiv) {
      partTimeDetailsDiv.innerHTML = "";

      if (finalExtensionMonths === 0) {
        partTimeDetailsDiv.innerHTML = `<p class="detailed-part-time-item">${formatTranslation(
          "result_parttime_detail_zero",
          {
            full: fullTimeHours.toFixed(1),
            part: partTimeHours.toFixed(1),
            grace: gracePeriod,
          },
        )}</p>`;
      } else {
        partTimeDetailsDiv.innerHTML = `<p class="detailed-part-time-item">${formatTranslation(
          "result_parttime_detail_extend",
          {
            full: fullTimeHours.toFixed(1),
            part: partTimeHours.toFixed(1),
            months: finalExtensionMonths,
          },
        )}</p>`;
      }
    }

    // FEHLER: Max. Verlängerung (50% der Dauer) überschritten -> ROTE Warnbox
    if (extensionCapWasHit) {
      if (topErrorMsg) {
        topErrorMsg.classList.remove("hidden");
        topErrorMsg.innerHTML = getTranslation("result_extension_cap").replace(
          "{maxAllowedTotalDuration}",
          maxAllowedTotalDuration,
        );
      }

      // UI rot färben
      if (partTimeCardLeft)
        partTimeCardLeft.style.backgroundColor = primaryColor;
      if (finalResultBox) finalResultBox.style.backgroundColor = primaryColor;
      if (dailyHoursEl) dailyHoursEl.style.display = "none";
    } else {
      // Alles OK
      if (topErrorMsg) topErrorMsg.classList.add("hidden");
      if (partTimeCardLeft) partTimeCardLeft.style.backgroundColor = "#1a1a1a";
      if (finalResultBox) finalResultBox.style.backgroundColor = primaryColor;

      if (dailyHoursEl) {
        const avgPtDaily = partTimeHours / 5;
        const formattedAvgDaily = formatOneDecimal(avgPtDaily);
        const dailyHoursText =
          formatTranslation("result_daily_hours", {
            hours: formattedAvgDaily,
          }) || `⌀ ${formattedAvgDaily} Stunden pro Tag (Teilzeit)`;
        dailyHoursEl.textContent = dailyHoursText;
        dailyHoursEl.style.display = "block";
      }
    }
    document.getElementById("final-duration-result").textContent =
      `${finalTotalDuration} ${getTranslation("result_months")}`;
  } else {
    // Keine Teilzeit (Vollzeit-Berechnung)
    if (partTimeCard) partTimeCard.style.display = "none";
    document.getElementById("final-duration-result").textContent =
      `${finalTotalDuration} Monate`;
    // Styles resetten
    if (partTimeCardLeft) partTimeCardLeft.style.backgroundColor = "#1a1a1a";
    if (finalResultBox) finalResultBox.style.backgroundColor = primaryColor;
    if (dailyHoursEl) dailyHoursEl.style.display = "none";
  }

  /* -----------------------------------------------------------
         HINWEIS-BOX: VORZEITIGE ZULASSUNG
      ----------------------------------------------------------- */
  const existingEarlyBox = document.getElementById("early-admission-box");
  if (existingEarlyBox) existingEarlyBox.remove();

  const resultsContainer = document.querySelector(".results-container");

  // Nur anzeigen, wenn noch "Luft" bis zur Mindestdauer ist
  const earlyAdmissionAllowed =
    finalTotalDuration - 6 >= legalMinimumDuration && !extensionCapWasHit;

  if (earlyAdmissionAllowed) {
    const earlyAdmissionBox = document.createElement("div");
    earlyAdmissionBox.id = "early-admission-box";
    earlyAdmissionBox.classList.add("result-card-info-box");

    const icon = document.createElement("img");
    icon.src = infoIcon;
    icon.alt = "Info Icon";
    icon.classList.add("info-icon");

    const earlyTextBox = document.createElement("div");
    earlyTextBox.classList.add("info-box-text");
    const earlyInfoText = document.createElement("p");
    const earlyTitle =
      getTranslation("result_early_title") ||
      "Hinweis zur vorzeitigen Zulassung";
    const earlyBody =
      getTranslation("result_early_body") ||
      "Gute Leistungen koennen eine Verkuerzung um 6 Monate ermoeglichen. Der Antrag erfolgt bei der zustaendigen Stelle (z. B. IHK/HWK) und ist unabhaengig von den hier berechneten Gruenden.";
    earlyInfoText.innerHTML = `<strong>${earlyTitle}:</strong><br>${earlyBody}`;

    earlyTextBox.appendChild(earlyInfoText);
    earlyAdmissionBox.appendChild(icon);
    earlyAdmissionBox.appendChild(earlyTextBox);

    if (resultsContainer) {
      resultsContainer.appendChild(earlyAdmissionBox);
    }
  }

  /* -----------------------------------------------------------
         DIAGRAMM (Chart.js)
      ----------------------------------------------------------- */
  const canvas = document.getElementById("results-chart");
  if (!canvas) return;

  if (typeof window.Chart === "undefined") {
    console.warn("Chart.js ist nicht geladen.");
    return;
  }

  try {
    const ctx = canvas.getContext("2d");

    // Altes Chart löschen, sonst flackert es beim Hover
    if (myResultsChart) myResultsChart.destroy();

    const primaryShades = [
      getPrimaryRgba(0.35),
      getPrimaryRgba(0.6),
      getPrimaryRgba(0.85),
    ];
    const primaryStroke = getPrimaryRgba(1);

    myResultsChart = new window.Chart(ctx, {
      type: "bar",
      data: {
        labels: [
          [
            getTranslation("chart_label_regular"),
            getTranslation("chart_label_fulltime"),
          ],
          [
            getTranslation("chart_label_shortened"),
            getTranslation("chart_label_fulltime"),
          ],
          [
            getTranslation("chart_label_final"),
            getTranslation("chart_label_parttime"),
          ],
        ],
        datasets: [
          {
            label: getTranslation("chart_label_duration"),
            data: [originalDuration, newFullTimeDuration, finalTotalDuration],
            backgroundColor: primaryShades,
            borderColor: [primaryStroke, primaryStroke, primaryStroke],
            borderWidth: 1,
          },
        ],
      },
      options: {
        animation: false,
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          title: {
            display: true,
            text: getTranslation("chart_title_overview"),
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            title: { display: true, text: getTranslation("chart_axis_months") },
          },
        },
      },
    });
  } catch (error) {
    console.error("Fehler beim Erstellen des Diagramms:", error);
  }
}

/**
 * Toggle-Logik für "Detaillierte Erklärung anzeigen" (Accordion).
 */
export function setupDetailsToggle() {
  const btn = document.getElementById("toggle-details-btn");
  const wrapper = document.getElementById("details-wrapper");
  const container = document.getElementById("details-container");

  if (btn && wrapper && container) {
    const setButtonLabel = (isOpen) => {
      const key = isOpen ? "details_toggle_open" : "details_toggle_closed";
      const translation = getTranslation(key);
      if (translation) {
        btn.textContent = translation;
      }
    };

    btn.addEventListener("click", () => {
      const isHidden = wrapper.classList.contains("hidden");

      if (isHidden) {
        wrapper.classList.remove("hidden");
        container.classList.add("open");
        setButtonLabel(true);
      } else {
        wrapper.classList.add("hidden");
        container.classList.remove("open");
        setButtonLabel(false);
      }
    });

    const isInitiallyOpen = !wrapper.classList.contains("hidden");
    setButtonLabel(isInitiallyOpen);
    onLanguageChange(() =>
      setButtonLabel(!wrapper.classList.contains("hidden")),
    );
  }
}

onLanguageChange(() => {
  if (lastRenderedResults) {
    renderResults(lastRenderedResults);
  }
});
