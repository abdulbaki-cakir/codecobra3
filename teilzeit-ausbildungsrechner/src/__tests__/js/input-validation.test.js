/** @jest-environment jsdom */
import {
  validateVollzeitstunden,
  validateWochenstunden,
  validateVollzeitMonate,
  resetVollzeitMonateValidation,
} from "../../js/modules/input-validation.js";

const buildErrorBlock = (id) => `
  <div id="${id}" class="error"><span></span></div>
`;

describe("input-validation", () => {
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

    test("shows error for empty value when showErrorIfEmpty", () => {
      setup("");
      const result = validateVollzeitstunden(true);
      expect(result).toBe(false);
      expect(
        document.getElementById("vollzeitstunden-error").classList.contains(
          "visible",
        ),
      ).toBe(true);
      expect(
        document.getElementById("vollzeitstunden").classList.contains("invalid"),
      ).toBe(true);
      expect(
        document.querySelector("#vollzeitstunden-error span").textContent,
      ).toBe("Bitte die Vollzeitstunden eingeben.");
    });

    test("rejects non-number, out-of-range and non-half-step", () => {
      setup("abc");
      expect(validateVollzeitstunden(true)).toBe(false);
      expect(
        document.querySelector("#vollzeitstunden-error span").textContent,
      ).toBe("Bitte eine gültige Zahl eingeben.");

      setup("50");
      expect(validateVollzeitstunden(true)).toBe(false);
      expect(
        document.querySelector("#vollzeitstunden-error span").textContent,
      ).toBe("Wert muss zwischen 35 und 48 liegen.");

      setup("37.3");
      expect(validateVollzeitstunden(true)).toBe(false);
      expect(
        document.querySelector("#vollzeitstunden-error span").textContent,
      ).toBe("Nur 0,5er Schritte (z.B. 37, 37,5 oder 38) sind erlaubt.");
    });

    test("accepts valid half-step within range", () => {
      setup("37.5");
      const result = validateVollzeitstunden(true);
      expect(result).toBe(true);
      expect(
        document.getElementById("vollzeitstunden-error").classList.contains(
          "visible",
        ),
      ).toBe(false);
      expect(
        document.getElementById("vollzeitstunden").classList.contains("invalid"),
      ).toBe(false);
      expect(
        document.querySelector("#vollzeitstunden-error span").textContent,
      ).toBe("");
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

    test("empty value with flag shows error", () => {
      setup("40", "");
      const result = validateWochenstunden(true);
      expect(result).toBe(false);
      expect(
        document.querySelector("#wochenstunden-error span").textContent,
      ).toBe("Bitte die gewünschten Stunden eingeben.");
      expect(
        document.getElementById("wochenstunden").classList.contains("invalid"),
      ).toBe(true);
    });

    test("rejects non-number, <50%, >=vollzeit, non half-step", () => {
      setup("40", "abc");
      expect(validateWochenstunden(true)).toBe(false);
      expect(
        document.querySelector("#wochenstunden-error span").textContent,
      ).toBe("Bitte eine Zahl eingeben.");

      setup("40", "15");
      expect(validateWochenstunden(true)).toBe(false);
      expect(
        document.querySelector("#wochenstunden-error span").textContent,
      ).toBe("Teilzeit muss mind. 50% der Vollzeit sein (mind. 20 Std.).");

      setup("40", "40");
      expect(validateWochenstunden(true)).toBe(false);
      expect(
        document.querySelector("#wochenstunden-error span").textContent,
      ).toBe("Es muss weniger als Vollzeit sein.");

      setup("40", "20.3");
      expect(validateWochenstunden(true)).toBe(false);
      expect(
        document.querySelector("#wochenstunden-error span").textContent,
      ).toBe("Nur 0,5er Schritte (z.B. 20, 20,5 oder 21) sind erlaubt.");
    });

    test("accepts valid half-step within 50%-<VZ", () => {
      setup("40", "20");
      const result = validateWochenstunden(true);
      expect(result).toBe(true);
      expect(
        document.getElementById("wochenstunden-error").classList.contains(
          "visible",
        ),
      ).toBe(false);
      expect(
        document.getElementById("wochenstunden").classList.contains("invalid"),
      ).toBe(false);
      expect(
        document.querySelector("#wochenstunden-error span").textContent,
      ).toBe("");
    });
  });

  describe("validateVollzeitMonate", () => {
    const setup = (radioChecked = true, monateVal = "", dauerVal = "36") => {
      document.body.innerHTML = `
        <input type="radio" name="part-time-start-radio" value="1" ${
          radioChecked ? "checked" : ""
        } />
        <input id="vollzeit-monate" value="${monateVal}" />
        <select id="ausbildungsdauer"><option value="${dauerVal}">${dauerVal}</option></select>
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

    test("handles empty, <=0, >=dauer errors", () => {
      setup(true, "");
      expect(validateVollzeitMonate(true)).toBe(false);
      expect(
        document.querySelector("#vollzeit-monate-error span").textContent,
      ).toBe("Bitte Monate eingeben.");

      setup(true, "0");
      expect(validateVollzeitMonate(true)).toBe(false);
      expect(
        document.querySelector("#vollzeit-monate-error span").textContent,
      ).toBe("Bitte eine gültige Zahl > 0 eingeben.");

      setup(true, "36");
      expect(validateVollzeitMonate(true)).toBe(false);
      expect(
        document.querySelector("#vollzeit-monate-error span").textContent,
      ).toBe("Muss kleiner als 36 Monate sein.");
    });

    test("accepts valid months below total duration", () => {
      setup(true, "12", "36");
      const result = validateVollzeitMonate(true);
      expect(result).toBe(true);
      expect(
        document.getElementById("vollzeit-monate-error").classList.contains(
          "visible",
        ),
      ).toBe(false);
      expect(
        document.getElementById("vollzeit-monate").classList.contains("invalid"),
      ).toBe(false);
      expect(
        document.querySelector("#vollzeit-monate-error span").textContent,
      ).toBe("");
    });
  });

  describe("resetVollzeitMonateValidation", () => {
    test("clears error state when elements exist", () => {
      document.body.innerHTML = `
        <input id="vollzeit-monate" class="invalid" />
        <div id="vollzeit-monate-error" class="visible"><span>Fehler</span></div>
      `;
      resetVollzeitMonateValidation();
      expect(
        document.getElementById("vollzeit-monate").classList.contains("invalid"),
      ).toBe(false);
      expect(
        document.querySelector("#vollzeit-monate-error span").textContent,
      ).toBe("");
      expect(
        document.getElementById("vollzeit-monate-error").classList.contains(
          "visible",
        ),
      ).toBe(false);
    });

  });
});
