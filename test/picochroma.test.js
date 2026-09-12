import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import test from 'node:test'

function evaluate(expression, forceColor = '1') {
  const env = { ...process.env, FORCE_COLOR: forceColor }
  delete env.NO_COLOR
  const result = spawnSync(process.execPath, ['--input-type=module', '-e',
    `import c from ${JSON.stringify(new URL('../picochroma.js', import.meta.url).href)}; process.stdout.write(JSON.stringify(${expression}));`
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

test('malformed RGB styles are ignored without throwing', () => {
  for (const format of ['rgb(', 'rgb()', 'bgrgb(', 'bgrgb()', 'rgb(nope)']) {
    assert.equal(evaluate(`c('hello', ${JSON.stringify(format)})`), 'hello')
  }
  assert.equal(evaluate("c('hello', 'red rgb()')"), '\x1b[31mhello\x1b[0m')
})
