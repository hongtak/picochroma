const ansi = {
  reset: '\x1b[0m',

  fg: {
    black: '\x1b[30m', red: '\x1b[31m', green: '\x1b[32m', yellow: '\x1b[33m',
    blue: '\x1b[34m', magenta: '\x1b[35m', cyan: '\x1b[36m', white: '\x1b[37m',
    gray: '\x1b[90m',
    'bright-black': '\x1b[90m', 'bright-red': '\x1b[91m', 'bright-green': '\x1b[92m', 'bright-yellow': '\x1b[93m',
    'bright-blue': '\x1b[94m', 'bright-magenta': '\x1b[95m', 'bright-cyan': '\x1b[96m', 'bright-white': '\x1b[97m',
  },

  bg: {
    black: '\x1b[40m', red: '\x1b[41m', green: '\x1b[42m', yellow: '\x1b[43m',
    blue: '\x1b[44m', magenta: '\x1b[45m', cyan: '\x1b[46m', white: '\x1b[47m',
    gray: '\x1b[100m',
    'bright-black': '\x1b[100m', 'bright-red': '\x1b[101m', 'bright-green': '\x1b[102m', 'bright-yellow': '\x1b[103m',
    'bright-blue': '\x1b[104m', 'bright-magenta': '\x1b[105m', 'bright-cyan': '\x1b[106m', 'bright-white': '\x1b[107m',
  },

  effect: {
    bold: '\x1b[1m', dim: '\x1b[2m', italic: '\x1b[3m', underline: '\x1b[4m',
    blink: '\x1b[5m', reverse: '\x1b[7m', hidden: '\x1b[8m', strikethrough: '\x1b[9m',
  },
}

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

const colorSupport = getColorSupport();

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
  const c = [[0, 0, 0], [128, 0, 0], [0, 128, 0], [128, 128, 0], [0, 0, 128], [128, 0, 128],
    [0, 128, 128], [192, 192, 192], [128, 128, 128], [255, 0, 0], [0, 255, 0],
    [255, 255, 0], [0, 0, 255], [255, 0, 255], [0, 255, 255], [255, 255, 255]]
  let d = Infinity, i = 0, x = 0
  for (; i < c.length; i++) {
    const dr = r - c[i][0], dg = g - c[i][1], db = b - c[i][2]
    const t = dr * dr + dg * dg + db * db
    if (t < d) { d = t; x = i }
  }
  return x
}

function c(str, format = '') {
  if (!format || !colorSupport.supported) return str

  const styles = [], seen = new Set()
  const fl = format.toLowerCase().trim()
  const rg = /(?:bgrgb|rgb)\([^)]+\)/g
  const parts = fl.replace(rg, '').trim().split(/\s+|,+/).filter(Boolean)
  for (const m of fl.matchAll(rg)) parts.push(m[0])

  const a = n => { const k = n; if (seen.has(k)) return; seen.add(k) }
  for (const part of parts) {
    if (ansi.fg[part]) { a(`fg:${part}`); styles.push(ansi.fg[part]) }
    else if (part.startsWith('bg-') || part.startsWith('bg_')) {
      const cn = part.replace(/^bg[-_]/, '')
      if (ansi.bg[cn]) { a(`bg:${cn}`); styles.push(ansi.bg[cn]) }
    }
    else if (ansi.effect[part]) { a(`ef:${part}`); styles.push(ansi.effect[part]) }
    else if (part.startsWith('rgb(')) {
      const v = part.match(rgbRegex)?.[1]?.trim()
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
        const s = colorSupport.truecolor ? `\x1b[38;2;${r};${g};${b}m` : colorSupport.colors256 ? `\x1b[38;5;${rgbTo256Color(r, g, b)}m` : `\x1b[${fg16[idx]}m`
        styles.push(s)
      }
    }
    else if (part.startsWith('bgrgb(')) {
      const v = part.match(bgrgbRegex)?.[1]?.trim()
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
        const s = colorSupport.truecolor ? `\x1b[48;2;${r};${g};${b}m` : colorSupport.colors256 ? `\x1b[48;5;${rgbTo256Color(r, g, b)}m` : `\x1b[${bg16[idx]}m`
        styles.push(s)
      }
    }
  }

  return styles.join('') + str + ansi.reset
}
export default c