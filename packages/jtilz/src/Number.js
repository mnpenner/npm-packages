import bindable from './bindable';

/**
 * Converts a decimal number to hexidecimal.
 * 
 * @param {Number} num
 * @return {string}
 */
export const toHex = bindable(num => {
        if(num < 0) {
            num = 0xFFFFFFFF + num + 1;
        }

        return num.toString(16);
    }
);
