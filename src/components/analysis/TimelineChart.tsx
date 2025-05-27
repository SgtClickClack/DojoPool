import React from 'react';
import { Box } from '@chakra-ui/react';
import { Line } from 'react-chartjs-2';

/**
 * TimelineChart component for visualizing shot difficulty and position score trends.
 * @param {Object} props
 * @param {Array} props.shots - Array of shot objects with difficulty and position_score.
 */
interface Shot {
  id: string;
  type: string;
  success: boolean;
  difficulty: number;
  position_score: number;
  cue_ball_start: { x: number; y: number };
  cue_ball_end: { x: number; y: number };
  object_ball_start: { x: number; y: number };
  target_pocket?: { x: number; y: number };
}

interface TimelineChartProps {
  shots: Shot[];
}

const TimelineChart: React.FC<TimelineChartProps> = ({ shots }) => {
  return (
    <Box height="400px">
      <Line
        data={{
          labels: shots.map((_, i) => `Shot ${i + 1}`),
          datasets: [
            {
              label: 'Shot Difficulty',
              data: shots.map((shot) => shot.difficulty),
              borderColor: 'rgba(255, 99, 132, 1)',
              tension: 0.1,
            },
            {
              label: 'Position Score',
              data: shots.map((shot) => shot.position_score),
              borderColor: 'rgba(54, 162, 235, 1)',
              tension: 0.1,
            },
          ],
        }}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
              max: 1,
            },
          },
        }}
      />
    </Box>
  );
};

export default TimelineChart; 