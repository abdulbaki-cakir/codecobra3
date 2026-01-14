/** @jest-environment jsdom */
import { jest } from "@jest/globals";

// Define mocks in factory (hoisted)
jest.mock("../../js/modules/calculatorView.js", () => ({
  getFormInputs: jest.fn(),
  renderResults: jest.fn(),
  linkRadiosToSelect: jest.fn(),
  showStep: jest.fn(),
  setupPartTimeSwitch: jest.fn(),
  setupDetailsToggle: jest.fn(),
}));

jest.mock("../../js/modules/input-validation.js", () => ({
  validateVollzeitstunden: jest.fn(),
  validateWochenstunden: jest.fn(),
  validateVollzeitMonate: jest.fn(),
}));

jest.mock("../../js/modules/navigation.js", () => ({
  scrollToCalculator: jest.fn(),
}));

jest.mock("../../js/modules/calculatorService.js", () => ({
  calculateFinalResults: jest.fn(),
}));

describe("calculatorController.js", () => {
  let Controller;
  let View;
  let Validation;
  let Service;
  let Navigation;

  // Helper to setup DOM
  const setupDOM = () => {
    document.body.innerHTML = `
      <div id="calculator-wrapper">
        <button id="next-btn-1"></button>
        <button id="back-btn-2"></button>
        <button id="next-btn-2"></button>
        <button id="back-btn-3"></button>
        <button id="reset-btn"></button>
        
        <input id="vollzeitstunden" value="40" />
        <input id="wochenstunden" value="20" />
        <input id="vollzeit-monate" value="0" />
        <select id="ausbildungsdauer"><option value="36">36</option></select>
        
        <div id="vollzeit-monate-input"></div>
        <div id="vollzeit-monate-separator"></div>
        <div id="reset-confirm-msg">Möchten Sie wirklich zurücksetzen?</div>
        
        <input type="radio" name="part-time-start-radio" value="0" />
        <input type="radio" name="part-time-start-radio" value="1" />
        <input type="radio" name="age-radio" />
        
        <div class="validation-popup" style="display: block;"></div>
      </div>
    `;
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    // CRITICAL FIX: Reset modules to clear 'let currentStep = 1' state
    jest.resetModules();
    setupDOM();

    // Re-import modules after reset
    Controller = await import("../../js/modules/calculatorController.js");
    View = await import("../../js/modules/calculatorView.js");
    Validation = await import("../../js/modules/input-validation.js");
    Service = await import("../../js/modules/calculatorService.js");
    Navigation = await import("../../js/modules/navigation.js");

    // Default: All validations pass
    Validation.validateVollzeitstunden.mockReturnValue(true);
    Validation.validateWochenstunden.mockReturnValue(true);
    Validation.validateVollzeitMonate.mockReturnValue(true);

    // Initialize
    Controller.initializeCalculator();
  });

  describe("Navigation Flow", () => {
    test("Step 1 -> Step 2: Advances only if validation passes", () => {
      const nextBtn = document.getElementById("next-btn-1");
      nextBtn.click();

      expect(Validation.validateVollzeitstunden).toHaveBeenCalledWith(true);
      expect(View.showStep).toHaveBeenCalledWith(2);
      expect(Navigation.scrollToCalculator).toHaveBeenCalled();
    });

    test("Step 1 -> Step 2: Stays on Step 1 if validation fails", () => {
      // Force validation failure
      Validation.validateVollzeitstunden.mockReturnValue(false);

      const nextBtn = document.getElementById("next-btn-1");
      nextBtn.click();

      // Check that step 2 was NOT called
      expect(View.showStep).not.toHaveBeenCalledWith(2);
    });

    test("Step 2 -> Step 3: Triggers Calculation", () => {
      const inputsMock = { some: "data" };
      const resultsMock = { result: 100 };

      View.getFormInputs.mockReturnValue(inputsMock);
      Service.calculateFinalResults.mockReturnValue(resultsMock);

      const nextBtn2 = document.getElementById("next-btn-2");
      nextBtn2.click();

      expect(View.getFormInputs).toHaveBeenCalled();
      expect(Service.calculateFinalResults).toHaveBeenCalledWith(inputsMock);
      expect(View.renderResults).toHaveBeenCalledWith(resultsMock);
      expect(View.showStep).toHaveBeenCalledWith(3);
    });

    test("Back buttons work", () => {
      const backBtn2 = document.getElementById("back-btn-2");
      backBtn2.click();
      expect(View.showStep).toHaveBeenCalledWith(1);
    });
  });

  describe("Live Validation (Events)", () => {
    test("Vollzeit input blur triggers validation", () => {
      const input = document.getElementById("vollzeitstunden");
      input.focus();
      input.blur();

      expect(Validation.validateVollzeitstunden).toHaveBeenCalledWith(true);
      expect(Validation.validateWochenstunden).toHaveBeenCalled();
    });

    test("Enter key triggers blur on inputs", () => {
      const input = document.getElementById("vollzeitstunden");
      const blurSpy = jest.spyOn(input, "blur");

      const event = new KeyboardEvent("keydown", { key: "Enter" });
      input.dispatchEvent(event);

      expect(blurSpy).toHaveBeenCalled();
    });

    test("Changing Part-Time radio re-validates months", () => {
      const radios = document.querySelectorAll(
        'input[name="part-time-start-radio"]',
      );
      radios[0].dispatchEvent(new Event("change", { bubbles: true }));

      expect(Validation.validateVollzeitMonate).toHaveBeenCalledWith(false);
    });
  });

  describe("Reset Logic", () => {
    test("Reset cancels if confirm is rejected", () => {
      const confirmSpy = jest
        .spyOn(window, "confirm")
        .mockImplementation(() => false);
      const resetBtn = document.getElementById("reset-btn");
      const input = document.getElementById("vollzeitstunden");

      input.value = "999";
      resetBtn.click();

      expect(confirmSpy).toHaveBeenCalled();
      expect(input.value).toBe("999"); // Still dirty
      confirmSpy.mockRestore();
    });

    test("Reset proceeds if confirm is accepted", () => {
      const confirmSpy = jest
        .spyOn(window, "confirm")
        .mockImplementation(() => true);
      const resetBtn = document.getElementById("reset-btn");
      const input = document.getElementById("vollzeitstunden");

      input.value = "123";
      resetBtn.click();

      expect(input.value).toBe(""); // Cleared
      expect(View.showStep).toHaveBeenCalledWith(1);
      expect(Navigation.scrollToCalculator).toHaveBeenCalled();

      confirmSpy.mockRestore();
    });

    test("Reset handles fallback message if DOM element missing", () => {
      document.getElementById("reset-confirm-msg").remove();
      const confirmSpy = jest
        .spyOn(window, "confirm")
        .mockImplementation(() => false);

      document.getElementById("reset-btn").click();

      expect(confirmSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          "Möchten Sie den Rechner wirklich zurücksetzen",
        ),
      );
      confirmSpy.mockRestore();
    });
  });
});
