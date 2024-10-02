function getItemAt<T>(arr: Array<T>, index: number): T {
    const finalIndex = index < 0 ? arr.length + index : index;

    if (finalIndex < 0) {
        throw new RangeError(`Index ${index} out of bounds`);
    }

    return arr[finalIndex];
}

export { getItemAt };
