# Database and Models

This tutorial covers working with databases in AdonisJS using Lucid ORM. You will learn how to create models and migrations for the Post and Comment resources, establish relationships between them, generate dummy data using factories and seeders, and query your data using the REPL.

## Overview

Lucid is AdonisJS's SQL ORM (Object-Relational Mapper) that makes working with databases feel natural in JavaScript. Instead of writing raw SQL queries, you work with JavaScript classes called **models** that represent your database tables.

**Models** are classes that represent a single table in your database. For example, a `Post` model represents the `posts` table. Each instance of the model represents a row in that table.

**Migrations** are version control for your database schema. They're JavaScript files that describe changes to your database structure - like creating tables, adding columns, or modifying constraints. Migrations ensure everyone on your team has the same database structure.

Together, models and migrations give you a powerful, type-safe way to work with your database. Let's build the database structure for our DevShow web-app.

## Creating the Post model

Our app needs posts, so let's create a Post model along with its migration. Run this command:

```bash
node ace make:model Post -m
```

The `-m` flag tells Ace to create a migration file alongside the model. You'll see this output:

```bash
CREATE: app/models/post.ts
CREATE: database/migrations/1732089600000_create_posts_table.ts
```

The model file defines how you interact with the posts table in your code and they never modify the database schema. While the migration file describes the table structure in your database. Upon running the migration, your database will be modified as per the instructions written in the migration file.

Let's look at the generated model first:

```ts title="app/models/post.ts"
import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class Post extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
```

The model extends `BaseModel` and uses decorators to define columns. The `@column` decorator tells Lucid that a property maps to a database column. Notice it already includes `id`, `createdAt`, and `updatedAt` - these are common for most models.

Now let's add the `title`, `url` and `summary` columns our posts need:

```ts title="app/models/post.ts"
import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class Post extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  // [!code ++:8]
  @column()
  declare title: string

  @column()
  declare url: string

  @column()
  declare summary: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
```

Great! Now let's define the database table structure in the migration file:

```ts title="database/migrations/1732089600000_create_posts_table.ts"
import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'posts'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      // [!code ++:3]
      table.string('title').notNullable()
      table.string('url').notNullable()
      table.text('summary').notNullable()
      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
```

The `up` method runs when you execute the migration and creates the table. The `down` method runs when you roll back the migration and drops the table. Notice we're using `string` for the title and `text` for content - text columns can hold more data than string columns.

Also notice that column names in the database use `snake_case` (like `created_at`), while your model properties use `camelCase` (like `createdAt`). Lucid handles this conversion automatically.

## Creating the Comment model

Let's create the Comment model the same way:

```bash
node ace make:model Comment -m
```

You'll see:

```bash
CREATE: app/models/comment.ts
CREATE: database/migrations/1732089700000_create_comments_table.ts
```

Update the Comment model to include the content field:

```ts title="app/models/comment.ts"
import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class Comment extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  // [!code ++:2]
  @column()
  declare content: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
```

And update the migration:

```ts title="database/migrations/1732089700000_create_comments_table.ts"
import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'comments'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      // [!code ++:1]
      table.text('content').notNullable()
      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
```

## Running migrations

Now let's create these tables in your database by running the migrations:

```bash
node ace migration:run
```

You'll see output showing which migrations were executed:

```bash
❯ migrated database/migrations/1732089600000_create_posts_table
❯ migrated database/migrations/1732089700000_create_comments_table
```

Your database now has `posts` and `comments` tables! You can verify this by checking your database using a client like TablePlus, DBeaver, or the command line.

## Adding relationships

Right now our posts and comments exist independently, but in our DevShow web-app, comments belong to posts and posts belong to users. Let's add these relationships.

First, we need to add foreign key columns to our tables. Since our tables already exist, we'll create a new migration to add these columns:

```bash
node ace make:migration add_foreign_keys_to_posts_and_comments
```

This creates a new migration file. Let's add the foreign key columns:

