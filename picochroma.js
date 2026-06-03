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

function hexToRgb(hex) {
  hex = hex.replace('#', '').toUpperCase();
  
  // Validate hex format (must be 3 or 6 valid hex characters)
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

  const styles = [];
  const seen = new Set();
  const parts = format.toLowerCase()
                      .replace(/,/g, ' ')
                      .trim()
                      .split(/\s+/)
                      .filter(Boolean);

  for (const part of parts) {
    // Foreground colors: green, red, blue...
    if (ansi.fg[part]) {
      if (!seen.has(part)) {
        styles.push(ansi.fg[part]);
        seen.add(part);
      }
    }
    // Background colors: only bg-red or bg_red
    else if (part.startsWith('bg-') || part.startsWith('bg_')) {
      const colorName = part.replace(/^bg[-_]/, '');
      if (ansi.bg[colorName]) {
        if (!seen.has(colorName)) {
          styles.push(ansi.bg[colorName]);
          seen.add(colorName);
        }
      }
    }
    // Effects: bold, underline, blink...
    else if (ansi.effect[part]) {
      if (!seen.has(part)) {
        styles.push(ansi.effect[part]);
        seen.add(part);
      }
    }
    // RGB Text Color: rgb(255,0,0) or rgb(#FF0000)
    else if (part.startsWith('rgb(')) {
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
    // RGB Background: bgrgb(255,0,0) or bgrgb(#FF0000)
    else if (part.startsWith('bgrgb(')) {
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