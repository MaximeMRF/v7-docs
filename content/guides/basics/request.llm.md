# Request

The Request class in AdonisJS holds all information related to an HTTP request including the request body, uploaded files, query string, URL, method, headers, and cookies. Access it via the `request` property of HttpContext in route handlers, middleware, and exception handlers.

## Reading Request Body and Files

The request body contains data sent by the client from HTML forms or API requests. AdonisJS uses the bodyparser to automatically parse the request body based on the Content-Type header.

### Accessing the Entire Request Body

Use the `all` method to retrieve all data from the request body as an object:

```typescript
import router from '@adonisjs/core/services/router'

router.post('/signup', ({ request }) => {
  const body = request.all()
  console.log(body)
  // { fullName: 'John Doe', email: 'john@example.com', password: 'secret' }
})
```

Note: The request body data is not type-safe. Use the validation system to ensure both runtime safety and TypeScript type safety.

### Accessing Specific Fields

Use the `input` method to read a specific field with an optional default value:

```typescript
router.post('/signup', ({ request }) => {
  const email = request.input('email')
  const newsletter = request.input('newsletter', false)
})
```

Use `only` to retrieve multiple specific fields, or `except` to retrieve all except certain ones:

```typescript
router.post('/signup', ({ request }) => {
  // Get only fullName and email
  const credentials = request.only(['fullName', 'email'])

  // Get all fields except password
  const safeData = request.except(['password'])
})
```

### Accessing Uploaded Files

Files uploaded through multipart form data are available using the `file` method:

```typescript
router.post('/avatar', ({ request }) => {
  const avatar = request.file('avatar')
  console.log(avatar)
})
```

You can validate files when accessing them:

```typescript
router.post('/avatar', ({ request }) => {
  const avatar = request.file('avatar', {
    size: '2mb',
    extnames: ['jpg', 'png', 'jpeg']
  })
})
```

### Available Methods

- `all()` - Returns all request body data as an object
- `body()` - Alias for `all()` method
- `input(key, defaultValue?)` - Returns a specific field value with optional default
- `only(keys)` - Returns only the specified fields
- `except(keys)` - Returns all fields except the specified ones
- `file(key, options?)` - Returns an uploaded file with optional validation

## Reading Query String and Route Parameters

### Accessing Query String Parameters

Use the `qs` method to retrieve all query string parameters:

```typescript
router.get('/posts', ({ request }) => {
  const queryString = request.qs()
  console.log(queryString)
  // { page: '1', limit: '10', orderBy: 'created_at' }
})
```

Access individual query parameters using `input`:

```typescript
router.get('/posts', ({ request }) => {
  const page = request.input('page', 1)
  const limit = request.input('limit', 20)
  const orderBy = request.input('orderBy', 'id')
})
```

### Accessing Route Parameters

Route parameters are available through the `param` method or `params` object:

```typescript
router.get('/posts/:id', ({ request }) => {
  const id = request.param('id')
  console.log(id)
})
```

### Available Methods

- `qs()` - Returns all query string parameters as an object
- `param(key, defaultValue?)` - Returns a specific route parameter with optional default
- `params()` - Returns all route parameters as an object

## Reading Headers, Method, URL, and IP Address

### Accessing Request Headers

Use the `header` method to read a specific header value (case-insensitive):

```typescript
router.get('/profile', ({ request }) => {
  const authToken = request.header('Authorization')
  const userAgent = request.header('User-Agent')
})
```

Retrieve all headers using `headers`:

```typescript
router.get('/debug', ({ request }) => {
  const allHeaders = request.headers()
})
```

### Accessing the Request Method

```typescript
router.all('/endpoint', ({ request }) => {
  const method = request.method()
  console.log(method) // 'GET', 'POST', etc.
})
```

### Accessing the Request URL

```typescript
router.get('/posts', ({ request }) => {
  const path = request.url()
  console.log(path) // '/posts?page=1'

  const fullUrl = request.completeUrl()
  console.log(fullUrl) // 'https://example.com/posts?page=1'
})
```

### Accessing the Client IP Address

```typescript
router.get('/track', ({ request }) => {
  const clientIp = request.ip()
  console.log(clientIp)
})
```

The `ips` method returns an array of IP addresses when behind multiple proxies:

```typescript
router.get('/track', ({ request }) => {
  const ipChain = request.ips()
  console.log(ipChain) // ['client-ip', 'proxy-1', 'proxy-2']
})
```

### Available Methods

- `header(key, defaultValue?)` - Returns a specific header value
- `headers()` - Returns all headers as an object
- `method()` - Returns the HTTP method (GET, POST, etc.)
- `url()` - Returns the request URL without domain
- `completeUrl()` - Returns the complete URL including domain
- `ip()` - Returns the client IP address
- `ips()` - Returns array of IPs when behind proxies

## Reading Request Cookies

### Accessing Signed Cookies

Use the `cookie` method to read a signed cookie value. By default all cookies are signed:

