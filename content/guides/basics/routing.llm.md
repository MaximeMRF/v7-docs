# Routing

Routing connects HTTP requests to handlers. A route consists of HTTP method, URI pattern, and handler.

## Basic Routes

```typescript
import router from '@adonisjs/core/services/router'

router.get('/', () => 'Hello world from the home page.')
router.get('/about', () => 'This is the about page.')

// Dynamic route
router.get('/posts/:id', ({ params }) => {
  return `This is post with id ${params.id}`
})

router.post('/users', async ({ request }) => {
  const data = request.all()
  await createUser(data)
  return 'User created successfully'
})
```

## Using Controllers

```typescript
import router from '@adonisjs/core/services/router'
const PostsController = () => import('#controllers/posts_controller')

router.get('/posts/:id', [PostsController, 'show'])
```

## Viewing Routes

```bash
node ace list:routes
```

## Route Params

### Basic Params

```typescript
router.get('/posts/:id', ({ params }) => {
  return `Showing post with id: ${params.id}`
})
```

### Multiple Params

```typescript
router.get('/posts/:id/comments/:commentId', ({ params }) => {
  console.log(params.id)        // Post ID
  console.log(params.commentId) // Comment ID
})
```

### Optional Params

```typescript
router.get('/posts/:id?', ({ params }) => {
  if (!params.id) {
    return 'Showing all posts'
  }
  return `Showing post with id ${params.id}`
})
```

### Wildcard Params

```typescript
router.get('/docs/:category/*', ({ params }) => {
  console.log(params.category)  // 'guides'
  console.log(params['*'])      // ['sql', 'orm', 'query-builder']
})
```

## Param Validation

### Custom Matchers

```typescript
router
  .get('/posts/:id', ({ params }) => {
    console.log(typeof params.id) // 'number'
  })
  .where('id', {
    match: /^[0-9]+$/,
    cast: (value) => Number(value)
  })
```

### Built-in Matchers

```typescript
// Numeric IDs
router.get('/posts/:id', ({ params }) => {})
  .where('id', router.matchers.number())

// UUIDs
router.get('/users/:userId', ({ params }) => {})
  .where('userId', router.matchers.uuid())

// Slugs
router.get('/articles/:slug', ({ params }) => {})
  .where('slug', router.matchers.slug())
```

### Global Matchers

```typescript
router.where('id', router.matchers.uuid())

// All routes inherit UUID matcher
router.get('/posts/:id', () => {})
router.get('/users/:id', () => {})

// Override for specific route
router.get('/categories/:id', () => {})
  .where('id', router.matchers.number())
```

## HTTP Methods

```typescript
router.get('/users', () => {})
router.post('/users', () => {})
router.put('/users/:id', () => {})
router.patch('/users/:id', () => {})
router.delete('/users/:id', () => {})

// Match all methods
router.any('/reports', () => {})

// Match specific methods
router.route('/', ['TRACE'], () => {})
router.route('/api/data', ['GET', 'POST', 'PUT'], () => {})
```

## Middleware

```typescript
import { middleware } from '#start/kernel'

router.get('/posts', () => {})
  .use(middleware.auth())

// Inline middleware
router.get('/posts', () => {})
  .use((ctx, next) => {
    console.log('Inside middleware')
    return next()
  })
```

## Named Routes

```typescript
router.get('/users', () => {}).as('users.index')
router.post('/users', () => {}).as('users.store')
router.get('/users/:id', () => {}).as('users.show')
router.delete('/users/:id', () => {}).as('users.destroy')
```

## Route Groups

```typescript
router
  .group(() => {
    router.get('/users', () => {}).as('users.index')
    router.post('/users', () => {}).as('users.store')
    router.get('/posts', () => {}).as('posts.index')
  })
  .prefix('/api')
  .use(middleware.auth())
  .as('api')
```

### Group Features

```typescript
// Prefix
router.group(() => {
  router.get('/users', () => {})  // GET /api/users
}).prefix('/api')

// Name prefix
router.group(() => {
  router.get('/users', () => {}).as('users.index') // Name: api.users.index
}).as('api')

// Middleware
router.group(() => {
  router.get('/posts', () => {})
}).use(middleware.auth())
```

## Resource Routes

```typescript
router.resource('posts', controllers.Posts)
```

Generates 7 routes:
- `posts.index` - GET /posts - List all
- `posts.create` - GET /posts/create - Show create form
- `posts.store` - POST /posts - Create new
- `posts.show` - GET /posts/:id - Display one
- `posts.edit` - GET /posts/:id/edit - Show edit form
- `posts.update` - PUT/PATCH /posts/:id - Update
- `posts.destroy` - DELETE /posts/:id - Delete

### Nested Resources

```typescript
router.resource('posts.comments', controllers.Comments)
```

Creates routes like `/posts/:post_id/comments/:id`.

### Shallow Resources

```typescript
router.shallowResource('posts.comments', controllers.Comments)
```

Show, edit, update, destroy routes omit parent ID: `/comments/:id`.

### Filtering

```typescript
// API only (no create/edit)
router.resource('posts', controllers.Posts).apiOnly()

// Only specific actions
router.resource('posts', controllers.Posts).only(['index', 'store', 'destroy'])

// Exclude specific actions
router.resource('posts', controllers.Posts).except(['create', 'edit'])
```

### Custom Params

```typescript
router.resource('posts', controllers.Posts)
  .params({ posts: 'post' })
```

Changes `:id` to `:post` in URLs.

### Resource Middleware

```typescript
router.resource('posts', controllers.Posts)
  .use(['create', 'store', 'update', 'destroy'], middleware.auth())

// All routes
router.resource('posts', controllers.Posts)
  .use('*', middleware.auth())
```

## Domain Routing

```typescript
router.group(() => {
  router.get('/articles', () => {})
}).domain('blog.adonisjs.com')

// Dynamic subdomains
router.group(() => {
  router.get('/users', ({ subdomains }) => {
    return `Listing users for ${subdomains.tenant}`
  })
}).domain(':tenant.adonisjs.com')
```

## Render Shortcuts

### Edge Views

```typescript
router.on('/').render('home')
router.on('/about').render('about', { title: 'About us' })
```

### Inertia Views

```typescript
router.on('/').renderInertia('home')
router.on('/about').renderInertia('about', { title: 'About us' })
```

## Redirects

```typescript
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

```typescript
router.get('/payments', ({ route, request }) => {
  console.log(route.pattern)  // '/payments'
  console.log(route.name)     // 'payments.index'
  console.log(route.methods)  // ['GET']

  if (request.matchesRoute('posts.show')) {
    // Do something
  }
})
```

## Route Order Matters

Define static routes before dynamic routes:

```typescript
// Correct order
router.get('/posts/archived', () => {})
router.get('/posts/trending', () => {})
router.get('/posts/:id', () => {})

// Wrong - dynamic route matches first
router.get('/posts/:id', () => {})
router.get('/posts/archived', () => {}) // Never executes
```

## 404 Handling

```typescript
// app/exceptions/handler.ts
import { errors } from '@adonisjs/core'

export default class HttpExceptionHandler extends ExceptionHandler {
  async handle(error: unknown, ctx: HttpContext) {
    if (error instanceof errors.E_ROUTE_NOT_FOUND) {
      return ctx.view.render('errors/404')
    }
    return super.handle(error, ctx)
  }
}
```
