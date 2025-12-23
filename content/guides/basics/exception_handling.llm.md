# Exception Handling

AdonisJS provides centralized exception handling through a global exception handler that converts errors into HTTP responses.

## Global Exception Handler

Located at `app/exceptions/handler.ts`, extends `ExceptionHandler` class with two primary methods:

- `handle` - Converts errors into HTTP responses
- `report` - Logs errors or sends to monitoring services

```typescript
import app from '@adonisjs/core/services/app'
import { HttpContext, ExceptionHandler } from '@adonisjs/core/http'

export default class HttpExceptionHandler extends ExceptionHandler {
  protected debug = !app.inProduction
  protected renderStatusPages = app.inProduction

  async handle(error: unknown, ctx: HttpContext) {
    return super.handle(error, ctx)
  }

  async report(error: unknown, ctx: HttpContext) {
    return super.report(error, ctx)
  }
}
```

## Handling Specific Error Types

Check error type and provide custom handling:
```typescript
import { errors as vineJSErrors } from '@vinejs/vine'

export default class HttpExceptionHandler extends ExceptionHandler {
  async handle(error: unknown, ctx: HttpContext) {
    if (error instanceof vineJSErrors.E_VALIDATION_ERROR) {
      ctx.response.status(422).send(error.messages)
      return
    }
    return super.handle(error, ctx)
  }
}
```

## Debug Mode

`debug` property controls error display:
- When `true`: Shows Youch error pages with stack traces, code context
- When `false`: Returns simple JSON/text responses without implementation details
- Default: `!app.inProduction` (enabled in dev, disabled in production)

## Status Pages

Custom HTML pages for specific status codes:
```typescript
protected statusPages = {
  '404': (error, { view }) => {
    return view.render('pages/errors/not_found', { error })
  },
  '500..599': (error, { view }) => {
    return view.render('pages/errors/server_error', { error })
  }
}
```

Only rendered when `renderStatusPages` is `true`. Default: enabled in production.

## Reporting Errors

Override `report` for custom logging:
```typescript
async report(error: unknown, ctx: HttpContext) {
  await super.report(error, ctx)
  // Add custom reporting: Sentry, Bugsnag, etc.
}
```

### Adding Context

```typescript
protected context(ctx: HttpContext) {
  return {
    requestId: ctx.request.id(),
    userId: ctx.auth.user?.id,
    ip: ctx.request.ip()
  }
}
```

### Ignoring Errors

```typescript
protected ignoreStatuses = [400, 401, 403, 404, 422]
protected ignoreCodes = ['E_VALIDATION_ERROR', 'E_UNAUTHORIZED_ACCESS']
```

Check before reporting:
```typescript
async report(error: unknown, ctx: HttpContext) {
  const httpError = this.toHttpError(error)

  if (this.shouldReport(httpError)) {
    // Your custom reporting logic
  }
}
```

## Custom Exceptions

Create specialized error classes:
```bash
node ace make:exception PaymentFailed
```

Implement custom handling:
```typescript
import { Exception } from '@adonisjs/core/exceptions'
import { HttpContext } from '@adonisjs/core/http'

export default class PaymentFailedException extends Exception {
  static status = 400

  handle(error: this, { response }: HttpContext) {
    return response
      .status(error.constructor.status)
      .send('Unable to process payment. Please try again')
  }

  report(error: this, { logger, auth }: HttpContext) {
    logger.error(
      { user: auth.user },
      'Payment failed for user %s',
      auth.user?.id
    )
  }
}
```

When thrown, AdonisJS automatically calls `handle()` and `report()` methods, bypassing global exception handler.

## Configuration Options

- `debug` (boolean) - Display detailed error pages with stack traces
- `renderStatusPages` (boolean) - Render custom HTML pages for status codes
- `statusPages` (Record) - Maps status codes/ranges to view callbacks
- `ignoreStatuses` (number[]) - Status codes not reported
- `ignoreCodes` (string[]) - Error codes not reported
