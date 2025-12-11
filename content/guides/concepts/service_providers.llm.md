# AdonisJS Service Providers - LLM Reference

> Optimized for AI coding agents. For human-readable docs, see the full guide.

## Overview

Service providers are JavaScript classes with lifecycle hooks executed during application boot, start, ready, and shutdown. They enable centralized initialization logic for registering IoC container bindings, extending framework classes, and managing application lifecycle.

**Key principle**: Execute code at predictable points in application lifetime without modifying core framework code.

**Use cases**: Register container bindings, extend framework with macros, register Edge helpers, close database connections on shutdown, run post-startup actions.

## Registration

### adonisrc.ts Configuration

```ts
// adonisrc.ts
import { defineConfig } from '@adonisjs/core/app'

export default defineConfig({
  providers: [
    () => import('@adonisjs/core/providers/app_provider'),
    () => import('@adonisjs/core/providers/hash_provider'),
    {
      file: () => import('@adonisjs/core/providers/repl_provider'),
      environment: ['repl', 'test'],  // Restrict to specific environments
    },
    () => import('@adonisjs/core/providers/http_provider'),
  ],
})
```

**Execution**: Providers run in array order. Environment restrictions: `web` (HTTP), `console` (Ace), `repl`, `test`.

## Creating a Provider

### Generate Provider

```bash
node ace make:provider cache
# Creates: providers/cache_provider.ts
# Auto-registers in adonisrc.ts
```

### Basic Structure

```ts
// providers/cache_provider.ts
import type { ApplicationService } from '@adonisjs/core/types'

export default class CacheProvider {
  constructor(protected app: ApplicationService) {}

  register() {}           // Synchronous - register container bindings
  async boot() {}        // Async - extend framework, configure services
  async start() {}       // Async - runs before HTTP server starts
  async ready() {}       // Async - runs after HTTP server ready
  async shutdown() {}    // Async - cleanup during graceful shutdown
}
```

### Example: Register Container Binding

```ts
// providers/cache_provider.ts
import type { ApplicationService } from '@adonisjs/core/types'

class Cache {
  get(key: string) { return null }
  set(key: string, value: any) {}
}

export default class CacheProvider {
  constructor(protected app: ApplicationService) {}

  register() {
    this.app.container.bind('cache', () => {
      return new Cache()
    })
  }
}
```

### Using Registered Service

```ts
// app/controllers/posts_controller.ts
import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

export default class PostsController {
  @inject()
  constructor(protected cache: any) {}

  async index({ response }: HttpContext) {
    const cachedPosts = this.cache.get('posts')
    if (cachedPosts) return response.json(cachedPosts)
    return response.json([])
  }
}
```

## Lifecycle Hooks

### register() - Synchronous

Called immediately when provider imported. Use for container bindings only.

```ts
register() {
  this.app.container.singleton('database', () => {
    return new Database(this.app.config.get('database'))
  })
}
```

**Rules**:
- Must be synchronous
- Only register container bindings
- Don't resolve bindings or perform I/O
- Don't access framework services

### boot() - Asynchronous

Runs after all providers registered. Container fully populated - safe to resolve bindings.

```ts
async boot() {
  // Extend framework with macros
  Response.macro('apiSuccess', function (data: any) {
    return this.json({ success: true, data })
  })
}
```

**Use for**:
- Extending framework classes with macros
- Configuring validators with custom rules
- Registering Edge template helpers
- Setup depending on other bindings

### start() - Asynchronous

Runs before HTTP server starts (web) or before Ace command executes (console). Preload files import after this hook.

```ts
async start() {
  // Load routes from database
  const dynamicRoutes = await this.loadRoutesFromDatabase()

  dynamicRoutes.forEach((route) => {
    router.get(route.path, route.handler)
  })
}
```

**Use for**:
- Registering routes
- Warming caches
- Health checks on external services
- Pre-startup operations

### ready() - Asynchronous

Runs after HTTP server accepting connections (web) or before command's `run()` method (console).

