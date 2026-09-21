import assert from 'node:assert/strict'
import { performance } from 'node:perf_hooks'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { createColors } from '../picochroma.js'

// Optional baseline module: npm run bench -- /absolute/path/to/baseline.mjs
const baseline = process.argv[2]
  ? (await import(pathToFileURL(resolve(process.argv[2])).href)).createColors
  : null
const samples = 9
const targetMs = 25
let checksum = 0

function cases(factory) {
  const full = factory({ level: 'truecolor' })
  const plain = factory({ level: 0 })
  const inputs = Array.from({ length: 64 }, (_, i) => `Build ${i}: completed successfully`)
  const nested = inputs.map(text => `Before ${full(text, 'blue')} after`)
  const long = inputs.map(text => text.repeat(100))
  const named = full.style('green bold')
  const rgb = full.style('rgb(123, 45, 67) bgrgb(#123456)')
  const disabled = plain.style('green bold')
  return [
    ['direct / named', i => full(inputs[i & 63], 'green bold')],
    ['reusable / named', i => named(inputs[i & 63])],
    ['direct / RGB TrueColor', i => full(inputs[i & 63], 'rgb(123, 45, 67) bgrgb(#123456)')],
    ...[16, 256].map(level => {
      const color = factory({ level })
      return [`direct / RGB ${level}`, i => color(inputs[i & 63], 'rgb(123, 45, 67)')]
    }),
    ['reusable / RGB', i => rgb(inputs[i & 63])],
    ['direct / nested', i => full(nested[i & 63], 'green bold')],
    ['reusable / nested', i => named(nested[i & 63])],
    ['reusable / long text', i => named(long[i & 63])],
    ['direct / disabled', i => plain(inputs[i & 63], 'green bold')],
    ['reusable / disabled', i => disabled(inputs[i & 63])]
  ]
}

function measure(fn, iterations) {
  let consumed = 0
  const start = performance.now()
  for (let i = 0; i < iterations; i++) {
    const output = fn(i)
    consumed = (consumed + output.length + output.charCodeAt(i % output.length)) | 0
  }
  const elapsed = performance.now() - start
  checksum ^= consumed
  return elapsed
}

function calibrate(fn) {
  let iterations = 1024
  while (measure(fn, iterations) < targetMs) iterations *= 2
  return iterations
}

const median = values => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)]
const currentCases = cases(createColors)
const baselineCases = baseline && cases(baseline)
console.log(`Node ${process.version} | ${process.platform}/${process.arch} | ${samples} samples, median ns/op`)
console.log('Includes output consumption; timings are local measurements, not CI thresholds.')
const rows = []
for (let index = 0; index < currentCases.length; index++) {
  const [name, current] = currentCases[index]
  const previous = baselineCases?.[index][1]
  if (previous) {
    for (let i = 0; i < 64; i++) assert.equal(current(i), previous(i), name)
  }
  const iterations = Math.max(calibrate(current), previous ? calibrate(previous) : 0)
  const times = { current: [], baseline: [] }
  for (let sample = 0; sample < samples; sample++) {
    const order = previous ? [['current', current], ['baseline', previous]] : [['current', current]]
    if (sample % 2) order.reverse()
    for (const [label, fn] of order) times[label].push(measure(fn, iterations) * 1e6 / iterations)
  }
  const currentNs = median(times.current)
  const row = { case: name, 'current ns/op': Math.round(currentNs) }
  if (previous) {
    const baselineNs = median(times.baseline)
    row['baseline ns/op'] = Math.round(baselineNs)
    row['baseline/current'] = `${(baselineNs / currentNs).toFixed(2)}x`
  }
  rows.push(row)
}
console.table(rows)
console.log(`Consumption checksum: ${checksum}`)
