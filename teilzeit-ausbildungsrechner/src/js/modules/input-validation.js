import {getTranslation } from "./language.js";
// =====================================================================
// --- VALIDIERUNGSFUNKTIONEN FÜR STEP 1 ---
// =====================================================================

/**
 * 1. FUNKTION: Validiert Vollzeitstunden (Feld 1)
 * Prüft auf: Zahl, Bereich 35-48h, 0,5er Schritte.
 */
export function validateVollzeitstunden(showErrorIfEmpty = false) {
  const vollzeitInput = document.getElementById("vollzeitstunden");
  const errorPopup = document.getElementById("vollzeitstunden-error");
  const errorTextSpan = errorPopup ? errorPopup.querySelector("span") : null;

  if (!vollzeitInput || !errorPopup || !errorTextSpan) return false;

  let isValid = true;
  let errorKey = "";
  const value = vollzeitInput.value.trim();

  // Leeres Feld prüfen
  if (value === "") {
    if (showErrorIfEmpty) {
      errorKey = "error_fulltime_required";
      isValid = false;
    } else {
      isValid = false;
    }
  } else {
    // Komma zu Punkt für JS-Float
    const numValue = parseFloat(value.replace(",", "."));

    // Logik für 0,5er Schritte: (Wert * 100) muss durch 50 teilbar sein (Rest 0)
    const isMultipleOfHalf = Math.round(numValue * 100) % 50 === 0;

    if (isNaN(numValue)) {
      errorKey = "error_fulltime_invalid";
      isValid = false;
    } else if (numValue < 35 || numValue > 48) {
      errorKey = "error_fulltime_range";
      isValid = false;
    } else if (!isMultipleOfHalf) {
      errorKey = "error_half_steps";
      isValid = false;
    }
  }

  // UI-Update: Fehler anzeigen oder entfernen
  if (!isValid && errorKey) {
    errorTextSpan.textContent = getTranslation(errorKey);
    errorPopup.classList.add("visible");
    vollzeitInput.classList.add("invalid");
  } else {
    errorTextSpan.textContent = "";
    errorPopup.classList.remove("visible");
    vollzeitInput.classList.remove("invalid");
  }
  return isValid;
}

/**
 * 2. FUNKTION: Validiert Teilzeit-Wochenstunden (Feld 2)
 * WICHTIG: Hängt vom Wert der Vollzeitstunden ab (min. 50%).
 */
export function validateWochenstunden(showErrorIfEmpty = false) {
  const wochenstundenInput = document.getElementById("wochenstunden");
  const errorPopup = document.getElementById("wochenstunden-error");
  const errorTextSpan = errorPopup ? errorPopup.querySelector("span") : null;
  const vollzeitInput = document.getElementById("vollzeitstunden");

  if (!wochenstundenInput || !errorPopup || !errorTextSpan || !vollzeitInput) {
    return false;
  }

  // Referenzwert aus dem Vollzeit-Feld holen
  const vollzeitNum = parseFloat(vollzeitInput.value.trim().replace(",", "."));

  // Prüfen, ob wir einen validen Vergleichswert haben
  const hasValidVollzeit = !isNaN(vollzeitNum) && vollzeitNum > 0;

  let isValid = true;
  let errorKey = "";
  const value = wochenstundenInput.value.trim();

  if (value === "") {
    if (showErrorIfEmpty) {
      errorKey = "error_parttime_required";
      isValid = false;
    } else {
      isValid = false;
    }
  } else {
    const numValue = parseFloat(value.replace(",", "."));
    const isMultipleOfHalf = Math.round(numValue * 100) % 50 === 0;

    // Mindestgrenze berechnen: Teilzeit muss ≥ 50% der Vollzeit sein (BBiG Regelung)
    const minFiftyPercent = hasValidVollzeit ? vollzeitNum * 0.5 : 0;

    if (isNaN(numValue)) {
      errorKey = "error_parttime_minimum";
      isValid = false;
    }
    // Prüfung auf Mindeststunden (50% Regel)
    else if (hasValidVollzeit && numValue < minFiftyPercent) {
      errorKey = "error_parttime_minimum";
      isValid = false;
    }
    // Prüfung: Darf nicht mehr oder gleich Vollzeit sein
    else if (hasValidVollzeit && numValue >= vollzeitNum) {
      errorKey = "error_parttime_less_than_full";
      isValid = false;
    }
    // Prüfung: 0,5er Schritte
    else if (!isMultipleOfHalf) {
      errorKey = "error_half_steps";
      isValid = false;
    }
  }

  // UI-Update
  if (!isValid && errorKey) {
    errorTextSpan.textContent = getTranslation(errorKey);
    errorPopup.classList.add("visible");
    wochenstundenInput.classList.add("invalid");
  } else {
    errorTextSpan.textContent = "";
    errorPopup.classList.remove("visible");
    wochenstundenInput.classList.remove("invalid");
  }
  return isValid;
}

