/**
 * Cache Interface - Core caching operations
 * 
 * Defines the contract that all cache backends must implement.
 * Follows the same adapter pattern as @synet/fs
 */

/**
 * Cache statistics interface
 */
export interface CacheStats {
  size: number;
  maxSize: number;
  hits: number;
  misses: number;
  hitRate: number;
  memoryUsage?: number;
  evictions: number;
}

/**
 * Cache entry metadata
 */
export interface CacheEntry<T = unknown> {
  value: T;
  createdAt: number;
  accessedAt: number;
  expiresAt?: number;
  ttl?: number;
}

/**
 * Core cache interface that all backends must implement
 */
export interface ICache {
  /**
   * Get value by key
   */
  get<T = unknown>(key: string): T | null;

  /**
   * Set value with optional TTL
   */
  set<T = unknown>(key: string, value: T, ttl?: number): void;

  /**
   * Check if key exists and is not expired
   */
  has(key: string): boolean;

  /**
   * Delete single key
   */
  delete(key: string): boolean;

  /**
   * Clear all entries
   */
  clear(): void;

  /**
   * Get all keys (optionally matching pattern)
   */
  keys(pattern?: string): string[];

  /**
   * Get cache size (number of entries)
   */
  size(): number;

  /**
   * Get cache statistics
   */
  stats(): CacheStats;

  /**
   * Cleanup expired entries (manual trigger)
   */
  cleanup(): number; // Returns number of cleaned entries
}
