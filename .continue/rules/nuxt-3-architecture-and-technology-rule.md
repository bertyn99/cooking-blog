---
description: Enforce consistent Nuxt 3 architecture with integrated Strapi CMS and module usage.
globs: "package.json, nuxt.config.ts, **/*.{vue,ts,json}"
alwaysApply: false
---

- **Project Structure & Global Settings**
  - Ensure the application uses Nuxt Config as the single source for global settings.
  - Leverage the predefined structure with clearly separated directories for composables, providers, utils, components, pages, and layouts.
  - Maintain environment-specific runtime configurations (e.g., language, site URL) in nuxt.config.ts.

- **Module & Dependency Management**
  - **DO:** Use Nuxt modules like @nuxtjs/tailwindcss, @nuxt-alt/proxy, @nuxt/icon, @nuxtjs/seo, and nuxt-umami.
  - **DO:** Integrate Strapi for CMS using proper configurations (API prefix, version, cookie management, and runtime env variables).
  - **DON'T:** Hard-code values; always use process.env for sensitive or environment-specific settings.

- **API Proxy & Image Provider Configuration**
  - Configure proxy settings meticulously for API requests (e.g., rewriting /uploads routes) in nuxt.config.ts.
  - Setup image providers with clear baseURL settings (see providers/localImageSharp.ts).

- **SEO & Site Metadata**
  - Centralize site metadata, including SEO, open graph, and Twitter card details, within the Nuxt configuration.
  - Utilize proper modules and configurations for SEO as defined in the project (e.g., @nuxtjs/seo).

- **Strapi Integration**
  - Standardize Strapi CMS integration: set the API URL, prefix, version, and cookie settings clearly in nuxt.config.ts.
  - Ensure consistency between the Strapi integration and other runtime configurations.

- **Code Consistency Across the Codebase**
  - Adhere to the structure and naming conventions observed for composables (e.g., useReadingTime), providers (e.g., localImageSharp), types, and utilities.
  - Cross-reference actual file implementations and ensure that all modules (e.g., for articles, recipes, images) follow the established architectural guidelines.