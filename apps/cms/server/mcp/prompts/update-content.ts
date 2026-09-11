import { mcpAnyContentToolEnabled } from '../utils/enabled'

export default defineMcpPrompt({
  description: 'Mettre à jour un article ou une page (brouillon ou publié) ; recettes en brouillon seulement',
  enabled: event => mcpAnyContentToolEnabled(event, ['articles', 'recipes', 'pages']),
  messages: () => [{
    role: 'user',
    content: {
      type: 'text',
      text: [
        'Articles et pages : get-* puis update-* quel que soit le statut (writable=true). Ne change jamais le statut.',
        'Recettes : writable=true seulement en brouillon ; 403 si publié.',
        'Après create/update, donner previewUrl à l’humain. publicUrl n’existe que si status=published.',
        'Ne jamais publier, planifier ou dépublier via MCP.',
      ].join('\n'),
    },
  }],
})
