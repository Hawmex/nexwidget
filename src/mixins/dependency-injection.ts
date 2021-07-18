import { Nexwidget } from '../nexwidget.js';

declare global {
  interface NexwidgetDependencyMap {}
}

export type DependencyRequestEventDetails<K extends keyof NexwidgetDependencyMap> = {
  key: K;
  value?: NexwidgetDependencyMap[K];
};

export type DependencyRequestEvent<K extends keyof NexwidgetDependencyMap> = CustomEvent<
  DependencyRequestEventDetails<K>
>;

declare global {
  interface HTMLElementEventMap {
    'dependency-request': DependencyRequestEvent<keyof NexwidgetDependencyMap>;
  }
}

export const WithDependencyConsumer = (Base: typeof Nexwidget) =>
  class extends Base {
    requestDependency<K extends keyof NexwidgetDependencyMap>(key: K) {
      const dependencyRequest = new CustomEvent<DependencyRequestEventDetails<K>>(
        'dependency-request',
        { detail: { key }, composed: true, bubbles: true },
      );

      this.dispatchEvent(dependencyRequest);

      if (Reflect.has(dependencyRequest.detail, 'value')) return dependencyRequest.detail.value;
      else throw new Error(`No such dependency is provided.`);
    }
  };

export const WithDependencyProvider = (Base: typeof Nexwidget) =>
  class extends Base {
    #dependencies: Map<
      keyof NexwidgetDependencyMap,
      NexwidgetDependencyMap[keyof NexwidgetDependencyMap]
    > = new Map([]);

    #handleRequest<K extends keyof NexwidgetDependencyMap>(event: DependencyRequestEvent<K>) {
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

    provideDependency<K extends keyof NexwidgetDependencyMap>(
      key: K,
      value: NexwidgetDependencyMap[K],
    ) {
      this.#dependencies.set(key, value);
    }
  };
