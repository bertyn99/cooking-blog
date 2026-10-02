<script setup lang="ts">
import type { ContentBlockListItem, ContentBlockListQuery } from '../../shared/content-blocks/list'
import JdcCoverMedia from '../../app/components/JdcCoverMedia.vue'
import JdcPublicSurface from '../../app/components/JdcPublicSurface.vue'

defineOptions({ inheritAttrs: false })

const props = defineProps<ContentBlockListQuery>()

const { data: recipes, status, error } = useContentBlockRecipeList(props)

const nuxtLink = resolveComponent('NuxtLink')

function itemTag(item: ContentBlockListItem) {
  if (!item.href) return 'div'
  return typeof nuxtLink === 'string' ? 'a' : nuxtLink
}
</script>

<template>
  <JdcPublicSurface>
    <div class="mx-auto max-w-6xl py-1">
      <div
        v-if="status === 'pending'"
        class="grid grid-cols-1 gap-6 px-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
      >
        <USkeleton
          v-for="n in 4"
          :key="n"
          class="aspect-[3/4] w-full rounded-t-lg"
        />
      </div>
      <UAlert
        v-else-if="error"
        class="mx-4"
        color="error"
        variant="subtle"
        title="Impossible de charger les recettes."
      />
      <p
        v-else-if="!recipes?.length"
        class="px-4 text-sm text-gray-500"
      >
        Aucune recette pour le moment.
      </p>
      <div
        v-else
        role="list"
        class="grid grid-cols-1 gap-6 px-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
      >
        <article
          v-for="item in recipes"
          :key="item.id"
          class="col-span-1 flex flex-col rounded-lg"
        >
          <component
            :is="itemTag(item)"
            :href="item.href"
            :to="item.href"
            class="group"
          >
            <div class="overflow-hidden rounded-t-lg bg-neutral-100">
              <JdcCoverMedia
                v-if="item.coverSrc"
                :src="item.coverSrc"
                :alt="item.title"
                :width="1300"
                :height="1657"
                sizes="sm:55vw md:25vw lg:20vw"
                img-class="aspect-[3/4] w-full object-cover"
              />
              <div
                v-else
                class="aspect-[3/4] w-full bg-neutral-100"
              />
            </div>
            <div
              v-if="item.time || item.difficulty"
              class="mt-8 flex items-center gap-x-4 text-xs"
            >
              <span
                v-if="item.time"
                class="inline-flex items-center gap-1 font-medium text-gray-700 uppercase"
              >
                <UIcon
                  name="i-lucide-clock"
                  class="h-3 w-3 text-gray-400"
                />
                {{ item.time }} minutes
              </span>
              <span
                v-if="item.difficulty"
                class="inline-flex items-center gap-1 font-medium text-gray-700 uppercase"
              >
                <UIcon
                  name="i-lucide-utensils"
                  class="h-3 w-3 text-gray-400"
                />
                {{ item.difficulty }}
              </span>
            </div>
            <h3 class="mt-3 text-lg leading-6 font-semibold text-gray-900 capitalize group-hover:text-gray-600">
              {{ item.title }}
            </h3>
          </component>
        </article>
      </div>
    </div>
  </JdcPublicSurface>
</template>
