<script setup lang="ts">
const props = defineProps<{
  totalPage: number
  currentPage: number
}>()

const route = useRoute()

function toPage(page: number) {
  return listPageLocation(route.path, route.query, page)
}
</script>

<template>
  <div
    v-if="props.totalPage > 1"
    class="bg-white w-full max-w-3xl px-2 h-14 inline-flex justify-end my-4"
  >
    <nav
      class="h-full w-full max-w-[585px] inline-flex justify-end p-2 gap-2"
      aria-label="Pagination"
    >
      <NuxtLink
        v-if="props.currentPage > 1"
        :to="toPage(props.currentPage - 1)"
        class="bg-primary-darken p-2"
        active-class=""
        exact-active-class=""
        aria-current="false"
        aria-label="Page précédente"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          stroke="currentColor"
          class="w-6 h-6"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M15.75 19.5L8.25 12l7.5-7.5"
          />
        </svg>
      </NuxtLink>
      <ul class="h-full inline-flex justify-center items-center w-full gap-3">
        <li
          v-for="page in props.totalPage"
          :key="page"
        >
          <NuxtLink
            :to="toPage(page)"
            class="text-medium text-xl text-zinc-500 hover:bg-tertiary-default/50 p-2 cursor-pointer"
            :class="props.currentPage === page
              ? 'bg-tertiary-default/50 text-zinc-900 font-semibold'
              : ''"
            active-class=""
            exact-active-class=""
            :aria-current="props.currentPage === page ? 'page' : undefined"
            :aria-label="`Page ${page}`"
          >
            {{ page }}
          </NuxtLink>
        </li>
      </ul>
      <NuxtLink
        v-if="props.currentPage < props.totalPage"
        :to="toPage(props.currentPage + 1)"
        class="bg-black p-2"
        active-class=""
        exact-active-class=""
        aria-current="false"
        aria-label="Page suivante"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          stroke="currentColor"
          class="w-6 h-6 text-white"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M8.25 4.5l7.5 7.5-7.5 7.5"
          />
        </svg>
      </NuxtLink>
    </nav>
  </div>
</template>
