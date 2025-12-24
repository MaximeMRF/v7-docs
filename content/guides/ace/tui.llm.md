# Terminal UI

## Overview

Powered by [@poppinss/cliui](https://github.com/poppinss/cliui) for rich terminal output.

**Features**:
- Logs with severity levels
- Tables with custom alignment
- Loading animations
- Task runners with progress
- Testing-friendly (raw mode for assertions)

## Log Messages

```ts
import { BaseCommand } from '@adonisjs/core/ace'

export default class DeployCommand extends BaseCommand {
  static commandName = 'deploy'

  async run() {
    this.logger.debug('Loading deployment configuration')
    this.logger.info('Deploying application to production')
    this.logger.success('Deployment completed successfully')
    this.logger.warning('SSL certificate expires in 30 days')
    this.logger.error(new Error('Failed to upload assets'))
    this.logger.fatal(new Error('Deployment failed completely'))
  }
}
```

**Note**: `error` and `fatal` write to stderr.

### Prefix and Suffix

```ts
this.logger.info('Installing packages', {
  suffix: 'npm i --production'
})

this.logger.info('Starting worker', {
  prefix: process.pid
})
```

Both displayed with reduced opacity.

### Loading Animations

```ts
const animation = this.logger.await('Installing packages', {
  suffix: 'npm i'
})

animation.start()

setTimeout(() => {
  animation.update('Unpacking packages', {
    suffix: undefined
  })
}, 2000)

setTimeout(() => {
  animation.stop()
  this.logger.success('Installation complete')
}, 4000)
```

### Action Status

```ts
const createFile = this.logger.action('creating config/auth.ts')

try {
  await this.createConfigFile()
  createFile.displayDuration().succeeded()
} catch (error) {
  createFile.failed(error)
}
```

**Three states**:
```ts
action.succeeded()
action.skipped('File already exists')
action.failed(new Error('Permission denied'))
```

## Text Formatting

Uses [kleur](https://www.npmjs.com/package/kleur) for ANSI colors:

```ts
import { BaseCommand } from '@adonisjs/core/ace'

export default class StatusCommand extends BaseCommand {
  static commandName = 'status'

  async run() {
    // Foreground colors
    this.logger.info(this.colors.red('[ERROR]'))
    this.logger.info(this.colors.green('[SUCCESS]'))
    this.logger.info(this.colors.yellow('[WARNING]'))

    // Background + foreground
    this.logger.info(this.colors.bgGreen().white(' CREATED '))
    this.logger.info(this.colors.bgRed().white(' FAILED '))

    // Text styles
    this.logger.info(this.colors.bold('Important message'))
    this.logger.info(this.colors.dim('Less important details'))
  }
}
```

## Tables

```ts
import { BaseCommand } from '@adonisjs/core/ace'

export default class ListMigrationsCommand extends BaseCommand {
  static commandName = 'migration:list'

  async run() {
    const table = this.ui.table()

    table.head([
      'Migration',
      'Duration',
      'Status',
    ])

    table.row([
      '1590591892626_tenants.ts',
      '2ms',
      'DONE'
    ])

    table.row([
      '1590595949171_entities.ts',
      '2ms',
      'DONE'
    ])

    table.render()
  }
}
```

### Colored Cells

```ts
table.row([
  '1590595949171_entities.ts',
  '2ms',
  this.colors.green('DONE')
])

table.row([
  '1590595949172_users.ts',
  '5ms',
  this.colors.red('FAILED')
])
```

### Right-Align Columns

```ts
// Right-align header
table.head([
  'Migration',
  'Batch',
  {
    content: 'Status',
    hAlign: 'right'
  },
])

// Right-align data
table.row([
  '1590595949171_entities.ts',
  '2',
  {
    content: this.colors.green('DONE'),
    hAlign: 'right'
  }
])
```

### Full-Width Tables

```ts
// Render at full terminal width
table.fullWidth().render()

// Change which column expands
table
  .fullWidth()
  .fluidColumnIndex(1)  // Second column (index 1) expands
  .render()
```

**Default**: First column is fluid in full-width mode.

## Boxed Content (Stickers)

```ts
import { BaseCommand } from '@adonisjs/core/ace'

export default class ServeCommand extends BaseCommand {
  static commandName = 'serve'

  async run() {
    const sticker = this.ui.sticker()

    sticker
      .add('Started HTTP server')
      .add('')
      .add(`Local address:   ${this.colors.cyan('http://localhost:3333')}`)
      .add(`Network address: ${this.colors.cyan('http://192.168.1.2:3333')}`)
      .render()
  }
}
```

### Instructions

For step-by-step guides (prefixed with `>`):

```ts
const instructions = this.ui.instructions()

instructions
  .add('Run npm install to install dependencies')
  .add('Copy .env.example to .env and configure your environment')
  .add('Run node ace migrate to set up the database')
  .render()
```

## Animated Task Runners

**Two modes**:
- Minimal (production): Only current task expanded
- Verbose (debugging): All progress messages logged

```ts
import { BaseCommand } from '@adonisjs/core/ace'

export default class SetupCommand extends BaseCommand {
  static commandName = 'setup'

  async run() {
    const tasks = this.ui.tasks()

    await tasks
      .add('clone repo', async (task) => {
        await this.cloneRepository()
        return 'Completed'
      })
      .add('update package file', async (task) => {
        try {
          await this.updatePackageFile()
          return 'Updated'
        } catch (error) {
          return task.error('Unable to update package file')
        }
      })
      .add('install dependencies', async (task) => {
        await this.installDependencies()
        return 'Installed'
      })
      .run()
  }
}
```

**Return values**:
- String = success
- `task.error(message)` = failure
- Thrown exception = failure

### Reporting Progress

```ts
const sleep = () => new Promise<void>((resolve) => setTimeout(resolve, 50))

const tasks = this.ui.tasks()

await tasks
  .add('clone repo', async (task) => {
    for (let i = 0; i <= 100; i = i + 2) {
      await sleep()
      task.update(`Downloaded ${i}%`)
    }
    return 'Completed'
  })
  .run()
```

**Important**: Use `task.update()` instead of `console.log` or `this.logger`.

### Verbose Mode

```ts
import { BaseCommand, flags } from '@adonisjs/core/ace'

export default class DeployCommand extends BaseCommand {
  static commandName = 'deploy'

  @flags.boolean({
    description: 'Enable verbose output'
  })
  declare verbose: boolean

  async run() {
    const tasks = this.ui.tasks({
      verbose: this.verbose
    })

    await tasks
      .add('build assets', async (task) => {
        // Task implementation
      })
      .run()
  }
}
```

```sh
node ace deploy --verbose
```

Enables detailed progress logs for debugging.
