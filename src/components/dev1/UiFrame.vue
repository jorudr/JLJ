<!--
  One app UI page (public/ui/<n>.html) shown inside the layout, with no window around it.
  The file is used unchanged: its markup and CSS go into a shadow root (its styles never leak out),
  its script runs against that root. The page lays itself out for a browser window, so it is rendered
  at `design` pixels and scaled to the width of the frame.
-->
<template>
  <div ref="box" class="frame" :class="{ 'frame--ink': ink, 'frame--bare': bare }" :style="{ aspectRatio: `${design[0]} / ${height}` }" role="img" :aria-label="title">
    <div ref="stage" class="frame__stage" :style="{ width: `${design[0]}px`, height: `${height}px`, transform: `scale(${scale})` }"></div>
  </div>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'

const props = defineProps({
  src: { type: String, required: true },
  title: { type: String, default: '' },
  design: { type: Array, default: () => [1200, 800] },
  css: { type: String, default: '' },
  // [from, to] string replacements applied to the page's script before it runs.
  patch: { type: Array, default: () => [] },
  // Print the UI on the paper: dark becomes light, blended with multiply.
  ink: { type: Boolean, default: false },
  // No backing colour at all: only what the page itself draws.
  bare: { type: Boolean, default: false },
  // Let the page's own content decide the height instead of a fixed window.
  auto: { type: Boolean, default: false },
  // Called with { shadow, root } once the page has rendered, to rearrange it (retried until it returns true).
  build: { type: Function, default: null },
})

const box = ref(null)
const stage = ref(null)
const scale = ref(1)
const height = ref(props.design[1])
const cleanups = []

// `:root` variables and the page's own html/body rules would match nothing inside a shadow root.
const scopeCss = css => css
  .replace(/:root(?![\w-])/g, ':host')
  .replace(/(^|[},\s])html\s*,\s*body(?=[\s,{])/g, '$1:host, .ui-root')
  .replace(/(^|[},\s])(html|body)(?=[\s,{.:#[>~+])/g, '$1.ui-root')

function scopedDocument(shadow, root) {
  return new Proxy(document, {
    get(target, key) {
      if (key === 'getElementById') return id => shadow.getElementById(id)
      if (key === 'querySelector') return sel => shadow.querySelector(sel)
      if (key === 'querySelectorAll') return sel => shadow.querySelectorAll(sel)
      if (key === 'getElementsByClassName') return name => root.getElementsByClassName(name)
      if (key === 'getElementsByTagName') return name => root.getElementsByTagName(name)
      if (key === 'body' || key === 'documentElement') return root
      if (key === 'activeElement') return shadow.activeElement
      const value = Reflect.get(target, key)
      return typeof value === 'function' ? value.bind(target) : value
    },
  })
}

function scopedWindow(root, doc) {
  return new Proxy(window, {
    get(target, key) {
      if (key === 'innerWidth') return root.clientWidth
      if (key === 'innerHeight') return root.clientHeight
      if (key === 'document') return doc
      if (key === 'addEventListener') {
        return (type, fn, opts) => { target.addEventListener(type, fn, opts); cleanups.push(() => target.removeEventListener(type, fn, opts)) }
      }
      const value = Reflect.get(target, key)
      return typeof value === 'function' ? value.bind(target) : value
    },
  })
}

onMounted(async () => {
  const sizer = new ResizeObserver(() => { scale.value = box.value.clientWidth / props.design[0] })
  sizer.observe(box.value)
  cleanups.push(() => sizer.disconnect())

  const html = await (await fetch(props.src)).text()
  const page = new DOMParser().parseFromString(html, 'text/html')
  const shadow = stage.value.attachShadow({ mode: 'open' })

  const style = document.createElement('style')
  style.textContent = [...page.querySelectorAll('style')].map(s => scopeCss(s.textContent)).join('\n')
    + '\n:host, .ui-root { background: transparent !important; overflow: hidden; }'
    + '\n:host { display: block; container-type: inline-size; } .ui-root { position: relative; width: 100%; height: 100%; margin: 0; }'
    // Printed in ink the page turns light, but the condition and strategy nodes stay black with white text.
    + (props.ink ? '\n.node, .gm-node { filter: invert(1) hue-rotate(180deg); }' : '')
    + (props.auto ? '\n.ui-root { height: auto !important; overflow: visible !important; }' : '')
    + '\n' + props.css
  shadow.appendChild(style)

  const root = document.createElement('div')
  root.className = 'ui-root'
  const scripts = [...page.querySelectorAll('script')].map(s => props.patch.reduce((code, [from, to]) => code.replace(from, to), s.textContent))
  page.querySelectorAll('script').forEach(s => s.remove())
  root.append(...[...page.body.childNodes].map(node => document.importNode(node, true)))
  shadow.appendChild(root)

  const doc = scopedDocument(shadow, root)
  const win = scopedWindow(root, doc)
  for (const code of scripts) {
    // eslint-disable-next-line no-new-func
    try { new Function('document', 'window', code)(doc, win) } catch (error) { console.error(`[ui] ${props.src}:`, error) }
  }
  window.dispatchEvent(new Event('resize'))

  if (props.build) {
    let tries = 0
    const run = () => {
      let done = false
      try { done = props.build({ shadow, root }) } catch (error) { console.error(`[ui] build ${props.src}:`, error); done = true }
      if (!done && tries++ < 20) setTimeout(run, 150)
    }
    setTimeout(run, 100)
  }
  if (props.auto) {
    const measure = () => { height.value = Math.max(200, Math.ceil(root.scrollHeight)) }
    const watcher = new ResizeObserver(measure)
    watcher.observe(root)
    new MutationObserver(measure).observe(root, { childList: true, subtree: true })
    cleanups.push(() => watcher.disconnect())
  }
})

onBeforeUnmount(() => cleanups.forEach(fn => fn()))
</script>

<style scoped>
.frame { position: relative; width: 100%; overflow: hidden; background: #000; }
.frame__stage { position: absolute; top: 0; left: 0; transform-origin: 0 0; }
.frame--ink, .frame--bare { background: transparent; }
.frame--ink .frame__stage { filter: invert(1) hue-rotate(180deg) contrast(1.25); mix-blend-mode: multiply; }
</style>
