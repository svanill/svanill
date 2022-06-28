// @ts-check

export default class VanillaCryptoPage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;
  }
  getInputSecret() {
    return this.page.locator('#secret');
  }
  getInputConfirmSecret() {
    return this.page.locator('#confirm-secret');
  }
  getInputUsername() {
    return this.page.locator('#username');
  }
  getLoginButton() {
    return this.page.locator('#login-btn');
  }
  getErrorBar() {
    return this.page.locator('#error-bar');
  }
  getLoginDialog() {
    return this.page.locator('#login-form');
  }
  getMainContainer() {
    return this.page.locator('.main-container');
  }
  getReloadCiphertextButton() {
    return this.page.locator('#reload-ciphertext');
  }
  getUploadCiphertextButton() {
    return this.page.locator('#upload-ciphertext');
  }
  isLoginButtonDisabled() {
    return this.getLoginButton().isDisabled();
  }
  async login() {
    await this.getInputSecret().fill('testpw');
    await this.getInputConfirmSecret().fill('testpw');
    await this.getLoginButton().click();
  }
  async loginExt(username) {
    await this.getInputSecret().fill('testpw');
    await this.getInputConfirmSecret().fill('testpw');
    await this.getInputUsername().fill(username || 'test-user');
    await this.getLoginButton().click();
  }
  async loginUsingKeyboard() {
    await this.getInputSecret().fill('testpw');
    await this.getInputConfirmSecret().fill('testpw');
    await this.getLoginButton().press('Enter');
  }
  getCleartextTextarea() {
    return this.page.locator('#plaintext');
  }
  getCiphertextTextarea() {
    return this.page.locator('#ciphertext');
  }
  getCiphertextErrorBar() {
    return this.page.locator('#ciphertext-error-bar');
  }
  getDownloadCleartextButton() {
    return this.page.locator('#download-cleartext');
  }
  getDownloadCiphertextButton() {
    return this.page.locator('#download-ciphertext');
  }
}
