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

const { data: recipes, status, error } = useContentBlockRecipeList(props)

const gridUi = {
  base: 'relative grid list-none grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4 sm:gap-x-8 sm:gap-y-12',
}

const skeletonCount = computed(() => {
  const n = Number(props.limit)
  if (Number.isFinite(n) && n > 0) return Math.min(Math.trunc(n), 8)
  return 4
})
</script>

<template>
  <JdcPublicSurface>
    <UPageSection
      as="section"
      :ui="{
        container: 'gap-8 py-16 sm:py-20 lg:py-20',
      }"
    >
      <div class="w-full">
        <JdcSectionHeading v-if="$slots.title">
          <slot name="title" />
        </JdcSectionHeading>

        <UPageGrid
          v-if="status === 'pending'"
          :ui="gridUi"
        >
          <USkeleton
            v-for="n in skeletonCount"
            :key="n"
            class="aspect-[3/4] w-full rounded-none"
          />
        </UPageGrid>
        <UAlert
          v-else-if="error"
          color="error"
          variant="subtle"
          title="Impossible de charger les recettes."
        />
        <p
          v-else-if="!recipes?.length"
          class="text-sm text-toned"
        >
          Aucune recette pour le moment.
        </p>
        <UPageGrid
          v-else
          as="ul"
          :ui="gridUi"
        >
          <UPageCard
            v-for="item in recipes"
            :key="item.id"
            as="li"
            variant="naked"
            reverse
            class="group"
            :to="item.href"
            :title="item.title"
            :ui="{
              root: 'rounded-none',
              container: 'gap-4 p-0 sm:p-0',
              title: 'jdc-serif text-lg leading-6 font-normal capitalize transition-colors duration-200 group-hover:text-yellow-800',
              header: 'mt-4 mb-0',
            }"
          >
            <div class="overflow-hidden bg-elevated">
              <JdcCoverMedia
                v-if="item.coverSrc"
                :src="item.coverSrc"
                :alt="item.title"
                :width="1300"
                :height="1657"
                sizes="90vw sm:45vw lg:25vw"
                img-class="aspect-[3/4] w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
              />
              <div
                v-else
                class="flex aspect-[3/4] w-full items-center justify-center bg-elevated text-muted"
              >
                <UIcon
                  name="i-lucide-utensils"
                  class="size-8"
                />
              </div>
            </div>
            <template
              v-if="item.time || item.difficulty"
              #header
            >
              <div class="flex items-center gap-x-4 text-xs font-medium tracking-wide text-toned uppercase">
                <span
                  v-if="item.time"
                  class="inline-flex items-center gap-1"
                >
                  <UIcon
                    name="i-lucide-clock"
                    class="size-3 text-muted"
                  />
                  {{ item.time }} minutes
                </span>
                <span
                  v-if="item.difficulty"
                  class="inline-flex items-center gap-1"
                >
                  <UIcon
                    name="i-lucide-utensils"
                    class="size-3 text-muted"
                  />
                  {{ item.difficulty }}
                </span>
              </div>
            </template>
          </UPageCard>
        </UPageGrid>
      </div>
    </UPageSection>
  </JdcPublicSurface>
</template>
