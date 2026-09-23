<script setup lang="ts">
import type { TabsItem } from '@nuxt/ui'
import { AGENT_SCOPE_LABELS, AGENT_SCOPES } from '#shared/api-keys'
import { DASHBOARD_SURFACE_CLASS } from '~/utils/dashboard-shell'

const emit = defineEmits<{
  createKey: []
}>()

const toast = useToast()
const { copy, copied, isSupported } = useClipboard()
const mcpEndpoint = useMcpEndpoint()

const requiredScopes = AGENT_SCOPES.map(scope => ({
  label: AGENT_SCOPE_LABELS[scope],
  value: scope,
}))

const agentTabs: TabsItem[] = [
  { label: 'Cursor', icon: 'i-lucide-mouse-pointer-2', slot: 'cursor', value: 'cursor' },
  { label: 'Claude Desktop', icon: 'i-lucide-message-square', slot: 'claude', value: 'claude' },
  { label: 'OpenCode', icon: 'i-lucide-terminal', slot: 'opencode', value: 'opencode' },
]

const cursorMcpJson = computed(() => JSON.stringify({
  mcpServers: {
    'jdc-cms': {
      url: mcpEndpoint.value,
      headers: {
        Authorization: 'Bearer ${env:CMS_API_KEY}',
      },
    },
  },
}, null, 2))

const claudeMcpJson = computed(() => JSON.stringify({
  mcpServers: {
    'jdc-cms': {
      url: mcpEndpoint.value,
      headers: {
        Authorization: 'Bearer COLLEZ_VOTRE_CLE_ICI',
      },
    },
  },
}, null, 2))

const opencodeJson = computed(() => JSON.stringify({
  $schema: 'https://opencode.ai/config.json',
  mcp: {
    servers: {
      'jdc-cms': {
        type: 'remote',
        url: mcpEndpoint.value,
        headers: {
          Authorization: 'Bearer {env:CMS_API_KEY}',
        },
      },
    },
  },
}, null, 2))

const envExport = 'export CMS_API_KEY="jdc_…"'

async function copyEndpoint() {
  if (!isSupported.value) return
  try {
    await copy(mcpEndpoint.value)
    toast.add({ title: 'URL MCP copiée', color: 'success' })
  }
  catch {
    toast.add({ title: 'Copie impossible', color: 'warning' })
  }
}
</script>

