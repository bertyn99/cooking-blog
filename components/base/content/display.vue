<script lang="ts" setup>
const { content } = defineProps(["content"]);

const reFormtedContent = computed(() => {
  return content.map((item) => {
    if (item["__component"] === "ui.text") {
      return {
        ...item,
        content: useMarked(item.content),
      };
    }
    return item;
  });
});
</script>

<template>
  <template v-for="item in reFormtedContent" :key="item.id">
    <template v-if="item['__component'] === 'ui.text'">
      <div class="prose md:prose-lg" v-html="item.content"></div>
    </template>
  </template>
</template>
