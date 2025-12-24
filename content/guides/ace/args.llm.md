# Command Arguments

## Overview

Arguments are positional values provided after command name.

**Key differences from flags**:
- Must be in exact order
- Ideal for required input (filenames, resource names, IDs)

```sh
node ace make:controller users --resource
#                        ^^^^^ argument
#                                ^^^^^^^^^ flag
```

## Defining Arguments

Use `@args` decorator on class properties:

```ts
import { BaseCommand, args } from '@adonisjs/core/ace'

export default class GreetCommand extends BaseCommand {
  static commandName = 'greet'
  static description = 'Greet a user by name'

  @args.string()
  declare name: string

  async run() {
    this.logger.info(`Hello, ${this.name}!`)
  }
}
```

```sh
node ace greet John
# Output: Hello, John!
```

**Order matters**: Arguments accepted in property definition order.

## Multiple Values (Spread)

Accept multiple values for single argument:

```ts
import { BaseCommand, args } from '@adonisjs/core/ace'

export default class GreetCommand extends BaseCommand {
  static commandName = 'greet'
  static description = 'Greet multiple users by name'

  @args.spread()
  declare names: string[]

  async run() {
    this.names.forEach((name) => {
      this.logger.info(`Hello, ${name}!`)
    })
  }
}
```

```sh
node ace greet John Jane Bob
# Output:
# Hello, John!
# Hello, Jane!
# Hello, Bob!
```

**Restriction**: Spread argument must be last.

## Customization

### Argument Name and Description

```ts
@args.string({
  argumentName: 'user-name',
  description: 'Name of the user to greet'
})
declare name: string
```

- Default: property name → dashed-case
- Appears in help screens and error messages

## Optional Arguments

```ts
import { BaseCommand, args } from '@adonisjs/core/ace'

export default class GreetCommand extends BaseCommand {
  static commandName = 'greet'

  @args.string({
    description: 'Name of the user to greet'
  })
  declare name: string

  @args.string({
    description: 'Custom greeting message',
    required: false,
  })
  declare message?: string

  async run() {
    const greeting = this.message || 'Hello'
    this.logger.info(`${greeting}, ${this.name}!`)
  }
}
```

```sh
node ace greet John
# Output: Hello, John!

node ace greet John "Good morning"
# Output: Good morning, John!
```

**Ordering rule**: Optional arguments must come after required arguments.

### Default Values

```ts
@args.string({
  description: 'Name of the user to greet',
  required: false,
  default: 'guest'
})
declare name: string
```

```sh
node ace greet
# Uses default: "guest"
# Output: Hello, guest!
```

## Transforming Values

Use `parse` method for transformation/validation:

```ts
@args.string({
  argumentName: 'user-name',
  description: 'Name of the user to greet',
  parse(value) {
    return value ? value.toUpperCase() : value
  }
})
declare name: string
```

```sh
node ace greet john
# Transformed to "JOHN"
# Output: Hello, JOHN!
```

**Validation example**:
```ts
@args.string({
  description: 'Email address of the user',
  parse(value) {
    if (!value.includes('@')) {
      throw new Error('Please provide a valid email address')
    }
    return value.toLowerCase()
  }
})
declare email: string
```

## Accessing All Arguments

```ts
import { BaseCommand, args } from '@adonisjs/core/ace'

export default class GreetCommand extends BaseCommand {
  static commandName = 'greet'

  @args.string()
  declare name: string

  async run() {
    console.log(this.parsed.args)
    // Output: { name: 'John' }

    this.logger.info(`Hello, ${this.name}!`)
  }
}
```

Access via `this.parsed.args` for debugging or inspection.
