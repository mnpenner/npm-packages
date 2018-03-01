import {isEmpty, clone} from './value';

test(isEmpty.name, () => {
    expect(isEmpty('')).toBe(true);
    expect(isEmpty([])).toBe(true);
    expect(isEmpty({})).toBe(true);
    expect(isEmpty(Object.create(null))).toBe(true);
    expect(isEmpty(new Date(''))).toBe(true);
    expect(isEmpty(new Map)).toBe(true);
    expect(isEmpty(new Set)).toBe(true);
    expect(isEmpty(undefined)).toBe(true);
    expect(isEmpty(NaN)).toBe(true);
    expect(isEmpty(null)).toBe(true);
    
    expect(isEmpty(0)).toBe(false);
    expect(isEmpty('x')).toBe(false);
    expect(isEmpty([0])).toBe(false);
    expect(isEmpty(new Date)).toBe(false);
    expect(isEmpty({0:0})).toBe(false);
    expect(isEmpty(new Map([['',0]]))).toBe(false);
    expect(isEmpty(new Set([0]))).toBe(false);
    expect(isEmpty(true)).toBe(false);
    expect(isEmpty(false)).toBe(false); // hmm...
})

describe(clone.name, () => {
    it('copies arrays', () => {
        const orig = [1,2,3];
        const copy = clone(orig);
        expect(copy).toEqual(orig);
        expect(copy).not.toBe(orig);
    });
    
    it('clones objects', () => {
        const orig = {foo:'bar',baz:{}};
        const copy = clone(orig);
        expect(copy).toEqual(orig);
        expect(copy).not.toBe(orig);
        expect(copy.baz).toBe(orig.baz);
        expect(copy.constructor).toBe(orig.constructor);
    });

    it('clones objects w/out prototypes', () => {
        const orig = Object.create(null);
        const copy = clone(orig);
        expect(copy).toEqual(orig);
        expect(copy).not.toBe(orig);
        expect(copy.constructor).toBe(orig.constructor);
    });

    it('clones custom types', () => {
        class Shape {
            constructor(name) {
                this.name = name;
            }
            
            getName() {
                return this.name;
            }
        }
        const name = 'shape1';
        const orig = new Shape(name);
        const copy = clone(orig);
        expect(copy).toEqual(orig);
        expect(copy).not.toBe(orig);
        expect(copy.getName()).toBe(name);
    });

    it('clones dates', () => {
        const orig = new Date;
        orig.x = {};
        const copy = clone(orig);
        expect(copy).toEqual(orig);
        expect(copy).not.toBe(orig);
        expect(copy.x).toBe(orig.x);
    });

    it('clones sets', () => {
        const orig = new Set([3,1,1,2]);
        orig.x = {};
        const copy = clone(orig);
        expect(copy).toEqual(orig);
        expect(copy).not.toBe(orig);
        expect(copy.x).toBe(orig.x);
    });

    it('clones maps', () => {
        const orig = new Map([['A',1],['B',2]]);
        orig.x = {};
        const copy = clone(orig);
        expect(copy).toEqual(orig);
        expect(copy).not.toBe(orig);
        expect(copy.x).toBe(orig.x);
    });

    it('clones null', () => {
        const orig = null;
        const copy = clone(orig);
        expect(copy).toBe(orig);
    });

    it('clones undefined', () => {
        const orig = undefined;
        const copy = clone(orig);
        expect(copy).toBe(orig);
    });

    it('clones numbers', () => {
        const orig = 0;
        const copy = clone(orig);
        expect(copy).toBe(orig);
    });

    it('clones NaN', () => {
        const orig = NaN;
        const copy = clone(orig);
        expect(copy).toEqual(orig);
    });

    it('clones booleans', () => {
        const orig = false;
        const copy = clone(orig);
        expect(copy).toBe(orig);
    });

    it('clones regexes', () => {
        const orig = /foo/i;
        orig.x = {};
        const copy = clone(orig);
        expect(copy).toEqual(orig);
        expect(copy).not.toBe(orig);
        expect(copy.x).toBe(orig.x);
    });

    it('clones functions', () => {
        function orig(x) { return x*3 };
        orig.x = {};
        const copy = clone(orig);
        expect(copy.name).toBe(orig.name);
        expect(copy(2)).toBe(6);
        expect(copy).not.toBe(orig);
        expect(copy.x).toBe(orig.x);
    });
    
    it('clones bound functions', () => {
        function fn(x) { return this*x };
        const orig = fn.bind(3);
        orig.x = {};
        const copy = clone(orig);
        expect(copy.name).toBe(orig.name);
        expect(copy(2)).toBe(6);
        // expect(copy).not.toBe(orig);
        expect(copy.x).toBe(orig.x);
    });

    it('clones native functions', () => {
        const copy = clone(Math.floor);
        expect(copy.name).toBe(Math.floor.name);
        expect(copy(3.14)).toBe(3);
        // expect(copy).not.toBe(orig);
    });
})