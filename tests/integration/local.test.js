import { t } from 'testcafe';
import VanillaCryptoPage from './page_object';

const page = new VanillaCryptoPage();

fixture `Open main page`
    .page `file://${__dirname}/../../vanillacrypto.html?salt=x`;

test('Login form submit button change status when the secrets changes', async t => {

    await t
        // the login dialog is visible, the main content not
        .expect(page.getLoginDialog().visible).ok()
        .expect(page.getMainContainer().visible).notOk()
        // inputs are initially empty
        .expect(page.getInputSecret().value).eql('', 'input secret is empty')
        .expect(page.getInputConfirmSecret().value).eql('', 'input confirm-secret is empty')
        // cannot submit with empty inputs
        .expect(page.isLoginButtonDisabled()).ok()
        // the login button is disabled if the secrets do not match
        .typeText(page.getInputSecret(), 'foo')
        .expect(page.isLoginButtonDisabled()).ok()
        .typeText(page.getInputConfirmSecret(), 'bar')
        .expect(page.isLoginButtonDisabled()).ok()
        // the login button is enabled if the secrets match
        .typeText(page.getInputSecret(), 'foo', { replace: true })
        .typeText(page.getInputConfirmSecret(), 'foo', { replace: true })
        .expect(page.isLoginButtonDisabled()).notOk()

    await page.login()

    await t
        // clicking the login button hides the login form and displays the main content
        .expect(page.getLoginDialog().visible).notOk()
        .expect(page.getMainContainer().visible).ok()
});

test('Login form submit button display the application on mouse click', async t => {
    await page.login()

    await t
        .expect(page.getLoginDialog().visible).notOk()
        .expect(page.getMainContainer().visible).ok()
});

test('Login form submit button display the application on key "enter" pressed', async t => {
    await page.loginUsingKeyboard()

    await t
        .expect(page.getLoginDialog().visible).notOk()
        .expect(page.getMainContainer().visible).ok()
});


test('If the user types a wrong ciphertext an error is displayed', async t => {
    await page.login()

    await t
        .expect(page.getCleartextTextarea().value).eql('', 'cleartext is empty')
        .expect(page.getCiphertextTextarea().value).eql('', 'ciphertext is empty')
        .expect(page.getCiphertextErrorBar().visible).notOk()
        .typeText(page.getCiphertextTextarea(), 'x')
        .expect(page.getCleartextTextarea().value).eql('', 'cleartext is empty')
        .expect(page.getCiphertextErrorBar().visible).ok()

    await page.focus(page.getCiphertextTextarea())

    await t
        .pressKey('ctrl+a delete')
        .expect(page.getCiphertextErrorBar().visible).notOk()
});

test('If the user types clear text then ciphertext is generated', async t => {
    await page.login()

    await t
        .expect(page.getCleartextTextarea().value).eql('', 'cleartext is empty')
        .expect(page.getCiphertextTextarea().value).eql('', 'ciphertext is empty')
        .typeText(page.getCleartextTextarea(), 'hello')

    await t
        .expect(page.getCiphertextTextarea().value).notEql('', { timeout: 500 })
        .expect(page.getCiphertextTextarea().value).notEql('hello')
        .expect(page.getCiphertextErrorBar().visible).notOk()
});

test('The same text must generate two differents ciphertexts', async t => {
    await page.login()

    await t
        .expect(page.getCleartextTextarea().value).eql('', 'cleartext is empty')
        .expect(page.getCiphertextTextarea().value).eql('', 'ciphertext is empty')
        .typeText(page.getCleartextTextarea(), 'hello')

    const firstCiphertext = await page.getCiphertextTextarea().value;

    await t
        .typeText(page.getCleartextTextarea(), 'hello', { replace: true })
        .expect(page.getCiphertextTextarea().value).notEql('', { timeout: 500 } )
        .expect(page.getCiphertextTextarea().value).notEql('firstCiphertext', { timeout: 500 })
        .expect(page.getCiphertextErrorBar().visible).notOk()
});

test('If you have broken ciphertext, selecting the plaintext will refresh it', async t => {
    await page.login()

    await t
        .typeText(page.getCleartextTextarea(), 'foobar')
        .expect(page.getCiphertextTextarea().value).notEql('', { timeout: 500 } )

    const correctCiphertext = await page.getCiphertextTextarea().value;

    await t
        .typeText(page.getCiphertextTextarea(), '$') // any non base64 character
        .expect(page.getCiphertextErrorBar().visible).ok()

    await page.focus(page.getCleartextTextarea())

    await t
        .expect(page.getCiphertextErrorBar().visible).notOk()
        // the ciphertext must have changed
        .expect(page.getCiphertextTextarea().value).notEql(correctCiphertext + '$', { timeout: 500 } )
        // and it should be different from the previous ciphertext
        .expect(page.getCiphertextTextarea().value).notEql(correctCiphertext, { timeout: 500 } )
});

test('Any update to the ciphertext must update the plaintext', async t => {
    await page.login()

    const originalPlaintext = 'foobar';

    await t
        .typeText(page.getCleartextTextarea(), originalPlaintext)
        .expect(page.getCiphertextTextarea().value).notEql('', { timeout: 500 } )

    const correctCiphertext = await page.getCiphertextTextarea().value;

    await page.focus(page.getCiphertextTextarea())

    await t
        .pressKey('ctrl+a delete')

    await t
        .expect(page.getCleartextTextarea().value).eql('')
        .expect(page.getCiphertextTextarea().value).eql('')
        .typeText(page.getCiphertextTextarea(), correctCiphertext)
        .expect(page.getCleartextTextarea().value).eql(originalPlaintext)
});

test('The plaintext can be downloaded', async t => {

});

test('The ciphertext can be downloaded', async t => {

});
