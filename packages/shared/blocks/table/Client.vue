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
      class="my-8"
    >
      <figcaption
        v-if="caption"
        class="jdc-serif mb-3 text-sm text-toned"
      >
        {{ caption }}
      </figcaption>
      <div class="overflow-x-auto">
        <table class="w-full min-w-80 border-collapse text-left text-[15px]">
          <thead v-if="head.length">
            <tr class="border-b border-yellow-800">
              <th
                v-for="(cell, i) in head"
                :key="`h-${i}`"
                scope="col"
                class="jdc-serif py-3 pr-6 text-sm font-normal text-highlighted first:pl-0 last:pr-0"
              >
                {{ cell }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(row, i) in rows"
              :key="`r-${i}`"
              class="border-b border-default last:border-b-0"
            >
              <td
                v-for="(cell, j) in row"
                :key="`c-${j}`"
                class="py-3 pr-6 last:pr-0"
                :class="j === 0
                  ? 'jdc-serif text-highlighted'
                  : 'text-toned'"
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
