---
title: 'Development Environment Setup'
description: 'Learn how to configure an efficient development environment for building applications with AdonisJS.'
---

# Development Environment Setup

This guide covers the recommended development environment for AdonisJS applications. You will learn about pre-configured TypeScript settings, ESLint and Prettier integration, recommended code editor extensions for improved productivity, and database options for local development.

## Overview

AdonisJS applications come with a fully configured development environment out of the box. TypeScript, ESLint, and Prettier are pre-configured with sensible defaults, allowing you to start building immediately without manual setup.

This guide explains what's already configured in your project, recommends optional editor extensions that enhance the development experience, and provides guidance on choosing a database for local development. Understanding these configurations helps you leverage the full capabilities of the framework and maintain consistency across your team.

## Code Editors and Extensions

AdonisJS works with any modern code editor that supports **TypeScript**. The framework does not rely on custom domain-specific languages (DSLs), so most editors provide full language support out of the box. The only framework-specific syntax is the **Edge** templating engine, which benefits from dedicated syntax highlighting extensions.

### Recommended Editors

The following editors have extensions that enhance the AdonisJS development experience:

| Editor                 | Extensions Available     | Notes                                                  |
| ---------------------- | ------------------------ | ------------------------------------------------------ |
| **Visual Studio Code** | AdonisJS, Japa, Edge     | Full ecosystem support with IntelliSense and debugging |
| **Zed Editor**         | Edge Syntax Highlighting | Lightweight with Edge template support                 |
| **Sublime Text**       | Edge Syntax Highlighting | Minimal setup for Edge templates                       |

### Visual Studio Code Extensions

Visual Studio Code offers the most comprehensive AdonisJS tooling:

