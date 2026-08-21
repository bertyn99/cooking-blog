import { mcpWriteToolEnabled } from '../utils/enabled'

export default defineMcpPrompt({
  description: 'Mettre à jour un brouillon existant (vérifie writable)',
  enabled: (event) => {
    return mcpWriteToolEnabled(event, 'articles')
      || mcpWriteToolEnabled(event, 'recipes')
      || mcpWriteToolEnabled(event, 'pages')
  },
  messages: () => [{
    role: 'user',
    content: {
      type: 'text',
      text: [
        'Avant toute mise à jour : get-* et vérifier writable=true.',
        'Si writable=false, le contenu est en ligne — ne pas update ; créer un nouveau brouillon.',
        '403 = arrêt immédiat.',
      ].join('\n'),
    },
  }],
})
