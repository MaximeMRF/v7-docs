# Prompts

## Overview

Terminal widgets for interactive user input, powered by [@poppinss/prompts](https://github.com/poppinss/prompts).

**Features**:
- Text, password, select, multi-select, autocomplete
- Validation and transformation support
- Testing-friendly (trap and respond programmatically)

## Text Input

```ts
import { BaseCommand } from '@adonisjs/core/ace'

export default class MakeModelCommand extends BaseCommand {
  static commandName = 'make:model'

  async run() {
    const modelName = await this.prompt.ask('Enter the model name')
    this.logger.info(`Creating model: ${modelName}`)
  }
}
```

### Validation

```ts
const modelName = await this.prompt.ask('Enter the model name', {
  validate(value) {
    return value.length > 0
      ? true
      : 'Model name is required'
  }
})
```

- Return `true` to accept
- Return error message string to reject
- Re-prompts until valid

### Default Values

```ts
const modelName = await this.prompt.ask('Enter the model name', {
  default: 'User'
})
```

## Password Input

Masks input (asterisks/bullets):

```ts
import { BaseCommand } from '@adonisjs/core/ace'

export default class SetupCommand extends BaseCommand {
  static commandName = 'setup'

  async run() {
    const password = await this.prompt.secure('Enter database password')
    this.logger.info('Password collected securely')
  }
}
```

**With validation**:
```ts
const password = await this.prompt.secure('Enter account password', {
  validate(value) {
    return value.length >= 8
      ? true
      : 'Password must be at least 8 characters long'
  }
})
```

## Choice Lists (Single Select)

```ts
import { BaseCommand } from '@adonisjs/core/ace'

export default class ConfigureCommand extends BaseCommand {
  static commandName = 'configure'

  async run() {
    const packageManager = await this.prompt.choice('Select package manager', [
      'npm',
      'yarn',
      'pnpm'
    ])

    this.logger.info(`Using ${packageManager}`)
  }
}
```

### Custom Display Text

```ts
const driver = await this.prompt.choice('Select database driver', [
  {
    name: 'sqlite',
    message: 'SQLite'
  },
  {
    name: 'mysql',
    message: 'MySQL'
  },
  {
    name: 'pg',
    message: 'PostgreSQL'
  }
])

// Returns 'name' value, displays 'message'
```

## Multi-Select

Use spacebar to toggle selections:

```ts
import { BaseCommand } from '@adonisjs/core/ace'

export default class InstallCommand extends BaseCommand {
  static commandName = 'install:packages'

  async run() {
    const drivers = await this.prompt.multiple('Select database drivers', [
      { name: 'sqlite', message: 'SQLite' },
      { name: 'mysql', message: 'MySQL' },
      { name: 'pg', message: 'PostgreSQL' }
    ])

    this.logger.info(`Installing drivers: ${drivers.join(', ')}`)
  }
}
```

Returns array of selected values.

## Confirmation

Yes/no questions:

```ts
import { BaseCommand } from '@adonisjs/core/ace'

export default class ResetCommand extends BaseCommand {
  static commandName = 'db:reset'

  async run() {
    const shouldDelete = await this.prompt.confirm(
      'Want to delete all files?'
    )

    if (shouldDelete) {
      this.logger.warning('Deleting all files...')
    } else {
      this.logger.info('Operation cancelled')
    }
  }
}
```

Returns boolean.

### Custom Labels (Toggle)

```ts
const shouldDelete = await this.prompt.toggle(
  'Want to delete all files?',
  ['Yup', 'Nope']
)
```

## Autocomplete

Searchable lists with fuzzy search:

```ts
import { BaseCommand } from '@adonisjs/core/ace'

export default class SelectCityCommand extends BaseCommand {
  static commandName = 'select:city'

  async run() {
    const selectedCity = await this.prompt.autocomplete(
      'Select your city',
      await this.getCitiesList()
    )

    this.logger.info(`You selected: ${selectedCity}`)
  }

  private async getCitiesList() {
    return [
      'New York',
      'Los Angeles',
      'Chicago',
      'Houston',
      // ... hundreds more
    ]
  }
}
```

## Prompt Options

Common options for all prompt types:

| Option | Prompts | Description |
|--------|---------|-------------|
| `default` | All | Default value when no input provided |
| `name` | All | Unique identifier for testing |
| `hint` | All | Help text displayed next to prompt |
| `result` | All | Transform return value |
| `format` | All | Format display value (visual only) |
| `validate` | All | Validate input (return `true` or error string) |
| `limit` | `autocomplete` | Limit displayed options |

### Transform Return Values

```ts
const modelName = await this.prompt.ask('Enter the model name', {
  result(value) {
    // Convert to PascalCase
    return value.charAt(0).toUpperCase() + value.slice(1)
  }
})
```

### Format Display Values

```ts
const email = await this.prompt.ask('Enter your email', {
  format(value) {
    // Display in lowercase (doesn't affect return value)
    return value.toLowerCase()
  }
})
```

### Hints

```ts
const tableName = await this.prompt.ask('Enter table name', {
  hint: 'Use plural form (e.g., users, posts)'
})
```

Displayed next to prompt for additional context.
