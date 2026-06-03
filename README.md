# picochroma

A ultra-lightweight, zero-dependency utility for adding vibrant ANSI colors, backgrounds, and text effects to your terminal logs.

Instead of dealing with complex chaining or heavy dependencies, this package provides a single, flexible function that parses readable string styling formats—including full TrueColor 24-bit RGB and Hex codes.

## Key Advantages

### 1. Ultra-Lightweight & Zero Dependencies

The entire library is a single, self-contained function under 100 lines of code. It introduces zero dependency bloat to a user's `node_modules`, making it perfect for CLI tools, microservices, and performance-critical applications.

### 2. Micro-DSL (Domain Specific Language) API

Unlike other libraries that force you into rigid method chaining (`chalk.red.bold.underline('text')`), your tool accepts a single, human-readable string configuration (`'red bold underline'`).

- It is highly dynamic: you can easily pass styling strings from configuration files or environment variables without writing complex code logic.

- It is forgiving: it seamlessly parses both spaces (`'red bold'`) and commas (`'red, bold'`).

### 3. Full 24-Bit TrueColor Support (RGB & Hex)

Many lightweight alternatives strip out RGB or Hex support to save space. This implementation includes a built-in Hex-to-RGB parser, giving developers access to 16 million+ colors for both foregrounds (`rgb(...)`) and backgrounds (`bgrgb(...)`) right out of the box.

### 4. Native ESM Support

Built cleanly using standard ES Modules (`export default`), ensuring it works flawlessly out-of-the-box in modern Node.js environments and build tools like Vite, Esbuild, or Rollup without legacy CommonJS headaches.

## Features

- 🎨 **Named Colors** – 9 standard colors plus bright variants (Red, Green, Blue, Cyan, Magenta, Yellow, White, Gray, Black)
- 🖼️ **Background Colors** – Full palette of background colors with bright variants
- ✨ **Text Effects** – Bold, dim, italic, underline, blink, reverse, hidden, strikethrough
- 🌈 **RGB Support** – Use custom RGB colors with `rgb(255,0,0)` or hex `rgb(#FF0000)` or `rgb(FF0000)`
- 🔧 **Simple API** – Human-readable DSL format using a single function
- 📦 **Lightweight** – Minimal dependencies, fast and efficient
- 🚀 **ES Module** – Built with modern JavaScript
- 🎯 **Auto-Detect Color Support** – Automatically detects terminal capabilities and gracefully degrades

## Color Support Detection

Picochroma automatically detects terminal color capabilities and adapts gracefully:

- **TTY Detection** – Returns plain text when output is piped (e.g., to a file or another process)
- **NO_COLOR Support** – Respects the `NO_COLOR` environment variable to disable colors
- **FORCE_COLOR Support** – Set `FORCE_COLOR=1` to force enable colors
- **24-bit RGB Fallback** – RGB colors (`rgb()` and `bgrgb()`) only apply when `COLORTERM=truecolor` or `24bit` is detected; otherwise they're silently skipped

### Environment Variables

| Variable | Effect |
|----------|--------|
| `NO_COLOR` | Set to any value to disable all colors and return plain text |
| `FORCE_COLOR` | Set to `1` to force enable colors (even when piped) |
| `COLORTERM` | Set to `truecolor` or `24bit` to enable 24-bit RGB color support |

### Examples

```javascript
import c from 'picochroma';

// Auto-detection handles all of these:
console.log(c('Styled text', 'bold red'));       // Works in terminal
echo $(node script.js) > output.txt               // Plain text when piped
NO_COLOR=1 node script.js                         // Plain text with NO_COLOR
FORCE_COLOR=1 node script.js | cat                // Forced colors even when piped
COLORTERM=truecolor node script.js                // Full 24-bit RGB support
```

## Installation

```bash
npm install picochroma
```

## Usage

### Basic Colors

```javascript
import c from 'picochroma';

console.log(c('This is red', 'red'));
console.log(c('This is green', 'green'));
console.log(c('This is blue', 'blue'));

// Use bright versions for higher intensity
console.log(c('This is bright red', 'bright-red'));
console.log(c('This is bright green', 'bright-green'));
console.log(c('This is bright blue', 'bright-blue'));
```

Available colors: `black`, `red`, `green`, `yellow`, `blue`, `magenta`, `cyan`, `white`, `gray`

Bright versions: `bright-black`, `bright-red`, `bright-green`, `bright-yellow`, `bright-blue`, `bright-magenta`, `bright-cyan`, `bright-white`

### Background Colors

Use `bg-` or `bg_` prefix to apply background colors:

```javascript
console.log(c('Red background', 'bg-red'));
console.log(c('Green background', 'bg_green'));
console.log(c('Blue background', 'bg-blue'));

// Bright background colors
console.log(c('Bright red background', 'bg-bright-red'));
console.log(c('Bright green background', 'bg_bright-green'));
console.log(c('Bright blue background', 'bg-bright-blue'));
```

### Text Effects

