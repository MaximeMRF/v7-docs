# Authorization

Right now, our DevShow app lets users create posts and leave comments. In this tutorial, we'll build on top of that by adding the ability for users to edit their own posts, delete their own posts, and delete their own comments. Notice the key phrase there—**their own**. We don't want users to be able to edit or delete content that belongs to someone else.

You might be thinking, "Can't we just add some if statements in our controllers to check if the logged-in user owns the resource?" And you'd be right—that would work for simple cases! However, as your application grows and you have more resources with different permission rules, scattering these checks throughout your codebase becomes messy and hard to maintain.

This is where a dedicated authorization layer comes in. AdonisJS provides an official package called `@adonisjs/bouncer` that lets you organize all your authorization logic into reusable **policies**. Think of policies as classes that answer the question: "Is this user allowed to perform this action on this resource?"

In this tutorial, we'll install Bouncer, create policies for our posts and comments, and then implement the edit and delete features with proper authorization checks built in from the start. By the end, you'll have these new features working securely, where users can only modify content they own.

## Installing Bouncer

Let's get started by installing the Bouncer package. Run the following command in your terminal:

```bash
npm install @adonisjs/bouncer
```

After installation, we need to configure the package:

```bash
node ace configure @adonisjs/bouncer
```

This configuration command does a few things for you:

- Creates an `app/abilities/main.ts` file where you can define authorization abilities (we won't need this file for now, so don't worry about it)
- Registers a middleware that initializes Bouncer for every HTTP request
- Makes the `bouncer` object available on the `HttpContext`, so you can use it in your controllers

You're all set! Now let's create our first policy.

## Creating the PostPolicy

Policies in AdonisJS are classes where each method represents a specific action a user might want to perform on a resource. It's recommended to create one policy per resource type—so we'll have a `PostPolicy` for posts and a `CommentPolicy` for comments.

Let's create the post policy:

```bash
node ace make:policy post
```

This creates a new file at `app/policies/post_policy.ts`. Let's open it and add our authorization logic:

```ts title="app/policies/post_policy.ts"
import User from '#models/user'
import Post from '#models/post'

export default class PostPolicy {
  /**
   * Check if the user can edit the given post.
   * Only the post owner should be able to edit their post.
   */
  edit(user: User, post: Post) {
    return user.id === post.userId
  }

  /**
   * Check if the user can delete the given post.
   * Only the post owner should be able to delete their post.
   */
  delete(user: User, post: Post) {
    return user.id === post.userId
  }
}
```

Let's break down what's happening here:

Each method in the policy receives the currently logged-in user as the first parameter, followed by any additional parameters you need—in our case, the `post` we're checking permissions for. The method simply returns `true` if the user is allowed to perform the action, or `false` if they're not.

You might notice that the `edit` and `delete` methods have the same logic. You might be wondering, "Why not just have one method?" Great question! Even though the logic is identical right now, keeping them separate gives you flexibility. Later, you might decide that admins can delete any post but can't edit them, or that posts can't be edited after 24 hours. Having separate methods makes these kinds of changes easier without breaking other parts of your app.

## Creating the CommentPolicy

Now let's create a policy for comments. The command is similar:

```bash
node ace make:policy comment
```

This creates `app/policies/comment_policy.ts`. Let's add the delete authorization logic:

```ts title="app/policies/comment_policy.ts"
import User from '#models/user'
import Comment from '#models/comment'

export default class CommentPolicy {
  /**
   * Check if the user can delete the given comment.
   * Only the comment owner should be able to delete their comment.
   */
  delete(user: User, comment: Comment) {
    return user.id === comment.userId
  }
}
```

Same pattern as the `PostPolicy`—we check if the logged-in user's ID matches the comment's `userId`. Simple and straightforward!

Now that our policies are in place, let's start building the edit and delete features and using these policies to protect them.

## Implementing edit post functionality

Let's implement the ability for users to edit their posts. This involves several steps:

### Step 1: Add the edit and update routes

Open your routes file and add the following routes:

```ts title="start/routes.ts"
import router from '@adonisjs/core/services/router'
import { middleware } from './kernel.js'

const PostsController = () => import('#controllers/posts_controller')
const CommentsController = () => import('#controllers/comments_controller')

// ... existing routes

// [!code ++:7]
/**
 * Routes for editing and updating posts.
 * Both require authentication since only the owner can edit their post.
 */
router.get('/posts/:id/edit', [PostsController, 'edit']).as('posts.edit').use(middleware.auth())

router.put('/posts/:id', [PostsController, 'update']).as('posts.update').use(middleware.auth())
```

