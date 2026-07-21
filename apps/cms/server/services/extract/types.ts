import type { H3Event } from 'h3'
import type { AppDb } from '../../db/create-db'
import type {
  StrapiEntityStats,
  StrapiImportProgress,
  StrapiImportResult,
  StrapiImportSlugFilter,
  StrapiImportStep,
} from '../../../shared/strapi-import'

export type {
  StrapiEntityStats,
  StrapiImportProgress,
  StrapiImportResult,
  StrapiImportStep,
}

export {
  formatStepStatsMessage,
  resolveImportSteps,
  STRAPI_IMPORT_STEP_DEPS,
  STRAPI_IMPORT_STEPS,
} from '../../../shared/strapi-import'

export { emptyStats, strapiSourceId } from './types.server'

export interface ExtractContext {
  db: AppDb
  strapiUrl: string
  strapiApiToken?: string
  strapiUploadsOrigin?: string
  dryRun: boolean
  steps: StrapiImportStep[]
  slugFilter?: StrapiImportSlugFilter
  event?: H3Event
  log: (message: string) => void
  onStepStart?: (step: StrapiImportStep) => void | Promise<void>
}

export interface StrapiMediaFile {
  id?: number
  documentId?: string
  name?: string
  alternativeText?: string
  caption?: string
  width?: number
  height?: number
  hash?: string
  ext?: string
  mime?: string
  size?: number
  url?: string
}

export interface StrapiSeoFields {
  id?: number
  description?: string
  keywords?: string
  metaRobots?: string
}
