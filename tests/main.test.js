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


describe('bufferToString', () => {
    it('empty array', () => {
        const result = bufferToString(new Uint8Array([]));
        const expected = '';
        expect(result).toEqual(expected);
    });

    it('empty buffer', () => {
        const result = bufferToString(new Uint8Array([]).buffer);
        const expected = '';
        expect(result).toEqual(expected);
    });

    it('ascii array', () => {
        const result = bufferToString(new Uint8Array([97, 98]));
        const expected = 'ab';
        expect(result).toEqual(expected);
    });

    it('ascii buffer', () => {
        const result = bufferToString(new Uint8Array([97, 98]).buffer);
        const expected = 'ab';
        expect(result).toEqual(expected);
    });

    it('astral plane characters', () => {
        const result = bufferToString(new Uint8Array([240, 144, 132, 183]));
        const expected = '𐄷';
        expect(result).toEqual(expected);
    });
})


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


describe('getRandomLowercaseString', () => {
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
                expect(typedArray.length).toBe(4);
                typedArray.set([0, 1, 2, 259]);
            });

        const result = getRandomLowercaseString(4);
        const expected = 'abcd';
        expect(result).toEqual(expected);
    });

    it('it generates an empty string', () => {
        getRandomValueStub
            .callsFake((typedArray) => {
                expect(typedArray instanceof Uint8Array).toBe(true);
                expect(typedArray.length).toBe(0);
                typedArray.set([]);
            });

        const result = getRandomLowercaseString(0);
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

        const result = getRandomLowercaseString(1);
        const expected = 'b';
        expect(result).toEqual(expected);
    });
});

describe('willGenerateKey',  () => {
    it('generates a non-extractable key', async function() {
        const key = await willGenerateKey(
            'such secret',
            new Uint8Array([0, 1, 2, 3]),
            2,
        );
        expect(key.extractable).toBe(false);
        expect(key.usages).toEqual(['encrypt', 'decrypt']);
    });

    it('throw GenerateKeyError if iterations is not a number', async function() {
        try {
            await willGenerateKey(
                'such secret',
                new Uint8Array([0, 1, 2, 3]),
                'not a number',
            );
            throw new Error('Expected exception');
        } catch(e) {
            expect(e instanceof GenerateKeyError).toBe(true);
        }
    });
});

describe('willEncryptPlaintext',  () => {
    const plaintext = 'some text';
    const secret = 'such secret';
    const b_salt = new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]);
    const iterations = 2;
    const b_iv = new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);

    it('produces the same result if the parameters did not change', async function() {
        const result1 = await willEncryptPlaintext(plaintext, secret, b_salt, iterations, b_iv);
        const result2 = await willEncryptPlaintext(plaintext, secret, b_salt, iterations, b_iv);
        expect(result1).toBe(result2);
    });

    it('produces different results if the salt has changed', async function() {
        const result1 = await willEncryptPlaintext(plaintext, secret, b_salt, iterations, b_iv);
        const result2 = await willEncryptPlaintext(plaintext, secret, new Uint8Array([1, 1, 1]), iterations, b_iv);
        expect(result1).not.toBe(result2);
    });

    it('produces different results if the iterations has changed', async function() {
        const result1 = await willEncryptPlaintext(plaintext, secret, b_salt, iterations, b_iv);
        const result2 = await willEncryptPlaintext(plaintext, secret, b_salt, iterations + 1, b_iv);
        expect(result1).not.toBe(result2);
    });

    it('produces different results if the plaintext has changed', async function() {
        const result1 = await willEncryptPlaintext(plaintext, secret, b_salt, iterations, b_iv);
        const result2 = await willEncryptPlaintext('different plaintext', secret, b_salt, iterations, b_iv);
        expect(result1).not.toBe(result2);
    });

    it('produces different results if the secret has changed', async function() {
        const result1 = await willEncryptPlaintext(plaintext, secret, b_salt, iterations, b_iv);
        const result2 = await willEncryptPlaintext(plaintext, 'different secret', b_salt, iterations, b_iv);
        expect(result1).not.toBe(result2);
    });

    it('produces different results if the iv has changed', async function() {
        const b_iv_1 = new Uint8Array(16);
        const b_iv_2 = new Uint8Array(16);
        b_iv_2.set([1, 2, 3]);

        const result1 = await willEncryptPlaintext(plaintext, secret, b_salt, iterations, b_iv_1);
        const result2 = await willEncryptPlaintext(plaintext, secret, b_salt, iterations, b_iv_2);
        expect(result1).not.toBe(result2);
    });

    it('produces output following a specific format', async function() {
        const result = await willEncryptPlaintext(plaintext, secret, b_salt, iterations, b_iv);
        expect(typeof result).toBe('string');
        expect(result.length).toBeGreaterThan(66)

        const expectedResult = [
            '00', // format version
            '00000002', // iterations
            '000102030405060708090a0b0c0d0e0f', // salt
            '000102030405060708090a0b', // iv
            'ed5fe4b042d792907de0517b6fefd0161e2adc2d004ac4d3d0', // cyphertext
        ].join('')

        expect(result).toBe(expectedResult);
    });
});