We have two routes here:

- `GET /posts/:id/edit` - Shows the edit form
- `PUT /posts/:id` - Processes the form submission and updates the post

Both routes require authentication because you need to be logged in to edit a post.

### Step 2: Create the update validator

Before we build the controller methods, let's create a validator for the update form. Open your existing post validator file:

```ts title="app/validators/post.ts"
import vine from '@vinejs/vine'

/**
 * Validator for creating a new post
 */
export const createPostValidator = vine.compile(
  vine.object({
    title: vine.string().trim().minLength(6),
    content: vine.string().trim().minLength(10),
  })
)

// [!code ++:11]
/**
 * Validator for updating an existing post.
 * Uses the same validation rules as creating a post to keep
 * requirements consistent between create and update operations.
 */
export const updatePostValidator = vine.compile(
  vine.object({
    title: vine.string().trim().minLength(6),
    content: vine.string().trim().minLength(10),
  })
)
```

We've added an `updatePostValidator` that has the same validation rules as `createPostValidator`. Both require a title of at least 6 characters and content of at least 10 characters.

### Step 3: Add controller methods

Now let's add the `edit` and `update` methods to our posts controller:

```ts title="app/controllers/posts_controller.ts"
import Post from '#models/post'
import { createPostValidator, updatePostValidator } from '#validators/post'
// [!code ++:1]
import PostPolicy from '#policies/post_policy'
import type { HttpContext } from '@adonisjs/core/http'

export default class PostsController {
  // ... existing methods (index, create, store, show)

  // insert-start
  /**
   * Show the form for editing a post.
   * First we find the post, then check if the user is allowed to edit it.
   */
  async edit({ bouncer, params, view }: HttpContext) {
    const post = await Post.findOrFail(params.id)

    /**
     * Use the PostPolicy to check if the current user can edit this post.
     * If not authorized, Bouncer will automatically throw a 403 Forbidden error.
     */
    await bouncer.with(PostPolicy).authorize('edit', post)

    return view.render('posts/edit', { post })
  }

  /**
   * Handle the form submission to update a post.
   * We validate the input, check authorization, then update the post.
   */
  async update({ bouncer, params, request, response, session }: HttpContext) {
    const post = await Post.findOrFail(params.id)

    /**
     * Again, check if the user is allowed to update this post.
     * This is important! Even though we check in edit(), someone could
     * send a PUT request directly without visiting the edit form.
     */
    await bouncer.with(PostPolicy).authorize('edit', post)

    /**
     * Validate the incoming data using our update validator
     */
    const data = await request.validateUsing(updatePostValidator)

    /**
     * Update the post with the validated data
     */
    await post.merge(data).save()

    session.flash('notification', 'Post updated successfully')
    return response.redirect().toRoute('posts.show', { id: post.id })
  }
  // insert-end
}
```

Let's walk through what's happening in these methods:

In the `edit` method:

1. We find the post using the ID from the URL
2. We use `bouncer.with(PostPolicy).authorize('edit', post)` to check if the current user can edit this post
3. If authorized, we show the edit form; if not, Bouncer throws a 403 error automatically
4. We pass the post to the view so the form can display the current values

In the `update` method:

1. We find the post again (never trust data from the form—always fetch fresh from the database)
2. We authorize again—this is crucial! Someone could send a PUT request directly without visiting the edit form
3. We validate the incoming data
4. We update the post using `merge()` which updates only the changed fields
5. We flash a success message and redirect to the post detail page

Notice how clean our controller methods are? The authorization logic is tucked away in the policy, and Bouncer handles all the error responses for us.

### Step 4: Create the edit form view

Now let's create the edit form. Create a new file:

```edge title="resources/views/posts/edit.edge"
@let(title = 'Edit Post')

@layout.app({ title })
  <div class="container max-w-2xl mx-auto px-4 py-8">
    <h1 class="text-3xl font-bold mb-6">
      Edit Post
    </h1>

    {{--
    Form to update the post. Notice we're using PUT method
    and posting to the posts.update route with the post ID.
    --}}
    <form method="POST" action="{{ route('posts.update', [post.id]) }}">
      @method('PUT')

        {{--
        Title field with the current post title as the value.
        The @!field.error() component will show validation errors if any.
        --}}
        @field.root({ name: 'title' })
          @!field.label({ text: 'Post title' })
          @!input.control({ value: post.title })
          @!field.error()
        @end
        
        {{--
        Content textarea with the current post content.
        We use a textarea instead of input for longer text.
        --}}
        @field.root({ name: 'content' })
          @!field.label({ text: 'Post content' })
          @!textarea.control({ rows: 8, text: post.content })
          @!field.error()
        @end
      @end
      
      {{-- Submit button --}}
      <div class="flex gap-4">
        @!button({ type: 'submit', text: 'Update Post' })
        @!link({ route: 'posts.show', routeParams: [post.id], text: 'Cancel' })
      </div>
    </form>
  </div>
@end
```

