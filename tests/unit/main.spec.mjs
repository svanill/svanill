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
