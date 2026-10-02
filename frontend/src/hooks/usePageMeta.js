import { useEffect } from 'react'

export function setMeta({ title, description, image, url }) {
  const setProp = (attr, name, value) => {
    let el = document.head.querySelector(`meta[${attr}="${name}"]`)
    if (!el) {
      el = document.createElement('meta')
      el.setAttribute(attr, name)
      document.head.appendChild(el)
    }
    el.setAttribute('content', value)
  }
  const finalTitle = title || 'OWERU Foundation | Outreach Equipment Funding'
  document.title = finalTitle
  setProp('property', 'og:title', finalTitle)
  setProp('name', 'twitter:title', finalTitle)
  if (description) {
    setProp('property', 'og:description', description)
    setProp('name', 'twitter:description', description)
    setProp('name', 'description', description)
  }
  if (image) {
    setProp('property', 'og:image', image)
    setProp('name', 'twitter:image', image)
  }
  if (url) {
    setProp('property', 'og:url', url)
    const canonical = document.head.querySelector('link[rel="canonical"]')
    if (canonical) canonical.setAttribute('href', url)
  }
}

// Kurasa muhimu zinaita hii kwenye render; itasasisha SEO/OG dynamically.
export function usePageMeta(meta) {
  useEffect(() => {
    setMeta(meta)
  }, [meta.title, meta.description, meta.image, meta.url])
}