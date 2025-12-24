# Ace Command Line

## Overview

Ace is AdonisJS's command line framework for creating and running console commands.

**Key features**:
- Command parsing and argument validation
- Interactive prompts
- Terminal output formatting
- Included by default via `ace.js` entry point

## Running Commands

```sh
node ace
node ace make:controller
node ace migration:run
```

**Important**: Do not modify `ace.js` directly. Use `bin/console.ts` for custom initialization code.

## Viewing Available Commands

```sh
node ace
# or
node ace list
```

- Displays all registered commands organized by category
- Follows [docopt](http://docopt.org/) standard

## Command Help

```sh
node ace make:controller --help
```

Shows: description, arguments, flags, usage examples

## Color Output Control

```sh
# Disable colors
node ace list --no-ansi

# Force enable colors
node ace list --ansi
```

- Auto-detects terminal ANSI color support
- Useful for CI/CD environments or file redirection

## Command Aliases

Define shortcuts in `adonisrc.ts`:

```ts
export default defineConfig({
  commandsAliases: {
    resource: 'make:controller --resource --singular'
  }
})
```

Usage:
```sh
node ace resource users
# Expands to: node ace make:controller --resource --singular users
```

**Expansion process**:
1. Check if command name matches alias
2. Extract first word from alias value
3. Append remaining segments
4. Append user-provided arguments/flags

## Running Commands Programmatically

```ts
import ace from '@adonisjs/core/services/ace'

// Execute a command
const command = await ace.exec('make:controller', [
  'users',
  '--resource',
])

// Check results
console.log(command.exitCode) // 0 = success, 1 = failure
console.log(command.result)
console.log(command.error)
```

**Check command exists before execution**:

```ts
import ace from '@adonisjs/core/services/ace'

await ace.boot()

if (ace.hasCommand('make:controller')) {
  await ace.exec('make:controller', ['users', '--resource'])
} else {
  console.log('Controller command not available')
}
```

**Note**: `ace.boot()` loads all registered commands for verification.
