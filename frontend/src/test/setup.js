import { afterEach } from 'vitest'
import { cleanupJSX } from '../test/utils'

/* Minimal DOM jsdom test setup — no external @testing-library deps.
   Component tests that need real DOM assertions may add them later. */
afterEach(() => {
  cleanupJSX()
})