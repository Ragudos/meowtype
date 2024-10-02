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

export { debounce };
