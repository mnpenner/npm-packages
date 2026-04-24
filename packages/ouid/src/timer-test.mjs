function getBestTimer() {
    // Helper to measure the smallest detectable difference
    const measurePrecision = (timeFn, scale = 1, isBigInt = false) => {
        let minDiff = Infinity;
        const iterations = 1000; // Test multiple times for reliability
        for (let i = 0; i < iterations; i++) {
            const start = timeFn();
            let end;
            do {
                end = timeFn();
            } while (end === start); // Spin until we detect a change
            const diff = isBigInt ? Number(end - start) : (end - start) * scale;
            if (diff < minDiff) minDiff = diff;
        }
        return minDiff;
    };

    // Store available timers with their precision and metadata
    const timers = [];

    // 1. Bun.nanoseconds (nanosecond precision, Bun-specific)
    if (typeof Bun !== "undefined" && typeof Bun.nanoseconds === "function") {
        timers.push({
            name: "Bun.nanoseconds",
            fn: Bun.nanoseconds,
            precision: measurePrecision(Bun.nanoseconds),
            scale: 1n,
            normalize: (val) => BigInt(Math.round(val)) // Convert to BigInt ns
        });
    }

    // 2. Node.js process.hrtime.bigint (nanosecond precision, Node-specific)
    if (typeof process !== "undefined" && typeof process.hrtime === "function" && typeof process.hrtime.bigint === "function") {
        timers.push({
            name: "process.hrtime.bigint",
            fn: process.hrtime.bigint,
            precision: measurePrecision(process.hrtime.bigint, 1, true),
            scale: 1n,
            normalize: (val) => val // Already BigInt ns
        });
    }

    // 3. performance.now (microsecond precision, widely available)
    // Ensure performance.now is callable and not just defined
    if (typeof performance !== "undefined" && typeof performance.now === "function") {
        try {
            performance.now(); // Test if it works without throwing
            timers.push({
                name: "performance.now",
                fn: performance.now.bind(performance),
                precision: measurePrecision(performance.now.bind(performance), 1e6), // ms to ns
                scale: 1_000_000n,
                normalize: (val) => BigInt(Math.round(val * 1000000)) // ms to BigInt ns
            });
        } catch (e) {
            // Skip performance.now if it fails (e.g., in Node without proper import)
            console.warn("performance.now is present but not usable:", e.message);
        }
    }

    // 4. Date.now (millisecond precision, universally available)
    if (typeof Date.now === "function") {
        timers.push({
            name: "Date.now",
            fn: Date.now,
            precision: measurePrecision(Date.now, 1e6), // ms to ns
            scale: 1000000n,
            normalize: (val) => BigInt(val) * 1000000n // ms to BigInt ns
        });
    }

    // If no timers are available, throw an error
    if (timers.length === 0) {
        throw new Error("No timing function available in this environment");
    }

    // Find the timer with the smallest precision (highest resolution)
    const bestTimer = timers.reduce((best, current) =>
        current.precision < best.precision ? current : best
    );

    // Log the selected timer
    console.log(`Selected timer: ${bestTimer.name} (precision: ${bestTimer.precision} ns)`);

    // Return a normalized function that outputs nanoseconds as BigInt
    return () => bestTimer.normalize(bestTimer.fn());
}

// Example usage in Node.js
const timer = getBestTimer();
console.log(timer()); // Logs current time in nanoseconds as BigInt (e.g., 1234567890n)
