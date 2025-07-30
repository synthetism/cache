/**
 * Cache Unit - Multi-backend caching with Unit Architecture v1.0.6
 * 
 * Following Unit Architecture Doctrines:
 * - Doctrine #1: ZERO DEPENDENCY (only native interfaces)
 * - Doctrine #2: TEACH/LEARN PARADIGM (every unit must teach/learn)
 * - Doctrine #3: PROPS CONTAIN EVERYTHING (single source of truth)
 * - Doctrine #4: CREATE NOT CONSTRUCT (protected constructor + static create)
 * - Doctrine #7: EVERY UNIT MUST HAVE DNA (createUnitSchema)
 * - Doctrine #9: ALWAYS TEACH (explicit capability binding)
 * - Doctrine #12: NAMESPACE EVERYTHING (unitId.capability format)
 * - Doctrine #17: VALUE OBJECT FOUNDATION (extends Unit<T>)
 * - Doctrine #19: CAPABILITY LEAKAGE PREVENTION (teach only native)
 * - Doctrine #20: GRACEFUL DEGRADATION (baseline functionality)
 */

import { Unit, createUnitSchema, type UnitProps, type TeachingContract } from '@synet/unit';
import type { ICache, CacheEntry, CacheStats } from './cache.interface.js';
import { MemoryCache, type MemoryCacheConfig } from './memory.js';

/**
 * Cache unit configuration (external input to static create)
 * Doctrine #13: TYPE HIERARCHY CONSISTENCY (Config → Props pattern)
 */
export interface CacheConfig {
  backend?: 'memory' | 'custom';
  memoryOptions?: MemoryCacheConfig;
  customBackend?: ICache;
  namespace?: string;
  keyPrefix?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Cache unit properties (internal state after validation)
 * Doctrine #3: PROPS CONTAIN EVERYTHING (extends UnitProps)
 */
export interface CacheProps extends UnitProps {
  backend: ICache;
  namespace: string;
  keyPrefix: string;
}

const VERSION = '1.0.0';

/**
 * Cache Unit - Multi-backend caching with teaching/learning capabilities
 * 
 * Doctrine #17: VALUE OBJECT FOUNDATION (extends Unit<CacheProps>)
 * Doctrine #20: GRACEFUL DEGRADATION (functions without external capabilities)
 */
export class Cache extends Unit<CacheProps> {
  // Doctrine #4: CREATE NOT CONSTRUCT (protected constructor enables evolution)
  protected constructor(props: CacheProps) {
    super(props);
  }

  /**
   * Create cache unit with specified backend
   * Doctrine #4: CREATE NOT CONSTRUCT (only entry point)
   */
  static create(config: CacheConfig = {}): Cache {
    const backend = config.customBackend ?? new MemoryCache(config.memoryOptions);
    
    const props: CacheProps = {
      dna: createUnitSchema({ id: 'cache', version: VERSION }),
      backend,
      namespace: config.namespace ?? 'default',
      keyPrefix: config.keyPrefix ?? '',
      created: new Date(),
      metadata: config.metadata || {}
    };
    
    return new Cache(props);
  }

  // ==========================================
  // UNIT ARCHITECTURE REQUIRED METHODS
  // ==========================================

  whoami(): string {
    return `Cache Unit - ${this.props.namespace} (${this.props.dna.id}@${this.props.dna.version})`;
  }

  capabilities(): string[] {
    return Array.from(this._capabilities.keys());
  }

  help(): void {
    console.log(`
[💾] Cache Unit - Multi-backend caching system

Native Capabilities:
  • get(key) - Retrieve cached value
  • set(key, value, ttl?) - Store value with optional TTL
  • has(key) - Check if key exists
  • delete(key) - Remove specific key
  • clear() - Clear all cached data
  • keys(pattern?) - List keys (with optional glob pattern)
  • size() - Get current cache size
  • stats() - Get performance statistics
  • cleanup() - Remove expired entries

Configuration:
  • Namespace: ${this.props.namespace}
  • Key Prefix: "${this.props.keyPrefix}"
  • Backend: ${this.props.backend.constructor.name}

Current State:
  • Size: ${this.props.backend.size()} entries
  • Created: ${this.props.created?.toISOString() || 'Unknown'}

Learned Capabilities: ${this._capabilities.size} total
${Array.from(this._capabilities.keys())
  .map((cap) => `  • ${cap}`)
  .join("\n")}
    `);
  }

  // Doctrine #9: ALWAYS TEACH (explicit capability binding)
  // Doctrine #19: CAPABILITY LEAKAGE PREVENTION (teach only native capabilities)
  teach(): TeachingContract {
    return {
      unitId: this.props.dna.id,
      capabilities: {
        // Native cache capabilities - wrapped for unknown[] compatibility
        get: ((...args: unknown[]) => this.get(args[0] as string)) as (...args: unknown[]) => unknown,
        set: ((...args: unknown[]) => this.set(args[0] as string, args[1] as unknown, args[2] as number | undefined)) as (...args: unknown[]) => unknown,
        has: ((...args: unknown[]) => this.has(args[0] as string)) as (...args: unknown[]) => unknown,
        delete: ((...args: unknown[]) => this.delete(args[0] as string)) as (...args: unknown[]) => unknown,
        clear: ((...args: unknown[]) => this.clear()) as (...args: unknown[]) => unknown,
        keys: ((...args: unknown[]) => this.keys(args[0] as string | undefined)) as (...args: unknown[]) => unknown,
        size: ((...args: unknown[]) => this.size()) as (...args: unknown[]) => unknown,
        stats: ((...args: unknown[]) => this.stats()) as (...args: unknown[]) => unknown,
        cleanup: ((...args: unknown[]) => this.cleanup()) as (...args: unknown[]) => unknown,
      }
    };
  }

