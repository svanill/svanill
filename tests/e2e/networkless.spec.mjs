// @ts-check
import { test, expect } from '@playwright/test';
import { URL } from 'url';
import fs from 'fs';

import VanillaCryptoPage from './page_object.mjs';

/**
 * @param {number} ms how long to wait, in milliseconds
 */
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const store_url = 'http://localhost:5000';
const upload_base_url = 'http://testbucket.localhost:9000';
const derive_key_iterations = 2;

test.use({ offline: true });
test.describe.configure({ mode: 'parallel' });

test.beforeEach(async ({ page }) => {
  const __dirname = new URL('.', import.meta.url).pathname;

  await page.goto(
    `file://${__dirname}/../../../svanill.html?store_url=${encodeURIComponent(
      store_url
    )}&upload_base_url=${encodeURIComponent(
      upload_base_url
    )}&iterations=${derive_key_iterations}`
  );
});

test('Login form submit button change status when the secrets changes', async ({
  page,
}) => {
  let vcp = new VanillaCryptoPage(page);

  // the login dialog is visible, the main content is not
  await expect(vcp.getLoginDialog()).toBeVisible();
  await expect(vcp.getMainContainer()).toBeHidden();

  // inputs are initially empty
  expect(await vcp.getInputSecret().inputValue()).toEqual('');
  expect(await vcp.getInputConfirmSecret().inputValue()).toEqual('');

  // submit is disabled when input fields are empty
  expect(await vcp.isLoginButtonDisabled()).toBeTruthy();

  // the login button is disabled if the secrets do not match
  await vcp.getInputSecret().type('foo');
  expect(await vcp.isLoginButtonDisabled()).toBeTruthy();

  await vcp.getInputConfirmSecret().type('bar');
  expect(await vcp.isLoginButtonDisabled()).toBeTruthy();

  // the login button is enabled if the secrets match
  await vcp.getInputSecret().fill('foo');
  await vcp.getInputConfirmSecret().fill('foo');
  expect(await vcp.isLoginButtonDisabled()).toBeFalsy();

  await vcp.login();

  // clicking the login button hides the login form and displays the main content
  await expect(vcp.getLoginDialog()).toBeHidden();
  await expect(vcp.getMainContainer()).toBeVisible();
});

test('Login form submit button display the application on mouse click', async ({
  page,
}) => {
  let vcp = new VanillaCryptoPage(page);

  await vcp.login();

  await expect(vcp.getLoginDialog()).toBeHidden();
  await expect(vcp.getMainContainer()).toBeVisible();
});

test('Login form submit button display the application on key "enter" pressed', async ({
  page,
}) => {
  let vcp = new VanillaCryptoPage(page);

  await vcp.loginUsingKeyboard();

  await expect(vcp.getLoginDialog()).toBeHidden();
  await expect(vcp.getMainContainer()).toBeVisible();
});

test('If the user types a wrong ciphertext an error is displayed', async ({
  page,
}) => {
  let vcp = new VanillaCryptoPage(page);

  await vcp.login();

  await expect(vcp.getCleartextTextarea()).toBeEmpty();
  await expect(vcp.getCiphertextTextarea()).toBeEmpty();
  await expect(vcp.getCiphertextErrorBar()).toBeHidden();

  await vcp.getCiphertextTextarea().type('x');

  await expect(vcp.getCleartextTextarea()).toBeEmpty();
  await expect(vcp.getCiphertextErrorBar()).toBeVisible();

  await vcp.getCiphertextTextarea().fill('');
  await expect(vcp.getCiphertextErrorBar()).toBeHidden();
});

test('If the user types something in the cleartext area then some ciphertext is generated', async ({
  page,
}) => {
  let vcp = new VanillaCryptoPage(page);

  await vcp.login();

  await expect(vcp.getCleartextTextarea()).toBeEmpty();
  await expect(vcp.getCiphertextTextarea()).toBeEmpty();

  // use `delay` to ensure that we have the time to encrypt something
  await vcp.getCleartextTextarea().type('hello', { delay: 100 });

  const ciphertextValue = await vcp.getCiphertextTextarea().inputValue();

  // there is some ciphertext, and it doesn't contain the cleartext
  expect(ciphertextValue).not.toEqual('');
  expect(ciphertextValue.includes('hello')).toBeFalsy();

  await expect(vcp.getCiphertextErrorBar()).toBeHidden();
});

