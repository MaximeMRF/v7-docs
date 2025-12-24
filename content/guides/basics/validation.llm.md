# Validation

Validation in AdonisJS happens at the controller level using VineJS validators.

## Creating Validators

Generate validator file:
```bash
node ace make:validator post
```

Define validation schema:
```typescript
// app/validators/post.ts
import vine from '@vinejs/vine'

export const createPostValidator = vine.create({
  title: vine.string(),
  body: vine.string(),
  publishedAt: vine.date()
})
```

Use in controller:
```typescript
import { createPostValidator } from '#validators/post'
import type { HttpContext } from '@adonisjs/core/http'

export default class PostsController {
  async store({ request }: HttpContext) {
    const payload = await request.validateUsing(createPostValidator)
    // payload is validated and safe to use
  }
}
```

## Error Handling

Validation errors are handled automatically via content negotiation:

| App Type | Behavior | Error Format |
|----------|----------|--------------|
| Hypermedia | Redirects back to form | Flash messages in session |
| Inertia | Redirects back to form | Shared via Inertia state |
| API (JSON) | Returns 422 status | JSON with `errors` array |

JSON error response:
```json
{
  "errors": [
    {
      "field": "title",
      "rule": "required",
      "message": "The title field is required"
    }
  ]
}
```

No need for try/catch blocks. Global exception handler converts validation exceptions automatically.

## Custom Error Messages

### Messages Provider

Create `start/validator.ts`:
```bash
node ace make:preload validator
```

Define custom messages:
```typescript
import vine, { SimpleMessagesProvider } from '@vinejs/vine'

vine.messagesProvider = new SimpleMessagesProvider({
  // Global messages
  'required': 'The {{ field }} field is required',
  'string': 'The value of {{ field }} field must be a string',
  'email': 'The value is not a valid email address',

  // Field-specific messages
  'username.required': 'Please choose a username for your account'
})
```

### i18n for Localized Messages

```json
// resources/lang/en/validator.json
{
  "shared": {
    "fields": {
      "first_name": "First name",
      "email": "Email address"
    },
    "messages": {
      "required": "Enter {field}",
      "username.required": "Choose a username for your account",
      "email": "The email must be valid"
    }
  }
}
```

## Validating Different Data Sources

```typescript
export const showUserValidator = vine.create({
  // Request body
  username: vine.string(),
  password: vine.string(),

  // Route parameters
  params: vine.object({
    id: vine.number()
  }),

  // Query string
  qs: vine.object({
    page: vine.number().optional(),
    limit: vine.number().optional()
  }),

  // Cookies
  cookies: vine.object({
    sessionId: vine.string()
  }),

  // Headers
  headers: vine.object({
    'x-api-key': vine.string()
  })
})
```

Access validated data:
```typescript
const payload = await request.validateUsing(showUserValidator)

console.log(payload.params.id)
console.log(payload.qs?.page)
console.log(payload.cookies.sessionId)
```

## Passing Metadata

Define metadata type:
```typescript
export const updateUserValidator = vine
  .withMetaData<{ userId: number }>()
  .create({
    email: vine.string().email().unique({
      table: 'users',
      filter: (db, value, field) => {
        db.whereNot('id', field.meta.userId)
      }
    })
  })
```

Pass metadata during validation:
```typescript
const payload = await request.validateUsing(updateUserValidator, {
  meta: {
    userId: auth.user!.id
  }
})
```

## Using Outside HTTP Requests

Validate data directly in jobs, commands, or services:
```typescript
import { createPostValidator } from '#validators/post'

export default class ImportPostsJob {
  async handle(data: unknown[]) {
    for (const item of data) {
      try {
        const validPost = await createPostValidator.validate(item)
        await Post.create(validPost)
      } catch (error) {
        console.error('Invalid post data:', error.messages)
      }
    }
  }
}
```

The `validate()` method returns validated payload or throws exception. Handle exceptions yourself in non-HTTP contexts.
