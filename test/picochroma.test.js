import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import test from 'node:test'

function evaluate(expression, forceColor = '1', options = {}) {
  const env = { ...process.env }
  for (const key of ['NO_COLOR', 'FORCE_COLOR', 'COLORTERM', 'TERM']) delete env[key]
  if (forceColor !== null) env.FORCE_COLOR = forceColor
  Object.assign(env, options.env)
  const result = spawnSync(process.execPath, ['--input-type=module', '-e',
    `process.stdout.isTTY = ${Boolean(options.tty)};
     process.stderr.isTTY = ${Boolean(options.stderrTTY)};
     const { default: c, createColors } = await import(${JSON.stringify(new URL('../picochroma.js', import.meta.url).href)});
     process.stdout.write(JSON.stringify(${expression}));`
  ], { env, encoding: 'utf8' })
  assert.equal(result.status, 0, result.stderr)
  return JSON.parse(result.stdout)
}

test('inherited property names are ignored as unknown styles', () => {
  for (const format of ['constructor', '__proto__', 'bg-constructor', 'bg-__proto__']) {
    assert.equal(evaluate(`c('hello', ${JSON.stringify(format)})`), 'hello')
  }
  assert.equal(evaluate("c('hello', 'constructor bold')"), '\x1b[1mhello\x1b[0m')
})

test('outer styles resume after nested styled text', () => {
  assert.equal(
    evaluate("c('before ' + c('inside', 'blue') + ' after', 'red bold')"),
    '\x1b[31m\x1b[1mbefore \x1b[34minside\x1b[0m\x1b[31m\x1b[1m after\x1b[0m'
  )
  assert.equal(
    evaluate("c(c('one', 'blue') + ' middle ' + c('two', 'green') + ' end', 'red')"),
    '\x1b[31m\x1b[34mone\x1b[0m\x1b[31m middle \x1b[32mtwo\x1b[0m\x1b[31m end\x1b[0m'
  )
})

test('styles preserve input order, including repeated colors and RGB commas', () => {
  const cases = [
    ['rgb(#f00) blue', '\x1b[38;2;255;0;0m\x1b[34m'],
    ['blue rgb(#f00)', '\x1b[34m\x1b[38;2;255;0;0m'],
    ['bgrgb(255, 0, 0), bg-blue', '\x1b[48;2;255;0;0m\x1b[44m'],
    ['red blue red', '\x1b[31m\x1b[34m\x1b[31m'],
    ['bold, rgb(1, 2, 3), underline', '\x1b[1m\x1b[38;2;1;2;3m\x1b[4m']
  ]
  for (const [format, opening] of cases) {
    assert.equal(evaluate(`c('hello', ${JSON.stringify(format)})`), opening + 'hello\x1b[0m')
  }
})

test('FORCE_COLOR values select the documented color modes', () => {
  for (const mode of ['true', '1', '3']) {
    assert.equal(evaluate("c('hello', 'rgb(255, 0, 0)')", mode), '\x1b[38;2;255;0;0mhello\x1b[0m')
  }
  for (const mode of ['256', '2']) {
    assert.equal(evaluate("c('hello', 'rgb(255, 0, 0)')", mode), '\x1b[38;5;196mhello\x1b[0m')
  }
  for (const mode of ['16', '0']) {
    assert.equal(evaluate("c('hello', 'rgb(255, 0, 0)')", mode), '\x1b[91mhello\x1b[0m')
  }
})

test('malformed RGB styles are ignored without throwing', () => {
  for (const format of ['rgb(', 'rgb()', 'bgrgb(', 'bgrgb()', 'rgb(nope)']) {
    assert.equal(evaluate(`c('hello', ${JSON.stringify(format)})`), 'hello')
  }
  assert.equal(evaluate("c('hello', 'red rgb()')"), '\x1b[31mhello\x1b[0m')
})


test('all named foregrounds, backgrounds, bright colors and effects', () => {
  const colors = ['black', 'red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white']
  const cases = colors.flatMap((color, i) => [
    [color, 30 + i], ['bg-' + color, 40 + i],
    ['bright-' + color, 90 + i], ['bg-bright-' + color, 100 + i]
  ])
  cases.push(['gray', 90], ['bg-gray', 100], ['bold', 1], ['dim', 2],
    ['italic', 3], ['underline', 4], ['blink', 5], ['reverse', 7],
    ['hidden', 8], ['strikethrough', 9])
  const actual = evaluate(`${JSON.stringify(cases)}.map(([format]) => c('x', format))`)
  assert.deepEqual(actual, cases.map(([, code]) => `\x1b[${code}mx\x1b[0m`))
})

test('plain output for omitted, empty, unknown formats and piped output', () => {
  assert.deepEqual(evaluate("[c('x'), c('x', ''), c('x', 'unknown'), c('x', ' , ')]"), ['x', 'x', 'x', 'x'])
  assert.equal(evaluate("c('x', 'red bold')", null), 'x')
  assert.equal(evaluate("c('x', 'red')", '1', { env: { NO_COLOR: '1' }, tty: true }), 'x')
})

