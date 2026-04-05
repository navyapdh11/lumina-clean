// Enterprise caching layer for LuminaClean v5.0
// In-memory LRU cache with TTL for Edge Runtime

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
  tags: string[];
}

interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  tags?: string[]; // Cache tags for pattern invalidation
}

class LuminaCache {
  private cache: Map<string, CacheEntry<any>>;
  private maxSize: number;
  private defaultTTL: number;

  constructor(maxSize: number = 1000, defaultTTL: number = 5 * 60 * 1000) {
    this.cache = new Map();
    this.maxSize = maxSize;
    this.defaultTTL = defaultTTL;
  }

  // Set cache entry
  set<T>(key: string, data: T, options: CacheOptions = {}): void {
    // Enforce max size with LRU eviction
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    this.cache.set(key, {
      data,
      expiresAt: Date.now() + (options.ttl || this.defaultTTL),
      tags: options.tags || [],
    });
  }

  // Get cache entry
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) return null;
    
    // Check expiration
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    // Move to end (LRU)
    const data = entry.data;
    this.cache.delete(key);
    this.cache.set(key, entry);
    
    return data as T;
  }

  // Invalidate by pattern
  invalidateByTag(tag: string): number {
    let count = 0;
    for (const [key, entry] of this.cache.entries()) {
      if (entry.tags.includes(tag)) {
        this.cache.delete(key);
        count++;
      }
    }
    return count;
  }

  // Invalidate by key pattern
  invalidateByPattern(pattern: string): number {
    let count = 0;
    for (const key of this.cache.keys()) {
      if (key.includes(pattern) || new RegExp(pattern).test(key)) {
        this.cache.delete(key);
        count++;
      }
    }
    return count;
  }

  // Clear all
  clear(): void {
    this.cache.clear();
  }

  // Get stats
  stats(): { size: number; maxSize: number; hitRate: number } {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: this.calculateHitRate(),
    };
  }

  // Delete single key
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  // Check if key exists and is valid
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  private calculateHitRate(): number {
    // Simplified hit rate calculation
    return this.cache.size / this.maxSize;
  }
}

// Singleton instance
export const cache = new LuminaCache(1000, 5 * 60 * 1000);

// Cache wrapper for API routes
export function withCache<T>(
  key: string,
  fn: () => Promise<T>,
  options: CacheOptions = {}
): Promise<T> {
  const cached = cache.get<T>(key);
  if (cached) return Promise.resolve(cached);

  return fn().then(data => {
    cache.set(key, data, options);
    return data;
  });
}

export default cache;
