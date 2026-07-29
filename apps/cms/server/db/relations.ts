import { defineRelations } from 'drizzle-orm'
import * as schema from './schema'

export const relations = defineRelations(schema, (r) => ({
  articles: {
    category: r.one.categoryArticles({
      from: r.articles.categoryId,
      to: r.categoryArticles.id,
    }),
    cover: r.one.blobs({
      from: r.articles.coverBlobPathname,
      to: r.blobs.pathname,
    }),
    seo: r.one.seo({
      from: r.articles.id,
      to: r.seo.articleId,
    }),
    generationRuns: r.many.contentGenerationRuns({
      from: r.articles.id,
      to: r.contentGenerationRuns.articleId,
    }),
  },
  categoryArticles: {
    articles: r.many.articles({
      from: r.categoryArticles.id,
      to: r.articles.categoryId,
    }),
  },
  categories: {
    categoryBlobs: r.many.categoryBlobs({
      from: r.categories.id,
      to: r.categoryBlobs.categoryId,
    }),
    recipes: r.many.recipes({
      from: r.categories.id,
      to: r.recipes.categoryId,
    }),
  },
  categoryBlobs: {
    category: r.one.categories({
      from: r.categoryBlobs.categoryId,
      to: r.categories.id,
    }),
    blob: r.one.blobs({
      from: r.categoryBlobs.blobPathname,
      to: r.blobs.pathname,
    }),
  },
  recipes: {
    category: r.one.categories({
      from: r.recipes.categoryId,
      to: r.categories.id,
    }),
    cover: r.one.blobs({
      from: r.recipes.coverBlobPathname,
      to: r.blobs.pathname,
    }),
    nutrition: r.one.nutrition({
      from: r.recipes.id,
      to: r.nutrition.recipeId,
    }),
    ingredients: r.many.ingredients({
      from: r.recipes.id,
      to: r.ingredients.recipeId,
    }),
    utensils: r.many.recipeUtensils({
      from: r.recipes.id,
      to: r.recipeUtensils.recipeId,
    }),
    steps: r.many.recipeSteps({
      from: r.recipes.id,
      to: r.recipeSteps.recipeId,
    }),
    reviews: r.many.reviews({
      from: r.recipes.id,
      to: r.reviews.recipeId,
    }),
    seo: r.one.seo({
      from: r.recipes.id,
      to: r.seo.recipeId,
    }),
    generationRuns: r.many.contentGenerationRuns({
      from: r.recipes.id,
      to: r.contentGenerationRuns.recipeId,
    }),
  },
  recipeSteps: {
    recipe: r.one.recipes({
      from: r.recipeSteps.recipeId,
      to: r.recipes.id,
    }),
  },
  ingredients: {
    recipe: r.one.recipes({
      from: r.ingredients.recipeId,
      to: r.recipes.id,
    }),
  },
  recipeUtensils: {
    recipe: r.one.recipes({
      from: r.recipeUtensils.recipeId,
      to: r.recipes.id,
    }),
  },
  nutrition: {
    recipe: r.one.recipes({
      from: r.nutrition.recipeId,
      to: r.recipes.id,
    }),
  },
  reviews: {
    recipe: r.one.recipes({
      from: r.reviews.recipeId,
      to: r.recipes.id,
    }),
  },
  pages: {
    parent: r.one.pages({
      from: r.pages.parentId,
      to: r.pages.id,
    }),
    seoMeta: r.one.seo({
      from: r.pages.id,
      to: r.seo.pageId,
    }),
  },
  seo: {
    socialMeta: r.many.socialMeta({
      from: r.seo.id,
      to: r.socialMeta.seoId,
    }),
  },
  socialMeta: {
    seo: r.one.seo({
      from: r.socialMeta.seoId,
      to: r.seo.id,
    }),
    image: r.one.blobs({
      from: r.socialMeta.imageBlobPathname,
      to: r.blobs.pathname,
    }),
  },
  sessions: {
    user: r.one.users({
      from: r.sessions.userId,
      to: r.users.id,
    }),
  },
  contentGenerationRuns: {
    steps: r.many.contentGenerationRunSteps({
      from: r.contentGenerationRuns.id,
      to: r.contentGenerationRunSteps.runId,
    }),
    article: r.one.articles({
      from: r.contentGenerationRuns.articleId,
      to: r.articles.id,
    }),
    recipe: r.one.recipes({
      from: r.contentGenerationRuns.recipeId,
      to: r.recipes.id,
    }),
  },
  contentGenerationRunSteps: {
    run: r.one.contentGenerationRuns({
      from: r.contentGenerationRunSteps.runId,
      to: r.contentGenerationRuns.id,
    }),
  },
  tags: {
    contentTags: r.many.contentTags({
      from: r.tags.id,
      to: r.contentTags.tagId,
    }),
  },
  contentTags: {
    tag: r.one.tags({
      from: r.contentTags.tagId,
      to: r.tags.id,
    }),
  },
  mediaFolders: {
    parent: r.one.mediaFolders({
      from: r.mediaFolders.parentId,
      to: r.mediaFolders.id,
    }),
  },
  navigationItems: {
    parent: r.one.navigationItems({
      from: r.navigationItems.parentId,
      to: r.navigationItems.id,
    }),
  },
}))
