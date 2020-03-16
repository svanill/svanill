describe('stringToUint8Array', () => {
    it('empty string', () => {
        const result = stringToUint8Array('');
        const expected = new Uint8Array([]);
        expect(result).toEqual(expected);
    });

    it('ascii string', () => {
        const result = stringToUint8Array('ab');
        const expected = new Uint8Array([97, 98]);
        expect(result).toEqual(expected);
    });

    it('astral plane characters', () => {
        const result = stringToUint8Array('𐄷');
        const expected = new Uint8Array([240, 144, 132, 183]);
        expect(result).toEqual(expected);
    });
})


describe('bufToString', () => {
    it('empty array', () => {
        const result = bufToString(new Uint8Array([]));
        const expected = '';
        expect(result).toEqual(expected);
    });

    it('empty buffer', () => {
        const result = bufToString(new Uint8Array([]).buffer);
        const expected = '';
        expect(result).toEqual(expected);
    });

    it('ascii array', () => {
        const result = bufToString(new Uint8Array([97, 98]));
        const expected = 'ab';
        expect(result).toEqual(expected);
    });

    it('ascii buffer', () => {
        const result = bufToString(new Uint8Array([97, 98]).buffer);
        const expected = 'ab';
        expect(result).toEqual(expected);
    });

    it('astral plane characters', () => {
        const result = bufToString(new Uint8Array([240, 144, 132, 183]));
        const expected = '𐄷';
        expect(result).toEqual(expected);
    });
})


describe('u_atob [base64 from ascii to binary]', () => {
    it('empty string', () => {
        const result = u_atob('');
        const expected = new Uint8Array([]);
        expect(result).toEqual(expected);
    });

    it('can decode base64', () => {
        const result = u_atob('aGVsbG8='); // hello
        const expected = new Uint8Array([104, 101, 108, 108, 111]);
        expect(result).toEqual(expected);
    });

    it('can decode astral plane characters', () => {
        const result = u_atob('8JCEtw==');  //𐄷
        const expected = new Uint8Array([240, 144, 132, 183]);
        expect(result).toEqual(expected);
    });

    it('throw a Base64DecodeError on bogus data', () => {
        const raiseError = () => u_atob('x');
        expect(raiseError).toThrowError(Base64DecodeError);
    });

});


describe('u_btoa [base64 from binary to ascii]', () => {
    it('empty array', () => {
        const result = u_btoa(new Uint8Array([]));
        const expected = '';
        expect(result).toEqual(expected);
    });

    it('empty buffer', () => {
        const result = u_btoa(new Uint8Array([]).buffer);
        const expected = '';
        expect(result).toEqual(expected);
    });

    it('can encode binary data to ascii base64', () => {
        const result = u_btoa(new Uint8Array([240, 144, 132, 183]));  //𐄷
        const expected = '8JCEtw==';
        expect(result).toEqual(expected);
    });

});


describe('bufToHex', () => {
    it('empty Uint8Array', () => {
        const result = bufToHex(new Uint8Array([]));
        const expected = '';
        expect(result).toEqual(expected);
    });

    it('empty Buffer', () => {
        const result = bufToHex(new Uint8Array([]).buffer);
        const expected = '';
        expect(result).toEqual(expected);
    });

    it('can encode Uint8Array', () => {
        const result = bufToHex(new Uint8Array([0, 1, 15, 16, 17]));
        const expected = '00010f1011';
        expect(result).toEqual(expected);
    });

    it('can encode Buffer', () => {
        const result = bufToHex(new Uint8Array([0, 1, 15, 16, 17]).buffer);
        const expected = '00010f1011';
        expect(result).toEqual(expected);
    });
});


