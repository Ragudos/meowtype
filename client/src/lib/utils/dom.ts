type DomMetadata = {
    /**
     *
     * An element's row idx based
     * on its parent.
     */
    rowIdx: number;
    element: HTMLElement;

    /**
     *
     * All DOM properties of `element` upon the retrieval
     * of the `element`'s DOMRect.
     */
    domRect: DOMRect;
};

/**
 *
 * Gets all the dom metadata of the children of `element`. Note
 * that this is only one level deep.
 *
 * @param element The parent element
 */
function getDomMetadataOfChildren(element: HTMLElement): DomMetadata[] {
    const results: DomMetadata[] = [];
    let siblingRect: DOMRect | undefined;
    let currRowIdx = 0;

    for (let i = 0, l = element.children.length; i < l; ++i) {
        const child = element.children[i] as HTMLElement;
        const domRect = child.getBoundingClientRect();

        if (i === 0) {
            results.push({
                element: child,
                domRect,
                rowIdx: 0,
            });

            siblingRect = domRect;

            continue;
        }

        if (siblingRect!.top < domRect.top) {
            currRowIdx += 1;
        }

        results.push({
            domRect,
            element: child,
            rowIdx: currRowIdx,
        });

        siblingRect = domRect;
    }

    return results;
}

export { getDomMetadataOfChildren };
export type { DomMetadata };
