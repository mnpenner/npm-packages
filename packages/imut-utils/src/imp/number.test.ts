import { expect, test } from 'bun:test'
import { add, div, mult, sub } from './number'

test('add', () => {
  expect(add(1, 2)).toBe(3)
  expect(add(null, 2)).toBe(2)
  expect(add(undefined, 3)).toBe(3)
})

test('sub', () => {
  expect(sub(1, 2)).toBe(-1)
  expect(sub(null, 2)).toBe(-2)
  expect(sub(undefined, 3)).toBe(-3)
})

test('mult', () => {
  expect(mult(2, 6)).toBe(12)
  expect(mult(undefined, 2)).toBe(0)
})

test('div', () => {
  expect(div(6, 2)).toBe(3)
  expect(div(null, 2)).toBe(0)
})