describe('getRandomHexString', () => {
    let getRandomValueStub;

    beforeEach(() => {
        getRandomValueStub = sinon.stub(window.crypto, 'getRandomValues');
    });

    afterEach(() => {
        getRandomValueStub.restore();
    });

    it('it generates a random string', () => {
        getRandomValueStub
            .callsFake((typedArray) => {
                expect(typedArray instanceof Uint8Array).toBe(true);
                expect(typedArray.length).toBe(5);
                typedArray.set([0, 1, 2, 10, 17]);
            });

        const result = getRandomHexString(10);
        const expected = '0001020a11';
        expect(result).toEqual(expected);
    });

    it('it generates an empty string', () => {
        getRandomValueStub
            .callsFake((typedArray) => {
                expect(typedArray instanceof Uint8Array).toBe(true);
                expect(typedArray.length).toBe(0);
                typedArray.set([]);
            });

        const result = getRandomHexString(0);
        const expected = '';
        expect(result).toEqual(expected);
    });

    it('it generates a string of length 1', () => {
        getRandomValueStub
            .callsFake((typedArray) => {
                expect(typedArray instanceof Uint8Array).toBe(true);
                expect(typedArray.length).toBe(1);
                typedArray.set([1]);
            });

        const result = getRandomHexString(1);
        const expected = '0';
        expect(result).toEqual(expected);
    });
});

describe('json_parse_exceptional',  () => {
    it('parses correct json', () => {
        const result = json_parse_exceptional('{"a":1,"b":{"c":"foo"},"d":false, "e":true}');
        const expected = { a: 1, b: {c: 'foo'}, d: false, e: true };
        expect(result).toEqual(expected);
    });

    it('throw JSONDecodeError on bogus data', () => {
        const raiseError = () => json_parse_exceptional('x');
        expect(raiseError).toThrowError(JSONDecodeError);
    });

    it('throw JSONDecodeError on the empty string', () => {
        const raiseError = () => json_parse_exceptional('');
        expect(raiseError).toThrowError(JSONDecodeError);
    });
});

describe('willGenerateKeyPBKDF2',  () => {
    it('generates a non-extractable, derivable-only key', async function() {
        const key = await willGenerateKeyPBKDF2('such secret');
        expect(key.extractable).toBe(false);
        expect(key.usages).toEqual(['deriveKey']);
    });

    it('throw GenerateKeyError on an empty secret', async function() {
        try {
            await willGenerateKeyPBKDF2('');
            throw new Error('Expected exception');
        } catch(e) {
            expect(e instanceof GenerateKeyError).toBe(true);
        }
    });
});

describe('willDeriveKey',  () => {
    it('derives a key', async function() {
        const baseKey = await willGenerateKeyPBKDF2('such secret');
        const key = await willDeriveKey(baseKey, {
            saltString: 'this is a salt',
            iterations: 2,
        });
        expect(key.extractable).toBe(false);
        expect(key.usages).toEqual(['encrypt', 'decrypt']);
    });

    it('throw DeriveKeyError if iterations is not a number', async function() {
        const baseKey = await willGenerateKeyPBKDF2('such secret');
        try {
            await willDeriveKey(baseKey, {
                saltString: 'this is a salt',
                iterations: 'not a number',
            });
            throw new Error('Expected exception');
        } catch(e) {
            expect(e instanceof DeriveKeyError).toBe(true);
        }
    });
});