```ts title="database/migrations/1732089800000_add_foreign_keys_to_posts_and_comments.ts"
import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    /**
     * Add user_id to posts table
     */
    this.schema.alterTable('posts', (table) => {
      table.integer('user_id').unsigned().notNullable()
      table.foreign('user_id').references('users.id').onDelete('CASCADE')
    })

    /**
     * Add user_id and post_id to comments table
     */
    this.schema.alterTable('comments', (table) => {
      table.integer('user_id').unsigned().notNullable()
      table.foreign('user_id').references('users.id').onDelete('CASCADE')

      table.integer('post_id').unsigned().notNullable()
      table.foreign('post_id').references('posts.id').onDelete('CASCADE')
    })
  }

  async down() {
    this.schema.alterTable('posts', (table) => {
      table.dropForeign(['user_id'])
      table.dropColumn('user_id')
    })

    this.schema.alterTable('comments', (table) => {
      table.dropForeign(['user_id'])
      table.dropForeign(['post_id'])
      table.dropColumn('user_id')
      table.dropColumn('post_id')
    })
  }
}
```

We're using `alterTable` instead of `createTable` because we're modifying existing tables. The foreign key constraints help maintain data integrity by ensuring that a `user_id` or `post_id` always references a valid record in the respective table. The `onDelete('CASCADE')` means if a user or post is deleted, their comments are automatically deleted too.

Run this migration:

```bash
node ace migration:run
```

```bash
❯ migrated database/migrations/1732089800000_add_foreign_keys_to_posts_and_comments
```

Now let's update our models to define these relationships. Update the Post model:

```ts title="app/models/post.ts"
import { DateTime } from 'luxon'
// [!code ++:4]
import { BaseModel, column, hasMany, belongsTo } from '@adonisjs/lucid/orm'
import type { HasMany, BelongsTo } from '@adonisjs/lucid/types/relations'
import Comment from '#models/comment'
import User from '#models/user'

export default class Post extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare title: string

  @column()
  declare url: string

  @column()
  declare summary: string

  // [!code ++:2]
  @column()
  declare userId: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  // [!code ++:11]
  /**
   * A post has many comments
   */
  @hasMany(() => Comment)
  declare comments: HasMany<typeof Comment>

  /**
   * A post belongs to a user
   */
  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>
}
```

The `@hasMany` decorator defines a one-to-many relationship - one post has many comments. The `@belongsTo` decorator defines the inverse - a post belongs to one user.

Now update the Comment model:

```ts title="app/models/comment.ts"
import { DateTime } from 'luxon'
// [!code ++:4]
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Post from '#models/post'
import User from '#models/user'

export default class Comment extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare content: string

  // [!code ++:5]
  @column()
  declare userId: number

  @column()
  declare postId: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  // [!code ++:10]
  /**
   * A comment belongs to a post
   */
  @belongsTo(() => Post)
  declare post: BelongsTo<typeof Post>

  /**
   * A comment belongs to a user
   */
  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>
}
```

Perfect! Our models now understand their relationships. When you load a post, you can easily access its comments through `post.comments`, and when you load a comment, you can access its post through `comment.post`.

## Creating factories

Now that our models and database tables are ready, let's create some dummy data. Factories make it easy to generate fake model instances for testing and development.

Create a factory for the Post model:

```bash
node ace make:factory Post
```

```bash
CREATE: database/factories/post_factory.ts
```

Factories use Faker to generate realistic dummy data. Let's configure our Post factory:

```ts title="database/factories/post_factory.ts"
import factory from '@adonisjs/lucid/factories'
import Post from '#models/post'
import User from '#models/user'

export const PostFactory = factory
  .define(Post, async ({ faker }) => {
    return {
      title: faker.helpers.arrayElement([
        'Why Functional Programming Matters',
        'Understanding Async/Await in JavaScript',
        'The Future of Web Development',
        'Building Scalable Applications',
        'Introduction to TypeScript',
        'Demystifying Closures',
        'The Art of Code Review',
        'Performance Optimization Techniques',
      ]),
      summary: faker.lorem.paragraphs(3),
      userId: 1, // We'll fix this with relationships later
    }
  })
  .build()
```

