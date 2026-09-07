const fs = require('fs');

global.document = {
  createElement: (tag) => {
    if (tag === 'canvas') {
      return {
        getContext: () => ({
          fillRect: () => {},
          save: () => {},
          restore: () => {},
          translate: () => {},
          rotate: () => {},
          scale: () => {},
          fillText: (text, x, y) => console.log('fillText:', text, x, y),
          measureText: (text) => ({ width: text.length * 8 }),
          beginPath: () => {},
          moveTo: () => {},
          lineTo: () => {},
          stroke: () => {},
          strokeRect: () => {},
          drawImage: () => {},
          getImageData: () => ({ data: [] }),
          putImageData: () => {},
        }),
        width: 0,
        height: 0,
      };
    }
  },
  fonts: { ready: Promise.resolve() }
};

global.Image = class {
  constructor() {
    this.onload = () => {};
    this.onerror = () => {};
    setTimeout(() => this.onload(), 10);
  }
};

const { renderLabelToCanvas } = require('./src/lib/labelRenderer.ts');
const template = {
  settings: { widthMm: 100, heightMm: 50, colorMode: 'color' },
  layoutJson: [
    { type: 'text', content: 'Brand :', x: 5, y: 5, width: 40, height: 10, fontSize: 12 }
  ]
};
const productData = {};

renderLabelToCanvas(template, productData, 2).then(() => console.log('Done')).catch(e => console.error(e));
