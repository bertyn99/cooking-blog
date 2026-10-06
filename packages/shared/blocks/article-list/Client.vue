<script setup lang="ts">
import JdcCoverMedia from '../../app/components/JdcCoverMedia.vue'
import JdcPublicSurface from '../../app/components/JdcPublicSurface.vue'
import JdcSectionHeading from '../../app/components/JdcSectionHeading.vue'

defineOptions({ inheritAttrs: false })

const props = defineProps<{
  source?: string
  category?: string
  slugs?: string
  limit?: string | number
}>()

const { data: articles, status, error } = useContentBlockArticleList(props)
</script>

<template>
  <JdcPublicSurface>
    <UPageSection
      as="section"
      :ui="{
        container: 'max-w-4xl gap-8 py-16 sm:py-20 lg:py-20',
      }"
    >
      <div class="w-full">
        <JdcSectionHeading>
          <slot name="title">
            Derniers articles
          </slot>
        </JdcSectionHeading>

        <div
          v-if="status === 'pending'"
          class="space-y-12"
        >
          <USkeleton
            v-for="n in 3"
            :key="n"
            class="h-40 w-full rounded-none"
          />
        </div>
        <UAlert
          v-else-if="error"
          color="error"
          variant="subtle"
          title="Impossible de charger les articles."
        />
        <p
          v-else-if="!articles?.length"
          class="text-sm text-toned"
        >
          Aucun article pour le moment.
        </p>
        <div
          v-else
          class="space-y-12 lg:space-y-16"
        >
          <UPageCard
            v-for="item in articles"
            :key="item.id"
            variant="naked"
            orientation="horizontal"
            reverse
            class="group"
            :to="item.href"
            :title="item.title"
            :description="item.description"
            :ui="{
              root: 'rounded-none',
              container: 'gap-8 p-0 sm:p-0 lg:items-center',
              title: 'jdc-serif text-2xl font-normal transition-colors duration-200 group-hover:text-yellow-800',
              description: 'text-base text-toned',
              header: 'mb-2',
            }"
          >
            <div class="overflow-hidden bg-elevated">
              <JdcCoverMedia
                v-if="item.coverSrc"
                :src="item.coverSrc"
                :alt="item.title"
                :width="1300"
                :height="910"
                sizes="sm:70vw md:50vw lg:30vw"
                img-class="block aspect-[13/9] h-auto max-h-[500px] w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
              />
              <div
                v-else
                class="flex aspect-[13/9] max-h-[500px] w-full items-center justify-center bg-elevated text-muted"
              >
                <UIcon
                  name="i-lucide-newspaper"
                  class="size-8"
                />
              </div>
            </div>
            <template
              v-if="item.readingMinutes || item.category"
              #header
            >
              <div class="flex items-center gap-4 text-xs font-medium tracking-widest text-highlighted uppercase">
                <span v-if="item.readingMinutes">{{ item.readingMinutes }} minutes</span>
                <span v-if="item.category">{{ item.category }}</span>
              </div>
            </template>
          </UPageCard>
        </div>
      </div>
    </UPageSection>
  </JdcPublicSurface>
</template>
