# AdonisJS Dependency Injection - LLM Reference

> Optimized for AI coding agents. For human-readable docs, see the full guide.

## Overview

Dependency injection eliminates manual creation of class dependencies. The IoC container automatically resolves constructor/method dependencies when you type-hint classes.

**Key principle**: Declare dependencies as parameters, let the container resolve them automatically.

**Integrated in**: Controllers, middleware, event listeners, Ace commands, bouncer policies.

**Requires**: TypeScript `experimentalDecorators` and `emitDecoratorMetadata` (pre-configured in AdonisJS).

## Basic Dependency Injection

### Create Service

```ts
// app/services/avatar_service.ts
import User from '#models/user'
import { createHash } from 'node:crypto'

export class AvatarService {
  protected getGravatarAvatar(user: User) {
    const emailHash = createHash('md5').update(user.email).digest('hex')
    const url = new URL(emailHash, 'https://gravatar.com/avatar/')
    url.searchParams.set('size', '200')
    return url.toString()
  }

  getAvatarFor(user: User) {
    return this.getGravatarAvatar(user)
  }
}
```

### Constructor Injection

```ts
// app/controllers/users_controller.ts
import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import { AvatarService } from '#services/avatar_service'
import User from '#models/user'

@inject()  // Required decorator
export default class UsersController {
  constructor(protected avatarService: AvatarService) {}

  async store({ request }: HttpContext) {
    const user = await User.create(request.only(['email', 'username']))
    const avatarUrl = this.avatarService.getAvatarFor(user)
    user.avatarUrl = avatarUrl
    await user.save()
    return user
  }
}
```

### Method Injection

```ts
// app/controllers/users_controller.ts
import { inject } from '@adonisjs/core'
import { HttpContext } from '@adonisjs/core/http'
import { AvatarService } from '#services/avatar_service'

export default class UsersController {
  @inject()  // Decorator on method
  async store({ request }: HttpContext, avatarService: AvatarService) {
    const user = await User.create(request.only(['email', 'username']))
    const avatarUrl = avatarService.getAvatarFor(user)
    user.avatarUrl = avatarUrl
    await user.save()
    return user
  }
}
```

**Important**: HttpContext always first parameter, followed by injected dependencies.

## Framework Support Matrix

| Class Type | Constructor Injection | Method Injection |
|---|---|---|
| Controllers | ✓ | ✓ (all methods) |
| Middleware | ✓ | ✗ |
| Event listeners | ✓ | ✓ (`handle` method only) |
| Ace commands | ✗ | ✓ (`prepare`, `interact`, `run`, `completed`) |
| Bouncer policies | ✓ | ✗ |

## Manual Container Usage

### container.make - Construct Classes

```ts
import app from '@adonisjs/core/services/app'
import { UserService } from '#services/user_service'

// Construct with auto-resolved dependencies
const userService = await app.container.make(UserService)
```

Example with dependency:

```ts
// app/services/user_service.ts
import { inject } from '@adonisjs/core'

class LoggerService {
  log(message: string) {
    console.log(message)
  }
}

@inject()
export class UserService {
  constructor(public logger: LoggerService) {}

  createUser(data: any) {
    this.logger.log('Creating user...')
  }
}
```

```ts
// Usage
import app from '@adonisjs/core/services/app'
import { UserService } from '#services/user_service'

const userService = await app.container.make(UserService)
// LoggerService automatically resolved and injected
```

### container.call - Inject Method Parameters

```ts
// app/services/notification_service.ts
import { inject } from '@adonisjs/core'

class EmailService {
  send(to: string, message: string) {
    console.log(`Sending email to ${to}`)
  }
}

export class NotificationService {
  @inject()
  notify(userId: string, message: string, emailService: EmailService) {
    emailService.send(`user-${userId}@example.com`, message)
  }
}
```

```ts
// Usage
import app from '@adonisjs/core/services/app'
import { NotificationService } from '#services/notification_service'

const notificationService = await app.container.make(NotificationService)

await app.container.call(
  notificationService,
  'notify',
  ['user-123', 'Welcome!']  // Runtime values first, then auto-resolved deps
)
```

## Bindings

Use bindings when classes need dependencies that cannot be auto-resolved (config objects, primitives).

### Basic Binding

```ts
// app/services/cache.ts
export type CacheConfig = {
  ttl: string | number
  grace: boolean
}

export class Cache {
  constructor(
    public store: RedisConnection,
    public config: CacheConfig
  ) {}

  async get(key: string) {}
  async set(key: string, value: any) {}
}
```

