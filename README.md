# picochroma

A tiny, zero-dependency terminal styling utility with a surprisingly rich feature set for its size.

Instead of complex chaining, picochroma provides one flexible function that parses readable string styling formats, including named colors, backgrounds, text effects, RGB values, and hex colors.

## Key Advantages

### 1. Ultra-Lightweight & Zero Dependencies

The library ships as a small, self-contained source file with zero runtime dependencies. It keeps dependency weight low while still covering the styling features most CLI tools need.

### 2. Micro-DSL (Domain Specific Language) API

While many styling libraries use method chaining, this tool offers a configuration-friendly approach by accepting a single, space-separated, human-readable string of modifiers (e.g., `'red bold underline'`).

- It is highly dynamic: you can easily pass styling strings from configuration files or environment variables without writing complex code logic.

- It is forgiving: it seamlessly parses both spaces (`'red bold'`) and commas (`'red, bold'`).

### 3. Rich Color Support in a Tiny API

picochroma supports named colors, bright variants, backgrounds, text effects, RGB values, and hex colors through the same small API. Custom colors work for both foregrounds (`rgb(...)`) and backgrounds (`bgrgb(...)`).

### 4. Native ESM Support

Built cleanly using standard ES Modules (`export default`), ensuring it works flawlessly out-of-the-box in modern Node.js environments and build tools like Vite, Esbuild, or Rollup without legacy CommonJS headaches.

## Features

- **Named Colors** - Standard colors plus bright variants: red, green, blue, cyan, magenta, yellow, white, gray, black, and more
- **Background Colors** - Background palette with standard and bright variants using the `bg-` prefix
- **Text Effects** - Bold, dim, italic, underline, blink, reverse, hidden, and strikethrough
- **RGB & Hex Support** - Use custom colors with `rgb(255,0,0)`, `rgb(#FF0000)`, or `rgb(FF0000)`
- **RGB Backgrounds** - Apply custom background colors with `bgrgb(20,20,20)` or `bgrgb(#111827)`
- **Smart Color Degradation** - RGB colors degrade from 24-bit TrueColor to 256-color to 16-color ANSI
- **Simple DSL API** - Human-readable format strings like `bold rgb(#ff8800) bg-blue underline`
- **Small Source** - A compact single-file implementation with zero runtime dependencies
- **ES Module** - Native ESM export for modern Node.js and bundlers
- **Auto-Detect Color Support** - Adapts to TTY output, `NO_COLOR`, `FORCE_COLOR`, and `COLORTERM`

## Color Support Detection & Degradation

Picochroma automatically detects terminal color capabilities and intelligently degrades RGB colors using the default xterm palette:

### Terminal Capability Detection

- **TTY Detection** – Returns plain text when output is piped (e.g., to a file or another process)
- **NO_COLOR Support** – Respects the `NO_COLOR` environment variable to disable all colors
- **FORCE_COLOR Support** – Set `FORCE_COLOR=1` (or `256` or `true`) to force enable colors
- **COLORTERM Detection** – Reads `COLORTERM` environment variable to detect color level
- **TERM Detection** – Recognizes `*-256color` and `*-direct`/`*-truecolor`/`*-24bit`; `TERM=dumb` disables automatic styling

The default function detects stdout at module import time. Non-empty `NO_COLOR` takes precedence over `FORCE_COLOR`; an empty `NO_COLOR` does not disable styling. Without a force override, piped stdout and `TERM=dumb` return plain text. Use `createColors({ stream: 'stderr' })` to detect stderr separately.

### Color Degradation Pipeline

RGB colors (`rgb()` and `bgrgb()`) automatically degrade based on terminal capabilities:

1. **24-bit TrueColor** – Full 16.7M colors using `\x1b[38;2;r;g;b;m` format (best quality)
   - Available when `COLORTERM=truecolor` or `24bit`, or a direct-color `TERM` is detected
   
2. **256-Color Palette** – Intelligently maps RGB to the nearest color in the 216-color cube plus 24-level grayscale
   - Available when `COLORTERM=256color` or `TERM` ends in `-256color`
   
3. **16-Color ANSI** – Finds the closest standard ANSI color using Euclidean distance
   - Always available as a fallback
   - Uses proper ANSI codes: 30-37 (standard), 90-97 (bright)

**Example degradation:**
```javascript
// Terminal with TrueColor support
c('text', 'rgb(255, 100, 50)')  // → Full RGB: \x1b[38;2;255;100;50m

// Terminal with 256-color support  
c('text', 'rgb(255, 100, 50)')  // → 256-color: \x1b[38;5;203m (closest match)

// Terminal with only 16-color support
c('text', 'rgb(255, 100, 50)')  // → 16-color: \x1b[91m (bright red)
```

The 256-color conversion compares the nearest cube color with the nearest grayscale entry using squared RGB distance. It uses fixed entries 16–255; entries 0–15 can be customized by the terminal. Palette customization can still affect displayed colors.

### Environment Variables

| Variable | Value | Effect |
|----------|-------|--------|
| `NO_COLOR` | non-empty | Disables all colors, returns plain text |
| `FORCE_COLOR` | `1` or `true` | Force enable 24-bit TrueColor |
| `FORCE_COLOR` | `256` or `2` | Force enable 256-color mode |
| `FORCE_COLOR` | `16` or `0` | Force enable 16-color mode |
| `COLORTERM` | `truecolor` or `24bit` | Enable 24-bit TrueColor |
| `COLORTERM` | `256color` | Enable 256-color mode |
| `TERM` | `*-256color` | Enable 256-color mode on a TTY |
| `TERM` | `*-direct`, `*-truecolor`, `*-24bit` | Enable TrueColor on a TTY |
| `TERM` | `dumb` | Disable automatic styling unless forced |