describe('willEncryptPlaintext',  () => {
    const plaintext = 'some text';
    const secret = 'such secret';
    const optionsPBKDF2 = {
        salt: 'this is a salt',
        iterations: 2,
    };
    const b_iv = new Uint8Array(16);

    it('produces the same result if the parameters did not change', async function() {
        const result1 = await willEncryptPlaintext(plaintext, secret, optionsPBKDF2, b_iv);
        const result2 = await willEncryptPlaintext(plaintext, secret, optionsPBKDF2, b_iv);
        expect(result1).toBe(result2);
    });

    it('produces different results if the salt has changed', async function() {
        const result1 = await willEncryptPlaintext(plaintext, secret, optionsPBKDF2, b_iv);
        const result2 = await willEncryptPlaintext(plaintext, secret, {
            salt: 'a different salt',
            iterations: optionsPBKDF2.iterations,
        }, b_iv);
        expect(result1).not.toBe(result2);
    });

    it('produces different results if the iterations has changed', async function() {
        const result1 = await willEncryptPlaintext(plaintext, secret, optionsPBKDF2, b_iv);
        const result2 = await willEncryptPlaintext(plaintext, secret, {
            salt: optionsPBKDF2.salt,
            iterations: 3,
        }, b_iv);
        expect(result1).not.toBe(result2);
    });

    it('produces different results if the plaintext has changed', async function() {
        const result1 = await willEncryptPlaintext(plaintext, secret, optionsPBKDF2, b_iv);
        const result2 = await willEncryptPlaintext('different plaintext', secret, optionsPBKDF2, b_iv);
        expect(result1).not.toBe(result2);
    });

    it('produces different results if the secret has changed', async function() {
        const result1 = await willEncryptPlaintext(plaintext, secret, optionsPBKDF2, b_iv);
        const result2 = await willEncryptPlaintext(plaintext, 'different secret', optionsPBKDF2, b_iv);
        expect(result1).not.toBe(result2);
    });

    it('produces different results if the iv has changed', async function() {
        const b_iv_1 = new Uint8Array(16);
        const b_iv_2 = new Uint8Array(16);
        b_iv_2.set([1, 2, 3]);

        const result1 = await willEncryptPlaintext(plaintext, secret, optionsPBKDF2, b_iv_1);
        const result2 = await willEncryptPlaintext(plaintext, secret, optionsPBKDF2, b_iv_2);
        expect(result1).not.toBe(result2);
    });

    it('produces a string made by three parts: the pbkdf2 options, the iv and the encoded data', async function() {
        const result = await willEncryptPlaintext(plaintext, secret, optionsPBKDF2, b_iv);
        expect(typeof result).toBe('string');
        const parts = result.split('.');
        expect(parts.length).toBe(3);
        const [ad, iv, ciphertext] = parts;

        expect(iv).toBe('AAAAAAAAAAAAAAAAAAAAAA==');
        expect(atob(iv)).toBe('\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00')

        expect(ad).toBe('eyJzYWx0IjoidGhpcyBpcyBhIHNhbHQiLCJpdGVyYXRpb25zIjoyfQ==');
        // note that this may fail if the json ended up with a different keys' order
        expect(atob(ad)).toBe('{"salt":"this is a salt","iterations":2}');

        expect(ciphertext).toBe('6nqCpNcjM/ghOGTW28Ur825s6ljPcVKZKQ==');
        // you should find a test that revert this ciphertext
    });
});

describe('willDecryptCiphertext',  function () {
    it('can decrypt encrypted data', async function() {
        const secret = 'such secret';
        const encryptedBox = 'eyJzYWx0IjoidGhpcyBpcyBhIHNhbHQiLCJpdGVyYXRpb25zIjoyfQ==.AAAAAAAAAAAAAAAAAAAAAA==.6nqCpNcjM/ghOGTW28Ur825s6ljPcVKZKQ==';
        const decryptedBox = await willDecryptCiphertext(encryptedBox, secret);

        expect(decryptedBox.plaintext).not.toBeUndefined();
        expect(decryptedBox.plaintext).toBe('some text');

        expect(decryptedBox.additionalData).not.toBeUndefined();
        expect(decryptedBox.additionalData).toEqual({ salt: 'this is a salt', iterations: 2 });

        expect(decryptedBox.iv).not.toBeUndefined();
        expect(decryptedBox.iv).toEqual(new Uint8Array(16));
    });

    it('throws JSONDecodeError if it cannot decode the additional data', async function() {
        const secret = 'such secret';
        const encryptedBox = btoa('WRONG_ADDITIONAL_DATA') + '.AAAAAAAAAAAAAAAAAAAAAA==.6nqCpNcjM/ghOGTW28Ur825s6ljPcVKZKQ==';

        try {
            await willDecryptCiphertext(encryptedBox, secret);
            throw new Error('Expected exception');
        } catch(e) {
            expect(e instanceof JSONDecodeError).toBe(true);
        }
    });

    it('throws SubtleDecryptError if it the salt is wrong', async function() {
        const secret = 'such secret';
        const encryptedBox = btoa(JSON.stringify({
            salt: 'wrong',
            iterations: 2,
        })) + '.AAAAAAAAAAAAAAAAAAAAAA==.6nqCpNcjM/ghOGTW28Ur825s6ljPcVKZKQ==';

        try {
            await willDecryptCiphertext(encryptedBox, secret);
            throw new Error('Expected exception');
        } catch(e) {
            expect(e instanceof SubtleDecryptError).toBe(true);
        }
    });

    it('throws SubtleDecryptError if it the iteration count is the wrong number', async function() {
        const secret = 'such secret';
        const encryptedBox = btoa(JSON.stringify({
            salt: 'this is a salt',
            iterations: 3,
        })) + '.AAAAAAAAAAAAAAAAAAAAAA==.6nqCpNcjM/ghOGTW28Ur825s6ljPcVKZKQ==';

        try {
            await willDecryptCiphertext(encryptedBox, secret);
            throw new Error('Expected exception');
        } catch(e) {
            expect(e instanceof SubtleDecryptError).toBe(true);
        }
    });

    it('throws DeriveKeyError if it the iteration count is not a number', async function() {
        const secret = 'such secret';
        const encryptedBox = btoa(JSON.stringify({
            salt: 'this is a salt',
            iterations: 'not a number',
        })) + '.AAAAAAAAAAAAAAAAAAAAAA==.6nqCpNcjM/ghOGTW28Ur825s6ljPcVKZKQ==';

        try {
            await willDecryptCiphertext(encryptedBox, secret);
            throw new Error('Expected exception');
        } catch(e) {
            expect(e instanceof DeriveKeyError).toBe(true);
        }
    });

    it('throws SubtleDecryptError if it the ciphertext is wrong', async function() {
        const secret = 'such secret';
        const encryptedBox = 'eyJzYWx0IjoidGhpcyBpcyBhIHNhbHQiLCJpdGVyYXRpb25zIjoyfQ==.AAAAAAAAAAAAAAAAAAAAAA==.' + btoa('wrong');

        try {
            await willDecryptCiphertext(encryptedBox, secret);
            throw new Error('Expected exception');
        } catch(e) {
            expect(e instanceof SubtleDecryptError).toBe(true);
        }
    });
});

