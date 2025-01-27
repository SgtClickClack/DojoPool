import Konva from 'konva';

// Initialize Konva stage based on environment
export const initKonvaStage = (containerId: string) => {
  if (typeof window !== 'undefined') {
    // Browser environment
    return new Konva.Stage({
      container: containerId,
      width: 800,
      height: 600
    });
  }
  // Server environment - return null
  return null;
};

// Create a layer for drawing
export const createLayer = () => {
  return new Konva.Layer();
};

// Helper to add an image to layer
export const addImageToLayer = async (layer: Konva.Layer, imageUrl: string) => {
  return new Promise((resolve, reject) => {
    const imageObj = new Image();
    imageObj.onload = () => {
      const image = new Konva.Image({
        image: imageObj,
        width: imageObj.width,
        height: imageObj.height
      });
      layer.add(image);
      layer.batchDraw();
      resolve(image);
    };
    imageObj.onerror = reject;
    imageObj.src = imageUrl;
  });
};

// Helper to export stage as image
export const exportStageToImage = (stage: Konva.Stage, format: string = 'png') => {
  if (!stage) return '';
  return stage.toDataURL({ 
    mimeType: `image/${format}`,
    quality: 1
  });
};

// Helper to clear layer
export const clearLayer = (layer: Konva.Layer) => {
  if (!layer) return;
  layer.destroyChildren();
  layer.batchDraw();
}; 