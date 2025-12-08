// src/__tests__/selenium/tzr-test.js
import { Builder } from 'selenium-webdriver';
import {
  waitVisibleById,
  typeNumberById,
  clickRadioByNameAndValue,
  clickButtonById,
} from './selenium-helpers.js';

const BASE_URL = process.env.TZR_BASE_URL ?? 'http://localhost:5173';

async function runTzrE2eTest() {
  const driver = await new Builder().forBrowser('chrome').build();

  try {
    console.log(`Starte TZR-E2E-Test auf ${BASE_URL}`);
    await driver.get(BASE_URL);
    await driver.sleep(1000);

    // STEP 1 – Basisdaten
    console.log('Step 1: Basisdaten');
    await typeNumberById(driver, 'vollzeitstunden', 40);
    await typeNumberById(driver, 'wochenstunden', 30);

    const ausbildungsdauerSelect = await waitVisibleById(
      driver,
      'ausbildungsdauer'
    );
    await ausbildungsdauerSelect.sendKeys('36');

    await clickRadioByNameAndValue(driver, 'part-time-start-radio', '0');
    await clickButtonById(driver, 'next-btn-1');

    // STEP 2 – Verkürzungsgründe
    console.log('Step 2: Verkürzungsgründe');
    await waitVisibleById(driver, 'step-2');

    await clickRadioByNameAndValue(driver, 'age-radio', '12');
    await clickRadioByNameAndValue(driver, 'school-finish-radio', '6');
    await clickRadioByNameAndValue(driver, 'experience-radio', '12');
    await clickRadioByNameAndValue(driver, 'apprenticeship-radio', '0');
    await clickRadioByNameAndValue(driver, 'study-radio', '0');
    await clickRadioByNameAndValue(driver, 'child-care-radio', '0');
    await clickRadioByNameAndValue(driver, 'family-care-radio', '0');

    await clickButtonById(driver, 'next-btn-2');

    // STEP 3 – Ergebnisse
    console.log('Step 3: Ergebnisse');
    await waitVisibleById(driver, 'step-3');

    const finalDurationEl = await waitVisibleById(
      driver,
      'final-duration-result',
      15_000
    );
    const finalDurationText = await finalDurationEl.getText();
    console.log('Gesamtausbildungsdauer ab Beginn:', finalDurationText);

    await clickButtonById(driver, 'toggle-details-btn');

    const shorteningEl = await waitVisibleById(driver, 'shortening-card-value');
    const extensionEl = await waitVisibleById(driver, 'extension-card-value');

    console.log('Gesamte Verkürzung (Monate):', await shorteningEl.getText());
    console.log('Verlängerung durch Teilzeit (Monate):', await extensionEl.getText());
  } catch (err) {
    console.error('TZR-E2E-Test fehlgeschlagen:', err);
    process.exitCode = 1;
  } finally {
    await driver.quit();
  }
}

runTzrE2eTest();
