import { mcpContentToolEnabled } from '../utils/enabled'

export default defineMcpPrompt({
  description: 'Workflow pour rédiger une fiche glossaire (brouillon noindex)',
  enabled: event => mcpContentToolEnabled(event, 'glossary'),
  messages: () => [{
    role: 'user',
    content: {
      type: 'text',
      text: [
        'Glossaire Journal du Cuistot (fr).',
        '1. list-glossary-terms (search) — éviter un doublon ; alias plutôt que nouveau terme.',
        '2. create-glossary-term : kind ingredient|technique|ustensile, name, description courte, content markdown.',
        '3. Formes culinaires (amande / amande en poudre / lait d’amande) : une fiche par forme, parentId vers la racine (Amande). Alias = synonymes/pluriels seulement. Chaque forme a sa propre couverture — ne jamais copier la photo de la famille.',
        '4. Ustensile : list-glossary-icons puis iconKey sémantique (pan, pot…). Un ASIN ou partnerUrl, jamais les deux en conflit (partner gagne).',
        '5. upsert-seo contentType glossary — laisser noindex,follow tant que la fiche n’est pas éditorialisée. La publication humaine passe meta_robots en index, follow.',
        '6. Pas de publication MCP. Couverture via list-media / search-stock-media.',
      ].join('\n'),
    },
  }],
})