```ts
async ready() {
  if (this.app.getEnvironment() === 'web') {
    const httpServer = await this.app.container.make('server')

    const io = new Server(httpServer, {
      cors: { origin: '*' }
    })

    this.app.container.singleton('websocket', () => io)

    io.on('connection', (socket) => {
      console.log('Client connected:', socket.id)
    })
  }
}
```

**Use for**:
- Integrating with running HTTP server (WebSockets)
- Post-startup notifications
- Final initialization requiring fully running app

### shutdown() - Asynchronous

Runs during graceful termination (SIGTERM signal).

```ts
async shutdown() {
  const database = await this.app.container.make('database')
  await database.closeAllConnections()
  console.log('Database connections closed')
}
```

**Use for**:
- Close database connections
- Flush pending logs
- Disconnect from Redis
- Close file handles
- Any cleanup for graceful termination

## Environment Restrictions

```ts
// adonisrc.ts
providers: [
  // Runs in all environments
  () => import('./providers/app_provider.js'),

  // Only in web environment
  {
    file: () => import('./providers/websocket_provider.js'),
    environment: ['web'],
  },

  // Web and console
  {
    file: () => import('./providers/cache_provider.js'),
    environment: ['web', 'console'],
  },

  // Test only
  {
    file: () => import('./providers/test_provider.js'),
    environment: ['test'],
  },
]
```

**Environments**: `web`, `console`, `repl`, `test`

## Common Patterns

### Pattern: Database Provider

```ts
export default class DatabaseProvider {
  constructor(protected app: ApplicationService) {}

  register() {
    this.app.container.singleton('database', () => {
      return new Database(this.app.config.get('database'))
    })
  }

  async shutdown() {
    const database = await this.app.container.make('database')
    await database.closeAllConnections()
  }
}
```

### Pattern: Framework Extension

```ts
export default class ResponseExtensionProvider {
  constructor(protected app: ApplicationService) {}

  async boot() {
    Response.macro('apiSuccess', function (data: any) {
      return this.json({ success: true, data })
    })

    Response.macro('apiError', function (message: string) {
      return this.json({ success: false, error: message })
    })
  }
}
```

### Pattern: WebSocket Provider (Environment-Specific)

```ts
export default class WebSocketProvider {
  constructor(protected app: ApplicationService) {}

  async ready() {
    if (this.app.getEnvironment() === 'web') {
      const httpServer = await this.app.container.make('server')
      const io = new Server(httpServer)
      this.app.container.singleton('websocket', () => io)
    }
  }
}
```

## Error Prevention

### Common Mistake: Async in register()

```ts
// Wrong - async work in register
register() {
  const something = await this.app.container.make('someService')
  this.app.container.bind('myService', () => {
    return new MyService(something)
  })
}

// Correct - async work inside binding callback
register() {
  this.app.container.bind('myService', async () => {
    const something = await this.app.container.make('someService')
    return new MyService(something)
  })
}
```

### Common Mistake: Wrong Environment

```ts
// Wrong - WebSocket provider runs everywhere
providers: [
  () => import('./providers/websocket_provider.js'),
]

// Correct - only in web environment
providers: [
  {
    file: () => import('./providers/websocket_provider.js'),
    environment: ['web'],
  },
]
```

## Quick Reference

### Lifecycle Order

1. **register()** - Synchronous, container binding registration
2. **boot()** - Async, container fully populated, extend framework
3. **start()** - Async, before server starts, before preload files
4. **ready()** - Async, after server ready, after preload files
5. **shutdown()** - Async, graceful termination cleanup

### Hook Selection Guide

| Need | Use Hook |
|------|----------|
| Register container binding | `register()` |
| Extend framework (macros) | `boot()` |
| Register routes dynamically | `start()` |
| Attach to HTTP server | `ready()` |
| Close connections | `shutdown()` |

### File Locations
- Providers: `providers/`
- Registration: `adonisrc.ts`
- Generate: `node ace make:provider <name>`

## Important Notes

- `register()` MUST be synchronous - perform async inside binding callbacks
- Providers execute in array order from `adonisrc.ts`
- Use environment restrictions to prevent unnecessary initialization
- All lifecycle methods are optional - implement only what you need
- Access to `this.app` for container and config
- Framework waits for all `shutdown()` hooks before exiting
