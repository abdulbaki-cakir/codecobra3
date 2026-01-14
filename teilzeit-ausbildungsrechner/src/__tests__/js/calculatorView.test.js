/** @jest-environment jsdom */
import { jest } from "@jest/globals";

const translations = {
  result_parttime_detail_zero:
    "Teilzeit von {full} auf {part}, Verlangerung <= {grace}",
  result_parttime_detail_extend:
    "Teilzeit von {full} auf {part} mit {months} Monaten",
  result_remaining_detail: "Restzeit",
  result_shortening_cap: "Maximale Verkuerzung erreicht",
  result_early_title: "Fruehe Zulassung",
  result_early_body: "Kann um 6 Monate verkuerzt werden",
  details_toggle_open: "Schliessen",
  details_toggle_closed: "Details anzeigen",
};

const languageListeners = [];

jest.mock("../../js/modules/language.js", () => ({
  getTranslation: jest.fn((key) => translations[key] ?? ""),
  onLanguageChange: jest.fn((cb) => languageListeners.push(cb)),
}));

jest.mock("../../js/modules/input-validation.js", () => ({
  resetVollzeitMonateValidation: jest.fn(),
}));

// Icon-Import im Modul
jest.mock("../../assets/icons/info-circle-fill.svg", () => "info.svg", {
  virtual: true,
});

