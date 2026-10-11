import { describe, expect, it } from 'vitest'
import { DEFAULT_FAST, MAX_FAST, readFastFactor, scaleDelay } from './fastMode'

const memory = () => {
  const m = new Map<string, string>()
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v), removeItem: (k: string) => void m.delete(k) }
}

describe('fast mode (for demo videos)', () => {
  it('is off unless asked for', () => {
    expect(readFastFactor('', memory())).toBe(1)
    expect(readFastFactor('?dev=1', memory())).toBe(1)
  })
  it('?fast=1 means the default speed, ?fast=N means N, capped', () => {
    expect(readFastFactor('?fast=1', memory())).toBe(DEFAULT_FAST)
    expect(readFastFactor('?fast=5', memory())).toBe(5)
    expect(readFastFactor('?fast=99', memory())).toBe(MAX_FAST)
  })
  it('is remembered for the tab, and ?fast=0 turns it off', () => {
    const s = memory()
    readFastFactor('?fast=4', s)
    expect(readFastFactor('', s)).toBe(4)
    expect(readFastFactor('?fast=0', s)).toBe(1)
    expect(readFastFactor('', s)).toBe(1)
  })
  it('survives a browser with no storage and junk values', () => {
    expect(readFastFactor('?fast=abc', null)).toBe(1)
    expect(readFastFactor('?fast=3', null)).toBe(3)
  })
  it('timers wait N times less, never zero for a real wait, and leave zero alone', () => {
    expect(scaleDelay(3000, 3)).toBe(1000)
    expect(scaleDelay(2, 12)).toBe(1)
    expect(scaleDelay(0, 3)).toBe(0)
    expect(scaleDelay(undefined, 3)).toBe(0)
  })
})
