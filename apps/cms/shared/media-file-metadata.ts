import { formatMediaByteSize } from './media'

/** Normalized metadata from EXIF / IPTC / XMP embedded in image files. */
export interface MediaFileMetadata {
  title?: string
  description?: string
  caption?: string
  headline?: string
  keywords?: string[]
  copyright?: string
  rights?: string
  creator?: string
  credit?: string
  source?: string
  location?: {
    latitude?: number
    longitude?: number
    altitude?: number
    city?: string
    state?: string
    country?: string
    locationName?: string
  }
  capturedAt?: string
  camera?: string
  lens?: string
  iso?: number
  aperture?: string
  shutterSpeed?: string
  focalLength?: string
  orientation?: number
  software?: string
  colorSpace?: string
}

export interface MediaDetailField {
  label: string
  value: string
}

export interface MediaDetailSection {
  id: string
  title: string
  fields: MediaDetailField[]
}

function pushField(fields: MediaDetailField[], label: string, value: unknown) {
  if (value === undefined || value === null || value === '') {
    return
  }
  const text = Array.isArray(value) ? value.filter(Boolean).join(', ') : String(value)
  if (!text.trim()) {
    return
  }
  fields.push({ label, value: text.trim() })
}

function formatGps(lat?: number, lon?: number) {
  if (lat === undefined || lon === undefined) {
    return undefined
  }
  return `${lat.toFixed(5)}°, ${lon.toFixed(5)}°`
}

function formatCapturedAt(iso?: string) {
  if (!iso) {
    return undefined
  }
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) {
    return iso
  }
  return date.toLocaleString('fr-FR')
}

/**
 * Build grouped fields for the media detail “show more” UI (French labels).
 */
export function buildMediaDetailSections(input: {
  altText?: string | null
  metadata?: MediaFileMetadata | null
  pathname?: string
  contentType?: string
  etag?: string
  storageSize?: number
  catalogSize?: number
  updatedAt?: string
}): MediaDetailSection[] {
  const meta = input.metadata ?? {}
  const sections: MediaDetailSection[] = []

  const descriptionFields: MediaDetailField[] = []
  pushField(descriptionFields, 'Texte alternatif', input.altText)
  pushField(descriptionFields, 'Titre', meta.title)
  pushField(descriptionFields, 'Description', meta.description ?? meta.caption)
  pushField(descriptionFields, 'Légende', meta.caption && meta.caption !== meta.description ? meta.caption : undefined)
  pushField(descriptionFields, 'Titre court (headline)', meta.headline)
  pushField(descriptionFields, 'Mots-clés', meta.keywords)
  if (descriptionFields.length) {
    sections.push({ id: 'description', title: 'Description', fields: descriptionFields })
  }

  const rightsFields: MediaDetailField[] = []
  pushField(rightsFields, 'Droits d\'auteur', meta.copyright)
  pushField(rightsFields, 'Droits d\'usage', meta.rights)
  pushField(rightsFields, 'Créateur', meta.creator)
  pushField(rightsFields, 'Crédit', meta.credit)
  pushField(rightsFields, 'Source', meta.source)
  if (rightsFields.length) {
    sections.push({ id: 'rights', title: 'Droits & attribution', fields: rightsFields })
  }

  const loc = meta.location
  const locationFields: MediaDetailField[] = []
  pushField(locationFields, 'Lieu', loc?.locationName)
  pushField(locationFields, 'Ville', loc?.city)
  pushField(locationFields, 'Région / État', loc?.state)
  pushField(locationFields, 'Pays', loc?.country)
  pushField(locationFields, 'Coordonnées GPS', formatGps(loc?.latitude, loc?.longitude))
  pushField(locationFields, 'Altitude', loc?.altitude !== undefined ? `${loc.altitude} m` : undefined)
  if (locationFields.length) {
    sections.push({ id: 'location', title: 'Localisation', fields: locationFields })
  }

  const captureFields: MediaDetailField[] = []
  pushField(captureFields, 'Date de prise de vue', formatCapturedAt(meta.capturedAt))
  pushField(captureFields, 'Appareil', meta.camera)
  pushField(captureFields, 'Objectif', meta.lens)
  pushField(captureFields, 'ISO', meta.iso)
  pushField(captureFields, 'Ouverture', meta.aperture)
  pushField(captureFields, 'Vitesse', meta.shutterSpeed)
  pushField(captureFields, 'Focale', meta.focalLength)
  if (captureFields.length) {
    sections.push({ id: 'capture', title: 'Prise de vue', fields: captureFields })
  }

  const technicalFields: MediaDetailField[] = []
  pushField(technicalFields, 'Chemin stockage', input.pathname)
  pushField(technicalFields, 'Type MIME', input.contentType)
  pushField(technicalFields, 'Logiciel', meta.software)
  pushField(technicalFields, 'Espace colorimétrique', meta.colorSpace)
  pushField(technicalFields, 'Orientation EXIF', meta.orientation)
  pushField(technicalFields, 'Empreinte (etag)', input.etag)
  if (input.storageSize !== undefined) {
    pushField(technicalFields, 'Taille fichier stocké', formatMediaByteSize(input.storageSize))
  }
  if (input.catalogSize !== undefined && input.catalogSize !== input.storageSize) {
    pushField(technicalFields, 'Taille catalogue', formatMediaByteSize(input.catalogSize))
  }
  pushField(technicalFields, 'Dernière mise à jour', input.updatedAt
    ? new Date(input.updatedAt).toLocaleString('fr-FR')
    : undefined)
  if (technicalFields.length) {
    sections.push({ id: 'technical', title: 'Fichier & technique', fields: technicalFields })
  }

  return sections
}
