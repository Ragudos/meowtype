import { getItemAt } from "@/lib/utils/misc";
import { DefaultTypingModeStateEvent } from "./state";
import { TypedWord, Word } from "./typing";

class Caret {
    readonly caretElId: string;

    /**
     *
     * @param caretElId The id of the element this caret pertains to
     */
    constructor(caretElId: string) {
        this.caretElId = caretElId;
    }

    update(
        ev: DefaultTypingModeStateEvent,
        wordsContainer: HTMLElement,
        words: Word[],
        typedWords: TypedWord[],
    ): void {
        const caretEl = this.#getCaretEl();
        const wordBeingTyped = getItemAt(words, 0);
        const wordEl = wordsContainer.children[
            wordBeingTyped.idx.relative
        ] as HTMLElement;

        let caretTargetBoundingRect: undefined | DOMRect;
        let isEndOfWord: boolean = false;

        switch (ev.evType) {
            case "addChar":
            case "deleteChar":
            case "backToPrevWord":
                {
                    const latestCharacterTyped =
                        wordBeingTyped.typedCharacters.length !== 0
                            ? getItemAt(wordBeingTyped.typedCharacters, -1)
                            : getItemAt(wordBeingTyped.characters, 0);

                    const nextCharIdx = latestCharacterTyped.idx.relative + 1;

                    if (nextCharIdx === wordEl.children.length) {
                        isEndOfWord = true;
                    }

                    const latestCharEl =
                        wordEl.children[
                            (latestCharacterTyped.idx.relative === 0 &&
                                wordBeingTyped.typedCharacters.length === 0) ||
                            isEndOfWord
                                ? latestCharacterTyped.idx.relative
                                : nextCharIdx
                        ];

                    caretTargetBoundingRect =
                        latestCharEl.getBoundingClientRect();
                }
                break;
            case "nextWord":
                {
                    // wordEl IS the "nextWord" in the context when
                    // this function is called
                    const characterToBeTyped = getItemAt(
                        wordBeingTyped.characters,
                        0,
                    );
                    const nextCharIdx = characterToBeTyped.idx.relative + 1;

                    // for single letter words
                    if (nextCharIdx === wordEl.children.length) {
                        isEndOfWord = true;
                    }

                    const charEl =
                        wordEl.children[
                            characterToBeTyped.idx.relative === 0 || isEndOfWord
                                ? characterToBeTyped.idx.relative
                                : nextCharIdx
                        ];

                    caretTargetBoundingRect = charEl.getBoundingClientRect();
                }
                break;
        }

        const wordsContainerBoundingRect =
            wordsContainer.getBoundingClientRect();

        if (caretTargetBoundingRect === undefined) {
            // TODO: hide caret
            return;
        }

        let caretElWidth: number;
        let caretElLeft: number;

        if (isEndOfWord) {
            if (words.length === 1) {
                // TODO: we just hide caret or something.
                return;
            }

            const nextWord = getItemAt(words, 1);
            const nextWordEl = wordsContainer.children[nextWord.idx.relative];
            const nextWordBoundingRect = nextWordEl.getBoundingClientRect();
            const wordElBoundingRect = wordEl.getBoundingClientRect();

            // if not on same row
            if (wordElBoundingRect.top !== nextWordBoundingRect.top) {
                caretElWidth = caretTargetBoundingRect.width;
            } else {
                caretElWidth =
                    nextWordBoundingRect.left -
                    wordsContainerBoundingRect.left -
                    (wordElBoundingRect.left -
                        wordsContainerBoundingRect.left +
                        wordElBoundingRect.width);
            }

            caretElLeft =
                wordElBoundingRect.left -
                wordsContainerBoundingRect.left +
                wordElBoundingRect.width;
        } else {
            caretElWidth = caretTargetBoundingRect.width;
            caretElLeft =
                caretTargetBoundingRect.left - wordsContainerBoundingRect.left;
        }

        caretEl.style.setProperty("--_width", caretElWidth + "px");
        caretEl.style.setProperty(
            "--_height",
            caretTargetBoundingRect.height + "px",
        );
        caretEl.style.setProperty("--_x", caretElLeft + "px");
        caretEl.style.setProperty(
            "--_y",
            caretTargetBoundingRect.top - wordsContainerBoundingRect.top + "px",
        );
    }

    #getCaretEl(): HTMLElement {
        const caretEl = document.getElementById(this.caretElId);

        if (!(caretEl instanceof HTMLElement)) {
            throw new Error(
                `Element with id ${this.caretElId} is not a HTMLElement or does not exist.`,
            );
        }

        return caretEl;
    }
}

export default Caret;
