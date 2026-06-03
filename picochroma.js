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
};

const hexRegex = /^[0-9A-F]{3}(?:[0-9A-F]{3})?$/;
const rgbRegex = /rgb\(([^\)]+)\)/;
const bgrgbRegex = /bgrgb\(([^\)]+)\)/;

// Color support detection
function getColorSupport() {
  if (typeof process === 'undefined' || !process.stdout) {
    return { supported: true, truecolor: false };
  }
  
  // Check explicit disable
  if (process.env.NO_COLOR) return { supported: false, truecolor: false };
  
  // Check explicit enable
  if (process.env.FORCE_COLOR) return { supported: true, truecolor: !!process.env.FORCE_COLOR };
  
  // Check if output is a TTY
  if (!process.stdout.isTTY) return { supported: false, truecolor: false };
  
  // Check for 24-bit color support
  const colorterm = process.env.COLORTERM || '';
  const truecolor = colorterm === 'truecolor' || colorterm === '24bit';
  
  return { supported: true, truecolor };
}

const colorSupport = getColorSupport();

function hexToRgb(hex) {
  hex = hex.replace('#', '').toUpperCase();
  
  // Strictly validate: must be exactly 3 or 6 hex characters
  if (hex.length !== 3 && hex.length !== 6) {
    return null;
  }
  
  // Validate hex format
  if (!hexRegex.test(hex)) {
    return null;
  }
  
  if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
  const num = parseInt(hex, 16);
  
  if (isNaN(num)) return null;
  
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}

function c(str, format = '') {
  if (!format) return str;
  
  // Return plain text if colors aren't supported
  if (!colorSupport.supported) return str;

  const styles = [];
  const seen = new Set();
  
  // Extract rgb() and bgrgb() patterns before splitting
  const formatLower = format.toLowerCase().trim();
  const parts = [];
  let remaining = formatLower;
  const rgbMatches = [];
  
  // Find all rgb(...) and bgrgb(...) patterns
  const rgbRegexGlobal = /(?:bgrgb|rgb)\([^)]+\)/g;
  let match;
  while ((match = rgbRegexGlobal.exec(formatLower)) !== null) {
    rgbMatches.push(match[0]);
  }
  
  // Remove rgb/bgrgb patterns from the string before splitting
  remaining = formatLower.replace(rgbRegexGlobal, '').trim();
  
  // Split the remaining part by spaces and commas
  if (remaining) {
    parts.push(...remaining.split(/\s+|,+/).filter(Boolean));
  }
  
  // Add the extracted rgb/bgrgb patterns back
  parts.push(...rgbMatches);

  for (const part of parts) {
    // Foreground colors: green, red, blue...
    if (ansi.fg[part]) {
      const key = `fg:${part}`;
      if (!seen.has(key)) {
        styles.push(ansi.fg[part]);
        seen.add(key);
      }
    }
    // Background colors: only bg-red or bg_red
    else if (part.startsWith('bg-') || part.startsWith('bg_')) {
      const colorName = part.replace(/^bg[-_]/, '');
      if (ansi.bg[colorName]) {
        const key = `bg:${colorName}`;
        if (!seen.has(key)) {
          styles.push(ansi.bg[colorName]);
          seen.add(key);
        }
      }
    }
    // Effects: bold, underline, blink...
    else if (ansi.effect[part]) {
      const key = `effect:${part}`;
      if (!seen.has(key)) {
        styles.push(ansi.effect[part]);
        seen.add(key);
      }
    }
    // RGB Text Color: rgb(255,0,0) or rgb(#FF0000) - only if 24-bit supported
    else if (colorSupport.truecolor && part.startsWith('rgb(')) {
      const match = part.match(rgbRegex);
      if (match) {
        const value = match[1].trim();
        if (value.includes(',')) {
          const [r, g, b] = value.split(',').map(n => parseInt(n.trim()));
          if (!isNaN(r) && !isNaN(g) && !isNaN(b)) {
            styles.push(`\x1b[38;2;${r};${g};${b}m`);
          }
        } else {
          const rgb = hexToRgb(value);
          if (rgb) {
            styles.push(`\x1b[38;2;${rgb.r};${rgb.g};${rgb.b}m`);
          }
        }
      }
    }
    // RGB Background: bgrgb(255,0,0) or bgrgb(#FF0000) - only if 24-bit supported
    else if (colorSupport.truecolor && part.startsWith('bgrgb(')) {
      const match = part.match(bgrgbRegex);
      if (match) {
        const value = match[1].trim();
        if (value.includes(',')) {
          const [r, g, b] = value.split(',').map(n => parseInt(n.trim()));
          if (!isNaN(r) && !isNaN(g) && !isNaN(b)) {
            styles.push(`\x1b[48;2;${r};${g};${b}m`);
          }
        } else {
          const rgb = hexToRgb(value);
          if (rgb) {
            styles.push(`\x1b[48;2;${rgb.r};${rgb.g};${rgb.b}m`);
          }
        }
      }
    }
  }

  return styles.join('') + str + ansi.reset;
}

export default c;