```ts
// providers/cache_provider.ts
import type { ApplicationService } from '@adonisjs/core/types'
import redis from '@adonisjs/redis/services/main'
import { Cache } from '#services/cache'

export default class CacheProvider {
  constructor(protected app: ApplicationService) {}

  register() {
    this.app.container.bind(Cache, async (resolver) => {
      const store = redis.connection()
      const config = this.app.config.get<CacheConfig>('cache')
      return new Cache(store, config)
    })
  }
}
```

### Singletons

Created once, cached, reused:

```ts
// providers/cache_provider.ts
register() {
  this.app.container.singleton(Cache, async (resolver) => {
    const store = redis.connection()
    const config = this.app.config.get<CacheConfig>('cache')
    return new Cache(store, config)
  })
}
```

Every `app.container.make(Cache)` returns the same instance.

### Aliases

String-based names for bindings:

```ts
// providers/cache_provider.ts
register() {
  this.app.container.singleton(Cache, async (resolver) => {
    const store = redis.connection()
    const config = this.app.config.get<CacheConfig>('cache')
    return new Cache(store, config)
  })

  this.app.container.alias('cache', Cache)
}
```

```ts
// Usage
const cache = await app.container.make('cache')
```

**Type safety with declaration merging**:

```ts
// providers/cache_provider.ts
import { Cache } from '#services/cache'

declare module '@adonisjs/core/types' {
  interface ContainerBindings {
    cache: Cache
  }
}
```

Now `app.container.make('cache')` has proper TypeScript types.

## Request-Scoped Bindings

Register bindings that exist only for a specific HTTP request.

```ts
// app/middleware/container_bindings_middleware.ts
import { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import { Logger } from '@adonisjs/core/logger'

export default class ContainerBindingsMiddleware {
  handle(ctx: HttpContext, next: NextFn) {
    // Register HttpContext for this request
    ctx.containerResolver.bindValue(HttpContext, ctx)

    // Register request-specific logger
    ctx.containerResolver.bindValue(Logger, ctx.logger)

    return next()
  }
}
```

Any class resolving `HttpContext` or `Logger` during this request gets these exact instances.

**Warning**: Request-scoped bindings only available during HTTP requests. Will fail in commands/jobs.

## Runtime Values with DI

Pass runtime values alongside auto-injected dependencies:

```ts
// app/services/user_service.ts
import { inject } from '@adonisjs/core'

class EchoService {
  echo(message: string) {
    console.log(message)
  }
}

@inject()
export class UserService {
  constructor(
    public config: { softDeletes: boolean },  // Runtime value
    public echo: EchoService                   // Auto-resolved
  ) {}

  @inject()
  notify(message: string, echoService: EchoService) {
    echoService.echo(message)
  }
}
```

```ts
// Usage
import app from '@adonisjs/core/services/app'
import { UserService } from '#services/user_service'

// Runtime values as second argument
const userService = await app.container.make(
  UserService,
  [{ softDeletes: true }]  // Fills first constructor param
)

// Runtime values for method calls
await app.container.call(
  userService,
  'notify',
  ['User created with id 1']  // Fills first method param
)
```

Runtime values fill parameters positionally, then container auto-resolves remaining.

## Abstract Classes (Adapter Pattern)

Use abstract classes for polymorphic behavior (interfaces are erased at runtime).

### Define Abstract Class

```ts
// app/services/payment_service.ts
export default abstract class PaymentService {
  abstract charge(amount: number): Promise<void>
  abstract refund(amount: number): Promise<void>
}
```

### Implement Providers

```ts
// app/services/stripe_provider.ts
import PaymentService from './payment_service.js'

export default class StripeProvider implements PaymentService {
  async charge(amount: number) {
    console.log(`Charging ${amount} via Stripe`)
  }

  async refund(amount: number) {
    console.log(`Refunding ${amount} via Stripe`)
  }
}
```

```ts
// app/services/paypal_provider.ts
import PaymentService from './payment_service.js'

export default class PaypalProvider implements PaymentService {
  async charge(amount: number) {
    console.log(`Charging ${amount} via PayPal`)
  }

  async refund(amount: number) {
    console.log(`Refunding ${amount} via PayPal`)
  }
}
```

### Bind Implementation

```ts
// providers/app_provider.ts
import PaymentService from '#services/payment_service'
import StripeProvider from '#services/stripe_provider'

export default class AppProvider {
  constructor(protected app: ApplicationService) {}

  register() {
    this.app.container.bind(PaymentService, () => {
      return new StripeProvider()
    })
  }
}
```

### Use in Controller

```ts
// app/controllers/checkout_controller.ts
import { inject } from '@adonisjs/core'
import { HttpContext } from '@adonisjs/core/http'
import PaymentService from '#services/payment_service'

export default class CheckoutController {
  @inject()
  async store({ request }: HttpContext, paymentService: PaymentService) {
    const amount = request.input('amount')
    await paymentService.charge(amount)  // Uses StripeProvider
    return { success: true }
  }
}
```

