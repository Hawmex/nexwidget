import { Constructor, Nexwidget } from '../nexwidget.js';

export interface NexwidgetDependencyKeyMap {}

type DependencyRequestEventDetails<K extends keyof NexwidgetDependencyKeyMap> = {
  key: K;
  value?: NexwidgetDependencyKeyMap[K];
};

type DependencyRequestEvent<K extends keyof NexwidgetDependencyKeyMap> = CustomEvent<
  DependencyRequestEventDetails<K>
>;

declare global {
  interface HTMLElementEventMap {
    'dependency-request': DependencyRequestEvent<keyof NexwidgetDependencyKeyMap>;
  }
}

export declare class WithDependencyConsumerInterface {
  requestDependency<K extends keyof NexwidgetDependencyKeyMap>(
    key: K,
  ): NexwidgetDependencyKeyMap[K];
}

export const WithDependencyConsumer = <T extends Constructor<Nexwidget>>(Base: T) => {
  class WithDependencyConsumer extends Base {
    requestDependency<K extends keyof NexwidgetDependencyKeyMap>(key: K) {
      const dependencyRequest = new CustomEvent<DependencyRequestEventDetails<K>>(
        'dependency-request',
        { detail: { key }, composed: true, bubbles: true },
      );

      this.dispatchEvent(dependencyRequest);

      if (Object.prototype.hasOwnProperty.call(dependencyRequest.detail, 'value'))
        return dependencyRequest.detail.value!;
      else throw new RangeError(`No such dependency is provided.`);
    }
  }

  return <Constructor<WithDependencyConsumerInterface> & T>WithDependencyConsumer;
};

export declare class WithDependencyProviderInterface {
  provideDependency<K extends keyof NexwidgetDependencyKeyMap>(
    key: K,
    value: NexwidgetDependencyKeyMap[K],
  ): void;
}

export const WithDependencyProvider = <T extends Constructor<Nexwidget>>(Base: T) => {
  class WithDependencyProvider extends Base {
    #dependencies = new Map<
      keyof NexwidgetDependencyKeyMap,
      NexwidgetDependencyKeyMap[keyof NexwidgetDependencyKeyMap]
    >();

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

  return <Constructor<WithDependencyProviderInterface> & T>WithDependencyProvider;
};
