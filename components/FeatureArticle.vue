<script lang="ts" setup>
const props = defineProps({ blok: Object });
console.log(props.blok);

const showShareButton = ref(false);
</script>

<template>
  <div
    class="flex relative justify-center items-center p-0 m-0 leading-6 align-baseline bg-white border-0 text-stone-500"
  >
    <div
      class="overflow-hidden relative flex-grow flex-shrink p-0 m-0 align-baseline border-0 basis-1/2"
    >
      <div class="p-0 m-0 align-baseline border-0">
        <NuxtLink
          itemprop="url"
          :to="'blog/' + blok.article.slug"
          class="p-0 m-0 text-black align-baseline border-0 cursor-pointer hover:text-stone-500 transition-colors duration-200 ease-in-out"
          style="
            outline: 0px;

            background-position: 0px center;
            box-shadow: none;
          "
        >
          <img
            width="1300"
            height="914"
            :src="blok.article.content.cover?.filename + '/m/800x0'"
            :alt="blok.article.content.cover?.alt"
            class="max-w-full h-auto align-middle rounded-none will-change-transform"
            alt="d"
            loading="lazy"
            srcset="
              https://easymeals.qodeinteractive.com/wp-content/uploads/2020/05/h4-img-5.jpg          1300w,
              https://easymeals.qodeinteractive.com/wp-content/uploads/2020/05/h4-img-5-300x211.jpg   300w,
              https://easymeals.qodeinteractive.com/wp-content/uploads/2020/05/h4-img-5-1024x720.jpg 1024w,
              https://easymeals.qodeinteractive.com/wp-content/uploads/2020/05/h4-img-5-768x540.jpg   768w,
              https://easymeals.qodeinteractive.com/wp-content/uploads/2020/05/h4-img-5-600x422.jpg   600w
            "
            sizes="(max-width: 1300px) 100vw, 1300px"
            style="
              box-shadow: none;
              transform: scale(1.01);
              transition: transform 0.3s cubic-bezier(0.76, 0.35, 0.32, 0.79) 0s,
                -webkit-transform 0.3s cubic-bezier(0.76, 0.35, 0.32, 0.79) 0s;
            "
          />
        </NuxtLink>
      </div>
      <span
        class="absolute top-0 left-0 py-1 px-2 m-0 text-xs font-semibold tracking-widest uppercase align-baseline bg-amber-200 border-0 text-zinc-800"
        ><span
          class="relative p-0 my-0 mr-2 ml-0 text-lg not-italic font-normal tracking-wider leading-none normal-case align-baseline border-0"
          style="
            outline: 0px;
            background-position: 0px center;
            font-family: Linearicons-Free;
            speak: none;
            font-variant: normal;
            top: 3px;
          "
        ></span
        >video</span
      >
    </div>
    <div
      class="flex flex-col flex-grow flex-shrink justify-center py-0 m-0 w-7/12 align-baseline border-0 basis-1/2"
      style="
        outline: 0px;
        background-position: 0px center;
        padding-right: 4%;
        padding-left: 4%;
      "
    >
      <div class="flex items-center p-0 m-0 align-baseline border-0">
        <p
          class="p-0 mt-0 mr-4 mb-2 ml-0 text-xs font-semibold tracking-widest text-black uppercase align-baseline border-0"
        >
          <span
            class="inline-block p-0 mx-0 mt-px mb-0 h-4 text-sm not-italic font-normal tracking-wider leading-none normal-case align-top border-0"
            style="
              outline: 0px;
              background-position: 0px center;
              font-family: Linearicons-Free;
              speak: none;
              font-variant: normal;
            "
          ></span>
          0:38
        </p>
        <div
          class="p-0 mt-0 mr-4 mb-2 ml-0 text-xs font-semibold tracking-widest text-black uppercase align-baseline border-0"
        >
          <span
            class="inline-block p-0 mx-0 mt-px mb-0 h-4 text-sm not-italic font-normal tracking-wider leading-none normal-case align-top border-0"
            style="
              outline: 0px;
              background-position: 0px center;
              font-family: Linearicons-Free;
              speak: none;
              font-variant: normal;
            "
          ></span>
          <NuxtLink
            itemprop="url"
            class="p-0 m-0 leading-5 uppercase align-baseline border-0 cursor-pointer hover:text-stone-500 shadow-none transition-colors duration-200 ease-in-out"
            to="https://easymeals.qodeinteractive.com/recipe-category/waffles/"
            style="background-position: 0px center"
          >
            Waffles
          </NuxtLink>
        </div>
      </div>
      <h2
        itemprop="name"
        class="p-0 m-0 font-serif text-4xl font-normal leading-5 text-black align-baseline break-words border-0"
      >
        <NuxtLink
          itemprop="url"
          class="p-0 m-0 align-baseline border-0 cursor-pointer hover:text-stone-500 shadow-none transition-colors duration-200 ease-in-out capitalize"
          href="https://easymeals.qodeinteractive.com/recipe/perfect-homemade-waffles/"
        >
          {{ blok.article.content.title }}
        </NuxtLink>
      </h2>
      <p
        itemprop="description"
        class="py-0 pl-0 my-2 mx-0 align-baseline border-0"
        style="
          outline: 0px;
          background-position: 0px center;
          padding-right: 16%;
        "
      >
        {{ blok.article.content.description }}
      </p>
      <div
        class="flex justify-between items-center px-0 pt-0 pb-1 mx-0 mt-5 mb-0 align-baseline border-0"
      >
        <div class="p-0 m-0 align-baseline border-0">
          <div class="flex items-center p-0 m-0 align-baseline border-0">
            <div class="p-0 my-0 mr-4 ml-0 w-12 align-baseline border-0">
              <a
                itemprop="url"
                href="https://easymeals.qodeinteractive.com/author/taylor-kinny/"
                class="block p-0 m-0 text-black align-baseline border-0 cursor-pointer hover:text-stone-500 shadow-none transition-colors duration-200 ease-in-out"
              >
                <img
                  data-del="avatar"
                  src="https://easymeals.qodeinteractive.com/wp-content/uploads/2020/05/Untitled-2-100x100.png"
                  class="w-full max-w-full h-auto align-middle"
                  height="48"
                  width="48"
                  style="border-radius: 50%; box-shadow: none"
                />
              </a>
            </div>
            <div class="relative -top-px p-0 m-0 align-baseline border-0">
              <NuxtLink
                itemprop="author"
                class="block relative p-0 m-0 text-xs font-semibold tracking-widest leading-5 text-black uppercase align-baseline border-0 cursor-pointer hover:text-stone-500 shadow-none transition-colors duration-200 ease-in-out"
                href="https://easymeals.qodeinteractive.com/author/taylor-kinny/"
              >
                Taylor Kinny
              </NuxtLink>
              <datetime
                itemprop="dateCreated"
                class="relative p-0 m-0 text-xs leading-4 align-baseline border-0 text-neutral-500"
              >
                May 13, 2020
              </datetime>
            </div>
          </div>
        </div>
        <div class="flex items-center align-baseline">
          <div class="inline-block relative align-bottom">
            <button
              class="inline-flex justify-center p-2 items-center text-stone-500 align-baseline border border-stone-300 rounded-full cursor-pointer hover:text-black shadow-none transition-colors duration-200 ease-in-out"
              @click="showShareButton = !showShareButton"
            >
              <Icon name="heroicons:share" class="h-5 w-5" />
            </button>
            <div
              v-show="showShareButton"
              class="absolute top-10 -left-1 w-10 m-0 align-baseline border border-stone-500 shadow z-10"
            >
              <ul class="relative p-0 m-0 text-black overflow-hidden">
                <li
                  class="p-0 m-0 w-10 leading-10 text-center align-top border-t border-solid border-stone-100"
                >
                  <NuxtLink
                    itemprop="url"
                    class="p-0 m-0 text-xl align-baseline cursor-pointer hover:text-stone-500 transition-all duration-200 ease-out"
                    href="#"
                    onclick="window.open('https://m.facebook.com/sharer.php?u=https%3A%2F%2Feasymeals.qodeinteractive.com%2Frecipe%2Fperfect-homemade-waffles%2F');"
                  >
                    <Icon name="mdi:facebook" class="h-6 w-6 text-blue-500" />
                  </NuxtLink>
                </li>
                <li
                  class="overflow-hidden p-0 m-0 w-10 h-10 leading-10 text-center align-top border-t border-solid border-x border-stone-200"
                >
                  <NuxtLink
                    itemprop="url"
                    class="p-0 m-0 text-xl align-baseline cursor-pointer hover:text-stone-500 transition-all duration-200 ease-out"
                    href="#"
                    onclick="window.open('https://twitter.com/intent/tweet?text=Lorem+ipsum+dolor+sit+amet%2C+consectetuipisicing+elit%2C+sed+do+eiusmod+tempor+incididunt+ut++via+%40QodeInteractivehttps://easymeals.qodeinteractive.com/recipe/perfect-homemade-waffles/', 'popupwindow', 'scrollbars=yes,width=800,height=400');"
                  >
                    <Icon
                      name="mdi:twitter-circle"
                      class="h-6 w-6 text-blue-400"
                    />
                  </NuxtLink>
                </li>
                <li
                  class="overflow-hidden p-0 m-0 w-10 h-10 leading-10 text-center align-top border-t border-solid border-x border-stone-200"
                >
                  <NuxtLink
                    itemprop="url"
                    class="p-0 m-0 text-xl align-baseline cursor-pointer hover:text-stone-500 transition-all duration-200 ease-out"
                    to="#"
                    onclick="popUp=window.open('https://linkedin.com/shareArticle?mini=true&amp;url=https%3A%2F%2Feasymeals.qodeinteractive.com%2Frecipe%2Fperfect-homemade-waffles%2F&amp;title=Perfect+homemade+waffles', 'popupwindow', 'scrollbars=yes,width=800,height=400');popUp.focus();return false;"
                  >
                    <Icon
                      name="entypo-social:linkedin-with-circle"
                      class="h-6 w-6 text-blue-500"
                    ></Icon>
                  </NuxtLink>
                </li>
                <li
                  class="overflow-hidden p-0 m-0 w-10 h-10 leading-10 text-center align-top border-solid border-x border-y border-stone-200"
                >
                  <NuxtLink
                    itemprop="url"
                    class="cursor-pointer hover:text-stone-500 transition-all duration-200 ease-out"
                    href="#"
                    onclick="popUp=window.open('https://pinterest.com/pin/create/button/?url=https%3A%2F%2Feasymeals.qodeinteractive.com%2Frecipe%2Fperfect-homemade-waffles%2F&amp;description=Perfect+homemade+waffles&amp;media=https%3A%2F%2Feasymeals.qodeinteractive.com%2Fwp-content%2Fuploads%2F2020%2F05%2Fh4-img-5.jpg', 'popupwindow', 'scrollbars=yes,width=800,height=400');popUp.focus();return false;"
                  >
                    <Icon
                      name="mdi:pinterest"
                      class="h-6 w-6 text-red-400"
                    ></Icon>
                  </NuxtLink>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
