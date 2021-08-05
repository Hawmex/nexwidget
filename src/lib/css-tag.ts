declare global {
  interface CSSStyleSheet {
    replaceSync(value: string): void;
  }
}

export class CSSResult {
  #styleSheet: CSSStyleSheet;

  constructor(strings: TemplateStringsArray) {
    this.#styleSheet = new CSSStyleSheet();
    this.#styleSheet.replaceSync(strings[0]);
  }

  get styleSheet() {
    return this.#styleSheet;
  }
}

export const css = (strings: TemplateStringsArray) => new CSSResult(strings).styleSheet;
