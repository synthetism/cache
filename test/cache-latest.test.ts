/**
 * Cache Unit Tests - Unit Architecture v1.0.6 Validation
 * 
 * Tests follow Unit Architecture patterns:
 * - Unit creation and identity
 * - Teaching and learning contracts
 * - Native capability operations
 * - Graceful degradation patterns
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { Cache } from '../src/cache.js';
import type { TeachingContract } from '@synet/unit';

describe('Cache Unit Architecture v1.0.6', () => {
  let cache: Cache;

  beforeEach(() => {
    cache = Cache.create({
      namespace: 'test',
      keyPrefix: 'test:'
    });
  });

  describe('Unit Architecture Compliance', () => {
    it('should create successfully with Config → Props pattern', () => {
      const config = { 
        namespace: 'test-cache', 
        keyPrefix: 'prefix:',
        metadata: { test: true }
      };
      const unit = Cache.create(config);
      
      expect(unit.dna.id).toBe('cache');
      expect(unit.dna.version).toBe('1.0.0');
      expect(unit.whoami()).toContain('Cache Unit');
      expect(unit.namespace).toBe('test-cache');
      expect(unit.keyPrefix).toBe('prefix:');
    });

    it('should implement required Unit methods', () => {
      expect(typeof cache.whoami).toBe('function');
      expect(typeof cache.capabilities).toBe('function');
      expect(typeof cache.help).toBe('function');
      expect(typeof cache.teach).toBe('function');
      expect(typeof cache.learn).toBe('function');
      
      expect(cache.whoami()).toContain('Cache Unit');
      expect(Array.isArray(cache.capabilities())).toBe(true);
    });

    it('should have proper DNA structure', () => {
      expect(cache.dna).toBeDefined();
      expect(cache.dna.id).toBe('cache');
      expect(cache.dna.version).toBe('1.0.0');
      expect(typeof cache.dna.id).toBe('string');
      expect(typeof cache.dna.version).toBe('string');
    });
  });

  describe('Teaching Contract (Doctrines #9, #19)', () => {
    it('should implement TeachingContract correctly', () => {
      const contract: TeachingContract = cache.teach();
      
      expect(contract.unitId).toBe('cache');
      expect(contract.capabilities).toBeDefined();
      expect(typeof contract.capabilities).toBe('object');
      
      // Should teach native cache capabilities
      const expectedCapabilities = [
        'get', 'set', 'has', 'delete', 'clear', 
        'keys', 'size', 'stats', 'cleanup'
      ];
      
      for (const capability of expectedCapabilities) {
        expect(contract.capabilities).toHaveProperty(capability);
        expect(typeof contract.capabilities[capability]).toBe('function');
      }
    });

    it('should teach only native capabilities (no capability leakage)', () => {
      // Learn external capability
      const externalContract: TeachingContract = {
        unitId: 'external',
        capabilities: {
          externalSkill: () => 'external-result'
        }
      };
      cache.learn([externalContract]);
      
      // Get teaching contract after learning
      const contract = cache.teach();
      
      // Should not include learned capabilities
      expect(contract.capabilities).not.toHaveProperty('externalSkill');
      expect(Object.keys(contract.capabilities)).toEqual([
        'get', 'set', 'has', 'delete', 'clear', 
        'keys', 'size', 'stats', 'cleanup'
      ]);
    });
  });

  describe('Learning Capabilities (Doctrine #2)', () => {
    it('should learn capabilities with proper namespacing', () => {
      const teachingContract: TeachingContract = {
        unitId: 'external-unit',
        capabilities: {
          learnedSkill: () => 'learned-result'
        }
      };
      
      cache.learn([teachingContract]);
      
      // Learned capability should be namespaced
      expect(cache.can('external-unit.learnedSkill')).toBe(true);
      expect(cache.capabilities()).toContain('external-unit.learnedSkill');
    });

    it('should execute learned capabilities through execute()', async () => {
      const teachingContract: TeachingContract = {
        unitId: 'test-provider',
        capabilities: {
          processData: (data: unknown) => `processed: ${data}`
        }
      };
      
      cache.learn([teachingContract]);
      
      const result = await cache.execute('test-provider.processData', 'test-data');
      expect(result).toBe('processed: test-data');
    });
  });

  describe('Native Cache Operations (Doctrine #20)', () => {
    it('should handle basic cache operations', () => {
      // Set operation
      cache.set('key1', 'value1');
      
      // Get operation
      expect(cache.get('key1')).toBe('value1');
      
      // Has operation
      expect(cache.has('key1')).toBe(true);
      expect(cache.has('nonexistent')).toBe(false);
      
      // Delete operation
      expect(cache.delete('key1')).toBe(true);
      expect(cache.get('key1')).toBe(null);
      expect(cache.has('key1')).toBe(false);
    });

    it('should handle TTL and expiration', () => {
      cache.set('temp-key', 'temp-value', 100); // 100ms TTL
      expect(cache.get('temp-key')).toBe('temp-value');
      
      // Note: TTL behavior depends on backend implementation
    });

    it('should handle prefix correctly', () => {
      const prefixedCache = Cache.create({ keyPrefix: 'prefix:' });
      
      prefixedCache.set('key1', 'value1');
      
      // Should be able to retrieve with same cache
      expect(prefixedCache.get('key1')).toBe('value1');
      
      // Keys should be listed without prefix
      const keys = prefixedCache.keys();
      expect(keys).toContain('key1');
    });

    it('should handle batch operations', () => {
      const entries = { key1: 'value1', key2: 'value2', key3: 'value3' };
      
      // Set many
      cache.setMany(entries);
      
      // Get many
      const results = cache.getMany(['key1', 'key2', 'key3', 'nonexistent']);
      expect(results).toEqual({
        key1: 'value1',
        key2: 'value2', 
        key3: 'value3',
        nonexistent: null
      });
      
      // Delete many
      const deleteResults = cache.deleteMany(['key1', 'key2']);
      expect(deleteResults.key1).toBe(true);
      expect(deleteResults.key2).toBe(true);
    });

    it('should handle numeric operations', () => {
      cache.set('counter', 5);
      
      expect(cache.increment('counter')).toBe(6);
      expect(cache.increment('counter', 3)).toBe(9);
      expect(cache.decrement('counter', 2)).toBe(7);
      
      // Should handle non-existent keys
      expect(cache.increment('new-counter')).toBe(1);
    });

    it('should handle getOrSet pattern', () => {
      let factoryCalled = false;
      const factory = () => {
        factoryCalled = true;
        return 'computed-value';
      };
      
      // First call should invoke factory
      const result1 = cache.getOrSet('computed', factory);
      expect(result1).toBe('computed-value');
      expect(factoryCalled).toBe(true);
      
      // Second call should use cached value
      factoryCalled = false;
      const result2 = cache.getOrSet('computed', factory);
      expect(result2).toBe('computed-value');
      expect(factoryCalled).toBe(false);
    });
  });

  describe('Error Handling (Doctrine #14)', () => {
    it('should handle graceful degradation', () => {
      // Cache should work without any external capabilities
      expect(() => cache.get('key')).not.toThrow();
      expect(() => cache.set('key', 'value')).not.toThrow();
      expect(() => cache.clear()).not.toThrow();
    });

    it('should provide helpful error messages', () => {
      // Test accessing non-existent capability
      expect(cache.can('nonexistent.capability')).toBe(false);
    });
  });

  describe('Namespace and Isolation', () => {
    it('should respect namespace isolation', () => {
      const cache1 = Cache.create({ namespace: 'ns1', keyPrefix: 'ns1:' });
      const cache2 = Cache.create({ namespace: 'ns2', keyPrefix: 'ns2:' });
      
      cache1.set('shared-key', 'value1');
      cache2.set('shared-key', 'value2');
      
      expect(cache1.get('shared-key')).toBe('value1');
      expect(cache2.get('shared-key')).toBe('value2');
    });

    it('should handle clear operations with prefix', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      
      const otherCache = Cache.create({ keyPrefix: 'other:' });
      otherCache.set('key1', 'other-value');
      
      // Clear should only affect our prefixed keys
      cache.clear();
      
      expect(cache.get('key1')).toBe(null);
      expect(cache.get('key2')).toBe(null);
      expect(otherCache.get('key1')).toBe('other-value');
    });
  });

  describe('Help and Documentation (Doctrine #11)', () => {
    it('should provide living documentation', () => {
      // help() should not throw and should be informative
      expect(() => cache.help()).not.toThrow();
      
      const helpOutput = cache.whoami();
      expect(helpOutput).toContain('Cache Unit');
      expect(helpOutput).toContain(cache.namespace);
    });
  });
});
