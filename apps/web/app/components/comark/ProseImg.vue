<script lang="ts" setup>
import { toPublicMediaKey } from "#shared/media-public-path";

const props = defineProps<{
  src?: string;
  alt?: string;
  title?: string;
}>();

const ASPECT_CLASS: Record<string, string> = {
  "16:9": "aspect-[16/9]",
  "4:3": "aspect-[4/3]",
  "3:2": "aspect-[3/2]",
  "1:1": "aspect-square",
  "3:4": "aspect-[3/4]",
};

const DEFAULT_ASPECT_CLASS = "aspect-[4/3]";

const publicSrc = computed(() => {
  let raw = props.src?.trim() ?? "";
  if (!raw) return "";
  if (raw.startsWith("http://") || raw.startsWith("https://")) {
    try {
      raw = new URL(raw).pathname;
    } catch {
      return raw;
    }
  }
  raw = raw.replace(/^\/+/, "");
  if (raw.startsWith("images/")) {
    raw = raw.slice("images/".length);
  }
  // Optional IPX modifiers: `w_800,f_webp/uploads/…`
  if (!raw.startsWith("uploads/") && raw.includes("/")) {
    const slash = raw.indexOf("/");
    const first = raw.slice(0, slash);
    if (first === "_" || first.includes("_") || first.includes(",")) {
      raw = raw.slice(slash + 1);
    }
  }
  return toPublicMediaKey(raw);
});

const aspectClass = computed(() => {
  const title = props.title?.trim() ?? "";
  return ASPECT_CLASS[title] ?? DEFAULT_ASPECT_CLASS;
});

const resolvedAlt = computed(() => props.alt?.trim() || "");
</script>

<template>
  <NuxtImg
    v-if="publicSrc"
    :src="publicSrc"
    :alt="resolvedAlt"
    provider="localImageSharp"
    width="800"
    format="webp"
    fit="cover"
    loading="lazy"
    class="w-4/5 object-cover"
    :class="aspectClass"
  />
</template>
