

let small = Infinity;

for(let i=0; i<1000; ++i) {
    const a = Bun.nanoseconds()
    const b = Bun.nanoseconds()
    // const [a,b] = [performance.now(), performance.now()];
    const diff = b-a
    if(diff < small) {
        small = diff
    }
}

console.log(small);
