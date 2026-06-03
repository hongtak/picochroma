# picochroma

A ultra-lightweight, zero-dependency utility for adding vibrant ANSI colors, backgrounds, and text effects to your terminal logs.

Instead of dealing with complex chaining or heavy dependencies, this package provides a single, flexible function that parses readable string styling formats—including full TrueColor 24-bit RGB and Hex codes.

## Key Advantages

### 1. Ultra-Lightweight & Zero Dependencies

The entire library is a single, self-contained function under 100 lines of code. It introduces zero dependency bloat to a user's `node_modules`, making it perfect for CLI tools, microservices, and performance-critical applications.

### 2. Micro-DSL (Domain Specific Language) API

While many styling libraries use method chaining, this tool offers a flexible configuration approach by accepting a single, space-separated, human-readable string of modifiers (e.g., `'red bold underline'`).

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
- 🌈 **RGB & Hex Support** – Use custom RGB colors with `rgb(255,0,0)`, `rgb(#FF0000)`, or `rgb(FF0000)` for any color
- 📉 **Smart Color Degradation** – RGB colors automatically degrade gracefully: 24-bit TrueColor → 256-color → 16-color, ensuring compatibility across all terminals
- 🔧 **Simple API** – Human-readable DSL format using a single function
- 📦 **Lightweight** – Under 3KB, zero dependencies, fast and efficient
- 🚀 **ES Module** – Built with modern JavaScript, no semicolons
- 🎯 **Auto-Detect Color Support** – Automatically detects terminal capabilities and adapts accordingly

## Color Support Detection & Degradation

Picochroma automatically detects terminal color capabilities and intelligently degrades RGB colors to maintain visual quality:

### Terminal Capability Detection

- **TTY Detection** – Returns plain text when output is piped (e.g., to a file or another process)
- **NO_COLOR Support** – Respects the `NO_COLOR` environment variable to disable all colors
- **FORCE_COLOR Support** – Set `FORCE_COLOR=1` (or `256` or `true`) to force enable colors
- **COLORTERM Detection** – Reads `COLORTERM` environment variable to detect color level

### Color Degradation Pipeline

RGB colors (`rgb()` and `bgrgb()`) automatically degrade based on terminal capabilities:

1. **24-bit TrueColor** – Full 16.7M colors using `\x1b[38;2;r;g;b;m` format (best quality)
   - Available when `COLORTERM=truecolor` or `24bit`
   
2. **256-Color Palette** – Intelligently maps RGB to the nearest color in the 216-color cube plus 24-level grayscale
   - Available when `COLORTERM=256color` or when TrueColor is detected
   
3. **16-Color ANSI** – Finds the closest standard ANSI color using Euclidean distance
   - Always available as a fallback
   - Uses proper ANSI codes: 30-37 (standard), 90-97 (bright)

**Example degradation:**
```javascript
// Terminal with TrueColor support
c('text', 'rgb(255, 100, 50)')  // → Full RGB: \x1b[38;2;255;100;50m

// Terminal with 256-color support  
c('text', 'rgb(255, 100, 50)')  // → 256-color: \x1b[38;5;214m (closest match)

// Terminal with only 16-color support
c('text', 'rgb(255, 100, 50)')  // → 16-color: \x1b[33m (bright yellow)
```

### Environment Variables

| Variable | Value | Effect |
|----------|-------|--------|
| `NO_COLOR` | any | Disables all colors, returns plain text |
| `FORCE_COLOR` | `1` or `true` | Force enable 24-bit TrueColor |
| `FORCE_COLOR` | `256` or `2` | Force enable 256-color mode |
| `FORCE_COLOR` | `16` or `0` | Force enable 16-color mode |
| `COLORTERM` | `truecolor` or `24bit` | Enable 24-bit TrueColor |
| `COLORTERM` | `256color` | Enable 256-color mode |

### Examples

```javascript
import c from 'picochroma'

// Auto-detection handles all scenarios:
console.log(c('Styled text', 'bold red'))             // Works in terminal
console.log(c('Custom color', 'rgb(100, 200, 50)'))  // RGB degrades gracefully

// Environment variables control behavior:
// NO_COLOR=1 node script.js                → Plain text output
// FORCE_COLOR=1 node script.js | cat       → Forced TrueColor even when piped
// COLORTERM=256color node script.js        → 256-color mode
```

## Installation

```bash
npm install picochroma
```

## Usage

### Basic Colors

```javascript
import c from 'picochroma';

console.log(c('This is red', 'red'))
console.log(c('This is green', 'green'))
console.log(c('This is blue', 'blue'))

// Use bright versions for higher intensity
console.log(c('This is bright red', 'bright-red'))
console.log(c('This is bright green', 'bright-green'))
console.log(c('This is bright blue', 'bright-blue'))
```

Available colors: `black`, `red`, `green`, `yellow`, `blue`, `magenta`, `cyan`, `white`, `gray`

Bright versions: `bright-black`, `bright-red`, `bright-green`, `bright-yellow`, `bright-blue`, `bright-magenta`, `bright-cyan`, `bright-white`

### Background Colors

Use `bg-` or `bg_` prefix to apply background colors:

```javascript
console.log(c('Red background', 'bg-red'))
console.log(c('Green background', 'bg_green'))
console.log(c('Blue background', 'bg-blue'))

// Bright background colors
console.log(c('Bright red background', 'bg-bright-red'))
console.log(c('Bright green background', 'bg_bright-green'))
console.log(c('Bright blue background', 'bg-bright-blue'))
```

### Text Effects

```javascript
console.log(c('Bold text', 'bold'))
console.log(c('Underlined text', 'underline'))
console.log(c('Italic text', 'italic'))
console.log(c('Strikethrough', 'strikethrough'))
console.log(c('Dim text', 'dim'))
console.log(c('Blinking text', 'blink'))
console.log(c('Reversed text', 'reverse'))
console.log(c('Hidden text', 'hidden'))
```

### Combining Styles

Combine multiple styles using spaces or commas:

```javascript
console.log(c('Bold red text', 'bold red'))
console.log(c('Bold green on white', 'bold green bg-white'))
console.log(c('Underlined yellow', 'underline yellow'))

// Comma-separated also works
console.log(c('Bold red text', 'bold, red'))
console.log(c('Bold green on white', 'bold, green, bg-white'))
console.log(c('Underlined yellow', 'underline, yellow'))
```

### RGB Colors

Use custom RGB colors with decimal values or hex codes (with or without `#`). RGB colors work on **all terminals** through automatic color degradation:

```javascript
// RGB with decimal values
console.log(c('Custom purple', 'rgb(128, 0, 128)'))
console.log(c('Custom orange', 'rgb(255, 165, 0)'))

// RGB with hex codes (# optional)
console.log(c('Custom pink', 'rgb(#FF1493)'))
console.log(c('Custom teal', 'rgb(008080)'))
console.log(c('Custom lime', 'rgb(00FF00)'))
console.log(c('Red', 'rgb(f00)'))  // 3-digit hex works too

// Combining with other styles
console.log(c('Styled RGB', 'bold rgb(200, 100, 50) underline'))
```

**Note:** RGB colors are parsed correctly even with spaces and commas:
```javascript
c('Text', 'rgb(255, 128, 0)')    // Spaces preserved in parsing
c('Text', 'rgb(255,128,0)')      // Comma-separated values work fine
```

### RGB Backgrounds

Use `bgrgb()` to apply custom background colors (hex with or without `#`). Background colors also degrade gracefully:

```javascript
console.log(c('Dark background', 'bgrgb(50, 50, 50) white'))
console.log(c('Light background', 'bgrgb(#E0E0E0) black'))
console.log(c('Another background', 'bgrgb(E0E0E0) black'))  // # is optional
```

## Supported Colors & Styles

| Styling Bracket | Token Identifiers / Syntax Patterns | Usage Blueprint | Notes |
|-----------------|-------------------------------------|-----------------|-------|
| Foreground Standard | `black`, `red`, `green`, `yellow`, `blue`, `magenta`, `cyan`, `white`, `gray` | `c('Log', 'red')` | Supported on all terminals |
| Foreground Bright | `bright-black`, `bright-red`, `bright-green`, `bright-yellow`, `bright-blue`, `bright-magenta`, `bright-cyan`, `bright-white` | `c('Log', 'bright-blue')` | Supported on all terminals |
| Background Standard | Combine prefix `bg-` or `bg_` alongside any standard color token | `c('Log', 'bg-green')` | Supported on all terminals |
| Background Bright | Combine prefix `bg-` or `bg_` alongside any bright color token | `c('Log', 'bg-bright-yellow')` | Supported on all terminals |
| Text Layout Effects | `bold`, `dim`, `italic`, `underline`, `blink`, `reverse`, `hidden`, `strikethrough` | `c('Log', 'bold underline')` | Support varies by terminal |
| RGB Text | `rgb(R,G,B)` \| `rgb(#HEX)` \| `rgb(HEX)` | `rgb(255,100,0)`, `rgb(#FF5733)`, `rgb(FF5733)`, `rgb(#FFF)`, `rgb(FFF)` | Automatically degrades to 256-color or 16-color |
| RGB Background | `bgrgb(R,G,B)` \| `bgrgb(#HEX)` \| `bgrgb(HEX)` | `bgrgb(0,0,0)`, `bgrgb(#112233)`, `bgrgb(112233)`, `bgrgb(#000)`, `bgrgb(000)` | Automatically degrades to 256-color or 16-color |

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
const styledText = c('Hello', 'bold red bg-white')
```

## Examples

### Status Messages

```javascript
import c from 'picochroma'

console.log(c('✓ Success', 'green bold'))
console.log(c('✗ Error', 'red bold'))
console.log(c('⚠ Warning', 'yellow bold'))
console.log(c('ℹ Info', 'cyan'))
```

### Highlighted Output

```javascript
console.log(c('IMPORTANT:', 'bold yellow bg-red') + ' Pay attention!')
console.log(c('Note:', 'bold blue') + ' This is informational.')
```

### Colored Table Headers

```javascript
console.log(c('Name', 'bold white bg-blue') + ' | ' + 
            c('Status', 'bold white bg-green') + ' | ' + 
            c('Progress', 'bold white bg-magenta'))
```

## Maintainers

- [Choi Hong Tak](https://github.com/hongtak)