- [**AdonisJS Extension**](https://marketplace.visualstudio.com/items?itemName=adonisjs.vscode-adonisjs) – Provides IntelliSense, route definitions, and framework-specific snippets
- [**Japa Extension**](https://marketplace.visualstudio.com/items?itemName=thetutlage.vscode-japa) – Adds test runner integration and debugging support for Japa tests
- [**Edge Extension**](https://marketplace.visualstudio.com/items?itemName=adonisjs.vscode-edge) – Enables syntax highlighting and IntelliSense for Edge templates

:::tip
Configuring your editor with ESLint and Prettier extensions enables automatic formatting on save and real-time linting feedback, reducing the need to run `npm run format` and `npm run lint` manually.
:::

### Other Editors

- **Zed Editor** – [Edge Syntax Highlighting Extension](https://zed.dev/extensions/adonisjs-edge)
- **Sublime Text** – [Edge Syntax Highlighting Package](https://packagecontrol.io/packages/Edge%20Syntax%20Highlighting)

## TypeScript Setup

TypeScript is a first-class citizen in AdonisJS. Every application is created and runs using TypeScript by default, with all configuration handled automatically. Understanding how TypeScript works in development versus production, and the required compiler options, helps you make informed decisions about deployment and tooling.

### Required TypeScript Configuration

AdonisJS requires specific TypeScript compiler options to function correctly. The framework relies heavily on **experimental decorators** for dependency injection, model definitions, and routing. Additionally, if you use Inertia with JSX-based templates, JSX compilation must be enabled.

The following `tsconfig.json` configuration represents the bare minimum required for AdonisJS applications:

::::tabs

:::tab{title="Non-Inertia apps"}

```json
{
  "compilerOptions": {
    "module": "NodeNext",
    "isolatedModules": true,
    "declaration": false,
    "outDir": "./build",
    "esModuleInterop": true,
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "skipLibCheck": true
  },
  "include": ["**/*", ".adonisjs/server/**/*"]
}
```

:::

:::tab{title="Inertia apps"}

```json
{
  "compilerOptions": {
    "module": "NodeNext",
    "isolatedModules": true,
    "declaration": false,
    "outDir": "./build",
    "esModuleInterop": true,
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "skipLibCheck": true
  },
  // [!code ++:5]
  "references": [
    {
      "path": "./inertia/tsconfig.json"
    }
  ],
  "include": ["**/*", ".adonisjs/server/**/*"]
}
```

:::

::::

### Development Mode (JIT Compilation)

In development, AdonisJS uses a **Just-in-Time (JIT) compiler** provided by the `@poppinss/ts-exec` package. This approach executes TypeScript files directly without a separate compilation step, enabling instant feedback when you save changes.

This differs from Node.js' native TypeScript support because AdonisJS requires:

- **Experimental decorators** support (used for dependency injection and model decorators)
- **JSX compilation** (if you replace Edge with a JSX-based template engine like Inertia)

Since Node.js' built-in TypeScript loader does not support these features, `@poppinss/ts-exec` provides the necessary compatibility layer.

### Production Mode (Ahead-of-Time Compilation)

For production deployments, AdonisJS compiles your TypeScript code into JavaScript using the official TypeScript compiler (`tsc`). This process generates a `build/` directory containing transpiled `.js` files optimized for the Node.js runtime.

```bash
node ace build
```

The compiled output includes:

- Transpiled JavaScript files with decorators transformed
- Copied static assets and templates
- Optimized module imports
- Removed development-only code

See also: [Deploying to production](./deploying-to-production.md), [TypeScript build process](../concepts/typescript_build_process.md)

## ESLint and Prettier Configuration

AdonisJS projects include pre-configured **ESLint** and **Prettier** setups that enforce TypeScript best practices and maintain consistent code formatting across your team.

### ESLint

The default ESLint configuration extends the AdonisJS base config, which includes rules for TypeScript, async/await patterns, and framework conventions. You can override or extend these rules in `eslint.config.js` as needed.

```js title="eslint.config.js"
import { configApp } from '@adonisjs/eslint-config'
export default configApp()
```

Run ESLint manually:

```bash
npm run lint
```

### Prettier

Prettier configuration is defined in `package.json`, ensuring all files are formatted consistently. The AdonisJS preset includes sensible defaults for indentation, quotes, and line length.

```json title="package.json"
{
  "prettier": "@adonisjs/prettier-config"
}
```

Run Prettier manually:

```bash
npm run format
```

:::tip
Most code editors support running ESLint and Prettier automatically on file save. Configuring this in your editor eliminates manual formatting steps and catches linting issues immediately.
:::

See also: [ESLint configuration reference](https://github.com/adonisjs/tooling-config/tree/main/packages/eslint-config), [Prettier configuration reference](https://github.com/adonisjs/tooling-config/tree/main/packages/prettier-config)

## Database Setup

AdonisJS applications are pre-configured with **SQLite**, a lightweight file-based database that requires no additional installation. This allows you to start building your application immediately without external dependencies.

### SQLite (Default)

SQLite is configured by default and stores data in a local `database.sqlite` file. This setup is ideal for:

- Quick prototyping and experimentation
- Learning AdonisJS features without database overhead
- Simple applications with modest data requirements

### PostgreSQL and MySQL

For production applications, using **PostgreSQL** or **MySQL** in local development ensures consistency with your production environment. This prevents schema differences and driver-specific behavior from causing issues during deployment.

**Recommended databases:**

| Database       | Best For                | Strengths                                          |
| -------------- | ----------------------- | -------------------------------------------------- |
| **PostgreSQL** | Modern web applications | JSON support, advanced queries, strong consistency |
| **MySQL**      | Legacy compatibility    | Wide hosting support, mature ecosystem             |

**Local database tools:**

- [Dbngin](https://dbngin.com/) – GUI for managing PostgreSQL and MySQL on macOS and Windows
- [Docker](https://www.docker.com/) – Run databases in containers for isolated environments
- [Postgres.app](https://postgresapp.com/) – Native PostgreSQL for macOS

:::note
Switching from SQLite to PostgreSQL or MySQL requires updating your database configuration and installing the appropriate driver. Most applications will make this change early in development.
:::

See also: [Database configuration guide](https://docs.adonisjs.com/guides/database/introduction), [Lucid ORM documentation](https://docs.adonisjs.com/guides/database/introduction)
