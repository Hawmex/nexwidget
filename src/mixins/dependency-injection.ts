import { Constructor, Nexwidget } from '../nexwidget.js';

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

export interface WithDependencyConsumerInterface {
  requestDependency<K extends never>(key: K): NexwidgetDependencyKeyMap[K];
}

export const WithDependencyConsumer = <T extends Constructor<Nexwidget>>(Base: T) => {
  class WithDependencyConsumer extends Base {
    requestDependency<K extends keyof NexwidgetDependencyKeyMap>(key: K) {
      const dependencyRequest = new CustomEvent<DependencyRequestEventDetails<K>>(
        'dependency-request',
        { detail: { key }, composed: true, bubbles: true },
      );

      this.dispatchEvent(dependencyRequest);

      if (Reflect.has(dependencyRequest.detail, 'value')) return dependencyRequest.detail.value!;
      else throw new Error(`No such dependency is provided.`);
    }
  }

  return WithDependencyConsumer as Constructor<WithDependencyConsumerInterface> & T;
};

export interface WithDependencyProviderInterface {
  provideDependency<K extends never>(key: K, value: NexwidgetDependencyKeyMap[K]): void;
}

export const WithDependencyProvider = <T extends Constructor<Nexwidget>>(Base: T) => {
  class WithDependencyProvider extends Base {
    #dependencies: Map<
      keyof NexwidgetDependencyKeyMap,
      NexwidgetDependencyKeyMap[keyof NexwidgetDependencyKeyMap]
    > = new Map([]);

    #handleRequest(event: DependencyRequestEvent<keyof NexwidgetDependencyKeyMap>) {
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
  }

  return WithDependencyProvider as Constructor<WithDependencyProviderInterface> & T;
};
