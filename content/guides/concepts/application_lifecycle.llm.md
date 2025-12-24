# Application Lifecycle

> AdonisJS application lifecycle has three phases: boot, start, and termination. Hook into these phases using service providers and preload files.

## Lifecycle Phases

**Boot Phase**
- Service providers register bindings and execute boot() methods
- Framework configuration happens here
- No preload files loaded yet
- Application not ready for requests

**Start Phase**
- Preload files imported
- Service providers execute start() and ready() methods
- Routes registered, event listeners attached
- Application becomes operational

**Termination Phase**
- Triggered by SIGTERM signal
- Service providers execute shutdown() methods
- Cleanup: close connections, flush logs, cancel jobs

## Hooking into Boot Phase

Use service provider boot() method to extend framework:

```typescript
// providers/app_provider.ts
import { VineString } from '@vinejs/vine'
import type { ApplicationService } from '@adonisjs/core/types'

export default class AppProvider {
  constructor(protected app: ApplicationService) {}

  async boot() {
    VineString.macro('phoneNumber', function (this: VineString) {
      return this.use((value, field) => {
        if (typeof value !== 'string') return
        if (!/^\d{10}$/.test(value)) {
          field.report('The {{ field }} must be a valid 10-digit phone number', field)
        }
      })
    })
  }
}
```

## Hooking into Start Phase

**Option 1: Service Provider Methods**

```typescript
// providers/app_provider.ts
export default class AppProvider {
  async start() {
    const database = await this.app.container.make('lucid.db')
    await database.connection().select(1)
  }

  async ready() {
    if (this.app.getEnvironment() === 'web') {
      const logger = await this.app.container.make('logger')
      logger.info('HTTP server is ready to accept requests')
    }
  }
}
```

**Option 2: Preload Files**

Create preload file:
```sh
node ace make:preload events
```

Configure environment-specific loading:
```typescript
// adonisrc.ts
{
  preloads: [
    () => import('#start/routes'),
    {
      file: () => import('#start/events'),
      environment: ['web', 'console'] // 'web' | 'console' | 'test' | 'repl'
    }
  ]
}
```

Example preload file:
```typescript
// start/events.ts
import emitter from '@adonisjs/core/services/emitter'

emitter.on('user:registered', function (user) {
  logger.info({ userId: user.id }, 'New user registered')
})
```

## Hooking into Termination Phase

Use service provider shutdown() method:

```typescript
// providers/app_provider.ts
export default class AppProvider {
  async shutdown() {
    const redis = await this.app.container.make('redis')
    await redis.quit()
  }
}
```

## Service Provider Lifecycle Methods

- register() - Register bindings into container
- boot() - Extend framework, configure services
- start() - Execute after boot, before ready
- ready() - Execute when application fully started
- shutdown() - Cleanup during graceful shutdown
