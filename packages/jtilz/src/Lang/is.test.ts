import * as Type from './is';

test(Type.isInteger.name, () => {
    expect(Type.isInteger(1.1)).toBe(false);
    expect(Type.isInteger(1.0)).toBe(true);
    expect(Type.isInteger(0)).toBe(true);
    expect(Type.isInteger('foo')).toBe(false);
})

test(Type.isFloat.name, () => {
    expect(Type.isFloat(1.1)).toBe(true);
    expect(Type.isFloat(1.0)).toBe(false);
    expect(Type.isFloat(0)).toBe(false);
    expect(Type.isFloat('foo')).toBe(false);
    expect(Type.isFloat(Math.PI)).toBe(true);
    expect(Type.isFloat(Number.MIN_VALUE)).toBe(true);
    expect(Type.isFloat(Number.EPSILON)).toBe(true);
    expect(Type.isFloat(999999.00000000001)).toBe(false);
})

test(Type.isString.name, () => {
    expect(Type.isString("foo")).toBe(true);
    expect(Type.isString("")).toBe(true);
    expect(Type.isString(1)).toBe(false);
    expect(Type.isString(String(1))).toBe(true);
    expect(Type.isString(new String(''))).toBe(true);
})

test(Type.isNaN.name, () => {
    expect(Type.isNaN(NaN)).toBe(true);
    expect(Type.isNaN(Number.NaN)).toBe(true);
    expect(Type.isNaN(undefined)).toBe(false);
    expect(Type.isNaN(new Date('bacon'))).toBe(false);
})