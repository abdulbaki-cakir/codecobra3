import { getTranslation } from "./language.js";

// ======================================================
// Helpers
// ======================================================

function formatTranslation(key, params = {}) {
  let text = getTranslation(key) || "";
  for (const [k, v] of Object.entries(params)) {
    text = text.replaceAll(`{${k}}`, String(v));
  }
  return text;
}

function setError(inputEl, popupEl, key, params = {}) {
  const span = popupEl?.querySelector("span");
  if (!span) return;

  // Key als Source-of-Truth (wichtig für späteres Re-Translate)
  span.dataset.translateKey = key;

  // Text aus i18n holen (mit Template-Parametern)
  span.textContent =
    Object.keys(params).length > 0
      ? formatTranslation(key, params)
      : getTranslation(key) || "";

  popupEl.classList.add("visible");
  inputEl.classList.add("invalid");
}

function clearError(inputEl, popupEl) {
  const span = popupEl?.querySelector("span");
  if (span) {
    span.dataset.translateKey = "";
    span.textContent = "";
  }

  popupEl?.classList.remove("visible");
  inputEl?.classList.remove("invalid");
}

// ======================================================
// Step 1 Validation
// ======================================================

/**
 * 1) Vollzeitstunden
 * Prüft: leer, Zahl, 35-48, 0.5er Schritte
 */
export function validateVollzeitstunden(showErrorIfEmpty = false) {
  const input = document.getElementById("vollzeitstunden");
  const popup = document.getElementById("vollzeitstunden-error");
  if (!input || !popup) return false;

  const value = input.value.trim();

  if (value === "") {
    if (showErrorIfEmpty) {
      setError(input, popup, "error_fulltime_required");
    } else {
      clearError(input, popup);
    }
    return false;
  }

  const numValue = parseFloat(value.replace(",", "."));
  const isMultipleOfHalf = Math.round(numValue * 100) % 50 === 0;

  if (Number.isNaN(numValue)) {
    setError(input, popup, "error_number_invalid");
    return false;
  }

  if (numValue < 35 || numValue > 48) {
    setError(input, popup, "error_fulltime_range");
    return false;
  }

  if (!isMultipleOfHalf) {
    setError(input, popup, "error_half_steps");
    return false;
  }

  clearError(input, popup);
  return true;
}

/**
 * 2) Teilzeit-Wochenstunden
 * Prüft: leer, Zahl, 0.5er Schritte, >=50% von Vollzeit, < Vollzeit
 */
export function validateWochenstunden(showErrorIfEmpty = false) {
  const input = document.getElementById("wochenstunden");
  const popup = document.getElementById("wochenstunden-error");
  const vollzeitInput = document.getElementById("vollzeitstunden");
  if (!input || !popup || !vollzeitInput) return false;

  const value = input.value.trim();

  const vollzeitNum = parseFloat(vollzeitInput.value.trim().replace(",", "."));
  const hasValidVollzeit = !Number.isNaN(vollzeitNum) && vollzeitNum > 0;

  if (value === "") {
    if (showErrorIfEmpty) {
      setError(input, popup, "error_parttime_required");
    } else {
      clearError(input, popup);
    }
    return false;
  }

  const numValue = parseFloat(value.replace(",", "."));
  const isMultipleOfHalf = Math.round(numValue * 100) % 50 === 0;

  if (Number.isNaN(numValue)) {
    setError(input, popup, "error_number_invalid");
    return false;
  }

  if (hasValidVollzeit) {
    const minFiftyPercent = vollzeitNum * 0.5;

    if (numValue < minFiftyPercent) {
      const minString = String(minFiftyPercent).replace(".", ",");
      setError(input, popup, "error_parttime_minimum", { min: minString });
      return false;
    }

    if (numValue >= vollzeitNum) {
      setError(input, popup, "error_parttime_less_than_full");
      return false;
    }
  }

  if (!isMultipleOfHalf) {
    setError(input, popup, "error_half_steps");
    return false;
  }

  clearError(input, popup);
  return true;
}

/**
 * 3) Monate in Vollzeit
 * Nur aktiv, wenn "später Teilzeit" gewählt ist.
 */
export function validateVollzeitMonate(showErrorIfEmpty = false) {
  const selected = document.querySelector(
    'input[name="part-time-start-radio"]:checked',
  );

  // Wenn nicht relevant: immer valid
  if (!selected || selected.value !== "1") return true;

  const input = document.getElementById("vollzeit-monate");
  const dauerSelect = document.getElementById("ausbildungsdauer");
  const popup = document.getElementById("vollzeit-monate-error");
  if (!input || !dauerSelect || !popup) return false;

  const monateValue = input.value.trim();
  const dauerNum = parseInt(dauerSelect.value, 10);

  if (monateValue === "") {
    if (showErrorIfEmpty) {
      setError(input, popup, "error_months_required");
    } else {
      clearError(input, popup);
    }
    return false;
  }

  const monateNum = parseInt(monateValue, 10);

  if (Number.isNaN(monateNum) || monateNum <= 0) {
    setError(input, popup, "error_number_positive");
    return false;
  }

  if (!Number.isNaN(dauerNum) && monateNum >= dauerNum) {
    setError(input, popup, "error_months_less_than", { max: dauerNum });
    return false;
  }

  clearError(input, popup);
  return true;
}

/**
 * Reset für Vollzeit-Monate Validierung
 */
export function resetVollzeitMonateValidation() {
  const input = document.getElementById("vollzeit-monate");
  const popup = document.getElementById("vollzeit-monate-error");

  if (input && popup) {
    clearError(input, popup);
  }
}
