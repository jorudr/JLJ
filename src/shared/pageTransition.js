import { ref } from 'vue'

export const isTransitioning = ref(false)
export const isFadingOut = ref(false)

let isInitialLoadDone = false
let isNavigatingHalfway = false

export function markInitialLoadDone() {
  isInitialLoadDone = true
}

export function isReadyForTransitions() {
  return isInitialLoadDone
}

export function isNavigating() {
  return isNavigatingHalfway
}

export function runPageTransition(navigationFn) {
  const isReduced = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (!isInitialLoadDone || isReduced) {
    navigationFn?.()
    return
  }

  isTransitioning.value = true
  isFadingOut.value = false

  // Phase 1 (Black stripes arrive by 0.81s). Screen is 100% black at 0.82s.
  setTimeout(() => {
    isNavigatingHalfway = true
    navigationFn?.()
    isNavigatingHalfway = false

    if (typeof window !== 'undefined') {
      window.scrollTo(0, 0)
    }

    // Phase 2 (White stripes arrive by 1.71s). Fade out starts at 1.82s.
    setTimeout(() => {
      isFadingOut.value = true

      // Phase 3 (Fade out transition 0.7s complete). Reset state.
      setTimeout(() => {
        isTransitioning.value = false
        isFadingOut.value = false
      }, 720)
    }, 1000)
  }, 820)
}
