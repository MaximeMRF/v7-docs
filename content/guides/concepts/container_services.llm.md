# Container Services

## Overview

Container services provide convenient ES module imports for framework components, eliminating manual dependency resolution.

## Core Concepts

- **What they are**: Pre-configured singleton instances exported by AdonisJS packages
- **How they work**: Internally use IoC container's `make()` method and export the resolved instance
- **Purpose**: Simplify access to framework functionality without manual class construction or container interaction
- **Availability**: Automatic when packages installed, no registration required

## Usage Patterns

### Without Container Services

Manual construction:
```ts
import { Router } from '@adonisjs/core/http'
export const router = new Router(/** Router dependencies */)
```

Using container directly:
```ts
import app from '@adonisjs/core/services/app'
import { Router } from '@adonisjs/core/http'
export const router = await app.make(Router)
```

### With Container Services

```ts
import router from '@adonisjs/core/services/router'
import hash from '@adonisjs/core/services/hash'
import logger from '@adonisjs/core/services/logger'
```

## Examples

### Using Drive Service

```ts
import drive from '@adonisjs/drive/services/main'

export class PostsController {
  async store(post: Post, coverImage: File) {
    const coverImageName = 'random_name.jpg'
    const disk = drive.use('s3')
    await disk.put(coverImageName, coverImage)

    post.coverImage = coverImageName
    await post.save()
  }
}
```

### Dependency Injection Alternative

For better testability:

```ts
import { Disk } from '@adonisjs/drive'
import { inject } from '@adonisjs/core'

@inject()
export class PostService {
  constructor(protected disk: Disk) {}

  async save(post: Post, coverImage: File) {
    const coverImageName = 'random_name.jpg'
    await this.disk.put(coverImageName, coverImage)

    post.coverImage = coverImageName
    await post.save()
  }
}
```

**When to use DI**: Better for testing, decouples business logic from framework specifics

## Available Services

| Binding | Class | Import Path |
|---------|-------|-------------|
| `app` | Application | `@adonisjs/core/services/app` |
| `ace` | Kernel | `@adonisjs/core/services/kernel` |
| `config` | Config | `@adonisjs/core/services/config` |
| `encryption` | Encryption | `@adonisjs/core/services/encryption` |
| `emitter` | Emitter | `@adonisjs/core/services/emitter` |
| `hash` | HashManager | `@adonisjs/core/services/hash` |
| `logger` | LoggerManager | `@adonisjs/core/services/logger` |
| `repl` | Repl | `@adonisjs/core/services/repl` |
| `router` | Router | `@adonisjs/core/services/router` |
| `server` | Server | `@adonisjs/core/services/server` |
| `testUtils` | TestUtils | `@adonisjs/core/services/test_utils` |

## Creating Custom Services

Pattern for packages:

```ts
import app from '@adonisjs/core/services/app'

let drive: DriveManager

await app.booted(async () => {
  drive = await app.container.make('drive')
})

export { drive as default }
```

**Key requirements**:
- Wait for `app.booted()` before resolving bindings
- Ensures service providers have registered dependencies
- Export resolved instance as default

## Reference

Full implementation example: [Drive service on GitHub](https://github.com/adonisjs/drive/blob/4.x/services/main.ts#L19-L21)
