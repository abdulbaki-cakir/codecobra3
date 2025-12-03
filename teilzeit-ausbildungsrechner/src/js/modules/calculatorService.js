import { RULES } from "./calculatorConfig.js";

/**
 * BERECHNUNGSSCHRITT 1:
 * Berechnet die offizielle Verkürzung (Neue Logik mit Deckeln).
 */
export function calculateShortening(selections, originalDuration) {
  const detailedShorteningReasons = [];
  const reasonConfig = RULES.reasons;
  let potentialShortening = 0;

  // 1. Sammle und summiere alle Werte
  for (const id in reasonConfig) {
    const config = reasonConfig[id];
    const currentValue = parseInt(selections[id], 10) || 0;

    if (currentValue === 0) continue;

    let reasonText = "";
    if (id === "school-finish") {
      reasonText = config.options[currentValue]?.text || "Schulabschluss";
    } else {
      reasonText = config.text;
    }

    // Prüfen ob der Grund variabel ist (Standard: false)
    const isVariable = config.isVariable || false;

    const currentReason = {
      reason: reasonText,
      months: currentValue,
      isVariable, // <--- HIER WURDE GEKÜRZT (Property Shorthand)
    };

    potentialShortening += currentReason.months;
    detailedShorteningReasons.push(currentReason);
  }

  // 2. Deckel 1: Max. 12 Monate aus Anrechnungsgründen
  const maxShorteningFromReasons =
    RULES.general_rules.max_shortening_from_reasons;
  const shorteningAfterReasonCap = Math.min(
    potentialShortening,
    maxShorteningFromReasons,
  );

  // 3. Deckel 2: Gesetzliche Mindestdauer
  const durationRule = RULES.minimum_durations.find(
    (rule) => originalDuration >= rule.original,
  );
  const minimumDuration = durationRule.min;
  const maxAllowedShorteningLegal = originalDuration - minimumDuration;

  // 4. Finales Ergebnis (Minimum aus beiden Deckeln)
  const finalShortening = Math.min(
    shorteningAfterReasonCap,
    maxAllowedShorteningLegal,
  );

  // Prüft ob Deckel erreicht wurde
  const capWasHit =
    potentialShortening > finalShortening ||
    finalShortening >= maxShorteningFromReasons;

  return {
    totalShortening: finalShortening,
    details: detailedShorteningReasons,
    capWasHit,
  };
}

/**
 * BERECHNUNGSSCHRITT 2:
 * Berechnet die Dauer in Teilzeit.
 */
export function calculatePartTimeDuration(
  fullTimeEquivalentDuration,
  fullTimeHours,
  partTimeHours,
) {
  if (!partTimeHours || partTimeHours <= 0 || partTimeHours >= fullTimeHours) {
    return fullTimeEquivalentDuration;
  }
  const finalDuration =
    fullTimeEquivalentDuration * (fullTimeHours / partTimeHours);
  return Math.round(finalDuration);
}

/**
 * FINALER BERECHNUNGSSCHRITT:
 * Berechnet alle Endergebnisse.
 */
export function calculateFinalResults(inputs) {
  const {
    originalDuration,
    fullTimeHours,
    partTimeHours,
    initialFullTimeMonths,
    selections,
  } = inputs;

  const partTimeHoursAvailable = partTimeHours && partTimeHours < fullTimeHours;

  // 1. Offizielle Verkürzung berechnen
  const shorteningResult = calculateShortening(selections, originalDuration);
  const officialShorteningMonths = shorteningResult.totalShortening;

  // 2. Neue Dauer (Vollzeit)
  const newFullTimeDuration = originalDuration - officialShorteningMonths;

  // 3. Gesetzliche Mindestdauer finden (für View-Logik)
  const durationRule = RULES.minimum_durations.find(
    (rule) => originalDuration >= rule.original,
  );
  const legalMinimumDuration = durationRule.min;

  // 4. Verbleibende VZ-Äquivalente (Restzeit)
  let remainingFullTimeEquivalent = newFullTimeDuration - initialFullTimeMonths;
  if (remainingFullTimeEquivalent < 0) remainingFullTimeEquivalent = 0;

  // 5. Restzeit bei Teilzeit
  let remainingPartTimeDuration = calculatePartTimeDuration(
    remainingFullTimeEquivalent,
    fullTimeHours,
    partTimeHours,
  );

  // 6. Reale Verlängerung / Gesamtdauer
  const realExtensionMonths =
    remainingPartTimeDuration - remainingFullTimeEquivalent;
  const realTotalDuration = initialFullTimeMonths + remainingPartTimeDuration;

  // 7. SONDERREGEL (Grace Period)
  const gracePeriod = RULES.general_rules.part_time_grace_period_months;
  let finalExtensionMonths = realExtensionMonths;
  let finalTotalDuration = realTotalDuration;

  if (finalExtensionMonths > 0 && finalExtensionMonths <= gracePeriod) {
    finalExtensionMonths = 0;
    remainingPartTimeDuration = remainingFullTimeEquivalent;
    finalTotalDuration = initialFullTimeMonths + remainingPartTimeDuration;
  }

  // 8. SONDERREGEL (1.5x Obergrenze)
  const maxFactor = RULES.general_rules.max_duration_factor;
  const maxAllowedTotalDuration = Math.ceil(originalDuration * maxFactor);
  let extensionCapWasHit = realTotalDuration > maxAllowedTotalDuration;

  if (extensionCapWasHit && finalExtensionMonths === 0) {
    extensionCapWasHit = false;
  }

  return {
    originalDuration,
    fullTimeHours,
    partTimeHours,
    partTimeHoursAvailable,
    initialFullTimeMonths,
    shorteningResult,
    officialShorteningMonths,
    capWasHitShortening: shorteningResult.capWasHit,
    newFullTimeDuration,
    legalMinimumDuration,
    remainingFullTimeEquivalent,
    finalExtensionMonths,
    finalTotalDuration,
    extensionCapWasHit,
    maxAllowedTotalDuration,
    gracePeriod,
  };
}
