# Configuration

This guide covers configuration in AdonisJS applications. You will learn about:

- Config files in the `config` directory
- Environment variables and the `.env` file
- The `adonisrc.ts` file for framework configuration

## Overview

Configuration in AdonisJS is organized into three distinct systems, each serving a specific purpose.

- **Config files** contain your application settings. These files live in the `config` directory and define things like database connections, mail settings, and session configuration.

- **Environment variables** stored in the `.env` file hold runtime secrets and values that change between environments. API keys, database passwords, and environment-specific URLs belong here.

- **The adonisrc.ts file** configures the framework itself. It tells AdonisJS how your workspace is organized, which providers to load, and which commands are available.

## Configuration files

Configuration files live in the `config` directory at the root of your project. Each file exports a configuration object for a specific part of your application (database connections, mail settings, authentication, session handling, and so on).

A typical AdonisJS project includes several config files out of the box. The `config/database.ts` file configures database connections, `config/mail.ts` handles email delivery, and `config/auth.ts` defines authentication settings.

Here's what a database configuration file looks like.

```ts title="config/database.ts"
import app from '@adonisjs/core/services/app'
import { defineConfig } from '@adonisjs/lucid'

const dbConfig = defineConfig({
  connection: 'sqlite',
  prettyPrintDebugQueries: true,
  connections: {
    sqlite: {
      client: 'better-sqlite3',
      connection: {
        filename: app.tmpPath('db.sqlite3'),
      },
      useNullAsDefault: true,
      migrations: {
        naturalSort: true,
        paths: ['database/migrations'],
      },
      debug: app.inDev,
    },
  },
})

export default dbConfig
```

Mail configuration follows a similar pattern.

```ts title="config/mail.ts"
import env from '#start/env'
import { defineConfig, transports } from '@adonisjs/mail'

const mailConfig = defineConfig({
  default: env.get('MAIL_MAILER'),

  from: {
    address: env.get('MAIL_FROM_ADDRESS'),
    name: env.get('MAIL_FROM_NAME'),
  },

  mailers: {
    resend: transports.resend({
      key: env.get('RESEND_API_KEY'),
      baseUrl: 'https://api.resend.com',
    }),
  },
})

export default mailConfig

declare module '@adonisjs/mail/types' {
  export interface MailersList extends InferMailers<typeof mailConfig> {}
}
```

Notice how this config file references environment variables through `env.get()`. This is the correct way to use environment-specific values in your configuration. The config file defines the structure and defaults, while the `.env` file provides the actual values.

### When config files are loaded

Configuration files are loaded during the application boot cycle, before your routes and controllers are ready. This means you should keep config files simple and avoid importing application-level code like models, services, or controllers. 

Config files should only import framework utilities, define configuration objects, and reference environment variables. Importing application code creates circular dependencies and will cause your app to fail during startup.

## Environment variables

Environment variables store secrets and configuration that varies between environments. During development, you define these variables in the `.env` file. In production, you must define them through your hosting provider's UI or configuration interface.

A typical `.env` file looks like this:

```bash title=".env"
HOST=0.0.0.0
PORT=3333
APP_KEY=your-secret-app-key-here
MAIL_MAILER=resend
MAIL_FROM_ADDRESS=hello@example.com
MAIL_FROM_NAME=My App
RESEND_API_KEY=re_your_api_key_here
```

The `.env` file is already listed in `.gitignore` in AdonisJS starter kits, so you won't accidentally commit secrets to your repository.

### The APP_KEY

The `APP_KEY` is a special environment variable that AdonisJS uses for encrypting cookies, signing sessions, and other cryptographic operations. Every AdonisJS application requires an APP_KEY to function securely.

Run the `generate:key` command to create your APP_KEY.

```bash
node ace generate:key
```

This creates a cryptographically secure random key and adds it to your `.env` file automatically.

The APP_KEY must remain secret. Anyone with access to this key can decrypt your application's encrypted data and forge session tokens. When you deploy to production, use a different APP_KEY for each environment (development, staging, production). Never reuse keys across environments.

If your APP_KEY is compromised, generate a new one immediately. This will invalidate all existing user sessions and encrypted data.

### Using environment variables in config files

Config files access environment variables through the `env` service, which provides type-safe access to your `.env` file values. You import the env service and call `env.get()` with the variable name.

```ts
import env from '#start/env'

const apiKey = env.get('RESEND_API_KEY')
```

This pattern keeps your configuration organized and validated. The env service ensures required variables are present and throws clear errors if they're missing.

You should never access environment variables directly in your controllers, services, or other application code. Always access them through config files. This creates a single source of truth for configuration.

### Environment variables validation

AdonisJS validates environment variables during application startup using the `start/env.ts` file. This file defines which environment variables your application expects and their types, ensuring your app won't start with missing or invalid configuration.

See the [Environment variables validation guide](../guides/config/environment_variables.md) for detailed information on adding validation and type-safety to your environment variables.

## The adonisrc.ts file

The `adonisrc.ts` file configures the framework itself, not your application. While config files define your app's behavior and `.env` stores secrets, `adonisrc.ts` tells AdonisJS how your workspace is structured and which framework features to load.

You rarely need to modify this file directly. Most operations that require changes to `adonisrc.ts` are handled automatically by Ace commands. When you run `node ace make:provider` or `node ace make:command`, those commands register the new provider or command in your `adonisrc.ts` file for you.

Here's what a basic `adonisrc.ts` file contains:

```ts title="adonisrc.ts"
import { defineConfig } from '@adonisjs/core/app'

export default defineConfig({
  commands: [
    () => import('@adonisjs/core/commands'),
    () => import('@adonisjs/lucid/commands'),
  ],

  providers: [
    () => import('@adonisjs/core/providers/app_provider'),
    () => import('@adonisjs/core/providers/hash_provider'),
    () => import('@adonisjs/core/providers/vinejs_provider'),
    () => import('@adonisjs/session/session_provider'),
    () => import('@adonisjs/lucid/database_provider'),
    () => import('@adonisjs/auth/auth_provider'),
  ],

  preloads: [
    () => import('#start/routes'),
    () => import('#start/kernel')
  ],

  hooks: {
    buildStarting: [
      () => import('@adonisjs/vite/build_hook')
    ],
  },
})
```

The `providers` array lists all service providers that AdonisJS should load when your application starts. Providers set up framework features like database access, authentication, and session handling.

The `commands` array registers Ace commands from packages. Your application's commands in the `commands` directory are automatically discovered, so you only list package commands here.

The `hooks` object defines functions that run during specific lifecycle events. The `buildStarting` hook runs when you build your application for production.

## See also

- [Environment variables validation guide](../references/environment_variables.md)
- [Config providers reference](../)
- [AdonisRC file reference](../reference/adonisrc_file.md)
