<script setup>
import { useWindowScroll } from "@vueuse/core";

const { x, y } = useWindowScroll();

const links = [
  {
    id: 0,
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
    id: 2,
    name: "Recettes",
    url: "/recette",
    current: true,
    children: [
      { name: "Toutes les recettes", url: "/recette" },
      { name: "Recettes du monde", url: "/recette/recettes-du-monde" }
    ]
  },
  {
    id: 3,
    name: "Bases de la Cuisine",
    url: "/techniques-culinaires",
    current: true,
    children: [
      /*     {name:"Introduction", url: "/techniques-culinaires"},
          { name: "Ingrédients", url: "/techniques-culinaires/ingredients" },
          { name: "Ustensiles", url: "/techniques-culinaires/ustensiles" }, */
      { name: "Techniques de base", url: "/techniques-culinaires" },
      { name: "Technique de préparation", url: "/techniques-culinaires/preparation-des-ingredients" },
      { name: "Technique de cuisson", url: "/techniques-culinaires/methodes-de-cuisson" },
      { name: "Technique de découpe", url: "/techniques-culinaires/techniques-de-decoupes" },
      { name: "Technique de conservation", url: "/techniques-culinaires/conservation-aliments" },
    ]
  },
  { id: 4, name: "A propos", url: "/a-propos", current: false },
];

const headerMenu = computed(() => links || []);
const mobileMenuOpen = ref(false);
const openDropdown = ref(null);

const subHeaderMenu = computed(() => {
  //split array in 2
  const half = Math.ceil(links.length / 2);
  const firstHalf = links.slice(0, half);
  const secondHalf = links.slice(half);
  return [firstHalf, secondHalf];
});

const route = useRoute();
const currentRoute = computed(() => route.path);

const heightPadding = computed(() => (currentRoute.value == "/" ? 120 : 80));

const toggleDropdown = (linkId) => {
  openDropdown.value = openDropdown.value === linkId ? null : linkId;
};

const closeDropdown = () => {
  openDropdown.value = null;
};
</script>

<template>
  <header class="w-full h-24 md:transparent fixed top-0 z-20">
    <nav class="border-gray-200" :class="{ 'bg-gray-100': y > heightPadding || mobileMenuOpen }">
      <div class="max-w-screen-xl flex flex-wrap items-center justify-between mx-auto px-4 py-3">
        <NuxtLink href="/" class="flex items-center">
          <h1>
            <span class="sr-only">Journal du Cuistot</span>
            <nuxt-img preload src="/img/logo.webp" class="h-16 mr-3 object-cover" alt="Logo Journal du cuistot"
              aria-hidden="true" />
          </h1>
        </NuxtLink>
        <div class="flex md:order-2 print:hidden">
          <button type="button" data-collapse-toggle="navbar-search" aria-controls="navbar-search" aria-expanded="false"
            class="md:hidden text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-4 focus:ring-gray-200 dark:focus:ring-gray-700 rounded-lg text-sm p-2.5 mr-1">
            <svg class="w-5 h-5" aria-hidden="true" fill="currentColor" viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg">
              <path fill-rule="evenodd"
                d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                clip-rule="evenodd"></path>
            </svg>
            <span class="sr-only">Search</span>
          </button>
          <div class="relative hidden md:block">
            <div class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <svg class="w-5 h-5 text-gray-500" aria-hidden="true" fill="currentColor" viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg">
                <path fill-rule="evenodd"
                  d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                  clip-rule="evenodd"></path>
              </svg>
              <span class="sr-only">Search icon</span>
            </div>
            <input type="text" id="search-navbar"
              class="block w-full p-2 pl-10 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Recherche..." />
          </div>
          <button data-collapse-toggle="navbar-search" type="button"
            class="inline-flex items-center p-2 text-sm text-gray-500 rounded-lg md:hidden hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-600"
            aria-controls="navbar-search" :aria-expanded="mobileMenuOpen" @click="mobileMenuOpen = !mobileMenuOpen">
            <span class="sr-only">Open menu</span>
            <svg class="w-6 h-6" aria-hidden="true" fill="currentColor" viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg">
              <path fill-rule="evenodd"
                d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                clip-rule="evenodd"></path>
            </svg>
          </button>
        </div>
        <div class="items-center justify-between w-full md:flex md:w-auto md:order-1" :class="{
          hidden: !mobileMenuOpen,
          'mt-2 ': mobileMenuOpen,
        }" id="navbar-search" @click="closeDropdown">
          <div class="relative mt-3 md:hidden">
            <div class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <svg class="w-5 h-5 text-gray-500" aria-hidden="true" fill="currentColor" viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg">
                <path fill-rule="evenodd"
                  d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                  clip-rule="evenodd"></path>
              </svg>
            </div>
            <input type="text" id="search-navbar"
              class="block w-full p-2 pl-10 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Recherche..." />
          </div>
          <ul
            class="flex flex-col p-4 md:p-0 mt-4 font-medium border border-gray-100 rounded-lg md:flex-row md:space-x-8 md:mt-0 md:border-0">
            <li v-for="link in links" :key="link.id" class="relative" @click.stop>
              <!-- Link with children -->
              <div v-if="link.children && link.children.length > 0" class="relative">
                <button @click="toggleDropdown(link.id)"
                  class="flex items-center justify-between w-full py-2 pl-3 pr-4 text-gray-900 rounded hover:bg-amber-100 md:hover:bg-transparent md:hover:text-yellow-700 md:p-0 md:w-auto"
                  :class="{
                    'bg-amber-400 md:bg-transparent text-white md:text-amber-700':
                      currentRoute.startsWith(link.url)
                  }">
                  {{ link.name }}
                  <svg class="w-4 h-4 ml-1 transform transition-transform duration-200"
                    :class="{ 'rotate-180': openDropdown === link.id }" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd"
                      d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                      clip-rule="evenodd" />
                  </svg>
                </button>

                <!-- Dropdown menu -->
                <div v-show="openDropdown === link.id"
                  class="absolute top-full left-0 mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-50 md:mt-2">
                  <div class="py-1">
                    <NuxtLink v-for="dropdownItem in link.children" :key="dropdownItem.name" :to="dropdownItem.url"
                      class="block px-4 py-2 text-sm text-gray-700 hover:bg-amber-100 hover:text-amber-700"
                      @click="closeDropdown">
                      {{ dropdownItem.name }}
                    </NuxtLink>
                  </div>
                </div>
              </div>

              <!-- Regular link without dropdown -->
              <NuxtLink v-else :to="link.url"
                class="block py-2 pl-3 pr-4 text-gray-900 rounded hover:bg-amber-100 active:text-white md:hover:bg-transparent md:hover:text-yellow-700 md:p-0"
                :active-class="'bg-amber-400 md:bg-transparent text-white md:text-amber-700'" aria-current="page">
                {{ link.name }}
              </NuxtLink>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  </header>
</template>

<style scoped>
/* nav a.router-link-active {
  @apply underline underline-offset-4 decoration-4 decoration-[#50b0ae];
} */
</style>