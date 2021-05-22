# nexwidget

`nexwidget` is an ESNext library that helps developers to create web components/custom elements.

## Demo

You can try the demo [here](https://codepen.io/Hawmed/pen/NWppjxJ).

## Installation

```
npm i nexwidget
```

## Example

The [Demo]() of this example.

```js
import { Nexwidget, css } from 'nexwidget';

class TestElement extends Nexwidget {
  static {
    this.createAttributes({ testAttr: String });
    this.createReactives(['testAttr']);
    this.register(); // If no tagname is passed, it uses the constructor name. In this case, it's "test-element".
  }

  static get styles() {
    return [
      ...super.styles,
      css`
        :host {
          background: red;
          color: white;
          display: block;
          padding: 8px;
          margin: 8px;
        }
      `,
    ];
  }

  mountedCallback() {
    super.mountedCallback();
    setInterval(() => (this.testAttr += 1));
  }

  get template() {
    return html`<h1>Seconds passed since I was first rendered: ${this.testAttr}</h1>`;
  }

  get mountAnimation() {
    return [
      [
        { transform: 'rotateX(-90deg)', opacity: '0' },
        { transform: 'rotateX(0deg)', opacity: '1' },
      ],
      { duration: 250, fill: 'forwards' },
    ];
  }

  get updateOrSlotChangeAnimation() {
    return [
      [
        { transform: 'rotateZ(-90deg)', opacity: '0' },
        { transform: 'rotateZ(0deg)', opacity: '1' },
      ],
      { duration: 250, fill: 'forwards' },
    ];
  }
}
```

```html
<test-element test-attr="Hello World"></test-element>
```
