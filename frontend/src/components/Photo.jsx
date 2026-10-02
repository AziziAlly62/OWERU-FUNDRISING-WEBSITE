import { useState } from 'react'

// ====== Photo resolver: picha halisi "pluggable" ======
// Weka picha halisi kwenye frontend/public/photos/<name>.jpg (au .png/.webp)
// kisha pita name kwenye <Photo name="...">. Ikikosekana, inarudi kwenye
// fallback src (Unsplash). Unaweza kutambua request kwa id/service.

export function photoUrl(name) {
  if (!name) return null
  return `/photos/${name}`
}

export default function Photo({ name, src, alt = '', className, ...rest }) {
  const [failed, setFailed] = useState(false)
  const current = name && !failed ? photoUrl(name) : src
  return (
    <img
      src={current}
      alt={alt}
      className={className}
      loading="lazy"
      onError={() => setFailed(true)}
      {...rest}
    />
  )
}