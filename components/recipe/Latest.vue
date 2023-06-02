<script lang="ts" setup>
const { find } = useStrapi();

const { data: recipes } = useAsyncData("lates-recipes", () => {
  return find("recipes?sort[0]=id%3Adesc&pagination[pageSize]=3&populate=*");
});

console.log(recipes);
</script>

<template>
  <div
    id="easymeals_core_recipe_list-2"
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
      data-options='{"plugin":"easymeals_core","module":"plugins\/recipe\/post-types\/recipe\/shortcodes","shortcode":"recipe-list","post_type":"recipe","next_page":"2","max_pages_num":5,"behavior":"columns","images_proportion":"medium","custom_image_width":"113","custom_image_height":"80","columns":"1","columns_responsive":"predefined","columns_1440":"3","columns_1366":"3","columns_1024":"3","columns_768":"3","columns_680":"3","columns_480":"3","space":"small","posts_per_page":"3","orderby":"date","order":"DESC","additional_params":"tax","tax":"recipe-category","tax_slug":"new","layout":"info-on-right","title_tag":"h6","custom_padding":"no","enable_top_info":"no","enable_categories":"no","enable_author_date":"yes","enable_share":"no","enable_like":"no","enable_bookmark":"no","enable_excerpt":"no","white_bg":"no","tags_column":"no","hover_type":"zoom","appear_effect":"no","zoom_out_effect":"no","pagination_type":"no-pagination","info_below_enable_button":"no","info_below_hide_image":"no","info_right_image_layout":"no","object_class_name":"EasyMealsCoreRecipeListShortcode","taxonomy_filter":"recipe-category","additional_query_args":{"tax_query":[{"taxonomy":"recipe-category","field":"slug","terms":"new"}]},"unique":"2","space_value":10}'
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
                      <a
                        itemprop="url"
                        href="https://easymeals.qodeinteractive.com/author/laura-dern/"
                        class="block align-baseline border-0 cursor-pointer hover:text-black"
                        style="
                          outline: 0px;
                          text-decoration: none;
                          transition: color 0.2s ease-out 0s;
                          background-position: 0px center;
                        "
                      >
                        <img
                          data-del="avatar"
                          src="https://easymeals.qodeinteractive.com/wp-content/uploads/2020/05/author-img-2-100x100.png"
                          class="w-full max-w-full h-auto align-middle"
                          height="48"
                          width="48"
                          style="border-radius: 50%"
                        />
                      </a>
                    </div>
                    <div class="relative -top-px align-baseline border-0">
                      <a
                        itemprop="author"
                        class="hidden relative text-xs font-semibold tracking-widest leading-5 text-black uppercase align-baseline border-0 cursor-pointer hover:text-black"
                        href="https://easymeals.qodeinteractive.com/author/laura-dern/"
                        style="
                          outline: 0px;
                          text-decoration: none;
                          transition: color 0.2s ease-out 0s;
                          background-position: 0px center;
                        "
                      >
                        Magius
                      </a>
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
