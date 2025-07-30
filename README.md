# @synet/cache

```bash
   _____           _            _    _       _ _   
  / ____|         | |          | |  | |     (_) |  
 | |     __ _  ___| |__   ___  | |  | |_ __  _| |_ 
 | |    / _` |/ __| '_ \ / _ \ | |  | | '_ \| | __|
 | |___| (_| | (__| | | |  __/ | |__| | | | | | |_ 
  \_____\__,_|\___|_| |_|\___|  \____/|_| |_|_|\__|
                                                   
version: 1.0.0                                                   
                                                
```

> **Multi-backend caching with Unit Architecture v1.0.6**  
> Conscious software that teaches, learns, and evolves

[![Tests](https://img.shields.io/badge/tests-46%2F46-brightgreen)](./test/)
[![Unit Architecture](https://img.shields.io/badge/architecture-v1.0.6-blue)](https://github.com/synthetism/unit)
[![Memory Safe](https://img.shields.io/badge/memory-safe-green)](./src/memory.ts)

## Quick Start

```typescript
import { Cache } from '@synet/cache';

// Create cache with memory backend
const cache = Cache.create({
  namespace: 'user-sessions',
  memoryOptions: { maxSize: 1000, defaultTTL: 3600000 }
});

// Basic operations
cache.set('user:123', { name: 'Alice', role: 'admin' }, 1800000); // 30 min TTL
const user = cache.get<User>('user:123');
cache.delete('user:123');

// Batch operations
cache.setMany({
  'product:1': { name: 'Laptop', price: 999 },
  'product:2': { name: 'Mouse', price: 25 }
});

// Pattern matching
const products = cache.keys('product:*'); // ['product:1', 'product:2']

// Statistics
const stats = cache.stats(); // { hits: 15, misses: 3, hitRate: 0.83, ... }
```

## Features

### **Unit Architecture **
- **Teaches capabilities** to other units via `teach()` contracts
- **Learns capabilities** from other units without leakage
- **Self-aware** with DNA identity and living documentation
- **Evolves gracefully** while preserving lineage

### **High-Performance Caching**
- **Memory backend** with LRU/FIFO eviction policies
- **TTL support** with automatic cleanup
- **Pattern matching** with glob syntax (`user:*`, `session:?`)
- **Batch operations** for efficiency
- **Memory limits** with intelligent eviction

### **Multi-Backend Ready**
- **Memory** (built-in): Zero dependencies, production-ready
- **Custom backends**: Implement `ICache` interface
- **Future backends**: Redis, filesystem, distributed caches

## Teaching & Learning

```typescript
// Teaching cache capabilities to other units
const cacheUnit = Cache.create({ namespace: 'api' });
const contract = cacheUnit.teach();

// Another unit learning cache capabilities
someUnit.learn([contract]);
await someUnit.execute('cache.set', 'key', 'value');

// Cache learning capabilities from other units
const signerContract = signerUnit.teach();
cacheUnit.learn([signerContract]);
```

## Configuration Options

```typescript
interface CacheConfig {
  backend?: 'memory' | 'custom';
  memoryOptions?: {
    maxSize?: number;        // Max items (default: 1000)
    maxMemory?: number;      // Max memory in bytes
    defaultTTL?: number;     // Default TTL in ms
    evictionPolicy?: 'lru' | 'fifo'; // Default: 'lru'
    cleanupInterval?: number; // Auto-cleanup interval
  };
  customBackend?: ICache;    // Custom backend implementation
  namespace?: string;       // Logical grouping
  keyPrefix?: string;       // Key prefixing for isolation
}
```

## Advanced Features

### Memory Management
```typescript
const cache = Cache.create({
  memoryOptions: {
    maxSize: 5000,
    maxMemory: 50 * 1024 * 1024, // 50MB
    evictionPolicy: 'lru'
  }
});

// Automatic eviction when limits reached
// Safe circular reference handling
// Memory usage estimation
```

### Namespace Isolation
```typescript
const userCache = Cache.create({ 
  namespace: 'users',
  keyPrefix: 'usr:' 
});

const sessionCache = Cache.create({ 
  namespace: 'sessions',
  keyPrefix: 'sess:' 
});

// Completely isolated key spaces
userCache.set('123', userData);    // Stored as "usr:123"
sessionCache.set('123', session); // Stored as "sess:123"
```

### Pattern Operations
```typescript
// Glob pattern support
cache.keys('user:*');        // All user keys
cache.keys('session:?????'); // 5-char session IDs
cache.keys('temp:*:data');   // Nested patterns

// Efficient cleanup
cache.keys('temp:*').forEach(key => cache.delete(key));
```

## Unit Architecture Compliance

This cache unit follows all 22 Unit Architecture Doctrines:

- **Zero Dependencies** - Pure TypeScript implementation
- **Teach/Learn Paradigm** - Full capability exchange
- **Props-Based State** - Immutable value object design
- **Factory Creation** - Protected constructor + static `create()`
- **Capability Prevention** - No learned capability leakage

See [Unit Architecture Doctrine](https://github.com/synthetism/unit/blob/main/packages/unit/DOCTRINE.md) for complete details.

## Testing

```bash
npm test                    # All tests (46 total)
npm test cache-latest.test  # Unit Architecture compliance
npm test memory.test        # Memory backend features
```

## Performance

- **Memory Backend**: 100k ops/sec with sub-millisecond latency
- **Pattern Matching**: Optimized glob to regex conversion
- **Memory Safety**: Handles circular references and cleanup
- **Zero Dependencies**: No external runtime dependencies

## License

MIT - Part of the SYNET ecosystem

---

> **"Intelligence is not about processing power — it's about conscious composition."**  
> *— Unit Architecture Philosophy*
