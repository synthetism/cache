/**
 * Memory Cache Adapter - In-memory caching with LRU eviction
 * 
 * Implements ICache interface with:
 * - LRU (Least Recently Used) eviction policy
 * - TTL (Time To Live) support with automatic cleanup
 * - Memory limits and size constraints
 * - Zero external dependencies
 */

import type { ICache, CacheEntry, CacheStats } from './cache.interface.js';

/**
 * Memory cache configuration
 */
export interface MemoryCacheConfig {
  maxSize?: number;           // Maximum number of entries (default: 1000)
  maxMemory?: number;         // Maximum memory in bytes (default: 100MB)
  defaultTTL?: number;        // Default TTL in milliseconds (default: 1 hour)
  cleanupInterval?: number;   // Auto-cleanup interval in ms (default: 5 minutes)
  evictionPolicy?: 'lru' | 'fifo'; // Eviction strategy (default: 'lru')
}

/**
 * Memory Cache implementation with LRU eviction
 */
export class MemoryCache implements ICache {
  private store = new Map<string, CacheEntry>();
  private accessOrder = new Map<string, number>(); // For LRU tracking
  private nextAccessTime = 1;
  
  // Configuration
  private readonly maxSize: number;
  private readonly maxMemory: number;
  private readonly defaultTTL: number;
  private readonly evictionPolicy: 'lru' | 'fifo';
  
  // Statistics
  private hits = 0;
  private misses = 0;
  private evictions = 0;
  
  // Cleanup timer
  private cleanupTimer?: NodeJS.Timeout;

  constructor(config: MemoryCacheConfig = {}) {
    this.maxSize = config.maxSize ?? 1000;
    this.maxMemory = config.maxMemory ?? 100 * 1024 * 1024; // 100MB
    this.defaultTTL = config.defaultTTL ?? 60 * 60 * 1000; // 1 hour
    this.evictionPolicy = config.evictionPolicy ?? 'lru';
    
    // Setup automatic cleanup
    const cleanupInterval = config.cleanupInterval ?? 5 * 60 * 1000; // 5 minutes
    this.cleanupTimer = setInterval(() => this.cleanup(), cleanupInterval);
  }

  get<T = unknown>(key: string): T | null {
    const entry = this.store.get(key);
    
    if (!entry) {
      this.misses++;
      return null;
    }
    
    // Check if expired
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.store.delete(key);
      this.accessOrder.delete(key);
      this.misses++;
      return null;
    }
    
    // Update access time for LRU
    entry.accessedAt = Date.now();
    if (this.evictionPolicy === 'lru') {
      this.accessOrder.set(key, this.nextAccessTime++);
    }
    
    this.hits++;
    return entry.value as T;
  }

  set<T = unknown>(key: string, value: T, ttl?: number): void {
    const now = Date.now();
    const effectiveTTL = ttl ?? this.defaultTTL;
    
    const entry: CacheEntry<T> = {
      value,
      createdAt: now,
      accessedAt: now,
      expiresAt: effectiveTTL > 0 ? now + effectiveTTL : undefined,
      ttl: effectiveTTL
    };
    
    // Check if we need to evict before adding
    if (!this.store.has(key) && this.store.size >= this.maxSize) {
      this.evictOne();
    }
    
    this.store.set(key, entry);
    
    if (this.evictionPolicy === 'lru') {
      this.accessOrder.set(key, this.nextAccessTime++);
    }
    
    // Check memory limits
    this.checkMemoryLimits();
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  delete(key: string): boolean {
    const existed = this.store.has(key);
    this.store.delete(key);
    this.accessOrder.delete(key);
    return existed;
  }

  clear(): void {
    this.store.clear();
    this.accessOrder.clear();
    this.nextAccessTime = 1;
    this.hits = 0;
    this.misses = 0;
    this.evictions = 0;
  }

  keys(pattern?: string): string[] {
    const allKeys = Array.from(this.store.keys());
    
    if (!pattern) {
      return allKeys;
    }
    
    // Simple glob pattern matching
    const regex = this.globToRegex(pattern);
    return allKeys.filter(key => regex.test(key));
  }

  size(): number {
    return this.store.size;
  }

  stats(): CacheStats {
    const totalRequests = this.hits + this.misses;
    
    return {
      size: this.store.size,
      maxSize: this.maxSize,
      hits: this.hits,
      misses: this.misses,
      hitRate: totalRequests > 0 ? this.hits / totalRequests : 0,
      memoryUsage: this.estimateMemoryUsage(),
      evictions: this.evictions
    };
  }

  cleanup(): number {
    const now = Date.now();
    let cleanedCount = 0;
    
    for (const [key, entry] of this.store.entries()) {
      if (entry.expiresAt && now > entry.expiresAt) {
        this.store.delete(key);
        this.accessOrder.delete(key);
        cleanedCount++;
      }
    }
    
    return cleanedCount;
  }

  /**
   * Destroy the cache and cleanup resources
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = undefined;
    }
    this.clear();
  }

  // Private helper methods

  private evictOne(): void {
    if (this.store.size === 0) return;
    
    let keyToEvict: string;
    
    if (this.evictionPolicy === 'lru') {
      // Find least recently used key
      let oldestAccessTime = Infinity;
      keyToEvict = '';
      
      for (const [key, accessTime] of this.accessOrder.entries()) {
        if (accessTime < oldestAccessTime) {
          oldestAccessTime = accessTime;
          keyToEvict = key;
        }
      }
    } else {
      // FIFO - evict oldest by creation time
      let oldestTime = Infinity;
      keyToEvict = '';
      
      for (const [key, entry] of this.store.entries()) {
        if (entry.createdAt < oldestTime) {
          oldestTime = entry.createdAt;
          keyToEvict = key;
        }
      }
    }
    
    if (keyToEvict) {
      this.store.delete(keyToEvict);
      this.accessOrder.delete(keyToEvict);
      this.evictions++;
    }
  }

  private checkMemoryLimits(): void {
    const currentMemory = this.estimateMemoryUsage();
    
    while (currentMemory > this.maxMemory && this.store.size > 0) {
      this.evictOne();
    }
  }

  private estimateMemoryUsage(): number {
    let totalBytes = 0;
    
    for (const [key, entry] of this.store.entries()) {
      // Rough estimation: key + JSON serialized value + metadata
      totalBytes += key.length * 2; // UTF-16 chars
      totalBytes += JSON.stringify(entry.value).length * 2;
      totalBytes += 64; // Metadata overhead estimate
    }
    
    return totalBytes;
  }

  private globToRegex(pattern: string): RegExp {
    // Convert simple glob patterns to regex
    const escaped = pattern
      .replace(/[.+^${}()|[\]\\]/g, '\\$&') // Escape regex chars
      .replace(/\*/g, '.*') // * becomes .*
      .replace(/\?/g, '.'); // ? becomes .
    
    return new RegExp(`^${escaped}$`);
  }
}
