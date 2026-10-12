<script lang="ts" setup>
import type { GlossaryKind, GlossaryTerm } from "~/types/strapiMeta";
import type { CmsListResponse } from "~/types/cms";

definePageMeta({
  layout: "content",
});

const KIND_LABELS: Record<GlossaryKind, string> = {
  ingredient: "Ingrédients",
  technique: "Techniques",
  ustensile: "Ustensiles",
};

const glossaryDescription =
  "Ingrédients, gestes et ustensiles du Journal du cuistot — un lexique de cuisine, pas un catalogue.";

useApplyPageSeo({
  title: "Glossaire",
  description: glossaryDescription,
  image: "/img/logo.webp",
  url: "/glossaire",
  og: {
    headline: "Glossaire",
    description: glossaryDescription,
  },
});

const route = useRoute();
const cms = useCms();
const kind = computed<GlossaryKind | undefined>(() => {
  const raw = Array.isArray(route.query.kind) ? route.query.kind[0] : route.query.kind;
  if (raw === "ingredient" || raw === "technique" || raw === "ustensile") {
    return raw;
  }
  return undefined;
});

const { data: terms } = await useAsyncData<CmsListResponse<GlossaryTerm>>(
  () => `glossary-index-${kind.value ?? "all"}`,
  () =>
    cms.glossary({
      kind: kind.value,
      include: ["seo"],
      page: 1,
      pageSize: 200,
    }),
  { watch: [kind] },
);

const grouped = computed(() => {
  const buckets = new Map<string, GlossaryTerm[]>();
  for (const term of terms.value?.data ?? []) {
    const letter = (term.sortKey || term.name || "?").slice(0, 1).toUpperCase() || "?";
    const list = buckets.get(letter) ?? [];
    list.push(term);
    buckets.set(letter, list);
  }
  return [...buckets.entries()].sort(([a], [b]) => a.localeCompare(b, "fr"));
});

function kindHref(next?: GlossaryKind) {
  return next ? { path: "/glossaire", query: { kind: next } } : "/glossaire";
}
</script>

<template>
  <SchemaOrgWebPage name="Glossaire" :description="glossaryDescription" />
  <SchemaOrgBreadcrumb
    :itemListElement="[
      { name: 'Accueil', item: '/' },
      { name: 'Glossaire', item: '/glossaire' },
    ]"
  />

  <div>
    <h1 class="mb-4 block font-serif text-5xl font-normal text-black">
      Glossaire
    </h1>
    <p class="mb-8 max-w-2xl text-stone-600">
      {{ glossaryDescription }}
    </p>
  </div>

  <nav class="mb-10 flex flex-wrap gap-2" aria-label="Filtrer le glossaire">
    <NuxtLink
      :to="kindHref()"
      class="rounded-full px-3 py-1 text-sm"
      :class="!kind ? 'bg-amber-100 text-amber-900' : 'bg-stone-100 text-stone-700 hover:bg-stone-200'"
    >
      Tout
    </NuxtLink>
    <NuxtLink
      v-for="(label, value) in KIND_LABELS"
      :key="value"
      :to="kindHref(value)"
      class="rounded-full px-3 py-1 text-sm"
      :class="kind === value ? 'bg-amber-100 text-amber-900' : 'bg-stone-100 text-stone-700 hover:bg-stone-200'"
    >
      {{ label }}
    </NuxtLink>
  </nav>

  <p
    v-if="!grouped.length"
    class="text-stone-500"
  >
    Le glossaire se remplit au fil des recettes. Revenez bientôt.
  </p>

  <section
    v-for="[letter, rows] in grouped"
    :key="letter"
    class="mb-10"
  >
    <h2 class="mb-3 font-serif text-2xl text-stone-800">
      {{ letter }}
    </h2>
    <ul class="divide-y divide-stone-200 border-y border-stone-200">
      <li
        v-for="term in rows"
        :key="term.id"
      >
        <NuxtLink
          :to="`/glossaire/${term.slug}`"
          class="flex items-baseline justify-between gap-4 py-3 text-stone-800 hover:text-amber-900"
        >
          <span class="font-medium">{{ term.name }}</span>
          <span class="text-xs uppercase tracking-widest text-stone-400">
            {{ term.kind ? KIND_LABELS[term.kind] : "" }}
          </span>
        </NuxtLink>
      </li>
    </ul>
  </section>
</template>
