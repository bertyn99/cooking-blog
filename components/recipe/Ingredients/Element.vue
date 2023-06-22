<script lang="ts" setup>
defineProps(["ingredient", "multiplicator"]);
const isChecked = ref(false);
</script>

<template>
  <td class="whitespace-nowrap py-4 pl-4 text-sm font-medium text-gray-900">
    <Icon
      name="mdi:checkbox-blank-circle-outline"
      class="h-4 w-4 text-amber-200"
      v-if="!isChecked"
      @click="isChecked = !isChecked"
    />
    <Icon
      name="mdi:check-circle-outline"
      class="h-4 w-4 text-amber-200"
      v-else
      @click="isChecked = !isChecked"
    />
  </td>
  <td
    class="whitespace-nowrap py-4 pl-4 pr-4 text-sm text-gray-500 sm:pr-0"
    :class="{ 'line-through': isChecked }"
  >
    {{ ingredient.qty * multiplicator }}
    {{ ingredient.unit !== "none" ? ingredient.unit : "" }}
    {{ ingredient.name }}
  </td>
</template>
