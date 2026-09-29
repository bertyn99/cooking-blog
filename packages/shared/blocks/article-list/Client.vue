<script setup lang="ts">
import type { ContentBlockListItem, ContentBlockListQuery } from '../../shared/content-blocks/list'
import JdcCoverMedia from '../../app/components/JdcCoverMedia.vue'
import JdcPublicSurface from '../../app/components/JdcPublicSurface.vue'

defineOptions({ inheritAttrs: false })

const props = defineProps<ContentBlockListQuery>()

const { data: articles, status, error } = useContentBlockArticleList(props)

const nuxtLink = resolveComponent('NuxtLink')

function itemTag(item: ContentBlockListItem) {
  if (!item.href) return 'div'
  return typeof nuxtLink === 'string' ? 'a' : nuxtLink
}
</script>

<template>
  <JdcPublicSurface>
    <section class="mx-auto max-w-7xl px-3 py-8 md:py-14 lg:px-12 lg:py-20">
      <div class="mx-auto max-w-2xl lg:max-w-4xl">
        <h4 class="jdc-serif m-0 flex items-center p-0 font-serif text-xl leading-6 font-normal text-black">
          <span class="w-full max-w-max text-xl leading-7 text-black">Derniers Articles</span>
          <span class="ml-4 hidden h-2 w-full border-y border-stone-200 md:block" />
        </h4>

        <div
          v-if="status === 'pending'"
          class="mt-16 space-y-20"
        >
          <USkeleton
            v-for="n in 3"
            :key="n"
            class="h-40 w-full"
          />
        </div>
        <UAlert
          v-else-if="error"
          class="mt-16"
          color="error"
          variant="subtle"
          title="Impossible de charger les articles."
        />
        <p
          v-else-if="!articles?.length"
          class="mt-16 text-sm text-gray-500"
        >
          Aucun article pour le moment.
        </p>
        <div
          v-else
          class="mt-16 space-y-20 px-2 lg:mt-20"
        >
          <article
            v-for="item in articles"
            :key="item.id"
            class="gap-8 md:px-9 lg:flex-row"
          >
            <div class="relative m-0 flex flex-col items-center justify-center p-0 leading-6 text-stone-500 lg:flex-row">
              <div class="m-0 w-full shrink overflow-hidden p-0 lg:basis-[44%]">
                <component
                  :is="itemTag(item)"
                  :href="item.href"
                  :to="item.href"
                  class="m-0 cursor-pointer p-0 text-black hover:text-stone-500"
                >
                  <JdcCoverMedia
                    v-if="item.coverSrc"
                    :src="item.coverSrc"
                    :alt="item.title"
                    :width="1300"
                    :height="910"
                    sizes="sm:70vw md:50vw lg:30vw"
                    img-class="block aspect-[13/9] h-auto max-h-[500px] max-w-full rounded-none object-cover"
                  />
                  <div
                    v-else
                    class="aspect-[13/9] max-h-[500px] w-full bg-neutral-100"
                  />
                </component>
              </div>
              <div class="m-0 flex w-full flex-col justify-center pt-4 align-baseline lg:w-7/12 lg:pr-[4%] lg:pl-12">
                <div class="m-0 flex items-center p-0">
                  <p
                    v-if="item.readingMinutes"
                    class="mt-0 mr-4 mb-2 ml-0 text-xs font-semibold tracking-widest text-black uppercase"
                  >
                    {{ item.readingMinutes }} minutes
                  </p>
                  <span
                    v-if="item.category"
                    class="mt-0 mr-4 mb-2 ml-0 text-xs font-medium tracking-widest text-black uppercase"
                  >
                    {{ item.category }}
                  </span>
                </div>
                <h3 class="jdc-serif m-0 p-0 font-serif text-2xl font-normal break-words text-black">
                  <component
                    :is="itemTag(item)"
                    :href="item.href"
                    :to="item.href"
                    class="m-0 cursor-pointer p-0 hover:text-stone-500"
                  >
                    {{ item.title }}
                  </component>
                </h3>
                <p
                  v-if="item.description"
                  class="mx-0 my-2 py-0 pr-[16%] pl-0"
                >
                  {{ item.description }}
                </p>
              </div>
            </div>
          </article>
        </div>
      </div>
    </section>
  </JdcPublicSurface>
</template>
