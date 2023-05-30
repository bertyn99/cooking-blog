<script lang="ts" setup>
definePageMeta({ layout: "content" });
import article from "~/assets/article.json";
// get current route slug
const {
  params: { slug },
} = useRoute();

if (slug.length === 0 || slug === " ") {
  throw createError({ statusCode: 404, statusMessage: "Page Not Found" });
}

const { find } = useStrapi();
const slugf = "le-masala-l-epice-indienne-emblematique";

const { data, pending, refresh, error } = await useAsyncData("articles", () =>
  find(`articles?filters[slug][$eq]=${slugf}`)
);
console.log(data);
const content = useMarked(article.content);
if (!data) {
  throw createError({ statusCode: 404, statusMessage: "Page Not Found" });
}

// set meta for page
useHead({
  title: `${capitalize(category)} articles - JournalDuCuistot`,
  meta: [
    {
      name: "description",
      content: `JournalDuCuistot - Article et recete sur cuisine du ${category}`,
    },
    {
      name: "robots",
      content: "follow, max-image-preview:large",
    },
    {
      property: "og:locale",
      content: "en-US",
    },
    {
      property: "og:title",
      content: `Journal du cuistot - article of the category ${category}`,
    },
    {
      property: "og:description",
      content: `Article et recete sur cuisine du ${category} - JournalDuCuistot  `,
    },
    {
      property: "og:type",
      content: "collections",
    },
    {
      property: "og:url",
      content: "https://www.journalducuistot.fr/" + slug,
    },
    {
      property: "og:site_name",
      content: "Journal du cuistot",
    },
    {
      property: "og:image",
      content: "https://www.journalducuistot.fr/img/scire_logo_primary.png",
    },
    //twitter
    {
      property: "twitter:card",
      content: "summary_large_image",
    },
    {
      property: "twitter:url",
      content: "https://www.journalducuistot.fr/" + slug,
    },
    {
      property: "twitter:title",
      content:
        "ScireDev - your website to learn the web and mobile developpement",
    },
    {
      property: "twitter:description",
      content:
        "Welcome to scireDev the website that share with you the key to become a better developper. Come learn with us",
    },
    {
      property: "twitter:image",
      content: "https://www.journalducuistot.fr/img/scire_logo_primary.png",
    },
  ],
});
</script>

<template>
  <div>
    <h1
      itemprop="name"
      class="block mb-4 font-serif text-5xl font-normal text-black align-baseline"
    >
      40 Mother’s Day Breakfast and Brunch Recipes
    </h1>
    <Share />
  </div>

  <SectionHeroArticle>
    <template #info>
      <p
        class="flex-[0_0_auto] items-center mx-2 h-6 text-xs leading-6 font-semibold tracking-widest text-black uppercase align-baseline"
      >
        <Icon name="ic:sharp-access-time" class="h-3 w-3 text-gray-500" />
        30 minutes
      </p>

      <div
        class="flex-[0_0_auto] p-0 my-0 mx-2 h-6 text-xs font-semibold tracking-widest text-black uppercase align-baseline"
      >
        <a
          itemprop="url"
          class="p-0 m-0 leading-6 uppercase align-baseline cursor-pointer hover:text-stone-500"
          href="https://easymeals.qodeinteractive.com/recipe-category/breakfast/"
          style="
            outline: 0px;
            text-decoration: none;
            transition: color 0.2s ease-out 0s;
            background-position: 0px center;
          "
        >
          <Icon name="ion:ios-pricetag-outline" />
          Breakfast
        </a>
      </div>
    </template>
  </SectionHeroArticle>
  <article class="prose md:prose-lg lg:prose-xl" v-html="content"></article>
</template>
