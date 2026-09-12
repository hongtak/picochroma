import c, { createColors, type ColorOptions, type ColorLevel } from 'picochroma'

const plain: string = c('Hello')
const styled: string = c('Hello', 'bold red bg-white')
const optional: string = c('Hello', undefined)
const custom: string = c('Hello', 'rgb(#ff8800) bgrgb(0, 0, 0)')
const configured: string = c('Hello', String('format from configuration'))
const nested: string = c('Before ' + c('inside', 'blue') + ' after', 'red')

const level: ColorLevel = 'truecolor'
const options: ColorOptions = { level, stream: 'stderr' }
const instance: typeof c = createColors(options)
const errorText: string = instance('Error', 'red bold')
createColors()('Auto')
createColors({ level: 0 })('Plain', 'red')
createColors({ level: 16 })('ANSI', 'rgb(#f00)')
createColors({ level: 256 })('Indexed', 'rgb(#f00)')
createColors({ level: 'auto', stream: 'stdout' })('Auto')
// @ts-expect-error Invalid color level.
createColors({ level: 24 })
// @ts-expect-error Invalid stream name.
createColors({ stream: 'stdin' })
// @ts-expect-error Configured functions still require string text.
instance(123)
// @ts-expect-error Configured functions still require string formats.
instance('Text', false)

// @ts-expect-error Text is required.
c()
// @ts-expect-error The documented text parameter is a string.
c(123)
// @ts-expect-error Null is not text.
c(null)
// @ts-expect-error Formats must be strings.
c('Hello', ['bold', 'red'])
// @ts-expect-error Null is not a format.
c('Hello', null)
// @ts-expect-error The function returns text, not a number.
const wrong: number = c('Hello', 'red')
// @ts-expect-error No style factory is exposed by this API.
c.style('red')
