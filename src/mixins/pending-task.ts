import { addPendingTask, AddPendingTaskEvent } from '../lib/add-pending-task.js';
import { NexwidgetConstructor } from '../nexwidget.js';

export const WithPendingTaskEmitter = <T extends NexwidgetConstructor>(Base: T) =>
  class WithPendingTaskEmitter extends Base {
    addPendingTask(task: Promise<any>) {
      return addPendingTask(this, task);
    }
  };

export const WithPendingTaskHandler = <T extends NexwidgetConstructor>(Base: T) => {
  class WithPendingTaskHandler extends Base {
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
  }

  //@ts-ignore
  WithPendingTaskHandler.createAttributes({ hasPendingTask: Boolean });
  //@ts-ignore
  WithPendingTaskHandler.createReactives(['hasPendingTask']);

  return WithPendingTaskHandler;
};
