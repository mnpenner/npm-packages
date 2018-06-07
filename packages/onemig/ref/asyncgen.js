async function foo() {
    try {
        for await (const x of [resolveAfter(2000),resolveAfter(1000),resolveAfter(3000)]) {
            console.log('loop',x);
        }
    } catch (e) {
        console.log('catch',e);
    }
}
function resolveAfter(time) {
    return new Promise(resolve => setTimeout(() => resolve('ok'), time));
}
function rejectAfter(time) {
    return new Promise((resolve, reject) => setTimeout(() => reject('error'), time));
}
foo();