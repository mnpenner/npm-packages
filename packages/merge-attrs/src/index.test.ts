import mergeAttrs from './index';


describe(mergeAttrs.name, () => {
    it('merges basic attributes', () => {
        expect(mergeAttrs({foo: 'bar'}, {baz: 'quux'})).toEqual({foo: 'bar', baz: 'quux'});
    });

    it('merges class names', () => {
        expect(
            mergeAttrs(
                {className: 'foo'},
                {className: 'bar'}
            )
        ).toEqual(
            {className: 'foo bar'}
        );

        expect(
            mergeAttrs(
                {className: 'foo'},
                {className: ['bar','baz',null,false,undefined,'quux']}
            )
        ).toEqual(
            {className: 'foo bar baz quux'}
        );

        expect(
            mergeAttrs({className: {foo:true,bar:false,baz:undefined}})
        ).toEqual(
            {className: 'foo'}
        );
    });

    it('merges styles', () => {
        expect(
            mergeAttrs(
                {
                    style: {
                        color: 'red',
                        fontSize: 200,
                    }
                },
                {
                    style: {
                        color: 'blue',
                        fontFamily: 'verdana',
                    },
                }
            )
        ).toEqual(
            {
                style: {
                    color: 'blue',
                    fontFamily: 'verdana',
                    fontSize: 200,
                },
            }
        );
    });

    it('merges event handlers', () => {
        const noop = () => {};
        let result1 = mergeAttrs({onClick: noop},{onClick:undefined});
        expect(result1.onClick).toBe(noop);

        const val = Symbol('mock');
        const handler1 = jest.fn(() => val);
        const handler2 = jest.fn();
        let result2 = mergeAttrs({onClick: handler1},{onClick:handler2});
        const ev = {};
        result2.onClick(ev);
        expect(handler1).toBeCalledWith(ev);
        expect(handler2).toBeCalledWith(ev, val);
    });

    it('merges refs', () => {
        const val = Symbol('mock');
        const handler1 = jest.fn(() => val);
        const handler2 = jest.fn();
        let result2 = mergeAttrs({ref: handler1},{ref:handler2});
        const node = {};
        result2.ref(node);
        expect(handler1).toBeCalledWith(node);
        expect(handler2).toBeCalledWith(node, val);
    });
});