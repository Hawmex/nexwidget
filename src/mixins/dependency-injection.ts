import { Nexwidget } from '../nexwidget.js';

export interface NexwidgetDependencyKeyMap {}

export type DependencyRequestEventDetails<K extends keyof NexwidgetDependencyKeyMap> = {
  key: K;
  value?: NexwidgetDependencyKeyMap[K];
};

export type DependencyRequestEvent<K extends keyof NexwidgetDependencyKeyMap> = CustomEvent<
  DependencyRequestEventDetails<K>
>;

declare global {
  interface HTMLElementEventMap {
    'dependency-request': DependencyRequestEvent<keyof NexwidgetDependencyKeyMap>;
  }
}

export const WithDependencyConsumer = <T extends new (...args: any[]) => Nexwidget>(Base: T) =>
  class extends Base {
    requestDependency<K extends keyof NexwidgetDependencyKeyMap>(key: K) {
      const dependencyRequest = new CustomEvent<DependencyRequestEventDetails<K>>(
        'dependency-request',
        { detail: { key }, composed: true, bubbles: true },
      );

      this.dispatchEvent(dependencyRequest);

      if (Reflect.has(dependencyRequest.detail, 'value')) return dependencyRequest.detail.value;
      else throw new Error(`No such dependency is provided.`);
    }
  };

export const WithDependencyProvider = <T extends new (...args: any[]) => Nexwidget>(Base: T) =>
  class extends Base {
    #dependencies: Map<
      keyof NexwidgetDependencyKeyMap,
      NexwidgetDependencyKeyMap[keyof NexwidgetDependencyKeyMap]
    > = new Map([]);

    #handleRequest<K extends keyof NexwidgetDependencyKeyMap>(event: DependencyRequestEvent<K>) {
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

    provideDependency<K extends keyof NexwidgetDependencyKeyMap>(
      key: K,
      value: NexwidgetDependencyKeyMap[K],
    ) {
      this.#dependencies.set(key, value);
    }
  };
