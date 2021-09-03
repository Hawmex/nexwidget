import { directive, NodePart } from 'lit-html/lit-html.js';
import { Nexbounce } from 'nexbounce/nexbounce.js';
import { addPendingTask } from '../lib/add-pending-task.js';

const latestValues = new WeakMap<NodePart, HTMLElement>();
const lazyLoadRenderDebouncer = new Nexbounce();

export const lazyLoad = directive(
  (widgetImport: Promise<unknown>, value: HTMLElement) => (part: NodePart) => {
    latestValues.set(part, value);

    addPendingTask(part.startNode.parentNode!, widgetImport).then(() =>
      lazyLoadRenderDebouncer.enqueue(() => {
        if (latestValues.get(part) === value) {
          part.setValue(value);
          part.commit();
        }
      }),
    );
  },
);