  // ==========================================
  // NATIVE CACHE OPERATIONS
  // ==========================================

  /**
   * Retrieve cached value
   * Doctrine #20: GRACEFUL DEGRADATION (baseline functionality)
   */
  get<T = unknown>(key: string): T | null {
    const prefixedKey = this.prefixKey(key);
    return this.props.backend.get<T>(prefixedKey);
  }

  /**
   * Store value with optional TTL
   */
  set<T = unknown>(key: string, value: T, ttl?: number): void {
    const prefixedKey = this.prefixKey(key);
    this.props.backend.set(prefixedKey, value, ttl);
  }

  /**
   * Check if key exists
   */
  has(key: string): boolean {
    const prefixedKey = this.prefixKey(key);
    return this.props.backend.has(prefixedKey);
  }

  /**
   * Remove specific key
   */
  delete(key: string): boolean {
    const prefixedKey = this.prefixKey(key);
    return this.props.backend.delete(prefixedKey);
  }

  /**
   * Clear all cached data (respects prefix)
   */
  clear(): void {
    // If we have a prefix, only clear our keys
    if (this.props.keyPrefix) {
      const pattern = `${this.props.keyPrefix}*`;
      const keys = this.props.backend.keys(pattern);
      for (const key of keys) {
        this.props.backend.delete(key);
      }
    } else {
      this.props.backend.clear();
    }
  }

  /**
   * List keys with optional glob pattern
   */
  keys(pattern?: string): string[] {
    const searchPattern = pattern 
      ? `${this.props.keyPrefix}${pattern}`
      : `${this.props.keyPrefix}*`;
    
    const prefixedKeys = this.props.backend.keys(searchPattern);
    
    // Remove prefix from returned keys
    if (this.props.keyPrefix) {
      return prefixedKeys.map(key => key.slice(this.props.keyPrefix.length));
    }
    
    return prefixedKeys;
  }

  /**
   * Get current cache size
   */
  size(): number {
    if (!this.props.keyPrefix) {
      return this.props.backend.size();
    }
    
    // Count only our prefixed keys
    const ourKeys = this.props.backend.keys(`${this.props.keyPrefix}*`);
    return ourKeys.length;
  }

  /**
   * Get performance statistics
   */
  stats(): CacheStats {
    return this.props.backend.stats();
  }

  /**
   * Remove expired entries
   */
  cleanup(): number {
    return this.props.backend.cleanup();
  }

  // ==========================================
  // BATCH OPERATIONS (CONVENIENCE METHODS)
  // ==========================================

  /**
   * Get multiple keys at once
   */
  getMany<T = unknown>(keys: string[]): Record<string, T | null> {
    const result: Record<string, T | null> = {};
    
    for (const key of keys) {
      result[key] = this.get<T>(key);
    }
    
    return result;
  }

  /**
   * Set multiple key-value pairs
   */
  setMany<T = unknown>(entries: Record<string, T>, ttl?: number): void {
    for (const [key, value] of Object.entries(entries)) {
      this.set(key, value, ttl);
    }
  }

  /**
   * Delete multiple keys
   */
  deleteMany(keys: string[]): Record<string, boolean> {
    const result: Record<string, boolean> = {};
    
    for (const key of keys) {
      result[key] = this.delete(key);
    }
    
    return result;
  }

  /**
   * Increment a numeric value
   */
  increment(key: string, delta = 1): number {
    const current = this.get<number>(key) ?? 0;
    const newValue = current + delta;
    this.set(key, newValue);
    return newValue;
  }

  /**
   * Decrement a numeric value
   */
  decrement(key: string, delta = 1): number {
    return this.increment(key, -delta);
  }

  /**
   * Get or set pattern - retrieve value or set if not exists
   */
  getOrSet<T = unknown>(key: string, factory: () => T, ttl?: number): T {
    const existing = this.get<T>(key);
    if (existing !== null) {
      return existing;
    }
    
    const value = factory();
    this.set(key, value, ttl);
    return value;
  }

  // ==========================================
  // ACCESSOR METHODS
  // ==========================================

  /**
   * Get namespace
   */
  get namespace(): string {
    return this.props.namespace;
  }

  /**
   * Get key prefix
   */
  get keyPrefix(): string {
    return this.props.keyPrefix;
  }

  /**
   * Get backend name
   */
  get backendName(): string {
    return this.props.backend.constructor.name;
  }

  // ==========================================
  // PRIVATE HELPER METHODS
  // ==========================================

  /**
   * Add prefix to key if configured
   */
  private prefixKey(key: string): string {
    return this.props.keyPrefix ? `${this.props.keyPrefix}${key}` : key;
  }
}

// Export everything for external use
export { MemoryCache };
export type { 
  ICache, 
  CacheEntry, 
  CacheStats 
} from './cache.interface.js';
export type { 
  MemoryCacheConfig 
} from './memory.js';
