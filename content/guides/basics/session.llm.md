# Sessions

Sessions persist state across multiple HTTP requests. Used primarily for authentication state and flash messages.

## Installation

```bash
node ace add @adonisjs/session
```

## Storage Drivers

| Driver | Best For | Notes |
|--------|----------|-------|
| `cookie` | Simple apps, small data | Max ~4KB, data in encrypted cookie |
| `file` | Development, single-server | Local filesystem |
| `redis` | Production, multiple servers | Requires Redis |
| `dynamodb` | AWS/serverless apps | Requires AWS DynamoDB |
| `database` | Production with SQL | Requires database table |
| `memory` | Testing only | Lost on restart |

## Configuration

```typescript
// config/session.ts
export default defineConfig({
  age: '2 hours',
  clearWithBrowser: true,

  cookie: {
    name: 'adonis-session',
    httpOnly: true,
    secure: true,
    sameSite: 'lax'
  },

  store: env.get('SESSION_DRIVER'),

  stores: {
    cookie: stores.cookie(),
    file: stores.file({ location: app.tmpPath('sessions') }),
    redis: stores.redis({ connection: 'main' }),
    database: stores.database({ connection: 'postgres', tableName: 'sessions' }),
    dynamodb: stores.dynamodb({ region: env.get('AWS_REGION'), tableName: 'sessions' })
  }
})
```

## Basic Usage

### Store and Retrieve Data

```typescript
router.get('/cart', ({ session }) => {
  const cartItems = session.get('cart', [])
  return { items: cartItems }
})

router.post('/cart', async ({ request, session }) => {
  const productId = request.input('product_id')
  const product = await Product.findOrFail(productId)

  const cartItems = session.get('cart', [])
  cartItems.push({ id: product.id, name: product.name, quantity: 1 })

  session.put('cart', cartItems)
  return { message: 'Item added' }
})
```

### Check Existence

```typescript
if (session.has('cart')) {
  const cartItems = session.get('cart')
}
```

### Retrieve and Remove

```typescript
const cartItems = session.pull('cart', [])
// Cart data retrieved and removed
```

### Numeric Values

```typescript
session.increment('visits')
session.decrement('actions')
```

### Get All Data

```typescript
const allData = session.all()
```

### Remove Specific Key

```typescript
session.forget('cart')
```

### Clear All Data

```typescript
session.clear()
```

## Flash Messages

Temporary data available only for next request. Automatically deleted after being accessed.

### Basic Flash Messages

```typescript
router.post('/cart', async ({ session, response }) => {
  // Add item to cart...

  session.flashMessages.flash('success', 'Item added to the cart')
  return response.redirect().back()
})
```

### Display in Templates

```edge
@if(flashMessages.has('success'))
  <div class="alert alert-success">
    {{ flashMessages.get('success') }}
  </div>
@end

@if(flashMessages.has('error'))
  <div class="alert alert-error">
    {{ flashMessages.get('error') }}
  </div>
@end
```

### Custom Message Types

```typescript
session.flashMessages.flash('newsletter', 'Check your email to confirm subscription')
```

### Flash Form Data

```typescript
try {
  // Process form...
} catch (error) {
  session.flashAll() // Flash all form data
  session.flashOnly(['title', 'content']) // Flash specific fields
  session.flashExcept(['password']) // Flash except sensitive fields

  session.flashMessages.flash('error', 'Failed to create post')
  return response.redirect().back()
}
```

Access in templates:
```edge
<input type="text" name="title" value="{{ old('title') }}" />
<textarea name="content">{{ old('content') }}</textarea>
```

### Re-flash Messages

```typescript
session.reflash() // Keep all messages for one more request
session.reflashOnly(['error']) // Re-flash only error messages
session.reflashExcept(['success']) // Re-flash all except success
```

## Session Regeneration

Prevents session fixation attacks. Creates new session ID while preserving data.

```typescript
export default class AuthController {
  async login({ request, session, response }: HttpContext) {
    const { email, password } = request.only(['email', 'password'])
    const user = await User.verifyCredentials(email, password)

    await session.regenerate() // Generate new session ID

    session.put('user_id', user.id)
    return response.redirect('/dashboard')
  }
}
```

AdonisJS Auth package handles regeneration automatically.

## Custom Session Stores

Implement `SessionStoreContract` interface:

```typescript
import {
  SessionData,
  SessionStoreFactory,
  SessionStoreContract
} from '@adonisjs/session/types'

export class MongoDbStore implements SessionStoreContract {
  constructor(protected config: MongoDBConfig) {}

  async read(sessionId: string): Promise<SessionData | null> {
    // Query storage and return session data
  }

  async write(sessionId: string, data: SessionData, expiresAt: Date): Promise<void> {
    // Save session data
  }

  async destroy(sessionId: string): Promise<void> {
    // Remove session
  }

  async touch(sessionId: string, expiresAt: Date): Promise<void> {
    // Update expiration
  }
}

export function mongoDbStore(config: MongoDBConfig): SessionStoreFactory {
  return (ctx, sessionConfig) => {
    return new MongoDBStore(config)
  }
}
```

Register custom store:
```typescript
// config/session.ts
export default defineConfig({
  stores: {
    mongodb: mongoDbStore({
      collection: 'sessions',
      database: 'myapp'
    })
  }
})
```

Set environment variable:
```dotenv
SESSION_DRIVER=mongodb
```
