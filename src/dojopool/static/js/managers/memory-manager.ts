import { type MemoryManagerStats, type MemoryPool } from '../types';
import { BaseManager } from './base-manager';

export class MemoryManager extends BaseManager<MemoryManager> {
  private readonly pools: Map<string, MemoryPool<any>>;
  private readonly stats: {
    totalAllocated: number;
    peakUsage: number;
    currentUsage: number;
  };

  protected constructor() {
    super();
    this.pools = new Map();
    this.stats = {
      totalAllocated: 0,
      peakUsage: 0,
      currentUsage: 0,
    };
  }

  public static override getInstance(): MemoryManager {
    return BaseManager.getInstance.call(MemoryManager);
  }

  public registerPool<T>(name: string, pool: MemoryPool<T>): void {
    if (this.pools.has(name)) {
      throw new Error(`Pool with name ${name} already exists`);
    }
    this.pools.set(name, pool);
    this.stats.totalAllocated += pool.size;
  }

  public getPool<T>(name: string): MemoryPool<T> | undefined {
    return this.pools.get(name) as MemoryPool<T> | undefined;
  }

  public monitorMemorySpikes(): void {
    if ('memory' in performance) {
      const memoryInfo = (performance as any).memory;
      this.stats.currentUsage = memoryInfo.usedJSHeapSize;
      this.stats.peakUsage = Math.max(
        this.stats.peakUsage,
        this.stats.currentUsage
      );
    }
  }

  public getStats(): MemoryManagerStats {
    return {
      ...this.stats,
      pools: Array.from(this.pools.entries()).map(([name, pool]) => ({
        name,
        ...pool.stats(),
      })),
    };
  }

  public override cleanup(): void {
    this.pools.forEach((pool) => pool.gc());
    this.pools.clear();
    this.stats.currentUsage = 0;
    this.stats.totalAllocated = 0;
    this.onCleanup();
  }
}
