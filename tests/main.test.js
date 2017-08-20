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
