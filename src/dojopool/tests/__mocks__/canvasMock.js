module.exports = {
  createCanvas: () => ({
    getContext: () => ({
      drawImage: jest.fn(),
      getImageData: jest.fn(() => ({
        data: new Uint8ClampedArray(100),
        width: 10,
        height: 10
      })),
      putImageData: jest.fn(),
      clearRect: jest.fn(),
      scale: jest.fn(),
      translate: jest.fn(),
      fillRect: jest.fn(),
      fillText: jest.fn(),
      measureText: jest.fn(() => ({ width: 50 })),
    }),
    toDataURL: jest.fn(() => 'data:image/png;base64,'),
    width: 800,
    height: 600
  }),
  loadImage: () => Promise.resolve({
    width: 100,
    height: 100
  })
}; 