/**
 * @fileoverview Everything needed for the
 * default typing mode.
 */

import { getItemAt } from "@/lib/utils/array";
import DefaultTypingModeState, { DefaultTypingModeStateEvent } from "./state";

type Character = {
    /** Position of character in the word it's in */
    idx: number;
    /**
     *
     * Position of character in original string.
     * Will be -1 if this character is of type
     *
     * {@link TypedCharacter}
     */
    originalIdx: number;
    value: string;
};

type TypedCharacter = Character & {
    /** Whether this letter is originally not part of the word it's in */
    isExtra: boolean;
    typedValue: string;
};

type Word = {
    /** Original word's size (excludes extra typed characters) */
    readonly characterCount: number;

    typedCharacters: TypedCharacter[];
    characters: Character[];
    /** Index of word in original string it's in */
    index: number;
};

type TypedWord = Word & {
    isCorrect: boolean;
};

/**
 *
 * @param word
 *
 * @returns A new object containing a copy of `word` and properties of {@link TypedWord} that's not in
 * `word`.
 *
 * @throws {Error} if `word` still has characters to be typed
 */
function wordToTypedWord(word: Word): TypedWord {
    if (word.characters.length !== 0) {
        throw new Error(
            `Word still has ${word.characters.length} characters to be typed.`,
        );
    }

    return {
        ...word,
        isCorrect: word.typedCharacters.every(
            (c) => c.value === c.typedValue && !c.isExtra,
        ),
    };
}

function typedCharacterToCharacter(typedChar: TypedCharacter): Character {
    return {
        value: typedChar.value,
        idx: typedChar.idx,
        originalIdx: typedChar.originalIdx,
    };
}

class DefaultTypingMode {
    #state: DefaultTypingModeState;

    /**
     * Since we `bind` this to the #onKeyDown member,
     * I need to store the result here.
     */
    readonly #keydownListener: (ev: KeyboardEvent) => void;
    readonly #focusListener: (ev: MouseEvent) => void;
    readonly #stateEvtListener: (ev: DefaultTypingModeStateEvent) => void;
    readonly inputId: string;
    readonly wordsContainerId: string;

    /**
     *
     * @param inputId id of input element to listen to
     * @param wordsContainerId id of container to append words to
     * @param strToType word to type for this typing mode
     */
    constructor(inputId: string, wordsContainerId: string, strToType: string) {
        this.inputId = inputId;
        this.wordsContainerId = wordsContainerId;

        this.#state = new DefaultTypingModeState(strToType);

        this.#keydownListener = this.#onKeyDown.bind(this);
        this.#focusListener = this.#onContainerClick.bind(this);
        this.#stateEvtListener = this.#onStateUpdate.bind(this);
    }

    start(): void {
        if (this.#state.hasStarted || this.#state.isFinished) {
            return;
        }

        const input = this.#getInput();
        const wordsContainer = this.#getWordsContainer();

        input.addEventListener("keydown", this.#keydownListener);
        wordsContainer.addEventListener("click", this.#focusListener);
        this.#state.evtObserver.subscribe(this.#stateEvtListener);

        this.#state.hasStarted = true;

        this.#initializeWordsContainer();
    }

    stop(): void {
        if (!this.#state.hasStarted) {
            return;
        }

        const input = this.#getInput();
        const wordsContainer = this.#getWordsContainer();

        input.removeEventListener("keydown", this.#keydownListener);
        wordsContainer.removeEventListener("click", this.#focusListener);
        this.#state.evtObserver.unsubscribe(this.#stateEvtListener);

        this.#state.hasStarted = false;
    }

    #getInput(): HTMLInputElement {
        const input = document.getElementById(this.inputId);

        if (!(input instanceof HTMLInputElement)) {
            throw new Error(
                `Input with id ${this.inputId} does not exist or not a HTMLInputElement.`,
            );
        }

        return input;
    }

    #getWordsContainer(): HTMLElement {
        const wordsContainer = document.getElementById(this.wordsContainerId);

        if (!(wordsContainer instanceof HTMLElement)) {
            throw new Error(
                `Element with id ${this.wordsContainerId} does not exist or not a HTMLElement.`,
            );
        }

        return wordsContainer;
    }

    #onKeyDown(ev: KeyboardEvent): void {
        const key = ev.key;

        switch (key) {
            case "Control":
            case "Shift":
            case "Tab":
            case "Escape":
            case "Meta":
            case "Alt":
                return;

            case "ArrowDown":
            case "ArrowLeft":
            case "ArrowUp":
            case "ArrowRight":
                return ev.preventDefault();

            case "Enter":
                // TODO
                break;

            case "Backspace":
                this.#state.backspace(ev);
                break;

            default:
                this.#state.addCharacter(ev);
        }
    }

    #onContainerClick(ev: MouseEvent): void {
        const input = this.#getInput();

        input.focus();
    }