```typescript
router.get('/preferences', ({ request }) => {
  const theme = request.cookie('theme', 'light')
  const language = request.cookie('language', 'en')
})
```

### Accessing Encrypted Cookies

Use `encryptedCookie` for encrypted cookies:

```typescript
router.get('/dashboard', ({ request }) => {
  const sessionId = request.encryptedCookie('session_id')
})
```

### Available Methods

- `cookie(key, defaultValue?)` - Returns a signed cookie value
- `cookiesList()` - Returns all cookies without decrypting or unsigning
- `encryptedCookie(key, defaultValue?)` - Returns a decrypted cookie value
- `plainCookie(key, defaultValue?)` - Returns value for plain cookie

## Request ID and ID Generation

Every HTTP request in AdonisJS is assigned a unique request ID useful for distributed tracing, logging, and correlating related operations.

### Accessing the Request ID

```typescript
router.get('/api/posts', ({ request }) => {
  const requestId = request.id()
  console.log(`Processing request: ${requestId}`)
})
```

### How Request IDs are Generated

AdonisJS generates request IDs using one of these methods in order:

1. From X-Request-Id header if the client or proxy sends it
2. Generated by AdonisJS using the uuid package if no header exists

You can configure request ID generation in `config/app.ts`.

### Using Request IDs for Distributed Tracing

Request IDs are valuable in distributed systems for tracing the complete flow of a request:

```typescript
import router from '@adonisjs/core/services/router'
import logger from '@adonisjs/core/services/logger'

router.post('/checkout', async ({ request }) => {
  const requestId = request.id()

  logger.info({ requestId }, 'Starting checkout process')
  // Your checkout logic here
  logger.info({ requestId }, 'Checkout completed')
})
```

## Content Negotiation

Content negotiation allows your application to serve different response formats or languages based on what the client accepts.

### Selecting Response Format

Use the `accepts` method to determine the best response format based on the client's Accept header:

```typescript
router.get('/posts', ({ request, response }) => {
  const bestFormat = request.accepts(['html', 'json'])

  if (bestFormat === 'json') {
    return response.json({ posts: [] })
  }

  if (bestFormat === 'html') {
    return response.view('posts/index')
  }

  return response.status(406).send('Not Acceptable')
})
```

The `types` method returns all accepted content types in order of client preference:

```typescript
router.get('/posts', ({ request }) => {
  const acceptedTypes = request.types()
  console.log(acceptedTypes) // ['application/json', 'text/html', '*/*']
})
```

### Internationalization

Use the `language` method to determine the best language based on the Accept-Language header:

```typescript
router.get('/welcome', ({ request, response }) => {
  const language = request.language(['en', 'fr', 'es']) || 'en'

  const messages = {
    en: 'Welcome',
    fr: 'Bienvenue',
    es: 'Bienvenido'
  }

  return response.send(messages[language])
})
```

The `languages` method returns all accepted languages in order:

```typescript
router.get('/welcome', ({ request }) => {
  const acceptedLanguages = request.languages()
  console.log(acceptedLanguages) // ['en-US', 'fr', 'es']
})
```

### Available Methods

- `accepts(types)` - Returns the best matching content type or null
- `types()` - Returns all accepted content types in preference order
- `language(languages)` - Returns the best matching language or null
- `languages()` - Returns all accepted languages in preference order
- `charset(charsets)` - Returns the best matching charset or null
- `charsets()` - Returns all accepted charsets in preference order
- `encoding(encodings)` - Returns the best matching encoding or null
- `encodings()` - Returns all accepted encodings in preference order

## Trusting Proxy Servers

When your application runs behind a reverse proxy or load balancer, you need to configure which proxy IP addresses to trust. This allows AdonisJS to correctly read the X-Forwarded-* headers.

```typescript
import env from '#start/env'
import { defineConfig } from '@adonisjs/core/http'
import proxyAddr from 'proxy-addr'

export const http = defineConfig({
  trustProxy: proxyAddr.compile(['loopback', 'uniquelocal'])
})
```

Common configurations:

```typescript
// Trust all proxies (not recommended for production)
trustProxy: () => true

// Trust specific IP addresses
trustProxy: proxyAddr.compile(['127.0.0.1', '192.168.1.1'])

// Trust IP ranges using CIDR notation
trustProxy: proxyAddr.compile('10.0.0.0/8')
```

## Custom IP Address Extraction

When running behind proxies or CDNs like Cloudflare, you may need to extract the IP from custom headers:

```typescript
import env from '#start/env'
import { defineConfig } from '@adonisjs/core/http'
import type { IncomingMessage } from 'node:http'

export const http = defineConfig({
  getIp(request: IncomingMessage) {
    const cloudflareIp = request.headers['cf-connecting-ip']

    if (cloudflareIp && typeof cloudflareIp === 'string') {
      return cloudflareIp
    }

    // Return undefined to fall back to default IP extraction
    return undefined
  }
})
```
