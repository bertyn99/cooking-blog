<script lang="ts" setup>
import type { TocLink } from "comark/plugins/toc";

defineProps<{
  links: TocLink[];
  /** Box title. Defaults to "Sommaire". */
  title?: string;
}>();
</script>

<template>
  <nav
    class="w-full border border-stone-200 bg-neutral-50 px-6 py-5 print:hidden"
    :aria-label="title ?? 'Sommaire'"
  >
    <h2 class="mb-3 font-serif text-2xl font-normal text-black">
      {{ title ?? "Sommaire" }}
    </h2>
    <ul class="space-y-2">
      <li v-for="link in links" :key="link.id">
        <a
          :href="`#${link.id}`"
          class="font-semibold text-stone-800 transition-colors hover:text-stone-500 hover:underline"
        >
          {{ link.text }}
        </a>
        <ul
          v-if="link.children?.length"
          class="mt-1 ml-5 list-disc space-y-1 marker:text-stone-400"
        >
          <li v-for="child in link.children" :key="child.id">
            <a
              :href="`#${child.id}`"
              class="text-sm text-stone-600 transition-colors hover:text-stone-500 hover:underline"
            >
              {{ child.text }}
            </a>
          </li>
        </ul>
      </li>
    </ul>
  </nav>
</template>