describe('encryptor and decryptor uses the same format',  function () {
    it('can decrypt encrypted data', async function() {
        // feeding willEncryptPlaintext to willDecryptCiphertext ensure that when we
        // tested the two functions separatedly we didn't expect uncompatible formats.

        const plaintext = 'some text';
        const secret = 'such secret';
        const optionsPBKDF2 = {
            salt: 'this is a salt',
            iterations: 2,
        };
        const b_iv = new Uint8Array(16);

        const encryptedBox = await willEncryptPlaintext(plaintext, secret, optionsPBKDF2, b_iv);
        const decryptedBox = await willDecryptCiphertext(encryptedBox, secret);

        expect(decryptedBox.additionalData).not.toBeUndefined();
        expect(decryptedBox.iv).not.toBeUndefined();
        expect(decryptedBox.plaintext).not.toBeUndefined();
        expect(decryptedBox.plaintext).toBe(plaintext);
    });
});

describe('willRequestEncryption',  function () {
    let getRandomValueStub;
    let orig_willEncryptPlaintext = willEncryptPlaintext;
    let orig_getPBKDF2Salt = getPBKDF2Salt;
    let orig_getPBKDF2Iterations = getPBKDF2Iterations;
    let orig_getValueAt = getValueAt;

    beforeEach(() => {
        getRandomValueStub = sinon.stub(window.crypto, 'getRandomValues');
        willEncryptPlaintext = sinon.stub();
        getPBKDF2Salt = sinon.stub();
        getPBKDF2Iterations = sinon.stub();
        getValueAt = sinon.stub();
    });

    afterEach(() => {
        getRandomValueStub.restore();
        willEncryptPlaintext = orig_willEncryptPlaintext;
        getPBKDF2Salt = orig_getPBKDF2Salt;
        getPBKDF2Iterations = orig_getPBKDF2Iterations;
        getValueAt = orig_getValueAt;
    });

    it('return an empty string if the plaintext is empty', function() {
        const plaintext = '';
        const expected = '';

        expect(willRequestEncryption(plaintext)).toBe(expected);
        expect(willEncryptPlaintext.called).toBe(false);
    });

    it('will call willEncryptPlaintext with the proper arguments', function() {
        getValueAt.returns('such secret');
        getPBKDF2Salt.returns('this is a salt');
        getPBKDF2Iterations.returns(2);
        const b_iv = new Uint8Array(16);
        b_iv.set([1, 2, 3]);
        getRandomValueStub.callsFake((typedArray) => {
            expect(typedArray instanceof Uint8Array).toBe(true);
            expect(typedArray.length).toBe(16);
        }).returns(b_iv);

        willRequestEncryption('some text');
        expect(willEncryptPlaintext.called).toBe(true);
        expect(getValueAt.calledWith('secret'));
        expect(willEncryptPlaintext.calledWith(
            'some text', 'such secret', {
                salt: 'this is a salt',
                iterations: 2,
            }, b_iv
        )).toBe(true);
    });
});
