import {
  createDriver,
  waitVisibleById,
  typeNumberById,
  clickRadioByNameAndValue,
  clickButtonById,
} from './selenium-helpers.e2e.js';

const BASE_URL = process.env.TZR_BASE_URL ?? 'http://localhost:5173';

export async function runScenarioPaul() {
  const driver = await createDriver();

  try {
    console.log(
      'Starte Szenario 3 – Paul (24), Fachinformatiker, Teilzeit 32h, Studium relevant, Pflege Angehörige.'
    );

    // Seite öffnen
    await driver.get(`${BASE_URL}/`);
    await driver.sleep(500);

    // --- STEP 1: Basisdaten ---
    console.log('Step 1: Basisdaten ausfüllen');

    // Vollzeit: 40 Stunden
    await typeNumberById(driver, 'vollzeitstunden', 40);

    // Teilzeit: 32 Stunden
    await typeNumberById(driver, 'wochenstunden', 32);

    // Ausbildungsdauer: 36 Monate
    const ausbildungsdauerSelect = await waitVisibleById(driver, 'ausbildungsdauer');
    await ausbildungsdauerSelect.sendKeys('36');

    // Direkt in Teilzeit starten
    await clickRadioByNameAndValue(driver, 'part-time-start-radio', '0');

    // Weiter zu Step 2
    await clickButtonById(driver, 'next-btn-1');

    // --- STEP 2: Verkürzungsgründe ---
    console.log('Step 2: Verkürzungsfaktoren setzen');
    await waitVisibleById(driver, 'step-2');

    // Paul ist 24 → über 21
    await clickRadioByNameAndValue(driver, 'age-radio', '12');

    // Fachhochschulreife / Abitur
    await clickRadioByNameAndValue(driver, 'school-finish-radio', '12');

    // Praktikum/Berufserfahrung: nicht erwähnt → Nein
    await clickRadioByNameAndValue(driver, 'experience-radio', '0');

    // Bereits abgeschlossene Ausbildung: Nein
    await clickRadioByNameAndValue(driver, 'apprenticeship-radio', '0');

    // Studium mit relevanten Kursen: Ja
    await clickRadioByNameAndValue(driver, 'study-radio', '12');

    // Pflege Angehörige (Großmutter): Ja
    await clickRadioByNameAndValue(driver, 'family-care-radio', '12');

    // Weiter zu Step 3
    await clickButtonById(driver, 'next-btn-2');

    // --- STEP 3: Ergebnisse ---
    console.log('Step 3: Ergebnisse prüfen');
    await waitVisibleById(driver, 'step-3');

    const finalDurationEl = await waitVisibleById(
      driver,
      'final-duration-result',
      15_000
    );
    const finalDurationText = await finalDurationEl.getText();

    console.log('Gesamtausbildungsdauer ab Beginn (Paul, Szenario 3):', finalDurationText);

    // Details öffnen
    await clickButtonById(driver, 'toggle-details-btn');

    const shorteningEl = await waitVisibleById(driver, 'shortening-card-value');
    const extensionEl = await waitVisibleById(driver, 'extension-card-value');

    console.log('Gesamte Verkürzung (Monate):', await shorteningEl.getText());
    console.log('Verlängerung durch Teilzeit (Monate):', await extensionEl.getText());

    console.log('Szenario 3 – Testlauf erfolgreich abgeschlossen.');
  } catch (err) {
    console.error('Szenario 3 – Test fehlgeschlagen:', err);
    process.exitCode = 1;
  } finally {
    await driver.quit();
  }
}

runScenarioPaul().catch((err) => {
  console.error('Szenario 3 – Unbehandelter Fehler:', err);
  process.exitCode = 1;
});
