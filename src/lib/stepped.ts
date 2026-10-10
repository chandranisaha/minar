/** Stepped easing: motion "on twos/threes" like 1930s cel animation (~10-12fps feel). */
export const stepped = (n = 10) => (t: number) => Math.min(1, Math.floor(t * n) / (n - 1))
/** stepped with a little overshoot, for bouncy settle */
export const steppedBack = (n = 10) => (t: number) => {
  const s = Math.floor(t * n) / n
  const c = 1.9
  return 1 + (c + 1) * Math.pow(s - 1, 3) + c * Math.pow(s - 1, 2)
}
