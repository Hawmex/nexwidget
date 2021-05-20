import { assert, expect } from '@esm-bundle/chai';
import { css } from '../../src/lib/css-tag.js';

it('sanitizes styles', () =>
  assert.throws(
    () =>
      css`
        ${'test string'}
      `,
    Error,
    'Value passed to a "css" function must be a "css" function result or a number.',
  ));

it('generates valid CSSText', () => {
  const margin = 0;
  const color = css`red`;

  const { CSSText } = css`
    body {
      margin: ${margin}px;
      background: ${color};
    }
  `;

  const expectedCSSText = `
    body {
      margin: 0px;
      background: red;
    }
  `;

  expect(CSSText).to.equal(expectedCSSText);
});

it('generates valid styleSheet', () => {
  const margin = 0;
  const color = css`red`;

  const { styleSheet } = css`
    body {
      margin: ${margin}px;
      background: ${color};
    }
  `;

  const expectedStyleSheet = new CSSStyleSheet();

  expectedStyleSheet.replaceSync(`
      body {
        margin: 0px;
        background: red;
      }
    `);

  expect(JSON.stringify(styleSheet)).to.equal(JSON.stringify(expectedStyleSheet));
});
