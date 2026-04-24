/// <reference lib="dom" />

export type ElementForTag<T extends string> =
    T extends keyof HTMLElementTagNameMap ? HTMLElementTagNameMap[T] : HTMLElement
