# Routes, Controllers and Views

In this tutorial, you'll build the core functionality for displaying posts in your DevShow web-app. You'll create routes to list all posts and view individual posts, use controllers to fetch data from your database, and render that data using Edge templates with a shared layout. By the end, you'll understand the complete MVC flow in AdonisJS.

## Overview

Right now, you have a `Post` model and a `Comment` model set up with your database, but no way to actually view them in a browser. Let's change that by building two pages: one that lists all posts, and another that shows a single post with its comments.

This is where the MVC (Model-View-Controller) pattern comes together. Your models handle data, controllers coordinate the logic, and views display everything to users. We'll see this flow in action as we build out these features.

## Creating the posts controller

Let's start by creating a controller to handle posts-related requests. Run this command:

```bash
node ace make:controller posts
```

This creates a new file at `app/controllers/posts_controller.ts`. Open it up and you'll see a basic controller class. Let's add a method to list all posts:

```ts title="app/controllers/posts_controller.ts"
import Post from '#models/post'
import { HttpContext } from '@adonisjs/core/http'

export default class PostsController {
  /**
   * Display a list of all posts
   */
  async index({ view }: HttpContext) {
    const posts = await Post.query().preload('user').orderBy('createdAt', 'desc')

    return view.render('posts/index', { posts })
  }
}
```

A few things to note here: we're preloading the `user` relationship so we can display the author's name without extra queries, ordering posts by creation date with newest first, and passing the posts to a view template called `posts/index`.

## Defining the route

Now we need to wire up a route that points to this controller method. Open your routes file and add:

```ts title="start/routes.ts"
import router from '@adonisjs/core/services/router'
import { controllers } from '#generated/controllers'

// [!code ++]
router.get('/posts', [controllers.Posts, 'index'])
```

The route definition connects the `/posts` URL to your controller's `index` method. When someone visits `/posts`, AdonisJS will call `PostsController.index()` and return whatever that method returns.

## Creating the posts list view

Time to create the view template. Create a new file at `resources/views/posts/index.edge`:

```edge title="resources/views/posts/index.edge"
@layout()
  <div class="container">
    <h1>
      Posts
    </h1>

    @each(post in posts)
      <div class="post-item">
        <h2>
          <a href="{{ urlFor('posts.show', post) }}">{{ post.title }} </a>
        </h2>
        <p>
          By {{ post.user.fullName }}
        </p>
      </div>
    @end
  </div>
@end
```

This template uses the existing `layout` component that came with your starter kit. The layout handles the basic HTML structure, and you provide the main content by wrapping it in `@layout` tag.

Inside, we loop through each post with `@each` and display its title as a link and the author's name. Notice the `urlFor` helper—this is AdonisJS's URL builder that generates the correct URL for a named route. Instead of hard-coding `/posts/123`, it builds the URL for you based on the route name and the post object.

:::tip
The `urlFor` helper is part of AdonisJS's URL builder and automatically generates correct URLs for your routes. When you pass `post` as the second argument, it uses the post's ID to fill in tthe dynamic route parameter.
:::

Start your development server with `node ace serve --hmr` and visit `http://localhost:3333/posts`. You should see a list of all your posts!

## Viewing a single post

Now let's add the ability to view an individual post. This requires a route with a dynamic parameter—the post ID.

Add this route:

```ts title="start/routes.ts"
import router from '@adonisjs/core/services/router'
import { controllers } from '#generated/controllers'

router.get('/posts', [controllers.Posts, 'index'])
// [!code ++]
router.get('/posts/:id', [controllers.Posts, 'show'])
```

The `:id` part is a route parameter. When someone visits `/posts/5`, AdonisJS captures that `5` and makes it available in your controller as `params.id`. You can name the parameter anything you want—`:id`, `:postId`, `:slug`—just be consistent when accessing it.

Now add the `show` method to your controller:

```ts title="app/controllers/posts_controller.ts"
import Post from '#models/post'
import { HttpContext } from '@adonisjs/core/http'

export default class PostsController {
  async index({ view }: HttpContext) {
    const posts = await Post.query().preload('user').orderBy('createdAt', 'desc')

    return view.render('posts/index', { posts })
  }

  // [!code ++:8]
  /**
   * Display a single post
   */
  async show({ params, view }: HttpContext) {
    const post = await Post.query().where('id', params.id).preload('user').firstOrFail()

    return view.render('posts/show', { post })
  }
}
```

We're using `firstOrFail()` here, which will automatically throw a 404 error if no post exists with that ID. No need to manually check if the post exists—AdonisJS handles that for you.

## Creating the post detail view

Create the view template for displaying a single post:

```edge title="resources/views/posts/show.edge"
@layout()
  <div>
    <h1>
      {{ post.title }}
    </h1>
    <p>
      By {{ post.user.fullName }}
    </p>

    <div>
      {{ post.content }}
    </div>
  </div>
@end
```

Try clicking on a post from your list page. You should now see the full post with its title, author, and content.

## Adding comments to the post view

Finally, let's display the comments for each post. First, we need to preload the comments and their authors in the controller:

```ts title="app/controllers/posts_controller.ts"
import Post from '#models/post'
import { HttpContext } from '@adonisjs/core/http'

export default class PostsController {
  async index({ view }: HttpContext) {
    const posts = await Post.query().preload('user').orderBy('createdAt', 'desc')

    return view.render('posts/index', { posts })
  }

  async show({ params, view }: HttpContext) {
    const post = await Post.query()
      .where('id', params.id)
      .preload('user')
      // [!code ++:3]
      .preload('comments', (query) => {
        query.preload('user').orderBy('createdAt', 'asc')
      })
      .firstOrFail()

    return view.render('posts/show', { post })
  }
}
```

We're preloading comments along with each comment's user (the author), and ordering them by creation date with oldest first. Now update the view to display them:

```edge title="resources/views/posts/show.edge"
@layout()
  <div>
    <h1>
      {{ post.title }}
    </h1>
    <p>
      By {{ post.user.fullName }}
    </p>

    <div>
      {{ post.content }}
    </div>

    // [!code ++:22]
    <div>
      <h2>
        Comments
      </h2>

      @if(post.comments.length === 0)
        <p>
          No comments yet.
        </p>
      @else
        @each(comment in post.comments)
          <div>
            <p>
              {{ comment.content }}
            </p>
            <p>
              By {{ comment.user.fullName }} on {{ comment.createdAt.toFormat('MMM dd, yyyy') }}
            </p>
          </div>
        @end
      @end
    </div>
  </div>
@end
```

Refresh your post detail page and you'll now see all the comments listed below the post content!

## What you've built

You've just completed the full MVC flow in AdonisJS:

- **Routes** that map URLs to controller actions
- **Controllers** that fetch data from your models and pass it to views
- **Views** that display data using Edge templates
- **Relationships** that let you eager load related data efficiently

You created a posts listing page, a detail page with dynamic routing, and displayed related comments—all the core building blocks you'll use throughout your application.
