/** Tiny DOM cleanup facade used by setup.js to keep tests dependency-free. */
export function cleanupJSX() {
  if (typeof document === 'undefined') return
  document.body.innerHTML = ''
}