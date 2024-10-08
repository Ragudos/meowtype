// Some functions are inspired from https://github.com/monkeytypegame/monkeytype/blob/master/frontend/src/ts/utils/misc.ts

function getTransitionDuration(el: Element): number {
    const transitionDuration = window.getComputedStyle(el).transitionDuration;

    if (transitionDuration.includes("s")) {
        return parseFloat(transitionDuration) * 1000;
    }

    return parseFloat(transitionDuration);
}

function prefersReducedMotion(): boolean {
    return window.matchMedia("(prefers-reduced-motion)").matches;
}

function applyReducedMotion(animationTime: number): number {
    return prefersReducedMotion() ? 0 : animationTime;
}

function isDevEnvironment(): boolean {
    return import.meta.env.DEV;
}

function getItemAt<T>(arr: ArrayLike<T>, index: number): T {
    const finalIndex = index < 0 ? arr.length + index : index;

    if (finalIndex < 0) {
        throw new RangeError(`Index ${index} out of bounds`);
    }

    return arr[finalIndex];
}

function isObject(obj: unknown): obj is Record<string, unknown> {
    return typeof obj === "object" && !Array.isArray(obj) && obj !== null;
}

function deepClone<T>(obj: T[]): T[];
function deepClone<T extends object>(obj: T): T;
function deepClone<T>(obj: T): T;
function deepClone<T>(obj: T | T[]): T | T[] {
    if (obj === null || typeof obj !== "object") {
        return obj;
    }

    if (Array.isArray(obj)) {
        return obj.map((t) => deepClone(t));
    }

    const cloneObj = {} as { [K in keyof T]: T[K] };

    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            cloneObj[key] = deepClone(obj[key]);
        }
    }

    return cloneObj;
}

function isNumber(num: unknown): num is number {
    const isFin = isFinite !== undefined ? isFinite : Number.isFinite;

    if (num === null || num === undefined) {
        return false;
    }

    if (typeof num === "string") {
        if (num.trim() === "") {
            return false;
        }

        num = +num;
    }

    return typeof num === "number" && !isNaN(num) && isFin(num);
}

export {
    applyReducedMotion,
    deepClone,
    getItemAt,
    getTransitionDuration,
    isDevEnvironment,
    isNumber,
    isObject,
    prefersReducedMotion,
};

