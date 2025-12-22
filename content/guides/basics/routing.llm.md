# AdonisJS Routing - LLM Reference

> Optimized for AI coding agents. For human-readable docs, see the full guide.

## Overview

Routing connects HTTP requests to handlers. Routes define HTTP method, URI pattern, and handler (function or controller method).

**Components**: HTTP method + URI pattern + handler

**File location**: `start/routes.ts`

## Basic Routes

```ts
// start/routes.ts
import router from '@adonisjs/core/services/router'

// Static routes
router.get('/', () => 'Hello world')
router.get('/about', () => 'About page')
router.post('/users', async ({ request }) => {
  const data = request.all()
  return 'User created'
})

// Controller handler
const PostsController = () => import('#controllers/posts_controller')
router.get('/posts/:id', [PostsController, 'show'])
```

## Route Params

### Basic Params

```ts
router.get('/posts/:id', ({ params }) => {
  return `Post ${params.id}`  // params.id is string
})
```

### Multiple Params

```ts
router.get('/posts/:id/comments/:commentId', ({ params }) => {
  console.log(params.id)         // Post ID
  console.log(params.commentId)  // Comment ID
})
```

### Optional Params

```ts
router.get('/posts/:id?', ({ params }) => {
  if (!params.id) return 'All posts'
  return `Post ${params.id}`
})
// Matches: /posts and /posts/42
```

### Wildcard Params

```ts
router.get('/docs/:category/*', ({ params }) => {
  console.log(params.category)  // 'guides'
  console.log(params['*'])      // ['sql', 'orm', 'query-builder']
})
// /docs/guides/sql/orm/query-builder
```

## Param Validation

### Custom Matchers

```ts
router
  .get('/posts/:id', ({ params }) => {
    console.log(typeof params.id)  // 'number'
    console.log(params.id)         // 42 (not "42")
  })
  .where('id', {
    match: /^[0-9]+$/,              // Validation regex
    cast: (value) => Number(value), // Type casting
  })
```

### Built-in Matchers

```ts
// Numeric IDs
router
  .get('/posts/:id', ({ params }) => {})
  .where('id', router.matchers.number())

// UUIDs
router
  .get('/users/:userId', ({ params }) => {})
  .where('userId', router.matchers.uuid())

// Slugs (URL-safe strings)
router
  .get('/articles/:slug', ({ params }) => {})
  .where('slug', router.matchers.slug())
```

| Matcher | Validates | Casts To | Pattern |
|---------|-----------|----------|---------|
| `number()` | Digits only | `number` | `/^\d+$/` |
| `uuid()` | UUID v4 format | `string` | UUID regex |
| `slug()` | URL-safe | `string` | `/^[a-z0-9-_]+$/` |

### Global Matchers

```ts
// Apply to all :id params
router.where('id', router.matchers.uuid())

router.get('/posts/:id', () => {})  // Inherits UUID matcher
router.get('/users/:id', () => {})  // Inherits UUID matcher

// Override for specific route
router
  .get('/categories/:id', () => {})
  .where('id', router.matchers.number())  // Override with number
```

## HTTP Methods

```ts
router.get('/users', () => {})           // List
router.post('/users', () => {})          // Create
router.put('/users/:id', () => {})       // Replace
router.patch('/users/:id', () => {})     // Update
router.delete('/users/:id', () => {})    // Delete
```

### Multiple Methods

```ts
router.any('/reports', () => {})  // All HTTP methods
router.route('/api', ['GET', 'POST'], () => {})  // Specific methods
```

## Route Middleware

```ts
import { middleware } from '#start/kernel'

router
  .get('/posts', () => 'All posts')
  .use(middleware.auth())

// Inline middleware
router
  .get('/posts', () => 'All posts')
  .use((ctx, next) => {
    console.log('Middleware')
    return next()
  })
```

## Named Routes

```ts
router.get('/users', () => {}).as('users.index')
router.post('/users', () => {}).as('users.store')
router.get('/users/:id', () => {}).as('users.show')
router.delete('/users/:id', () => {}).as('users.destroy')
```

**Use for**: URL generation, redirects, navigation menus