    #isTypedCharacter(
        character: Character | TypedCharacter,
    ): character is TypedCharacter {
        return "typedValue" in character && "isExtra" in character;
    }

    #appendCharacterToWordEl(
        wordEl: HTMLElement,
        character: Character | TypedCharacter,
    ): void {
        const letter = document.createElement("letter");

        if (this.#isTypedCharacter(character)) {
            if (
                character.typedValue === character.value &&
                !character.isExtra
            ) {
                letter.setAttribute("data-correct", "true");
            } else {
                letter.setAttribute("data-correct", "false");
            }

            if (character.isExtra) {
                letter.setAttribute("data-extra", "true");
            }
        }

        letter.textContent = character.value;

        wordEl.appendChild(letter);
    }

    #appendCharactersOfWord(wordEl: HTMLElement, word: Word | TypedWord): void {
        for (let i = 0, l = word.typedCharacters.length; i < l; ++i) {
            this.#appendCharacterToWordEl(wordEl, word.typedCharacters[i]);
        }
        for (let i = 0, l = word.characters.length; i < l; ++i) {
            this.#appendCharacterToWordEl(wordEl, word.characters[i]);
        }
    }

    #initializeWordsContainer(): void {
        const wordsContainer = this.#getWordsContainer();

        if (wordsContainer.classList.contains("initialized")) {
            return;
        }

        for (let i = 0, l = this.#state.words.length; i < l; ++i) {
            const wordEl = document.createElement("div");
            const word = this.#state.words[i];

            wordEl.classList.add("word");

            if (i === 0) {
                wordEl.classList.add("active");
            }

            this.#appendCharactersOfWord(wordEl, word);
            wordsContainer.appendChild(wordEl);
        }

        for (let i = 0, l = this.#state.typedWords.length; i < l; ++i) {
            const wordEl = document.createElement("div");
            const word = this.#state.words[i];

            wordEl.classList.add("word", "typed");
            this.#appendCharactersOfWord(wordEl, word);
            wordsContainer.appendChild(wordEl);
        }

        wordsContainer.classList.add("initialized");
    }

    #onStateUpdate(ev: DefaultTypingModeStateEvent): void {
        // TODO: A way to verify if the el at idx is the same as the word in memory.
        const wordsContainer = this.#getWordsContainer();

        switch (ev.evType) {
            case "addChar":
                {
                    const wordBeingTyped = getItemAt(this.#state.words, 0);
                    const wordBeingTypedIdx = wordBeingTyped.index;
                    const wordEl = wordsContainer.children[
                        wordBeingTypedIdx
                    ] as HTMLElement;
                    const latestCharacterTyped = getItemAt(
                        wordBeingTyped.typedCharacters,
                        -1,
                    );
                    const latestCharacterTypedIdx = latestCharacterTyped.idx;

                    if (latestCharacterTyped.isExtra) {
                        const charEl = document.createElement("letter");

                        charEl.classList.add("incorrect", "extra");
                        charEl.textContent = latestCharacterTyped.value;

                        wordEl.appendChild(charEl);

                        return;
                    }

                    const charEl = wordEl.children[latestCharacterTypedIdx];

                    if (
                        latestCharacterTyped.typedValue ===
                        latestCharacterTyped.value
                    ) {
                        charEl.classList.add("correct");
                    } else {
                        charEl.classList.add("incorrect");
                    }
                }
                break;
            case "deleteChar":
                {
                    const wordBeingTyped = getItemAt(this.#state.words, 0);
                    const wordBeingTypedIdx = wordBeingTyped.index;
                    const wordEl = wordsContainer.children[
                        wordBeingTypedIdx
                    ] as HTMLElement;
                    const HAS_EXTRA_CHARS =
                        wordBeingTyped.typedCharacters.length >=
                        wordBeingTyped.characterCount;

                    if (HAS_EXTRA_CHARS) {
                        const latestTypedCharacter = getItemAt(
                            wordBeingTyped.typedCharacters,
                            -1,
                        );
                        const latestTypedCharacterIdx =
                            latestTypedCharacter.idx;

                        wordEl.children[latestTypedCharacterIdx + 1].remove();

                        return;
                    }

                    const latestDeletedChar = getItemAt(
                        wordBeingTyped.characters,
                        0,
                    );
                    const latestCharacterTypedIdx = latestDeletedChar.idx;
                    const charEl = wordEl.children[latestCharacterTypedIdx];

                    charEl.classList.remove("correct", "incorrect");
                }

                break;
            case "backToPrevWord":
                {
                    // This is the previous word
                    const wordBeingTyped = getItemAt(this.#state.words, 0);
                    const wordBeingTypedIdx = wordBeingTyped.index;
                    const previouslyTypedWordIdx = wordBeingTypedIdx + 1;

                    const wordBeingTypedEl =
                        wordsContainer.children[wordBeingTypedIdx];
                    const previouslyTypedWordEl =
                        wordsContainer.children[previouslyTypedWordIdx];

                    previouslyTypedWordEl.classList.remove(
                        "active",
                        "correct",
                        "typed",
                    );

                    wordBeingTypedEl.classList.add("active");
                    wordBeingTypedEl.classList.remove(
                        "correct",
                        "incorrect",
                        "typed",
                    );
                }
                break;
            case "nextWord":
                {
                    const wordBeingTyped = getItemAt(this.#state.words, 0);
                    const latestTypedWord = getItemAt(
                        this.#state.typedWords,
                        -1,
                    );
                    const wordBeingTypedIdx = wordBeingTyped.index;
                    const latestTypedWordIdx = latestTypedWord.index;

                    const wordBeingTypedEl =
                        wordsContainer.children[wordBeingTypedIdx];
                    const latestTypedWordEl =
                        wordsContainer.children[latestTypedWordIdx];

                    wordBeingTypedEl.classList.add("active");

                    latestTypedWordEl.classList.remove("active");
                    latestTypedWordEl.classList.add(
                        latestTypedWord.isCorrect ? "correct" : "incorrect",
                        "typed",
                    );
                }
                break;
        }
    }
}

export default DefaultTypingMode;
export { typedCharacterToCharacter, wordToTypedWord };
export type { Character, TypedCharacter, TypedWord, Word };
