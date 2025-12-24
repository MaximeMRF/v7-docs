# REPL

## Overview

Application-aware REPL extending [Node.js REPL](https://nodejs.org/api/repl.html).

**Features**:
- Boots AdonisJS application
- Imports TypeScript files directly
- Access container services without imports
- Custom methods for your application
- Command history

## Starting REPL

```sh
node ace repl
```

Boots application and opens interactive prompt.

## Editor Mode

For multi-line code blocks:

```sh
> (js) .editor
# // Entering editor mode (Ctrl+D to finish, Ctrl+C to cancel)

const users = await User.query()
  .where('isActive', true)
  .orderBy('createdAt', 'desc')
  .limit(10)

console.log(`Found ${users.length} active users`)
# // Press Ctrl+D to execute
```

- `Ctrl+D` = execute
- `Ctrl+C` = cancel without executing

## Accessing Previous Results

### Last Result

```sh
> (js) helpers.string.random(32)
# 'Z3y8QQ4HFpYSc39O2UiazwPeKYdydZ6M'

> (js) _
# 'Z3y8QQ4HFpYSc39O2UiazwPeKYdydZ6M'

> (js) _.length
# 32
```

Use `_` (underscore) to access last result.

### Last Error

```sh
> (js) helpers.string.random()
# Error: The value of "size" is out of range...

> (js) _error.message
# 'The value of "size" is out of range. It must be >= 0 && <= 2147483647. Received NaN'

> (js) _error.stack
# (full error stack trace)
```

Use `_error` to access last exception.

## Command History

Saved in `.adonisjs_v7_repl_history` in home directory.

**Navigation**:
- `↑` / `↓` = cycle through commands
- `Ctrl+R` = reverse search

```sh
> (js) [Press Ctrl+R]
(reverse-i-search)`query': const users = await User.query()
```

Press `Ctrl+R` again to cycle through matches.

## Exiting REPL

```sh
> (js) .exit
# Goodbye!
```

Or press `Ctrl+C` twice.

**Note**: REPL does not auto-reload on code changes. Restart for changes to take effect.

## Importing Modules

Node.js REPL doesn't support `import` statements. Use dynamic `import()`:

```sh
> (js) const { default: User } = await import('#models/user')
# undefined

> (js) await User.all()
# [User, User, User, ...]
```

### importDefault Helper

Simplifies default export imports:

```sh
> (js) const User = await importDefault('#models/user')
# undefined

> (js) const Post = await importDefault('#models/post')
# undefined

> (js) await Post.query().where('published', true)
# [Post, Post, Post, ...]
```

## Helper Methods

View all helpers:

```sh
> (js) .ls

# GLOBAL METHODS:
importDefault         Returns the default export for a module
make                  Make class instance using "container.make" method
loadApp               Load "app" service in the REPL context
loadEncryption        Load "encryption" service in the REPL context
loadHash              Load "hash" service in the REPL context
loadRouter            Load "router" service in the REPL context
loadConfig            Load "config" service in the REPL context
loadTestUtils         Load "testUtils" service in the REPL context
loadHelpers           Load "helpers" module in the REPL context
clear                 Clear a property from the REPL context
p                     Promisify a function. Similar to Node.js "util.promisify"
```

### Loading Services

```sh
> (js) await loadRouter()
# Imported router. You can access it using the "router" property

> (js) router.toJSON()
# { routes: [...], ... }

> (js) await loadHash()
# Imported hash. You can access it using the "hash" property

> (js) await hash.make('secret')
# '$argon2id$v=19$m=65536,t=3,p=4$...'
```

Services loaded as properties in REPL context.

### Making Class Instances

Uses IoC container for dependency injection:

```sh
> (js) const userService = await make('App/Services/UserService')
# undefined

> (js) await userService.findById(1)
# User { id: 1, email: 'user@example.com', ... }
```

Container resolves dependencies automatically.

### Promisifying Functions

```sh
> (js) const readFile = p(fs.readFile)
# undefined

> (js) await readFile('package.json', 'utf8')
# '{ "name": "my-app", ... }'
```

Similar to Node.js `util.promisify`.

## Adding Custom Methods

Define in REPL preload file.

### Create Preload File

```sh
node ace make:preload repl -e=repl
# CREATE: start/repl.ts
```

### Define Custom Method

```ts
import app from '@adonisjs/core/services/app'
import repl from '@adonisjs/core/services/repl'
import { fsImportAll } from '@adonisjs/core/helpers'

repl.addMethod(
  'loadModels',
  async () => {
    // Import all models
    const models = await fsImportAll(app.makePath('app/models'))

    // Make available in REPL context
    repl.server!.context.models = models

    // Notify user
    repl.notify(
      'Imported models. You can access them using the "models" property'
    )

    // Display prompt
    repl.server!.displayPrompt()
  },
  {
    description: 'Load all models from app/models directory',
    usage: 'await loadModels()'
  }
)
```

**Parameters**:
1. Method name
2. Implementation (async function)
3. Options: `description` and `usage` (optional)

### Using Custom Method

```sh
node ace repl

> (js) .ls
# GLOBAL METHODS:
# loadModels            Load all models from app/models directory
# ...

> (js) await loadModels()
# Imported models. You can access them using the "models" property

> (js) Object.keys(models)
# ['User', 'Post', 'Comment', ...]

> (js) await models.User.all()
# [User, User, User, ...]
```

Restart REPL after adding custom methods.
