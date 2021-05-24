import { addPendingTask } from './pending-task.js';
import { Nexwidget } from '../nexwidget.js';

/**
 * @param {new () => Nexwidget} Base
 * @returns {typeof WithPendingTaskEmitter}
 */

export const WithPendingTaskEmitter = (Base) =>
  class WithPendingTaskEmitter extends Base {
    /**
     *
     * @param {Promise<unknown>} task
     * @returns {Promise<unknown>}
     */

    addPendingTask(task) {
      return addPendingTask(this, task);
    }
  };

/**
 * @param {new () => Nexwidget} Base
 * @returns {typeof WithPendingTaskHandler}
 */

export const WithPendingTaskHandler = (Base) => {
  class WithPendingTaskHandler extends Base {
    #pendingTaskCount = 0;

    #handlePendingTask({ detail: { task } }) {
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

  WithPendingTaskHandler.createAttributes({ hasPendingTask: Boolean });
  WithPendingTaskHandler.createReactive(['hasPendingTask']);

  return WithPendingTaskHandler;
};

/**
 * @param {new () => Nexwidget} Base
 * @returns {typeof WithDependencyConsumer}
 */

export const WithDependencyConsumer = (Base) =>
  class WithDependencyConsumer extends Base {
    /**
     * @param {string} key
     * @returns {unknown}
     */

    requestDependency(key) {
      const dependencyRequest = new CustomEvent('dependency-request', {
        detail: { key },
        composed: true,
        bubbles: true,
      });

      this.dispatchEvent(dependencyRequest);

      if (Reflect.has(dependencyRequest.detail, 'value')) return dependencyRequest.detail.value;
      else throw new Error(`No such dependency is provided.`);
    }
  };

/**
 * @param {new () => Nexwidget} Base
 * @returns {typeof WithDependencyProvider}
 */

export const WithDependencyProvider = (Base) =>
  class WithDependencyProvider extends Base {
    #dependencies = new Map();

    #handleRequest(event) {
      const { key } = event.detail;

      if (this.#dependencies.has(key)) {
        event.detail.value = this.#dependencies.get(key);
        event.stopPropagation();
      }
    }

    addedCallback() {
      super.addedCallback();
      this.addEventListener('dependency-request', this.#handleRequest.bind(this), {
        signal: this.removedSignal,
      });
    }

    /**
     * @param {string} key
     * @param {unknown} value
     */

    provideDependency(key, value) {
      this.#dependencies.set(key, value);
    }
  };