For compatibility, picochroma keeps its existing force values: `1`, `3`, and `true` select TrueColor, and `0` selects 16 colors. These values differ from Node.js's own `FORCE_COLOR` convention. Use non-empty `NO_COLOR` to disable styling.

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

Use the `bg-` prefix to apply background colors:

```javascript
console.log(c('Red background', 'bg-red'))
console.log(c('Green background', 'bg-green'))
console.log(c('Blue background', 'bg-blue'))

// Bright background colors
console.log(c('Bright red background', 'bg-bright-red'))
console.log(c('Bright green background', 'bg-bright-green'))
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

Styles apply from left to right. If colors conflict, the last color wins, including RGB colors.

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

Decimal components must be whole integers, with an optional `+` or `-` sign; values are clamped to 0–255. Fractions, exponents, and numeric suffixes are ignored as malformed styles. Hex colors accept three or six digits with an optional leading `#`. These rules also apply to `bgrgb()`.

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
| Background Standard | Combine prefix `bg-` alongside any standard color token | `c('Log', 'bg-green')` | Supported on all terminals |
| Background Bright | Combine prefix `bg-` alongside any bright color token | `c('Log', 'bg-bright-yellow')` | Supported on all terminals |
| Text Layout Effects | `bold`, `dim`, `italic`, `underline`, `blink`, `reverse`, `hidden`, `strikethrough` | `c('Log', 'bold underline')` | Support varies by terminal |
| RGB Text | `rgb(R,G,B)` \| `rgb(#HEX)` \| `rgb(HEX)` | `rgb(255,100,0)`, `rgb(#FF5733)`, `rgb(FF5733)`, `rgb(#FFF)`, `rgb(FFF)` | Automatically degrades to 256-color or 16-color |
| RGB Background | `bgrgb(R,G,B)` \| `bgrgb(#HEX)` \| `bgrgb(HEX)` | `bgrgb(0,0,0)`, `bgrgb(#112233)`, `bgrgb(112233)`, `bgrgb(#000)`, `bgrgb(000)` | Automatically degrades to 256-color or 16-color |

## API

### TypeScript

TypeScript declarations are included; no separate `@types` package is needed.

```typescript
import c from 'picochroma'

const message: string = c('Success', 'green bold')
```

The signature is `c(text: string, format?: string): string`. Format strings remain flexible so styles can come from configuration, including RGB and hex values. Editor documentation describes the parameters and return value.

Contributors can run `npm ci` followed by `npm test` to run runtime tests and strict type checks for NodeNext and bundler module resolution. TypeScript is a development dependency only; picochroma still has no runtime dependencies.

### Benchmarks

Run `npm run bench` to measure direct calls, reusable styles, RGB palettes, nested styles, long text, and disabled output. To compare a change against an earlier implementation:

```bash
git show HEAD:picochroma.js > /tmp/picochroma-baseline.mjs
npm run bench -- /tmp/picochroma-baseline.mjs
```

Capture the baseline before committing the change being measured. The benchmark checks matching outputs, warms up each case, and reports median nanoseconds per operation across nine samples, alternating measurement order. A baseline/current ratio above 1 means the current implementation was faster. Timings include consuming the output and depend on the Node version, machine, and system load; run comparisons with other workloads stopped. They are diagnostic measurements, not CI performance thresholds.

### `c.style(format?)`

Parse a format once and reuse the returned `(text: string) => string` function:

```javascript
import c, { createColors } from 'picochroma'

const success = c.style('green bold')
console.log(success('Build complete'))
console.log(success('Tests passed'))

const errorColor = createColors({ stream: 'stderr' })
const error = errorColor.style('red bold')
console.error(error('Build failed'))

const labels = ['Ready', 'Running'].map(success)
```

Reusable styles use their parent instance's color settings. Format parsing and RGB conversion happen when `.style()` is called, so subsequent calls only apply the compiled styling. Output follows the same rules as direct calls, including nested styles, color precedence, and disabled output. An omitted, empty, or unrecognized format returns text unchanged.

Both the default export and every `createColors()` instance expose `.style()`. The returned formatter takes text only; create another formatter to use a different format. TypeScript users can import the `Colors` and `StyleFunction` types.

### `createColors(options?)`

Create an independent styling function with the same `c(text, format)` signature:

```javascript
import c, { createColors } from 'picochroma'

const plain = createColors({ level: 0 })
const ansi = createColors({ level: 16 })
const indexed = createColors({ level: 256 })
const full = createColors({ level: 'truecolor' })
const errorColor = createColors({ stream: 'stderr' })

console.log(plain('No styling', 'bold red'))
console.log(full('Custom color', 'rgb(#ff8800)'))
console.error(errorColor('Error', 'red bold'))
```

| Option | Values | Default |
|--------|--------|---------|
| `level` | `'auto'`, `0` (disabled), `16`, `256`, `'truecolor'` | `'auto'` |
| `stream` | `'stdout'`, `'stderr'` | `'stdout'` |

Explicit levels override `NO_COLOR`, `FORCE_COLOR`, terminal detection, and pipe detection. `level: 0` adds no styling. Automatic mode follows the environment rules described above for the selected stream. The function returns text; `stream` only selects detection and does not print anything.

Detection is captured when `createColors()` is called. Create another instance to pick up later environment or stream changes. Instances do not change the default function or each other. Invalid level or stream values throw `TypeError`.

TypeScript users can import `ColorOptions` and `ColorLevel` as types alongside `createColors`.

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
