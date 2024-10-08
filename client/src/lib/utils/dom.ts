import { getTransitionDuration } from "./misc";
import { sleep } from "./time";

async function swapElements(el1: Element, el2: Element): Promise<void> {
    if (el1.classList.contains("hidden") && !el2.classList.contains("hidden")) {
        el2.classList.add("fade-out");

        const el2Duration = getTransitionDuration(el2);

        await sleep(el2Duration);

        el2.classList.add("hidden");
        el2.classList.remove("fade-out");

        el1.classList.remove("hidden");
        el1.classList.add("fade-in");

        const el1Duration = getTransitionDuration(el1);

        await sleep(el1Duration);

        el1.classList.remove("fade-in");
    } else if (
        !el1.classList.contains("hidden") &&
        el2.classList.contains("hidden")
    ) {
        el1.classList.add("fade-out");

        const el1Duration = getTransitionDuration(el1);

        await sleep(el1Duration);

        el1.classList.add("hidden");
        el1.classList.remove("fade-out");

        el2.classList.remove("hidden");
        el2.classList.add("fade-in");

        const el2Duration = getTransitionDuration(el2);

        await sleep(el2Duration);

        el2.classList.remove("fade-in");
        // Only fade in second
    } else if (
        el1.classList.contains("hidden") &&
        el2.classList.contains("hidden")
    ) {
        el2.classList.remove("hidden");
        el2.classList.add("fade-in");

        const el2Duration = getTransitionDuration(el2);

        await sleep(el2Duration);

        el2.classList.remove("fade-in");
    }
}

function loadCss(href: string, prepend = false): void {
    const link = document.createElement("link");

    link.type = "text/css";
    link.rel = "stylesheet";
    link.href = href;

    const head = document.getElementsByTagName("head")[0];

    if (head === undefined) {
        throw new Error("Failed to load CSS - `head` is undefined");
    }

    if (prepend) {
        head.prepend(link);
    } else {
        head.appendChild(link);
    }
}

/**
 *
 * Returns an element's row index position among the children of a
 * container.
 *
 * @param element
 * @param container
 * @returns
 */
function getElementRow(element: Element, container: Element): number {
    if (element === container.children[0]) {
        return 0;
    }

    const elBoundingRect = element.getBoundingClientRect();

    let currRow = 0;
    let lastOffsetTop = container.children[0].getBoundingClientRect().top;

    for (let i = 1, l = container.children.length; i < l; ++i) {
        const currEl = container.children[i];

        if (currEl === element) {
            return currRow;
        }

        if (elBoundingRect.top > lastOffsetTop) {
            currRow += 1;
            lastOffsetTop = currEl.getBoundingClientRect().top;
        }
    }

    return currRow;
}

export { getElementRow, loadCss, swapElements };

