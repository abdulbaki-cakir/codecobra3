// src/selenium/selenium-all-tests.js
import { createDriver } from './selenium-helpers.js';
import { runTzrE2eTest } from './tzr.js';
import { runScenarioLisa } from './tzr-scenario1-lisa.js';

async function runAllSeleniumTests() {
  const driver = await createDriver();

  try {
    await runScenarioLisa(driver);
    await runTzrE2eTest(driver);
    console.log('Alle Selenium-Tests erfolgreich abgeschlossen.');
  } finally {
    await driver.quit();
  }
}

if (process.env.CI && !process.env.SELENIUM_REMOTE_URL) {
  console.log('CI ohne Remote-WebDriver – Selenium wird übersprungen.');
  process.exit(0);
}

runAllSeleniumTests().catch(err => {
  console.error('Selenium-Gesamtlauf fehlgeschlagen:', err);
  process.exitCode = 1;
});
