<script setup lang="ts">
import type { EditorCompletionMode } from '#shared/editor-completion-modes'
import type { AiReviewPanelModel } from '~/types/editor-ai-review'

const props = defineProps<{
  review: AiReviewPanelModel
  busy?: boolean
}>()

const emit = defineEmits<{
  accept: []
  refuse: []
  redo: []
  'update:activeVariant': [index: number]
  'update:proofreadDecision': [id: string, decision: 'accept' | 'reject' | 'pending']
}>()

const panelRef = ref<HTMLElement | null>(null)
const panelSize = ref({ width: 360, height: 200 })

const title = computed(() => {
  switch (props.review.kind) {
    case 'continue':
      return 'Suite proposée'
    case 'proofread':
      return 'Orthographe'
    case 'reformulate':
      return 'Reformulation'
    default: {
      const _exhaustive: never = props.review.kind
      return _exhaustive
    }
  }
})

const modeLabel = computed(() => {
  const labels: Partial<Record<EditorCompletionMode, string>> = {
    continue: 'Continuer',
    fix: 'Orthographe',
    extend: 'Développer',
    reduce: 'Raccourcir',
    simplify: 'Simplifier',
    summarize: 'Résumer',
    translate: 'Traduire',
  }
  return labels[props.review.mode] ?? props.review.mode
})

const activeText = computed(() =>
  props.review.variants[props.review.activeVariant] ?? '',
)

const applyProofreadCount = computed(() =>
  props.review.proofread.filter(item => item.decision !== 'reject').length,
)

const rejectedProofreadCount = computed(() =>
  props.review.proofread.filter(item => item.decision === 'reject').length,
)

type AnnotatedPart
  = | { kind: 'text', text: string }
    | {
      kind: 'error'
      id: string
      original: string
      suggestion: string
      message: string
      decision: 'pending' | 'accept' | 'reject'
    }

const annotatedParts = computed((): AnnotatedPart[] => {
  const text = props.review.original
  const items = [...props.review.proofread].sort((a, b) => a.start - b.start)
  if (!items.length) {
    return [{ kind: 'text', text }]
  }

  const parts: AnnotatedPart[] = []
  let cursor = 0
  for (const item of items) {
    if (item.start > cursor) {
      parts.push({ kind: 'text', text: text.slice(cursor, item.start) })
    }
    parts.push({
      kind: 'error',
      id: item.id,
      original: item.original,
      suggestion: item.suggestion,
      message: item.message,
      decision: item.decision,
    })
    cursor = item.end
  }
  if (cursor < text.length) {
    parts.push({ kind: 'text', text: text.slice(cursor) })
  }
  return parts
})

const GAP = 8
const MARGIN = 12
const PANEL_WIDTH = 380

const panelStyle = computed(() => {
  const anchor = props.review.anchor
  if (!anchor || !import.meta.client) {
    return {
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      width: `min(${PANEL_WIDTH}px, calc(100vw - ${MARGIN * 2}px))`,
    }
  }

  const width = Math.min(PANEL_WIDTH, window.innerWidth - MARGIN * 2)
  const height = panelSize.value.height
  const spaceBelow = window.innerHeight - anchor.bottom - MARGIN
  const placeBelow = spaceBelow >= Math.min(height, 160) || anchor.top < height + MARGIN

  let top = placeBelow ? anchor.bottom + GAP : anchor.top - height - GAP
  top = Math.max(MARGIN, Math.min(top, window.innerHeight - height - MARGIN))

  let left = anchor.left
  left = Math.max(MARGIN, Math.min(left, window.innerWidth - width - MARGIN))

  return {
    top: `${Math.round(top)}px`,
    left: `${Math.round(left)}px`,
    width: `${Math.round(width)}px`,
    transform: 'none',
  }
})

watch(
  () => [props.review.kind, props.review.status, props.review.proofread.length, props.review.variants.join('\0')] as const,
  async () => {
    await nextTick()
    const el = panelRef.value
    if (!el) {
      return
    }
    panelSize.value = {
      width: el.offsetWidth,
      height: el.offsetHeight,
    }
  },
  { flush: 'post', immediate: true },
)

function setVariant(index: number) {
  emit('update:activeVariant', index)
}

function setDecision(id: string, decision: 'accept' | 'reject' | 'pending') {
  emit('update:proofreadDecision', id, decision)
}
</script>

