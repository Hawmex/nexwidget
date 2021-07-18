import { addPendingTask, AddPendingTaskEvent } from '../lib/add-pending-task.js';
import { Nexwidget } from '../nexwidget.js';

export const WithPendingTaskEmitter = <T extends new (...args: any[]) => Nexwidget>(Base: T) =>
  class extends Base {
    addPendingTask<T>(task: Promise<T>) {
      return addPendingTask(this, task);
    }
  };

export const WithPendingTaskHandler = <T extends new (...args: any[]) => Nexwidget>(Base: T) => {
  const WithPendingTaskHandler = class extends Base {
    #pendingTaskCount = 0;
    hasPendingTask = false;

    #handlePendingTask({ detail: { task } }: AddPendingTaskEvent) {
      this.hasPendingTask = true;
      this.#pendingTaskCount += 1;

      task.finally(() => {
        this.#pendingTaskCount -= 1;
        this.hasPendingTask = this.#pendingTaskCount > 0;
      });
    }

    addedCallback() {
      super.addedCallback();
      this.addEventListener('pending-task', this.#handlePendingTask.bind(this), {
        signal: this.removedSignal,
      });
    }
  };

  (WithPendingTaskHandler as unknown as typeof Nexwidget).createAttributes({
    hasPendingTask: Boolean,
  });

  (WithPendingTaskHandler as unknown as typeof Nexwidget).createReactives(['hasPendingTask']);

  return WithPendingTaskHandler;
};
