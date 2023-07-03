<script lang="ts" setup>
const links = [
  {
    id: 1,
    name: "Accueil",
    url: "/",
    current: true,
  },
  {
    id: 1,
    name: "Blog",
    url: "/blog",
    current: true,
  },
  {
    id: 1,
    name: "Recette",
    url: "/recette",
    current: true,
  },
  { id: 2, name: "A propos", url: "/a-propos", current: false },
];
</script>

<template>
  <footer
    class="py-2 px-1 md:px-4lg:px-8 m-0 w-full leading-6 align-top border-0 print:hidden border-solid border-stone-200 text-stone-500"
    style="outline: 0px; background-position: 0px center"
  >
    <div class="w-full max-w-7xl mx-auto flex justify-around items-center">
      <div>© 2023 JournalDuCuistot, Tous droit reservée</div>

      <ul
        class="flex gap-3 text-xs text-center align-top border-0 text-zinc-700 font-semibold tracking-widest uppercase"
      >
        <li v-for="item in links" :key="item.id">
          <NuxtLink :to="item.url">
            {{ item.name }}
          </NuxtLink>
        </li>
      </ul>

      <ul class="flex justify-around">
        <li>
          <NuxtLink
            to="ttps://www.instagram.com/journalducuistot"
            class="text-neutral-600"
          >
            <Icon name="uil:instagram" />
          </NuxtLink>
        </li>
        <li>
          <NuxtLink to="/rss.xml" target="_blank" class="text-neutral-600">
            <Icon name="ic:sharp-rss-feed" />
          </NuxtLink>
        </li>
        <li>
          <NuxtLink
            to="https://www.pinterest.com/journalducuistot/"
            class="text-neutral-600"
          >
            <Icon name="ph:pinterest-logo-bold" />
          </NuxtLink>
        </li>
      </ul>
    </div>
  </footer>
</template>
