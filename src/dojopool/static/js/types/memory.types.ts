export interface MemoryPoolStats {
    allocated: number;
    available: number;
    peakUsage: number;
}

export interface MemoryPool<T = any> {
    size: number;
    available: number;
    allocate: () => T;
    free: (item: T) => void;
    gc: () => void;
    stats: () => MemoryPoolStats;
}

export interface MemoryManagerStats {
    totalAllocated: number;
    peakUsage: number;
    currentUsage: number;
    pools: Array<{
        name: string;
        allocated: number;
        available: number;
        peakUsage: number;
    }>;
} 