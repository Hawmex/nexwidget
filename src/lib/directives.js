import { directive } from 'lit-html';
import { Nexbounce } from 'nexbounce';

const latestValues = new WeakMap();
const lazyLoadRenderDebouncer = new Nexbounce();

export const lazyLoad = directive((widgetImport, value) => (part) => {
  latestValues.set(part, value);

  addPendingTask(part.startNode.parentNode, widgetImport).then(() =>
    lazyLoadRenderDebouncer.enqueue(() => {
      if (latestValues.get(part) === value) {
        part.setValue(value);
        part.commit();
      }
    }),
  );
});
