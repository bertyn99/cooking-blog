<script lang="ts" setup>
const props = defineProps<{
  src?: string;
  alt?: string;
  title?: string;
}>();

const publicSrc = computed(() => {
  const raw = props.src?.trim() ?? "";
  if (!raw) return "";
  if (raw.startsWith("http://") || raw.startsWith("https://")) {
    try {
      const url = new URL(raw);
      const uploads = url.pathname.match(/\/uploads\/(.+)$/);
      if (uploads?.[1]) return uploads[1];
    } catch {
      return raw;
    }
  }
  return raw.replace(/^\/?uploads\//, "");
});
</script>

<template>
  <NuxtImg
    v-if="publicSrc"
    :src="publicSrc"
    :alt="alt || title || ''"
    provider="localImageSharp"
    width="800"
    format="webp"
    fit="cover"
    loading="lazy"
    class="w-4/5 aspect-[4/3] object-cover"
  />
</template>
