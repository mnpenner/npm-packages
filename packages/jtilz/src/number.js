export function dec2hex(num) {
    if(num < 0) {
        num = 0xFFFFFFFF + num + 1;
    }

    return num.toString(16).toUpperCase();
}