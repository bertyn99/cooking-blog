import { eq } from 'drizzle-orm'
import type { AppDb } from '../../db/create-db'
import { schema } from '../../db/create-db'
import type { GenerationStepKey, GenerationTargetType } from '../../db/queries/content-generation'
import { createArticleQueries } from '../../db/queries/articles'
import { createRecipeQueries } from '../../db/queries/recipes'
import { slugifyString } from '../../utils/slug'
import type { GenerationArtifactStore } from './artifact-storage'

export interface SourcePack {
  title?: string
  locale?: string
  markdown?: string
  sourceUrl?: string
}

export interface AssembleArtifact {
  title: string
  content?: string | null
  locale: string
}

function defaultTitleFromSource(source: SourcePack | null, targetType: GenerationTargetType) {
  if (source?.title?.trim()) {
    return source.title.trim()
  }
  return targetType === 'recipe' ? 'Nouvelle recette (IA)' : 'Nouvel article (IA)'
}

export async function applyAssembledDraft(
  db: AppDb,
  input: {
    targetType: GenerationTargetType
    articleId?: number | null
    recipeId?: number | null
    requestedByUserId?: number | null
    assemble: AssembleArtifact
  },
): Promise<{ articleId?: number, recipeId?: number }> {
  const now = new Date().toISOString()
  const locale = input.assemble.locale || 'fr'

  if (input.targetType === 'article') {
    if (input.articleId) {
      await db
        .update(schema.articles)
        .set({
          title: input.assemble.title,
          content: input.assemble.content ?? null,
          requiresHumanReview: true,
          updatedAt: now,
          ...(input.requestedByUserId
            ? { updatedByUserId: input.requestedByUserId }
            : {}),
        })
        .where(eq(schema.articles.id, input.articleId))
      return { articleId: input.articleId }
    }

    const articles = createArticleQueries(db)
    const slug = await articles.reserveUniqueSlug(
      slugifyString(input.assemble.title),
      locale,
    )
    const article = await articles.insert({
      title: input.assemble.title,
      content: input.assemble.content ?? null,
      slug,
      locale,
      status: 'draft',
      requiresHumanReview: true,
      createdByUserId: input.requestedByUserId ?? null,
      updatedByUserId: input.requestedByUserId ?? null,
      createdAt: now,
      updatedAt: now,
    })
    return { articleId: article?.id }
  }

  if (input.recipeId) {
    await db
      .update(schema.recipes)
      .set({
        title: input.assemble.title,
        intro: input.assemble.content ?? null,
        requiresHumanReview: true,
        updatedAt: now,
        ...(input.requestedByUserId ? { updatedByUserId: input.requestedByUserId } : {}),
      })
      .where(eq(schema.recipes.id, input.recipeId))
    return { recipeId: input.recipeId }
  }

  const recipes = createRecipeQueries(db)
  const slug = await recipes.reserveUniqueSlug(slugifyString(input.assemble.title), locale)
  const recipe = await recipes.insert({
    title: input.assemble.title,
    intro: input.assemble.content ?? null,
    slug,
    locale,
    status: 'draft',
    requiresHumanReview: true,
    createdByUserId: input.requestedByUserId ?? null,
    updatedByUserId: input.requestedByUserId ?? null,
    createdAt: now,
    updatedAt: now,
  })
  return { recipeId: recipe?.id }
}

export async function executeGenerationStep(
  db: AppDb,
  artifacts: GenerationArtifactStore,
  run: {
    id: string
    targetType: GenerationTargetType
    articleId?: number | null
    recipeId?: number | null
    artifactPrefix: string
    requestedByUserId?: number | null
  },
  stepKey: GenerationStepKey,
): Promise<{ artifactKey: string, linkedArticleId?: number, linkedRecipeId?: number }> {
  const source = await artifacts.getJson<SourcePack>(run.artifactPrefix, 'source-pack')

  switch (stepKey) {
    case 'normalize': {
      const payload = {
        normalizedAt: new Date().toISOString(),
        sourceUrl: source?.sourceUrl ?? null,
        locale: source?.locale ?? 'fr',
      }
      const artifactKey = await artifacts.putJson(run.artifactPrefix, stepKey, payload)
      return { artifactKey }
    }
    case 'classify': {
      const artifactKey = await artifacts.putJson(run.artifactPrefix, stepKey, {
        contentKind: run.targetType,
        classifiedAt: new Date().toISOString(),
      })
      return { artifactKey }
    }
    case 'extract': {
      const artifactKey = await artifacts.putJson(run.artifactPrefix, stepKey, {
        title: defaultTitleFromSource(source, run.targetType),
        excerpt: source?.markdown?.slice(0, 280) ?? null,
        evidenceChunks: source?.markdown ? [{ text: source.markdown.slice(0, 2000) }] : [],
      })
      return { artifactKey }
    }
    case 'assemble': {
      const extract = await artifacts.getJson<{ title?: string, excerpt?: string | null }>(
        run.artifactPrefix,
        'extract',
      )
      const assemble: AssembleArtifact = {
        title: extract?.title ?? defaultTitleFromSource(source, run.targetType),
        content: source?.markdown ?? null,
        locale: source?.locale ?? 'fr',
      }
      const artifactKey = await artifacts.putJson(run.artifactPrefix, stepKey, assemble)
      const linked = await applyAssembledDraft(db, {
        targetType: run.targetType,
        articleId: run.articleId,
        recipeId: run.recipeId,
        requestedByUserId: run.requestedByUserId,
        assemble,
      })
      return {
        artifactKey,
        linkedArticleId: linked.articleId,
        linkedRecipeId: linked.recipeId,
      }
    }
    case 'validate': {
      const artifactKey = await artifacts.putJson(run.artifactPrefix, stepKey, {
        valid: true,
        validatedAt: new Date().toISOString(),
      })
      return { artifactKey }
    }
    case 'generate_cover': {
      const artifactKey = await artifacts.putJson(run.artifactPrefix, stepKey, {
        skipped: true,
        reason: 'Workers AI cover not wired yet',
      })
      return { artifactKey }
    }
    default: {
      const _exhaustive: never = stepKey
      return _exhaustive
    }
  }
}
