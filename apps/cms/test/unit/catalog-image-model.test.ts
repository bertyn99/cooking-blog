import { describe, expect, it } from 'vitest'
import {
  buildCatalogGatewayRequest,
  createCatalogImageModel,
  GOOGLE_NANO_BANANA_2_STUDIO_MODEL,
  unwrapGatewayImageJson,
} from '../../server/services/ai/catalog-image-model'
import { IMAGE_MODEL_ALT, IMAGE_MODEL_PRIMARY } from '../../shared/workers-ai-model'

/** 1×1 PNG */
const PNG_B64
  = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='

function geminiImageJson(data = PNG_B64) {
  return {
    candidates: [
      {
        content: {
          parts: [
            { text: 'here you go' },
            { inlineData: { mimeType: 'image/png', data } },
          ],
        },
      },
    ],
  }
}

function fakeAi(onRun: (data: AIGatewayUniversalRequest) => Response): Ai {
  return {
    run: async () => {
      throw new TypeError("Cannot set properties of undefined (setting '#options')")
    },
    gateway: () => ({
      run: async (data: AIGatewayUniversalRequest) => onRun(data),
      patchLog: async () => {},
      getLog: async () => ({}) as AiGatewayLog,
      getUrl: async () => '',
    }),
  } as unknown as Ai
}

describe('buildCatalogGatewayRequest', () => {
  it('routes nano-banana-2 through google-ai-studio, not Ai.run', () => {
    const request = buildCatalogGatewayRequest(IMAGE_MODEL_PRIMARY, 'a dish', '4:3')
    expect(request.provider).toBe('google-ai-studio')
    expect(request.endpoint).toBe(`v1/models/${GOOGLE_NANO_BANANA_2_STUDIO_MODEL}:generateContent`)
    expect(request.headers.Authorization).toBeUndefined()
    expect(request.query).toMatchObject({
      contents: [{ role: 'user', parts: [{ text: 'a dish' }] }],
      generationConfig: {
        imageConfig: { aspectRatio: '4:3' },
      },
    })
  })

  it('routes seedream through the workers-ai gateway provider', () => {
    const request = buildCatalogGatewayRequest(IMAGE_MODEL_ALT, 'a dish', '16:9')
    expect(request.provider).toBe('workers-ai')
    expect(request.endpoint).toBe(IMAGE_MODEL_ALT)
    expect(request.query).toMatchObject({
      prompt: 'a dish',
      aspect_ratio: '16:9',
      output_format: 'png',
    })
  })
})

describe('unwrapGatewayImageJson', () => {
  it('reads Gemini inlineData', () => {
    expect(unwrapGatewayImageJson(geminiImageJson())).toEqual({ image: PNG_B64 })
  })

  it('passes catalog { result.image } through', () => {
    const json = { result: { image: PNG_B64 } }
    expect(unwrapGatewayImageJson(json)).toEqual(json)
  })
})

describe('createCatalogImageModel', () => {
  it('uses env.AI.gateway().run and does not call env.AI.run', async () => {
    let ran: AIGatewayUniversalRequest | undefined
    let aiRunCalled = false
    const binding = fakeAi((data) => {
      ran = data
      return Response.json(geminiImageJson())
    })
    binding.run = (async () => {
      aiRunCalled = true
      throw new TypeError("Cannot set properties of undefined (setting '#options')")
    }) as Ai['run']

    const model = createCatalogImageModel({
      binding,
      modelId: IMAGE_MODEL_PRIMARY,
      gateway: { id: 'jdc-cms-ai' },
    })

    const result = await model.doGenerate({
      prompt: 'golden m hanncha',
      n: 1,
      size: undefined,
      aspectRatio: '4:3',
      seed: undefined,
      files: undefined,
      mask: undefined,
      providerOptions: {},
    })

    expect(aiRunCalled).toBe(false)
    expect(ran?.provider).toBe('google-ai-studio')
    expect(result.images[0]?.byteLength).toBeGreaterThan(0)
  })

  it('fails closed without a gateway id instead of hitting Ai.run #options', async () => {
    const model = createCatalogImageModel({
      binding: fakeAi(() => Response.json({})),
      modelId: IMAGE_MODEL_PRIMARY,
    })

    await expect(model.doGenerate({
      prompt: 'x',
      n: 1,
      size: undefined,
      aspectRatio: undefined,
      seed: undefined,
      files: undefined,
      mask: undefined,
      providerOptions: {},
    })).rejects.toThrow('AI Gateway id is required')
  })
})
