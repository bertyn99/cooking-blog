import mermaid from 'mermaid'


declare module '#app' {
    interface NuxtApp {
        $mermaid: typeof mermaid
    }
}