import { describe, expect, test } from '@jest/globals';
import { ShotAnalysisModel } from '../ShotAnalysisModel';
import { ShotData } from '../../../types/shot';

describe('ShotAnalysisModel', () => {
  const model = new ShotAnalysisModel();

  const mockTrainingData: ShotData[] = [
    {
      cueBall: { x: 100, y: 100 },
      targetBall: { x: 200, y: 200 },
      english: { top: 0, side: 0 },
      success: true,
      accuracy: 1.0
    },
    {
      cueBall: { x: 150, y: 150 },
      targetBall: { x: 250, y: 250 },
      english: { top: 0.5, side: -0.5 },
      success: false,
      accuracy: 0.5
    }
  ];

  const mockLabels = [
    [1, 0], // Success
    [0, 1]  // Failure
  ];

  test('should train model with provided data', async () => {
    const history = await model.train(mockTrainingData, mockLabels, 5, 32, 0.2);
    expect(history).toBeDefined();
    expect(history.history.loss).toBeDefined();
  });

  test('should save and load model', async () => {
    await model.train(mockTrainingData, mockLabels, 1, 32, 0.2);
    await model.saveModel('test-model');
    
    const loadedModel = new ShotAnalysisModel();
    await loadedModel.loadModel('test-model');
    
    expect(loadedModel).toBeDefined();
  });
}); 