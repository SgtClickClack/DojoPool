import React, { useMemo } from 'react';
import { Box, Text } from '@chakra-ui/react'; // Added Text for empty state
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip as ChartJsTooltip, // Renamed to avoid conflict with Chakra UI Tooltip
  Legend,
  Filler, // Added for potential area fill
  type ChartOptions, // For typing options
  type ChartData, // For typing data
  Point, // For onClick event
  type ActiveElement, // For onClick event
} from 'chart.js';
// import { Shot } from '../types'; // Recommended: Move Shot interface to a shared types file

// --- Chart.js Registration (Essential) ---
// This needs to be done once, e.g., in your app's entry point or here.
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  ChartJsTooltip,
  Legend,
  Filler
);

// --- Interfaces ---
// Recommended: Move this to a shared types directory, e.g., src/types/index.ts
// and import it: import { Shot } from '../../types';
export interface Shot {
  // Export if it's defined here and used by parent
  id: string;
  type: string;
  success: boolean;
  difficulty: number; // e.g., 0-10 or 0-1, needs clarification for y-axis scaling
  position_score: number; // Typically 0-1
  // Other fields from your original interface can be included if needed by this chart
  // cue_ball_start: { x: number; y: number };
  // cue_ball_end: { x: number; y: number };
  // object_ball_start: { x: number; y: number };
  // target_pocket?: { x: number; y: number };
}

interface TimelineChartProps {
  shots: Shot[];
  currentShotIndex?: number; // Optional: To highlight the current shot
  onSelectShot?: (shotIndex: number) => void; // Optional: Callback for when a shot is clicked
  chartTitle?: string; // Optional: Title for the chart
}

