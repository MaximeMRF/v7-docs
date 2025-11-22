# Forms and Validation

So far in the DevShow tutorial, you've built an application that displays posts from your database. But what about creating new posts? That's where forms come in.

Handling forms involves three main steps: displaying a form to collect user input, validating that input on the server to ensure it meets your requirements, and finally saving the validated data to your database. AdonisJS provides Edge form components that render standard HTML form elements with automatic CSRF protection, and VineJS for defining validation rules.

In this tutorial, you'll first add the ability for authenticated users to create new posts. Then, you'll apply the same pattern to let users leave comments on existing posts. Along the way, you'll be introduced to AdonisJS's validation layer and learn how to organize your code using separate controllers for different resources.

## Adding post creation

Let's start by adding the ability for users to create new posts. We'll need two things: a form where users can enter post details, and a way to handle that form submission.

::::steps
:::step{title="Add the routes"}

First, let's add two routes to your routes file. One route will display the form, and another will handle the form submission.

```ts title="start/routes.ts"
import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'
import { controllers } from '#generated/controllers'

// ... existing routes

// [!code ++:5]
/**
 * Routes for creating posts - only accessible to logged-in users
 */
router.get('/posts/create', [controllers.posts, 'create']).use(middleware.auth())
router.post('/posts', [controllers.posts, 'store']).use(middleware.auth())
```

Notice we're using the `auth()` middleware on both routes. This ensures only logged-in users can access these endpoints. If someone tries to visit `/posts/create` without being logged in, they'll be redirected to the login page.

:::

:::step{title="Create the form template"}

Next, let's create a new Edge template that displays the form. Create a new file called `create.edge` inside your `resources/views/posts` directory.

```edge title="resources/views/posts/create.edge"
@let(title = 'Create a new post')

@layouts.main({ title })
  <div class="max-w-2xl mx-auto">
    <h1 class="text-3xl font-bold mb-6">
      Create a new post
    </h1>

    {{--
      The @form component renders a standard HTML form element.
      It automatically adds CSRF protection.
    --}}
    @form({ route: 'posts.store', method: 'POST' })
      {{-- Title field --}}
      @field.root({ name: 'title' })
        @!field.label({ text: 'Post title' })
        @!input.control({ placeholder: 'Enter an interesting title' })
        @!field.error()
      @end
      
      {{-- URL field --}}
      @field.root({ name: 'url' })
        @!field.label({ text: 'URL' })
        @!input.control({
          type: 'url',
          placeholder: 'https://example.com/article'
        })
        @!field.error()
      @end
      
      {{-- Short summary field --}}
      @field.root({ name: 'summary' })
        @!field.label({ text: 'Short summary' })
        @!textarea.control({
          rows: 4,
          placeholder: 'Briefly describe what this post is about (minimum 80 characters)'
        })
        @!field.error()
      @end
      
      {{-- Submit button --}}
      <div class="mt-6">
        @!button({ text: 'Create Post', type: 'submit' })
      </div>
    @end
  </div>
@end
```

These Edge form components (`@form`, `@field.root`, `@input.control`, etc.) are part of the starter kit you used to create your app. They render standard HTML elements but with some helpful features built in. For example, the `@!field.error()` component will automatically display validation errors for its field when validation fails.

:::

:::step{title="Add the create method to your controller"}

Now let's add a `create` method to your `PostsController` that renders this template.

```ts title="app/controllers/posts_controller.ts"
import type { HttpContext } from '@adonisjs/core/http'
import Post from '#models/post'

export default class PostsController {
  // ... existing methods (index, show)

  // insert-start
  /**
   * Display the form for creating a new post
   */
  async create({ view }: HttpContext) {
    return view.render('posts/create')
  }
  // insert-end
}
```

At this point, if you start your development server and visit `/posts/create` (while logged in), you should see your form. Try filling it out and submitting it—you'll get an error because we haven't handled the form submission yet. Let's fix that next.

:::

:::step{title="Create a validator"}

Before we can process the form submission, we need to define validation rules. AdonisJS uses VineJS for validation. Let's create a validator for posts using the Ace CLI.

```bash
node ace make:validator post
```

This creates a new file at `app/validators/post.ts`. One validator file can export multiple validators—we'll add a `createPostValidator` for creating posts.

```ts title="app/validators/post.ts"
import vine from '@vinejs/vine'

/**
 * Validates the post's creation form
 */
export const createPostValidator = vine.compile(
  vine.object({
    title: vine.string().trim().minLength(3).maxLength(255),
    url: vine.string().trim().url(),
    summary: vine.string().trim().minLength(80).maxLength(500),
  })
)
```

Here's what these rules mean: title must be a string with whitespace trimmed, between 3 and 255 characters; url must be a valid URL format; and summary must be at least 80 characters (so it's actually a summary) with a maximum of 500 characters.

:::

:::step{title="Handle the form submission"}

Now let's add the `store` method to your controller to handle the form submission. This method will validate the incoming data, create a new post, and redirect the user.

```ts title="app/controllers/posts_controller.ts"
import type { HttpContext } from '@adonisjs/core/http'
import Post from '#models/post'
// [!code ++:1]
import { createPostValidator } from '#validators/post'

export default class PostsController {
  // ... existing methods

  // [!code ++:24]
  /**
   * Handle the form submission for creating a new post
   */
  async store({ request, auth, response }: HttpContext) {
    /**
     * Validate the request body against our validation rules.
     * If validation fails, the user is redirected back with errors.
     */
    const payload = await request.validateUsing(createPostValidator)

    /**
     * Create a new post with the validated data.
     * We associate it with the currently logged-in user.
     */
    await Post.create({
      ...payload,
      userId: auth.user!.id,
    })

    /**
     * Redirect to the posts index page after successful creation
     */
    return response.redirect().toRoute('posts.index')
  }
}
```

