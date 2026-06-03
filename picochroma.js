const ansi = { reset: '\x1b[0m' }
const colors = ['black', 'red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white']
ansi.fg = {}
ansi.bg = {}
colors.forEach((c, i) => {
  ansi.fg[c] = `\x1b[${30 + i}m`
  ansi.bg[c] = `\x1b[${40 + i}m`
  ansi.fg[`bright-${c}`] = `\x1b[${90 + i}m`
  ansi.bg[`bright-${c}`] = `\x1b[${100 + i}m`
})
ansi.fg.gray = ansi.fg['bright-black']
ansi.bg.gray = ansi.bg['bright-black']
ansi.effect = {}
const effects = [['bold', 1], ['dim', 2], ['italic', 3], ['underline', 4], ['blink', 5], ['reverse', 7], ['hidden', 8], ['strikethrough', 9]]
effects.forEach(([e, c]) => {
  ansi.effect[e] = `\x1b[${c}m`
})

const hexRegex = /^[0-9A-F]{3}(?:[0-9A-F]{3})?$/
const rgbRegex = /rgb\(([^\)]+)\)/
const bgrgbRegex = /bgrgb\(([^\)]+)\)/
const fg16 = [30, 31, 32, 33, 34, 35, 36, 37, 90, 91, 92, 93, 94, 95, 96, 97]
const bg16 = [40, 41, 42, 43, 44, 45, 46, 47, 100, 101, 102, 103, 104, 105, 106, 107]

function getColorSupport() {
  if (typeof process === 'undefined' || !process.stdout) return { supported: true, truecolor: false, colors256: false }
  if (process.env.NO_COLOR) return { supported: false, truecolor: false, colors256: false }
  if (process.env.FORCE_COLOR) {
    const fc = process.env.FORCE_COLOR
    const t = fc === true || fc === '1' || fc === '3'
    return { supported: true, truecolor: t, colors256: fc === '256' || fc === '2' || t }
  }
  if (!process.stdout.isTTY) return { supported: false, truecolor: false, colors256: false }
  const ct = process.env.COLORTERM || ''
  const t = ct === 'truecolor' || ct === '24bit'
  return { supported: true, truecolor: t, colors256: t || ct === '256color' }
}

const colorSupport = getColorSupport()

function hexToRgb(hex) {
  hex = hex.replace('#', '').toUpperCase()
  if ((hex.length !== 3 && hex.length !== 6) || !hexRegex.test(hex)) return null
  if (hex.length === 3) hex = hex.split('').map(c => c + c).join('')
  const num = parseInt(hex, 16)
  return isNaN(num) ? null : { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 }
}

function rgbTo256Color(r, g, b) {
  if (r === g && g === b) return Math.round(r / 255 * 23) + 232
  return 16 + (36 * Math.round(r / 255 * 5) + 6 * Math.round(g / 255 * 5) + Math.round(b / 255 * 5))
}

function rgbTo16Color(r, g, b) {
  const c = [0,0,0, 128,0,0, 0,128,0, 128,128,0, 0,0,128, 128,0,128,
    0,128,128, 192,192,192, 128,128,128, 255,0,0, 0,255,0,
    255,255,0, 0,0,255, 255,0,255, 0,255,255, 255,255,255]
  let d = Infinity, i = 0, x = 0
  for (; i < 16; i++) {
    const dr = r - c[i*3], dg = g - c[i*3+1], db = b - c[i*3+2]
    const t = dr * dr + dg * dg + db * db
    if (t < d) { d = t; x = i }
  }
  return x
}

function parseColor(part, regex, codes) {
  const v = part.match(regex)?.[1]?.trim()
  let r, g, b
  if (v?.includes(',')) {
    const ps = v.split(',').map(n => parseInt(n.trim()))
    if (ps.length === 3 && ps.every(n => !isNaN(n))) [r, g, b] = ps.map(x => Math.max(0, Math.min(255, x)))
  } else {
    const h = hexToRgb(v)
    if (h) { r = h.r; g = h.g; b = h.b }
  }
  if (r !== undefined && g !== undefined && b !== undefined) {
    const idx = rgbTo16Color(r, g, b)
    const isFg = codes === fg16
    return colorSupport.truecolor ? (isFg ? `\x1b[38;2;${r};${g};${b}m` : `\x1b[48;2;${r};${g};${b}m`) : colorSupport.colors256 ? `\x1b[${isFg ? 38 : 48};5;${rgbTo256Color(r, g, b)}m` : `\x1b[${codes[idx]}m`
  }
  return null
}

function c(str, format = '') {
  if (!format || !colorSupport.supported) return str

  const styles = [], seen = new Set()
  const fl = format.toLowerCase().trim()
  const rg = /(?:bgrgb|rgb)\([^)]+\)/g
  const parts = fl.replace(rg, '').trim().split(/\s+|,+/).filter(Boolean)
  for (const m of fl.matchAll(rg)) parts.push(m[0])

  for (const part of parts) {
    if (ansi.fg[part]) { 
      const k = `fg:${part}`
      if (seen.has(k)) continue
      seen.add(k)
      styles.push(ansi.fg[part]) 
    }
    else if (part.startsWith('bg-') || part.startsWith('bg_')) {
      const cn = part.replace(/^bg[-_]/, '')
      if (ansi.bg[cn]) { 
        const k = `bg:${cn}`
        if (seen.has(k)) continue
        seen.add(k)
        styles.push(ansi.bg[cn]) 
      }
    }
    else if (ansi.effect[part]) { 
      const k = `ef:${part}`
      if (seen.has(k)) continue
      seen.add(k)
      styles.push(ansi.effect[part]) 
    }
    else if (part.startsWith('rgb(')) {
      const s = parseColor(part, rgbRegex, fg16)
      if (s) styles.push(s)
    }
    else if (part.startsWith('bgrgb(')) {
      const s = parseColor(part, bgrgbRegex, bg16)
      if (s) styles.push(s)
    }
  }

  return styles.join('') + str + ansi.reset
}
export default c