test('hex forms, decimal RGB, clamping and case-insensitive formats', () => {
  assert.deepEqual(evaluate("['rgb(#f00)', 'RGB(FF0000)', 'rgb(255, 0, 0)', 'rgb(999, -1, 0)'].map(f => c('x', f))"),
    Array(4).fill('\x1b[38;2;255;0;0mx\x1b[0m'))
  assert.equal(evaluate("c('x', ' BOLD, bgrgb(#AbC) ')"), '\x1b[1m\x1b[48;2;170;187;204mx\x1b[0m')
})

test('TTY detection recognizes TERM and COLORTERM color capabilities', () => {
  const cases = [
    [{}, '\x1b[91m'],
    [{ TERM: 'xterm' }, '\x1b[91m'],
    [{ TERM: 'xterm-256color' }, '\x1b[38;5;196m'],
    [{ TERM: 'screen-256color' }, '\x1b[38;5;196m'],
    [{ TERM: 'tmux-256color' }, '\x1b[38;5;196m'],
    [{ TERM: 'xterm-direct' }, '\x1b[38;2;255;0;0m'],
    [{ COLORTERM: '256color' }, '\x1b[38;5;196m'],
    [{ COLORTERM: 'truecolor', TERM: 'xterm-256color' }, '\x1b[38;2;255;0;0m'],
    [{ COLORTERM: '24bit' }, '\x1b[38;2;255;0;0m'],
    [{ COLORTERM: 'TRUECOLOR' }, '\x1b[38;2;255;0;0m']
  ]
  for (const [env, opening] of cases) {
    assert.equal(evaluate("c('x', 'rgb(#f00)')", null, { tty: true, env }), opening + 'x\x1b[0m')
  }
})

test('disabled output and explicit overrides take precedence over detection', () => {
  const expression = "c('x', 'rgb(#f00)')"
  assert.equal(evaluate(expression, null, { tty: true, env: { TERM: 'dumb', COLORTERM: 'truecolor' } }), 'x')
  assert.equal(evaluate(expression, null, { env: { TERM: 'xterm-256color', COLORTERM: 'truecolor' } }), 'x')
  assert.equal(evaluate(expression, '1', { env: { TERM: 'dumb' } }), '\x1b[38;2;255;0;0mx\x1b[0m')
  assert.equal(evaluate(expression, '16', { tty: true, env: { COLORTERM: 'truecolor' } }), '\x1b[91mx\x1b[0m')
  assert.equal(evaluate(expression, '1', { env: { NO_COLOR: '0' } }), 'x')
  assert.equal(evaluate(expression, '1', { env: { NO_COLOR: '' } }), '\x1b[38;2;255;0;0mx\x1b[0m')
})

test('256-color conversion preserves every fixed palette color exactly', () => {
  const levels = [0, 95, 135, 175, 215, 255]
  const palette = []
  for (const r of levels) for (const g of levels) for (const b of levels) palette.push([r, g, b])
  for (let value = 8; value <= 238; value += 10) palette.push([value, value, value])
  for (const background of [false, true]) {
    const prefix = background ? 'bgrgb' : 'rgb'
    const actual = evaluate(`${JSON.stringify(palette)}.map(rgb => c('x', '${prefix}(' + rgb.join(',') + ')'))`, '256')
    assert.deepEqual(actual, palette.map((_, i) => `\x1b[${background ? 48 : 38};5;${16 + i}mx\x1b[0m`))
  }
})

