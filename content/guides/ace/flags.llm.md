# Command Flags

## Overview

Flags are optional or named parameters specified with `--` (full name) or `-` (alias).

**Characteristics**:
- Can appear in any order
- Can be omitted if optional
- Ideal for customizing command behavior

```sh
node ace make:controller users --resource --singular
```

## Flag Types

### Boolean Flags

On/off options, no value required:

```ts
import { BaseCommand, flags } from '@adonisjs/core/ace'

export default class MakeControllerCommand extends BaseCommand {
  @flags.boolean()
  declare resource: boolean

  async run() {
    if (this.resource) {
      this.logger.info('Creating a resource controller')
    }
  }
}
```

**Values**:
- Mentioned: `true`
- Omitted: `undefined`
- Negated with `--no-`: `false`

```sh
node ace make:controller users --resource      # true
node ace make:controller users                 # undefined
node ace make:controller users --no-resource   # false
```

**Show negated variant in help**:
```ts
@flags.boolean({
  showNegatedVariantInHelp: true,
})
declare resource: boolean
```

### String Flags

Accept text values:

```ts
@flags.string()
declare model: string
```

```sh
node ace make:controller users --model user
node ace make:controller users --model=user
# Both: this.model = 'user'

# Spaces require quotes
node ace make:controller posts --model "blog user"
```

**Error if mentioned without value**:
```sh
node ace make:controller users --model
# Error: Missing value for flag --model
```

### Number Flags

Validate numeric input:

```ts
@flags.number()
declare score: number
```

```sh
node ace create:user --score 100   # this.score = 100
node ace create:user --score abc   # Error: must be valid number
```

### Array Flags

Collect multiple values:

```ts
@flags.array()
declare groups: string[]
```

```sh
node ace create:user --groups=admin --groups=moderators --groups=creators
# this.groups = ['admin', 'moderators', 'creators']
```

## Customization

### Flag Name and Description

```ts
@flags.boolean({
  flagName: 'server',
  description: 'Start the application server after the build'
})
declare startServer: boolean
```

- Default: property name converted to dashed-case
- Custom: use `flagName` option

### Flag Aliases

Single-character shortcuts:

```ts
@flags.boolean({
  alias: 'r',
  description: 'Generate a resource controller'
})
declare resource: boolean
```

```sh
node ace make:controller users --resource --singular
node ace make:controller users -r -s
node ace make:controller users -rs  # Combined aliases
```

### Default Values

```ts
@flags.boolean({
  default: true,
  description: 'Start the application server after build'
})
declare startServer: boolean

@flags.string({
  default: 'sqlite',
  description: 'Database connection to use'
})
declare connection: string
```

## Transforming Flag Values

Use `parse` method for validation and transformation:

```ts
@flags.string({
  description: 'Database connection to use',
  parse(value) {
    const connections = {
      pg: 'postgresql://localhost/myapp',
      mysql: 'mysql://localhost/myapp',
      sqlite: 'sqlite://./database.sqlite'
    }
    return value ? connections[value] || value : value
  }
})
declare connection: string
```

**Validation example**:
```ts
@flags.string({
  description: 'Deployment environment',
  parse(value) {
    const validEnvironments = ['development', 'staging', 'production']
    if (value && !validEnvironments.includes(value)) {
      throw new Error(`Environment must be one of: ${validEnvironments.join(', ')}`)
    }
    return value
  }
})
declare environment: string
```

## Accessing All Flags

```ts
export default class MakeControllerCommand extends BaseCommand {
  @flags.boolean()
  declare resource: boolean

  @flags.boolean()
  declare singular: boolean

  async run() {
    console.log(this.parsed.flags)
    // { resource: true, singular: false }

    // Unknown flags (when allowUnknownFlags is true)
    console.log(this.parsed.unknownFlags)
    // ['--some-unknown-flag']
  }
}
```
