import { afterEach, describe, expect, it, vi } from 'vitest'
import { memoryStorage } from '../test/factories'

/** isDevMode reads the page URL and sessionStorage; fake both */
async function dev(search: string, session = memoryStorage()) {
  vi.resetModules()
  vi.stubGlobal('window', { location: { search } })
  vi.stubGlobal('sessionStorage', session)
  const { isDevMode } = await import('./dev')
  return { isDevMode, session }
}

afterEach(() => vi.unstubAllGlobals())

describe('isDevMode', () => {
  it('is off by default', async () => {
    expect((await dev('')).isDevMode()).toBe(false)
  })
  it('is off for other query strings', async () => {
    expect((await dev('?debug=1&dev=yes')).isDevMode()).toBe(false)
  })
  it('turns on with ?dev=1', async () => {
    expect((await dev('?dev=1')).isDevMode()).toBe(true)
  })
  it('is remembered for the tab after in-app navigation drops the query string', async () => {
    const first = await dev('?dev=1')
    first.isDevMode()
    const later = await dev('', first.session)
    expect(later.isDevMode()).toBe(true)
  })
  it('turns off with ?dev=0', async () => {
    const first = await dev('?dev=1')
    first.isDevMode()
    const off = await dev('?dev=0', first.session)
    expect(off.isDevMode()).toBe(false)
  })
  it('is off, not an error, when storage is blocked', async () => {
    vi.resetModules()
    vi.stubGlobal('window', { location: { search: '?dev=1' } })
    vi.stubGlobal('sessionStorage', { getItem: () => { throw new Error('blocked') }, setItem: () => { throw new Error('blocked') }, removeItem: () => {} })
    const { isDevMode } = await import('./dev')
    expect(isDevMode()).toBe(false)
  })
})