## Route Groups

### Basic Group

```ts
import { middleware } from '#start/kernel'

router
  .group(() => {
    router.get('/users', () => {}).as('users.index')
    router.post('/users', () => {}).as('users.store')
    router.get('/posts', () => {}).as('posts.index')
  })
  .prefix('/api')              // All routes: /api/users, /api/posts
  .use(middleware.auth())      // Shared middleware
  .as('api')                   // Names: api.users.index, api.users.store
```

### Prefix Routes

```ts
router
  .group(() => {
    router.get('/users', () => {})      // GET /api/users
    router.get('/payments', () => {})   // GET /api/payments
  })
  .prefix('/api')
```

### Group Middleware

```ts
router
  .group(() => {
    router
      .get('/posts', () => {
        console.log('3. Route handler')
      })
      .use(() => {
        console.log('2. Route middleware')
        return next()
      })
  })
  .use(() => {
    console.log('1. Group middleware')  // Runs first
    return next()
  })
```

## Resource Routes

Single line generates all RESTful routes:

```ts
import { controllers } from '#generated/controllers'

router.resource('posts', controllers.Posts)
```

**Generates**:

| Name | Method | URL | Action | Purpose |
|------|--------|-----|--------|---------|
| `posts.index` | GET | `/posts` | `index` | List all |
| `posts.create` | GET | `/posts/create` | `create` | Show create form |
| `posts.store` | POST | `/posts` | `store` | Store new |
| `posts.show` | GET | `/posts/:id` | `show` | Show one |
| `posts.edit` | GET | `/posts/:id/edit` | `edit` | Show edit form |
| `posts.update` | PUT/PATCH | `/posts/:id` | `update` | Update |
| `posts.destroy` | DELETE | `/posts/:id` | `destroy` | Delete |

## Domain-Specific Routes

### Static Domain

```ts
router
  .group(() => {
    router.get('/articles', () => {})
    router.get('/articles/:id', () => {})
  })
  .domain('blog.adonisjs.com')
```

### Dynamic Subdomains

```ts
router
  .group(() => {
    router.get('/users', ({ subdomains }) => {
      return `Users for ${subdomains.tenant}`
    })
    router.get('/dashboard', ({ subdomains }) => {
      return `Dashboard for ${subdomains.tenant}`
    })
  })
  .domain(':tenant.adonisjs.com')
```

**Use for**: Multi-tenant SaaS, admin dashboards, regional sites

## Render Routes

### Edge Views

```ts
router.on('/').render('home')
router.on('/about').render('about', { title: 'About us' })
```

### Inertia Views

```ts
router.on('/').renderInertia('home')
router.on('/about').renderInertia('about', { title: 'About us' })
```

## Redirects

```ts
// Redirect to named route
router.on('/posts').redirectToRoute('articles.index')

// Redirect to URL
router.on('/posts').redirectToPath('https://medium.com/my-blog')

// Forward params
router.on('/posts/:id').redirectToRoute('articles.show')

// Override params
router.on('/featured').redirectToRoute('articles.show', { id: 1 })

// With query string
router.on('/posts').redirectToRoute('articles.index', {}, {
  qs: { limit: 20, page: 1 }
})
```

## Current Route

```ts
router.get('/payments', ({ route }) => {
  console.log(route.pattern)  // '/payments'
  console.log(route.name)     // 'payments.index'
  console.log(route.methods)  // ['GET']
})

// Check if route matches
router
  .get('/posts/:id', ({ request }) => {
    if (request.matchesRoute('posts.show')) {
      console.log('Matched posts.show')
    }
  })
  .as('posts.show')
```

## Route Matching Order

**Critical**: Routes match in registration order. Static routes MUST come before dynamic routes.

```ts
// Wrong - dynamic first
router.get('/posts/:id', ({ params }) => {})          // Matches /posts/archived
router.get('/posts/archived', () => {})               // Never executes

// Correct - static first
router.get('/posts/archived', () => {})               // Executes for /posts/archived
router.get('/posts/trending', () => {})
router.get('/posts/:id', ({ params }) => {})          // Executes for /posts/123
```