This form is similar to the create form, with a few key differences:

- We use `@method('PUT')` to specify this is an update request
- We pre-fill the form fields with the current post values
- The form submits to the `posts.update` route with the post ID

Now users can edit their posts! But we still need to add buttons on the post detail page so they can access the edit form. Let's do that next.

### Step 5: Add edit and delete buttons

Open your post detail view and add edit and delete buttons. We'll use the `@can` tag to only show these buttons to the post owner:

```edge title="resources/views/posts/show.edge"
@let(title = post.title)

@layout.app({ title })
  <div class="container max-w-4xl mx-auto px-4 py-8">
    {{-- Post header with title and action buttons --}}
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-3xl font-bold">
        {{ post.title }}
      </h1>

      {{-- insert-start --}}
      {{--
        Show edit and delete buttons only if the current user
        is allowed to edit/delete this post according to PostPolicy
      --}}
      <div class="flex gap-2">
        @can('PostPolicy.edit', post)
          @!link({ route: 'posts.edit', routeParams: [post.id], text: 'Edit' })
        @end
        
        @can('PostPolicy.delete', post)
          <form method="POST" action="{{ route('posts.destroy', [post.id]) }}">
            @!button({ type: 'submit', variant: 'danger', text: 'Delete' })
          </form>
        @end
      </div>
      {{-- insert-end --}}
    </div>
  </div>
@end
```

The `@can` tag is powerful! It checks the policy method just like we do in the controller, but in the template. If the user is not allowed to perform the action, everything between `@can` and `@end` is hidden. This means:

- Non-owners won't even see the edit and delete buttons
- If someone tries to visit the edit URL directly, they'll get a 403 error from our controller authorization check

Perfect! Now let's implement the delete functionality.

## Implementing delete post functionality

Deleting a post is simpler than editing because there's no form to show—we just need a route and a controller method.

### Step 1: Add the delete route

We already have the delete button in the view, but we need to add the route. Open your routes file:

```ts title="start/routes.ts"
import router from '@adonisjs/core/services/router'
import { middleware } from './kernel.js'

const PostsController = () => import('#controllers/posts_controller')
const CommentsController = () => import('#controllers/comments_controller')

// ... existing routes

// insert-start
/**
 * Route for deleting a post.
 * Requires authentication since only the owner can delete their post.
 */
router.delete('/posts/:id', [PostsController, 'destroy']).as('posts.destroy').use(middleware.auth())
// insert-end
```

### Step 2: Add the destroy controller method

Now add the `destroy` method to your posts controller:

```ts title="app/controllers/posts_controller.ts"
import Post from '#models/post'
import { createPostValidator, updatePostValidator } from '#validators/post'
import PostPolicy from '#policies/post_policy'
import type { HttpContext } from '@adonisjs/core/http'

export default class PostsController {
  // ... existing methods

  // insert-start
  /**
   * Delete a post.
   * We authorize the action, delete the post, then redirect with a success message.
   */
  async destroy({ bouncer, params, response, session }: HttpContext) {
    const post = await Post.findOrFail(params.id)

    /**
     * Check if the user is allowed to delete this post using PostPolicy
     */
    await bouncer.with(PostPolicy).authorize('delete', post)

    /**
     * Delete the post from the database
     */
    await post.delete()

    session.flash('notification', 'Post deleted successfully')
    return response.redirect().toRoute('posts.index')
  }
  // insert-end
}
```

The pattern should feel familiar by now:

1. Find the post
2. Authorize the action using the policy
3. Perform the action (delete the post)
4. Flash a success message
5. Redirect to an appropriate page (the posts listing)

That's it! Users can now delete their own posts. The delete button will only appear for the post owner thanks to the `@can` tag we added earlier.

## Implementing delete comment functionality

Let's finish up by adding the ability to delete comments. The pattern is nearly identical to deleting posts.

### Step 1: Add the delete route

