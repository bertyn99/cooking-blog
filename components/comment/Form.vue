<script lang="ts" setup></script>

<template>
  <section class="space-y-6 my-8">
    <h3
      class="flex items-center p-0 m-0 font-serif text-2xl font-normal leading-6 text-black align-baseline break-words border-0"
    >
      Laisser un avis
      <span
        class="ml-4 p-0 my-0 w-3/5 h-2 text-xs font-semibold tracking-widest text-black uppercase align-baseline border-solid border-x-0 border-y border-stone-200"
      ></span>
    </h3>

    <div>
      <p
        class="p-0 mx-0 mt-1 mb-0 leading-6 align-baseline border-0 text-stone-500"
      >
        Votre adresse électronique ne sera pas publiée. Les champs obligatoires
        sont marqués *
      </p>
      <div
        class="flex leading-6 align-baseline border-0 basis-1/2 text-stone-500"
      >
        <label
          class="block p-0 my-0 mr-2 ml-0 align-baseline border-0 cursor-default"
          >Rating</label
        >
        <div class="flex align-baseline">
          <Icon
            v-for="star in 5"
            :key="star"
            name="heroicons:star"
            class="block h-5 w-5 text-sm text-amber-200 cursor-pointer hover:fill-current"
            :data-value="star"
          />
        </div>
      </div>
      <div class="mt-2">
        <textarea
          id="comment"
          name="comment"
          placeholder="Votre commentaire *"
          cols="45"
          rows="8"
          maxlength="65525"
          required="required"
          class="inline-block relative py-4 px-6 mx-0 mt-0 mb-5 w-full text-base leading-6 align-top whitespace-pre-wrap break-words bg-transparent rounded-none border border-solid appearance-none cursor-text border-zinc-300 text-stone-500 focus:border-black focus:bg-transparent focus:text-black"
          data-last-active-input=""
          style="
            outline: 0px;
            transition: color 0.2s ease-out 0s,
              background-color 0.2s ease-out 0s, border-color 0.2s ease-out 0s;
          "
        ></textarea>
      </div>
      <div class="flex gap-8">
        <input
          id="author"
          name="author"
          type="text"
          placeholder="Ton Nom *"
          value=""
          size="30"
          maxlength="245"
          required="required"
          class="inline-block relative py-4 px-6 mx-0 mt-0 mb-5 w-full text-base leading-6 align-top bg-transparent rounded-none border border-solid appearance-none cursor-text border-zinc-300 text-stone-500 focus:border-black focus:bg-transparent focus:text-black"
          data-last-active-input=""
          style="
            outline: 0px;
            transition: color 0.2s ease-out 0s,
              background-color 0.2s ease-out 0s, border-color 0.2s ease-out 0s;
          "
        /><input
          id="email"
          name="email"
          type="email"
          placeholder="Ton Email *"
          value=""
          size="30"
          maxlength="100"
          aria-describedby="email-notes"
          required="required"
          class="inline-block relative py-4 px-6 mx-0 mt-0 mb-5 w-full text-base leading-6 align-top bg-transparent rounded-none border border-solid appearance-none cursor-text border-zinc-300 text-stone-500 focus:border-black focus:bg-transparent focus:text-black"
          style="
            outline: 0px;
            transition: color 0.2s ease-out 0s,
              background-color 0.2s ease-out 0s, border-color 0.2s ease-out 0s;
          "
        />
      </div>
      <p
        class="flex relative items-center p-0 mx-0 mt-0 mb-5 leading-6 align-baseline border-0 text-stone-500"
        style="outline: 0px; background-position: 0px center"
      >
        <input
          name="consent"
          type="checkbox"
          value="yes"
          class="flex-shrink-0 m-0 font-sans text-sm text-black cursor-default"
        />
        <label
          for="wp-comment-cookies-consent"
          class="block p-0 my-0 mr-0 ml-2 align-baseline border-0 cursor-default"
          style="outline: 0px; background-position: 0px center"
          >Enregistrez mon nom, mon adresse email pour la prochaine fois que
          j'écrirai un commentaire.</label
        >
      </p>
    </div>
  </section>
</template>
