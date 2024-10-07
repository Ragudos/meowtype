function debounce(cb: Function, time: number): (...args: unknown[]) => void {
    if (time <= 0) {
        throw new RangeError("Invalid time");
    }

    let timeoutId: number;

    return function (...args: unknown[]) {
        clearTimeout(timeoutId);

        timeoutId = setTimeout(() => {
            // @ts-ignore
            cb.apply(this, args);
        }, time);
    };
}

function sleep(duration: number): Promise<void> {
    return new Promise((res) => setTimeout(res, duration));
}

function clearTimeouts(timeouts: number[]): void {
    for (let i = 0, l = timeouts.length; i < l; ++i) {
        clearTimeout(timeouts[i]);
    }
}

export { clearTimeouts, debounce, sleep };

