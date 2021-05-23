'use strict';

import { noChange } from 'lit-html';
import { render } from 'lit-html/lib/shady-render.js';
import { CSSResult } from './lib/css-tag.js';
import { Nexbounce } from 'nexbounce';

export * from 'lit-html';
export * from './lib/css-tag.js';

export class Nexwidget extends HTMLElement {
  static #reactives = new WeakMap([[Nexwidget, new Set()]]);
  static #attributes = new WeakMap([[Nexwidget, new Map()]]);

  /**
   * @returns {CSSResult[]} Styles.
   */

  static get styles() {
    return [];
  }

  /**
   * @returns {string[]} Reactive property keys.
   */

  static get reactives() {
    Nexwidget.#ensureReactives(this);
    return [...Nexwidget.#reactives.get(this)];
  }

  /**
   * @returns {string[]} Property keys for attributes.
   */

  static get attributes() {
    Nexwidget.#ensureAttributes(this);
    return [...Nexwidget.#attributes.get(this).keys()];
  }

  /**
   * @returns {string[]} Property keys for observed attributes.
   */

  static get propertyKeysForObservedAttributes() {
    const reactives = new Set(this.reactives);
    return this.attributes.filter((key) => reactives.has(key));
  }

  /**
   * @returns {string[]} Observed attributes' keys.
   */

  static get observedAttributes() {
    return this.propertyKeysForObservedAttributes.map(Nexwidget.#camelToKebab);
  }

  static #camelToKebab(name) {
    return name
      .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
      .replace(/([A-Z])([A-Z])(?=[a-z])/g, '$1-$2')
      .toLowerCase();
  }

  static #ensureReactives(klass) {
    const isEnsured = Nexwidget.#reactives.has(klass);

    if (!isEnsured) {
      const superClass = Reflect.getPrototypeOf(klass);
      const isSuperClassEnsured = Nexwidget.#reactives.has(superClass);

      if (!isSuperClassEnsured && superClass !== Nexwidget) Nexwidget.#ensureReactives(superClass);

      Nexwidget.#reactives.set(klass, Nexwidget.#reactives.get(superClass));
    }
  }

  static #ensureAttributes(klass) {
    const isEnsured = Nexwidget.#attributes.has(klass);

    if (!isEnsured) {
      const superClass = Reflect.getPrototypeOf(klass);
      const isSuperClassEnsured = Nexwidget.#attributes.has(superClass);

      if (!isSuperClassEnsured && superClass !== Nexwidget) Nexwidget.#ensureAttributes(superClass);

      Nexwidget.#attributes.set(klass, Nexwidget.#attributes.get(superClass));
    }
  }

  /**
   * @param {string} tagName
   */

  static register(tagName = Nexwidget.#camelToKebab(this.name)) {
    customElements.define(tagName, this);
  }

  /**
   * @param {string[]} properties
   */

  static createReactives(properties) {
    Nexwidget.#ensureReactives(this);

    properties.forEach((key) => {
      const descriptor = Reflect.getOwnPropertyDescriptor(this.prototype, key);
      const internalKey = !descriptor?.get ? Symbol(key) : null;

      Nexwidget.#reactives.set(this, new Set([...Nexwidget.#reactives.get(this), key]));

      Reflect.defineProperty(this.prototype, key, {
        configurable: true,
        enumerable: true,
        get() {
          if (internalKey) return this[internalKey];
          else return descriptor.get.call(this);
        },
        set(value) {
          const prevValue = this[key];

          descriptor?.set?.call?.(this, value);

          if (prevValue !== value && internalKey) {
            this[internalKey] = value;
            this.#render();
          }
        },
      });
    });
  }

  /**
   * @param {{ [key: string]: typeof Number | typeof String | typeof Boolean }} attributes
   */

  static createAttributes(attributes) {
    Nexwidget.#ensureAttributes(this);

    Object.entries(attributes).forEach(([key, type]) => {
      const descriptor = Reflect.getOwnPropertyDescriptor(this.prototype, key);

      Nexwidget.#attributes.set(this, new Map([...Nexwidget.#attributes.get(this), [key, type]]));

      Reflect.defineProperty(this.prototype, key, {
        configurable: true,
        enumerable: true,
        get() {
          descriptor?.get?.call?.(this);
          return this.#getPropertyValueFromAttribute(key);
        },
        set(value) {
          descriptor?.set?.call?.(this, value);
          this.#setAttributeFromProperty(key, value);
        },
      });
    });
  }

