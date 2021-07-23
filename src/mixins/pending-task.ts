import { addPendingTask, AddPendingTaskEvent } from '../lib/add-pending-task.js';
import { Constructor, Nexwidget } from '../nexwidget.js';

export declare class WithPendingTaskEmitterInterface {
  addPendingTask<T>(task: Promise<T>): Promise<T>;
}

export const WithPendingTaskEmitter = <T extends Constructor<Nexwidget>>(Base: T) => {
  class WithPendingTaskEmitter extends Base {
    addPendingTask<T>(task: Promise<T>) {
      return addPendingTask(this, task);
    }
  }

  return <Constructor<WithPendingTaskEmitterInterface> & T>WithPendingTaskEmitter;
};

export declare class WithPendingTaskHandlerInterface {
  hasPendingTask: boolean;
}

export const WithPendingTaskHandler = <T extends Constructor<Nexwidget>>(Base: T) => {
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

  (<typeof Nexwidget>(<unknown>WithPendingTaskHandler)).createAttributes({
    hasPendingTask: Boolean,
  });

  (<typeof Nexwidget>(<unknown>WithPendingTaskHandler)).createReactives(['hasPendingTask']);

  return <Constructor<WithPendingTaskHandlerInterface> & T>WithPendingTaskHandler;
};
