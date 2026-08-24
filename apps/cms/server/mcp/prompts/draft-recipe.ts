import { mcpContentToolEnabled } from '../utils/enabled'

export default defineMcpPrompt({
  description: 'Workflow pour rédiger un brouillon de recette',
  enabled: event => mcpContentToolEnabled(event, 'recipes'),
  messages: () => [{
    role: 'user',
    content: {
      type: 'text',
      text: [
        'Recette Journal du Cuistot (fr).',
        '1. list-recipe-categories → categoryId.',
        '2. create-recipe avec intro, ingredients[], steps[], utensils[] et nutrition si connus.',
        '3. Markdown Comark uniquement dans intro (pas un dump texte à la place des tableaux).',
        '4. upsert-seo optionnel. coverBlobPathname via list-media.',
        '5. Pas de publication.',
      ].join('\n'),
    },
  }],
})
