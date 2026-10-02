// ===== OWERU share-card generator =====
// Draws a 1200x630 social card (campaign image + overlay + title + progress)
// on a canvas and returns it as a Blob so the user can download/share it.

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath()
  if (ctx.roundRect) { ctx.roundRect(x, y, w, h, r) }
  else {
    ctx.moveTo(x + r, y)
    ctx.arcTo(x + w, y, x + w, y + h, r)
    ctx.arcTo(x + w, y + h, x, y + h, r)
    ctx.arcTo(x, y + h, x, y, r)
    ctx.arcTo(x, y, x + w, y, r)
    ctx.closePath()
  }
}

function wrapText(ctx, text, maxWidth, maxLines) {
  const words = String(text).split(/\s+/)
  const lines = []
  let line = ''
  for (const word of words) {
    const test = line ? line + ' ' + word : word
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line)
      line = word
    } else {
      line = test
    }
    if (lines.length === maxLines - 1 && line) break
  }
  if (line && lines.length < maxLines) lines.push(line)
  return lines
}

export function drawShareCard({ title, subtitle = '', progressPct = 0, raised = 0, target = 0, imageSrc, url, brand = 'OWERU' }) {
  return new Promise((resolve) => {
    const w = 1200
    const h = 630
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')

    const finalize = () => {
      try {
        canvas.toBlob((b) => resolve({ blob: b, canvas }), 'image/png')
      } catch {
        resolve({ blob: null, canvas })
      }
    }

    const draw = (img) => {
      // Background
      if (img) ctx.drawImage(img, 0, 0, w, h)
      else {
        const bg = ctx.createLinearGradient(0, 0, 0, h)
        bg.addColorStop(0, 'var(--color-ink-950)')
        bg.addColorStop(1, 'var(--color-ink-800)')
        ctx.fillStyle = bg
        ctx.fillRect(0, 0, w, h)
      }

      // Overlay for text legibility
      const grad = ctx.createLinearGradient(0, h * 0.35, 0, h)
      grad.addColorStop(0, 'rgba(11,17,32,0.15)')
      grad.addColorStop(1, 'rgba(11,17,32,0.94)')
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, w, h)

      const pad = 60

      // Brand bar
      ctx.fillStyle = 'var(--color-gold-500)'
      rr(ctx, pad, 52, 26, 8, 4); ctx.fill()
      ctx.fillStyle = 'var(--color-ink-50)'
      ctx.font = '800 40px Inter, Arial, sans-serif'
      ctx.fillText(brand, pad + 44, 72)

      // Title (wrap up to 2 lines)
      ctx.fillStyle = '#ffffff'
      ctx.font = '700 58px Inter, Arial, sans-serif'
      const lines = wrapText(ctx, title, w - pad * 2, 2)
      let ty = 250
      lines.forEach((ln) => { ctx.fillText(ln, pad, ty); ty += 70 })

      // Progress bar
      const bw = w - pad * 2
      const by = 372
      rr(ctx, pad, by, bw, 18, 9)
      ctx.fillStyle = 'rgba(255,255,255,0.22)'
      ctx.fill()
      const pct = Math.max(0, Math.min(100, Number(progressPct) || 0))
      if (pct > 0) {
        rr(ctx, pad, by, (bw * pct) / 100, 18, 9)
        ctx.fillStyle = 'var(--color-gold-500)'
        ctx.fill()
      }

      // Stats line
      ctx.fillStyle = 'var(--color-ink-100)'
      ctx.font = '600 30px Inter, Arial, sans-serif'
      ctx.fillText(`${pct.toFixed(pct < 10 ? 1 : 0)}% funded`, pad, by + 66)
      if (target > 0) {
        const short = (n) => {
          const s = Math.round(Number(n) || 0)
          return s >= 1000000
            ? (s / 1000000).toFixed(s % 1000000 ? 1 : 0) + 'M'
            : s >= 1000 ? (s / 1000).toFixed(s % 1000 ? 1 : 0) + 'K' : String(s)
        }
        ctx.fillStyle = 'var(--color-ink-400)'
        ctx.font = '500 26px Inter, Arial, sans-serif'
        ctx.fillText(`of ${short(target)} goal`, pad + 220, by + 66)
      }

      // URL footer
      ctx.fillStyle = 'rgba(226,232,240,0.85)'
      ctx.font = '500 26px Inter, Arial, sans-serif'
      const urlLine = (url || '').replace(/^https?:\/\//, '')
      ctx.fillText(urlLine ? urlLine : 'oweru.org', pad, h - 48)

      finalize()
    }

    if (imageSrc) {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => draw(img)
      img.onerror = () => draw(null)
      img.src = imageSrc
    } else {
      draw(null)
    }
  })
}

export function downloadBlob(blob, filename) {
  if (!blob) return
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(a.href), 4000)
}