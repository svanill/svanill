// @ts-check
import { test, expect } from '@playwright/test';
import { URL } from 'url';

import crypto from 'crypto';
import VanillaCryptoPage from './page_object2.mjs';

/**
 * @param {number} ms how long to wait, in milliseconds
 */
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const store_url = 'http://localhost:5000';
const upload_base_url = 'http://testbucket.localhost:9000';
const derive_key_iterations = 2;

test.beforeEach(async ({ page }) => {
  page.on('dialog', async (dialog) => {
    throw `Unexpected dialog!. Content was: ${dialog.message()}`;
  });

  const __dirname = new URL('.', import.meta.url).pathname;

  await page.goto(
    `file://${__dirname}/../../../svanill.html?store_url=${encodeURIComponent(
      store_url
    )}&upload_base_url=${encodeURIComponent(
      upload_base_url
    )}&iterations=${derive_key_iterations}`
  );
});

test('If the user does not exist the proper error is displayed', async ({
  page,
}) => {
  const vcp = new VanillaCryptoPage(page);

  await vcp.loginExt('some-unauthorized-user');

  await expect(vcp.getErrorBar()).toBeVisible();
  await expect(vcp.getErrorBar()).toContainText(
    'Not authorized. Check username and password\nDismiss'
  );
});

test('If the user is able to login the application is displayed', async ({
  page,
}) => {
  const vcp = new VanillaCryptoPage(page);

  await vcp.loginExt();

  await expect(vcp.getErrorBar()).toBeHidden();
  await expect(vcp.getLoginDialog()).toBeHidden();
  await expect(vcp.getMainContainer()).toBeVisible();
});

test('When a user who never uploaded anything clicks reload, textareas should be emptied', async ({
  page,
}) => {
  const vcp = new VanillaCryptoPage(page);

  await vcp.loginExt();
  await vcp.getCleartextTextarea().focus();

  await expect(vcp.getCleartextTextarea()).toBeEmpty();
  await expect(vcp.getCiphertextTextarea()).toBeEmpty();
  await vcp.getCleartextTextarea().type('soon to be deleted');

  await vcp.getReloadCiphertextButton().click();

  await expect(vcp.getCleartextTextarea()).toBeEmpty();
  await expect(vcp.getCiphertextTextarea()).toBeEmpty();
});

test('When the user click on upload, delete the text and reload, the text is back again', async ({
  page,
}) => {
  const vcp = new VanillaCryptoPage(page);

  await vcp.loginExt();

  /* Start by emptying the cleartext area */
  await vcp.getCleartextTextarea().fill('');
  await expect(vcp.getCleartextTextarea()).toBeEmpty();

  /* Write some text to encrypt */

  // use `delay` to get the time to start writing ciphertext
  await vcp.getCleartextTextarea().type('hello', { delay: 100 });

  let cleartextValue = await vcp.getCleartextTextarea().inputValue();
  let ciphertextValue = await vcp.getCiphertextTextarea().inputValue();

  expect(cleartextValue).toEqual('hello');
  expect(ciphertextValue.includes('hello')).toBeFalsy();
  expect(ciphertextValue).not.toEqual('');

  await expect(vcp.getCiphertextErrorBar()).toBeHidden();

  /* Upload the ciphertext */

  await vcp.getUploadCiphertextButton().click();
  await expect(vcp.getErrorBar()).toBeHidden();

  /* Empty cleartext (it must automatically empty the ciphertext) */

  await vcp.getCleartextTextarea().fill('');
  await expect(vcp.getCleartextTextarea()).toBeEmpty();
  await expect(vcp.getCiphertextTextarea()).toBeEmpty();

  /* Reload the ciphertext that we uploaded earlier */

  await vcp.getReloadCiphertextButton().click();
  await delay(500); // give it a moment to download and update the text

  /* Verify that we got out ciphertext back, and it decrypts correctly */

  cleartextValue = await vcp.getCleartextTextarea().inputValue();
  ciphertextValue = await vcp.getCiphertextTextarea().inputValue();

  expect(cleartextValue).toEqual('hello');
  expect(ciphertextValue.includes('hello')).toBeFalsy();
  expect(ciphertextValue).not.toEqual('');
});