test('The same text must generate two differents ciphertexts', async ({
  page,
}) => {
  let vcp = new VanillaCryptoPage(page);

  await vcp.login();

  await expect(vcp.getCleartextTextarea()).toBeEmpty();
  await expect(vcp.getCiphertextTextarea()).toBeEmpty();

  // use `delay` to ensure that we have the time to encrypt something
  await vcp.getCleartextTextarea().type('hello', { delay: 100 });

  const firstCiphertext = await vcp.getCiphertextTextarea().inputValue();

  await vcp.getCiphertextTextarea().fill('');
  await vcp.getCleartextTextarea().type('hello', { delay: 100 });

  const newCiphertextValue = await vcp.getCiphertextTextarea().inputValue();

  // there is some ciphertext, and it doesn't contain the cleartext
  expect(newCiphertextValue).not.toEqual('');
  expect(newCiphertextValue).not.toEqual(firstCiphertext);

  await expect(vcp.getCiphertextErrorBar()).toBeHidden();
});

test('If you have broken ciphertext, selecting the plaintext will refresh it', async ({
  page,
}) => {
  let vcp = new VanillaCryptoPage(page);

  await vcp.login();

  // use `delay` to ensure that we have the time to encrypt something
  await vcp.getCleartextTextarea().type('foobar', { delay: 100 });
  await expect(vcp.getCiphertextTextarea()).not.toBeEmpty();

  const firstCiphertext = await vcp.getCiphertextTextarea().inputValue();

  await vcp.getCiphertextTextarea().type('$'); // any non base64 character is fine to generate a decryt error

  await expect(vcp.getCiphertextErrorBar()).toBeVisible();

  await vcp.getCleartextTextarea().focus();

  await expect(vcp.getCiphertextErrorBar()).toBeHidden();

  const newCiphertext = await vcp.getCiphertextTextarea().inputValue();

  // the ciphertext must have changed
  expect(newCiphertext.includes('$')).toBeFalsy();

  // and it should be different from the previous ciphertext
  expect(newCiphertext).not.toEqual(firstCiphertext);
});

test('Any update to the ciphertext must update the plaintext', async ({
  page,
}) => {
  let vcp = new VanillaCryptoPage(page);

  await vcp.login();

  const originalPlaintext = 'foobar';

  // use `delay` to ensure that we have the time to encrypt something
  await vcp.getCleartextTextarea().type(originalPlaintext, { delay: 100 });
  await expect(vcp.getCiphertextTextarea()).not.toBeEmpty();

  const firstCiphertext = await vcp.getCiphertextTextarea().inputValue();

  await vcp.getCiphertextTextarea().fill('');
  await delay(100);

  await expect(vcp.getCleartextTextarea()).toBeEmpty();
  await expect(vcp.getCiphertextTextarea()).toBeEmpty();

  await vcp.getCiphertextTextarea().type(firstCiphertext);
  await delay(100);

  expect(await vcp.getCleartextTextarea().inputValue()).toEqual(
    originalPlaintext
  );
});

test('The plaintext can be downloaded', async ({ page }) => {
  let vcp = new VanillaCryptoPage(page);

  await vcp.login();

  const plaintext = 'foobar';

  await vcp.getCleartextTextarea().type(plaintext);

  const [download] = await Promise.all([
    page.waitForEvent('download'),
    vcp.getDownloadCleartextButton().click(),
  ]);

  // Wait for the download process to complete
  const path = await download.path();
  const content = fs.readFileSync(path, { encoding: 'utf8' });

  expect(content).toEqual(plaintext);
});

test('The ciphertext can be downloaded', async ({ page }) => {
  let vcp = new VanillaCryptoPage(page);

  await vcp.login();

  const cleartext = 'foobar';

  // use `delay` to ensure that we have the time to encrypt something
  await vcp.getCleartextTextarea().type(cleartext, { delay: 100 });
  const ciphertext = await vcp.getCiphertextTextarea().inputValue();

  const [download] = await Promise.all([
    page.waitForEvent('download'),
    vcp.getDownloadCiphertextButton().click(),
  ]);

  // Wait for the download process to complete
  const path = await download.path();
  const content = fs.readFileSync(path, { encoding: 'utf8' });

  expect(content).toEqual(ciphertext);
});