test('256-color conversion chooses a nearest fixed palette entry for arbitrary RGB', () => {
  const levels = [0, 95, 135, 175, 215, 255]
  const palette = []
  for (const r of levels) for (const g of levels) for (const b of levels) palette.push([r, g, b])
  for (let value = 8; value <= 238; value += 10) palette.push([value, value, value])
  const samples = [[0, 0, 0], [255, 255, 255], [100, 101, 102], [47, 115, 195], [48, 114, 194]]
  for (let r = 0; r <= 255; r += 17) for (let g = 0; g <= 255; g += 17) for (let b = 0; b <= 255; b += 17) samples.push([r, g, b])
  // Generate the grid inside the child to stay below Windows command-line limits.
  const actual = evaluate(`(() => {
    const samples = [[0,0,0], [255,255,255], [100,101,102], [47,115,195], [48,114,194]];
    for (let r=0;r<=255;r+=17) for (let g=0;g<=255;g+=17) for (let b=0;b<=255;b+=17) samples.push([r,g,b]);
    return samples.map(rgb => c('x', 'rgb(' + rgb.join(',') + ')'));
  })()`, '256')
  for (const [i, rgb] of samples.entries()) {
    const index = Number(actual[i].match(/^\x1b\[38;5;(\d+)mx\x1b\[0m$/)?.[1])
    assert.ok(index >= 16 && index <= 255)
    const distance = color => color.reduce((sum, value, channel) => sum + (value - rgb[channel]) ** 2, 0)
    assert.equal(distance(palette[index - 16]), Math.min(...palette.map(distance)), `RGB ${rgb}`)
  }
})

test('16-color conversion preserves reference ANSI colors for foregrounds and backgrounds', () => {
  const palette = [[0,0,0], [128,0,0], [0,128,0], [128,128,0], [0,0,128], [128,0,128], [0,128,128], [192,192,192],
    [128,128,128], [255,0,0], [0,255,0], [255,255,0], [0,0,255], [255,0,255], [0,255,255], [255,255,255]]
  for (const background of [false, true]) {
    const actual = evaluate(`${JSON.stringify(palette)}.map(rgb => c('x', '${background ? 'bgrgb' : 'rgb'}(' + rgb.join(',') + ')'))`, '16')
    assert.deepEqual(actual, palette.map((_, i) => `\x1b[${(i < 8 ? 30 + i : 90 + i - 8) + (background ? 10 : 0)}mx\x1b[0m`))
  }
})

test('three levels of nesting restore each enclosing style across multiline text', () => {
  assert.equal(evaluate("c('outer ' + c('middle ' + c('inner', 'blue') + '\\n middle', 'green') + ' outer', 'red bold')"),
    '\x1b[31m\x1b[1mouter \x1b[32mmiddle \x1b[34minner\x1b[0m\x1b[31m\x1b[1m\x1b[32m\n middle\x1b[0m\x1b[31m\x1b[1m outer\x1b[0m')
})

test('explicit levels override the environment and keep instances independent', () => {
  const result = evaluate(`(() => {
    const plain = createColors({ level: 0 });
    const ansi = createColors({ level: 16 });
    const indexed = createColors({ level: 256 });
    const full = createColors({ level: 'truecolor' });
    return [plain('x', 'bold red'), ansi('x', 'rgb(#f00) bgrgb(#000)'),
      indexed('x', 'rgb(#f00) bgrgb(#000)'), full('x', 'rgb(#f00) bgrgb(#000)'),
      plain('x', 'red'), c('x', 'red')];
  })()`, '1', { env: { NO_COLOR: '1', TERM: 'dumb' } })
  assert.deepEqual(result, ['x', '\x1b[91m\x1b[40mx\x1b[0m',
    '\x1b[38;5;196m\x1b[48;5;16mx\x1b[0m', '\x1b[38;2;255;0;0m\x1b[48;2;0;0;0mx\x1b[0m', 'x', 'x'])
})

test('automatic instances detect stdout and stderr independently', () => {
  const expression = "[c('x', 'red'), createColors()('x', 'red'), createColors({ stream: 'stderr' })('x', 'red')]"
  assert.deepEqual(evaluate(expression, null, { tty: false, stderrTTY: true }), ['x', 'x', '\x1b[31mx\x1b[0m'])
  assert.deepEqual(evaluate(expression, null, { tty: true, stderrTTY: false }), ['\x1b[31mx\x1b[0m', '\x1b[31mx\x1b[0m', 'x'])
  assert.deepEqual(evaluate(expression, null, { tty: true, stderrTTY: true, env: { NO_COLOR: '1' } }), ['x', 'x', 'x'])
})

test('automatic configuration is captured when each instance is created', () => {
  assert.deepEqual(evaluate(`(() => {
    const first = createColors();
    process.env.NO_COLOR = '1';
    const second = createColors();
    return [first('x', 'red'), second('x', 'red'), c('x', 'red')];
  })()`), ['\x1b[31mx\x1b[0m', 'x', '\x1b[31mx\x1b[0m'])
})

test('configured functions preserve format handling and nested styles', () => {
  assert.deepEqual(evaluate(`(() => {
    const color = createColors({ level: 'truecolor' });
    return [color('x'), color('x', 'rgb()'), color('x', 'constructor'),
      color('a ' + color('b', 'blue') + ' c', 'red'), color('x', 'rgb(#f00) blue')];
  })()`, null), ['x', 'x', 'x', '\x1b[31ma \x1b[34mb\x1b[0m\x1b[31m c\x1b[0m', '\x1b[38;2;255;0;0m\x1b[34mx\x1b[0m'])
})

test('invalid configuration fails clearly', () => {
  const errors = evaluate(`[ { level: 24 }, { level: false }, { level: null }, { stream: 'stdin' }, { stream: null } ].map(options => {
    try { createColors(options); return null; } catch (error) { return [error.name, error.message]; }
  })`)
  for (const [name, message] of errors) {
    assert.equal(name, 'TypeError')
    assert.match(message, /^(level|stream) must be/)
  }
})