```javascript
console.log(c('Bold text', 'bold'));
console.log(c('Underlined text', 'underline'));
console.log(c('Italic text', 'italic'));
console.log(c('Strikethrough', 'strikethrough'));
console.log(c('Dim text', 'dim'));
console.log(c('Blinking text', 'blink'));
console.log(c('Reversed text', 'reverse'));
console.log(c('Hidden text', 'hidden'));
```

### Combining Styles

Combine multiple styles using spaces or commas:

```javascript
console.log(c('Bold red text', 'bold red'));
console.log(c('Bold green on white', 'bold green bg-white'));
console.log(c('Underlined yellow', 'underline yellow'));

// Comma-separated also works
console.log(c('Bold red text', 'bold, red'));
console.log(c('Bold green on white', 'bold, green, bg-white'));
console.log(c('Underlined yellow', 'underline, yellow'));
```

### RGB Colors

Use custom RGB colors with decimal values or hex codes (with or without `#`):

```javascript
// RGB with decimal values
console.log(c('Custom purple', 'rgb(128,0,128)'));
console.log(c('Custom orange', 'rgb(255,165,0)'));

// RGB with hex codes
console.log(c('Custom pink', 'rgb(#FF1493)'));
console.log(c('Custom teal', 'rgb(008080)'));  // # is optional
console.log(c('Custom lime', 'rgb(00FF00)'));  // works without #
```

### RGB Backgrounds

Use `bgrgb()` to apply custom background colors (hex with or without `#`):

```javascript
console.log(c('Dark background', 'bgrgb(50,50,50) white'));
console.log(c('Light background', 'bgrgb(#E0E0E0) black'));
console.log(c('Another background', 'bgrgb(E0E0E0) black'));  // # is optional
```

## Supported Colors & Styles

### Foreground Colors

| Color | Usage |
|-------|-------|
| Black | `black` |
| Red | `red` |
| Green | `green` |
| Yellow | `yellow` |
| Blue | `blue` |
| Magenta | `magenta` |
| Cyan | `cyan` |
| White | `white` |
| Gray | `gray` |
| Bright Black | `bright-black` |
| Bright Red | `bright-red` |
| Bright Green | `bright-green` |
| Bright Yellow | `bright-yellow` |
| Bright Blue | `bright-blue` |
| Bright Magenta | `bright-magenta` |
| Bright Cyan | `bright-cyan` |
| Bright White | `bright-white` |

### Background Colors

| Color | Usage |
|-------|-------|
| Black | `bg-black` or `bg_black` |
| Red | `bg-red` or `bg_red` |
| Green | `bg-green` or `bg_green` |
| Yellow | `bg-yellow` or `bg_yellow` |
| Blue | `bg-blue` or `bg_blue` |
| Magenta | `bg-magenta` or `bg_magenta` |
| Cyan | `bg-cyan` or `bg_cyan` |
| White | `bg-white` or `bg_white` |
| Gray | `bg-gray` or `bg_gray` |
| Bright Black | `bg-bright-black` or `bg_bright-black` |
| Bright Red | `bg-bright-red` or `bg_bright-red` |
| Bright Green | `bg-bright-green` or `bg_bright-green` |
| Bright Yellow | `bg-bright-yellow` or `bg_bright-yellow` |
| Bright Blue | `bg-bright-blue` or `bg_bright-blue` |
| Bright Magenta | `bg-bright-magenta` or `bg_bright-magenta` |
| Bright Cyan | `bg-bright-cyan` or `bg_bright-cyan` |
| Bright White | `bg-bright-white` or `bg_bright-white` |

### Text Effects

| Effect | Usage |
|--------|-------|
| Bold | `bold` |
| Dim | `dim` |
| Italic | `italic` |
| Underline | `underline` |
| Blink | `blink` |
| Reverse | `reverse` |
| Hidden | `hidden` |
| Strikethrough | `strikethrough` |

### RGB Colors

| Format | Example |
|--------|----------|
| Decimal RGB | `rgb(255,100,50)` |
| Hex with # | `rgb(#FF6432)` |
| Hex without # | `rgb(FF6432)` |
| RGB Background (decimal) | `bgrgb(255,100,50)` |
| RGB Background (hex with #) | `bgrgb(#FF6432)` |
| RGB Background (hex without #) | `bgrgb(FF6432)` |

## API

### `c(text, format)`

Styles the given text with the specified format.

**Parameters:**
- `text` (string) – The text to style
- `format` (string, optional) – A space or comma-separated list of styles to apply

**Returns:** 
- String with ANSI escape codes applied

**Example:**
```javascript
const styledText = c('Hello', 'bold red bg-white');
```

## Examples

### Status Messages

```javascript
import c from 'picochroma';

console.log(c('✓ Success', 'green bold'));
console.log(c('✗ Error', 'red bold'));
console.log(c('⚠ Warning', 'yellow bold'));
console.log(c('ℹ Info', 'cyan'));
```

### Highlighted Output

```javascript
console.log(c('IMPORTANT:', 'bold yellow bg-red') + ' Pay attention!');
console.log(c('Note:', 'bold blue') + ' This is informational.');
```

### Colored Table Headers

```javascript
console.log(c('Name', 'bold white bg-blue') + ' | ' + 
            c('Status', 'bold white bg-green') + ' | ' + 
            c('Progress', 'bold white bg-magenta'));
```
