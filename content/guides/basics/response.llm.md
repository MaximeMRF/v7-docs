# Response

The Response class provides helpers for constructing HTTP responses. Access via `ctx.response`.

## Sending Response Body

### Return Values Directly

```typescript
router.get('/', async () => {
  return 'This is the homepage.' // text/plain
})

router.get('/welcome', async () => {
  return '<p>This is the homepage</p>' // text/html
})

router.get('/api/page', async () => {
  return { page: 'home' } // application/json
})

router.get('/timestamp', async () => {
  return new Date() // ISO string
})
```

### Using response.send()

```typescript
router.get('/', async ({ response }) => {
  response.send('This is the homepage')
})

router.get('/data', async ({ response }) => {
  response.send({ page: 'home' })
})
```

### Force JSON

```typescript
async index({ response }: HttpContext) {
  const posts = await Post.all()
  response.json(posts) // Explicitly sets application/json
}
```

## Headers

### Set Header

```typescript
response.header('X-API-Version', 'v1')
response.header('Cache-Control', 'public, max-age=3600')
```

### Safe Header (only if not exists)

```typescript
response.safeHeader('Access-Control-Allow-Origin', '*')
```

### Append Header

```typescript
response.append('Set-Cookie', 'session=abc123; HttpOnly')
response.append('Set-Cookie', 'preferences=dark-mode; Path=/')
```

### Remove Header

```typescript
response.removeHeader('X-Powered-By')
```

## Redirects

### Basic Redirects

```typescript
// Redirect to path
response.redirect().toPath('/')

// Redirect to named route
response.redirect().toRoute('articles.show', [post.id])

// Redirect back
response.redirect().back()

// Set status code
response.redirect().status(301).toPath('/new-page')
```

### Query Strings

```typescript
// Forward existing query string
response.redirect().withQs().toPath('/results')

// Custom query string
response.redirect()
  .withQs({ category: 'electronics' })
  .withQs({ sort: 'price' })
  .toPath('/products')
```

## Streaming and Downloads

### Stream Response

```typescript
import { createReadStream } from 'node:fs'

const stream = createReadStream('./exports/data.csv')
response.stream(stream)
```

### Download File

```typescript
import app from '@adonisjs/core/services/app'

const filePath = app.makePath(`storage/invoices/${params.id}.pdf`)
response.download(filePath)
```

### Force Download with Custom Filename

```typescript
const filePath = app.makePath(`storage/reports/${params.id}.xlsx`)
response.attachment(filePath, `monthly-report-${params.month}.xlsx`)
```

## Status Codes

### Set Status

```typescript
response.status(201)
return post
```

### Safe Status (only if not set)

```typescript
response.safeStatus(200)
```

### Shorthand Methods

```typescript
response.ok(body)            // 200
response.created(body)       // 201
response.noContent()         // 204
response.badRequest(body)    // 400
response.unauthorized(body)  // 401
response.forbidden(body)     // 403
response.notFound(body)      // 404
response.unprocessableEntity(body) // 422
response.internalServerError(body) // 500
```

## Cookies

### Signed Cookies

```typescript
response.cookie('theme', theme, {
  maxAge: '2h'
})
```

### Encrypted Cookies

```typescript
response.encryptedCookie('session_data', {
  userId: auth.user.id,
  loginAt: new Date()
})
```

### Plain Cookies

```typescript
response.plainCookie('last_visit', new Date().toISOString())
```

### Cookie Options

```typescript
response.encryptedCookie('auth_token', token, {
  domain: '',
  path: '/',
  maxAge: '2h',
  httpOnly: true,
  secure: true,
  sameSite: 'lax',
  partitioned: false,
  priority: 'medium'
})
```

## Run After Response Sent

```typescript
response.onFinish(async () => {
  await unlink(filePath) // Cleanup temp file
})

response.download(filePath)
```

## Response Serialization

| Data Type | Content-Type | Behavior |
|-----------|--------------|----------|
| Arrays/objects | `application/json` | Stringified with safe stringify |
| HTML strings (starts with `<`) | `text/html` | Sent as-is |
| Numbers/booleans | `text/plain` | Converted to string |
| Date | `text/plain` | ISO string via `toISOString()` |
| Regular expressions | `text/plain` | `toString()` |
| Error objects | `text/plain` | `toString()` |
| JSONP | `text/javascript` | Stringified appropriately |
| Other strings | `text/plain` | Sent as-is |

## Extending Response

Add custom methods:
```typescript
// providers/app_provider.ts
import { Response } from '@adonisjs/core/http'

export default class AppProvider {
  async boot() {
    Response.macro('api', function (data: any, meta?: Record<string, any>) {
      return this.json({
        success: true,
        data: data,
        meta: meta || {}
      })
    })
  }
}
```

Type augmentation:
```typescript
// types/response.ts
declare module '@adonisjs/core/http' {
  export interface Response {
    api(data: any, meta?: Record<string, any>): void
  }
}
```

Use custom methods:
```typescript
return response.api(posts, {
  version: 'v1',
  timestamp: new Date()
})
```