  #renderRoot = this.attachShadow({ mode: 'open' });
  #renderDebouncer = new Nexbounce();

  #isRenderEnabled = false;
  #isMounted = false;

  #removedController;
  #willUnmountController;
  #unmountedController;

  #slotObserver = new MutationObserver(this.slotChangedCallback.bind(this));

  #animation;

  constructor() {
    super();
    this.#adoptStyles();
  }

  /**
   * @returns {AbortSignal} a signal for `removedCallback()`.
   */

  get removedSignal() {
    return this.#removedController.signal;
  }

  /**
   * @returns {AbortSignal} a signal for `willUnmountCallback()`.
   */

  get willUnmountSignal() {
    return this.#willUnmountController.signal;
  }

  /**
   * @returns {AbortSignal} a signal for `unmountedCallback()`.
   */

  get unmountedSignal() {
    return this.#unmountedController.signal;
  }

  /**
   * @returns {unknown} content to be rendered.
   */

  get template() {
    return noChange;
  }

  /**
   * @returns {[keyframes: Keyframe[] | PropertyIndexedKeyframes, options?: number | KeyframeAnimationOptions] | []} Animation on `mountedCallback()`.
   */

  get mountAnimation() {
    return this.updateOrSlotChangeAnimation;
  }

  /**
   * @returns {[keyframes: Keyframe[] | PropertyIndexedKeyframes, options?: number | KeyframeAnimationOptions] | []} Animation on `updatedCallback()` or `slotChangedCallback()`.
   */

  get updateOrSlotChangeAnimation() {
    return [];
  }

  #adoptStyles() {
    const { styles } = this.constructor;

    this.#renderRoot.adoptedStyleSheets = styles.map(({ styleSheet }) => styleSheet);
  }

  #getPropertyValueFromAttribute(key) {
    const type = Nexwidget.#attributes.get(this.constructor).get(key);
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

  #setAttributeFromProperty(key, value) {
    const type = Nexwidget.#attributes.get(this.constructor).get(key);
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
    this.#slotObserver.disconnect();

    this.#isMounted = false;
    this.unmountedCallback();
  }

  /**
   * @param {string} _key
   * @param {string} oldValue
   * @param {string} newValue
   */

  attributeChangedCallback(_key, oldValue, newValue) {
    if (oldValue !== newValue) this.#render();
  }

  connectedCallback() {
    this.addedCallback();
    this.willMountCallback();
    this.#isRenderEnabled = true;
    this.#render();
  }

  disconnectedCallback() {
    this.removedCallback();
    this.willUnmountCallback();
    this.#isRenderEnabled = false;
    this.#cleanupRender();
  }

  addedCallback() {
    this.#removedController = new AbortController();
  }

  willMountCallback() {
    this.#willUnmountController = new AbortController();
  }

  updatedCallback() {
    this.#animation?.cancel?.();

    if (this.updateOrSlotChangeAnimation.length > 0)
      this.#animation = this.animate(...this.updateOrSlotChangeAnimation);
  }

  slotChangedCallback() {
    this.#animation?.cancel?.();

    if (this.updateOrSlotChangeAnimation.length > 0)
      this.#animation = this.animate(...this.updateOrSlotChangeAnimation);
  }

  mountedCallback() {
    this.#animation?.cancel?.();

    if (this.mountAnimation.length > 0) this.#animation = this.animate(...this.mountAnimation);

    this.#unmountedController = new AbortController();
  }

  removedCallback() {
    this.#removedController.abort();
  }

  willUnmountCallback() {
    this.#willUnmountController.abort();
  }

  unmountedCallback() {
    this.#unmountedController.abort();
  }

  /**
   * @param {string} key
   * @returns {string} The given CSS property value.
   */

  getCSSProperty(key) {
    return getComputedStyle(this).getPropertyValue(key);
  }
}
