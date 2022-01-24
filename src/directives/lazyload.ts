import { AsyncDirective, directive } from 'lit-html/async-directive.js';
import { ChildPart, noChange } from 'lit-html/lit-html.js';
import { Debouncer } from 'nexbounce/nexbounce.js';
import { addPendingTask } from '../lib/add-pending-task.js';

export class LazyloadDirective extends AsyncDirective {
  readonly #renderDebouncer = new Debouncer();

  #latestValue?: HTMLElement;
  #part?: ChildPart;

  render(widgetImport: Promise<unknown>, value: HTMLElement) {
    this.#latestValue = value;

    addPendingTask(this.#part?.startNode?.parentNode!, widgetImport).then(() =>
      this.#renderDebouncer.enqueue(() => {
        if (this.#latestValue === value) this.setValue(value);
      }),
    );

    return noChange;
  }

  override update(
    part: ChildPart,
    [widgetImport, value]: [Promise<unknown>, HTMLElement],
  ) {
    this.#part = part;

    return this.render(widgetImport, value);
  }
}

export const lazyload = directive(LazyloadDirective);
