import Konsole from './Konsole';
import spinners from '../spinners';
const frames = spinners.dots12.frames;

export default class SpinnerKonsole extends Konsole {

    constructor() {
        super();
        this.i = 0;
    }
    
    rewrite(str) {
        super.rewrite(frames[this.i] + ' ' + str);
        this.i = (this.i + 1) % frames.length;
    }
}