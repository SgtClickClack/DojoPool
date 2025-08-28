// Types for AR analysis results
export interface Ball {
  position: {
    x: number;
    y: number;
  };
  type: 'solid' | 'stripe' | 'eight' | 'cue';
  confidence: number;
}

export interface TableBounds {
  corners: Array<{
    x: number;
    y: number;
  }>;
  width: number;
  height: number;
}

export interface ARAnalysisResult {
  tableBounds: TableBounds;
  balls: Ball[];
  confidence: number;
  timestamp: string;
}

// Mock data for demonstration purposes
const generateMockARResult = (): ARAnalysisResult => {
  const balls: Ball[] = [
    { position: { x: 150, y: 200 }, type: 'cue', confidence: 0.95 },
    { position: { x: 300, y: 150 }, type: 'solid', confidence: 0.88 },
    { position: { x: 450, y: 250 }, type: 'stripe', confidence: 0.92 },
    { position: { x: 200, y: 350 }, type: 'solid', confidence: 0.85 },
    { position: { x: 400, y: 350 }, type: 'eight', confidence: 0.9 },
    { position: { x: 350, y: 300 }, type: 'stripe', confidence: 0.87 },
  ];

  const tableBounds: TableBounds = {
    corners: [
      { x: 100, y: 100 },
      { x: 500, y: 100 },
      { x: 500, y: 400 },
      { x: 100, y: 400 },
    ],
    width: 400,
    height: 300,
  };

  return {
    tableBounds,
    balls,
    confidence: 0.91,
    timestamp: new Date().toISOString(),
  };
};

// AR Coach API endpoints
export const analyzeTableImage = async (
  file: File
): Promise<ARAnalysisResult> => {
  // For demonstration purposes, return mock data
  // In production, this would call the actual backend
  console.log('AR Analysis requested for file:', file.name, 'Size:', file.size);

  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 2000));

  return generateMockARResult();

  // Original implementation (commented out until backend is ready):
  /*
  const formData = new FormData();
  formData.append('image', file);

  const res = await axiosInstance.post('/v1/ar/analyze-table', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return res.data as ARAnalysisResult;
  */
};

export const getARAnalysisHistory = async (): Promise<ARAnalysisResult[]> => {
  // For demonstration purposes, return mock data
  // In production, this would call the actual backend
  await new Promise((resolve) => setTimeout(resolve, 1000));

  return [generateMockARResult(), generateMockARResult()];

  // Original implementation (commented out until backend is ready):
  /*
  const res = await axiosInstance.get('/v1/ar/analysis-history');
  return res.data as ARAnalysisResult[];
  */
};
