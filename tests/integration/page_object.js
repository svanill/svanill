import { Selector, t, ClientFunction } from 'testcafe';

export default class VanillaCryptoPage {
    getInputSecret() {
        return Selector('#secret');
    }
    getInputConfirmSecret() {
        return Selector('#confirm-secret');
    }
    getLoginButton() {
        return Selector('#login-btn');
    }
    getLoginDialog() {
        return Selector('#login-dialog');
    }
    getMainContainer() {
        return Selector('.main-container');
    }
    isLoginButtonDisabled() {
        return this.getLoginButton().hasAttribute('disabled');
    }
    async login() {
        await t
            .typeText(this.getInputSecret(), 'such secret', { replace: true })
            .typeText(this.getInputConfirmSecret(), 'such secret', { replace: true })
            .click(this.getLoginButton())
    }
    async loginUsingKeyboard() {
        await t
            .typeText(this.getInputSecret(), 'such secret', { replace: true })
            .typeText(this.getInputConfirmSecret(), 'such secret', { replace: true })

        await this.focus(this.getLoginButton())

        await t
            .pressKey('enter')
    }
    getCleartextTextarea() {
        return Selector('#plaintext');
    }
    getCiphertextTextarea() {
        return Selector('#ciphertext');
    }
    getCiphertextErrorBar() {
        return Selector('#ciphertext-error-bar')
    }
    focus(selector) {
        return ClientFunction(() => el().focus())
            .with({ dependencies: { el: selector } })();
    }
}