describe('willDecryptCiphertext',  function () {
    it('can decrypt encrypted data', async function() {
        const secret = 'such secret';
        const encryptedBox = [
            '00', // format version
            '00000002', // iterations
            '000102030405060708090a0b0c0d0e0f', // salt
            '000102030405060708090a0b', // iv
            'ed5fe4b042d792907de0517b6fefd0161e2adc2d004ac4d3d0', // cyphertext
        ].join('')

        const plaintext = await willDecryptCiphertext(encryptedBox, secret);
        expect(plaintext).toBe('some text');
    });

    it('throws SubtleDecryptError if the content is too short', async function() {
        const secret = 'such secret';

        try {
            await willDecryptCiphertext('a'.repeat(66), secret);
            throw new Error('Expected a different exception');
        } catch(e) {
            expect(e instanceof SubtleDecryptError).toBe(true);
            expect(e.message).toBe('Content is too short');
        }
    });

    it('throws SubtleDecryptError if the format version is not supported', async function() {
        const secret = 'such secret';
        const encryptedBox = [
            '10', // format version
            '00000002', // iterations
            '000102030405060708090a0b0c0d0e0f', // salt
            '000102030405060708090a0b', // iv
            'ed5fe4b042d792907de0517b6fefd0161e2adc2d004ac4d3d0', // cyphertext
        ].join('')

        try {
            await willDecryptCiphertext(encryptedBox, secret);
            throw new Error('Expected a different exception');
        } catch(e) {
            expect(e instanceof SubtleDecryptError).toBe(true);
            expect(e.message).toBe('Unsupported encryption format (perhaps generated by a newer Svanill version)');
        }
    });

    it('throws SubtleDecryptError if the iteration number is too big', async function() {
        const secret = 'such secret';
        const encryptedBox = [
            '00', // format version
            '10000002', // iterations
            '000102030405060708090a0b0c0d0e0f', // salt
            '000102030405060708090a0b', // iv
            'ed5fe4b042d792907de0517b6fefd0161e2adc2d004ac4d3d0', // cyphertext
        ].join('')

        try {
            await willDecryptCiphertext(encryptedBox, secret);
            throw new Error('Expected a different exception');
        } catch(e) {
            expect(e instanceof SubtleDecryptError).toBe(true);
            expect(e.message).toBe('The decoded iterations number is dangerously high');
        }
    });

    it('throws SubtleDecryptError if the salt is wrong', async function() {
        const secret = 'such secret';
        const encryptedBox = [
            '00', // format version
            '00000002', // iterations
            '00000000000000000000000000000000', // salt
            '000102030405060708090a0b', // iv
            'ed5fe4b042d792907de0517b6fefd0161e2adc2d004ac4d3d0', // cyphertext
        ].join('')

        try {
            await willDecryptCiphertext(encryptedBox, secret);
            throw new Error('Expected a different exception');
        } catch(e) {
            expect(e instanceof SubtleDecryptError).toBe(true);
            expect(e.message).toBe('Password and ciphertext do not match');
        }
    });

    it('throws SubtleDecryptError if the iv is wrong', async function() {
        const secret = 'such secret';
        const encryptedBox = [
            '00', // format version
            '00000002', // iterations
            '000102030405060708090a0b0c0d0e0f', // salt
            '000000000000000000000000', // iv
            'ed5fe4b042d792907de0517b6fefd0161e2adc2d004ac4d3d0', // cyphertext
        ].join('')

        try {
            await willDecryptCiphertext(encryptedBox, secret);
            throw new Error('Expected a different exception');
        } catch(e) {
            expect(e instanceof SubtleDecryptError).toBe(true);
            expect(e.message).toBe('Password and ciphertext do not match');
        }
    });

    it('throws SubtleDecryptError if the ciphertext cannot be decrypted', async function() {
        const secret = 'such secret';
        const encryptedBox = [
            '00', // format version
            '00000002', // iterations
            '000102030405060708090a0b0c0d0e0f', // salt
            '000102030405060708090a0b', // iv
            '000000000000', // cyphertext
        ].join('')

        try {
            await willDecryptCiphertext(encryptedBox, secret);
            throw new Error('Expected a different exception');
        } catch(e) {
            expect(e instanceof SubtleDecryptError).toBe(true);
            expect(e.message).toBe('Password and ciphertext do not match');
        }
    });
});

