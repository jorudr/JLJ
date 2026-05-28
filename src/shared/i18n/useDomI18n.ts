import { nextTick, onMounted, onUnmounted, type Ref, watch } from 'vue'
import { useI18n } from './useI18n'

const textOriginals = new WeakMap<Text, string>()
const attributeOriginals = new WeakMap<Element, Map<string, string>>()
const translatedAttributes = ['placeholder', 'title', 'aria-label', 'alt']

const normalize = (value: string) => value.replace(/\s+/g, ' ').trim()

const buildReverseDictionary = (dictionary: Record<string, unknown>) => {
  const reverse = new Map<string, string>()

  for (const [source, translation] of Object.entries(dictionary)) {
    if (typeof translation === 'string') {
      reverse.set(normalize(translation), source)
    }
  }

  return reverse
}

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

  const resolveOriginal = (value: string, dictionary: Record<string, string>, reverseDictionary: Map<string, string>) => {
    const key = normalize(value)
    if (!key) return ''

    if (dictionary[key] || translateDynamic(key, dictionary)) {
      return value
    }

    const source = locale.value === 'en' ? reverseDictionary.get(key) : ''
    return source ? withOriginalSpacing(value, source) : ''
  }

  const translateTextNode = (node: Text, dictionary: Record<string, string>, reverseDictionary: Map<string, string>) => {
    const currentValue = node.nodeValue || ''
    let original = textOriginals.get(node)

    if (!original) {
      original = resolveOriginal(currentValue, dictionary, reverseDictionary)
      if (!original) return
      textOriginals.set(node, original)
    }

    const key = normalize(original)
    if (!key) return

    const translation = dictionary[key] || translateDynamic(key, dictionary)
    if (!translation) return

    const nextValue = locale.value === 'ru' ? withOriginalSpacing(original, translation) : original
    if (node.nodeValue !== nextValue) node.nodeValue = nextValue
  }

  const translateAttributes = (el: Element, dictionary: Record<string, string>, reverseDictionary: Map<string, string>) => {
    for (const attr of translatedAttributes) {
      if (!el.hasAttribute(attr)) continue

      let originals = attributeOriginals.get(el)
      if (!originals) {
        originals = new Map()
        attributeOriginals.set(el, originals)
      }

      if (!originals.has(attr)) {
        const original = resolveOriginal(el.getAttribute(attr) || '', dictionary, reverseDictionary)
        if (!original) continue
        originals.set(attr, original)
      }

      const original = originals.get(attr) || ''
      const translation = dictionary[normalize(original)]
      if (!translation) continue

      const nextValue = locale.value === 'ru' ? translation : original
      if (el.getAttribute(attr) !== nextValue) el.setAttribute(attr, nextValue)
    }
  }

  const walk = (root: Node, dictionary: Record<string, string>, reverseDictionary: Map<string, string>) => {
    if (root.nodeType === Node.TEXT_NODE) {
      translateTextNode(root as Text, dictionary, reverseDictionary)
      return
    }

    if (root.nodeType !== Node.ELEMENT_NODE && root.nodeType !== Node.DOCUMENT_FRAGMENT_NODE) return

    const element = root as Element
    const tag = element.tagName
    if (['SCRIPT', 'STYLE', 'TEXTAREA', 'INPUT', 'SELECT', 'OPTION'].includes(tag)) {
      translateAttributes(element, dictionary, reverseDictionary)
      return
    }

    translateAttributes(element, dictionary, reverseDictionary)
    root.childNodes.forEach(child => walk(child, dictionary, reverseDictionary))
  }

  const applyTranslations = async () => {
    await nextTick()
    const root = rootRef.value
    if (!root) return

    const dictionary = tm(namespace) as Record<string, string>
    const reverseDictionary = buildReverseDictionary(dictionary || {})
    walk(root, dictionary || {}, reverseDictionary)
    if (options.includeBody && typeof document !== 'undefined') {
      walk(document.body, dictionary || {}, reverseDictionary)
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
