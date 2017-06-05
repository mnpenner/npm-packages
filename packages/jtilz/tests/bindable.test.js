import * as String from '../src/string'; 
import {replaceAll} from '../dist/node';
import Jtilz from '../dist/web';

describe('replaceAll', () => {
    it('should replace all occurrences', () => {
        expect(replaceAll('ababa','b','x')).toBe('axaxa');
    });
    it('should work when called with the bind operator', () => {
        expect('ababa'::replaceAll('b','x')).toBe('axaxa');
    });
    it('should work when called with a context', () => {
        expect(String.replaceAll('ababa','b','x')).toBe('axaxa');
        expect(Jtilz.replaceAll('ababa','b','x')).toBe('axaxa');
    });
});
