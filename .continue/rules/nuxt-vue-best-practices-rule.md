---
name: "Nuxt-Vue Best Practices"
description: "Enforce modern best practices for Nuxt and Vue, including centralized configuration, Composition API, TypeScript, and consistent coding standards."
globs: "nuxt.config.ts, **/*.{vue,ts,js,md}"
alwaysApply: true
---

Ensure that the project follows modern Nuxt and Vue best practices. This includes:
1. Centralizing global configuration in nuxt.config.ts and using environment variables for sensitive settings.
2. Employing the Composition API and Single File Components (SFCs) to organize UI, logic, and state management.
3. Maintaining a clear directory structure (pages, components, layouts, composables, plugins, etc.) that reflects separation of concerns.
4. Leveraging TypeScript for type safety and improved developer experience.
5. Using VueUse for utility composables to enhance code modularity and reusability.
6. Adhering to consistent naming conventions and coding standards, including proper use of Vue reactivity and lifecycle hooks.
7. Ensuring proper dependency injection for plugins and third-party libraries to maintain modularity.