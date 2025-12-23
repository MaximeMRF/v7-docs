# Controllers

Controllers organize route handlers into dedicated JavaScript classes. Each method (action) handles a specific route.

## Creating a Controller

Generate a controller:
```bash
node ace make:controller posts
```

Define actions:
```typescript
import type { HttpContext } from '@adonisjs/core/http'

export default class PostsController {
  async index({ response }: HttpContext) {
    const posts = [
      { id: 1, title: 'Getting started with AdonisJS' },
      { id: 2, title: 'Understanding controllers' }
    ]
    return response.json({ posts })
  }
}
```

Connect to routes:
```typescript
import router from '@adonisjs/core/services/router'
import { controllers } from '#generated/controllers'

router.get('/posts', [controllers.Posts, 'index'])
```

## Barrel File

The `#generated/controllers` import is a barrel file at `.adonisjs/server/controllers.ts`, automatically generated and maintained. It consolidates all controller imports.

## Controller Lifecycle

Controllers are instantiated per request. Each request gets a fresh instance using the IoC container. No risk of state leakage between requests.

## Dependency Injection

### Constructor Injection

Inject dependencies once when controller is instantiated:
```typescript
import { inject } from '@adonisjs/core'
import UserService from '#services/user_service'

@inject()
export default class UsersController {
  constructor(protected userService: UserService) {}

  async index(ctx: HttpContext) {
    return this.userService.all()
  }
}
```

### Method Injection

Inject dependencies into individual methods:
```typescript
import { inject } from '@adonisjs/core'
import UserService from '#services/user_service'
import EmailService from '#services/email_service'

export default class UsersController {
  @inject()
  async store(ctx: HttpContext, userService: UserService) {
    const data = ctx.request.all()
    return userService.create(data)
  }

  @inject()
  async sendEmail(
    ctx: HttpContext,
    userService: UserService,
    emailService: EmailService
  ) {
    const user = await userService.find(ctx.params.id)
    await emailService.send(user.email, 'Welcome!')
    return { sent: true }
  }
}
```

First parameter must always be HTTPContext, dependencies follow after.

## Resource Controllers

Generate all seven RESTful methods:
```bash
node ace make:controller posts --resource
```

Register resource routes:
```typescript
router.resource('posts', controllers.Posts)
```

Standard resourceful actions:
- `index` - GET /posts - List all posts
- `create` - GET /posts/create - Show form to create post
- `store` - POST /posts - Create new post
- `show` - GET /posts/:id - Display single post
- `edit` - GET /posts/:id/edit - Show form to edit post
- `update` - PUT/PATCH /posts/:id - Update existing post
- `destroy` - DELETE /posts/:id - Delete post

### Nested Resources

```typescript
router.resource('posts.comments', controllers.Comments)
```

Creates routes like `/posts/:post_id/comments/:id`. Controller receives both `params.post_id` and `params.id`.

### Shallow Resources

```typescript
router.shallowResource('posts.comments', controllers.Comments)
```

Show, edit, update, destroy omit parent ID since child can be looked up by own ID.

### API-Only Resources

```typescript
router.resource('posts', controllers.Posts).apiOnly()
```

Excludes `create` and `edit` routes. Creates only: index, store, show, update, destroy.

### Filtering Routes

```typescript
// Only specific routes
router.resource('posts', controllers.Posts).only(['index', 'store', 'destroy'])

// Exclude specific routes
router.resource('posts', controllers.Posts).except(['create', 'edit'])
```

### Custom Params

```typescript
router
  .resource('posts', controllers.Posts)
  .params({ posts: 'post' })
```

Changes `:id` to `:post` in URLs.

### Resource Middleware

```typescript
router
  .resource('posts', controllers.Posts)
  .use(['create', 'store', 'update', 'destroy'], middleware.auth())

// Apply to all routes
router.resource('posts', controllers.Posts).use('*', middleware.auth())
```

## Configuration

Customize controller location in `adonisrc.ts`:
```typescript
export default defineConfig({
  directories: {
    controllers: 'app/http/controllers'
  }
})
```

Configure barrel file generation:
```typescript
export default defineConfig({
  barrelFiles: {
    controllers: {
      enabled: true,
      export: (path) => `export * as ${path.name} from '${path.modulePath}'`
    }
  }
})
```
