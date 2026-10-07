<script setup lang="ts">
import JdcPublicSurface from '../../app/components/JdcPublicSurface.vue'

const props = withDefaults(defineProps<{
  /** Comark attr — JSON string or parsed array of header cells: ["Date", "Événement"] */
  head?: string | string[] | null
  /** Comark attr — JSON string or parsed array of rows: [["1680", "…"], …] */
  rows?: string | string[][] | null
  /** Optional caption under the table */
  caption?: string | null
}>(), {
  head: null,
  rows: null,
  caption: null,
})

function parseJsonArray<T>(raw: string | T[] | null | undefined, fallback: T): T {
  if (Array.isArray(raw)) return raw
  if (typeof raw !== 'string' || !raw.trim()) return fallback
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed as T : fallback
  }
  catch {
    return fallback
  }
}

const head = computed(() => parseJsonArray<string[]>(props.head, [])
  .map(cell => String(cell)))

const rows = computed(() => parseJsonArray<string[][]>(props.rows, [])
  .filter(row => Array.isArray(row))
  .map(row => row.map(cell => String(cell ?? ''))))
</script>

<template>
  <JdcPublicSurface>
    <figure
      v-if="rows.length || head.length"
      class="my-6"
    >
      <div class="overflow-x-auto rounded-lg border border-stone-200 bg-white">
        <table class="w-full border-collapse text-left text-[15px]">
          <caption
            v-if="caption"
            class="caption-bottom px-1 pb-2 pt-3 text-sm text-neutral-500"
          >
            {{ caption }}
          </caption>
          <thead v-if="head.length">
            <tr class="bg-amber-100/70">
              <th
                v-for="(cell, i) in head"
                :key="`h-${i}`"
                scope="col"
                class="px-4 py-2.5 font-serif text-sm font-bold text-neutral-900"
              >
                {{ cell }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(row, i) in rows"
              :key="`r-${i}`"
              class="border-t border-stone-200"
              :class="i % 2 === 1 ? 'bg-stone-50' : 'bg-white'"
            >
              <td
                v-for="(cell, j) in row"
                :key="`c-${j}`"
                class="px-4 py-2.5 text-neutral-700"
              >
                {{ cell }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </figure>
  </JdcPublicSurface>
</template>
