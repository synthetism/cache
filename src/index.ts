/**
 * Cache Package - Multi-backend caching with Unit Architecture v1.0.6
 * 
 * Export main cache unit and adapters for external consumption
 */

export { Cache } from './cache.js';
export { MemoryCache } from './memory.js';
export type { 
  ICache, 
  CacheEntry, 
  CacheStats 
} from './cache.interface.js';
export type { 
  CacheConfig,
  CacheProps
} from './cache.js';
export type { 
  MemoryCacheConfig 
} from './memory.js';
