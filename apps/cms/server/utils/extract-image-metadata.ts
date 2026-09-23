import type { H3Event } from 'h3'
import exifr from 'exifr'
import type { MediaFileMetadata } from '../../shared/media-file-metadata'
import { useMediaStorage } from './media-storage'

function asString(value: unknown): string | undefined {
  if (value === undefined || value === null) {
    return undefined
  }
  if (typeof value === 'string') {
    return value.trim() || undefined
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value)
  }
  return undefined
}

function asNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : undefined
  }
  return undefined
}

function keywordsFromExif(raw: Record<string, unknown>): string[] | undefined {
  const fromList = raw.Keywords ?? raw.Subject ?? raw.tags
  if (Array.isArray(fromList)) {
    const items = fromList.map(item => asString(item)).filter(Boolean) as string[]
    return items.length ? items : undefined
  }
  const text = asString(fromList)
  if (!text) {
    return undefined
  }
  return text.split(/[,;]/).map(part => part.trim()).filter(Boolean)
}

function capturedAtFromExif(raw: Record<string, unknown>): string | undefined {
  const date = raw.DateTimeOriginal ?? raw.CreateDate ?? raw.ModifyDate ?? raw.DateTime
  if (date instanceof Date && !Number.isNaN(date.getTime())) {
    return date.toISOString()
  }
  return asString(date)
}

function cameraFromExif(raw: Record<string, unknown>): string | undefined {
  const make = asString(raw.Make)
  const model = asString(raw.Model)
  if (make && model) {
    return `${make} ${model}`
  }
  return model ?? make
}

function lensFromExif(raw: Record<string, unknown>): string | undefined {
  return asString(raw.LensModel ?? raw.Lens ?? raw.LensSpecification)
}

function apertureFromExif(raw: Record<string, unknown>): string | undefined {
  const f = asNumber(raw.FNumber ?? raw.ApertureValue)
  if (f === undefined) {
    return undefined
  }
  return `f/${f}`
}

function shutterFromExif(raw: Record<string, unknown>): string | undefined {
  const exposure = asNumber(raw.ExposureTime)
  if (exposure === undefined) {
    return asString(raw.ShutterSpeedValue)
  }
  if (exposure >= 1) {
    return `${exposure}s`
  }
  return `1/${Math.round(1 / exposure)}s`
}

function focalFromExif(raw: Record<string, unknown>): string | undefined {
  const mm = asNumber(raw.FocalLength)
  if (mm === undefined) {
    return undefined
  }
  return `${mm} mm`
}

function locationFromExif(raw: Record<string, unknown>): MediaFileMetadata['location'] {
  const latitude = asNumber(raw.latitude ?? raw.GPSLatitude)
  const longitude = asNumber(raw.longitude ?? raw.GPSLongitude)
  const altitude = asNumber(raw.GPSAltitude)
  const city = asString(raw.City ?? raw.LocationCreatedCity)
  const state = asString(raw.State ?? raw.ProvinceState ?? raw.LocationCreatedProvinceState)
  const country = asString(raw.Country ?? raw.LocationCreatedCountryName ?? raw.CountryCode)
  const locationName = asString(
    raw.Location ?? raw.Sublocation ?? raw.LocationCreatedLocationName ?? raw.GPSAreaInformation,
  )

  if (
    latitude === undefined
    && longitude === undefined
    && altitude === undefined
    && !city
    && !state
    && !country
    && !locationName
  ) {
    return undefined
  }

  return {
    latitude,
    longitude,
    altitude,
    city,
    state,
    country,
    locationName,
  }
}

export function normalizeExifRecord(raw: Record<string, unknown> | null | undefined): MediaFileMetadata | null {
  if (!raw || !Object.keys(raw).length) {
    return null
  }

  const description = asString(
    raw.ImageDescription
    ?? raw.Description
    ?? raw.Caption
    ?? raw.UserComment
    ?? raw.XPTitle,
  )

  const metadata: MediaFileMetadata = {
    title: asString(raw.Title ?? raw.ObjectName ?? raw.Headline),
    description,
    caption: asString(raw.Caption ?? raw.Description),
    headline: asString(raw.Headline),
    keywords: keywordsFromExif(raw),
    copyright: asString(raw.Copyright ?? raw.CopyrightNotice),
    rights: asString(raw.Rights ?? raw.UsageTerms ?? raw.WebStatement),
    creator: asString(raw.Artist ?? raw.Creator ?? raw.Byline ?? raw.Author),
    credit: asString(raw.Credit ?? raw.CreditLine),
    source: asString(raw.Source),
    location: locationFromExif(raw),
    capturedAt: capturedAtFromExif(raw),
    camera: cameraFromExif(raw),
    lens: lensFromExif(raw),
    iso: asNumber(raw.ISO ?? raw.PhotographicSensitivity),
    aperture: apertureFromExif(raw),
    shutterSpeed: shutterFromExif(raw),
    focalLength: focalFromExif(raw),
    orientation: asNumber(raw.Orientation),
    software: asString(raw.Software),
    colorSpace: asString(raw.ColorSpace),
  }

  const hasValue = Object.values(metadata).some((value) => {
    if (value === undefined) {
      return false
    }
    if (typeof value === 'object') {
      return Object.values(value).some(Boolean)
    }
    return true
  })

  return hasValue ? metadata : null
}

export async function extractImageFileMetadata(
  data: ArrayBuffer | Uint8Array,
  mime?: string | null,
): Promise<MediaFileMetadata | null> {
  if (mime && !mime.startsWith('image/')) {
    return null
  }

  try {
    const raw = await exifr.parse(data, {
      iptc: true,
      xmp: true,
      icc: false,
      tiff: true,
      ifd0: true,
      exif: true,
      gps: true,
      reviveValues: true,
      translateKeys: false,
    })
    return normalizeExifRecord(raw as Record<string, unknown> | undefined)
  }
  catch {
    return null
  }
}

export async function readStorageBuffer(event: H3Event, pathname: string) {
  const storage = useMediaStorage(event)
  const file = await storage.get(pathname)
  if (!file) {
    return null
  }
  const reader = file.body.getReader()
  const chunks: Uint8Array[] = []
  while (true) {
    const { done, value } = await reader.read()
    if (done) {
      break
    }
    if (value) {
      chunks.push(value)
    }
  }
  return Buffer.concat(chunks)
}
