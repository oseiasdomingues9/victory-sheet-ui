import { computed, type Ref } from 'vue'
import { marked } from 'marked'
import DOMPurify from 'dompurify'

export function useMarkdown(texto: string | undefined) {
  return computed(() => {
    if (!texto) return ''
    const html = marked.parse(texto, { async: false }) as string
    return DOMPurify.sanitize(html)
  })
}