Swap providers by changing single binding.

## Contextual Dependencies

Inject different implementations based on consuming class:

```ts
// app/services/user_service.ts
import { inject } from '@adonisjs/core'
import { Disk } from '@adonisjs/drive'

@inject()
export default class UserService {
  constructor(protected disk: Disk) {}  // Will receive R2 disk

  async uploadAvatar(file: MultipartFile) {
    await this.disk.put(`avatars/${file.clientName}`, file)
  }
}
```

```ts
// app/services/post_service.ts
import { inject } from '@adonisjs/core'
import { Disk } from '@adonisjs/drive'

@inject()
export default class PostService {
  constructor(protected disk: Disk) {}  // Will receive S3 disk

  async uploadImage(file: MultipartFile) {
    await this.disk.put(`posts/${file.clientName}`, file)
  }
}
```

```ts
// providers/app_provider.ts
import { Disk } from '@adonisjs/drive'
import UserService from '#services/user_service'
import PostService from '#services/post_service'

export default class AppProvider {
  constructor(protected app: ApplicationService) {}

  register() {
    // UserService gets R2
    this.app.container
      .when(UserService)
      .asksFor(Disk)
      .provide(async (resolver) => {
        const driveManager = await resolver.make('drive.manager')
        return driveManager.use('r2')
      })

    // PostService gets S3
    this.app.container
      .when(PostService)
      .asksFor(Disk)
      .provide(async (resolver) => {
        const driveManager = await resolver.make('drive.manager')
        return driveManager.use('s3')
      })
  }
}
```

## Testing: Swapping Dependencies

Replace bindings with fakes during tests:

```ts
// tests/functional/users/list.spec.ts
import { test } from '@japa/runner'
import app from '@adonisjs/core/services/app'
import UserService from '#services/user_service'

test('get all users', async ({ client, cleanup }) => {
  // Create fake implementation
  class FakeUserService extends UserService {
    all() {
      return [
        { id: 1, username: 'virk', email: 'virk@adonisjs.com' },
        { id: 2, username: 'romain', email: 'romain@adonisjs.com' }
      ]
    }
  }

  // Swap binding
  app.container.swap(UserService, () => {
    return new FakeUserService()
  })

  // Restore after test
  cleanup(() => app.container.restore(UserService))

  const response = await client.get('/users')

  response.assertStatus(200)
  response.assertBodyContains({
    users: [
      { username: 'virk' },
      { username: 'romain' }
    ]
  })
})
```

## Container Events

Listen to binding resolution:

```ts
// start/events.ts
import emitter from '@adonisjs/core/services/emitter'

emitter.on('container_binding:resolved', (event) => {
  console.log('Resolved binding:', event.binding)  // Class constructor or string alias
  console.log('Instance:', event.value)            // Created instance
})
```

Fires for every resolution, including nested dependencies.

## Common Errors

### Error: Dependency is undefined

**Cause**: Missing `@inject()` decorator
**Fix**: Add `@inject()` above class/method

```ts
// Wrong
export default class UsersController {
  constructor(protected service: AvatarService) {}  // undefined
}

// Correct
@inject()
export default class UsersController {
  constructor(protected service: AvatarService) {}  // resolved
}
```

### Error: Cannot inject interfaces/types

**Cause**: Interfaces/types don't exist at runtime
**Fix**: Inject concrete classes or abstract classes

```ts
// Wrong
import type { MyService } from '#services/my_service'  // import type
@inject()
constructor(protected service: MyService) {}  // undefined

// Correct
import { MyService } from '#services/my_service'  // import value
@inject()
constructor(protected service: MyService) {}  // resolved
```

### Error: Circular dependencies

**Cause**: Class A depends on Class B, which depends on Class A
**Fix**: Refactor to break circular dependency
- Extract shared logic into third service
- Use events/callbacks instead
- Reconsider class responsibilities

## Quick Reference

### Key Methods
- `app.container.make(Class)` - Construct class with DI
- `app.container.call(instance, method, runtimeValues)` - Call method with DI
- `app.container.bind(Class, factory)` - Register binding
- `app.container.singleton(Class, factory)` - Register singleton
- `app.container.alias(name, Class)` - Create string alias
- `app.container.swap(Class, factory)` - Swap for testing
- `app.container.restore(Class)` - Restore original binding

### Decorators
- `@inject()` - Enable DI on class or method

### Type Hints
Only inject concrete classes (not interfaces/types).

## Important Notes

- Always use `@inject()` decorator for DI
- Interfaces/types cannot be injected (runtime erasure)
- Check imports: `import type` prevents runtime resolution
- Circular dependencies not supported
- Request-scoped bindings only work during HTTP requests
- Runtime values fill parameters positionally
