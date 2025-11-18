/**
 * Konfigurationsdatei für den Teilzeit-Ausbildungsrechner.
 */
export const RULES = {
  /**
   * Definiert die Anrechnungsgründe, ihre Werte und Anzeigetexte.
   */
  reasons: {
    "age-select": {
      text: "Alter über 21 Jahre",
      value: 12,
    },
    "school-finish": {
      options: {
        0: { text: "Kein/Hauptschulabschluss", value: 0 },
        6: { text: "Mittlere Reife / Realschulabschluss", value: 6 },
        12: { text: "Fachhochschulreife / Abitur", value: 12 },
      },
    },
    "experience-select": {
      text: "Erste Berufserfahrung / EQ",
      value: 12,
    },
    "apprenticeship-select": {
      text: "Abgeschlossene Berufsausbildung",
      value: 12,
    },
    "study-select": {
      text: "Passende Studienleistungen",
      value: 12,
    },
    "child-care-select": {
      text: "Betreuung eigener Kinder",
      value: 12,
    },
    "family-care-select": {
      text: "Pflege naher Angehöriger",
      value: 12,
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
