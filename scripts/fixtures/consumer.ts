import c from 'picochroma'

const plain: string = c('Hello')
const styled: string = c('Hello', 'bold red bg-white')
const optional: string = c('Hello', undefined)
const custom: string = c('Hello', 'rgb(#ff8800) bgrgb(0, 0, 0)')
const configured: string = c('Hello', String('format from configuration'))
const nested: string = c('Before ' + c('inside', 'blue') + ' after', 'red')

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