Let's break down what's happening here. When the form is submitted, `request.validateUsing(createPostValidator)` validates the incoming data against the rules we defined. If validation fails, AdonisJS automatically redirects the user back to the form with the validation errors, which the `@!field.error()` components will display.

If validation succeeds, we create a new post using `Post.create()`. Notice we're spreading the validated `payload` and adding the `userId` from the currently authenticated user (`auth.user!.id`). The exclamation mark tells TypeScript we're certain the user exists—and we can be certain because the `auth()` middleware guarantees it.

Finally, we redirect to the posts index page so the user can see their newly created post.

:::

:::step{title="Try it out"}

Start your development server if it's not already running, log in, and visit `/posts/create`. Fill out the form and submit it. You should see your new post appear on the posts index page!

Try submitting invalid data too—like a URL without the `https://` protocol, or a summary that's too short. You'll see validation errors appear next to the relevant fields.

:::

::::

## Adding comments to posts

Now that you can create posts, let's add the ability for users to leave comments on them. We'll follow a similar pattern, but this time we'll create a separate controller for comments. Having one controller per resource is the recommended approach in AdonisJS—it keeps your code organized and makes it easier to maintain.

::::steps

:::step{title="Create the CommentsController"}

Generate a new controller using the Ace CLI:

```bash
node ace make:controller comments
```

This creates `app/controllers/comments_controller.ts`. Let's add a `store` method to handle comment submissions.

```ts title="app/controllers/comments_controller.ts"
import type { HttpContext } from '@adonisjs/core/http'
import Comment from '#models/comment'
import { createCommentValidator } from '#validators/comment'

export default class CommentsController {
  /**
   * Handle the form submission for creating a new comment
   */
  async store({ request, auth, params, response }: HttpContext) {
    /**
     * Validate the comment content
     */
    const payload = await request.validateUsing(createCommentValidator)

    /**
     * Create a new comment associated with the post and the user.
     * The postId comes from the route parameter.
     */
    await Comment.create({
      ...payload,
      postId: params.id,
      userId: auth.user!.id,
    })

    /**
     * Redirect back to the post page so the user sees their comment
     */
    return response.redirect().back()
  }
}
```

Notice we're using `params.id` to get the post ID from the route parameter (we'll define this route next), and `response.redirect().back()` to send the user back to the post page they were viewing.

:::

:::step{title="Create the comment validator"}

Create a validator for comments:

```bash
node ace make:validator comment
```

Since comments only have a content field, the validation is simpler:

```ts title="app/validators/comment.ts"
import vine from '@vinejs/vine'

/**
 * Validates the comment's creation form
 */
export const createCommentValidator = vine.compile(
  vine.object({
    content: vine.string().trim().minLength(1),
  })
)
```

We just need to ensure the comment content exists and isn't empty.

:::

:::step{title="Add the comment route"}

Add a route for creating comments. This route should also be protected by the auth middleware.

```ts title="start/routes.ts"
import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'

// ... existing routes

// [!code ++:4]
/**
 * Route for creating comments on a post
 */
router.post('/posts/:id/comments', '#controllers/comments_controller.store').use(middleware.auth())
```

The `:id` parameter in the route will contain the post ID, which we accessed as `params.id` in the controller.

:::

:::step{title="Add the comment form to the post show page"}

Finally, let's add a form to the post show page where users can leave comments. Open your `resources/views/posts/show.edge` template and add this form after the post content but before the comments list:

```edge
{{-- title: resources/views/posts/show.edge --}}
@let(title = post.title)

@!layouts.main({ title })
{{-- ... existing post display code ... --}}

{{-- insert-start --}}
{{-- Comment form section --}}
<div class="mt-8">
  <h2 class="text-2xl font-bold mb-4">
    Leave a comment
  </h2>

  @form({ action: route('posts.comments.store', [post.id]) })
    @field.root({ name: 'content' })
      @!textarea.control({
          rows: 3,
          placeholder: 'Share your thoughts...'
      })
      @!field.error()
    @end
    
    <div class="mt-4">
      @!button({ text: 'Post comment', type: 'submit' })
    </div>
  @end
</div>
{{-- insert-end --}}

{{-- Comments list (if you have one) --}}
{{-- ... --}}
@end
```

Notice we're passing the post ID to the route helper: `route('posts.comments.store', [post.id])`. This generates the correct URL like `/posts/1/comments`.

:::

:::step{title="Try it out"}

Visit any post page while logged in. You should see the comment form at the bottom. Try leaving a comment—after submitting, you'll be redirected back to the same post page, and your comment should appear in the comments list.

:::

::::

## What you learned

You've now added full form handling and validation to your DevShow application. Here's what you accomplished:

- Created forms using Edge form components (`@form`, `@field.root`, `@input.control`, etc.)
- Defined validation rules using VineJS validators
- Validated form submissions in your controllers using `request.validateUsing()`
- Protected routes with the `auth()` middleware to ensure only logged-in users can create content
- Associated posts and comments with users using `auth.user!.id`
- Organized your code by creating separate controllers for different resources (PostsController and CommentsController)
- Handled form errors automatically with the `@!field.error()` component

The pattern you learned here—create form, define validator, validate in controller, persist to database—is one you'll use throughout your AdonisJS applications.
