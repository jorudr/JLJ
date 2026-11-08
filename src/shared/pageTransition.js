import { ref, computed, nextTick } from 'vue'

export const isTransitioning = ref(false)
export const transitionPhase = ref('idle') // 'black' | 'white' | 'fade' | 'idle'
export const transitionKey = ref(0)
export const isFadingOut = computed(() => transitionPhase.value === 'fade')

let isInitialLoadDone = false
let isNavigatingHalfway = false
let currentTransitionId = 0

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

export function markInitialLoadDone() {
  isInitialLoadDone = true
}

export function isReadyForTransitions() {
  return isInitialLoadDone
}

export function isNavigating() {
  return isNavigatingHalfway
}

export async function runPageTransition(navigationFn) {
  const isReduced = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (isReduced) {
    navigationFn?.()
    return
  }

  // Dismiss initial loader if it is still present in DOM
  if (typeof document !== 'undefined') {
    const appLoader = document.getElementById('app-loader')
    if (appLoader) {
      appLoader.remove()
      markInitialLoadDone()
    }
  }

  const myId = ++currentTransitionId
  transitionKey.value++
  isTransitioning.value = true
  transitionPhase.value = 'black'

  // Phase 1: 5 black bars cascade across the screen (0.20s max stagger + 0.40s duration = 0.60s + 40ms hold)
  await sleep(640)
  if (myId !== currentTransitionId) return

  // Midpoint: switch the route behind the solid black shield
  isNavigatingHalfway = true
  try {
    navigationFn?.()
  } finally {
    isNavigatingHalfway = false
  }

  if (typeof window !== 'undefined') {
    window.scrollTo(0, 0)
  }

  // Wait for Vue to update the DOM and the browser to paint the new view behind the black shield
  await nextTick()
  await new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(resolve)
    })
  })
  if (myId !== currentTransitionId) return

  // Phase 2: 5 white bars cascade across the screen (JS thread is now completely idle => 60/120fps)
  transitionPhase.value = 'white'
  await sleep(640)
  if (myId !== currentTransitionId) return

  // Phase 3: Screen is 100% white, smoothly fade out to reveal the rendered destination page
  transitionPhase.value = 'fade'
  await sleep(550)
  if (myId !== currentTransitionId) return

  isTransitioning.value = false
  transitionPhase.value = 'idle'
}
