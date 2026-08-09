// Vitest setup file - runs before tests to polyfill missing browser APIs in jsdom

Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
  value: function (type) {
    // Let Phaser fall back to Canvas by pretending WebGL is unavailable
    if (type === 'webgl' || type === 'experimental-webgl') {
      return null
    }

    // Minimal Canvas 2D rendering context mock for Phaser's feature detection
    return {
      canvas: this,
      fillStyle: '',
      strokeStyle: '',
      globalAlpha: 1,
      globalCompositeOperation: 'source-over',
      fillRect: () => {},
      strokeRect: () => {},
      clearRect: () => {},
      getImageData: () => ({ data: new Uint8ClampedArray([10, 20, 30, 128]) }),
      putImageData: () => {},
      drawImage: () => {},
      save: () => {},
      restore: () => {},
      translate: () => {},
      rotate: () => {},
      scale: () => {},
      beginPath: () => {},
      closePath: () => {},
      moveTo: () => {},
      lineTo: () => {},
      arc: () => {},
      fill: () => {},
      stroke: () => {},
      measureText: () => ({ width: 0 })
    }
  },
  configurable: true
})
