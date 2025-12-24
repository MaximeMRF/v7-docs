# Creating Commands

## Creating a Command

```sh
node ace make:command greet
# CREATE: commands/greet.ts
```

**Minimum requirements**:
- Extend `BaseCommand`
- Define `commandName`
- Implement `run` method

```ts
import { BaseCommand } from '@adonisjs/core/ace'

export default class GreetCommand extends BaseCommand {
  static commandName = 'greet'
  static description = 'Greet a user by name'

  async run() {
    this.logger.info('Hello world!')
  }
}
```

Execution:
```sh
node ace greet
```

## Command Metadata

### Command Name

```ts
static commandName = 'greet'
```

- No spaces allowed
- Can use namespaces: `make:controller`
- Namespaces organize related commands

### Description

```ts
static description = 'Greet a user by name'
```

Appears in command list and help screen.

### Help Text

```ts
static help = [
  'The greet command is used to greet a user by name',
  '',
  'You can also send flowers to a user, if they have an updated address',
  '{{ binaryName }} greet --send-flowers',
]
```

- Array of strings (one per line)
- `{{ binaryName }}` = substitutes to `node ace`

### Aliases

```ts
static aliases = ['welcome', 'sayhi']
```

```sh
node ace greet
node ace welcome
node ace sayhi
```

## Command Options

```ts
import type { CommandOptions } from '@adonisjs/core/types/ace'

static options: CommandOptions = {
  startApp: false,
  allowUnknownFlags: false,
  staysAlive: false,
}
```

### startApp

**Default**: `false`

```ts
static options: CommandOptions = {
  startApp: true
}

async run() {
  // Can now access models and services
  const users = await User.all()
}
```

Set to `true` when command needs application resources (models, services, etc.).

### allowUnknownFlags

**Default**: `false`

```ts
static options: CommandOptions = {
  allowUnknownFlags: true
}
```

- Allows passing undefined flags
- Useful for proxy commands that forward flags to external tools

### staysAlive

**Default**: `false`

```ts
static options: CommandOptions = {
  startApp: true,
  staysAlive: true
}

async run() {
  await this.startJobProcessor()
}
```

- Prevents automatic termination
- Required for long-running commands (workers, servers)

## Lifecycle Methods

Execution order:

```ts
export default class GreetCommand extends BaseCommand {
  // 1. First - initialization
  async prepare() {
    console.log('preparing')
  }

  // 2. Second - user interaction
  async interact() {
    console.log('interacting')
  }

  // 3. Third - main logic
  async run() {
    console.log('running')
  }

  // 4. Last - cleanup
  async completed() {
    console.log('completed')
  }
}
```

| Method | Purpose |
|--------|---------|
| `prepare` | Initialize state/data |
| `interact` | Display prompts, collect input |
| `run` | Main command logic |
| `completed` | Cleanup, error handling |

Only implement methods you need.

## Dependency Injection

Inject dependencies into any lifecycle method:

```ts
import { inject } from '@adonisjs/core'
import { BaseCommand } from '@adonisjs/core/ace'
import UserService from '#services/user_service'

export default class GreetCommand extends BaseCommand {
  @inject()
  async prepare(userService: UserService) {
    // Use injected service
  }

  @inject()
  async run(userService: UserService) {
    // Dependencies automatically resolved
  }
}
```

Container handles dependency resolution automatically.

## Error Handling

### Default Behavior

- Exception thrown → error logged, exit code = 1
- Exit code 1 = failure for shell/CI/CD

### Try/Catch

```ts
async run() {
  try {
    await runSomeOperation()
  } catch (error) {
    this.logger.error(error.message)
    this.error = error
    this.exitCode = 1
  }
}
```

### Completed Method

```ts
async run() {
  await runSomeOperation() // May throw
}

async completed() {
  if (this.error) {
    this.logger.error(this.error.message)
    return true  // Prevents Ace from logging error again
  }
}
```

## Terminating Long-Running Commands

For `staysAlive: true` commands:

```ts
import type { CommandOptions } from '@adonisjs/core/types/ace'

export default class MonitorRedisCommand extends BaseCommand {
  static options: CommandOptions = {
    startApp: true,
    staysAlive: true
  }

  async run() {
    const redis = createRedisConnection()

    redis.on('error', (error) => {
      this.logger.error(error)
      this.terminate()  // Explicitly terminate
    })

    redis.monitor()
  }
}
```

## Cleanup Before Termination

Handle SIGTERM, Ctrl+C, etc.:

```ts
import type { CommandOptions } from '@adonisjs/core/types/ace'

export default class QueueWorkerCommand extends BaseCommand {
  static options: CommandOptions = {
    startApp: true,
    staysAlive: true
  }

  prepare() {
    this.app.terminating(() => {
      this.logger.info('Shutting down gracefully...')
      // Close connections, flush logs, etc.
    })
  }

  async run() {
    await this.processJobs()
  }
}
```

Register `terminating` hook in `prepare` method for cleanup logic.
