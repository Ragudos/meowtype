/**
 * @fileoverview Everything needed for the
 * default typing mode.
 */

import { getItemAt } from "@/lib/utils/array";
import { DomMetadata, getDomMetadataOfChildren } from "@/lib/utils/dom";
import Caret from "./caret";
import DefaultTypingModeState, { DefaultTypingModeStateEvent } from "./state";

type Idx = {
    /** absolute idx in the word or string it's in */
    absolute: number;
    /**
     * relative idx where it changes based
     * on its position in word or string it's in.
     * will be negative if shifted (deleted) from string
     */
    relative: number;
};

type Character = {
    /** Position of character in the word it's in */
    idx: Idx;
    /**
     *
     * Position of character in original string.
     * Will be -1 if this character is of type
     *
     * {@link TypedCharacter}
     *
     * and `isExtra` is true
     */
    originalIdx: Idx;
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
    idx: Idx;
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
    #wordsMetadata: DomMetadata[];
    /** Typed words removed from the DOM */
    #removedWords: TypedWord[];

    /**
     * Since we `bind` this to the #onKeyDown member,
     * I need to store the result here.
     */
    readonly #keydownListener: (ev: KeyboardEvent) => void;
    readonly #focusListener: (ev: MouseEvent) => void;
    readonly #stateEvtListener: (ev: DefaultTypingModeStateEvent) => void;
    readonly inputId: string;
    readonly wordsContainerId: string;
    readonly caret: Caret;

    /**
     *
     * @param inputId id of input element to listen to
     * @param wordsContainerId id of container to append words to
     * @param caretElId id of caret element
     * @param strToType word to type for this typing mode
     */
    constructor(
        inputId: string,
        wordsContainerId: string,
        caretElId: string,
        strToType: string,
    ) {
        this.inputId = inputId;
        this.wordsContainerId = wordsContainerId;

        this.#state = new DefaultTypingModeState(strToType);

        this.#keydownListener = this.#onKeyDown.bind(this);
        this.#focusListener = this.#onContainerClick.bind(this);
        this.#stateEvtListener = this.#onStateUpdate.bind(this);
        this.#removedWords = [];

        this.caret = new Caret(caretElId);
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
        // init
        this.caret.update(
            { evType: "addChar" },
            this.#getWordsContainer(),
            this.#state.words,
            this.#state.typedWords,
        );
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

        console.log(this);
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

        this.#wordsMetadata = getDomMetadataOfChildren(wordsContainer);
    }

    #onStateUpdate(ev: DefaultTypingModeStateEvent): void {
        // TODO: A way to verify if the el at idx is the same as the word in memory.
        const wordsContainer = this.#getWordsContainer();
        const wordBeingTyped = getItemAt(this.#state.words, 0);
        const wordEl = wordsContainer.children[
            wordBeingTyped.idx.relative
        ] as HTMLElement;

        switch (ev.evType) {
            case "addChar":
                {
                    const latestCharacterTyped = getItemAt(
                        wordBeingTyped.typedCharacters,
                        -1,
                    );

                    if (latestCharacterTyped.isExtra) {
                        const charEl = document.createElement("letter");

                        charEl.classList.add("incorrect", "extra");
                        charEl.textContent = latestCharacterTyped.value;

                        wordEl.appendChild(charEl);

                        break;
                    }

                    const charEl =
                        wordEl.children[latestCharacterTyped.idx.relative];

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
                    const HAS_EXTRA_CHARS =
                        wordBeingTyped.typedCharacters.length >=
                        wordBeingTyped.characterCount;

                    if (HAS_EXTRA_CHARS) {
                        const latestTypedCharacter = getItemAt(
                            wordBeingTyped.typedCharacters,
                            -1,
                        );

                        wordEl.children[
                            latestTypedCharacter.idx.relative + 1
                        ].remove();

                        break;
                    }

                    const latestDeletedChar = getItemAt(
                        wordBeingTyped.characters,
                        0,
                    );
                    const charEl =
                        wordEl.children[latestDeletedChar.idx.relative];

                    charEl.classList.remove("correct", "incorrect");
                }

                break;
            case "backToPrevWord":
                {
                    const previouslyTypedWordIdx =
                        wordBeingTyped.idx.relative + 1;
                    const previouslyTypedWordEl =
                        wordsContainer.children[previouslyTypedWordIdx];

                    previouslyTypedWordEl.classList.remove(
                        "active",
                        "correct",
                        "typed",
                    );

                    wordEl.classList.add("active");
                    wordEl.classList.remove("correct", "incorrect", "typed");
                }
                break;
            case "nextWord":
                {
                    const latestTypedWord = getItemAt(
                        this.#state.typedWords,
                        -1,
                    );
                    const latestTypedWordEl =
                        wordsContainer.children[latestTypedWord.idx.relative];

                    wordEl.classList.add("active");

                    latestTypedWordEl.classList.remove("active");
                    latestTypedWordEl.classList.add(
                        latestTypedWord.isCorrect ? "correct" : "incorrect",
                        "typed",
                    );
                }
                break;
        }

        this.caret.update(
            ev,
            wordsContainer,
            this.#state.words,
            this.#state.typedWords,
        );

        // TODO: Abstract this and make it more readable
        if (ev.evType === "nextWord") {
            const idxOfLastItemInFirstRow = this.#wordsMetadata.findIndex(
                (v, i) =>
                    v.rowIdx == 0 &&
                    this.#wordsMetadata[i + 1] &&
                    this.#wordsMetadata[i + 1].rowIdx == 1,
            );
            const wordElMetadata =
                this.#wordsMetadata[wordBeingTyped.idx.relative];

            // TODO: Also update the removedWord's properties
            if (wordElMetadata.rowIdx == 2) {
                const lastNonExtraCharOfLastItemInFirstRow = getItemAt(
                    this.#state.typedWords,
                    idxOfLastItemInFirstRow,
                ).typedCharacters.findLast((v) => !v.isExtra);

                let currCharOrigIdx =
                    (lastNonExtraCharOfLastItemInFirstRow!.originalIdx
                        .relative +
                        // +2 to take the length and whitespace into account
                        2) *
                    -1;

                for (let i = 0, l = this.#state.typedWords.length; i < l; ++i) {
                    const typedWord = this.#state.typedWords[i];

                    typedWord.idx.relative = i - (idxOfLastItemInFirstRow + 1);

                    for (
                        let j = 0, jl = typedWord.typedCharacters.length;
                        j < jl;
                        ++j
                    ) {
                        const char = typedWord.typedCharacters[j];

                        if (!char.isExtra) {
                            char.originalIdx.relative = currCharOrigIdx + j;
                        } else {
                            break;
                        }
                    }

                    currCharOrigIdx += typedWord.characterCount + 1;
                }

                for (let i = 0, l = this.#state.words.length; i < l; ++i) {
                    const word = this.#state.words[i];

                    word.idx.relative =
                        i -
                        (idxOfLastItemInFirstRow + 1) +
                        this.#state.typedWords.length;

                    for (
                        let j = 0, jl = word.typedCharacters.length;
                        j < jl;
                        ++j
                    ) {
                        word.typedCharacters[j].originalIdx.relative =
                            currCharOrigIdx;
                        currCharOrigIdx += 1;
                    }

                    for (let j = 0, jl = word.characters.length; j < jl; ++j) {
                        word.characters[j].originalIdx.relative =
                            currCharOrigIdx;
                        currCharOrigIdx += 1;
                    }

                    currCharOrigIdx += 1;
                }

                this.#removedWords.push(
                    ...this.#state.typedWords.splice(
                        0,
                        idxOfLastItemInFirstRow + 1,
                    ),
                );
                this.#wordsMetadata.splice(0, idxOfLastItemInFirstRow + 1);

                const toRemove: Element[] = [];

                for (let i = 0; i <= idxOfLastItemInFirstRow; ++i) {
                    toRemove.push(wordsContainer.children[i]);
                }

                for (let i = 0, l = toRemove.length; i < l; ++i) {
                    toRemove[i].remove();
                }

                this.#wordsMetadata = getDomMetadataOfChildren(wordsContainer);
                this.caret.update(
                    { evType: "nextWord" },
                    wordsContainer,
                    this.#state.words,
                    this.#state.typedWords,
                );
            }
        }
    }
}

export default DefaultTypingMode;
export { typedCharacterToCharacter, wordToTypedWord };
export type { Character, TypedCharacter, TypedWord, Word };

