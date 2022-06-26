// @ts-check
import { test, expect } from '@playwright/test';
import { URL } from 'url';

import crypto from 'crypto';

/**
 * @param {number} ms how long to wait, in milliseconds
 */
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const store_url = 'http://localhost:5000';
const upload_base_url = 'http://testbucket.localhost:9000';
const derive_key_iterations = 2;

test.use({ offline: true, screenshot: 'off' });
test.describe.configure({ mode: 'parallel' });

// So... we want to run our tested functions from the browser.
// We can do that with page.evaluate, but everything we get back
// pass through JSON.stringify/parse
// Uint8Array can't be serialized that way (you get back e.g. {0: 13, 1: 2})
// which can't be distinguished from an object. On top of it, we can't
// create Uint8Array in nodejs to compare them anyway...
// So since we want just to run some tests... whenever we get an object whose
// keys are numbers we simply keep Object.values() of that object
// The test will compare it to an array containing the expected numbers
function d(o) {
  if (
    typeof o === 'object' &&
    Object.values(o).every((v) => typeof v === 'number')
  ) {
    return Object.values(o);
  }
  throw new Error(`not Uint8Array: ${o}`);
}

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

test.describe('stringToUint8Array', () => {
  test('empty string', async ({ page }) => {
    // @ts-ignore
    const t = () => stringToUint8Array('');
    const result = await page.evaluate(t);
    const expected = [];
    expect(d(result)).toEqual(expected);
  });

  test('ascii string', async ({ page }) => {
    // @ts-ignore
    const t = () => stringToUint8Array('ab');
    const result = await page.evaluate(t);
    const expected = [97, 98];
    expect(d(result)).toEqual(expected);
  });

  test('astral plane characters', async ({ page }) => {
    // @ts-ignore
    const t = () => stringToUint8Array('𐄷');
    const result = await page.evaluate(t);
    const expected = [240, 144, 132, 183];
    expect(d(result)).toEqual(expected);
  });
});

test.describe('bufferToString', () => {
  test('empty array', async ({ page }) => {
    // @ts-ignore
    const t = () => bufferToString(new Uint8Array([]));
    const result = await page.evaluate(t);
    const expected = '';
    expect(result).toEqual(expected);
  });

  test('empty buffer', async ({ page }) => {
    // @ts-ignore
    const t = () => bufferToString(new Uint8Array([]).buffer);
    const result = await page.evaluate(t);
    const expected = '';
    expect(result).toEqual(expected);
  });

  test('ascii array', async ({ page }) => {
    // @ts-ignore
    const t = () => bufferToString(new Uint8Array([97, 98]));
    const result = await page.evaluate(t);
    const expected = 'ab';
    expect(result).toEqual(expected);
  });

  test('ascii buffer', async ({ page }) => {
    // @ts-ignore
    const t = () => bufferToString(new Uint8Array([97, 98]).buffer);
    const result = await page.evaluate(t);
    const expected = 'ab';
    expect(result).toEqual(expected);
  });

  test('astral plane characters', async ({ page }) => {
    // @ts-ignore
    const t = () => bufferToString(new Uint8Array([240, 144, 132, 183]));
    const result = await page.evaluate(t);
    const expected = '𐄷';
    expect(result).toEqual(expected);
  });
});

test.describe('bufToHex', () => {
  test('empty Uint8Array', async ({ page }) => {
    // @ts-ignore
    const t = () => bufToHex(new Uint8Array([]));
    const result = await page.evaluate(t);
    const expected = '';
    expect(result).toEqual(expected);
  });

  test('empty Buffer', async ({ page }) => {
    // @ts-ignore
    const t = () => bufToHex(new Uint8Array([]).buffer);
    const result = await page.evaluate(t);
    const expected = '';
    expect(result).toEqual(expected);
  });

  test('can encode Uint8Array', async ({ page }) => {
    // @ts-ignore
    const t = () => bufToHex(new Uint8Array([0, 1, 15, 16, 17]));
    const result = await page.evaluate(t);
    const expected = '00010f1011';
    expect(result).toEqual(expected);
  });

  test('can encode Buffer', async ({ page }) => {
    // @ts-ignore
    const t = () => bufToHex(new Uint8Array([0, 1, 15, 16, 17]).buffer);
    const result = await page.evaluate(t);
    const expected = '00010f1011';
    expect(result).toEqual(expected);
  });
});

