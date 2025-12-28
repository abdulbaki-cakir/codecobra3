/** @jest-environment jsdom */

import {
  validateVollzeitstunden,
  validateWochenstunden,
  validateVollzeitMonate,
  resetVollzeitMonateValidation
} from "../../js/modules/input-validation.js";

import { __setTranslationsForTests } from "../../js/modules/language.js";

const buildErrorBlock = (id) => `
  <div id="${id}" class="error"><span></span></div>
`;

const expectVisibleInvalid = (inputId, errorId, expectedKey) => {
  const input = document.getElementById(inputId);
  const error = document.getElementById(errorId);
  const span = error.querySelector("span");

  expect(error.classList.contains("visible")).toBe(true);
  expect(input.classList.contains("invalid")).toBe(true);
  expect(span.dataset.translateKey).toBe(expectedKey);
};

const expectHiddenValid = (inputId, errorId) => {
  const input = document.getElementById(inputId);
  const error = document.getElementById(errorId);
  const span = error.querySelector("span");

  expect(error.classList.contains("visible")).toBe(false);
  expect(input.classList.contains("invalid")).toBe(false);
  expect(span.textContent).toBe("");
  expect(span.dataset.translateKey || "").toBe("");
};

describe("input-validation (i18n-safe)", () => {
  beforeEach(() => {
    __setTranslationsForTests("de", {
      error_fulltime_required: "Bitte die Vollzeitstunden eingeben.",
      error_number_invalid: "Bitte eine gültige Zahl eingeben.",
      error_fulltime_range: "Wert muss zwischen 35 und 48 liegen.",
      error_half_steps:
        "Nur 0,5er Schritte (z.B. 37, 37,5 oder 38) sind erlaubt.",
      error_parttime_required: "Bitte die gewünschten Stunden eingeben.",
      error_parttime_minimum:
        "Teilzeit muss mind. 50% der Vollzeit sein (mind. {min} Std.).",
      error_parttime_less_than_full: "Es muss weniger als Vollzeit sein.",
      error_months_required: "Bitte Monate eingeben.",
      error_number_positive: "Bitte eine gültige Zahl > 0 eingeben.",
      error_months_less_than: "Muss kleiner als {max} Monate sein."
    });
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  describe("validateVollzeitstunden", () => {
    const setup = (value = "") => {
      document.body.innerHTML = `
        <input id="vollzeitstunden" value="${value}" />
        ${buildErrorBlock("vollzeitstunden-error")}
      `;
    };

    test("empty + flag sets correct key and shows popup", () => {
      setup("");
      const result = validateVollzeitstunden(true);
      expect(result).toBe(false);

      expectVisibleInvalid(
        "vollzeitstunden",
        "vollzeitstunden-error",
        "error_fulltime_required"
      );
    });

    test("rejects non-number, out-of-range and non-half-step with correct keys", () => {
      setup("abc");
      expect(validateVollzeitstunden(true)).toBe(false);
      expectVisibleInvalid(
        "vollzeitstunden",
        "vollzeitstunden-error",
        "error_number_invalid"
      );

      setup("50");
      expect(validateVollzeitstunden(true)).toBe(false);
      expectVisibleInvalid(
        "vollzeitstunden",
        "vollzeitstunden-error",
        "error_fulltime_range"
      );

      setup("37.3");
      expect(validateVollzeitstunden(true)).toBe(false);
      expectVisibleInvalid(
        "vollzeitstunden",
        "vollzeitstunden-error",
        "error_half_steps"
      );
    });

    test("accepts valid half-step within range", () => {
      setup("37.5");
      const result = validateVollzeitstunden(true);
      expect(result).toBe(true);

      expectHiddenValid("vollzeitstunden", "vollzeitstunden-error");
    });
  });

  describe("validateWochenstunden", () => {
    const setup = (vollzeitVal = "40", wochenVal = "") => {
      document.body.innerHTML = `
        <input id="vollzeitstunden" value="${vollzeitVal}" />
        <input id="wochenstunden" value="${wochenVal}" />
        ${buildErrorBlock("wochenstunden-error")}
      `;
    };

    test("empty + flag sets correct key", () => {
      setup("40", "");
      const result = validateWochenstunden(true);
      expect(result).toBe(false);

      expectVisibleInvalid(
        "wochenstunden",
        "wochenstunden-error",
        "error_parttime_required"
      );
    });

    test("rejects non-number with error_number_invalid key", () => {
      setup("40", "abc");
      expect(validateWochenstunden(true)).toBe(false);

      expectVisibleInvalid(
        "wochenstunden",
        "wochenstunden-error",
        "error_number_invalid"
      );
    });

    test("rejects <50% with template key and replaces {min}", () => {
      setup("40", "15");
      expect(validateWochenstunden(true)).toBe(false);

      const span = document.querySelector("#wochenstunden-error span");
      expect(span.dataset.translateKey).toBe("error_parttime_minimum");
      expect(span.textContent).toBe(
        "Teilzeit muss mind. 50% der Vollzeit sein (mind. 20 Std.)."
      );
    });

    test("rejects >= vollzeit with correct key", () => {
      setup("40", "40");
      expect(validateWochenstunden(true)).toBe(false);

      expectVisibleInvalid(
        "wochenstunden",
        "wochenstunden-error",
        "error_parttime_less_than_full"
      );
    });

    test("rejects non-half-step with error_half_steps key", () => {
      setup("40", "20.3");
      expect(validateWochenstunden(true)).toBe(false);

      expectVisibleInvalid(
        "wochenstunden",
        "wochenstunden-error",
        "error_half_steps"
      );
    });

    test("accepts valid value within 50%-<VZ", () => {
      setup("40", "20");
      const result = validateWochenstunden(true);
      expect(result).toBe(true);

      expectHiddenValid("wochenstunden", "wochenstunden-error");
    });
  });

  describe("validateVollzeitMonate", () => {
    const setup = (radioChecked = true, monateVal = "", dauerVal = "36") => {
      document.body.innerHTML = `
        <input type="radio" name="part-time-start-radio" value="1" ${
          radioChecked ? "checked" : ""
        } />
        <input id="vollzeit-monate" value="${monateVal}" />
        <select id="ausbildungsdauer">
          <option value="${dauerVal}">${dauerVal}</option>
        </select>
        ${buildErrorBlock("vollzeit-monate-error")}
      `;
    };

    test("skips validation when radio not selected/sofort", () => {
      document.body.innerHTML = ``; // no radio
      expect(validateVollzeitMonate()).toBe(true);

      document.body.innerHTML = `
        <input type="radio" name="part-time-start-radio" value="0" checked />
      `;
      expect(validateVollzeitMonate()).toBe(true);
    });

    test("empty + flag sets months_required key", () => {
      setup(true, "");
      expect(validateVollzeitMonate(true)).toBe(false);

      expectVisibleInvalid(
        "vollzeit-monate",
        "vollzeit-monate-error",
        "error_months_required"
      );
    });

    test("<=0 sets number_positive key", () => {
      setup(true, "0");
      expect(validateVollzeitMonate(true)).toBe(false);

      expectVisibleInvalid(
        "vollzeit-monate",
        "vollzeit-monate-error",
        "error_number_positive"
      );
    });

    test(">= duration sets months_less_than key and replaces {max}", () => {
      setup(true, "36", "36");
      expect(validateVollzeitMonate(true)).toBe(false);

      const span = document.querySelector("#vollzeit-monate-error span");
      expect(span.dataset.translateKey).toBe("error_months_less_than");
      expect(span.textContent).toBe("Muss kleiner als 36 Monate sein.");
    });

    test("accepts valid months below duration", () => {
      setup(true, "12", "36");
      const result = validateVollzeitMonate(true);
      expect(result).toBe(true);

      expectHiddenValid("vollzeit-monate", "vollzeit-monate-error");
    });
  });

  describe("resetVollzeitMonateValidation", () => {
    test("clears error state when elements exist", () => {
      document.body.innerHTML = `
        <input id="vollzeit-monate" class="invalid" />
        <div id="vollzeit-monate-error" class="visible">
          <span data-translate-key="error_months_required">Fehler</span>
        </div>
      `;

      resetVollzeitMonateValidation();

      expect(
        document.getElementById("vollzeit-monate").classList.contains("invalid")
      ).toBe(false);

      const span = document.querySelector("#vollzeit-monate-error span");
      expect(span.textContent).toBe("");
      expect(span.dataset.translateKey).toBe("");

      expect(
        document
          .getElementById("vollzeit-monate-error")
          .classList.contains("visible")
      ).toBe(false);
    });
  });
});
