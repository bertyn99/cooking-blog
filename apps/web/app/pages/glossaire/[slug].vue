<script lang="ts" setup>
import type { Cover, GlossaryKind, GlossaryTerm } from "~/types/strapiMeta";

definePageMeta({
  layout: "content",
});

const KIND_LABELS: Record<GlossaryKind, string> = {
  ingredient: "Ingrédient",
  technique: "Technique",
  ustensile: "Ustensile",
};

const route = useRoute();
const cms = useCms();

const termSlug = computed(() => {
  const slug = route.params.slug;
  return Array.isArray(slug) ? slug[0] : slug;
});

const { data: term, status } = await useAsyncData<GlossaryTerm | null>(
  () => `glossary:${termSlug.value}`,
  async () => {
    const slug = termSlug.value;
    if (!slug) return null;
    const result = await cms.glossary({
      slug,
      include: ["cover", "seo", "aliases"],
      page: 1,
      pageSize: 1,
    });
    return result.data[0] ?? null;
  },
  { watch: [termSlug] },
);

watch([term, status], ([next, currentStatus]) => {
  if (currentStatus === "pending") return;
  if (!next) {
    showError({ statusCode: 404, statusMessage: "Page Not Found" });
    return;
  }
  clearError();
}, { immediate: true });

if (!term.value) {
  throw createError({ statusCode: 404, statusMessage: "Page Not Found" });
}

const titleContent = computed(() => term.value?.name || term.value?.title || "Glossaire");
const kindLabel = computed(() => {
  const kind = term.value?.kind;
  return kind ? KIND_LABELS[kind] : "";
});
const cover = computed(() => term.value?.cover || ({} as Cover));
const pagePath = computed(() => `/glossaire/${termSlug.value}`);
const pageUrl = computed(() => useSitePageUrl(pagePath.value));
const coverSource = computed(() => ({
  cover: term.value?.cover,
  coverBlobPathname: term.value?.coverBlobPathname,
  slug: term.value?.slug,
  title: term.value?.name,
}));
const urlCover = computed(() => formatCoverUrlFromSource(coverSource.value));
const seo = computed(() => {
  const seoValue = term.value?.seo;
  return Array.isArray(seoValue) ? seoValue[0] || {} : seoValue || {};
});
const metaDescription = computed(
  () =>
    seo.value?.description
    || term.value?.description
    || `${titleContent.value} — glossaire du Journal du cuistot`,
);
const robots = computed(() => seo.value?.metaRobots || "noindex,follow");
const showCover = computed(() => Boolean(urlCover.value));
const buyUrl = computed(() => term.value?.resolvedAffiliateUrl || null);

useApplyPageSeo(computed(() => ({
  title: titleContent.value,
  description: metaDescription.value,
  keywords: seo.value?.keywords,
  image: formatCoverOgImagePath(coverSource.value) || "/img/logo.webp",
  url: pagePath.value,
  robots: robots.value,
  og: {
    headline: titleContent.value,
    description: metaDescription.value,
  },
})));

const tocLinks = useMarkdownToc(
  () => `glossary-toc:${termSlug.value}`,
  () => term.value?.content || "",
);
</script>

<template>
  <SchemaOrgBreadcrumb
    :itemListElement="[
      { name: 'Accueil', item: '/' },
      { name: 'Glossaire', item: '/glossaire' },
      { name: titleContent, item: pagePath },
    ]"
  />
  <SchemaOrgDefinedTerm
    :name="titleContent"
    :description="metaDescription"
    :url="pageUrl"
  />

  <div>
    <p class="mb-2 text-xs font-semibold uppercase tracking-widest text-stone-500">
      {{ kindLabel }}
    </p>
    <h1 class="mb-4 block font-serif text-5xl font-normal text-black">
      {{ titleContent }}
    </h1>
    <p
      v-if="term?.description"
      class="mb-6 max-w-2xl text-lg text-stone-600"
    >
      {{ term.description }}
    </p>
  </div>

  <SectionHeroArticle
    v-if="showCover && urlCover"
    :url="urlCover"
    :alt="cover.alternativeText || titleContent"
  />

  <p
    v-if="term?.brand"
    class="mb-4 text-sm text-stone-500"
  >
    {{ term.brand }}
  </p>

  <p v-if="buyUrl" class="mb-8">
    <a
      :href="buyUrl"
      class="inline-flex items-center gap-2 rounded-full bg-amber-100 px-4 py-2 text-sm font-medium text-amber-950 hover:bg-amber-200"
      rel="nofollow sponsored noopener"
      target="_blank"
    >
      Voir le produit
    </a>
  </p>

  <BaseToc v-if="tocLinks.length >= 3" :links="tocLinks" class="mb-8" />
  <BaseMarkdownContent
    v-if="term?.content"
    :markdown="term.content"
    tag="article"
  />

  <p
    v-if="term?.parent?.name"
    class="mt-8 text-sm text-stone-600"
  >
    Forme de
    <NuxtLink
      v-if="term.parent.path"
      :to="term.parent.path"
      class="text-amber-900 underline decoration-amber-300/80 hover:text-amber-950"
    >
      {{ term.parent.name }}
    </NuxtLink>
    <span v-else>{{ term.parent.name }}</span>
  </p>

  <section
    v-if="term?.forms?.length"
    class="mt-10"
  >
    <h2 class="mb-3 font-serif text-2xl text-stone-800">
      Autres formes
    </h2>
    <ul class="flex flex-wrap gap-2">
      <li
        v-for="form in term.forms"
        :key="form.id"
      >
        <NuxtLink
          v-if="form.path"
          :to="form.path"
          class="inline-flex rounded-md bg-stone-100 px-2.5 py-1 text-sm text-stone-800 hover:bg-stone-200"
        >
          {{ form.name }}
        </NuxtLink>
        <span
          v-else
          class="inline-flex rounded-md bg-stone-100 px-2.5 py-1 text-sm text-stone-500"
        >
          {{ form.name }}
        </span>
      </li>
    </ul>
  </section>

  <section
    v-if="term?.recipes?.length"
    class="mt-10"
  >
    <h2 class="mb-3 font-serif text-2xl text-stone-800">
      Recettes
    </h2>
    <ul class="list-disc space-y-1 pl-5 text-stone-800">
      <li
        v-for="recipe in term.recipes"
        :key="recipe.id"
      >
        <NuxtLink
          :to="recipe.path"
          class="text-amber-900 underline decoration-amber-300/80 hover:text-amber-950"
        >
          {{ recipe.title }}
        </NuxtLink>
      </li>
    </ul>
  </section>
</template>