test.describe('getRandomLowercaseString', () => {
  test.beforeEach(async ({ page }) => {
    await page.evaluate(() => {
      // @ts-ignore
      window._orig_getRandomValues = window.crypto.getRandomValues;

      // This function can only work in browsers, we will pass it serialized
      // when evaluating tests
      function mockGetRandomValues(values) {
        return function (typedArray) {
          if (!(typedArray instanceof Uint8Array)) {
            throw new Error('getRandomValues mock must receive a typedArray');
          }
          if (typedArray.length !== values.length) {
            throw new Error(
              `getRandomValues mock, wrong typedArray length (got ${typedArray.length}, expected ${values.length})`
            );
          }

          typedArray.set(values);
          return typedArray;
        };
      }

      // @ts-ignore
      window.mockGetRandomValues = mockGetRandomValues;
    });
  });

  test.afterEach(async ({ page }) => {
    await page.evaluate(() => {
      // @ts-ignore
      window.crypto.getRandomValues = window._orig_getRandomValues;
    });
  });

  test('it generates an empty string', async ({ page }) => {
    const t = () => {
      // @ts-ignore
      window.crypto.getRandomValues = mockGetRandomValues([]);

      // @ts-ignore
      return getRandomLowercaseString(0);
    };

    const result = await page.evaluate(t);
    const expected = '';
    expect(result).toEqual(expected);
  });

  test('it generates a random string of length 1', async ({ page }) => {
    const t = () => {
      // @ts-ignore
      window.crypto.getRandomValues = mockGetRandomValues([2]);

      // @ts-ignore
      return getRandomLowercaseString(1);
    };

    const result = await page.evaluate(t);
    const expected = 'c';
    expect(result).toEqual(expected);
  });

  test('it generates a random string of length 4', async ({ page }) => {
    const t = () => {
      // @ts-ignore
      window.crypto.getRandomValues = mockGetRandomValues([0, 1, 2, 3]);

      // @ts-ignore
      return getRandomLowercaseString(4);
    };

    const result = await page.evaluate(t);
    const expected = 'abcd';
    expect(result).toEqual(expected);
  });
});

test.describe('willGenerateKey', () => {
  test('generates a non-extractable key', async ({ page }) => {
    const t = async () => {
      // @ts-ignore
      const key = await willGenerateKey(
        'such secret',
        new Uint8Array([0, 1, 2, 3]),
        2
      );

      if (key.extractable !== false) {
        throw new Error('Key should not be extractable!');
      }

      if (JSON.stringify(key.usages) !== '["encrypt","decrypt"]') {
        throw new Error(`Expected ['encrypt', 'decrypt'], got ${key.usages}`);
      }
    };

    await page.evaluate(t);
  });

  test('throw GenerateKeyError if iterations is not a number', async ({
    page,
  }) => {
    const t = async () => {
      try {
        // @ts-ignore
        const key = await willGenerateKey(
          'such secret',
          new Uint8Array([0, 1, 2, 3]),
          'not a number'
        );

        throw new Error('Expected exception');
      } catch (e) {
        // @ts-ignore
        if (!(e instanceof GenerateKeyError)) {
          throw e;
        }
      }
    };

    await page.evaluate(t);
  });
});

