import { Builder } from 'selenium-webdriver';
import {
  waitVisibleById,
  typeNumberById,
  clickRadioByNameAndValue,
  clickButtonById,
} from './selenium-helpers.js';

const BASE_URL = process.env.TZR_BASE_URL ?? 'http://localhost:5173';

export async function runScenarioLisa() {
  const driver = await new Builder().forBrowser('chrome').build();

  try {
    console.log('Starte Szenario 1 – Bürokauffrau mit Kleinkind (Lisa, 23).');

    // Seite öffnen
    await driver.get(`${BASE_URL}/`);
    await driver.sleep(1000);

    // --- STEP 1: Basisdaten ---
    console.log('Step 1: Basisdaten ausfüllen');

    // Vollzeit: 40 Stunden
    await typeNumberById(driver, 'vollzeitstunden', 40);

    // Teilzeit: 26 Stunden
    await typeNumberById(driver, 'wochenstunden', 26);

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

    // Lisa ist 23 → über 21
    await clickRadioByNameAndValue(driver, 'age-radio', '12');

    // Mittlere Reife
    await clickRadioByNameAndValue(driver, 'school-finish-radio', '6');

    // Relevante Berufserfahrung (Praktikum im Büro)
    await clickRadioByNameAndValue(driver, 'experience-radio', '12');

    // Keine abgeschlossene Ausbildung
    await clickRadioByNameAndValue(driver, 'apprenticeship-radio', '0');

    // Kein Studium
    await clickRadioByNameAndValue(driver, 'study-radio', '0');

    // Kind, um das sie sich kümmert
    await clickRadioByNameAndValue(driver, 'child-care-radio', '12');

    // Keine pflegebedürftigen Angehörigen
    await clickRadioByNameAndValue(driver, 'family-care-radio', '0');

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

    console.log('Gesamtausbildungsdauer ab Beginn (Lisa, Szenario 1):', finalDurationText);

    // Optional: Details öffnen und zusätzliche Informationen loggen
    await clickButtonById(driver, 'toggle-details-btn');

    const shorteningEl = await waitVisibleById(driver, 'shortening-card-value');
    const extensionEl = await waitVisibleById(driver, 'extension-card-value');

    const shorteningText = await shorteningEl.getText();
    const extensionText = await extensionEl.getText();

    console.log('Gesamte Verkürzung (Monate):', shorteningText);
    console.log('Verlängerung durch Teilzeit (Monate):', extensionText);

    console.log('Szenario 1 – Testlauf erfolgreich abgeschlossen.');
  } catch (err) {
    console.error('Szenario 1 – Test fehlgeschlagen:', err);
    process.exitCode = 1;
  } finally {
    await driver.quit();
  }
}

runScenarioLisa();
