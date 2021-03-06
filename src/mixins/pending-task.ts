import {
  addPendingTask,
  AddPendingTaskEvent,
} from '../lib/add-pending-task.js';
import { Constructor, Nexwidget } from '../nexwidget.js';

export declare class WithPendingTaskEmitterInterface {
  addPendingTask<T>(task: Promise<T>): Promise<T>;
}

export const WithPendingTaskEmitter = <T extends Constructor<Nexwidget>>(
  Base: T,
) => {
  class WithPendingTaskEmitter extends Base {
    addPendingTask<T>(task: Promise<T>) {
      return addPendingTask(this, task);
    }
  }

  return <Constructor<WithPendingTaskEmitterInterface> & T>(
    WithPendingTaskEmitter
  );
};

export declare class WithPendingTaskHandlerInterface {
  get hasPendingTask(): boolean;
  set hasPendingTask(v: boolean);
}

export const WithPendingTaskHandler = <T extends Constructor<Nexwidget>>(
  Base: T,
) => {
  interface WithPendingTaskHandler {
    get hasPendingTask(): boolean;
    set hasPendingTask(v: boolean);
  }

  class WithPendingTaskHandler extends Base {
    static {
      (<typeof Nexwidget & typeof WithPendingTaskHandler>this).createAttributes(
        [{ key: 'hasPendingTask', type: 'boolean' }],
      );

      (<typeof Nexwidget & typeof WithPendingTaskHandler>this).createReactives([
        'hasPendingTask',
      ]);
    }

    #pendingTaskCount = 0;

    #handlePendingTask({ detail: { task } }: AddPendingTaskEvent) {
      this.hasPendingTask = true;
      this.#pendingTaskCount += 1;

      task.finally(() => {
        this.#pendingTaskCount -= 1;
        this.hasPendingTask = this.#pendingTaskCount > 0;
      });
    }

    override addedCallback() {
      super.addedCallback();

      this.addEventListener(
        'pending-task',
        this.#handlePendingTask.bind(this),
        {
          signal: this.removedSignal,
        },
      );
    }
  }

  return <Constructor<WithPendingTaskHandlerInterface> & T>(
    WithPendingTaskHandler
  );
};
