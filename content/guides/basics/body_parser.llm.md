# Body Parser in AdonisJS

## Overview
The body parser middleware automatically parses incoming request bodies before they reach route handlers. It detects content type and applies appropriate parser (JSON, form data, or multipart).

Parsers available: JSON parser, form parser (URL-encoded), multipart parser (file uploads)

Access parsed data through Request class: request.all(), request.body(), request.file()

Configuration file: config/bodyparser.ts

## Configuration Structure

```typescript
import { defineConfig } from '@adonisjs/core/bodyparser'

const bodyParserConfig = defineConfig({
  allowedMethods: ['POST', 'PUT', 'PATCH', 'DELETE'],

  form: { /* form parser config */ },
  json: { /* json parser config */ },
  multipart: { /* multipart parser config */ },
  raw: { /* raw parser config */ }
})
```

## allowedMethods
Array of HTTP methods to parse request bodies for. Default: ['POST', 'PUT', 'PATCH', 'DELETE']

GET requests excluded as they don't typically have bodies.

## Global Parsing Options

### convertEmptyStringsToNull
Converts empty strings to null values. Solves HTML form issue where empty inputs send empty strings instead of null.

Example: Optional "country" field in form sends "" but database expects null for empty values.

```typescript
json: {
  convertEmptyStringsToNull: true
}
```

### trimWhitespaces
Removes leading and trailing whitespace from all string values.

```typescript
form: {
  trimWhitespaces: true
}
```

## JSON Parser

Handles JSON-encoded request bodies.

Default content types: application/json, application/json-patch+json, application/vnd.api+json, application/csp-report

Options:
- encoding: Character encoding (default: utf-8)
- limit: Max request body size (default: 1mb)
- strict: Only accept objects/arrays as top-level values (default: true)
- types: Array of content types to handle

```typescript
json: {
  encoding: 'utf-8',
  limit: '1mb',
  strict: true,
  types: ['application/json', 'application/custom+json']
}
```

## Form Parser

Handles URL-encoded form data (application/x-www-form-urlencoded).

Options:
- encoding: Character encoding (default: utf-8)
- limit: Max request body size (default: 1mb)
- queryString: Configuration for qs package parsing
- types: Array of content types to handle

```typescript
form: {
  encoding: 'utf-8',
  limit: '1mb',
  queryString: {
    depth: 5,
    parameterLimit: 1000
  },
  types: ['application/x-www-form-urlencoded']
}
```

## Multipart Parser

Handles file uploads and multipart form data (multipart/form-data).

Options:
- autoProcess: Auto-move files to temp directory (boolean or array of route patterns)
- processManually: Array of route patterns to exclude from auto-processing
- encoding: Character encoding for text fields (default: utf-8)
- limit: Max total size of all files (default: 20mb)
- fieldsLimit: Max size of all form fields (default: 2mb)
- tmpFileName: Function to generate temp file names
- types: Array of content types to handle

```typescript
multipart: {
  autoProcess: true, // or ['/uploads', '/posts/:id/images']
  processManually: ['/file-manager'],
  encoding: 'utf-8',
  limit: '20mb',
  fieldsLimit: '2mb',
  tmpFileName: () => `upload_${Date.now()}`,
  types: ['multipart/form-data']
}
```

## Raw Parser

Handles custom content types not supported by default parsers. Returns request body as string.

Useful for: XML, YAML, or other specialized formats

```typescript
raw: {
  types: ['application/xml', 'text/xml'],
  limit: '1mb',
  encoding: 'utf-8'
}
```

Create custom middleware to parse the raw body:
```typescript
export default class XmlParserMiddleware {
  async handle({ request }: HttpContext, next: NextFn) {
    if (request.header('content-type')?.includes('xml')) {
      const rawBody = request.raw()
      const parser = new xml2js.Parser()
      const parsed = await parser.parseStringPromise(rawBody)
      request.updateBody(parsed)
    }
    await next()
  }
}
```

## Security: Restricting File Uploads

By default, all POST/PUT/PATCH routes can receive file uploads. Restrict to specific routes:

```typescript
multipart: {
  autoProcess: ['/profile/avatar', '/users/:id', '/projects/:id/files']
}
```

Only listed routes will process multipart requests. All others reject file uploads.

For public file upload endpoints, apply strict rate limiting to prevent abuse.
