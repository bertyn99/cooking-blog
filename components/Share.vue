<script lang="ts" setup>
defineProps({
  date: {
    type: String,
    required: true,
  },
  link: {
    type: String,
    required: true,
  },
});
</script>

<template>
  <div
    class="flex flex-wrap divide-y md:divide-y-0 md:divide-x py-1 items-center gap-6"
  >
    <div class="flex gap-2">
      <img
        data-del="avatar"
        src="https://easymeals.qodeinteractive.com/wp-content/uploads/2020/05/Untitled-2-100x100.png"
        class="max-w-full h-auto leading-6 text-black align-middle cursor-pointer rounded-full"
        height="48"
        width="48"
      />
      <div class="flex flex-col">
        <NuxtLink
          itemprop="author"
          class="relative p-0 m-0 text-xs font-semibold tracking-widest leading-6 text-black uppercase align-baseline border-0 cursor-pointer hover:text-stone-500"
          href="https://easymeals.qodeinteractive.com/author/taylor-kinny/"
          style="transition: color 0.2s ease-out 0s; top: 2px"
        >
          Taylor Kinny
        </NuxtLink>

        <datetime
          itemprop="dateCreated"
          class="relative p-0 m-0 text-xs leading-6 align-baseline border-0 text-stone-500"
        >
          {{ date }}
        </datetime>
      </div>
    </div>
    <div
      class="py-3 md:py-0 flex-1 flex flex-wrap gap-2 items-center px-2 md:px-5"
    >
      <span>SHARE:</span>
      <div class="flex">
        <NuxtLink
          :to="`https://www.facebook.com/share.php?u=${link}`"
          class="text-white bg-blue-500 px-6 py-1"
        >
          <Icon name="akar-icons:facebook-fill" class="h-5 w-5" />
        </NuxtLink>
        <NuxtLink
          :to="`https://www.twitter.com/share?&url=${link}`"
          class="text-white bg-sky-400 px-6 py-1"
        >
          <Icon name="akar-icons:twitter-fill" class="h-5 w-5" />
        </NuxtLink>
        <NuxtLink class="text-white bg-pink-500 px-6 py-1">
          <Icon name="akar-icons:instagram-fill" class="h-5 w-5" />
        </NuxtLink>
        <NuxtLink
          :to="`https://pinterest.com/pin/create/button/?url=${link}`"
          class="text-white bg-red-500 px-6 py-1"
        >
          <Icon name="akar-icons:pinterest-fill" class="h-5 w-5" />
        </NuxtLink>
      </div>
    </div>
  </div>
</template>
