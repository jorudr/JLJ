import { onBeforeUnmount, onMounted, watch } from 'vue'
import { translations } from './i18n/translations'
import { useI18n } from './i18n/useI18n'

const normalize = (value) => value.replace(/\s+/g, ' ').trim()

function collectTranslations(english, russian, result) {
  if (typeof english === 'string' && typeof russian === 'string') {
    result.set(normalize(english), russian)
    return
  }
  if (!english || !russian || typeof english !== 'object') return
  for (const key of Object.keys(english)) {
    collectTranslations(english[key], russian[key], result)
  }
}

const russianCopy = new Map()
collectTranslations(translations.en, translations.ru, russianCopy)
russianCopy.set('J.L.JÖRMUNGANDR', 'Дж. Л. Ёрмунганд')
russianCopy.set('J.L.Jörmungandr', 'Дж. Л. Ёрмунганд')
russianCopy.set('Telegram', 'Телеграм')

// A typographic preview of pre-1918 Russian orthography. The spelling rules
// here cover the visible transition; the site's existing copy remains final.
function oldOrthography(value) {
  return value
    .replace(/(?<!\p{L})(все|всех|всем|место|места|дело|дела|цена|цены|цен|день|дней|человек|человека|свет|света)(?!\p{L})/giu, (word) => {
      const lower = word.toLowerCase()
      const changed = lower.replace(/^все/, 'всѣ').replace(/^мест/, 'мѣст').replace(/^дел/, 'дѣл')
        .replace(/^цен/, 'цѣн').replace(/^день/, 'дѣнь').replace(/^дней/, 'днѣй')
        .replace(/^челове/, 'человѣ').replace(/^свет/, 'свѣт')
      return word[0] === word[0].toUpperCase() ? changed[0].toUpperCase() + changed.slice(1) : changed
    })
    .replace(/и(?=[аеёиоуыэюяй])/giu, (letter) => letter === 'И' ? 'І' : 'і')
    .replace(/([бвгджзклмнпрстфхцчшщ])(?=$|[^\p{L}])/giu, (letter) => letter === letter.toUpperCase() ? `${letter}Ъ` : `${letter}ъ`)
}

function imperialCopy(target, locale) {
  const trimmed = normalize(target)
  if (!trimmed || !/\p{L}/u.test(trimmed)) return null
  const suffix = trimmed.match(/\s*[↗↓→]+$/)?.[0] || ''
  const baseTranslation = suffix ? russianCopy.get(trimmed.slice(0, -suffix.length)) : null
  const russian = locale === 'ru' ? trimmed : russianCopy.get(trimmed) ||
    (baseTranslation ? `${baseTranslation}${suffix}` : null)
  if (!russian) return null
  const old = oldOrthography(russian)
  if (old === target) return null
  const leading = target.match(/^\s*/)?.[0] || ''
  const trailing = target.match(/\s*$/)?.[0] || ''
  return `${leading}${old}${trailing}`
}

export function useImperialReveal(rootRef) {
  const { locale } = useI18n()
  const states = new Map()
  let observer
  let revealStartsAt = 0

  const excluded = (element) => element?.closest(
    '.hero-tagline, .app-footer__language, .mobile-menu__language, [data-no-imperial], [aria-hidden="true"], script, style, svg, noscript, textarea, select, option'
  )

  function finish(state) {
    if (state.frame) cancelAnimationFrame(state.frame)
    state.frame = 0
    state.current = state.target
    if (state.node.nodeValue !== state.target) state.node.nodeValue = state.target
    state.done = true
  }

  function animate(state) {
    if (state.frame || state.done) return
    // Every fragment shares the page's two-second introductory pause.
    state.startedAt = revealStartsAt
    const length = Math.max(Array.from(state.source).length, Array.from(state.target).length)
    const duration = Math.min(2600, Math.max(420, length * 24))
    const source = Array.from(state.source)
    const target = Array.from(state.target)

    function tick(now) {
      if (!states.has(state.node)) return
      const count = Math.max(0, Math.min(length, Math.floor((now - state.startedAt) / duration * length)))
      state.current = target.slice(0, count).join('') + source.slice(count).join('')
      if (state.node.nodeValue !== state.current) state.node.nodeValue = state.current
      if (count >= length) {
        state.frame = 0
        state.done = true
      } else {
        state.frame = requestAnimationFrame(tick)
      }
    }
    state.frame = requestAnimationFrame(tick)
  }

  function track(node) {
    const element = node.parentElement
    if (!element || excluded(element)) return
    const target = node.nodeValue || ''
    const existing = states.get(node)
    if (existing && target === existing.current) return
    if (existing?.frame) cancelAnimationFrame(existing.frame)
    if (existing) {
      existing.frame = 0
      existing.done = false
    }
    const source = imperialCopy(target, locale.value)
    if (!source || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      if (existing) {
        existing.target = target
        existing.current = target
        existing.done = true
      }
      return
    }
    const state = existing || { node, element, frame: 0, done: false }
    state.source = source
    state.target = target
    state.current = source
    states.set(node, state)
    node.nodeValue = source
    animate(state)
  }

  function scan(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      track(node)
    } else if (node.nodeType === Node.ELEMENT_NODE && !excluded(node)) {
      for (const child of node.childNodes) scan(child)
    }
  }

  function untrack(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      const state = states.get(node)
      if (!state) return
      if (state.frame) cancelAnimationFrame(state.frame)
      states.delete(node)
    } else {
      for (const child of node.childNodes) untrack(child)
    }
  }

  onMounted(() => {
    const root = rootRef.value
    if (!root) return
    revealStartsAt = performance.now() + 2000
    observer = new MutationObserver((changes) => {
      for (const change of changes) {
        if (change.type === 'characterData') scan(change.target)
        else {
          for (const node of change.removedNodes) untrack(node)
          for (const node of change.addedNodes) scan(node)
        }
      }
    })
    observer.observe(root, { childList: true, subtree: true, characterData: true })
    scan(root)
  })

  watch(locale, () => {
    // Vue updates the translated text after this watcher; MutationObserver
    // catches those new values. Finish the old language's active animations.
    for (const state of states.values()) finish(state)
    revealStartsAt = performance.now() + 2000
  })

  onBeforeUnmount(() => {
    observer?.disconnect()
    for (const state of states.values()) finish(state)
    states.clear()
  })
}
