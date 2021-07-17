import { NexwidgetConstructor } from '../nexwidget.js';

export type DependencyRequestEventDetails = { key: string; value?: any };
export type DependencyRequestEvent = CustomEvent<DependencyRequestEventDetails>;

declare global {
  interface HTMLElementEventMap {
    'dependency-request': DependencyRequestEvent;
  }
}

export const WithDependencyConsumer = <T extends NexwidgetConstructor>(Base: T) =>
  class WithDependencyConsumer extends Base {
    requestDependency(key: string) {
      const dependencyRequest = new CustomEvent<DependencyRequestEventDetails>(
        'dependency-request',
        { detail: { key }, composed: true, bubbles: true },
      );

      this.dispatchEvent(dependencyRequest);

      if (Reflect.has(dependencyRequest.detail, 'value')) return dependencyRequest.detail.value;
      else throw new Error(`No such dependency is provided.`);
    }
  };

export const WithDependencyProvider = <T extends NexwidgetConstructor>(Base: T) =>
  class WithDependencyProvider extends Base {
    #dependencies: Map<string, any> = new Map();

    #handleRequest(event: DependencyRequestEvent) {
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

    provideDependency(key: string, value: any) {
      this.#dependencies.set(key, value);
    }
  };