**Rule**: Order from most specific to least specific.

## 404 Handling

```ts
// app/exceptions/handler.ts
import { errors } from '@adonisjs/core'
import { HttpContext, ExceptionHandler } from '@adonisjs/core/http'

export default class HttpExceptionHandler extends ExceptionHandler {
  async handle(error: unknown, ctx: HttpContext) {
    // JSON response for APIs
    if (error instanceof errors.E_ROUTE_NOT_FOUND && ctx.request.accepts(['json'])) {
      return ctx.response.status(404).json({
        error: 'Route not found',
        message: `Cannot ${ctx.request.method()} ${ctx.request.url()}`
      })
    }

    // HTML response
    if (error instanceof errors.E_ROUTE_NOT_FOUND) {
      return ctx.view.render('errors/404')
    }

    return super.handle(error, ctx)
  }
}
```

## Extending Router

### Router Class

```ts
import { Router } from '@adonisjs/core/http'

Router.macro('health', function (this: Router) {
  this.get('/health', () => ({ status: 'ok' }))
})

Router.getter('version', function (this: Router) {
  return '1.0.0'
})
```

### Route Class

```ts
import { Route } from '@adonisjs/core/http'

Route.macro('tracking', function (this: Route, eventName: string) {
  return this.use((ctx, next) => {
    console.log(`Tracking: ${eventName}`)
    return next()
  })
})

Route.getter('isPublic', function (this: Route) {
  return !this.middleware.includes('auth')
})
```

### RouteGroup Class

```ts
import { RouteGroup } from '@adonisjs/core/http'

RouteGroup.macro('apiVersion', function (this: RouteGroup, version: string) {
  return this.prefix(`/api/${version}`)
})
```

## Common Patterns

### Pattern: API Routes with Versioning

```ts
router
  .group(() => {
    router.resource('posts', controllers.Posts)
    router.resource('users', controllers.Users)
  })
  .prefix('/api/v1')
  .use(middleware.auth())
  .as('api.v1')
```

### Pattern: Admin Routes

```ts
router
  .group(() => {
    router.get('/dashboard', () => {})
    router.resource('users', controllers.Admin.Users)
    router.resource('settings', controllers.Admin.Settings)
  })
  .prefix('/admin')
  .use(middleware.auth())
  .use(middleware.admin())
  .as('admin')
```

### Pattern: Multi-tenant Routes

```ts
router
  .group(() => {
    router.get('/dashboard', ({ subdomains }) => {
      const tenant = subdomains.tenant
      return `Dashboard for ${tenant}`
    })
    router.resource('users', controllers.Users)
  })
  .domain(':tenant.app.com')
  .use(middleware.tenant())
```

## Quick Reference

### Commands

```bash
# List all routes
node ace list:routes
```

### File Location
- Routes: `start/routes.ts`
- Import: `import router from '@adonisjs/core/services/router'`

### Route Methods
- `router.get(path, handler)` - GET request
- `router.post(path, handler)` - POST request
- `router.put(path, handler)` - PUT request
- `router.patch(path, handler)` - PATCH request
- `router.delete(path, handler)` - DELETE request
- `router.any(path, handler)` - All methods
- `router.route(path, methods, handler)` - Specific methods
- `router.resource(name, controller)` - RESTful routes
- `router.group(callback)` - Group routes

### Route Modifiers
- `.as(name)` - Name route
- `.where(param, matcher)` - Validate param
- `.use(middleware)` - Add middleware
- `.prefix(prefix)` - Add URL prefix
- `.domain(domain)` - Domain restriction

### Built-in Matchers
- `router.matchers.number()` - Numeric IDs
- `router.matchers.uuid()` - UUID v4
- `router.matchers.slug()` - URL-safe strings

## Important Notes

- Routes match in registration order (first match wins)
- Static routes MUST come before dynamic routes
- Params are always strings unless cast with `.where()`
- Global matchers apply to all routes (can be overridden)
- Group middleware runs before route middleware
- Resource routes follow RESTful conventions
- Domain routing useful for multi-tenant apps
- Route names enable maintainable URL generation
