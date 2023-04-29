<script setup>
import { Dialog, DialogPanel } from "@headlessui/vue";
const storyblokApi = useStoryblokApi();
const { data } = await storyblokApi.get("cdn/stories/config", {
  version: "draft",
  resolve_links: "url",
});
const headerMenu = computed(() => data.story.content.header_menu || []);
const mobileMenuOpen = ref(false);
const subHeaderMenu = computed(() => {
  //split array in 2
  const half = Math.ceil(data.story.content.header_menu.length / 2);
  const firstHalf = data.story.content.header_menu.slice(0, half);
  const secondHalf = data.story.content.header_menu.slice(half);
  return [firstHalf, secondHalf];
});
</script>

<template>
  <header class="w-full h-24 transparent">
    <nav
      class="mx-auto flex max-w-7xl items-center justify-between lg:justify-center gap-8 p-6 lg:px-8"
      aria-label="Global"
    >
      <div class="hidden lg:flex">
        <div class="hidden lg:flex lg:gap-x-12">
          <NuxtLink
            v-for="blok in subHeaderMenu[0]"
            :key="blok._uid"
            :to="blok.link.cached_url"
            class="hidden lg:block text-sm font-semibold leading-6 text-gray-900 capitalize"
            >{{ blok.link.story.name }}</NuxtLink
          >
        </div>
      </div>
      <NuxtLink href="#" class="-m-1.5 p-1.5">
        <span class="sr-only">Cooking</span>
        <img
          class="h-8 w-auto"
          src="https://tailwindui.com/img/logos/mark.svg?color=indigo&shade=600"
          alt=""
        />
      </NuxtLink>
      <div class="flex justify-between">
        <div class="flex lg:gap-x-12">
          <NuxtLink
            v-for="blok in subHeaderMenu[1]"
            :key="blok._uid"
            :to="blok.link.cached_url"
            class="hidden lg:block text-sm font-semibold leading-6 text-gray-900 capitalize"
            >{{ blok.link.story.name }}</NuxtLink
          >
        </div>

        <!--    <a href="#" class="text-sm font-semibold leading-6 text-gray-900"
          >Log in <span aria-hidden="true">&rarr;</span></a
        > -->
        <div class="flex lg:hidden">
          <button
            type="button"
            class="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-gray-700"
            @click="mobileMenuOpen = true"
          >
            <span class="sr-only">Open main menu</span>
            <Icon
              name="heroicons:bars-3-20-solid"
              class="h-6 w-6"
              aria-hidden="true"
            />
          </button>
        </div>
      </div>
    </nav>
    <Dialog
      as="div"
      class="lg:hidden"
      @close="mobileMenuOpen = false"
      :open="mobileMenuOpen"
    >
      <div class="fixed inset-0 z-10" />
      <DialogPanel
        class="fixed inset-y-0 left-0 z-10 w-full overflow-y-auto bg-gray-100 px-6 py-6"
      >
        <div class="flex items-center justify-between">
          <div class="flex flex-1">
            <button
              type="button"
              class="-m-2.5 rounded-md p-2.5 text-gray-700"
              @click="mobileMenuOpen = false"
            >
              <span class="sr-only">Close menu</span>
              <Icon
                name="heroicons:x-mark-20-solid"
                class="h-6 w-6"
                aria-hidden="true"
              />
            </button>
          </div>
          <NuxtLink to="/" class="-m-1.5 p-1.5">
            <span class="sr-only">Your Company</span>
            <img
              class="h-8 w-auto"
              src="https://tailwindui.com/img/logos/mark.svg?color=indigo&shade=600"
              alt=""
            />
          </NuxtLink>
          <div class="flex flex-1 justify-end">
            <a href="#" class="text-sm font-semibold leading-6 text-gray-900"
              >Log in <span aria-hidden="true">&rarr;</span></a
            >
          </div>
        </div>
        <div class="mt-6 space-y-2">
          <NuxtLink
            v-for="block in headerMenu"
            :key="block._uid"
            :to="block.link.cached_url"
            class="-mx-3 block rounded-lg px-3 py-2 cursor-pointer text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50 capitalize"
            >{{ block.link.story?.name }}</NuxtLink
          >
        </div>
      </DialogPanel>
    </Dialog>
  </header>
</template>

<style scoped>
nav a.router-link-active {
  @apply underline underline-offset-4 decoration-4 decoration-[#50b0ae];
}
</style>
