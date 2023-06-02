<script lang="ts" setup></script>

<template>
  <aside class="w-full lg:w-1/3 space-y-8">
    <div class="w-full h-64"></div>
    <div
      class="w-full flex flex-col gap-4 items-center border border-stone-200"
    >
      <h5 class="uppercase tracking-widest -translate-y-2.5 bg-neutral-100">
        A Propos de moi
      </h5>
      <img
        data-del="avatar"
        src="/img/author.jpg"
        class="max-w-full h-auto rounded-full leading-6 text-center text-black align-middle cursor-pointer"
        height="138"
        width="138"
      />
      <p
        itemprop="description"
        class="p-0 mx-0 mt-0 mb-5 leading-6 text-center align-baseline border-0 text-zinc-600"
      >
        Passioné de cuisine et de voyage qui m'ont conduit dans des marchés
        alimentaires animés en Asie, des cuisines traditionnelles en Europe, des
        scènes de street food vibrantes en Amérique du Sud et des villages
        reculés en Afrique. Je viens partager ces recette que j'ai appris au fil
        des années.
      </p>
      <img
        width="300"
        height="34"
        src="https://easymeals.qodeinteractive.com/wp-content/uploads/2020/05/sidebar-img-2.png"
        class="mb-1 max-w-full h-auto leading-6 text-center align-middle border-none text-stone-500"
        alt=""
        loading="lazy"
      />
    </div>
    <div
      class="pt-5 pb-10 m-0 leading-6 text-center align-baseline border-0 bg-neutral-100 text-stone-500 px-[12%]"
    >
      <h3
        class="p-0 mx-0 mt-6 mb-3 font-serif text-2xl font-normal text-center text-black align-baseline break-words border-0"
        style="outline: 0px; background-position: 0px center"
      >
        Ne Manquer jamais nos prochaine recette
      </h3>
      <p
        class="py-0 mx-0 mt-2 mb-8 text-center align-baseline border-0 px-[12%]"
      >
        Souscrivez à notre newsletter pour recevoir les dernières recettes.
      </p>
      <span
        class="relative p-0 m-0 text-center align-baseline border-0"
        data-name="your-email"
        style="outline: 0px; background-position: 0px center"
        ><input
          type="email"
          name="your-email"
          value=""
          size="40"
          class="inline-block relative py-4 pr-12 pl-6 mx-0 mt-0 mb-5 w-full text-base align-top bg-white rounded-none border border-solid appearance-none cursor-text border-zinc-300 focus:border-black focus:bg-transparent focus:text-black"
          aria-required="true"
          aria-invalid="false"
          placeholder="Your Email*"
          style="
            transition: color 0.2s ease-out 0s,
              background-color 0.2s ease-out 0s, border-color 0.2s ease-out 0s;
            direction: ltr;
          " /></span
      ><button
        type="submit"
        class="inline-block relative py-3 px-10 m-0 w-full font-sans text-xs font-semibold leading-8 text-white uppercase align-middle bg-black rounded-none border border-transparent border-solid cursor-pointer hover:bg-zinc-800 hover:text-white"
        style="
          letter-spacing: 2.4px;
          transition: color 0.2s ease-out 0s, background-color 0.2s ease-out 0s,
            border-color 0.2s ease-out 0s;
        "
      >
        <span
          class="block p-0 m-0 text-center uppercase align-baseline border-0"
          style="letter-spacing: 1.8px"
          >Subscribe</span
        >
      </button>
    </div>

    <RecipeLatest />
  </aside>
</template>