test.describe('willEncryptPlaintext', () => {
  const plaintext = 'some text';
  const secret = 'such secret';
  // later we make it a Uint8Array
  const salt = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
  const iterations = 2;
  // later we make it a Uint8Array
  const iv = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

  const bagOfArgs = [plaintext, secret, salt, iterations, iv];

  test('produces the same result if the parameters did not change', async ({
    page,
  }) => {
    const t = async ([plaintext, secret, salt, iterations, iv]) => {
      // @ts-ignore
      const result1 = await willEncryptPlaintext(
        plaintext,
        secret,
        new Uint8Array(salt),
        iterations,
        new Uint8Array(iv)
      );

      // @ts-ignore
      const result2 = await willEncryptPlaintext(
        plaintext,
        secret,
        new Uint8Array(salt),
        iterations,
        new Uint8Array(iv)
      );

      return [result1, result2];
    };

    // @ts-ignore
    const [result1, result2] = await page.evaluate(t, bagOfArgs);
    expect(result1).toBe(result2);
  });

  test('produces different results if the salt has changed', async ({
    page,
  }) => {
    const t = async ([plaintext, secret, salt, iterations, iv]) => {
      // @ts-ignore
      const result1 = await willEncryptPlaintext(
        plaintext,
        secret,
        new Uint8Array(salt),
        iterations,
        new Uint8Array(iv)
      );

      // @ts-ignore
      const result2 = await willEncryptPlaintext(
        plaintext,
        secret,
        new Uint8Array([1, 1, 1]),
        iterations,
        new Uint8Array(iv)
      );

      return [result1, result2];
    };

    // @ts-ignore
    const [result1, result2] = await page.evaluate(t, bagOfArgs);
    expect(result1).not.toBe(result2);
  });

  test('produces different results if the iterations has changed', async ({
    page,
  }) => {
    const t = async ([plaintext, secret, salt, iterations, iv]) => {
      // @ts-ignore
      const result1 = await willEncryptPlaintext(
        plaintext,
        secret,
        new Uint8Array(salt),
        iterations,
        new Uint8Array(iv)
      );

      // @ts-ignore
      const result2 = await willEncryptPlaintext(
        plaintext,
        secret,
        new Uint8Array(salt),
        iterations + 1,
        new Uint8Array(iv)
      );
      return [result1, result2];
    };

    // @ts-ignore
    const [result1, result2] = await page.evaluate(t, bagOfArgs);
    expect(result1).not.toBe(result2);
  });

  test('produces different results if the plaintext has changed', async ({
    page,
  }) => {
    const t = async ([plaintext, secret, salt, iterations, iv]) => {
      // @ts-ignore
      const result1 = await willEncryptPlaintext(
        plaintext,
        secret,
        new Uint8Array(salt),
        iterations,
        new Uint8Array(iv)
      );

      // @ts-ignore
      const result2 = await willEncryptPlaintext(
        'different plaintext',
        secret,
        new Uint8Array(salt),
        iterations,
        new Uint8Array(iv)
      );

      return [result1, result2];
    };

    // @ts-ignore
    const [result1, result2] = await page.evaluate(t, bagOfArgs);
    expect(result1).not.toBe(result2);
  });

  test('produces different results if the secret has changed', async ({
    page,
  }) => {
    const t = async ([plaintext, secret, salt, iterations, iv]) => {
      // @ts-ignore
      const result1 = await willEncryptPlaintext(
        plaintext,
        secret,
        new Uint8Array(salt),
        iterations,
        new Uint8Array(iv)
      );

      // @ts-ignore
      const result2 = await willEncryptPlaintext(
        plaintext,
        'different secret',
        new Uint8Array(salt),
        iterations,
        new Uint8Array(iv)
      );

      return [result1, result2];
    };

    // @ts-ignore
    const [result1, result2] = await page.evaluate(t, bagOfArgs);
    expect(result1).not.toBe(result2);
  });

  test('produces different results if the iv has changed', async ({ page }) => {
    const t = async ([plaintext, secret, salt, iterations, iv]) => {
      const b_iv_1 = new Uint8Array(16);
      const b_iv_2 = new Uint8Array(16);
      b_iv_2.set([1, 2, 3]);

      // @ts-ignore
      const result1 = await willEncryptPlaintext(
        plaintext,
        secret,
        new Uint8Array(salt),
        iterations,
        b_iv_1
      );

      // @ts-ignore
      const result2 = await willEncryptPlaintext(
        plaintext,
        secret,
        new Uint8Array(salt),
        iterations,
        b_iv_2
      );

      return [result1, result2];
    };

    // @ts-ignore
    const [result1, result2] = await page.evaluate(t, bagOfArgs);
    expect(result1).not.toBe(result2);
  });

  test('produces output following a specific format', async ({ page }) => {
    const t = async ([plaintext, secret, salt, iterations, iv]) => {
      // @ts-ignore
      return await willEncryptPlaintext(
        plaintext,
        secret,
        new Uint8Array(salt),
        iterations,
        new Uint8Array(iv)
      );
    };

    // @ts-ignore
    const result = await page.evaluate(t, bagOfArgs);
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(66);

    const expectedResult = [
      '00', // format version
      '00000002', // iterations
      '000102030405060708090a0b0c0d0e0f', // salt
      '000102030405060708090a0b', // iv
      'ed5fe4b042d792907da28727bf418c3f8ceb8d0ea4370fe1c6', // cyphertext
    ].join('');

    expect(result).toBe(expectedResult);
  });
});
