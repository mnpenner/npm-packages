import chain from './chain';
import {filterMap} from './Collection';

/**
 * Filter-map. Like map, but you may omit entries by returning `__skip__`.
 *
 * @param callback
 */
const fmap = chain(filterMap);
export default fmap;
