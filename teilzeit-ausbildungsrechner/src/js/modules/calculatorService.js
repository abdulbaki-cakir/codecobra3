/**
 * Service-Modul für die mathematische Logik des Rechners.
 * Enthält die Regeln zur Verkürzung, Teilzeit-Umrechnung und Sonderregeln (Deckelungen).
 */

import { RULES } from "./calculatorConfig.js";

/**
 * BERECHNUNGSSCHRITT 1:
 * Ermittelt die offizielle Verkürzung basierend auf Vorbildung/Alter.
 * Berücksichtigt dabei gesetzliche Obergrenzen und Mindestdauern.
 */
export function calculateShortening(selections, originalDuration) {
  const detailedShorteningReasons = [];
  const reasonConfig = RULES.reasons;
  let potentialShortening = 0;

  // 1. Summiere alle ausgewählten Anrechnungsgründe
  for (const id in reasonConfig) {
    const config = reasonConfig[id];
    const currentValue = parseInt(selections[id], 10) || 0;

    if (currentValue === 0) continue;

    let reasonText = "";
    let translationKey = "";
    if (id === "school-finish") {
      const optionConfig = config.options[currentValue];
      reasonText = optionConfig?.text || "Schulabschluss";
      translationKey = optionConfig?.translationKey || "";
    } else {
      reasonText = config.text;
      translationKey = config.translationKey || "";
    }

    const isVariable = config.isVariable || false;

    const currentReason = {
      reason: reasonText,
      translationKey,
      months: currentValue,
      isVariable,
    };

    potentialShortening += currentReason.months;
    detailedShorteningReasons.push(currentReason);
  }

  // 2. Deckel 1: Maximale Anrechnung (meist 12 Monate)
  const maxShorteningFromReasons =
    RULES.general_rules.max_shortening_from_reasons;
  const shorteningAfterReasonCap = Math.min(
    potentialShortening,
    maxShorteningFromReasons,
  );

  // 3. Deckel 2: Einhaltung der gesetzlichen Mindestausbildungsdauer
  const durationRule = RULES.minimum_durations.find(
    (rule) => originalDuration >= rule.original,
  );
  const minimumDuration = durationRule.min;
  const maxAllowedShorteningLegal = originalDuration - minimumDuration;

  // 4. Finales Ergebnis (Das Minimum aus beiden Deckeln gewinnt)
  const finalShortening = Math.min(
    shorteningAfterReasonCap,
    maxAllowedShorteningLegal,
  );

  // Markierung, falls ein Deckel die ursprüngliche Summe reduziert hat
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
 * Rechnet eine Vollzeit-Dauer in Teilzeit um (einfacher Dreisatz).
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
 * Orchestriert die gesamte Berechnung und wendet Sonderregeln an
 * (Geringfügigkeitsgrenze, maximale Gesamtverlängerung).
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

  // 2. Neue Basis-Dauer (Vollzeit) nach Verkürzung
  const newFullTimeDuration = originalDuration - officialShorteningMonths;

  // 3. Gesetzliche Mindestdauer ermitteln (für Anzeige in der View)
  const durationRule = RULES.minimum_durations.find(
    (rule) => originalDuration >= rule.original,
  );
  const legalMinimumDuration = durationRule.min;

  // 4. Berechnung der verbleibenden Restzeit (nach bereits geleisteten VZ-Monaten)
  let remainingFullTimeEquivalent = newFullTimeDuration - initialFullTimeMonths;
  if (remainingFullTimeEquivalent < 0) remainingFullTimeEquivalent = 0;

  // 5. Umrechnung der Restzeit in Teilzeit
  let remainingPartTimeDuration = calculatePartTimeDuration(
    remainingFullTimeEquivalent,
    fullTimeHours,
    partTimeHours,
  );

  // 6. Ermittlung der realen Verlängerung
  const realExtensionMonths =
    remainingPartTimeDuration - remainingFullTimeEquivalent;
  const realTotalDuration = initialFullTimeMonths + remainingPartTimeDuration;

  // 7. SONDERREGEL "Grace Period":
  // Verlängerungen unter der Geringfügigkeitsgrenze (z.B. 6 Monate) werden ignoriert.
  const gracePeriod = RULES.general_rules.part_time_grace_period_months;
  let finalExtensionMonths = realExtensionMonths;
  let finalTotalDuration = realTotalDuration;

  if (finalExtensionMonths > 0 && finalExtensionMonths <= gracePeriod) {
    finalExtensionMonths = 0;
    remainingPartTimeDuration = remainingFullTimeEquivalent;
    finalTotalDuration = initialFullTimeMonths + remainingPartTimeDuration;
  }

  // 8. SONDERREGEL "Maximalfaktor":
  // Prüft, ob die Gesamtdauer das 1.5-fache der Regeldauer überschreitet.
  const maxFactor = RULES.general_rules.max_duration_factor;
  const maxAllowedTotalDuration = Math.ceil(originalDuration * maxFactor);
  let extensionCapWasHit = realTotalDuration > maxAllowedTotalDuration;

  // Falls Grace-Period greift, darf der Cap-Hinweis nicht angezeigt werden
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
