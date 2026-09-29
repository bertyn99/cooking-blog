import type { InjectionKey } from 'vue'

export interface JdcMediaPickCurrent {
  src?: string
  alt?: string
}

export interface JdcMediaPickResult {
  src: string
  alt?: string
}

export interface JdcMediaPickerApi {
  pick: (current?: JdcMediaPickCurrent) => Promise<JdcMediaPickResult | null>
  preview: (src: string) => string
}

export const JdcMediaPickerKey: InjectionKey<JdcMediaPickerApi> = Symbol('jdcMediaPicker')
