/** ===== Button =====
 *  One button system for the whole product.
 *
 *  Variant
 *    gold    — the giving action (default). Dark text on gold.
 *    forest  — confirmed / safe / "go" actions.
 *    outline — secondary.
 *    ghost   — tertiary, no chrome.
 *    danger  — destructive.
 *
 *  Size  sm | md | lg   ·   Shape always a 10px radius, never a pill.
 *  Renders <Link> when `to` is given, <a> when `href` is given.
 */

import { Link } from 'react-router-dom'

const VARIANT = {
  gold:
    'bg-gold-500 text-ink-950 border border-gold-500 hover:bg-gold-400 hover:border-gold-400 hover:text-ink-950',
  forest:
    'bg-oweru-800 text-white border border-oweru-800 hover:bg-oweru-700 hover:border-oweru-700 hover:text-white',
  outline:
    'bg-white text-oweru-800 border border-ink-300 hover:bg-oweru-50 hover:border-oweru-600 hover:text-oweru-900',
  ghost:
    'bg-transparent text-ink-600 border border-transparent hover:bg-ink-50 hover:text-ink-900',
  danger:
    'bg-error-600 text-white border border-error-600 hover:bg-error-700 hover:border-error-700 hover:text-white',
}

const SIZE = {
  sm: 'h-9 px-3.5 text-[0.8125rem]',
  md: 'h-11 px-5 text-[0.9375rem]',
  lg: 'h-13 px-6 text-base',
}

const BASE =
  'inline-flex items-center justify-center gap-2 rounded-[10px] font-semibold tracking-[-0.005em] whitespace-nowrap ' +
  'transition-[background-color,border-color,color,transform,box-shadow] duration-150 ' +
  'hover:-translate-y-px active:translate-y-0 ' +
  'disabled:opacity-50 disabled:pointer-events-none disabled:hover:translate-y-0'

const SPINNER = 'h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent'

export default function Button({
  variant = 'gold',
  size = 'md',
  to,
  href,
  loading = false,
  className = '',
  children,
  type = 'button',
  disabled,
  ...rest
}) {
  const cls = `${BASE} ${VARIANT[variant] || VARIANT.gold} ${SIZE[size] || SIZE.md} ${className}`.trim()
  const content = (
    <>
      {loading && <span className={SPINNER} aria-hidden="true" />}
      {children}
    </>
  )

  if (to) return <Link to={to} className={cls} {...rest}>{content}</Link>
  if (href) return <a href={href} className={cls} {...rest}>{content}</a>

  return (
    <button type={type} className={cls} disabled={loading || disabled} {...rest}>
      {content}
    </button>
  )
}
