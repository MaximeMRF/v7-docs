# AdonisJS Application Lifecycle - LLM Reference

> Optimized for AI coding agents. For human-readable docs, see the full guide.

## Overview

Application lifecycle consists of three phases: **boot**, **start**, and **termination**. Each phase provides checkpoints for executing code at specific points during application runtime.

**Phases**:
1. **Boot** - Framework prepares, service providers register bindings
2. **Start** - Application comes alive, preload files import, routes register
3. **Termination** - Graceful shutdown, cleanup resources

**Use cases**: Register validation rules before startup, attach event listeners, close database connections on shutdown.

## Boot Phase

Initial stage where AdonisJS prepares the application. Service providers register bindings and execute `boot()` methods. Framework is configured but not yet handling requests.

**Timing**: Before preload files import, before application-specific code runs.

**Purpose**: Foundation-laying - assembles framework pieces.

**What happens**:
- Service providers imported
- `register()` methods called
- IoC container populated
- `boot()` methods executed

## Start Phase

Application becomes operational. Preload files import, `start()` and `ready()` methods execute.

**Timing**: After boot phase, when application ready to handle requests/commands.

**Purpose**: Application-specific initialization.

**What happens**:
- Preload files imported (parallel)
- Routes registered
- Event listeners attached
- Validation rules defined
- `start()` methods executed
- HTTP server starts (web environment)
- `ready()` methods executed

**Environment-aware**: Different behavior for `web`, `console`, `test`, `repl`.

## Termination Phase

Graceful shutdown when process receives `SIGTERM` signal.

**Timing**: During deployment, stopping dev server, process termination.

**Purpose**: Clean shutdown without data corruption.

**What happens**:
- Service providers execute `shutdown()` methods
- Database connections close
- Logs flush
- Background jobs cancel
- Resources cleanup

## Preload Files

TypeScript files in `start/` directory that run during start phase.

### Built-in Preload Files

```
start/routes.ts    # Register routes
start/kernel.ts    # Configure middleware
```

### Create Preload File

```bash
node ace make:preload events
# Creates: start/events.ts
# Auto-registers in adonisrc.ts
```

### Example: Register Event Listener

```ts
// start/events.ts
import emitter from '@adonisjs/core/services/emitter'

emitter.on('user:registered', function (user) {
  console.log(user)
})
```

### Configuration

```ts
// adonisrc.ts
{
  preloads: [
    () => import('#start/routes'),
    () => import('#start/kernel'),
    () => import('#start/events'),
  ]
}
```

### Environment-Specific Preloads

```ts
// adonisrc.ts
{
  preloads: [
    () => import('#start/routes'),
    () => import('#start/kernel'),
    {
      file: () => import('#start/events'),
      environment: ['web', 'console']  // Only in web and console
    },
    {
      file: () => import('#start/test_setup'),
      environment: ['test']  // Test only
    }
  ]
}
```

**Valid environments**: `web`, `console`, `repl`, `test`

**Execution**: All preload files import in parallel for optimal performance.

## Lifecycle with Service Providers

Service providers hook into all three phases:

```ts
// providers/example_provider.ts
import type { ApplicationService } from '@adonisjs/core/types'

export default class ExampleProvider {
  constructor(protected app: ApplicationService) {}

  // BOOT PHASE
  register() {
    // Register container bindings
    this.app.container.bind('service', () => new Service())
  }

  async boot() {
    // Extend framework, container fully populated
    Response.macro('customMethod', function() {})
  }

  // START PHASE
  async start() {
    // Runs before HTTP server starts
    // Runs before preload files import
    console.log('Starting...')
  }

  async ready() {
    // Runs after HTTP server ready
    // Runs after preload files import
    console.log('Ready!')
  }

  // TERMINATION PHASE
  async shutdown() {
    // Cleanup during graceful shutdown
    await closeConnections()
  }
}
```

## Common Patterns

### Pattern: Register Event Listeners

```ts
// start/events.ts
import emitter from '@adonisjs/core/services/emitter'

emitter.on('user:registered', async (user) => {
  // Send welcome email
})

emitter.on('order:placed', async (order) => {
  // Process order
})
```

### Pattern: Custom Validation Rules

```ts
// start/validation.ts
import vine from '@vinejs/vine'

vine.extend((vine) => {
  vine.rule('phone', (value, options, field) => {
    // Custom phone validation
  })
})
```

### Pattern: Environment-Specific Setup

```ts
// start/dev_tools.ts (only in web environment)
import router from '@adonisjs/core/services/router'

if (app.inDev) {
  router.get('/_debug', () => {
    return 'Debug information'
  })
}
```

```ts
// adonisrc.ts
{
  preloads: [
    {
      file: () => import('#start/dev_tools'),
      environment: ['web']
    }
  ]
}
```

## Quick Reference

### Phase Summary

| Phase | When | Purpose | Key Actions |
|-------|------|---------|-------------|
| Boot | First | Prepare framework | Register bindings, extend framework |
| Start | Second | Initialize app | Import preload files, register routes |
| Termination | Last | Cleanup | Close connections, flush logs |

### Execution Order

```
1. Service Providers: register()
2. Service Providers: boot()
3. Service Providers: start()
4. Preload Files: import (parallel)
5. HTTP Server: start (web environment)
6. Service Providers: ready()
---
[Application running]
---
7. Service Providers: shutdown()
```

### File Locations

- Preload files: `start/`
- Configuration: `adonisrc.ts`
- Service providers: `providers/`

### Commands

```bash
# Create preload file
node ace make:preload <name>

# Create service provider
node ace make:provider <name>
```

### Preload Configuration

```ts
// All environments
() => import('#start/routes')

// Specific environments
{
  file: () => import('#start/events'),
  environment: ['web', 'console']
}
```

### Valid Environments

- `web` - HTTP server
- `console` - Ace commands
- `repl` - REPL/interactive shell
- `test` - Test runner

## Use Case Guide

| Task | Solution |
|------|----------|
| Register routes | Preload file: `start/routes.ts` |
| Attach event listeners | Preload file: `start/events.ts` |
| Configure middleware | Preload file: `start/kernel.ts` |
| Register container bindings | Service provider: `register()` |
| Extend framework classes | Service provider: `boot()` |
| Integrate with HTTP server | Service provider: `ready()` |
| Close database connections | Service provider: `shutdown()` |
| Custom validation rules | Preload file in start phase |
| Development-only routes | Preload file with `environment: ['web']` |

## Important Notes

- Preload files import in parallel (performance optimization)
- Service providers execute in array order from `adonisrc.ts`
- Boot phase completes before preload files import
- Start phase happens before HTTP server accepts connections
- Termination phase waits for all `shutdown()` hooks to complete
- Use environment restrictions to prevent unnecessary initialization
- Preload files are for application setup, not business logic
