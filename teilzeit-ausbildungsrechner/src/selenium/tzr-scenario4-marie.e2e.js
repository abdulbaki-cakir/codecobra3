import {
  createDriver,
  waitVisibleById,
  typeNumberById,
  clickRadioByNameAndValue,
  clickButtonById,
} from './selenium-helpers.e2e.js';

const BASE_URL = process.env.TZR_BASE_URL ?? 'http://localhost:5173';

export async function runScenarioMarie() {
  // WebDriver erstellen (lokal oder CI-Remote)
  const driver = await createDriver();

  try {
    console.log(
      'Starte Szenario 4 – Marie (28), Kind + Pflege Mutter, Wechsel nach 12 Monaten in Teilzeit (25/39), regulär 42 Monate.'
    );

    await driver.get(`${BASE_URL}/`);
    await driver.sleep(500);

    // --- STEP 1: Basisdaten ---
    console.log('Step 1: Basisdaten ausfüllen');

    // Übliche Vollzeit: 39 Stunden
    await typeNumberById(driver, 'vollzeitstunden', 39);

    // Teilzeit: 25 Stunden
    await typeNumberById(driver, 'wochenstunden', 25);

    // Ausbildungsdauer: 42 Monate
    const ausbildungsdauerSelect = await waitVisibleById(driver, 'ausbildungsdauer');
    await ausbildungsdauerSelect.sendKeys('42');

    // Erst Vollzeit, später Teilzeit
    await clickRadioByNameAndValue(driver, 'part-time-start-radio', '1');

    // Monate in Vollzeit am Anfang: 12 (erstes Jahr)
    await typeNumberById(driver, 'vollzeit-monate', 12);

    // Weiter zu Step 2
    await clickButtonById(driver, 'next-btn-1');

    // --- STEP 2: Verkürzungsgründe ---
    console.log('Step 2: Verkürzungsfaktoren setzen');
    await waitVisibleById(driver, 'step-2');

    // Pflege Angehörige (Mutter)
    await clickRadioByNameAndValue(driver, 'family-care-radio', '12');
    // Marie ist 28 → über 21
    await clickRadioByNameAndValue(driver, 'age-radio', '12');

    // Hauptschulabschluss → in deinem HTML value=0
    await clickRadioByNameAndValue(driver, 'school-finish-radio', '0');

    // Erfahrung: im Kindergarten gearbeitet → Ja
    await clickRadioByNameAndValue(driver, 'experience-radio', '12');

    // Keine abgeschlossene Ausbildung
    await clickRadioByNameAndValue(driver, 'apprenticeship-radio', '0');

    // Kein Studium
    await clickRadioByNameAndValue(driver, 'study-radio', '0');

    // Weiter zu Step 3
    await clickButtonById(driver, 'next-btn-2');

    // --- STEP 3: Ergebnisse ---
    console.log('Step 3: Ergebnisse prüfen');
    await waitVisibleById(driver, 'step-3');

    const finalDurationEl = await waitVisibleById(driver, 'final-duration-result', 15_000);
    const finalDurationText = await finalDurationEl.getText();
    console.log('Gesamtausbildungsdauer ab Beginn (Marie, Szenario 4):', finalDurationText);

    // Details öffnen
    await clickButtonById(driver, 'toggle-details-btn');

    const shorteningEl = await waitVisibleById(driver, 'shortening-card-value');
    const extensionEl = await waitVisibleById(driver, 'extension-card-value');

    console.log('Gesamte Verkürzung (Monate):', await shorteningEl.getText());
    console.log('Verlängerung durch Teilzeit (Monate):', await extensionEl.getText());

    console.log('Szenario 4 – Testlauf erfolgreich abgeschlossen.');
  } catch (err) {
    console.error('Szenario 4 – Test fehlgeschlagen:', err);
    process.exitCode = 1;
  } finally {
    await driver.quit();
  }
}

runScenarioMarie().catch((err) => {
  console.error('Szenario 4 – Unbehandelter Fehler:', err);
  process.exitCode = 1;
});