<template>
  <Teleport to="body">
    <div
      ref="panelRef"
      class="ai-review-panel fixed z-50 max-h-[min(70vh,32rem)] overflow-y-auto rounded-lg border border-default bg-elevated p-3 shadow-lg sm:p-4"
      role="dialog"
      :aria-label="title"
      :style="panelStyle"
    >
      <div class="mb-3 flex flex-wrap items-center gap-2">
        <UBadge
          color="primary"
          variant="subtle"
          size="sm"
        >
          {{ title }}
        </UBadge>
        <span
          v-if="modeLabel !== title"
          class="text-xs text-muted"
        >{{ modeLabel }}</span>
        <UBadge
          v-if="review.status === 'streaming'"
          color="info"
          variant="subtle"
          size="sm"
        >
          Analyse…
        </UBadge>
        <div class="ml-auto flex flex-wrap items-center gap-1.5">
          <UButton
            size="xs"
            color="neutral"
            variant="ghost"
            icon="i-lucide-rotate-ccw"
            :disabled="busy"
            @click="emit('redo')"
          >
            Relancer
          </UButton>
          <UButton
            size="xs"
            color="neutral"
            variant="soft"
            icon="i-lucide-x"
            @click="emit('refuse')"
          >
            Refuser
          </UButton>
          <UButton
            size="xs"
            color="primary"
            variant="solid"
            icon="i-lucide-check"
            :disabled="busy || review.status === 'streaming' || (review.kind !== 'proofread' && !activeText.trim())"
            @click="emit('accept')"
          >
            Accepter
          </UButton>
        </div>
      </div>

      <!-- Reformulation: two alternatives -->
      <div
        v-if="review.kind === 'reformulate'"
        class="mb-1 grid gap-2 sm:grid-cols-2"
      >
        <button
          v-for="(variant, index) in review.variants"
          :key="index"
          type="button"
          class="rounded-md border px-3 py-2 text-left transition-colors"
          :class="index === review.activeVariant
            ? 'border-primary bg-primary/10 ring-1 ring-primary/30'
            : 'border-default bg-default hover:bg-elevated'"
          @click="setVariant(index)"
        >
          <div class="mb-1 flex items-center justify-between gap-2">
            <span class="text-[11px] font-medium uppercase tracking-wide text-muted">
              Proposition {{ index + 1 }}
            </span>
            <UBadge
              v-if="index === review.activeVariant"
              color="primary"
              variant="subtle"
              size="sm"
            >
              Choisie
            </UBadge>
          </div>
          <p class="max-h-28 overflow-y-auto whitespace-pre-wrap text-sm leading-relaxed text-default">
            <span class="ai-review-new-text">{{ variant || (review.status === 'streaming' ? '…' : 'Vide') }}</span>
          </p>
        </button>
      </div>

      <!-- Continue / single proposal -->
      <div
        v-else-if="review.kind === 'continue'"
        class="grid gap-2 sm:grid-cols-2"
      >
        <div class="rounded-md border border-error/30 bg-error/5 px-3 py-2">
          <p class="mb-1 text-[11px] font-medium uppercase tracking-wide text-error">
            Contexte
          </p>
          <p class="max-h-24 overflow-y-auto whitespace-pre-wrap text-sm leading-relaxed text-muted">
            {{ review.original.slice(-280) || '(début de document)' }}
          </p>
        </div>
        <div class="rounded-md border border-success/30 bg-success/5 px-3 py-2">
          <p class="mb-1 text-[11px] font-medium uppercase tracking-wide text-success">
            Suite
          </p>
          <p class="max-h-24 overflow-y-auto whitespace-pre-wrap text-sm leading-relaxed text-default">
            <span class="ai-review-new-text">{{ activeText || (review.status === 'streaming' ? '…' : 'Vide') }}</span>
          </p>
        </div>
      </div>

      <!-- Proofread checklist -->
      <div
        v-else
        class="space-y-3"
      >
        <p class="text-xs text-muted">
          Corrections FR-FR uniquement. Orange = suggestion · Ignorer pour laisser le texte.
        </p>

        <div class="rounded-md border border-default bg-default px-3 py-2">
          <p class="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-muted">
            Aperçu
          </p>
          <p class="text-sm leading-relaxed text-default">
            <template
              v-for="(part, index) in annotatedParts"
              :key="index"
            >
              <span v-if="part.kind === 'text'">{{ part.text }}</span>
              <button
                v-else
                type="button"
                class="mx-0.5 inline rounded px-0.5 transition-colors"
                :class="{
                  'bg-warning/25 underline decoration-wavy decoration-warning': part.decision === 'pending',
                  'bg-success/25 text-success': part.decision === 'accept',
                  'bg-muted/30 text-muted line-through': part.decision === 'reject',
                }"
                :title="part.message"
                @click="setDecision(part.id, part.decision === 'accept' ? 'pending' : 'accept')"
              >
                <span v-if="part.decision === 'accept'">{{ part.suggestion }}</span>
                <span v-else>{{ part.original }}</span>
              </button>
            </template>
          </p>
        </div>

        <p
          v-if="!review.proofread.length && review.status === 'ready'"
          class="text-sm text-muted"
        >
          Aucune faute détectée en français.
        </p>

        <ul
          v-else-if="review.proofread.length"
          class="max-h-52 space-y-2 overflow-y-auto"
        >
          <li
            v-for="(item, index) in review.proofread"
            :key="item.id"
            class="flex flex-wrap items-start gap-2 rounded-md border border-default bg-default px-3 py-2"
            :class="{
              'opacity-55': item.decision === 'reject',
              'ring-1 ring-success/40': item.decision === 'accept',
            }"
          >
            <span class="mt-0.5 size-5 shrink-0 rounded-full bg-elevated text-center text-[11px] font-medium leading-5 text-muted">
              {{ index + 1 }}
            </span>
            <div class="min-w-0 flex-1">
              <p class="text-sm">
                <span class="rounded bg-warning/20 px-1 line-through decoration-warning">{{ item.original }}</span>
                <span class="mx-1 text-muted">→</span>
                <span class="rounded bg-success/20 px-1 font-medium text-success">{{ item.suggestion }}</span>
              </p>
              <p class="mt-0.5 text-xs text-muted">
                {{ item.message }}
              </p>
            </div>
            <div class="flex shrink-0 gap-1">
              <UButton
                size="xs"
                color="success"
                :variant="item.decision === 'accept' ? 'solid' : 'soft'"
                label="Corriger"
                @click="setDecision(item.id, item.decision === 'accept' ? 'pending' : 'accept')"
              />
              <UButton
                size="xs"
                color="neutral"
                :variant="item.decision === 'reject' ? 'solid' : 'ghost'"
                label="Ignorer"
                @click="setDecision(item.id, item.decision === 'reject' ? 'pending' : 'reject')"
              />
            </div>
          </li>
        </ul>

        <p
          v-if="review.proofread.length"
          class="text-xs text-muted"
        >
          {{ applyProofreadCount }} correction(s) · {{ rejectedProofreadCount }} ignorée(s).
        </p>
      </div>
    </div>
  </Teleport>
</template>
