import React from 'react';
import { render, screen } from '@testing-library/react';
import TimelineChart from '../analysis/TimelineChart';

// Mock the Line chart from react-chartjs-2
jest.mock('react-chartjs-2', () => ({
  Line: (props: any) => (
    <div data-testid="mock-line-chart">{JSON.stringify(props.data)}</div>
  ),
}));

describe('TimelineChart', () => {
  const shots = [
    {
      id: '1',
      type: 'break',
      success: true,
      difficulty: 0.7,
      position_score: 0.8,
      cue_ball_start: { x: 0, y: 0 },
      cue_ball_end: { x: 1, y: 1 },
      object_ball_start: { x: 2, y: 2 },
      target_pocket: { x: 3, y: 3 },
    },
    {
      id: '2',
      type: 'shot',
      success: false,
      difficulty: 0.5,
      position_score: 0.6,
      cue_ball_start: { x: 1, y: 1 },
      cue_ball_end: { x: 2, y: 2 },
      object_ball_start: { x: 3, y: 3 },
      target_pocket: { x: 4, y: 4 },
    },
  ];

  it('renders the chart with correct labels and datasets', () => {
    render(<TimelineChart shots={shots} />);
    const chart = screen.getByTestId('mock-line-chart');
    expect(chart).toBeInTheDocument();
    const data = JSON.parse(chart.textContent || '{}');
    expect(data.labels).toEqual(['Shot 1', 'Shot 2']);
    expect(data.datasets[0].label).toBe('Shot Difficulty');
    expect(data.datasets[0].data).toEqual([0.7, 0.5]);
    expect(data.datasets[1].label).toBe('Position Score');
    expect(data.datasets[1].data).toEqual([0.8, 0.6]);
  });
}); 