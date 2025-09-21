export interface CacheDecoratorOptions {
  ttl?: number; // Time to live in seconds
  keyPrefix?: string;
  keyGenerator?: (...args: any[]) => string;
  condition?: (...args: any[]) => boolean; // Only cache if this returns true
  invalidatePatterns?: string[]; // Patterns to invalidate on method execution
  writeThrough?: boolean; // Use write-through caching for write operations
}

export function Cacheable(options: CacheDecoratorOptions = {}) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      // Get cache service instances
      const cacheServiceInstance =
        (this as any).cacheService || (this as any).cacheManager;
      const _cacheHelperInstance =
        (this as any).cacheHelper || (this as any).cacheManager;

      if (!cacheServiceInstance) {
        console.warn(
          `CacheService not available in ${target.constructor.name}.${propertyKey}`
        );
        return originalMethod.apply(this, args);
      }

      // Check condition if provided
      if (options.condition && !options.condition(...args)) {
        return originalMethod.apply(this, args);
      }

      // Generate cache key
      const key = options.keyGenerator
        ? options.keyGenerator(...args)
        : generateDefaultKey(target.constructor.name, propertyKey, args);

      // Try to get from cache first
      const cachedResult = await cacheServiceInstance.get(
        key,
        options.keyPrefix
      );
      if (cachedResult !== null) {
        return cachedResult;
      }

      // Execute original method
      const result = await originalMethod.apply(this, args);

      // Cache the result
      if (result !== undefined && result !== null) {
        await cacheServiceInstance.set(key, result, {
          ttl: options.ttl,
          keyPrefix: options.keyPrefix,
        });
      }

      return result;
    };

    return descriptor;
  };
}

export function CacheWriteThrough(options: CacheDecoratorOptions = {}) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const cacheHelperInstance =
        (this as any).cacheHelper || (this as any).cacheManager;

      if (!cacheHelperInstance) {
        console.warn(
          `CacheHelper not available in ${target.constructor.name}.${propertyKey}`
        );
        return originalMethod.apply(this, args);
      }

      // Check condition if provided
      if (options.condition && !options.condition(...args)) {
        return originalMethod.apply(this, args);
      }

      // Generate cache key
      const key = options.keyGenerator
        ? options.keyGenerator(...args)
        : generateDefaultKey(target.constructor.name, propertyKey, args);

      // Use write-through caching
      const result = await cacheHelperInstance.writeThrough({
        key,
        data: args[0], // Assume first argument is the data to cache
        cacheOptions: {
          ttl: options.ttl,
          keyPrefix: options.keyPrefix,
          invalidateOnWrite: true,
          invalidatePatterns: options.invalidatePatterns,
        },
        writeOperation: () => originalMethod.apply(this, args),
      });

      return result;
    };

    return descriptor;
  };
}

export function CacheInvalidate(patterns: string[]) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const cacheServiceInstance =
        (this as any).cacheService || (this as any).cacheManager;
      const cacheHelperInstance =
        (this as any).cacheHelper || (this as any).cacheManager;

      // Execute original method first
      const result = await originalMethod.apply(this, args);

      // Invalidate cache patterns after successful execution
      if (cacheHelperInstance && patterns.length > 0) {
        await cacheHelperInstance.invalidatePatterns(patterns);
      } else if (cacheServiceInstance && patterns.length > 0) {
        for (const pattern of patterns) {
          await cacheServiceInstance.deleteByPattern(pattern);
        }
      }

      return result;
    };

    return descriptor;
  };
}

export function CacheKey(...parts: (string | number | boolean)[]): string {
  return parts
    .map((part) => String(part).replace(/[^a-zA-Z0-9_-]/g, '_'))
    .join(':');
}

function generateDefaultKey(
  className: string,
  methodName: string,
  args: any[]
): string {
  const argsHash = JSON.stringify(args).replace(/[^a-zA-Z0-9_-]/g, '_');
  return CacheKey(className, methodName, argsHash);
}
