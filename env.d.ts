// src/env.d.ts (ou vite-env.d.ts)
/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefaultComponent } from 'vue'
  const component: DefaultComponent
  export default component
}