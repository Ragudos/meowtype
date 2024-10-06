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
    return new Promise((res, rej) => {
        setTimeout(res, duration);
    });
}

export { debounce, sleep };

