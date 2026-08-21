import { mcpWriteToolEnabled } from '../utils/enabled'

export default defineMcpPrompt({
  description: 'Workflow pour rédiger un brouillon de recette',
  enabled: event => mcpWriteToolEnabled(event, 'recipes'),
  messages: () => [{
    role: 'user',
    content: {
      type: 'text',
      text: [
        'Recette Journal du Cuistot (fr).',
        '1. list-recipe-categories → categoryId.',
        '2. Markdown Comark (intro, ingrédients, étapes).',
        '3. create-recipe en brouillon.',
        '4. upsert-seo optionnel.',
        '5. Pas de publication.',
      ].join('\n'),
    },
  }],
})
