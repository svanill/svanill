import { t } from 'testcafe';
import VanillaCryptoPage from './page_object';

const page = new VanillaCryptoPage();

fixture `Open main page`
    .page `file://${__dirname}/../../vanillacrypto.html?salt=x&upload_base_url=http://s3like.com:9000/`
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
        .expect(page.getErrorBar().innerText).eql('User refused to create an account')
});

test('Login fails when the external service does not accept the credentials', async t => {
    await page.loginExt('bad username, has commas and spacing')

    await t
        .expect(page.getErrorBar().visible).ok()
        .expect(page.getErrorBar().innerText).eql("Couldn't create the user. Server response was: [1001] Username is not valid")
});

test('If the user is prompted to create an account and answer "yes" the application is displayed', async t => {
    await page.loginExt()

    await t
        .expect(page.getErrorBar().visible).notOk()
        .expect(page.getLoginDialog().visible).notOk()
        .expect(page.getMainContainer().visible).ok()
});

test('When the user click on upload, delete the text and reload, the text is back again', async t => {
    await page.loginExt()
    await page.focus(page.getCleartextTextarea())

    await t
        .pressKey('ctrl+a delete')
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


/*

test('The first time the account is created, hitting the reload button empty the textareas', async t => {
});

test('XXX various tests on errors, how to do them?', async t => {
});

test('Login fails when the external service is not reachable', async t => {    await page.login()

*/