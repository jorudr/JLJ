import { contentPages } from '../seo'

const localizedPaths = new Set(['/', ...contentPages.map(page => page.path)])

export function navigateLocale(code, path, router, setLocale) {
  const isRussianPath = path === '/ru/' || path.startsWith('/ru/')
  const basePath = path === '/ru/' ? '/' : isRussianPath ? path.slice(3) : path

  if (localizedPaths.has(basePath)) {
    const target = code === 'ru' ? (basePath === '/' ? '/ru/' : `/ru${basePath}`) : basePath
    if (target !== path) router.push(target)
    else setLocale(code)
    return
  }

  setLocale(code)
}
