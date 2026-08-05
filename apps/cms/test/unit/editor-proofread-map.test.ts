import { describe, expect, it } from 'vitest'
import { Schema } from '@tiptap/pm/model'
import {
  plainOffsetToDocPos,
  proofreadRangesInDoc,
  sanitizeProofreadCorrections,
} from '../../app/utils/editor-proofread-map'

const schema = new Schema({
  nodes: {
    doc: { content: 'block+' },
    paragraph: { content: 'inline*', group: 'block' },
    text: { group: 'inline' },
  },
})

function docWithText(text: string) {
  return schema.node('doc', null, [
    schema.node('paragraph', null, text ? [schema.text(text)] : []),
  ])
}

describe('sanitizeProofreadCorrections', () => {
  it('drops no-ops and whole-paragraph spans', () => {
    const text = 'Il est important de noter que le thé contient de la caféine.'
    const result = sanitizeProofreadCorrections(text, [
      {
        id: 'a',
        original: text,
        suggestion: 'Autre chose',
        message: 'Trop large',
        start: 0,
        end: text.length,
      },
      {
        id: 'b',
        original: 'caféine',
        suggestion: 'caféine',
        message: 'No-op',
        start: text.indexOf('caféine'),
        end: text.indexOf('caféine') + 'caféine'.length,
      },
      {
        id: 'c',
        original: 'thé',
        suggestion: 'thé',
        message: 'No-op 2',
        start: text.indexOf('thé'),
        end: text.indexOf('thé') + 3,
      },
    ])
    expect(result).toHaveLength(0)
  })

  it('keeps a short real typo', () => {
    const text = 'Le poulait est delicieux.'
    const start = text.indexOf('poulait')
    const result = sanitizeProofreadCorrections(text, [{
      id: '1',
      original: 'poulait',
      suggestion: 'poulet',
      message: 'Orthographe',
      start,
      end: start + 7,
    }])
    expect(result).toHaveLength(1)
    expect(result[0]?.suggestion).toBe('poulet')
  })

  it('drops phrase rewrites and unrelated word swaps', () => {
    const text = 'Que vous soyez un fan de thé noir ou que vous découvriez.'
    const result = sanitizeProofreadCorrections(text, [
      {
        id: '1',
        original: 'ou que',
        suggestion: 'ou si',
        message: 'Style',
        start: text.indexOf('ou que'),
        end: text.indexOf('ou que') + 6,
      },
      {
        id: '2',
        original: 'noir',
        suggestion: 'vert',
        message: 'Pas une faute',
        start: text.indexOf('noir'),
        end: text.indexOf('noir') + 4,
      },
    ])
    expect(result).toHaveLength(0)
  })

  it('drops overlapping later spans', () => {
    const text = 'abc def ghi'
    const result = sanitizeProofreadCorrections(text, [
      {
        id: '1',
        original: 'abc',
        suggestion: 'abd',
        message: 'a',
        start: 0,
        end: 3,
      },
      {
        id: '2',
        original: 'bc d',
        suggestion: 'xx',
        message: 'overlap',
        start: 1,
        end: 5,
      },
    ])
    expect(result).toHaveLength(1)
    expect(result[0]?.id).toBe('1')
  })
})

describe('plainOffsetToDocPos / proofreadRangesInDoc', () => {
  it('maps plain offsets inside a single paragraph', () => {
    const text = 'Le poulait est bon.'
    const doc = docWithText(text)
    // doc pos: 0=doc, 1=paragraph open, 2=first char
    const rangeFrom = 1
    const rangeTo = 1 + text.length
    const start = text.indexOf('poulait')
    const end = start + 'poulait'.length

    const from = plainOffsetToDocPos(doc, rangeFrom, rangeTo, start)
    const to = plainOffsetToDocPos(doc, rangeFrom, rangeTo, end)
    expect(doc.textBetween(from, to)).toBe('poulait')

    const ranges = proofreadRangesInDoc(doc, rangeFrom, rangeTo, [
      { id: 'x', start, end },
    ])
    expect(ranges).toEqual([{ from, to, id: 'x' }])
  })
})
