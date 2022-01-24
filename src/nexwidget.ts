import {
  noChange,
  nothing,
  render,
  RootPart,
  TemplateResult,
} from 'lit-html/lit-html.js';
import { Debouncer } from 'nexbounce/nexbounce.js';

export * from 'lit-html/lit-html.js';
export * from './lib/add-pending-task.js';
export * from './lib/css-tag.js';

export type Constructor<T = {}> = new (...args: any[]) => T;

export type WidgetAnimation = {
  readonly keyframes: Keyframe[];
  readonly options?: KeyframeAnimationOptions;
} | null;

export type WidgetAttributeType = 'string' | 'number' | 'boolean';

export type WidgetTemplate =
  | TemplateResult
  | string
  | number
  | typeof nothing
  | typeof noChange;

export type WidgetReactives<T extends typeof Nexwidget> =
  (keyof T['prototype'] & string)[];

export type WidgetAttributes<T extends typeof Nexwidget> = {
  readonly key: keyof T['prototype'] & string;
  readonly type: WidgetAttributeType;
}[];

export class Nexwidget extends HTMLElement {
  static readonly #reactives = new WeakMap<typeof Nexwidget, Set<string>>([
    [Nexwidget, new Set()],
  ]);

  static readonly #attributes = new WeakMap<
    typeof Nexwidget,
    Map<string, WidgetAttributeType>
  >([[Nexwidget, new Map()]]);

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

  static #ensureReactives(Class: typeof Nexwidget) {
    const isEnsured = Nexwidget.#reactives.has(Class);

    if (!isEnsured) {
      const SuperClass = <typeof Nexwidget>Reflect.getPrototypeOf(Class);
      const isSuperClassEnsured = Nexwidget.#reactives.has(SuperClass);

      if (!isSuperClassEnsured && SuperClass !== Nexwidget)
        Nexwidget.#ensureReactives(SuperClass);

      Nexwidget.#reactives.set(Class, Nexwidget.#reactives.get(SuperClass)!);
    }
  }

  static #ensureAttributes(Class: typeof Nexwidget) {
    const isEnsured = Nexwidget.#attributes.has(Class);

    if (!isEnsured) {
      const SuperClass = <typeof Nexwidget>Reflect.getPrototypeOf(Class);
      const isSuperClassEnsured = Nexwidget.#attributes.has(SuperClass);

      if (!isSuperClassEnsured && SuperClass !== Nexwidget)
        Nexwidget.#ensureAttributes(SuperClass);

      Nexwidget.#attributes.set(Class, Nexwidget.#attributes.get(SuperClass)!);
    }
  }

  static registerAs<
    T extends typeof Nexwidget,
    K extends keyof HTMLElementTagNameMap,
  >(this: T & (new () => HTMLElementTagNameMap[K]), tagName: K) {
    customElements.define(tagName, this);
  }

  static createReactives<T extends typeof Nexwidget>(
    this: T,
    reactives: WidgetReactives<T>,
  ) {
    Nexwidget.#ensureReactives(this);

    const reactivesSet = new Set(reactives);

    reactivesSet.forEach((key) => {
      const descriptor = Reflect.getOwnPropertyDescriptor(this.prototype, key);
      const internalKey = !descriptor?.get ? Symbol(key) : null;

      Nexwidget.#reactives.set(
        this,
        new Set([...Nexwidget.#reactives.get(this)!, key]),
      );

      Reflect.defineProperty(this.prototype, key, {
        configurable: true,
        enumerable: true,
        get() {
          if (internalKey !== null)
            return (<{ [key: symbol]: unknown }>this)[internalKey];
          else return descriptor!.get!.call(this);
        },
        set(value) {
          const prevValue = (<{ [key: string]: unknown }>this)[key];

          descriptor?.set?.call(this, value);

          if (internalKey && prevValue !== value) {
            (<{ [key: symbol]: unknown }>this)[internalKey] = value;
            (<Nexwidget>this).#render();
          }
        },
      });
    });
  }

  static createAttributes<T extends typeof Nexwidget>(
    this: T,
    attributes: WidgetAttributes<T>,
  ) {
    Nexwidget.#ensureAttributes(this);

    const attributesMap = new Map(
      attributes.map(({ key, type }) => [key, type]),
    );

    attributesMap.forEach((type, key) => {
      const descriptor = Reflect.getOwnPropertyDescriptor(this.prototype, key);

      Nexwidget.#attributes.set(
        this,
        new Map([...Nexwidget.#attributes.get(this)!, [key, type]]),
      );

      Reflect.defineProperty(this.prototype, key, {
        configurable: true,
        enumerable: true,
        get() {
          descriptor?.get?.call(this);
          return (<Nexwidget>this).#getPropertyValueFromAttribute(key);
        },
        set(value) {
          descriptor?.set?.call(this, value);
          (<Nexwidget>this).#setAttributeFromProperty(key, value);
        },
      });
    });
  }

  readonly #renderRoot = this.attachShadow({ mode: 'open' });
  readonly #renderDebouncer = new Debouncer();

  #isRenderEnabled = false;
  #isMounted = false;

  #rootPart?: RootPart;

  #removedController?: AbortController;
  #unmountedController?: AbortController;

  readonly #slotObserver = new MutationObserver(
    this.slotChangedCallback.bind(this),
  );

  #animation?: Animation;

  get removedSignal() {
    return this.#removedController?.signal;
  }

  get unmountedSignal() {
    return this.#unmountedController?.signal;
  }

  get template(): WidgetTemplate {
    return noChange;
  }

  get mountAnimation(): WidgetAnimation {
    return this.updateOrSlotChangeAnimation;
  }

  get updateOrSlotChangeAnimation(): WidgetAnimation {
    return null;
  }

  get usesNexwidget(): true {
    return true;
  }

  #adoptStyles() {
    const { styles } = <typeof Nexwidget>this.constructor;

    (<{ adoptedStyleSheets: CSSStyleSheet[] } & ShadowRoot>(
      this.#renderRoot
    )).adoptedStyleSheets = [...styles];
  }

  //@ts-ignore
  #getPropertyValueFromAttribute(key: string) {
    const type = Nexwidget.#attributes
      .get(<typeof Nexwidget>this.constructor)!
      .get(key)!;

    const attributeKey = Nexwidget.#camelToKebab(key);

    switch (type) {
      case 'boolean':
        return this.hasAttribute(attributeKey);

      case 'string':
      case 'number':
        const typeConstructorName = <Capitalize<WidgetAttributeType>>(
          (type.charAt(0).toUpperCase() + type.slice(1))
        );

        const typeConstructor = globalThis[typeConstructorName];

        return this.hasAttribute(attributeKey)
          ? typeConstructor(this.getAttribute(attributeKey))
          : null;

      default:
        throw new RangeError(`Invalid type for attribute.`);
    }
  }

  //@ts-ignore
  #setAttributeFromProperty(key: string, value: Object) {
    const type = Nexwidget.#attributes
      .get(<typeof Nexwidget>this.constructor)!
      .get(key)!;

    const attributeKey = Nexwidget.#camelToKebab(key);

    if (value === undefined)
      throw new TypeError(`Attribute value cannot be undefined.`);
    else if (value !== null && typeof value !== type)
      throw new TypeError(`Attribute value doesn't match its type.`);
    else
      switch (type) {
        case 'boolean':
          if (value) this.setAttribute(attributeKey, '');
          else if (value === null)
            throw new TypeError(`Boolean attribute cannot be null.`);
          else this.removeAttribute(attributeKey);
          break;

        case 'string':
        case 'number':
          if (value === null) this.removeAttribute(attributeKey);
          else this.setAttribute(attributeKey, String(value));
          break;

        default:
          throw new RangeError(`Invalid type for attribute.`);
      }
  }

  #render() {
    this.#renderDebouncer.enqueue(() => {
      if (this.#isRenderEnabled) {
        this.#rootPart = render(this.template, this.#renderRoot, {
          host: this,
        });

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

  getCSSProperty(key: string) {
    return getComputedStyle(this).getPropertyValue(key);
  }

  attributeChangedCallback(_key: string, oldValue: string, newValue: string) {
    if (oldValue !== newValue) this.#render();
  }

  connectedCallback() {
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
    this.#animation?.cancel();

    if (this.updateOrSlotChangeAnimation !== null)
      this.#animation = this.animate(
        this.updateOrSlotChangeAnimation.keyframes,
        this.updateOrSlotChangeAnimation.options,
      );
  }

  slotChangedCallback() {
    this.#animation?.cancel();

    if (this.updateOrSlotChangeAnimation !== null)
      this.#animation = this.animate(
        this.updateOrSlotChangeAnimation.keyframes,
        this.updateOrSlotChangeAnimation.options,
      );
  }

  mountedCallback() {
    this.#rootPart?.setConnected(true);
    this.#animation?.cancel();

    if (this.mountAnimation !== null)
      this.#animation = this.animate(
        this.mountAnimation.keyframes,
        this.mountAnimation.options,
      );

    this.#unmountedController = new AbortController();
  }

  removedCallback() {
    this.#removedController?.abort();
  }

  unmountedCallback() {
    this.#rootPart?.setConnected(false);
    this.#unmountedController?.abort();
  }
}
