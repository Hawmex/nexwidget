import { noChange, nothing, TemplateResult } from 'lit-html';
import { render } from 'lit-html/lib/shady-render.js';
import { Nexbounce } from 'nexbounce';

export * from 'lit-html';
export * from './lib/css-tag.js';
export * from './lib/add-pending-task.js';

export type Constructor<T = {}> = new (...args: any[]) => T;
export type NexwidgetAnimation = [keyframes: Keyframe[], options?: KeyframeAnimationOptions] | null;
export type NexwidgetAttributeType = typeof String | typeof Number | typeof Boolean;
export type NexwidgetTemplate = TemplateResult | string | number | typeof nothing | typeof noChange;

declare global {
  interface AddEventListenerOptions {
    signal?: AbortSignal;
  }
}

export class Nexwidget extends HTMLElement {
  static #reactives = new WeakMap<typeof Nexwidget, Set<string>>([[Nexwidget, new Set()]]);

  static #attributes = new WeakMap<typeof Nexwidget, Map<string, NexwidgetAttributeType>>([
    [Nexwidget, new Map()],
  ]);

  static get styles(): CSSStyleSheet[] {
    return [];
  }

  static get reactives() {
    Nexwidget.#ensureReactives(this);
    return [...Nexwidget.#reactives.get(this)!];
  }

  static get attributes() {
    Nexwidget.#ensureAttributes(this);
    return [...Nexwidget.#attributes.get(this)!.keys()];
  }

  static get propertyKeysForObservedAttributes() {
    const reactives = new Set(this.reactives);
    return this.attributes.filter((key) => reactives.has(key));
  }

  static get observedAttributes() {
    return this.propertyKeysForObservedAttributes.map(Nexwidget.#camelToKebab);
  }

  static #camelToKebab(name: string) {
    return name
      .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
      .replace(/([A-Z])([A-Z])(?=[a-z])/g, '$1-$2')
      .toLowerCase();
  }

  static #ensureReactives(klass: typeof Nexwidget) {
    const isEnsured = Nexwidget.#reactives.has(klass);

    if (!isEnsured) {
      const superClass = Reflect.getPrototypeOf(klass) as typeof Nexwidget;
      const isSuperClassEnsured = Nexwidget.#reactives.has(superClass);

      if (!isSuperClassEnsured && superClass !== Nexwidget) Nexwidget.#ensureReactives(superClass);

      Nexwidget.#reactives.set(klass, Nexwidget.#reactives.get(superClass)!);
    }
  }

  static #ensureAttributes(klass: typeof Nexwidget) {
    const isEnsured = Nexwidget.#attributes.has(klass);

    if (!isEnsured) {
      const superClass = Reflect.getPrototypeOf(klass) as typeof Nexwidget;
      const isSuperClassEnsured = Nexwidget.#attributes.has(superClass);

      if (!isSuperClassEnsured && superClass !== Nexwidget) Nexwidget.#ensureAttributes(superClass);

      Nexwidget.#attributes.set(klass, Nexwidget.#attributes.get(superClass)!);
    }
  }

  static register(tagName = Nexwidget.#camelToKebab(this.name)) {
    customElements.define(tagName, this);
  }

  static createReactives(properties: string[]) {
    Nexwidget.#ensureReactives(this);

    properties.forEach((key) => {
      const descriptor = Reflect.getOwnPropertyDescriptor(this.prototype, key);
      const internalKey = !descriptor?.get ? Symbol(key) : null;

      Nexwidget.#reactives.set(this, new Set([...Nexwidget.#reactives.get(this)!, key]));

      Reflect.defineProperty(this.prototype, key, {
        configurable: true,
        enumerable: true,
        get() {
          if (internalKey !== null)
            //@ts-ignore
            return (this as { [key: symbol]: any })[internalKey];
          else return descriptor!.get!.call(this);
        },
        set(value) {
          const prevValue = (this as { [key: string]: any })[key];

          descriptor?.set?.call?.(this, value);

          if (prevValue !== value && internalKey) {
            //@ts-ignore
            (this as { [key: symbol]: any })[internalKey] = value;
            (this as Nexwidget).#render();
          }
        },
      });
    });
  }

  static createAttributes(attributes: { [key: string]: NexwidgetAttributeType }) {
    Nexwidget.#ensureAttributes(this);

    Object.entries(attributes).forEach(([key, type]) => {
      const descriptor = Reflect.getOwnPropertyDescriptor(this.prototype, key);

      Nexwidget.#attributes.set(this, new Map([...Nexwidget.#attributes.get(this)!, [key, type]]));

      Reflect.defineProperty(this.prototype, key, {
        configurable: true,
        enumerable: true,
        get() {
          descriptor?.get?.call?.(this);
          return (this as Nexwidget).#getPropertyValueFromAttribute(key);
        },
        set(value) {
          descriptor?.set?.call?.(this, value);
          (this as Nexwidget).#setAttributeFromProperty(key, value);
        },
      });
    });
  }

  #renderRoot = this.attachShadow({ mode: 'open' });
  #renderDebouncer = new Nexbounce();

  #isRenderEnabled = false;
  #isMounted = false;

  #removedController?: AbortController;
  #unmountedController?: AbortController;

  #slotObserver = new MutationObserver(this.slotChangedCallback.bind(this));

  #animation?: Animation;

  get removedSignal() {
    return this.#removedController?.signal;
  }

  get unmountedSignal() {
    return this.#unmountedController?.signal;
  }

  get template(): NexwidgetTemplate {
    return noChange;
  }

  get mountAnimation(): NexwidgetAnimation {
    return this.updateOrSlotChangeAnimation;
  }

  get updateOrSlotChangeAnimation(): NexwidgetAnimation {
    return null;
  }

  #adoptStyles() {
    const { styles } = this.constructor as typeof Nexwidget;

    //@ts-ignore
    this.#renderRoot.adoptedStyleSheets = [...styles];
  }

  //@ts-ignore
  #getPropertyValueFromAttribute(key: string) {
    const type = Nexwidget.#attributes.get(this.constructor as typeof Nexwidget)!.get(key)!;
    const attributeKey = Nexwidget.#camelToKebab(key);

    switch (type) {
      case Boolean:
        return this.hasAttribute(attributeKey);

      case String:
      case Number:
        return this.hasAttribute(attributeKey) ? type(this.getAttribute(attributeKey)) : null;

      default:
        throw new Error(`Invalid type for attribute.`);
    }
  }

  //@ts-ignore
  #setAttributeFromProperty(key: string, value: Object) {
    const type = Nexwidget.#attributes.get(this.constructor as typeof Nexwidget)!.get(key)!;
    const attributeKey = Nexwidget.#camelToKebab(key);

    if (value === undefined) throw new Error(`Attribute value cannot be undefined.`);
    else if (value !== null && value.constructor !== type)
      throw new Error(`Attribute value doesn't match its type.`);
    else
      switch (type) {
        case Boolean:
          if (value) this.setAttribute(attributeKey, '');
          else if (value === null) throw new Error(`Boolean attribute cannot be null.`);
          else this.removeAttribute(attributeKey);
          break;

        case String:
        case Number:
          if (value === null) this.removeAttribute(attributeKey);
          else this.setAttribute(attributeKey, String(value));
          break;

        default:
          throw new Error(`Invalid type for attribute.`);
      }
  }

  #render() {
    this.#renderDebouncer.enqueue(() => {
      if (this.#isRenderEnabled) {
        render(this.template, this.#renderRoot, { scopeName: this.localName, eventContext: this });

        requestAnimationFrame(() => {
          this.updatedCallback();

          if (!this.#isMounted) {
            this.slotChangedCallback();

            this.#isMounted = true;
            this.mountedCallback();

            this.#slotObserver.observe(this, {
              subtree: true,
              characterData: true,
              childList: true,
            });
          }
        });
      }
    });
  }

  #cleanupRender() {
    if (!this.#isRenderEnabled) {
      this.#slotObserver.disconnect();

      this.#isMounted = false;
      this.unmountedCallback();
    }
  }

  #upgradeReactivesAndAttributes() {
    const keys = new Set([
      ...(this.constructor as typeof Nexwidget).reactives,
      ...(this.constructor as typeof Nexwidget).attributes,
    ]);

    keys.forEach((key) => {
      if (Object.prototype.hasOwnProperty.call(this, key)) {
        const value = (this as { [key: string]: any })[key];
        delete (this as { [key: string]: any })[key];
        (this as { [key: string]: any })[key] = value;
      }
    });
  }

  attributeChangedCallback(_key: string, oldValue: string, newValue: string) {
    if (oldValue !== newValue) this.#render();
  }

  connectedCallback() {
    this.#upgradeReactivesAndAttributes();
    this.#adoptStyles();
    this.addedCallback();
    this.#isRenderEnabled = true;
    this.#render();
  }

  disconnectedCallback() {
    this.removedCallback();
    this.#isRenderEnabled = false;
    this.#cleanupRender();
  }

  addedCallback() {
    this.#removedController = new AbortController();
  }

  updatedCallback() {
    this.#animation?.cancel?.();

    if (this.updateOrSlotChangeAnimation !== null)
      this.#animation = this.animate(...this.updateOrSlotChangeAnimation);
  }

  slotChangedCallback() {
    this.#animation?.cancel?.();

    if (this.updateOrSlotChangeAnimation !== null)
      this.#animation = this.animate(...this.updateOrSlotChangeAnimation);
  }

  mountedCallback() {
    this.#animation?.cancel?.();

    if (this.mountAnimation !== null) this.#animation = this.animate(...this.mountAnimation);

    this.#unmountedController = new AbortController();
  }

  removedCallback() {
    this.#removedController?.abort?.();
  }

  unmountedCallback() {
    this.#unmountedController?.abort?.();
  }

  getCSSProperty(key: string) {
    return getComputedStyle(this).getPropertyValue(key);
  }
}
