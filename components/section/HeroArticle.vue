<script lang="ts" setup></script>

<template>
  <div class="w-full">
    <nuxt-img
      width="1300"
      height="910"
      src="https://easymeals.qodeinteractive.com/wp-content/uploads/2020/05/h3-img-1.jpg"
      class="attachment-full size-full wp-post-image"
      alt="d"
      srcset="
        https://easymeals.qodeinteractive.com/wp-content/uploads/2020/05/h3-img-1.jpg          1300w,
        https://easymeals.qodeinteractive.com/wp-content/uploads/2020/05/h3-img-1-300x210.jpg   300w,
        https://easymeals.qodeinteractive.com/wp-content/uploads/2020/05/h3-img-1-1024x717.jpg 1024w,
        https://easymeals.qodeinteractive.com/wp-content/uploads/2020/05/h3-img-1-768x538.jpg   768w,
        https://easymeals.qodeinteractive.com/wp-content/uploads/2020/05/h3-img-1-600x420.jpg   600w
      "
      sizes="(max-width: 1300px) 100vw, 1300px"
    />
    <div
      class="flex flex-col md:flex-row justify-center items-center py-5 mb-6 leading-6 align-baseline text-stone-500 gap-1"
    >
      <span
        class="w-full h-2 text-xs font-semibold tracking-widest text-black uppercase align-baseline border-solid border-x-0 border-y border-stone-200"
      ></span>
      <div class="flex-[0_0_auto] flex flex-col md:flex-row">
        <slot name="info" />
      </div>

      <span
        class="p-0 my-0 w-full h-2 text-xs font-semibold tracking-widest text-black uppercase align-baseline border-solid border-x-0 border-y border-stone-200"
      ></span>
    </div>
  </div>
</template>
