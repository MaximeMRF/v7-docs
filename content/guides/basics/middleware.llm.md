# Middleware in AdonisJS

## Overview
Middleware are functions that execute during HTTP requests before reaching route handlers. They can terminate requests or forward them using the next method. Used for cross-cutting concerns like authentication, logging, and request parsing.

## Three Middleware Stacks

### Server Middleware Stack
- Executes for every HTTP request (even when no route matches)
- Runs before the router attempts to find a matching route
- Use for: logging, CORS, security headers

### Router Middleware Stack
- Executes only when a matching route is found
- Runs after route matching but before named middleware and handlers
- Use for: loading shared data, parsing request bodies

### Named Middleware Collection
- Applied explicitly to individual routes or route groups
- Can accept parameters for per-route customization
- Use for: role-based authorization, rate limiting, feature flags

## Creating Middleware

Generate middleware using:
```bash
node ace make:middleware LogRequests
```

Creates: app/middleware/log_requests_middleware.ts

Basic structure:
```typescript
import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

export default class LogRequestsMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    // Logic before request handler
    await next()
    // Logic after request handler
  }
}
```

## Registering Middleware

Server middleware (start/kernel.ts):
```typescript
import server from '@adonisjs/core/services/server'

server.use([
  () => import('#middleware/log_requests_middleware'),
  () => import('#middleware/container_bindings_middleware'),
])
```

Named middleware (start/kernel.ts):
```typescript
import router from '@adonisjs/core/services/router'

export const middleware = router.named({
  auth: () => import('#middleware/auth_middleware'),
  authorize: () => import('#middleware/authorize_request_middleware'),
})
```

Apply to routes:
```typescript
import { middleware } from '#start/kernel'

router
  .get('/admin', handler)
  .use(middleware.auth())
```

## Named Middleware with Parameters

Middleware can accept a third parameter for options:
```typescript
export default class AuthorizeRequestMiddleware {
  async handle(ctx: HttpContext, next: NextFn, options: AuthorizationOptions) {
    const user = ctx.auth.getUserOrFail()

    if ('role' in options && user.role !== options.role) {
      return ctx.response.unauthorized('Not authorized')
    }

    await next()
  }
}
```

Usage:
```typescript
router
  .get('/admin/reports', handler)
  .use(middleware.authorize({ role: 'admin' }))
```

## Dependency Injection

Middleware support constructor injection:
```typescript
import { inject } from '@adonisjs/core'

@inject()
export default class RateLimitMiddleware {
  constructor(protected rateLimitService: RateLimitService) {}

  async handle(ctx: HttpContext, next: NextFn) {
    const isAllowed = await this.rateLimitService.checkLimit(ctx.request.ip())
    if (!isAllowed) {
      return ctx.response.tooManyRequests('Rate limit exceeded')
    }
    await next()
  }
}
```

## Execution Flow

Middleware execute in two phases:

Downstream phase (before await next()):
Server middleware → Router middleware → Named middleware → Route handler

Upstream phase (after await next()):
Route handler → Named middleware → Router middleware → Server middleware

## Modifying Response

Add headers after response is ready:
```typescript
export default class AddHeadersMiddleware {
  async handle({ response }: HttpContext, next: NextFn) {
    await next()
    response.header('X-Powered-By', 'AdonisJS')
  }
}
```

Transform response body:
```typescript
export default class WrapResponseMiddleware {
  async handle({ response }: HttpContext, next: NextFn) {
    await next()
    const body = response.getBody()
    response.send({
      success: true,
      data: body,
      timestamp: new Date().toISOString()
    })
  }
}
```

## Exception Handling

Exceptions thrown in middleware are caught by global exception handler. Upstream flow continues for middleware that already executed in downstream phase.

```typescript
export default class ValidateApiKeyMiddleware {
  async handle({ request }: HttpContext, next: NextFn) {
    const apiKey = request.header('X-API-Key')
    if (!apiKey) {
      throw new errors.E_UNAUTHORIZED_ACCESS('API key is required')
    }
    await next()
  }
}
```

## Conditional Execution

Use configuration to control middleware execution at runtime:
```typescript
export default class RateLimitMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    if (!featuresConfig.enableRateLimit) {
      return next()
    }
    // Apply rate limiting logic
    await next()
  }
}
```

## Extending HttpContext

Middleware can add properties to HttpContext:
```typescript
export default class DetectTenantMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const tenant = await this.detectTenant(ctx)
    ctx.tenant = tenant
    await next()
  }
}
```

Augment TypeScript interface (types/http.ts):
```typescript
declare module '@adonisjs/core/http' {
  interface HttpContext {
    tenant: {
      id: number
      name: string
    }
  }
}
```

Note: Only augment HttpContext for server or router middleware that run broadly. Named middleware properties won't exist on routes where the middleware doesn't execute.
