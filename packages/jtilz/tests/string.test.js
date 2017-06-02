import * as String from '../src/string'; 
import {replaceAll} from '../dist/node';

describe('replaceAll', () => {
    it('should replace all occurrences', () => {
        expect(replaceAll('ababa','b','x')).toBe('axaxa');
    });
    it('should work when called with bind operator', () => {
        expect(replaceAll.call('ababa','b','x')).toBe('axaxa');
    });
    it('should work when called with a context', () => {
        expect(String.replaceAll('ababa','b','x')).toBe('axaxa');
    });
});
