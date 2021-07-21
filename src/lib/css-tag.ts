export type CSSValue = CSSResult | number;

class CSSResult {
  static #checkValue(value: CSSValue) {
    if (value instanceof CSSResult) return value.#CSSText;
    else if (typeof value === 'number') return value;
    else
      throw new Error(
        `Value passed to a "css" function must be a "css" function result or a number.`,
      );
  }

  static #refine(strings: TemplateStringsArray, values: CSSValue[]) {
    return values.reduce(
      (accumulator, value, index) =>
        accumulator + CSSResult.#checkValue(value) + strings[index + 1],
      strings[0],
    );
  }

  #CSSText: string;
  #styleSheet?: CSSStyleSheet;

  constructor(strings: TemplateStringsArray, values: CSSValue[]) {
    this.#CSSText = CSSResult.#refine(strings, values);
  }

  get styleSheet() {
    if (this.#styleSheet === undefined) {
      this.#styleSheet = new CSSStyleSheet();
      //@ts-ignore
      this.#styleSheet.replaceSync(this.#CSSText);
    }

    return this.#styleSheet;
  }
}

export const css = (strings: TemplateStringsArray, ...values: CSSValue[]) =>
  new CSSResult(strings, values).styleSheet;
