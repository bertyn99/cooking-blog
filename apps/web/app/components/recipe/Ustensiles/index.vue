<script lang="ts" setup>
import type { RecipeUtensil } from '~/types/strapiMeta'

const props = defineProps<{
  utensils: RecipeUtensil[]
}>()

function buyUrl(item: RecipeUtensil) {
  return item.resolvedAffiliateUrl?.trim() || item.affiliateUrl?.trim() || null
}

const hasAffiliate = computed(() =>
  props.utensils.some(u => Boolean(buyUrl(u))),
)

const sorted = computed(() =>
  [...props.utensils].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)),
)
</script>

<template>
  <section v-if="sorted.length" class="mb-6 space-y-4">
    <h3
      class="flex items-center border-0 p-0 m-0 font-serif text-2xl font-normal leading-6 text-black align-baseline break-words"
    >
      Ustensiles
      <span
        class="ml-4 my-0 h-2 w-full border-x-0 border-y border-solid border-stone-200 p-0 text-xs font-semibold uppercase tracking-widest text-black align-baseline"
      />
    </h3>

    <ul class="list-disc space-y-2 pl-5 text-base text-stone-800">
      <li v-for="(item, index) in sorted" :key="`${item.name}-${index}`">
        <NuxtLink
          v-if="item.path"
          :to="item.path"
          class="font-medium text-stone-800 underline decoration-stone-300 hover:text-amber-900"
        >
          {{ item.name }}
        </NuxtLink>
        <template v-else>
          {{ item.name }}
        </template>
        <span v-if="item.note" class="text-stone-600"> — {{ item.note }}</span>
        <a
          v-if="buyUrl(item)"
          :href="buyUrl(item)!"
          class="ml-2 text-sm text-amber-800 underline decoration-amber-300/80 hover:text-amber-950"
          rel="nofollow sponsored noopener"
          target="_blank"
        >
          Acheter
        </a>
      </li>
    </ul>

    <p v-if="hasAffiliate" class="text-xs text-stone-500">
      Liens affiliés : achat possible via ces liens, sans surcoût pour vous.
    </p>
  </section>
</template>
