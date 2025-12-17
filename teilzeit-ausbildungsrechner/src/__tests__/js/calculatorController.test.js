/** @jest-environment jsdom */
import { jest } from "@jest/globals";

const mockView = {
  getFormInputs: jest.fn(),
  renderResults: jest.fn(),
  linkRadiosToSelect: jest.fn(),
  showStep: jest.fn(),
  setupPartTimeSwitch: jest.fn(),
  setupDetailsToggle: jest.fn(),
};

const mockValidation = {
  validateVollzeitstunden: jest.fn(),
  validateWochenstunden: jest.fn(),
  validateVollzeitMonate: jest.fn(),
};

const mockNavigation = {
  scrollToCalculator: jest.fn(),
};

const mockService = {
  calculateFinalResults: jest.fn(),
};

jest.mock("../../js/modules/calculatorView.js", () => mockView);
jest.mock("../../js/modules/input-validation.js", () => mockValidation);
jest.mock("../../js/modules/navigation.js", () => mockNavigation);
jest.mock("../../js/modules/calculatorService.js", () => mockService);

describe("calculatorController.initializeCalculator", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    document.body.innerHTML = `
      <button id="next-btn-1"></button>
      <button id="back-btn-2"></button>
      <button id="next-btn-2"></button>
      <button id="back-btn-3"></button>
      <input id="vollzeitstunden" value="40" />
      <input id="wochenstunden" value="20" />
      <input id="vollzeit-monate" value="0" />
      <select id="ausbildungsdauer"><option value="36">36</option></select>
      <input type="radio" name="part-time-start-radio" value="0" />
      <input type="radio" name="part-time-start-radio" value="1" />
    `;
    // Default: Validierungen bestehen
    mockValidation.validateVollzeitstunden.mockReturnValue(true);
    mockValidation.validateWochenstunden.mockReturnValue(true);
    mockValidation.validateVollzeitMonate.mockReturnValue(true);
  });

  test("setzt initiale UI auf und verknüpft Radios", async () => {
    const controller = await import(
      "../../js/modules/calculatorController.js"
    );
    controller.initializeCalculator();

    expect(mockView.linkRadiosToSelect).toHaveBeenCalledTimes(7);
    expect(mockView.showStep).toHaveBeenCalledWith(1);
    expect(mockView.setupPartTimeSwitch).toHaveBeenCalled();
    expect(mockView.setupDetailsToggle).toHaveBeenCalled();
  });

  test("Next Step 1->2 nur wenn Validierung true und scrollt", async () => {
    const controller = await import(
      "../../js/modules/calculatorController.js"
    );
    controller.initializeCalculator();

    document.getElementById("next-btn-1").click();

    expect(mockValidation.validateVollzeitstunden).toHaveBeenCalledWith(true);
    expect(mockValidation.validateWochenstunden).toHaveBeenCalledWith(true);
    expect(mockValidation.validateVollzeitMonate).toHaveBeenCalledWith(true);
    expect(mockView.showStep).toHaveBeenLastCalledWith(2);
    expect(mockNavigation.scrollToCalculator).toHaveBeenCalled();
  });

  test("Next Step 2->3 führt Berechnung aus und rendert Ergebnisse", async () => {
    const controller = await import(
      "../../js/modules/calculatorController.js"
    );
    controller.initializeCalculator();

    const fakeInputs = { originalDuration: 36 };
    const fakeResults = { total: 42 };
    mockView.getFormInputs.mockReturnValue(fakeInputs);
    mockService.calculateFinalResults.mockReturnValue(fakeResults);

    document.getElementById("next-btn-2").click();

    expect(mockView.getFormInputs).toHaveBeenCalled();
    expect(mockService.calculateFinalResults).toHaveBeenCalledWith(fakeInputs);
    expect(mockView.renderResults).toHaveBeenCalledWith(fakeResults);
    expect(mockView.showStep).toHaveBeenLastCalledWith(3);
    expect(mockNavigation.scrollToCalculator).toHaveBeenCalled();
  });

  test("Back Buttons navigieren korrekt", async () => {
    const controller = await import(
      "../../js/modules/calculatorController.js"
    );
    controller.initializeCalculator();

    document.getElementById("back-btn-2").click();
    expect(mockView.showStep).toHaveBeenLastCalledWith(1);

    document.getElementById("back-btn-3").click();
    expect(mockView.showStep).toHaveBeenLastCalledWith(2);
  });

  test("Änderung Part-Time-Radio triggert Re-Validation", async () => {
    const controller = await import(
      "../../js/modules/calculatorController.js"
    );
    controller.initializeCalculator();

    const radios = document.querySelectorAll(
      'input[name="part-time-start-radio"]',
    );
    radios[0].dispatchEvent(new Event("change", { bubbles: true }));

    expect(mockValidation.validateVollzeitMonate).toHaveBeenCalledWith(false);
  });

  test("Step 1 Weiter bricht ab, wenn Validierung fehlschlägt", async () => {
    mockValidation.validateVollzeitstunden.mockReturnValue(false);
    const controller = await import(
      "../../js/modules/calculatorController.js"
    );
    controller.initializeCalculator();
    mockView.showStep.mockClear();

    document.getElementById("next-btn-1").click();

    expect(mockView.showStep).not.toHaveBeenCalledWith(2);
    expect(mockNavigation.scrollToCalculator).not.toHaveBeenCalled();
  });
});
