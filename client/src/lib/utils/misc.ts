// Some functions are inspired from https://github.com/monkeytypegame/monkeytype/blob/master/frontend/src/ts/utils/misc.ts

function prefersReducedMotion(): boolean {
    return window.matchMedia("(prefers-reduced-motion)").matches;
}

function applyReducedMotion(animationTime: number): number {
    return prefersReducedMotion() ? 0 : animationTime;
}

function isDevEnvironment(): boolean {
    return import.meta.env.DEV;
}

export { applyReducedMotion, isDevEnvironment, prefersReducedMotion };
