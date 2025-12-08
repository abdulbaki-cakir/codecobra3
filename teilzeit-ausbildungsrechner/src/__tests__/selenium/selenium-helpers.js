// src/__tests__/selenium/selenium-helpers.js
import { By, until } from 'selenium-webdriver';

const DEFAULT_TIMEOUT = 10_000;

export async function waitVisibleById(driver, id, timeout = DEFAULT_TIMEOUT) {
  const el = await driver.wait(until.elementLocated(By.id(id)), timeout);
  await driver.wait(until.elementIsVisible(el), timeout);
  return el;
}

export async function typeNumberById(driver, id, value, timeout = DEFAULT_TIMEOUT) {
  const el = await waitVisibleById(driver, id, timeout);
  await el.clear();
  await el.sendKeys(String(value));
}

export async function clickRadioByNameAndValue(
  driver,
  name,
  value,
  timeout = DEFAULT_TIMEOUT
) {
  const selector = `input[name="${name}"][value="${value}"]`;
  const radio = await driver.wait(
    until.elementLocated(By.css(selector)),
    timeout
  );

  // Input kann per CSS versteckt sein -> Klick per JS
  await driver.executeScript('arguments[0].click();', radio);
}

export async function clickButtonById(driver, id, timeout = DEFAULT_TIMEOUT) {
  const el = await waitVisibleById(driver, id, timeout);

  await driver.executeScript(
    'arguments[0].scrollIntoView({ block: "center" });',
    el
  );
  await driver.sleep(200);

  await driver.executeScript('arguments[0].click();', el);
}