describe('encryptor and decryptor uses the same format',  function () {
    it('can decrypt encrypted data', async function() {
        // feeding willEncryptPlaintext to willDecryptCiphertext ensure that when we
        // tested the two functions separatedly we didn't expect uncompatible formats.

        const plaintext = 'some text';
        const secret = 'such secret';
        const b_salt = new Uint8Array(16);
        const iterations = 2;
        const b_iv = new Uint8Array(12);

        const encryptedBox = await willEncryptPlaintext(plaintext, secret, b_salt, iterations, b_iv);
        const decryptedPlaintext = await willDecryptCiphertext(encryptedBox, secret);

        expect(decryptedPlaintext).toBe(plaintext);
    });
});

describe('willRequestEncryption',  function () {
    let getRandomValueStub;
    let orig_willEncryptPlaintext = willEncryptPlaintext;
    let orig_getValueAt = getValueAt;
    let orig_PBKDF2_ITERATIONS = PBKDF2_ITERATIONS;

    beforeEach(() => {
        getRandomValueStub = sinon.stub(window.crypto, 'getRandomValues');
        willEncryptPlaintext = sinon.stub();
        PBKDF2_ITERATIONS = 2;
        getValueAt = sinon.stub();
    });

    afterEach(() => {
        getRandomValueStub.restore();
        willEncryptPlaintext = orig_willEncryptPlaintext;
        PBKDF2_ITERATIONS = orig_PBKDF2_ITERATIONS;
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
        const b_iv = new Uint8Array(12);
        const b_salt = new Uint8Array(16);

        getRandomValueStub.onFirstCall().
            callsFake((typedArray) => {
                expect(typedArray instanceof Uint8Array).toBe(true);
                expect(typedArray.length).toBe(12);
                return b_iv;
        })

        getRandomValueStub.onSecondCall().
            callsFake((typedArray) => {
            expect(typedArray instanceof Uint8Array).toBe(true);
            expect(typedArray.length).toBe(16);
            return b_salt
        })

        willRequestEncryption('some text');
        expect(willEncryptPlaintext.called).toBe(true);
        expect(getValueAt.calledWith('secret'))
        expect(willEncryptPlaintext.calledWith(
            'some text', 'such secret', b_salt, 2, b_iv
        )).toBe(true);
    });
});
