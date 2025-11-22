# Pick Your Path

This guide introduces AdonisJS's approach to frontend development and the three primary stacks you can choose from. You will learn why AdonisJS is backend-first but frontend-flexible, understand the difference between Hypermedia, Inertia, and API-only approaches, see how the View layer works in each stack, and learn about the starter kits that provide opinionated setups for each approach.

## Overview

AdonisJS takes a fundamentally different approach to building full-stack applications. While the framework is deeply opinionated about the backend—providing built-in authentication, authorization, validation, database tooling, and more—it remains deliberately flexible about the frontend.

This backend-first philosophy means you get a robust foundation for building your application's server-side logic, but you're free to choose how you build your user interface. You can create traditional server-rendered applications, modern single-page applications, or anything in between, all using the same backend framework.

This flexibility isn't a lack of opinion. It's an intentional design decision that recognizes different applications have different frontend needs. A marketing website has different requirements than an admin dashboard, which differs from a mobile app's API backend. Rather than forcing you into a single approach, AdonisJS provides the backend foundation and lets you choose the frontend stack that fits your needs.

You can use AdonisJS to build Hypermedia-driven applications with minimal JavaScript, modern SPAs that consume JSON APIs, mobile app backends, or hybrid applications using Inertia.js. The same backend framework adapts to all these use cases without requiring you to learn a new framework for each approach.

Understanding these different stacks is essential when using AdonisJS because the framework doesn't prescribe a single way to build frontends. While this flexibility gives you freedom, you're not left to figure everything out yourself. AdonisJS provides starter kits with opinionated configurations for each approach, giving you a solid starting point with best practices already in place.

## The three approaches

AdonisJS supports three primary approaches to building your frontend. Each approach represents a different way of thinking about the View layer in your application's architecture.

### Hypermedia

Hypermedia applications generate complete HTML pages on the server and send them to the browser. You build your interface using a template engine (AdonisJS provides Edge) and add interactivity using lightweight JavaScript libraries like Alpine.js or HTMX/Unpoly when needed.

In a Hypermedia application, the server is responsible for rendering your views. Your controllers return HTML instead of JSON, and navigation between pages happens through traditional page loads or progressively enhanced requests. This approach embraces the web's native capabilities and keeps most of your application's logic on the server where you have full control.

The term "Hypermedia" refers to HTML as a medium for building interactive applications, where the server drives the application state and the client (browser) displays it. If you're new to this concept, the HTMX project has an excellent essay explaining [Hypermedia-driven applications](https://htmx.org/essays/hypermedia-driven-applications/) in depth.

Choose this approach when you want to build applications with the server in control, you prefer working primarily in one language (TypeScript) across your stack, or you want to minimize the amount of JavaScript your users download. Hypermedia applications can be highly interactive using libraries like Alpine.js and HTMX while keeping your frontend codebase lean and your deployment simple.

### Inertia (React or Vue)

Inertia.js provides a middle ground between server-rendered templates and SPAs. You use React or Vue components as your views while keeping server-side routing and controllers. AdonisJS officially supports building applications with React or Vue through Inertia, giving you the component-based development experience of modern frontend frameworks without the complexity of maintaining a separate single-page application.

With Inertia, your backend routes map directly to frontend components. Your controllers return data to Inertia components instead of rendering templates or returning JSON. Navigation feels like a single-page application with smooth transitions, but your routing logic stays on the server where it's easier to protect and maintain.

Inertia eliminates the need for dual routing systems (server routes and client routes), reduces the complexity of state management on the frontend, and simplifies form submissions and data fetching. Your application remains a monolithic deployment while providing a modern, reactive user experience.

