import { defineRelations } from 'drizzle-orm'
import * as schema from 'hub:db:schema'

export const relations = defineRelations(schema, (r) => ({
  articles: {
    category: r.one.categories({
      from: r.articles.categoryId,
      to: r.categories.id,
    }),
    cover: r.one.blobs({
      from: r.articles.coverBlobPathname,
      to: r.blobs.pathname,
    }),
    seo: r.one.seo({
      from: r.articles.id,
      to: r.seo.articleId,
    }),
  },
  categories: {
    categoryBlobs: r.many.categoryBlobs({
      from: r.categories.id,
      to: r.categoryBlobs.categoryId,
    }),
  },
  categoryBlobs: {
    category: r.one.categories({
      from: r.categoryBlobs.categoryId,
      to: r.categories.id,
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
    reviews: r.many.reviews({
      from: r.recipes.id,
      to: r.reviews.recipeId,
    }),
    seo: r.one.seo({
      from: r.recipes.id,
      to: r.seo.recipeId,
    }),
  },
  ingredients: {
    recipe: r.one.recipes({
      from: r.ingredients.recipeId,
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
  },
}))