The factory's `define` method receives a `faker` instance that provides methods to generate all kinds of fake data. We're using meaningful titles instead of random strings to make our dummy data more realistic.

Now create a factory for comments:

```bash
node ace make:factory Comment
```

```bash
CREATE: database/factories/comment_factory.ts
```

Configure the Comment factory:

```ts title="database/factories/comment_factory.ts"
import factory from '@adonisjs/lucid/factories'
import Comment from '#models/comment'

export const CommentFactory = factory
  .define(Comment, async ({ faker }) => {
    return {
      content: faker.lorem.paragraph(),
      userId: 1,
      postId: 1, // We'll set this properly in the seeder
    }
  })
  .build()
```

## Creating seeders

Seeders use factories to populate your database with dummy data. Let's create a seeder that generates posts and comments:

```bash
node ace make:seeder PostSeeder
```

```bash
CREATE: database/seeders/post_seeder.ts
```

Update the seeder to create posts with comments:

```ts title="database/seeders/post_seeder.ts"
import { BaseSeeder } from '@adonisjs/lucid/seeders'
import { PostFactory } from '#database/factories/post_factory'
import { CommentFactory } from '#database/factories/comment_factory'

export default class extends BaseSeeder {
  async run() {
    /**
     * Create 10 posts, each with 3-5 random comments
     */
    const posts = await PostFactory.createMany(10)

    for (const post of posts) {
      await CommentFactory.merge({ postId: post.id }).createMany(Math.floor(Math.random() * 3) + 3)
    }
  }
}
```

The seeder creates 10 posts, then for each post, creates between 3 to 5 comments. The `merge` method overrides the default `postId` from the factory to ensure each comment belongs to the correct post.

Run the seeder:

```bash
node ace db:seed
```

```bash
❯ running PostSeeder
```

Your database now has 10 posts, each with several comments!

## Querying data with the REPL

Let's explore the data we just created using AdonisJS's REPL (Read-Eval-Print Loop). The REPL is an interactive shell where you can run JavaScript code and interact with your models.

Start the REPL:

```bash
node ace repl
```

First, load your models:

```ts
await loadModels()
```

This makes all your models available under the `models` object. Let's fetch all posts:

```ts
await models.post.all()
```

You'll see an array of all 10 posts with their data. Each post is a Post model instance, not a plain JavaScript object.

Let's search for posts by title. The `query()` method returns a chainable query builder built on top of Knex:

```ts
await models.post.query().where('title', 'like', '%TypeScript%')
```

This finds all posts where the title contains "TypeScript". The query builder gives you powerful SQL query capabilities while staying in JavaScript.

Now let's fetch a specific post and load its comments. First, get a post by ID:

```ts
const post = await models.post.find(1)
```

The post is loaded, but its comments aren't loaded yet. To load the relationship, use the `load` method:

```ts
await post.load('comments')
```

Now you can access the comments:

```ts
post.comments
```

You'll see all the comments that belong to this post. The `load` method fetched the related comments and set them as the `post.comments` property.

You can also load relationships when initially fetching the post:

```ts
const postWithComments = await models.post.query().preload('comments').first()
```

This fetches the first post and its comments in a single operation. The `preload` method is more efficient than loading relationships separately.

Type `.exit` to leave the REPL when you're done exploring.

## What you learned

You now know how to:

- Create models and migrations using the Ace CLI
- Define column properties on models using decorators
- Create database tables and modify them with migrations
- Define relationships between models using `hasMany` and `belongsTo`
- Generate dummy data with factories and seeders
- Query data using the REPL and model methods
- Use the query builder for complex queries
- Load relationships with `load()` and `preload()`
