<script lang="ts" setup>
import type { CommandPaletteItem } from "@nuxt/ui";
import type { Article, Recipe } from "~/types/strapiMeta";

const props = defineProps<{
  open: boolean;
}>();

const emit = defineEmits<{
  "update:open": [value: boolean];
}>();

const open = computed({
  get: () => props.open,
  set: value => emit("update:open", value),
});

/** ⌘K on macOS, Ctrl+K elsewhere (Nuxt UI mapping). */
defineShortcuts({
  meta_k: () => (open.value = !open.value),
});

const SEARCH_DEBOUNCE_MS = 250;
const RESULTS_PER_GROUP = 6;
const MIN_QUERY_LENGTH = 2;

const cms = useCms();
const searchTerm = ref("");
const debouncedTerm = refDebounced(searchTerm, SEARCH_DEBOUNCE_MS);
const pending = ref(false);

const articleItems = ref<CommandPaletteItem[]>([]);
const recipeItems = ref<CommandPaletteItem[]>([]);

function articleToItem(article: Article): CommandPaletteItem | null {
  if (!article.slug) return null;
  const categorySlug = article.category?.slug;
  if (!categorySlug) return null;
  return {
    label: article.title || article.slug,
    suffix: article.category?.name,
    icon: "i-lucide-newspaper",
    to: `/blog/${categorySlug}/${article.slug}`,
  };
}

function recipeToItem(recipe: Recipe): CommandPaletteItem | null {
  if (!recipe.slug) return null;
  return {
    label: recipe.title || recipe.slug,
    icon: "i-lucide-utensils",
    to: `/recette/${recipe.slug}`,
  };
}

/** Request sequence guard: stale responses never overwrite fresh ones. */
let requestSeq = 0;

watch(debouncedTerm, async (term) => {
  const query = term.trim();
  if (!open.value || query.length < MIN_QUERY_LENGTH) {
    requestSeq++;
    articleItems.value = [];
    recipeItems.value = [];
    return;
  }

  const seq = ++requestSeq;
  pending.value = true;
  try {
    // Parallel server-side search — one collection failing must not sink the other.
    const [articlesResult, recipesResult] = await Promise.allSettled([
      cms.articles({
        search: query,
        include: ["category"],
        page: 1,
        pageSize: RESULTS_PER_GROUP,
      }),
      cms.recipes({
        search: query,
        include: ["category"],
        page: 1,
        pageSize: RESULTS_PER_GROUP,
      }),
    ]);

    if (seq !== requestSeq) return;

    articleItems.value =
      articlesResult.status === "fulfilled"
        ? articlesResult.value.data
            .map(articleToItem)
            .filter((item): item is CommandPaletteItem => item !== null)
        : [];
    recipeItems.value =
      recipesResult.status === "fulfilled"
        ? recipesResult.value.data
            .map(recipeToItem)
            .filter((item): item is CommandPaletteItem => item !== null)
        : [];
  } finally {
    if (seq === requestSeq) pending.value = false;
  }
});

// Fresh palette on each open.
watch(open, (isOpen) => {
  if (!isOpen) {
    searchTerm.value = "";
    articleItems.value = [];
    recipeItems.value = [];
  }
});

// Results are already filtered & ranked server-side, so every group uses
// `ignoreFilter` — the palette must not re-run Fuse over them.
const groups = computed(() => [
  {
    id: "articles",
    label: "Articles",
    // Results are already filtered & ranked server-side.
    ignoreFilter: true,
    items: articleItems.value,
  },
  {
    id: "recipes",
    label: "Recettes",
    ignoreFilter: true,
    items: recipeItems.value,
  },
]);

const noResults = computed(
  () => !pending.value && debouncedTerm.value.trim().length >= MIN_QUERY_LENGTH
    && articleItems.value.length === 0 && recipeItems.value.length === 0,
);

// Close after selection — the item's `to` link drives the navigation.
function onSelect() {
  open.value = false;
}
</script>

<template>
  <UModal
    v-model:open="open"
    :ui="{ content: 'divide-y divide-gray-100 ring-0' }"
  >
    <template #content>
      <UCommandPalette
        v-model:search-term="searchTerm"
        :groups="groups"
        :loading="pending"
        placeholder="Rechercher une recette, un article…"
        class="h-80"
        @update:model-value="onSelect"
      >
        <template #empty>
          <div v-if="noResults" class="p-6 text-center text-sm text-gray-500">
            Aucun résultat pour «&nbsp;{{ searchTerm }}&nbsp;»
          </div>
          <div v-else class="p-6 text-center text-sm text-gray-400">
            Saisissez au moins {{ MIN_QUERY_LENGTH }} caractères pour rechercher.
          </div>
        </template>
      </UCommandPalette>
    </template>
  </UModal>
</template>
