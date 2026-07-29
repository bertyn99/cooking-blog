/** Untyped fetch client — avoids Nitro route literal matching (TS2589). */
export type ApiClient = <T = unknown>(
  url: string,
  opts?: object,
) => Promise<T>

declare module '#app' {
  interface NuxtApp {
    $api: ApiClient
  }
}

declare module 'vue' {
  interface ComponentCustomProperties {
    $api: ApiClient
  }
}

export {}
