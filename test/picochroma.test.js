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

test('malformed RGB styles are ignored without throwing', () => {
  for (const format of ['rgb(', 'rgb()', 'bgrgb(', 'bgrgb()', 'rgb(nope)']) {
    assert.equal(evaluate(`c('hello', ${JSON.stringify(format)})`), 'hello')
  }
  assert.equal(evaluate("c('hello', 'red rgb()')"), '\x1b[31mhello\x1b[0m')
})