Choose this approach when you want to use React or Vue but prefer server-side routing, you want to avoid building and maintaining a separate API, or you want a tightly integrated full-stack development experience. Visit [inertiajs.com](https://inertiajs.com) to learn more about how Inertia bridges the gap between server-side and client-side frameworks.

### API-only

You can build a JSON API backend with AdonisJS while your frontend lives in a completely separate codebase. This approach creates a clear separation where AdonisJS handles all backend logic and exposes data through API endpoints, while your frontend application (built with any framework) consumes these endpoints.

In an API-only setup, your controllers return JSON responses instead of HTML or Inertia responses. Your frontend and backend are separate deployments with their own build processes, repositories, and deployment pipelines. The two communicate exclusively through HTTP requests to your API endpoints.

This approach covers a wide variety of applications: APIs for mobile apps (iOS, Android), web applications built with any frontend framework, desktop applications, or even multiple frontends (web and mobile) consuming the same API. The separation provides flexibility in how you deploy and scale each layer independently.

Choose this approach when you're building an API that serves multiple client applications, your team prefers working with separate frontend and backend repositories, you need independent deployment and scaling of frontend and backend, or you're building a public API that external developers will consume.

## How the View layer works

In all three approaches, you're working with the View layer of the MVC architecture. The difference is what your View layer returns and how it's consumed. Here's how the same functionality looks across the three stacks:
```typescript
// title: app/controllers/posts_controller.ts
import Post from '#models/post'
import { HttpContext } from '@adonisjs/core/http'

export default class PostsController {
  /**
   * Hypermedia approach: Return rendered HTML
   * The Edge template receives data and renders complete HTML
   */
  async index({ view }: HttpContext) {
    const posts = await Post.all()
    return view.render('posts/index', { posts })
  }

  /**
   * Inertia approach: Return data to a React/Vue component  
   * Inertia passes the data to your frontend component
   */
  async index({ inertia }: HttpContext) {
    const posts = await Post.all()
    return inertia.render('Posts/Index', { posts })
  }

  /**
   * API-only approach: Return JSON
   * The frontend fetches this endpoint and handles rendering
   */
  async index({ response }: HttpContext) {
    const posts = await Post.all()
    return response.json({ posts })
  }
}
```

Notice how the controller structure remains consistent. You're still working with routes, controllers, and models. The only difference is what you return from your controller action. This consistency means you can even mix approaches within the same application—use Hypermedia for public-facing pages and an API for your mobile app, all powered by the same AdonisJS backend.

## What NOT to expect

If you're coming from meta-frameworks, there are some patterns you won't find in AdonisJS. These differences are intentional and provide clarity about how your application works.

**No file-based routing**: AdonisJS uses explicit route definitions in your route files. Routes are declared using the router API, giving you full control and visibility over your application's URL structure. This makes it easy to see all your routes in one place and apply middleware or constraints as needed.

**No compiler magic with "use" directives**: You won't find magical statements like "use server" or "use client" that blur the boundaries between where code executes. AdonisJS maintains a clear separation between your backend code (which runs on the server) and your frontend code (which runs in the browser).

**No mixing of server and client code**: Your backend logic lives in controllers, models, and services. Your frontend code lives in templates, components, or a separate frontend application. There's no ambiguity about where code runs, which makes debugging straightforward and helps teams work with well-defined boundaries.

This separation provides clarity about where code executes, makes debugging predictable, and allows teams to work with clear contracts between frontend and backend. When your frontend needs data from your backend, you work with explicit API calls or template data passing, not magical boundaries that blur at compile time.

## Starter kits

While AdonisJS gives you the flexibility to choose your frontend approach, you don't have to configure everything from scratch. The framework provides starter kits for each approach that come with opinionated configurations and best practices already in place.

These starter kits include properly configured build tools, authentication scaffolding, example code following best practices, and all the necessary integrations set up correctly. When you create a new AdonisJS application, you can choose which starter kit to use based on the approach you've decided on.

The starter kits give you the "flexible but not on your own" experience. You get to choose your stack, but once you've chosen, you get a fully configured setup that works out of the box.

## Next steps

Now that you understand the three approaches AdonisJS supports, you're ready to create your first application. The installation guide will walk you through using the starter kits to set up a new project with your chosen stack.

After creating your application, you can explore the specific guides for your chosen approach:

- Learn how to build with [Edge templates](../views-and-templates/edgejs.md) for Hypermedia applications
- Set up [Inertia.js](../views-and-templates/inertia.md) with React or Vue for hybrid applications  
- Configure [Vite integration](../views-and-templates/vite.md) for asset bundling
- Build [API endpoints](../controllers-and-routes/controllers.md) for API-only applications