/**
 * 3. FUNKTION: Validiert "Monate in Vollzeit" (Feld 3)
 * Nur aktiv, wenn Option "Teilzeit erst später starten" gewählt wurde.
 */
export function validateVollzeitMonate(showErrorIfEmpty = false) {
  // 1. Prüfen, ob das Feld überhaupt relevant/sichtbar ist
  const isSwitchLaterRadio = document.querySelector(
    'input[name="part-time-start-radio"]:checked',
  );

  // Wenn "Sofort Teilzeit" (Value 0) gewählt ist -> Validation überspringen (ist immer valid)
  if (!isSwitchLaterRadio || isSwitchLaterRadio.value !== "1") {
    return true;
  }

  const monateInput = document.getElementById("vollzeit-monate");
  const dauerSelect = document.getElementById("ausbildungsdauer");
  const errorPopup = document.getElementById("vollzeit-monate-error");
  const errorTextSpan = errorPopup ? errorPopup.querySelector("span") : null;

  if (!monateInput || !dauerSelect || !errorPopup || !errorTextSpan)
    return false;

  const monateValue = monateInput.value.trim();
  // Gesamtdauer der Ausbildung als Obergrenze
  const dauerNum = parseInt(dauerSelect.value, 10);

  let isValid = true;
  let errorKey = "";
  if (monateValue === "") {
    if (showErrorIfEmpty) {
      errorKey = "error_months_required";
      isValid = false;
    } else {
      isValid = false;
    }
  } else {
    const monateNum = parseInt(monateValue, 10);

    // Logik: Muss > 0 sein und kleiner als die Gesamtdauer
    if (isNaN(monateNum) || monateNum <= 0) {
      errorKey = "error_number_positive";
      isValid = false;
    } else if (monateNum >= dauerNum) {
      isValid = false;
    }
  }

  // UI-Update
  if (!isValid && errorKey) {
    errorTextSpan.textContent = getTranslation(errorKey);
    errorPopup.classList.add("visible");
    monateInput.classList.add("invalid");
  } else {
    errorTextSpan.textContent = "";
    errorPopup.classList.remove("visible");
    monateInput.classList.remove("invalid");
  }
  return isValid;
}

/**
 * 4. HELPER: Setzt den Fehlerstatus für "Monate in Vollzeit" zurück.
 * Wird genutzt, wenn der User von "Später" auf "Sofort" zurückschaltet.
 */
export function resetVollzeitMonateValidation() {
  const vollzeitMonateInput = document.getElementById("vollzeit-monate");
  const errorPopup = document.getElementById("vollzeit-monate-error");
  const errorTextSpan = errorPopup ? errorPopup.querySelector("span") : null;

  if (errorPopup && errorTextSpan) {
    errorTextSpan.textContent = "";
    errorPopup.classList.remove("visible");
  }
  if (vollzeitMonateInput) {
    vollzeitMonateInput.classList.remove("invalid");
  }
}
