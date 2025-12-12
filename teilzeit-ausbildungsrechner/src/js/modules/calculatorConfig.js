/**
 * Konfigurationsdatei für den Teilzeit-Ausbildungsrechner.
 */
export const RULES = {
  /**
   * Definiert die Anrechnungsgründe, ihre Werte und Anzeigetexte.
   * isVariable: true  -> Fügt "bis zu" in der Anzeige hinzu (Ermessenssache/Variabel)
   * isVariable: false -> Fester Wert (Pauschal)
   */
  reasons: {
    "age-select": {
      text: "Alter über 21 Jahre",
      translationKey: "reason_age_over21",
      value: 12,
      isVariable: false, // Fest
    },
    "school-finish": {
      isVariable: false, // Fest
      options: {
        0: {
          text: "Kein/Hauptschulabschluss",
          translationKey: "reason_school_none",
          value: 0,
        },
        6: {
          text: "Mittlere Reife / Realschulabschluss",
          translationKey: "reason_school_mid",
          value: 6,
        },
        12: {
          text: "Fachhochschulreife / Abitur",
          translationKey: "reason_school_high",
          value: 12,
        },
      },
    },
    "experience-select": {
      text: "Erste Berufserfahrung / EQ",
      translationKey: "reason_experience_eq",
      value: 12,
      isVariable: true, // Variabel
    },
    "apprenticeship-select": {
      text: "Abgeschlossene Berufsausbildung",
      translationKey: "reason_apprenticeship",
      value: 12,
      isVariable: false, // Fest?
    },
    "study-select": {
      text: "Passende Studienleistungen",
      translationKey: "reason_study",
      value: 12,
      isVariable: true, // Variabel
    },
    "child-care-select": {
      text: "Betreuung eigener Kinder",
      translationKey: "reason_childcare",
      value: 12,
      isVariable: true, // Variabel
    },
    "family-care-select": {
      text: "Pflege naher Angehöriger",
      translationKey: "reason_familycare",
      value: 12,
      isVariable: true, // Variabel
    },
  },

  /**
   * Definiert die gesetzlichen Mindestausbildungsdauern.
   */
  minimum_durations: [
    { original: 42, min: 24 },
    { original: 36, min: 18 },
    { original: 24, min: 12 },
    { original: 0, min: 0 },
  ],

  general_rules: {
    // Verkürzung Deckel
    max_shortening_from_reasons: 12,
    // Maximale Verlängerung ist 1.5x der Regeldauer
    max_duration_factor: 1.5,
    // Verlängerungen bis zu dieser Höhe werden ignoriert
    part_time_grace_period_months: 6,
  },
};
