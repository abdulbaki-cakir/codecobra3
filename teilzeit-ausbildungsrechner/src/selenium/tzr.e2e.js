import {
  createDriver,
  waitVisibleById,
  typeNumberById,
  clickRadioByNameAndValue,
  clickButtonById,
} from './selenium-helpers.e2e.js';

const BASE_URL = process.env.TZR_BASE_URL ?? 'http://localhost:5173';

export async function runTzrE2eTest() {
  // WebDriver erstellen (lokal oder Remote, je nach SELENIUM_REMOTE_URL)
  const driver = await createDriver();

  try {
    console.log(`Starte TZR-E2E-Test auf ${BASE_URL}`);

    // Startseite öffnen
    await driver.get(BASE_URL);
    await driver.sleep(1000); // kurze Stabilisierung nach Seitenstart

    // ===== STEP 1: Basisdaten =====
    console.log('Step 1: Basisdaten');

    // Vertragliche Vollzeit-Wochenstunden
    await typeNumberById(driver, 'vollzeitstunden', 40);

    // Geplante Teilzeit-Wochenstunden
    await typeNumberById(driver, 'wochenstunden', 30);

    // Reguläre Ausbildungsdauer (Vollzeit) in Monaten
    const ausbildungsdauerSelect = await waitVisibleById(driver, 'ausbildungsdauer');
    await ausbildungsdauerSelect.sendKeys('36');

    // Ausbildung startet direkt in Teilzeit
    await clickRadioByNameAndValue(driver, 'part-time-start-radio', '0');

    // Weiter zu Step 2
    await clickButtonById(driver, 'next-btn-1');

    // ===== STEP 2: Verkürzungsgründe =====
    console.log('Step 2: Verkürzungsgründe');

    // Sicherstellen, dass Step 2 sichtbar ist
    await waitVisibleById(driver, 'step-2');

    // Beispiel-Auswahl: über 21, mittlere Reife, Praktikum; Rest "Nein"
    await clickRadioByNameAndValue(driver, 'family-care-radio', '0');
    await clickRadioByNameAndValue(driver, 'age-radio', '12');
    await clickRadioByNameAndValue(driver, 'school-finish-radio', '6');
    await clickRadioByNameAndValue(driver, 'experience-radio', '12');
    await clickRadioByNameAndValue(driver, 'apprenticeship-radio', '0');
    await clickRadioByNameAndValue(driver, 'study-radio', '0');

    // Weiter zu Step 3
    await clickButtonById(driver, 'next-btn-2');

    // ===== STEP 3: Ergebnisse =====
    console.log('Step 3: Ergebnisse');

    // Sicherstellen, dass Step 3 sichtbar ist
    await waitVisibleById(driver, 'step-3');

    // Gesamtausbildungsdauer auslesen
    const finalDurationEl = await waitVisibleById(driver, 'final-duration-result', 15_000);
    const finalDurationText = await finalDurationEl.getText();
    console.log('Gesamtausbildungsdauer ab Beginn:', finalDurationText);

    // Detailansicht öffnen (Helper nutzt Scroll + JS-Klick für Stabilität)
    await clickButtonById(driver, 'toggle-details-btn');

    // Verkürzung / Verlängerung auslesen
    const shorteningEl = await waitVisibleById(driver, 'shortening-card-value');
    const extensionEl = await waitVisibleById(driver, 'extension-card-value');

    console.log('Gesamte Verkürzung (Monate):', await shorteningEl.getText());
    console.log('Verlängerung durch Teilzeit (Monate):', await extensionEl.getText());
  } catch (err) {
    // Fehler im Test → Exit-Code setzen, damit CI den Job als failed markiert
    console.error('TZR-E2E-Test fehlgeschlagen:', err);
    process.exitCode = 1;
  } finally {
    // Browser immer sauber schließen 
    await driver.quit();
  }
}

runTzrE2eTest().catch((err) => {
  console.error('TZR-E2E-Test – Unbehandelter Fehler:', err);
  process.exitCode = 1;
});
