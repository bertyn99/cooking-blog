<script lang="ts" setup>
const { find } = useStrapi();

const { data: recipes } = useAsyncData("lates-recipes", () => {
  return find("recipes?sort[0]=id%3Adesc&pagination[pageSize]=3&populate=*");
});

console.log(recipes);
</script>

<template>
  <div
    class="table clear-both px-10 pt-3 pb-12 mx-0 mt-0 mb-10 leading-6 text-center align-baseline border border-solid table-fixed border-stone-200 text-stone-500"
    data-area="main-sidebar"
    style="content: ''"
  >
    <h5
      class="inline-block relative py-0 px-4 mx-0 mt-0 mb-2 font-sans text-xs font-semibold tracking-widest text-center uppercase align-baseline break-words bg-white border-0 text-zinc-800"
      style="top: -28px; z-index: 5"
    >
      Latest recipes
    </h5>
    <div
      class="inline-block relative p-0 mx-0 mt-0 -mb-5 w-full text-left align-top border-0"
    >
      <div
        class="table clear-both p-0 my-0 -mx-3 align-baseline border-0 table-fixed"
        style="content: ''"
      >
        <article
          class="inline-block float-left relative py-0 px-2 mx-0 mt-0 mb-5 w-full align-top"
          v-for="recipe in recipes?.data"
        >
          <div
            class="flex relative justify-center items-center align-baseline border-0"
          >
            <div
              class="overflow-hidden relative flex-grow flex-shrink align-baseline border-0"
              style="flex-basis: 44%"
            >
              <div class="align-baseline border-0">
                <NuxtLink
                  itemprop="url"
                  :to="`/recette/${recipe.attributes?.slug}`"
                  class="align-baseline border-0 cursor-pointer hover:text-black"
                  style="transition: color 0.2s ease-out 0s"
                >
                  <CustomImage :cover="recipe.attributes?.cover" />
                </NuxtLink>
              </div>
            </div>
            <div
              class="flex flex-col justify-center py-0 pl-6 mx-0 mb-0 -mt-px w-7/12 align-baseline border-0 pr-[4%]"
            >
              <h6
                itemprop="name"
                class="font-serif text-sm font-normal text-black align-baseline break-words border-0"
              >
                <NuxtLink
                  itemprop="url"
                  class="align-baseline border-0 cursor-pointer hover:text-stone-500"
                  :to="`/recette/${recipe.attributes?.slug}`"
                  style="
                    outline: 0px;
                    text-decoration: none;
                    transition: color 0.2s ease-out 0s;
                    background-position: 0px center;
                  "
                >
                  {{ recipe.attributes?.title }}
                </NuxtLink>
              </h6>
              <div
                class="flex justify-between items-center px-0 pt-0 pb-1 mx-0 mt-1 mb-0 align-baseline border-0"
              >
                <div class="align-baseline border-0">
                  <div class="flex items-center align-baseline border-0">
                    <div
                      class="hidden p-0 my-0 mr-4 ml-0 w-12 align-baseline border-0"
                    >
                      <nuxt-link
                        itemprop="url"
                        to="/a-propos"
                        class="block align-baseline border-0 cursor-pointer hover:text-black"
                        style="
                          outline: 0px;
                          text-decoration: none;
                          transition: color 0.2s ease-out 0s;
                          background-position: 0px center;
                        "
                      >
                        <nuxt-img
                          data-del="avatar"
                          src="/img/author.jpg"
                          class="max-w-full h-auto rounded-full leading-6 text-center text-black align-middle cursor-pointer"
                          height="138"
                          width="138"
                        />
                      </nuxt-link>
                    </div>
                    <div class="relative -top-px align-baseline border-0">
                      <nuxt-link
                        itemprop="author"
                        to="/a-propos"
                        class="hidden relative text-xs font-semibold tracking-widest leading-5 text-black uppercase align-baseline border-0 cursor-pointer hover:text-black"
                        style="
                          outline: 0px;
                          text-decoration: none;
                          transition: color 0.2s ease-out 0s;
                          background-position: 0px center;
                        "
                      >
                        Magius
                      </nuxt-link>
                      <p
                        itemprop="dateCreated"
                        class="relative text-xs leading-4 align-baseline border-0 text-neutral-500"
                      >
                        {{
                          new Intl.DateTimeFormat("fr-FR", {
                            dateStyle: "medium",
                          }).format(new Date(recipe.attributes?.publishedAt))
                        }}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </article>
      </div>
    </div>
  </div>
</template>
