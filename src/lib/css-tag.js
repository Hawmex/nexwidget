'use strict';

class CSSResult {
  static #checkValue(value) {
    if (value instanceof CSSResult) return value.CSSText;
    else if (typeof value === 'number') return value;
    else
      throw new Error(
        `Value passed to a "css" function must be a "css" function result or a number.`,
      );
  }

  static #refine(strings, values) {
    return values.reduce(
      (accumulator, value, index) =>
        accumulator + CSSResult.#checkValue(value) + strings[index + 1],
      strings[0],
    );
  }

  #CSSText;
  #styleSheet;

  constructor(strings, values) {
    this.#CSSText = CSSResult.#refine(strings, values);
  }

  get styleSheet() {
    if (this.#styleSheet === undefined) {
      this.#styleSheet = new CSSStyleSheet();
      this.#styleSheet.replaceSync(this.#CSSText);
    }

    return this.#styleSheet;
  }
}

export const css = (strings, ...values) => new CSSResult(strings, values);
