/**
 * Memory Cache Adapter Tests - Advanced Features
 * 
 * Tests the MemoryCache implementation directly including:
 * - LRU eviction policy
 * - TTL and automatic cleanup
 * - Memory limits and size constraints
 * - Pattern matching and glob patterns
 * - Performance statistics
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MemoryCache } from '../src/memory.js';
import type { MemoryCacheConfig } from '../src/memory.js';

describe('MemoryCache Adapter', () => {
  let cache: MemoryCache;

  beforeEach(() => {
    cache = new MemoryCache();
  });

  afterEach(() => {
    cache.destroy();
  });

  describe('Basic Operations', () => {
    it('should store and retrieve values', () => {
      cache.set('key1', 'value1');
      expect(cache.get('key1')).toBe('value1');
    });

    it('should return null for non-existent keys', () => {
      expect(cache.get('nonexistent')).toBe(null);
    });

    it('should check key existence', () => {
      cache.set('key1', 'value1');
      expect(cache.has('key1')).toBe(true);
      expect(cache.has('nonexistent')).toBe(false);
    });

    it('should delete keys', () => {
      cache.set('key1', 'value1');
      expect(cache.delete('key1')).toBe(true);
      expect(cache.get('key1')).toBe(null);
      expect(cache.delete('nonexistent')).toBe(false);
    });

    it('should clear all keys', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.clear();
      expect(cache.get('key1')).toBe(null);
      expect(cache.get('key2')).toBe(null);
      expect(cache.size()).toBe(0);
    });

    it('should track size correctly', () => {
      expect(cache.size()).toBe(0);
      cache.set('key1', 'value1');
      expect(cache.size()).toBe(1);
      cache.set('key2', 'value2');
      expect(cache.size()).toBe(2);
      cache.delete('key1');
      expect(cache.size()).toBe(1);
    });
  });

  describe('TTL (Time To Live)', () => {
    it('should expire keys after TTL', async () => {
      cache.set('temp', 'value', 10); // 10ms TTL
      expect(cache.get('temp')).toBe('value');
      
      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 15));
      expect(cache.get('temp')).toBe(null);
    });

    it('should use default TTL when not specified', () => {
      const shortTTLCache = new MemoryCache({ defaultTTL: 10 });
      shortTTLCache.set('key', 'value');
      
      // Should have TTL set
      expect(shortTTLCache.get('key')).toBe('value');
      
      shortTTLCache.destroy();
    });

    it('should not expire keys with TTL 0 or negative', () => {
      cache.set('permanent1', 'value1', 0);
      cache.set('permanent2', 'value2', -1);
      
      expect(cache.get('permanent1')).toBe('value1');
      expect(cache.get('permanent2')).toBe('value2');
    });

    it('should cleanup expired entries manually', async () => {
      cache.set('temp1', 'value1', 10);
      cache.set('temp2', 'value2', 10);
      cache.set('permanent', 'value3'); // No TTL
      
      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 15));
      
      const cleanedCount = cache.cleanup();
      expect(cleanedCount).toBe(2);
      expect(cache.get('permanent')).toBe('value3');
      expect(cache.size()).toBe(1);
    });
  });

  describe('LRU Eviction', () => {
    it('should evict least recently used items when size limit reached', () => {
      const lruCache = new MemoryCache({ maxSize: 3, evictionPolicy: 'lru' });
      
      lruCache.set('key1', 'value1');
      lruCache.set('key2', 'value2');
      lruCache.set('key3', 'value3');
      
      // Access key1 to make it recently used
      lruCache.get('key1');
      
      // Add key4, should evict key2 (least recently used)
      lruCache.set('key4', 'value4');
      
      expect(lruCache.get('key1')).toBe('value1'); // Still there
      expect(lruCache.get('key2')).toBe(null); // Evicted
      expect(lruCache.get('key3')).toBe('value3'); // Still there
      expect(lruCache.get('key4')).toBe('value4'); // New item
      
      lruCache.destroy();
    });

    it('should evict oldest items with FIFO policy', () => {
      const fifoCache = new MemoryCache({ maxSize: 3, evictionPolicy: 'fifo' });
      
      fifoCache.set('key1', 'value1');
      fifoCache.set('key2', 'value2');
      fifoCache.set('key3', 'value3');
      
      // Access key1 (shouldn't matter for FIFO)
      fifoCache.get('key1');
      
      // Add key4, should evict key1 (oldest)
      fifoCache.set('key4', 'value4');
      
      expect(fifoCache.get('key1')).toBe(null); // Evicted (oldest)
      expect(fifoCache.get('key2')).toBe('value2'); // Still there
      expect(fifoCache.get('key3')).toBe('value3'); // Still there
      expect(fifoCache.get('key4')).toBe('value4'); // New item
      
      fifoCache.destroy();
    });
  });

  describe('Pattern Matching', () => {
    beforeEach(() => {
      cache.set('user:1', 'user1');
      cache.set('user:2', 'user2');
      cache.set('post:1', 'post1');
      cache.set('post:2', 'post2');
      cache.set('admin', 'admin');
    });

    it('should list all keys when no pattern provided', () => {
      const keys = cache.keys();
      expect(keys).toEqual(['user:1', 'user:2', 'post:1', 'post:2', 'admin']);
    });

    it('should match wildcard patterns', () => {
      const userKeys = cache.keys('user:*');
      expect(userKeys).toEqual(['user:1', 'user:2']);
      
      const postKeys = cache.keys('post:*');
      expect(postKeys).toEqual(['post:1', 'post:2']);
    });

    it('should match single character patterns', () => {
      const keys = cache.keys('user:?');
      expect(keys).toEqual(['user:1', 'user:2']);
    });

    it('should match exact patterns', () => {
      const keys = cache.keys('admin');
      expect(keys).toEqual(['admin']);
    });

    it('should return empty array for non-matching patterns', () => {
      const keys = cache.keys('nonexistent:*');
      expect(keys).toEqual([]);
    });
  });

  describe('Statistics', () => {
    it('should track hit and miss statistics', () => {
      cache.set('key1', 'value1');
      
      // Hits
      cache.get('key1'); // hit
      cache.get('key1'); // hit
      
      // Misses
      cache.get('nonexistent1'); // miss
      cache.get('nonexistent2'); // miss
      
      const stats = cache.stats();
      expect(stats.hits).toBe(2);
      expect(stats.misses).toBe(2);
      expect(stats.hitRate).toBe(0.5); // 2/4
    });

    it('should track cache size and evictions', () => {
      const smallCache = new MemoryCache({ maxSize: 2 });
      
      smallCache.set('key1', 'value1');
      smallCache.set('key2', 'value2');
      smallCache.set('key3', 'value3'); // Should trigger eviction
      
      const stats = smallCache.stats();
      expect(stats.size).toBe(2);
      expect(stats.maxSize).toBe(2);
      expect(stats.evictions).toBe(1);
      
      smallCache.destroy();
    });

    it('should estimate memory usage', () => {
      cache.set('small', 'x');
      cache.set('large', 'x'.repeat(1000));
      
      const stats = cache.stats();
      expect(stats.memoryUsage).toBeGreaterThan(0);
      expect(typeof stats.memoryUsage).toBe('number');
    });
  });

  describe('Configuration Options', () => {
    it('should respect custom configuration', () => {
      const config: MemoryCacheConfig = {
        maxSize: 5,
        maxMemory: 1024,
        defaultTTL: 1000,
        cleanupInterval: 500,
        evictionPolicy: 'fifo'
      };
      
      const customCache = new MemoryCache(config);
      const stats = customCache.stats();
      
      expect(stats.maxSize).toBe(5);
      customCache.destroy();
    });

    it('should use default values when not configured', () => {
      const defaultCache = new MemoryCache();
      const stats = defaultCache.stats();
      
      expect(stats.maxSize).toBe(1000); // Default maxSize
      defaultCache.destroy();
    });
  });

  describe('Memory Management', () => {
    it('should enforce memory limits', () => {
      const memoryCache = new MemoryCache({ 
        maxMemory: 1024, // 1KB limit
        maxSize: 1000 // High item limit
      });
      
      // Fill with large values to exceed memory limit
      for (let i = 0; i < 10; i++) {
        memoryCache.set(`large${i}`, 'x'.repeat(200)); // ~200 bytes each
      }
      
      // Should have evicted items to stay under memory limit
      const stats = memoryCache.stats();
      expect(stats.memoryUsage).toBeLessThanOrEqual(1024 * 1.5); // Allow some overhead
      
      memoryCache.destroy();
    });
  });

  describe('Automatic Cleanup', () => {
    it('should automatically cleanup expired entries', async () => {
      const autoCleanupCache = new MemoryCache({ 
        cleanupInterval: 20, // 20ms cleanup interval
        defaultTTL: 10 // 10ms default TTL
      });
      
      autoCleanupCache.set('temp1', 'value1');
      autoCleanupCache.set('temp2', 'value2');
      
      expect(autoCleanupCache.size()).toBe(2);
      
      // Wait for expiration and cleanup
      await new Promise(resolve => setTimeout(resolve, 30));
      
      expect(autoCleanupCache.size()).toBe(0);
      
      autoCleanupCache.destroy();
    });
  });

  describe('Type Safety', () => {
    it('should handle different value types', () => {
      // String
      cache.set('string', 'text');
      expect(cache.get<string>('string')).toBe('text');
      
      // Number
      cache.set('number', 42);
      expect(cache.get<number>('number')).toBe(42);
      
      // Boolean
      cache.set('boolean', true);
      expect(cache.get<boolean>('boolean')).toBe(true);
      
      // Object
      const obj = { id: 1, name: 'test' };
      cache.set('object', obj);
      expect(cache.get<typeof obj>('object')).toEqual(obj);
      
      // Array
      const arr = [1, 2, 3];
      cache.set('array', arr);
      expect(cache.get<typeof arr>('array')).toEqual(arr);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid keys gracefully', () => {
      expect(() => cache.get('')).not.toThrow();
      expect(() => cache.set('', 'value')).not.toThrow();
      expect(() => cache.delete('')).not.toThrow();
    });

    it('should handle circular references in values', () => {
      const circular: any = { name: 'test' };
      circular.self = circular;
      
      // Should not throw when setting
      expect(() => cache.set('circular', circular)).not.toThrow();
      
      // Should retrieve the same object structure
      const retrieved = cache.get<typeof circular>('circular');
      expect(retrieved).toBeDefined();
      expect(retrieved?.name).toBe('test');
    });
  });

  describe('Cleanup and Destruction', () => {
    it('should properly cleanup resources on destroy', () => {
      const testCache = new MemoryCache({ cleanupInterval: 100 });
      testCache.set('test', 'value');
      
      expect(testCache.size()).toBe(1);
      
      testCache.destroy();
      
      // After destruction, cache should be empty
      expect(testCache.size()).toBe(0);
    });
  });
});
