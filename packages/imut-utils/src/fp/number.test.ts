import { expect, test } from 'bun:test'
import { add, div, mult, sub } from './number'

test('add', () => {
  expect(add(2)(1)).toBe(3)
  expect(add(2)(null)).toBe(2)
  expect(add(3)(undefined)).toBe(3)
})

test('sub', () => {
  expect(sub(2)(1)).toBe(-1)
  expect(sub(2)(null)).toBe(-2)
  expect(sub(3)(undefined)).toBe(-3)
})

test('mult', () => {
  expect(mult(2)(6)).toBe(12)
  expect(mult(2)(undefined)).toBe(0)
})

test('div', () => {
  expect(div(2)(6)).toBe(3)
  expect(div(2)(undefined)).toBe(0)
})
