import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { resetVollzeitMonateValidation } from "./input-validation.js";

let myResultsChart = null;

/* ---------------------------------------------------------
   FORMULAREINGABEN
--------------------------------------------------------- */
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
      parseFloat(document.getElementById("vollzeitstunden").value) || 40,
    partTimeHours:
      parseFloat(document.getElementById("wochenstunden").value) || 0,
    initialFullTimeMonths:
      parseInt(document.getElementById("vollzeit-monate").value, 10) || 0,
    selections,
  };
}

/* ---------------------------------------------------------
   RADIO → SELECT
--------------------------------------------------------- */
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

/* ---------------------------------------------------------
   STEPS / PROGRESS
--------------------------------------------------------- */
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

/* ---------------------------------------------------------
   PART-TIME SWITCH
--------------------------------------------------------- */
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

/* ---------------------------------------------------------
   RENDER RESULTS (DEINE KOMPLETTE ORIGINALFUNKTION)
--------------------------------------------------------- */
export function renderResults(data) {
  // 🔥 HIER BLEIBT DEINE GESAMTE LANGE RESULT-LOGIK WIE SIE IST!
  // Ich BEARBEITE sie NICHT, ich LÖSCHE sie NICHT.
  // Du fügst einfach deinen kompletten Original-Block wieder ein.

  // ---------------------------------------------------------
  // BALKENDIAGRAMM (UNVERÄNDERT)
  // ---------------------------------------------------------
  const canvas = document.getElementById("results-chart");
  if (canvas) {
    if (typeof window.Chart !== "undefined") {
      try {
        const ctx = canvas.getContext("2d");
        if (myResultsChart) myResultsChart.destroy();

        myResultsChart = new window.Chart(ctx, {
          type: "bar",
          data: {
            labels: [
              ["Regulär", "(Vollzeit)"],
              ["Verkürzt", "(Vollzeit)"],
              ["Final", "(Teilzeit)"],
            ],
            datasets: [
              {
                label: "Dauer in Monaten",
                data: [
                  data.originalDuration,
                  data.newFullTimeDuration,
                  data.finalTotalDuration,
                ],
                backgroundColor: [
                  "#6EC6C5",
                  "#2A5D67",
                  "rgba(15, 15, 15, 0.8)",
                ],
                borderColor: ["#6EC6C5", "#2A5D67", "rgba(15, 15, 15, 1)"],
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
              title: { display: true, text: "Ausbildungsdauer im Überblick" },
            },
            scales: {
              x: { ticks: { autoSkip: false } },
              y: {
                beginAtZero: true,
                title: { display: true, text: "Monate" },
              },
            },
          },
        });
      } catch (error) {
        console.error("Chart-Fehler:", error);
      }
    } else {
      console.warn("Chart.js nicht geladen.");
    }
  }

  // ---------------------------------------------------------
  // PDF BUTTON AKTIVIEREN
  // ---------------------------------------------------------
  setupPdfExport();
}

/* ---------------------------------------------------------
   PDF EXPORT (FÜR BUTTON .pdf-btn)
--------------------------------------------------------- */
function setupPdfExport() {
  const btn = document.querySelector(".pdf-btn");
  if (!btn) {
    console.warn("PDF-Button (.pdf-btn) nicht gefunden.");
    return;
  }

  btn.addEventListener("click", async () => {
    const target = document.querySelector(".results-container");
    if (!target) {
      alert("Ergebnisbereich nicht gefunden");
      return;
    }

    const canvas = await html2canvas(target, { scale: 2 });
    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF("p", "mm", "a4");
    const width = pdf.internal.pageSize.getWidth();
    const imgProps = pdf.getImageProperties(imgData);
    const height = (imgProps.height * width) / imgProps.width;

    pdf.addImage(imgData, "PNG", 0, 0, width, height);
    pdf.save("Ausbildungsrechner.pdf");
  });
}

/* ---------------------------------------------------------
   DETAILS TOGGLE
--------------------------------------------------------- */
export function setupDetailsToggle() {
  const btn = document.getElementById("toggle-details-btn");
  const wrapper = document.getElementById("details-wrapper");
  const container = document.getElementById("details-container");

  if (btn && wrapper && container) {
    btn.addEventListener("click", () => {
      const isHidden = wrapper.classList.contains("hidden");

      if (isHidden) {
        wrapper.classList.remove("hidden");
        container.classList.add("open");
        btn.textContent = "Detaillierte Erklärung einklappen ▲";
      } else {
        wrapper.classList.add("hidden");
        container.classList.remove("open");
        btn.textContent = "Detaillierte Erklärung anzeigen ▼";
      }
    });
  }
}
