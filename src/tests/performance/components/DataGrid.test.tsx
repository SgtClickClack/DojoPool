import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DataGrid } from '@/dojopool/frontend/components/DataGrid';
import { customRender } from '../../test-utils';
import { measurePerformance, measureFrameRate, measureRenderPerformance } from '@/utils/performance';

// Mock performance API
const mockPerformance = {
  now: vi.fn(),
  mark: vi.fn(),
  measure: vi.fn(),
  clearMarks: vi.fn(),
  clearMeasures: vi.fn(),
  getEntriesByType: vi.fn(),
  getEntriesByName: vi.fn(),
  getEntries: vi.fn(),
  timeOrigin: Date.now(),
};

Object.defineProperty(window, 'performance', {
  value: mockPerformance,
});

interface TestData {
  id: number;
  name: string;
  value: number;
  date: string;
}

describe('DataGrid Performance', () => {
  const mockData: TestData[] = Array.from({ length: 1000 }, (_, i) => ({
    id: i,
    name: `Item ${i}`,
    value: Math.random() * 100,
    date: new Date(Date.now() - i * 86400000).toISOString(),
  }));

  const columns = [
    { id: 'name' as const, label: 'Name', sortable: true },
    { id: 'value' as const, label: 'Value', sortable: true },
    { id: 'date' as const, label: 'Date', sortable: true },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockPerformance.now.mockImplementation(() => Date.now());
  });

  it('should render within performance budget', async () => {
    const result = await measureRenderPerformance(
      () => {
        render(<DataGrid data={mockData} columns={columns} />);
      },
      { 
        markName: 'render', 
        measureName: 'render',
        iterations: 1 
      }
    );

    // Budget: 100ms for initial render
    expect(result.duration).toBeLessThan(100);
  });

  it('should handle sorting efficiently', async () => {
    const { container } = customRender(<DataGrid data={mockData} columns={columns} />);
    
    const result = await measurePerformance(
      () => {
        fireEvent.click(screen.getByRole('button', { name: /sort by name/i }));
      },
      { 
        markName: 'sort', 
        measureName: 'sort',
        collectMeasures: true 
      }
    );

    // Budget: 50ms for sorting operation
    expect(result.duration).toBeLessThan(50);
  });

  it('should handle filtering efficiently', async () => {
    const { container } = customRender(<DataGrid data={mockData} columns={columns} />);
    
    const result = await measurePerformance(
      () => {
        fireEvent.change(screen.getByRole('searchbox'), {
          target: { value: 'Item 1' },
        });
      },
      { 
        markName: 'filter', 
        measureName: 'filter',
        collectMeasures: true 
      }
    );

    // Budget: 30ms for filtering operation
    expect(result.duration).toBeLessThan(30);
  });

  it('should handle pagination efficiently', async () => {
    const { container } = customRender(<DataGrid data={mockData} columns={columns} />);
    
    const result = await measurePerformance(
      () => {
        fireEvent.click(screen.getByRole('button', { name: /next page/i }));
      },
      { 
        markName: 'pagination', 
        measureName: 'pagination',
        collectMeasures: true 
      }
    );

    // Budget: 20ms for page change
    expect(result.duration).toBeLessThan(20);
  });

  it('should maintain smooth scrolling', async () => {
    const { container } = customRender(<DataGrid data={mockData} columns={columns} />);
    
    const result = await measureFrameRate(
      () => {
        fireEvent.scroll(container.querySelector('.data-grid-container'), {
          target: { scrollTop: 1000 },
        });
      },
      { 
        duration: 1000, 
        markName: 'scroll', 
        measureName: 'scroll' 
      }
    );

    // Budget: 16ms for smooth scrolling (60fps)
    expect(result.fps).toBeGreaterThanOrEqual(60);
    expect(result.droppedFrames).toBeLessThan(5); // Allow max 5 frame drops
  });

  it('should handle row selection efficiently', async () => {
    const { container } = customRender(<DataGrid data={mockData} columns={columns} />);
    
    const result = await measurePerformance(
      () => {
        fireEvent.click(screen.getByRole('checkbox', { name: /select all/i }));
      },
      { 
        markName: 'selection', 
        measureName: 'selection',
        collectMeasures: true 
      }
    );

    // Budget: 30ms for selection operation
    expect(result.duration).toBeLessThan(30);
  });

  it('should handle column resizing efficiently', async () => {
    const { container } = customRender(<DataGrid data={mockData} columns={columns} />);
    
    const result = await measurePerformance(
      () => {
        const resizer = screen.getByRole('separator', { name: /resize column/i });
        fireEvent.mouseDown(resizer);
        fireEvent.mouseMove(resizer, { clientX: 200 });
        fireEvent.mouseUp(resizer);
      },
      { 
        markName: 'resize', 
        measureName: 'resize',
        collectMeasures: true 
      }
    );

    // Budget: 50ms for resize operation
    expect(result.duration).toBeLessThan(50);
  });

  it('should maintain memory usage within limits', async () => {
    const initialMemory = performance.memory?.usedJSHeapSize || 0;
    
    const { unmount } = customRender(<DataGrid data={mockData} columns={columns} />);
    
    // Perform some operations
    fireEvent.click(screen.getByRole('button', { name: /sort by name/i }));
    fireEvent.change(screen.getByRole('searchbox'), {
      target: { value: 'Item 1' },
    });
    
    const result = await measurePerformance(
      () => {
        // Additional operations to stress test memory
        for (let i = 0; i < 10; i++) {
          fireEvent.click(screen.getByRole('button', { name: /next page/i }));
        }
      },
      { 
        markName: 'memory', 
        measureName: 'memory',
        collectMemory: true,
        collectMeasures: true 
      }
    );
    
    // Budget: 5MB memory increase
    const maxMemory = result.memoryUsage?.max ?? initialMemory;
    expect(maxMemory - initialMemory).toBeLessThan(5 * 1024 * 1024);
    
    unmount();
  });

  it('should handle data updates efficiently', async () => {
    const { rerender } = customRender(<DataGrid data={mockData} columns={columns} />);
    
    const result = await measurePerformance(
      () => {
        const newData = [...mockData, { id: 1000, name: 'New Item', value: 50, date: new Date().toISOString() }];
        rerender(<DataGrid data={newData} columns={columns} />);
      },
      { 
        markName: 'update', 
        measureName: 'update',
        collectMeasures: true 
      }
    );

    // Budget: 50ms for data update
    expect(result.duration).toBeLessThan(50);
  });

  it('should maintain consistent frame rate during interactions', async () => {
    const { container } = customRender(<DataGrid data={mockData} columns={columns} />);
    
    const result = await measureFrameRate(
      () => {
        fireEvent.scroll(container.querySelector('.data-grid-container'), {
          target: { scrollTop: Math.random() * 1000 },
        });
      },
      { 
        duration: 1000, 
        markName: 'interaction', 
        measureName: 'interaction' 
      }
    );
    
    // Budget: 16.67ms per frame (60fps)
    expect(result.fps).toBeGreaterThanOrEqual(60);
    expect(result.droppedFrames).toBeLessThan(5); // Allow max 5 frame drops
  });
}); 