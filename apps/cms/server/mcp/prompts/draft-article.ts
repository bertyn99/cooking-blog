import { mcpWriteToolEnabled } from '../utils/enabled'

export default defineMcpPrompt({
  description: 'Workflow pour rédiger un brouillon d’article (FR, Comark)',
  enabled: event => mcpWriteToolEnabled(event, 'articles'),
  messages: () => [{
    role: 'user',
    content: {
      type: 'text',
      text: [
        'Tu rédiges pour Journal du Cuistot (locale fr).',
        '1. Appelle list-article-categories pour choisir categoryId.',
        '2. Rédige le corps en markdown Comark.',
        '3. create-article en brouillon uniquement.',
        '4. upsert-seo si besoin.',
        '5. Ne publie jamais — un humain validera.',
      ].join('\n'),
    },
  }],
})