const TimelineChart: React.FC<TimelineChartProps> = ({
  shots,
  currentShotIndex,
  onSelectShot,
  chartTitle = 'Shot Performance Over Time', // Default title
}) => {
  const primaryLineColor = 'rgba(255, 99, 132, 1)'; // Pinkish
  const secondaryLineColor = 'rgba(54, 162, 235, 1)'; // Bluish
  const gridColor = 'rgba(200, 200, 200, 0.2)';
  const tickColor = 'rgba(0, 0, 0, 0.7)';
  const legendColor = '#333';
  const titleColor = '#1A202C'; // Default to dark color since useColorModeValue not available

  const chartData: ChartData<'line', number[], string> = useMemo(() => {
    return {
      labels: shots.map((_, i) => `Shot ${i + 1}`),
      datasets: [
        {
          label: 'Shot Difficulty',
          data: shots.map((shot) => shot.difficulty),
          borderColor: primaryLineColor,
          backgroundColor: primaryLineColor.replace('1)', '0.2)'), // For area fill
          tension: 0.2,
          borderWidth: 2,
          pointBackgroundColor: primaryLineColor,
          pointBorderColor: primaryLineColor,
          pointRadius: (context) =>
            context.dataIndex === currentShotIndex ? 6 : 3,
          pointHoverRadius: 8,
          // fill: 'start', // Example: fill area under line
        },
        {
          label: 'Position Score',
          data: shots.map((shot) => shot.position_score),
          borderColor: secondaryLineColor,
          backgroundColor: secondaryLineColor.replace('1)', '0.2)'),
          tension: 0.2,
          borderWidth: 2,
          pointBackgroundColor: secondaryLineColor,
          pointBorderColor: secondaryLineColor,
          pointRadius: (context) =>
            context.dataIndex === currentShotIndex ? 6 : 3,
          pointHoverRadius: 8,
          // yAxisID: 'yPosition', // If using a secondary y-axis
        },
      ],
    };
  }, [shots, primaryLineColor, secondaryLineColor, currentShotIndex]);

  // Determine max Y value for scaling dynamically.
  // This assumes both difficulty and position_score are roughly on a similar scale (e.g. 0-1 or 0-10)
  // If not, consider separate Y axes.
  const maxYValue = useMemo(() => {
    if (shots.length === 0) return 1; // Default if no data
    const maxDifficulty = Math.max(...shots.map((s) => s.difficulty), 0);
    const maxPositionScore = Math.max(...shots.map((s) => s.position_score), 0);
    // Return a value slightly above the max data point for padding, or a fixed reasonable max.
    // Example: If scores are 0-1, max can be 1. If 0-10, max can be 10.
    // For now, let's assume scores are generally <= 10 as an example.
    // You should adjust this based on your actual data range, or calculate from data.
    const dataMax = Math.max(maxDifficulty, maxPositionScore);
    if (dataMax <= 1) return 1.05; // If data is 0-1
    if (dataMax <= 10) return 10.5; // If data is 0-10
    return Math.ceil(dataMax * 1.1); // Generic padding otherwise
  }, [shots]);

  const chartOptions: ChartOptions<'line'> = useMemo(() => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index' as const, // Show tooltips for all datasets at the same index
        intersect: false,
      },
      plugins: {
        legend: {
          position: 'top' as const,
          labels: {
            color: legendColor,
            font: { size: 12 },
          },
        },
        title: {
          display: !!chartTitle,
          text: chartTitle,
          color: titleColor,
          font: { size: 16, weight: 'bold' },
        },
        tooltip: {
          // ChartJsTooltip
          enabled: true,
          backgroundColor: 'rgba(0,0,0,0.8)',
          titleFont: { size: 14, weight: 'bold' },
          bodyFont: { size: 12 },
          callbacks: {
            label: function (context) {
              let label = context.dataset.label || '';
              if (label) {
                label += ': ';
              }
              if (context.parsed.y !== null) {
                label += context.parsed.y.toFixed(2); // Format to 2 decimal places
              }
              return label;
            },
          },
        },
      },
      scales: {
        x: {
          grid: {
            color: gridColor,
          },
          ticks: {
            color: tickColor,
            font: { size: 10 },
          },
        },
        y: {
          // Primary Y-axis (default for both datasets unless specified)
          beginAtZero: true,
          suggestedMax: maxYValue, // Dynamically set based on data, or a fixed sensible max
          grid: {
            color: gridColor,
          },
          ticks: {
            color: tickColor,
            precision: 1, // Adjust precision as needed
            font: { size: 10 },
          },
          title: {
            display: true,
            text: 'Score / Difficulty',
            color: tickColor,
            font: { size: 12, weight: 'bold' },
          },
        },
        // Example for a secondary Y-axis if scales are very different:
        // yPosition: {
        //   position: 'right' as const,
        //   beginAtZero: true,
        //   suggestedMax: 1, // Assuming position score is 0-1
        //   grid: { drawOnChartArea: false }, // Only show ticks for this axis
        //   ticks: { color: secondaryLineColor, precision: 1 },
        //   title: { display: true, text: 'Position Score (0-1)', color: secondaryLineColor }
        // }
      },
      onClick: (event, elements: ActiveElement[]) => {
        if (onSelectShot && elements.length > 0) {
          const firstElement = elements[0];
          onSelectShot(firstElement.index);
        }
      },
      onHover: (event, activeElements) => {
        // Custom hover effects, e.g., changing cursor
        const target = event.native?.target as HTMLElement | null;
        if (target) {
          target.style.cursor = activeElements.length ? 'pointer' : 'default';
        }
      },
    };
  }, [
    legendColor,
    titleColor,
    chartTitle,
    tickColor,
    gridColor,
    maxYValue,
    onSelectShot,
  ]);

  if (!shots || shots.length === 0) {
    return (
      <Box
        height="400px"
        display="flex"
        alignItems="center"
        justifyContent="center"
        borderWidth="1px"
        borderRadius="md"
        borderColor="gray.200"
      >
        <Text color="gray.500">
          No shot data available to display timeline.
        </Text>
      </Box>
    );
  }

  return (
    <Box height={{ base: '300px', md: '400px' }} width="100%">
      {' '}
      {/* Responsive height */}
      <Line data={chartData} options={chartOptions} />
    </Box>
  );
};

export default React.memo(TimelineChart); // Memoize to prevent re-renders if props haven't changed
