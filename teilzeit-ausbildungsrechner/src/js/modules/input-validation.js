// =====================================================================
// --- VALIDIERUNGSFUNKTIONEN FÜR STEP 1 ---
// =====================================================================

/**
 * 1. FUNKTION: Validiert Vollzeitstunden (Feld 1)
 */
export function validateVollzeitstunden(showErrorIfEmpty = false) {
  const vollzeitInput = document.getElementById("vollzeitstunden");
  const errorPopup = document.getElementById("vollzeitstunden-error");
  const errorTextSpan = errorPopup ? errorPopup.querySelector("span") : null;

  if (!vollzeitInput || !errorPopup || !errorTextSpan) return false;

  let isValid = true;
  let errorMessage = "";
  const value = vollzeitInput.value.trim();

  if (value === "") {
    if (showErrorIfEmpty) {
      errorMessage = "Bitte die Vollzeitstunden eingeben.";
      isValid = false;
    } else {
      isValid = false;
    }
  } else {
    const numValue = parseFloat(value.replace(",", "."));

    // Prüfen, ob der Wert ein Vielfaches von 0.5 ist: (Wert * 100) muss durch 50 teilbar sein
    const isMultipleOfHalf = Math.round(numValue * 100) % 50 === 0;

    if (isNaN(numValue)) {
      errorMessage = "Bitte eine gültige Zahl eingeben.";
      isValid = false;
    } else if (numValue < 35 || numValue > 48) {
      errorMessage = "Wert muss zwischen 35 und 48 liegen.";
      isValid = false;
    } else if (!isMultipleOfHalf) {
      errorMessage = "Nur 0,5er Schritte (z.B. 37, 37,5 oder 38) sind erlaubt.";
      isValid = false;
    }
  }

  if (!isValid && errorMessage) {
    errorTextSpan.textContent = errorMessage;
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
 */
export function validateWochenstunden(showErrorIfEmpty = false) {
  const wochenstundenInput = document.getElementById("wochenstunden");
  const errorPopup = document.getElementById("wochenstunden-error");
  const errorTextSpan = errorPopup ? errorPopup.querySelector("span") : null;
  const vollzeitInput = document.getElementById("vollzeitstunden");

  if (!wochenstundenInput || !errorPopup || !errorTextSpan || !vollzeitInput) {
    return false;
  }

  // Vollzeit-Wert holen
  const vollzeitNum = parseFloat(vollzeitInput.value.trim().replace(",", "."));

  // Prüfen, ob wir einen validen Vergleichswert haben (Zahl und > 0)
  const hasValidVollzeit = !isNaN(vollzeitNum) && vollzeitNum > 0;

  let isValid = true;
  let errorMessage = "";
  const value = wochenstundenInput.value.trim();

  if (value === "") {
    if (showErrorIfEmpty) {
      errorMessage = "Bitte die gewünschten Stunden eingeben.";
      isValid = false;
    } else {
      isValid = false;
    }
  } else {
    const numValue = parseFloat(value.replace(",", "."));
    const isMultipleOfHalf = Math.round(numValue * 100) % 50 === 0;

    // Berechnung der 50%-Grenze
    const minFiftyPercent = hasValidVollzeit ? vollzeitNum * 0.5 : 0;

    if (isNaN(numValue)) {
      errorMessage = "Bitte eine Zahl eingeben.";
      isValid = false;
    }
    // NEU: Prüfung auf 50% der Vollzeit (statt starrer 20-36 Grenze)
    else if (hasValidVollzeit && numValue < minFiftyPercent) {
      const minString = minFiftyPercent.toString().replace(".", ",");
      errorMessage = `Teilzeit muss mind. 50% der Vollzeit sein (mind. ${minString} Std.).`;
      isValid = false;
    }
    // Prüfung: Darf nicht mehr oder gleich Vollzeit sein
    else if (hasValidVollzeit && numValue >= vollzeitNum) {
      errorMessage = "Es muss weniger als Vollzeit sein.";
      isValid = false;
    }
    // Prüfung: 0,5er Schritte
    else if (!isMultipleOfHalf) {
      errorMessage = "Nur 0,5er Schritte (z.B. 20, 20,5 oder 21) sind erlaubt.";
      isValid = false;
    }
  }

  if (!isValid && errorMessage) {
    errorTextSpan.textContent = errorMessage;
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
 */
export function validateVollzeitMonate(showErrorIfEmpty = false) {
  // 1. Prüfen, ob das Feld überhaupt aktiv ist
  const isSwitchLaterRadio = document.querySelector(
    'input[name="part-time-start-radio"]:checked',
  );

  if (!isSwitchLaterRadio || isSwitchLaterRadio.value !== "1") {
    return true;
  }

  // 2. Elemente holen
  const monateInput = document.getElementById("vollzeit-monate");
  const dauerSelect = document.getElementById("ausbildungsdauer");
  const errorPopup = document.getElementById("vollzeit-monate-error");
  const errorTextSpan = errorPopup ? errorPopup.querySelector("span") : null;

  if (!monateInput || !dauerSelect || !errorPopup || !errorTextSpan)
    return false;

  // 3. Werte holen
  const monateValue = monateInput.value.trim();
  const dauerNum = parseInt(dauerSelect.value, 10);

  let isValid = true;
  let errorMessage = "";

  // 4. Logik anwenden
  if (monateValue === "") {
    if (showErrorIfEmpty) {
      errorMessage = "Bitte Monate eingeben.";
      isValid = false;
    } else {
      isValid = false;
    }
  } else {
    const monateNum = parseInt(monateValue, 10);
    if (isNaN(monateNum) || monateNum <= 0) {
      errorMessage = "Bitte eine gültige Zahl > 0 eingeben.";
      isValid = false;
    } else if (monateNum >= dauerNum) {
      errorMessage = `Muss kleiner als ${dauerNum} Monate sein.`;
      isValid = false;
    }
  }

  // 5. DOM aktualisieren
  if (!isValid && errorMessage) {
    errorTextSpan.textContent = errorMessage;
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
 * Wird von calculatorView.js (setupPartTimeSwitch) aufgerufen.
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
