module.exports = String.prototype.padStart 
    ? (str, targetLength, padString) => String(str).padStart(targetLength, padString)
    : (str, targetLength, padString) => {
        str = String(str);
        let padLen = targetLength - str.length; 
        if(padLen > 0) {
            return padString.repeat(padLen) + str;
        }
        return str;
    };