'use strict';

import { addPendingTask } from './pending-task.js';

export const WithPendingTaskEmitter = (Base) =>
  class WithPendingTaskEmitter extends Base {
    addPendingTask(task) {
      return addPendingTask(this, task);
    }
  };

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
  WithPendingTaskHandler.createReactives(['hasPendingTask']);

  return WithPendingTaskHandler;
};

export const WithDependencyConsumer = (Base) =>
  class WithDependencyConsumer extends Base {
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

    provideDependency(key, value) {
      this.#dependencies.set(key, value);
    }
  };

export const WithStore = (Base) =>
  class WithStore extends WithDependencyConsumer(Base) {
    #store;

    get store() {
      return this.#store;
    }

    stateChangedCallback(_state) {}

    addedCallback() {
      super.addedCallback();
      this.#store = this.requestDependency('store');
    }

    willMountCallback() {
      super.willMountCallback();
      this.stateChangedCallback(this.#store.state);
    }

    mountedCallback() {
      super.mountedCallback();
      this.#store.subscribe(this.stateChangedCallback.bind(this), { signal: this.unmountedSignal });
    }
  };
