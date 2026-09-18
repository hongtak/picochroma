const ansi = { reset: '\x1b[0m' }
const colors = ['black', 'red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white']
ansi.fg = Object.create(null)
ansi.bg = Object.create(null)
colors.forEach((c, i) => {
  ansi.fg[c] = `\x1b[${30 + i}m`
  ansi.bg[c] = `\x1b[${40 + i}m`
  ansi.fg[`bright-${c}`] = `\x1b[${90 + i}m`
  ansi.bg[`bright-${c}`] = `\x1b[${100 + i}m`
})
ansi.fg.gray = ansi.fg['bright-black']
ansi.bg.gray = ansi.bg['bright-black']
ansi.effect = Object.create(null)
const effects = [['bold', 1], ['dim', 2], ['italic', 3], ['underline', 4], ['blink', 5], ['reverse', 7], ['hidden', 8], ['strikethrough', 9]]
effects.forEach(([e, c]) => {
  ansi.effect[e] = `\x1b[${c}m`
})

const hexRegex = /^[0-9A-F]{3}(?:[0-9A-F]{3})?$/
const rgbRegex = /^rgb\(([^\)]+)\)$/
const bgrgbRegex = /^bgrgb\(([^\)]+)\)$/
const fg16 = [30, 31, 32, 33, 34, 35, 36, 37, 90, 91, 92, 93, 94, 95, 96, 97]
const bg16 = [40, 41, 42, 43, 44, 45, 46, 47, 100, 101, 102, 103, 104, 105, 106, 107]

function getColorSupport(stream) {
  if (typeof process === 'undefined' || !stream) return { supported: true, truecolor: false, colors256: false }
  const env = process.env
  if (env.NO_COLOR) return { supported: false, truecolor: false, colors256: false }
  if (env.FORCE_COLOR) {
    const fc = env.FORCE_COLOR
    const t = fc === 'true' || fc === '1' || fc === '3'
    return { supported: true, truecolor: t, colors256: fc === '256' || fc === '2' || t }
  }
  if (!stream.isTTY) return { supported: false, truecolor: false, colors256: false }
  const term = (env.TERM || '').toLowerCase()
  if (term === 'dumb') return { supported: false, truecolor: false, colors256: false }
  const ct = (env.COLORTERM || '').toLowerCase()
  const t = ct === 'truecolor' || ct === '24bit' || /(?:^|-)(?:direct|truecolor|24bit)$/.test(term)
  return { supported: true, truecolor: t, colors256: t || ct === '256color' || /(?:^|-)256color$/.test(term) }
}


function hexToRgb(hex) {
  if (typeof hex !== 'string') return null
  hex = hex.replace(/^#/, '').toUpperCase()
  if ((hex.length !== 3 && hex.length !== 6) || !hexRegex.test(hex)) return null
  if (hex.length === 3) hex = hex.split('').map(c => c + c).join('')
  const num = parseInt(hex, 16)
  return isNaN(num) ? null : { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 }
}

function rgbTo256Color(r, g, b) {
  const levels = [0, 95, 135, 175, 215, 255]
  const nearest = value => value < 48 ? 0 : value < 115 ? 1 : Math.min(5, Math.floor((value - 115) / 40) + 2)
  const ri = nearest(r), gi = nearest(g), bi = nearest(b)
  const cubeDistance = (r - levels[ri]) ** 2 + (g - levels[gi]) ** 2 + (b - levels[bi]) ** 2
  const grayIndex = Math.max(0, Math.min(23, Math.round(((r + g + b) / 3 - 8) / 10)))
  const gray = 8 + grayIndex * 10
  const grayDistance = (r - gray) ** 2 + (g - gray) ** 2 + (b - gray) ** 2
  return grayDistance < cubeDistance ? 232 + grayIndex : 16 + 36 * ri + 6 * gi + bi
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

function parseColor(part, regex, codes, colorSupport) {
  const v = part.match(regex)?.[1]?.trim()
  let r, g, b
  if (v?.includes(',')) {
    const ps = v.split(',').map(n => n.trim())
    if (ps.length === 3 && ps.every(n => /^[+-]?\d+$/.test(n))) [r, g, b] = ps.map(x => Math.max(0, Math.min(255, Number(x))))
  } else {
    const h = hexToRgb(v)
    if (h) { r = h.r; g = h.g; b = h.b }
  }
  if (r !== undefined && g !== undefined && b !== undefined) {
    const isFg = codes === fg16
    if (colorSupport.truecolor) return `\x1b[${isFg ? 38 : 48};2;${r};${g};${b}m`
    if (colorSupport.colors256) return `\x1b[${isFg ? 38 : 48};5;${rgbTo256Color(r, g, b)}m`
    return `\x1b[${codes[rgbTo16Color(r, g, b)]}m`
  }
  return null
}

function compileStyle(colorSupport, format = '') {
  if (!format || !colorSupport.supported) return ''

  const styles = []
  const fl = format.toLowerCase().trim()
  const parts = fl.match(/(?:bgrgb|rgb)\([^)]*\)|[^\s,]+/g) || []

  for (const part of parts) {
    if (ansi.fg[part]) { 
      styles.push(ansi.fg[part]) 
    }
    else if (part.startsWith('bg-')) {
      const cn = part.replace(/^bg-/, '')
      if (ansi.bg[cn]) { 
        styles.push(ansi.bg[cn]) 
      }
    }
    else if (ansi.effect[part]) { 
      styles.push(ansi.effect[part]) 
    }
    else if (part.startsWith('rgb(')) {
      const s = parseColor(part, rgbRegex, fg16, colorSupport)
      if (s) styles.push(s)
    }
    else if (part.startsWith('bgrgb(')) {
      const s = parseColor(part, bgrgbRegex, bg16, colorSupport)
      if (s) styles.push(s)
    }
  }

  return styles.join('')
}

function applyStyle(opening, str) {
  if (!opening) return str
  return opening + String(str).split(ansi.reset).join(ansi.reset + opening) + ansi.reset
}
export function createColors({ level = 'auto', stream = 'stdout' } = {}) {
  if (![ 'auto', 0, 16, 256, 'truecolor' ].includes(level)) {
    throw new TypeError('level must be auto, 0, 16, 256, or truecolor')
  }
  if (stream !== 'stdout' && stream !== 'stderr') {
    throw new TypeError('stream must be stdout or stderr')
  }
  const colorSupport = level === 'auto'
    ? getColorSupport(typeof process === 'undefined' ? undefined : process[stream])
    : { supported: level !== 0, truecolor: level === 'truecolor', colors256: level === 256 || level === 'truecolor' }
  const color = (text, format) => applyStyle(compileStyle(colorSupport, format), text)
  color.style = (format = '') => {
    const opening = compileStyle(colorSupport, format)
    return text => applyStyle(opening, text)
  }
  return color
}

const c = createColors()
export default c
