import { describe, expect, it } from 'vitest'
import { buildMediaDetailSections } from '../../shared/media-file-metadata'

describe('buildMediaDetailSections', () => {
  it('groups description, rights and location fields', () => {
    const sections = buildMediaDetailSections({
      altText: 'Gaufres salées',
      metadata: {
        description: 'Photo studio',
        copyright: '© Journal du Cuistot',
        rights: 'Tous droits réservés',
        location: {
          city: 'Bruxelles',
          country: 'Belgique',
          latitude: 50.8503,
          longitude: 4.3517,
        },
        camera: 'Canon EOS R6',
        capturedAt: '2024-06-01T14:30:00.000Z',
      },
      pathname: 'uploads/test.webp',
      contentType: 'image/webp',
    })

    const titles = sections.map(section => section.title)
    expect(titles).toContain('Description')
    expect(titles).toContain('Droits & attribution')
    expect(titles).toContain('Localisation')
    expect(titles).toContain('Prise de vue')

    const location = sections.find(section => section.id === 'location')
    expect(location?.fields.some(field => field.label === 'Coordonnées GPS')).toBe(true)
  })
})