<template>
  <section :class="[DASHBOARD_SURFACE_CLASS, 'overflow-hidden']">
    <div class="border-b border-default/60 px-4 py-4 sm:px-5 sm:py-5">
      <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div class="flex min-w-0 gap-3">
          <div class="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <UIcon name="i-lucide-plug-zap" class="size-5" />
          </div>
          <div class="min-w-0 space-y-1">
            <h2 class="font-medium text-highlighted">
              Connecter un agent
            </h2>
            <p class="max-w-2xl text-sm text-muted">
              Liez Cursor, Claude Desktop ou OpenCode au serveur MCP de cette instance.
              Créez une clé avec le préréglage MCP, copiez le secret une fois, puis testez avec
              <code class="rounded bg-elevated px-1 py-0.5 text-xs">list-recipes</code>.
            </p>
          </div>
        </div>

        <div class="flex shrink-0 flex-wrap items-center gap-2">
          <UButton
            size="sm"
            variant="soft"
            color="neutral"
            icon="i-lucide-key-round"
            label="Créer une clé"
            @click="emit('createKey')"
          />
          <NuxtLink to="/mcp-logs">
            <UButton
              size="sm"
              variant="ghost"
              color="neutral"
              icon="i-lucide-scroll-text"
              label="Journal MCP"
            />
          </NuxtLink>
        </div>
      </div>

      <div class="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <div class="flex min-w-0 flex-1 items-center gap-2 rounded-md border border-default/60 bg-elevated/40 px-3 py-2">
          <UIcon name="i-lucide-link" class="size-4 shrink-0 text-muted" />
          <code class="min-w-0 flex-1 truncate font-mono text-xs text-toned">{{ mcpEndpoint }}</code>
          <UButton
            size="xs"
            variant="ghost"
            color="neutral"
            :icon="copied ? 'i-lucide-check' : 'i-lucide-copy'"
            aria-label="Copier l’URL MCP"
            @click="copyEndpoint"
          />
        </div>

        <div class="flex flex-wrap items-center gap-1.5">
          <span class="text-xs text-muted">Droits requis</span>
          <UBadge
            v-for="scope in requiredScopes"
            :key="scope.value"
            color="primary"
            variant="subtle"
            size="sm"
          >
            {{ scope.label }}
          </UBadge>
        </div>
      </div>
    </div>

    <div class="px-4 pb-4 pt-3 sm:px-5 sm:pb-5">
      <UTabs
        :items="agentTabs"
        variant="link"
        color="primary"
        :unmount-on-hide="false"
        class="w-full"
        :ui="{ list: 'border-b border-default/60' }"
      >
        <template #cursor>
          <ol class="mt-5 space-y-4">
            <li class="rounded-lg border border-default/60 bg-elevated/20 p-4">
              <div class="flex gap-3">
                <span class="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold tabular-nums text-primary">1</span>
                <div class="min-w-0 space-y-1">
                  <p class="text-sm font-medium text-highlighted">
                    Créer une clé MCP
                  </p>
                  <p class="text-sm text-muted">
                    Utilisez le préréglage MCP lors de la création. Recettes, Pages et Écriture suffisent pour l’agent.
                  </p>
                </div>
              </div>
            </li>

            <li class="rounded-lg border border-default/60 bg-elevated/20 p-4">
              <div class="flex gap-3">
                <span class="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold tabular-nums text-primary">2</span>
                <div class="min-w-0 flex-1 space-y-3">
                  <div class="space-y-1">
                    <p class="text-sm font-medium text-highlighted">
                      Exporter la variable
                    </p>
                    <p class="text-sm text-muted">
                      Ajoutez <code class="rounded bg-elevated px-1 py-0.5 text-xs">CMS_API_KEY</code> dans votre shell ou votre fichier <code class="rounded bg-elevated px-1 py-0.5 text-xs">.env</code> local.
                    </p>
                  </div>
                  <ApiKeysCopyCodeBlock
                    filename="export CMS_API_KEY"
                    :code="envExport"
                  />
                </div>
              </div>
            </li>

            <li class="rounded-lg border border-default/60 bg-elevated/20 p-4">
              <div class="flex gap-3">
                <span class="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold tabular-nums text-primary">3</span>
                <div class="min-w-0 flex-1 space-y-3">
                  <div class="space-y-1">
                    <p class="text-sm font-medium text-highlighted">
                      Configurer Cursor
                    </p>
                    <p class="text-sm text-muted">
                      Créez <code class="rounded bg-elevated px-1 py-0.5 text-xs">.cursor/mcp.json</code> à la racine du dépôt web, puis rechargez les serveurs MCP.
                    </p>
                  </div>
                  <ApiKeysCopyCodeBlock
                    filename=".cursor/mcp.json"
                    :code="cursorMcpJson"
                  />
                  <p class="flex flex-wrap items-center gap-1 text-xs text-muted">
                    <UIcon name="i-lucide-lightbulb" class="size-3.5" />
                    Palette
                    <UKbd value="Ctrl" />
                    <UKbd value="Shift" />
                    <UKbd value="P" />
                    puis « MCP: Reload Servers ».
                  </p>
                </div>
              </div>
            </li>
          </ol>
        </template>

        <template #claude>
          <ol class="mt-5 space-y-4">
            <li class="rounded-lg border border-default/60 bg-elevated/20 p-4">
              <div class="flex gap-3">
                <span class="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold tabular-nums text-primary">1</span>
                <div class="min-w-0 space-y-1">
                  <p class="text-sm font-medium text-highlighted">
                    Créer une clé MCP
                  </p>
                  <p class="text-sm text-muted">
                    Mêmes droits que pour Cursor : Recettes, Pages et Écriture.
                  </p>
                </div>
              </div>
            </li>

            <li class="rounded-lg border border-default/60 bg-elevated/20 p-4">
              <div class="flex gap-3">
                <span class="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold tabular-nums text-primary">2</span>
                <div class="min-w-0 flex-1 space-y-3">
                  <div class="space-y-1">
                    <p class="text-sm font-medium text-highlighted">
                      Éditer la configuration Claude
                    </p>
                    <p class="text-sm text-muted">
                      macOS :
                      <code class="rounded bg-elevated px-1 py-0.5 text-xs">~/Library/Application Support/Claude/claude_desktop_config.json</code>
                      <br>
                      Linux :
                      <code class="rounded bg-elevated px-1 py-0.5 text-xs">~/.config/Claude/claude_desktop_config.json</code>
                    </p>
                  </div>
                  <ApiKeysCopyCodeBlock
                    filename="claude_desktop_config.json"
                    :code="claudeMcpJson"
                  />
                </div>
              </div>
            </li>

            <li class="rounded-lg border border-default/60 bg-elevated/20 p-4">
              <div class="flex gap-3">
                <span class="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold tabular-nums text-primary">3</span>
                <div class="min-w-0 space-y-1">
                  <p class="text-sm font-medium text-highlighted">
                    Redémarrer Claude Desktop
                  </p>
                  <p class="text-sm text-muted">
                    Remplacez
                    <code class="rounded bg-elevated px-1 py-0.5 text-xs">COLLEZ_VOTRE_CLE_ICI</code>
                    par le secret
                    <code class="rounded bg-elevated px-1 py-0.5 text-xs">jdc_…</code>.
                    Claude ne lit pas toujours les variables d’environnement : collez la clé en dur.
                  </p>
                </div>
              </div>
            </li>
          </ol>
        </template>

        <template #opencode>
          <ol class="mt-5 space-y-4">
            <li class="rounded-lg border border-default/60 bg-elevated/20 p-4">
              <div class="flex gap-3">
                <span class="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold tabular-nums text-primary">1</span>
                <div class="min-w-0 space-y-1">
                  <p class="text-sm font-medium text-highlighted">
                    Créer une clé MCP
                  </p>
                  <p class="text-sm text-muted">
                    Au minimum Recettes, Pages et Écriture.
                  </p>
                </div>
              </div>
            </li>

            <li class="rounded-lg border border-default/60 bg-elevated/20 p-4">
              <div class="flex gap-3">
                <span class="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold tabular-nums text-primary">2</span>
                <div class="min-w-0 flex-1 space-y-3">
                  <div class="space-y-1">
                    <p class="text-sm font-medium text-highlighted">
                      Configurer opencode.json
                    </p>
                    <p class="text-sm text-muted">
                      Projet : <code class="rounded bg-elevated px-1 py-0.5 text-xs">opencode.json</code> à la racine.
                      Global : <code class="rounded bg-elevated px-1 py-0.5 text-xs">~/.config/opencode/opencode.json</code>
                    </p>
                  </div>
                  <ApiKeysCopyCodeBlock
                    filename="opencode.json"
                    :code="opencodeJson"
                  />
                </div>
              </div>
            </li>

            <li class="rounded-lg border border-default/60 bg-elevated/20 p-4">
              <div class="flex gap-3">
                <span class="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold tabular-nums text-primary">3</span>
                <div class="min-w-0 space-y-1">
                  <p class="text-sm font-medium text-highlighted">
                    Relancer OpenCode
                  </p>
                  <p class="text-sm text-muted">
                    Serveurs sous
                    <code class="rounded bg-elevated px-1 py-0.5 text-xs">mcp.servers</code>
                    avec
                    <code class="rounded bg-elevated px-1 py-0.5 text-xs">type: "remote"</code>.
                    Variable :
                    <code class="rounded bg-elevated px-1 py-0.5 text-xs">{env:CMS_API_KEY}</code>.
                  </p>
                </div>
              </div>
            </li>
          </ol>
        </template>
      </UTabs>
    </div>
  </section>
</template>
