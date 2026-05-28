import { nextTick, onMounted, onUnmounted, type Ref, watch } from 'vue'
import { useI18n } from './useI18n'

const textOriginals = new WeakMap<Text, string>()
const attributeOriginals = new WeakMap<Element, Map<string, string>>()
const translatedAttributes = ['placeholder', 'title', 'aria-label', 'alt']

const normalize = (value: string) => value.replace(/\s+/g, ' ').trim()

const translateDynamic = (key: string, dictionary: Record<string, string>) => {
  const fulfilled = key.match(/^(\d+) Fulfilled$/)
  if (fulfilled) return `${fulfilled[1]} ${dictionary.Fulfilled || 'Fulfilled'}`

  const confirmations = key.match(/^(\d+) Confirmations$/)
  if (confirmations) return `${confirmations[1]} ${dictionary.Confirmations || 'Confirmations'}`

  const frictionMarkers = key.match(/^(\d+) Friction Markers$/)
  if (frictionMarkers) return `${frictionMarkers[1]} ${dictionary['Friction Markers'] || 'Friction Markers'}`

  const negativeRules = key.match(/^-(\d+) Rules$/)
  if (negativeRules) return `-${negativeRules[1]} ${dictionary.Rules || 'Rules'}`

  const exceededBy = key.match(/^Exceeded by \$(.+)$/)
  if (exceededBy) return `Превышено на $${exceededBy[1]}`

  const bypassedRules = key.match(/^Bypassed (\d+) Required Rules$/)
  if (bypassedRules) return `Пропущено ${bypassedRules[1]} Обязательных_Правил`

  const belowMin = key.match(/^Below Min \((.+)\)$/)
  if (belowMin) return `Ниже_Минимума (${belowMin[1]})`

  const exceededMax = key.match(/^Exceeded Max \((.+)\)$/)
  if (exceededMax) return `Превышен_Максимум (${exceededMax[1]})`

  const aligned = key.match(/^(.+) Aligned$/)
  if (aligned && dictionary[aligned[1]]) return `${dictionary[aligned[1]]}_Синхронизирован`

  return ''
}

const withOriginalSpacing = (source: string, translation: string) => {
  const leading = source.match(/^\s*/)?.[0] || ''
  const trailing = source.match(/\s*$/)?.[0] || ''
  return `${leading}${translation}${trailing}`
}

export function useDomI18n(rootRef: Ref<HTMLElement | null>, namespace: string, options: { includeBody?: boolean } = {}) {
  const { locale, tm } = useI18n()
  let observer: MutationObserver | null = null

  const translateTextNode = (node: Text, dictionary: Record<string, string>) => {
    if (!textOriginals.has(node)) {
      textOriginals.set(node, node.nodeValue || '')
    }

    const original = textOriginals.get(node) || ''
    const key = normalize(original)
    if (!key) return

    const translation = locale.value === 'ru' ? (dictionary[key] || translateDynamic(key, dictionary)) : ''
    const nextValue = translation ? withOriginalSpacing(original, translation) : original
    if (node.nodeValue !== nextValue) node.nodeValue = nextValue
  }

  const translateAttributes = (el: Element, dictionary: Record<string, string>) => {
    for (const attr of translatedAttributes) {
      if (!el.hasAttribute(attr)) continue

      let originals = attributeOriginals.get(el)
      if (!originals) {
        originals = new Map()
        attributeOriginals.set(el, originals)
      }

      if (!originals.has(attr)) {
        originals.set(attr, el.getAttribute(attr) || '')
      }

      const original = originals.get(attr) || ''
      const translation = locale.value === 'ru' ? dictionary[normalize(original)] : ''
      const nextValue = translation || original
      if (el.getAttribute(attr) !== nextValue) el.setAttribute(attr, nextValue)
    }
  }

  const walk = (root: Node, dictionary: Record<string, string>) => {
    if (root.nodeType === Node.TEXT_NODE) {
      translateTextNode(root as Text, dictionary)
      return
    }

    if (root.nodeType !== Node.ELEMENT_NODE && root.nodeType !== Node.DOCUMENT_FRAGMENT_NODE) return

    const element = root as Element
    const tag = element.tagName
    if (['SCRIPT', 'STYLE', 'TEXTAREA', 'INPUT', 'SELECT', 'OPTION'].includes(tag)) {
      translateAttributes(element, dictionary)
      return
    }

    translateAttributes(element, dictionary)
    root.childNodes.forEach(child => walk(child, dictionary))
  }

  const applyTranslations = async () => {
    await nextTick()
    const root = rootRef.value
    if (!root) return

    const dictionary = tm(namespace) as Record<string, string>
    walk(root, dictionary || {})
    if (options.includeBody && typeof document !== 'undefined') {
      walk(document.body, dictionary || {})
    }
  }

  onMounted(() => {
    applyTranslations()
    const observeRoot = options.includeBody && typeof document !== 'undefined' ? document.body : rootRef.value
    if (!observeRoot || typeof MutationObserver === 'undefined') return

    observer = new MutationObserver(() => applyTranslations())
    observer.observe(observeRoot, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: translatedAttributes
    })
  })

  watch(locale, () => applyTranslations())

  onUnmounted(() => {
    observer?.disconnect()
    observer = null
  })
}
