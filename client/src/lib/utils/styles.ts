function getTransitionDuration(el: HTMLElement): number {
    const transitionDuration = window.getComputedStyle(el).transitionDuration;

    if (transitionDuration.includes("s")) {
        return parseFloat(transitionDuration) * 1000;
    }

    return parseFloat(transitionDuration);
}

export { getTransitionDuration };
