<script lang="ts" setup>
type FormattedCategory = { name: string; id: number };

const showMoreCategories = ref(false);

const { categories, selected, searchValue } = defineProps<{
  categories: FormattedCategory[];
  selected: string[];
  searchValue: string;
}>();

const emit = defineEmits<{
  "update:selected": [value: string[]];
  "update:searchValue": [value: string];
  filter: [];
}>();

const localSearch = ref(searchValue);

watch(
  () => searchValue,
  (value) => {
    if (value !== localSearch.value) {
      localSearch.value = value;
    }
  },
);

const emitSearchDebounced = useDebounceFn((value: string) => {
  emit("update:searchValue", value);
}, 300);

const flushSearch = () => {
  emitSearchDebounced.cancel?.();
  emit("update:searchValue", localSearch.value);
};

const check = (optionName: string, checked: boolean) => {
  const updatedValue = [...selected];

  if (checked) {
    updatedValue.push(optionName);
  } else {
    updatedValue.splice(updatedValue.indexOf(optionName), 1);
  }
  emit("update:selected", updatedValue);
};
const onInput = (e: Event) => {
  const value = (e.target as HTMLInputElement).value;
  localSearch.value = value;
  emitSearchDebounced(value);
};
const onFilter = () => {
  flushSearch();
  emit("filter");
};
</script>

<template>
  <div
    class="block py-0 pr-4 pl-0 m-0 leading-6 align-baseline border-0 text-stone-500"
  >
    <h3
      class="font-serif text-2xl font-normal text-black align-baseline break-words border-0"
    >
      Fitrer les Recettes:
    </h3>
    <p class="p-0 mx-0 mt-2 mb-8 align-baseline border-0">
      Cochez plusieurs cases ci-dessous pour affiner les résultats de la
      recherche de recettes
    </p>
    <div class="mx-0 mt-0 mb-8 align-baseline border-0">
      <div class="m-0 align-baseline border-0" data-type="custom_search">
        <input
          type="text"
          name="qodef-text-custom_search"
          :value="localSearch"
          @input="onInput"
          placeholder="Que recherchez-vous ?"
          class="inline-block relative py-4 px-6 mx-0 mt-0 mb-5 w-full text-base align-top bg-transparent rounded-none border border-solid appearance-none cursor-text border-zinc-300 focus:border-black focus:bg-transparent focus:text-black"
          style="
            outline: 0px;
            transition: color 0.2s ease-out 0s,
              background-color 0.2s ease-out 0s, border-color 0.2s ease-out 0s;
          "
        />
      </div>
    </div>
    <div class="mx-0 mt-0 mb-8 align-baseline border-0">
      <div class="m-0 align-baseline border-0" data-type="category">
        <h5
          class="mx-0 mt-0 mb-4 font-serif text-lg font-normal text-black align-baseline break-words border-0"
        >
          Filtrer par categories
        </h5>
        <div
          id="showmore-1"
          data-showmore=""
          style="max-width: 768px"
          class="max-w-screen-md align-baseline border-0"
        >
          <div
            class="overflow-hidden align-baseline border-0"
            :class="showMoreCategories ? '' : 'max-h-[156px]'"
            data-count="15"
            data-count-limit="6"
            data-show-more-text="Show more (15)"
            data-show-less-text="Show less"
          >
            <div
              class="flex items-center align-baseline border-0"
              v-for="category in categories"
              :key="category?.id"
            >
              <BaseInputCheckbox
                :fieldId="category?.name"
                :checked="selected.includes(category?.name)"
                @update:checked="check(category?.name, $event)"
                :label="category?.name"
              />
            </div>
          </div>
          <div
            id="showmore-button-1"
            class="p-0 m-1 font-sans text-xs font-semibold tracking-widest text-black uppercase align-baseline border-0 cursor-pointer"
            v-if="categories.length > 6"
            @click="showMoreCategories = !showMoreCategories"
          >
            Show more
          </div>
        </div>
      </div>
    </div>

    <div class="p-0 mx-0 mt-0 mb-8 align-baseline border-0">
      <button
        class="inline-block relative py-3 px-10 m-0 w-auto font-sans text-xs font-semibold leading-8 text-white uppercase align-middle bg-black rounded-none border border-transparent border-solid cursor-pointer hover:bg-zinc-800 hover:text-white"
        style="
          transition: color 0.2s ease-out 0s, background-color 0.2s ease-out 0s,
            border-color 0.2s ease-out 0s;
          box-shadow: none;
        "
        @click="onFilter"
      >
        <span class="uppercase align-baseline border-0 tracking-[1.8px]"
          >Filtrer le Resultats</span
        >
      </button>
    </div>
  </div>
</template>
