<script setup>
const { label, fieldId, checked } = defineProps({
  label: String,
  fieldId: {
    type: String,
    required: true,
  },
  checked: {
    type: Boolean,
  },
});
const emit = defineEmits(["update:checked"]);
</script>

<template>
  <input
    @input="(event) => emit('update:checked', event.target.checked)"
    type="checkbox"
    :checked="checked"
    :id="fieldId"
    class="font-sans text-sm text-black cursor-default"
  />
  <label
    for="fieldId"
    class="block p-0 my-0 mr-0 ml-1 align-baseline border-0 cursor-default"
    >{{ label }}</label
  >
</template>

<style></style>
