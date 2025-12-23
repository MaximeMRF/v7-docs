# URL Builder

The URL builder provides a type-safe API for generating URLs from named routes. Instead of hard-coding URLs throughout your application, you reference routes by name. When you change a route's path, you don't need to update every URL reference across your codebase.

## Defining Named Routes

Every route using a controller is automatically assigned a name based on the controller and method name following the pattern `controller.method`:

```typescript
import router from '@adonisjs/core/services/router'
import { controllers } from '#generated/controllers'

// Automatically named as 'posts.show'
router.get('/posts/:id', [controllers.posts, 'show'])

// Automatically named as 'posts.index'
router.get('/posts', [controllers.posts, 'index'])
```

For routes without controllers, explicitly assign a name using the `.as()` method:

```typescript
router.get('/about', async () => {
  return 'About page'
}).as('about')
```

View all named routes using:

```bash
node ace list:routes
```

## Generating URLs in Templates

Edge templates have access to the `urlFor` helper:

```edge
<a href="{{ urlFor('posts.show', { id: post.id }) }}">
  View post
</a>
```

With the Hypermedia starter kit, use the `@link` component:

```edge
@link({ route: 'posts.show', routeParams: { id: post.id } })
  View post
@end
```

## Generating URLs During Redirects

Use the `response.redirect().toRoute()` method:

```typescript
import type { HttpContext } from '@adonisjs/core/http'
import Post from '#models/post'

export default class PostsController {
  async store({ request, response }: HttpContext) {
    const post = await Post.create(request.all())

    return response
      .redirect()
      .toRoute('posts.show', { id: post.id })
  }
}
```

## Generating URLs in Other Contexts

For contexts outside templates and HTTP responses like background jobs or email notifications, import the `urlFor` function:

```typescript
import { urlFor } from '@adonisjs/core/services/url_builder'

export default class NotificationService {
  async sendPostNotification(post: Post) {
    const postUrl = urlFor('posts.show', { id: post.id })

    await mail.send({
      subject: 'New post published',
      html: `<a href="${postUrl}">View post</a>`
    })
  }
}
```

## Passing Route Parameters

Route parameters can be passed as an array (positional) or object (named):

**Array (positional parameters):**

```typescript
// Route: /posts/:id
urlFor('posts.show', [1])
// Output: /posts/1

// Route: /users/:userId/posts/:postId
urlFor('users.posts.show', [5, 10])
// Output: /users/5/posts/10
```

**Object (named parameters):**

```typescript
// Route: /posts/:id
urlFor('posts.show', { id: 1 })
// Output: /posts/1

// Route: /users/:userId/posts/:postId
urlFor('users.posts.show', { userId: 5, postId: 10 })
// Output: /users/5/posts/10
```

## Adding Query Strings

Pass a third options parameter with a `qs` property:

```typescript
import { urlFor } from '@adonisjs/core/services/url_builder'

const url = urlFor('posts.index', [], {
  qs: {
    filters: {
      title: 'typescript',
    },
    order: {
      direction: 'asc',
      column: 'id'
    },
  }
})

// Output: /posts?filters[title]=typescript&order[direction]=asc&order[column]=id
```

In templates:

```edge
<a href="{{ urlFor('posts.index', [], { qs: { page: 2, sort: 'title' } }) }}">
  Next page
</a>
```

In redirects:

```typescript
response.redirect().toRoute('posts.index', [], {
  qs: { page: 2, sort: 'title' }
})
```

## Signed URLs

Signed URLs include a cryptographic signature that prevents tampering. Useful for scenarios like newsletter unsubscribe links or password reset tokens.

### Creating Signed URLs

Use the `signedUrlFor` helper:

```typescript
import User from '#models/user'
import { appUrl } from '#config/app'
import { BaseMail } from '@adonisjs/mail'
import { signedUrlFor } from '@adonisjs/core/services/url_builder'

export default class NewsletterMail extends BaseMail {
  subject = 'Weekly Newsletter'

  constructor(protected user: User) {
    super()
  }

  prepare() {
    const unsubscribeUrl = signedUrlFor(
      'newsletter.unsubscribe',
      { email: this.user.email },
      {
        expiresIn: '30 days',
        prefixUrl: appUrl,
      }
    )

    this.message.htmlView('emails/newsletter', {
      user: this.user,
      unsubscribeUrl
    })
  }
}
```

The `expiresIn` option sets when the signed URL expires. The `prefixUrl` option is required when the URL will be shared externally like in emails.

Note: Signed URLs can only be created in backend code, not in frontend applications.

### Verifying Signed URLs

Use `request.hasValidSignature()` to verify the signature:

```typescript
import type { HttpContext } from '@adonisjs/core/http'

export default class NewsletterController {
  async unsubscribe({ request, response }: HttpContext) {
    if (!request.hasValidSignature()) {
      return response.badRequest('Invalid or expired unsubscribe link')
    }

    const email = request.qs().email
    // Process unsubscribe request
  }
}
```

## Frontend Integration

### Why Separate Frontend and Backend URL Builders

AdonisJS enforces a clear boundary between frontend and backend codebases to prevent leaking sensitive information to the client. Routes on the backend contain details about controller mappings and internal application structure. Making this available on the frontend would leak unnecessary information and significantly increase your bundle size.

Additionally, you cannot share an object between two different runtimes (Node.js and the browser).

### Using the URL Builder in Inertia Apps

The Inertia React and Vue starter kits come with the URL builder pre-configured. It's generated using Tuyau and written to the `.adonisjs/client` directory.

```tsx
import { urlFor } from '~/client'

export default function PostsIndex({ posts }) {
  return (
    <div>
      {posts.map(post => (
        <a key={post.id} href={urlFor('posts.show', { id: post.id })}>
          {post.title}
        </a>
      ))}
    </div>
  )
}
```

The usage API is identical to the backend URL builder:

```typescript
// Using positional parameters
urlFor('posts.show', [post.id])

// Using named parameters
urlFor('posts.show', { id: post.id })

// Adding query strings
urlFor('posts.index', [], {
  qs: { page: 2, sort: 'title' }
})
```

### Excluding Routes from Frontend Bundle

Configure which routes are available in the frontend URL builder to reduce bundle size and prevent exposing internal routes. The URL builder is generated using an Assembler hook in your `adonisrc.ts` file:

```typescript
import { defineConfig } from '@adonisjs/core/app'
import { generateRegistry } from '@adonisjs/assembler/hooks'

export default defineConfig({
  init: [
    generateRegistry({
      exclude: ['admin.*'],
    })
  ],
})
```

Exclude patterns can use:

**Wildcard pattern:**

```typescript
generateRegistry({
  exclude: ['admin.*', 'api.internal.*'],
})
```

**Regular expression:**

```typescript
generateRegistry({
  exclude: [/^admin\./, /^api\.internal\./],
})
```

**Custom function:**

```typescript
generateRegistry({
  exclude: [
    (route) => {
      // Exclude all routes on the admin domain
      if (route.domain === 'admin.myapp.com') {
        return false
      }
      return true
    }
  ],
})
```

You can combine multiple patterns:

```typescript
generateRegistry({
  exclude: [
    'admin.*',
    /^api\.internal\./,
    (route) => route.domain !== 'admin.myapp.com'
  ],
})
```
