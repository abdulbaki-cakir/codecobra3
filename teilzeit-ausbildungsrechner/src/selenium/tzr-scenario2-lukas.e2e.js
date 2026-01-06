import {
  createDriver,
  waitVisibleById,
  typeNumberById,
  clickRadioByNameAndValue,
  clickButtonById,
} from './selenium-helpers.e2e.js';

const BASE_URL = process.env.TZR_BASE_URL ?? 'http://localhost:5173';

export async function runScenarioLukas() {
  // WebDriver erstellen (lokal oder CI-Remote)
  const driver = await createDriver();

  try {
    console.log(
      'Starte Szenario 2 – Lukas (19), Einzelhandel, Teilzeit 30h, 42 Monate.'
    );

    // Startseite öffnen
    await driver.get(`${BASE_URL}/`);
    await driver.sleep(500); // kurze Stabilisierung nach Seitenstart

    // ===== STEP 1: Basisdaten =====
    console.log('Step 1: Basisdaten ausfüllen');

    // Vertragliche Vollzeitstunden
    await typeNumberById(driver, 'vollzeitstunden', 40);

    // Teilzeit-Wochenstunden
    await typeNumberById(driver, 'wochenstunden', 30);

    // Reguläre Ausbildungsdauer in Monaten
    const ausbildungsdauerSelect = await waitVisibleById(
      driver,
      'ausbildungsdauer'
    );
    await ausbildungsdauerSelect.sendKeys('42');

    // Ausbildung startet direkt in Teilzeit
    await clickRadioByNameAndValue(driver, 'part-time-start-radio', '0');

    // Wechsel zu Step 2
    await clickButtonById(driver, 'next-btn-1');

    // ===== STEP 2: Verkürzungsgründe =====
    console.log('Step 2: Verkürzungsfaktoren setzen');

    // Sicherstellen, dass Step 2 sichtbar ist
    await waitVisibleById(driver, 'step-2');

    // Keine Pflege von Angehörigen oder Kindern
    await clickRadioByNameAndValue(driver, 'family-care-radio', '0');
    // Lukas ist 19 → nicht über 21
    await clickRadioByNameAndValue(driver, 'age-radio', '0');

    // Schulabschluss: Abitur
    await clickRadioByNameAndValue(driver, 'school-finish-radio', '12');

    // Relevante Berufserfahrung: Praktikum im Verkauf
    await clickRadioByNameAndValue(driver, 'experience-radio', '12');

    // Keine abgeschlossene Ausbildung
    await clickRadioByNameAndValue(driver, 'apprenticeship-radio', '0');

    // Kein Studium (im Szenario nicht vorhanden)
    await clickRadioByNameAndValue(driver, 'study-radio', '0');

    // Wechsel zu Step 3
    await clickButtonById(driver, 'next-btn-2');

    // ===== STEP 3: Ergebnisse =====
    console.log('Step 3: Ergebnisse prüfen');

    // Sicherstellen, dass Ergebnis-Seite geladen ist
    await waitVisibleById(driver, 'step-3');

    // Gesamtausbildungsdauer auslesen
    const finalDurationEl = await waitVisibleById(
      driver,
      'final-duration-result',
      15_000
    );
    const finalDurationText = await finalDurationEl.getText();

    console.log(
      'Gesamtausbildungsdauer ab Beginn (Lukas, Szenario 2):',
      finalDurationText
    );

    // Detailansicht öffnen
    await clickButtonById(driver, 'toggle-details-btn');

    // Verkürzungs- und Verlängerungswerte auslesen
    const shorteningEl = await waitVisibleById(driver, 'shortening-card-value');
    const extensionEl = await waitVisibleById(driver, 'extension-card-value');

    console.log('Gesamte Verkürzung (Monate):', await shorteningEl.getText());
    console.log(
      'Verlängerung durch Teilzeit (Monate):',
      await extensionEl.getText()
    );

    console.log('Szenario 2 – Testlauf erfolgreich abgeschlossen.');
  } catch (err) {
    // Fehler im Szenario → Pipeline/Testlauf als fehlgeschlagen markieren
    console.error('Szenario 2 – Test fehlgeschlagen:', err);
    process.exitCode = 1;
  } finally {
    // Browser immer sauber schließen
    await driver.quit();
  }
}

runScenarioLukas().catch((err) => {
  console.error('Szenario 2 – Unbehandelter Fehler:', err);
  process.exitCode = 1;
});