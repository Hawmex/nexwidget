# nexwidget

`nexwidget` is an ESNext library that helps developers to create web components/custom elements.

![npm](https://img.shields.io/npm/v/nexwidget)
![npm](https://img.shields.io/npm/dw/nexwidget)
![NPM](https://img.shields.io/npm/l/nexwidget)

## Demo

You can try the demo [here](https://codepen.io/Hawmed/pen/NWppjxJ).

## Installation

```
npm i nexwidget
```

## Example

```js
import { Nexwidget, css, html } from 'nexwidget';

class TestElement extends Nexwidget {
  static get styles() {
    return [
      ...super.styles,
      css`
        :host {
          background: white;
          color: black;
          display: inline-block;
          border-radius: 4px;
          padding: 4px 8px;
          margin: 0px 8px;
        }

        :host h5 {
          margin: 0px;
        }
      `,
    ];
  }

  mountedCallback() {
    super.mountedCallback();
    setInterval(() => (this.timeCounter += 1), 1000);
  }

  get template() {
    return html`<h5>${this.timeCounter}</h5>`;
  }

  get mountAnimation() {
    return [
      [
        { transform: 'scale(0)', opacity: '0' },
        { transform: 'scale(1)', opacity: '1' },
      ],
      { duration: 200, fill: 'forwards' },
    ];
  }

  get updateOrSlotChangeAnimation() {
    return [
      [{ transform: 'rotateX(-90deg)' }, { transform: 'rotateX(0deg)' }],
      { duration: 200, fill: 'forwards' },
    ];
  }
}

TestElement.createAttributes({ timeCounter: Number });
TestElement.createReactives(['timeCounter']);

// If no tagname is passed, it uses the constructor name
// to register in CustomElementsRegistery.
// In this case, it's "test-element".

TestElement.register();
```

```html
<span>
  Seconds passed since I was first rendered:
  <test-element time-counter="0"></test-element>
</span>
```

```css
body {
  background: black;
  color: white;
  font-family: Roboto;
  margin: 0px;
  height: 100vh;
  width: 100vw;
  display: flex;
  justify-content: center;
  align-items: center;
}
```