describe("calculatorView", () => {
  let view;
  let resetValidation;
  let onLanguageChange;

  beforeEach(async () => {
    jest.resetModules();
    document.body.innerHTML = "";
    languageListeners.length = 0;
    HTMLCanvasElement.prototype.getContext = jest.fn(() => ({}));

    ({ resetVollzeitMonateValidation: resetValidation } = await import(
      "../../js/modules/input-validation.js"
    ));
    ({ onLanguageChange } = await import("../../js/modules/language.js"));

    // Chart.js Stub, damit renderResults ohne echtes Canvas laeuft
    global.window.Chart = jest.fn().mockImplementation(() => ({
      destroy: jest.fn(),
    }));

    view = await import("../../js/modules/calculatorView.js");
  });

  test("getFormInputs liest Felder und setzt Defaults", () => {
    document.body.innerHTML = `
      <input id="ausbildungsdauer" value="36" />
      <input id="vollzeitstunden" value="38.5" />
      <input id="wochenstunden" value="" />
      <input id="vollzeit-monate" value="" />
      <select id="school-finish"><option value="12" selected>Abi</option></select>
    `;

    const inputs = view.getFormInputs();

    expect(inputs.originalDuration).toBe(36);
    expect(inputs.fullTimeHours).toBeCloseTo(38.5);
    expect(inputs.partTimeHours).toBe(0); // Default bei leerem Feld
    expect(inputs.initialFullTimeMonths).toBe(0);
    expect(inputs.selections["school-finish"]).toBe("12");
  });

  test("linkRadiosToSelect synchronisiert Hidden-Select mit Radios", () => {
    document.body.innerHTML = `
      <input type="radio" name="school" value="0" />
      <input type="radio" name="school" value="12" />
      <select id="school-select">
        <option value="0"></option>
        <option value="12"></option>
      </select>
    `;

    view.linkRadiosToSelect("school", "school-select");

    const radios = document.querySelectorAll('input[name="school"]');
    const select = document.getElementById("school-select");

    radios[1].checked = true;
    radios[1].dispatchEvent(new Event("change", { bubbles: true }));

    expect(select.value).toBe("12");
  });

  test("showStep blendet Schritte um und aktualisiert Progress", () => {
    document.body.innerHTML = `
      <div id="progress-line"></div>
      <div class="progress-container">
        <div class="step" data-step="1"></div>
        <div class="step" data-step="2"></div>
        <div class="step" data-step="3"></div>
      </div>
      <form id="step-1" class="hidden"></form>
      <form id="step-2" class="hidden"></form>
      <form id="step-3" class="hidden"></form>
    `;

    view.showStep(2);

    expect(document.getElementById("step-2").classList.contains("hidden")).toBe(
      false,
    );
    expect(document.getElementById("step-1").classList.contains("hidden")).toBe(
      true,
    );
    expect(document.getElementById("step-3").classList.contains("hidden")).toBe(
      true,
    );
    expect(document.getElementById("progress-line").style.width).toBe("33.33%");

    const activeSteps = Array.from(
      document.querySelectorAll(".progress-container .step.active"),
    ).length;
    expect(activeSteps).toBe(2);
  });

  test("setupPartTimeSwitch toggelt Felder und ruft Reset bei Sofort-Wechsel", () => {
    document.body.innerHTML = `
      <input type="radio" name="part-time-start-radio" value="1" checked />
      <input type="radio" name="part-time-start-radio" value="0" />
      <div id="vollzeit-monate-input" class="hidden"></div>
      <div id="vollzeit-monate-separator" class="hidden"></div>
      <input id="vollzeit-monate" value="5" />
    `;

    view.setupPartTimeSwitch();

    // Initial: "später" (1) => Felder sichtbar
    expect(
      document
        .getElementById("vollzeit-monate-input")
        .classList.contains("hidden"),
    ).toBe(false);

    // Wechsel auf "sofort" (0)
    const radios = document.querySelectorAll(
      'input[name="part-time-start-radio"]',
    );
    radios[1].checked = true;
    radios[1].dispatchEvent(new Event("change"));

    expect(
      document
        .getElementById("vollzeit-monate-input")
        .classList.contains("hidden"),
    ).toBe(true);
    expect(document.getElementById("vollzeit-monate").value).toBe("0");
    expect(resetValidation).toHaveBeenCalled();
  });

  test("renderResults befuellt Teilzeit-UI und zeigt Cap-Warnung", () => {
    document.body.innerHTML = `
      <div class="part-time-card"><div class="result-card-left"></div></div>
      <div class="final-result-box"></div>
      <div id="final-daily-hours"></div>
      <div id="global-cap-error" class="hidden"></div>
      <div class="served-time-card"></div>
      <div id="served-card-value"></div>
      <div id="detailed-served-time-card"></div>
      <div id="original-duration-header"></div>
      <div id="shortening-card-value"></div>
      <div id="detailed-shortenings-card"></div>
      <div class="new-full-time-card">
        <div id="new-full-time-card-value"></div>
        <div id="detailed-new-full-time-card"></div>
      </div>
      <div id="extension-card-value"></div>
      <div id="detailed-part-time-card"></div>
      <div id="final-duration-result"></div>
      <div class="results-container"></div>
      <canvas id="results-chart"></canvas>
    `;

    const data = {
      originalDuration: 36,
      partTimeHours: 20,
      fullTimeHours: 40,
      partTimeHoursAvailable: true,
      initialFullTimeMonths: 6,
      shorteningResult: {
        details: [{ reason: "Test", months: 6, isVariable: false }],
        capWasHit: true,
      },
      officialShorteningMonths: 6,
      capWasHitShortening: true,
      legalMinimumDuration: 18,
      remainingFullTimeEquivalent: 24,
      newFullTimeDuration: 30,
      finalExtensionMonths: 10,
      finalTotalDuration: 40,
      extensionCapWasHit: true,
      gracePeriod: 6,
      maxAllowedTotalDuration: 54,
    };

    view.renderResults(data);

    expect(document.getElementById("extension-card-value").textContent).toBe(
      "10",
    );
    expect(
      document.getElementById("global-cap-error").classList.contains("hidden"),
    ).toBe(false);
    expect(
      document.querySelector(".result-card-left").style.backgroundColor,
    ).toBe("rgb(185, 49, 55)");
    expect(
      document.querySelector(".final-result-box").style.backgroundColor,
    ).toBe("rgb(185, 49, 55)");
    expect(document.getElementById("final-daily-hours").style.display).toBe(
      "none",
    );
    expect(window.Chart).toHaveBeenCalled();
  });

  test("setupDetailsToggle schaltet Accordion und aktualisiert Label", () => {
    document.body.innerHTML = `
      <button id="toggle-details-btn"></button>
      <div id="details-wrapper" class="hidden"></div>
      <div id="details-container" class="accordion"></div>
    `;

    view.setupDetailsToggle();

    const btn = document.getElementById("toggle-details-btn");
    expect(btn.textContent).toBe(translations.details_toggle_closed);
    expect(onLanguageChange).toHaveBeenCalled();

    btn.click();
    expect(
      document.getElementById("details-wrapper").classList.contains("hidden"),
    ).toBe(false);
    expect(btn.textContent).toBe(translations.details_toggle_open);
  });
});
