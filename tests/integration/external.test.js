import crypto from 'crypto';
import VanillaCryptoPage from './page_object';

const page = new VanillaCryptoPage();

fixture `Open main page`
    .page `file://${__dirname}/../../svanill.html?store_url=http://localhost:5000&upload_base_url=http://s3like.com:9000/`
    .beforeEach( async t => {
        await t.setNativeDialogHandler((type, text, url) => {
            switch (type) {
                case 'confirm':
                    switch (text) {
                        case 'No user found with that username, would you like to create it?':
                            return true;
                        default:
                            throw 'Unexpected confirm dialog!';
                    }
                default:
                    throw 'Unexpected dialog!';
            }
        });
    })
;

test('If the user is prompted to create an account and answer "no" an error is displayed', async t => {
    await t.setNativeDialogHandler(() => false);
    await page.loginExt('donotcreateme')

    await t
        .expect(page.getErrorBar().visible).ok()
        .expect(page.getErrorBar().innerText).eql('Cannot proceed\nDismiss')
});

test('Login fails when the external service does not accept the credentials', async t => {
    await page.loginExt('bad username, has commas and spacing')

    await t
        .expect(page.getErrorBar().visible).ok()
        .expect(page.getErrorBar().innerText).eql(`Couldn\'t start authentication. Server response was: [1001] Username should contain only ascii letters, numbers, _, -, max 50 chars)\nDismiss`)
});

test('If the user is prompted to create an account and answer "yes" the application is displayed', async t => {
    await page.loginExt()

    await t
        .expect(page.getErrorBar().visible).notOk()
        .expect(page.getLoginDialog().visible).notOk()
        .expect(page.getMainContainer().visible).ok()
});

test('When a new user start by clicking reload, textareas should be emptied', async t => {
    const newUser = crypto.randomBytes(20).toString('hex')
    await page.loginExt(newUser)
    await page.focus(page.getCleartextTextarea())

    await t
        .expect(page.getCleartextTextarea().value).eql('', 'cleartext is empty')
        .expect(page.getCiphertextTextarea().value).eql('', 'ciphertext is empty')
        .typeText(page.getCleartextTextarea(), 'soon to be deleted')
        .click(page.getDownloadCleartextButton())
        .click(page.getReloadCiphertextButton())
        .expect(page.getCleartextTextarea().value).eql('', { timeout: 500 }, 'cleartext is empty')
        .expect(page.getCiphertextTextarea().value).eql('', { timeout: 500 }, 'cleartext is empty')
});

test('When the user click on upload, delete the text and reload, the text is back again', async t => {
    await page.loginExt()
    await page.focus(page.getCleartextTextarea())

    await t
        .click(page.getCleartextTextarea())
        .expect(page.getCleartextTextarea().focused).ok()
        .pressKey('ctrl+a backspace')
        .expect(page.getCleartextTextarea().value).eql('', { timeout: 500 })
        .typeText(page.getCleartextTextarea(), 'hello')

    await t
        .expect(page.getCiphertextTextarea().value).notEql('', { timeout: 500 })
        .expect(page.getCiphertextTextarea().value).notEql('hello')
        .expect(page.getCiphertextErrorBar().visible).notOk()
        .click(page.getUploadCiphertextButton())
        .expect(page.getErrorBar().visible).notOk()

    await page.focus(page.getCleartextTextarea())

    await t
        .pressKey('ctrl+a delete')
        .expect(page.getCiphertextTextarea().value).eql('', { timeout: 500 })
        .click(page.getReloadCiphertextButton())
        .expect(page.getCiphertextTextarea().value).notEql('', { timeout: 500 })
        .expect(page.getCleartextTextarea().value).eql('hello')
});