Open your routes file and add the comment delete route:

```ts title="start/routes.ts"
import router from '@adonisjs/core/services/router'
import { middleware } from './kernel.js'

const PostsController = () => import('#controllers/posts_controller')
const CommentsController = () => import('#controllers/comments_controller')

// ... existing routes

// insert-start
/**
 * Route for deleting a comment.
 * Requires authentication since only the comment owner can delete it.
 */
router
  .delete('/comments/:id', [CommentsController, 'destroy'])
  .as('comments.destroy')
  .use(middleware.auth())
// insert-end
```

### Step 2: Add the destroy controller method

Add the `destroy` method to your comments controller:

```ts title="app/controllers/comments_controller.ts"
import Comment from '#models/comment'
import { createCommentValidator } from '#validators/comment'
// [!code ++:1]
import CommentPolicy from '#policies/comment_policy'
import type { HttpContext } from '@adonisjs/core/http'

export default class CommentsController {
  // ... existing methods

  // [!code ++:15]
  /**
   * Delete a comment.
   * We authorize the action, delete the comment, then redirect back to the post.
   */
  async destroy({ bouncer, params, response, session }: HttpContext) {
    const comment = await Comment.findOrFail(params.id)

    /**
     * Load the post relationship so we can redirect back to it after deletion
     */
    await comment.load('post')

    /**
     * Check if the user is allowed to delete this comment using CommentPolicy
     */
    await bouncer.with(CommentPolicy).authorize('delete', comment)

    /**
     * Delete the comment from the database
     */
    await comment.delete()

    session.flash('notification', 'Comment deleted successfully')
    return response.redirect().toRoute('posts.show', { id: comment.post.id })
  }
}
```

Notice we load the `post` relationship before deleting the comment. We need this so we can redirect the user back to the post page after the deletion. Without it, we wouldn't know which post page to redirect to!

### Step 3: Add delete buttons to comments

Finally, let's add delete buttons to the comments list. Open your post detail view and update the comments section:

```edge title="resources/views/posts/show.edge"
@let(title = post.title)

@layout.app({ title })
  <div class="container max-w-4xl mx-auto px-4 py-8">
    {{-- ... post content ... --}}

    {{-- Comments section --}}
    <div class="mt-12">
      <h2 class="text-2xl font-bold mb-6">
        Comments
      </h2>

      @each(comment in comments)
        <div class="border-b border-gray-200 py-4">
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <div class="flex items-center gap-2 text-sm text-gray-600 mb-2">
                <span class="font-medium">{{ comment.user.fullName }}</span>
                <span>•</span>
                <time>{{ comment.createdAt.toRelative() }}</time>
              </div>
              <p class="text-gray-800">
                {{ comment.content }}
              </p>
            </div>

            {{-- insert-start --}}
            {{--
              Show delete button only if the current user
              is allowed to delete this comment according to CommentPolicy
            --}}
            @can('CommentPolicy.delete', comment)
              <form method="POST" action="{{ route('comments.destroy', [comment.id]) }}" class="ml-4">
                @method('DELETE')
                  @!button({ type: 'submit', variant: 'danger', size: 'sm' })
                  Delete
                @end
              </form>
            @end
            {{-- insert-end --}}
          </div>
        </div>
      @end
      
      {{-- ... comment form ... --}}
    </div>
  </div>
@end
```

Perfect! Now comment owners will see a delete button next to their comments, and clicking it will remove the comment.

## What you learned

Congratulations! You've successfully implemented authorization in the DevShow application. Let's recap what you've accomplished:

- Installed and configured the `@adonisjs/bouncer` package
- Created a `PostPolicy` with `edit` and `delete` methods to control who can modify posts
- Created a `CommentPolicy` with a `delete` method to control who can delete comments
- Implemented the edit post feature with a complete form, validation, and authorization checks
- Implemented the delete post feature with authorization
- Implemented the delete comment feature with authorization
- Used the `@can` Edge tag to conditionally show or hide buttons based on user permissions
- Learned how to use `bouncer.with(Policy).authorize()` to enforce authorization in controllers

The key takeaway is that policies keep your authorization logic organized and reusable. Instead of scattering permission checks throughout your controllers, you define them once in a policy and use them everywhere. This makes your code cleaner, easier to maintain, and easier to modify as requirements change.

When Bouncer's `authorize` method is called and the user doesn't have permission, it automatically throws a 403 Forbidden error and shows an error page. You don't need to write any additional error handling code—Bouncer takes care of it for you.
