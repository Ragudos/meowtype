import Observer from "@/lib/state/observer";
import Settings from "@/lib/utils/config";
import { getItemAt, isDevEnvironment, isNumber } from "@/lib/utils/misc";
import { removeWhitespacesFromSplitString } from "@/lib/utils/string";
import { assert, nonempty, string } from "superstruct";

/**
 *
 * TODO: Calculation, end state and stopping on end and stuff.
 */

type Index = {
    /**
     *
     * relative idx where it changes based
     * on its position in word or string it's in.
     * will be negative if shifted (deleted) from string
     */
    rel: number;
    /**
     * absolute idx in the word or string it's in
     */
    abs: number;
};

type Character = {
    idx: Index;
    origIdx: Index;
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

    idx: Index;
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
        origIdx: typedChar.origIdx,
    };
}

function isIndex(idx: unknown): idx is Index {
    return (
        idx !== null &&
        typeof idx === "object" &&
        "rel" in idx &&
        isNumber(idx.rel) &&
        "abs" in idx &&
        isNumber(idx.abs)
    );
}

function isCharacter(char: unknown): char is Character {
    return (
        char !== null &&
        typeof char === "object" &&
        "idx" in char &&
        isIndex(char.idx) &&
        "origIdx" in char &&
        isIndex(char.origIdx) &&
        "value" in char &&
        typeof char.value === "string" &&
        char.value.length === 1
    );
}

function isTypedCharacter(char: unknown): char is TypedCharacter {
    return isCharacter(char) && "typedValue" in char && "isExtra" in char;
}

type TypingStateEvent =
    | {
          evType: "add";
          currWord: Word;
      }
    | {
          evType: "prev";
          currWord: Word;
          /** Since we're casting this from TypedWord to Word, the type is Word */
          prevWord: Word;
      }
    | {
          evType: "next";
          /** Since we're casting this from Word to TypedWord, the type is TypedWord */
          currWord: TypedWord;
          nextWord: Word;
      }
    | {
          evType: "del";
          currWord: Word;
      };

class TypingState {
    readonly evtObserver: Observer<TypingStateEvent>;

    #originalString: string;
    #words: Word[];
    #typedWords: TypedWord[];

    /**
     *
     * @param str Initial value of string to be typed
     */
    constructor(str: string) {
        const tokenized = this.#processString(str);

        this.#words = [];
        this.#typedWords = [];
        this.#originalString = tokenized.join(" ");
        this.evtObserver = new Observer();

        let currCharIdx: Index = {
            abs: 0,
            rel: 0,
        };

        for (let i = 0, l = tokenized.length; i < l; ++i) {
            const word = tokenized[i];

            this.#addWord(word, currCharIdx, i, i);
        }
    }

    backspace(ev: KeyboardEvent): void {
        const config = Settings.get();

        if (config.confidenceMode === "max") {
            return ev.preventDefault();
        }

        const wordToBeTyped = getItemAt(this.#words, 0);

        if (wordToBeTyped.typedCharacters.length === 0) {
            if (wordToBeTyped.idx.rel === 0) {
                return ev.preventDefault();
            }

            if (this.typedWords.length === 0 && isDevEnvironment()) {
                console.error("typedWords is empty! This is bad!");
            }

            const lastTypedWord = getItemAt(this.typedWords, -1);

            if (config.confidenceMode === "on" && lastTypedWord.isCorrect) {
                return ev.preventDefault();
            }

            const HAS_SKIPPED_CHARS = !lastTypedWord.typedCharacters.some(
                (c) => c.typedValue === "",
            );

            const castLastTypedWordToWord: Word = {
                characterCount: lastTypedWord.characterCount,
                idx: lastTypedWord.idx,
                characters: HAS_SKIPPED_CHARS
                    ? []
                    : this.#filterSkippedCharacters(
                          lastTypedWord.typedCharacters,
                      ).map(typedCharacterToCharacter),
                typedCharacters: HAS_SKIPPED_CHARS
                    ? lastTypedWord.typedCharacters
                    : this.#filterSkippedCharacters(
                          lastTypedWord.typedCharacters,
                          false,
                      ),
            };

            this.#words.unshift(castLastTypedWordToWord);
            this.#typedWords.pop();
            this.evtObserver.notify({
                evType: "prev",
                currWord: wordToBeTyped,
                prevWord: castLastTypedWordToWord,
            });

            return;
        }

        const lastTypedChar = wordToBeTyped.typedCharacters.pop();

        if (lastTypedChar !== undefined && !lastTypedChar.isExtra) {
            wordToBeTyped.characters.unshift({
                idx: lastTypedChar.idx,
                origIdx: lastTypedChar.origIdx,
                value: lastTypedChar.value,
            });
        }

        this.evtObserver.notify({
            evType: "del",
            currWord: wordToBeTyped,
        });
    }

    addCharacter(ev: KeyboardEvent): void {
        if (this.#words.length === 0) {
            console.error("All words have been emptied out!");
        }

        const config = Settings.get();
        const key = ev.key;
        const wordToBeTyped = getItemAt(this.#words, 0);

        if (key === " ") {
            if (
                wordToBeTyped.typedCharacters.length === 0 &&
                !config.strictSpace
            ) {
                // Don't allow the user to press space at
                // the beginning of a word  when strictSpace is disabled
                return ev.preventDefault();
            } else if (wordToBeTyped.typedCharacters.length !== 0) {
                while (wordToBeTyped.characters.length !== 0) {
                    wordToBeTyped.typedCharacters.push({
                        ...wordToBeTyped.characters.shift()!,
                        isExtra: false,
                        // since this is a skipped character,
                        // we just make it an empty string
                        typedValue: "",
                    });
                }

                return this.#nextWord();
            }
        }

        const nextCharToType = wordToBeTyped.characters.shift();

        if (nextCharToType === undefined) {
            if (key === " ") {
                if (wordToBeTyped.idx.abs + 1 === this.words.length) {
                    // TODO: Handle end here...
                    return;
                }

                return this.#nextWord();
            }

            const lastTypedChar = getItemAt(wordToBeTyped.typedCharacters, -1);

            wordToBeTyped.typedCharacters.push({
                origIdx: {
                    rel: -1,
                    abs: -1,
                },
                idx: {
                    rel: lastTypedChar.idx.rel + 1,
                    abs: lastTypedChar.idx.abs + 1,
                },
                value: key,
                typedValue: key,
                isExtra: true,
            });
        } else {
            wordToBeTyped.typedCharacters.push({
                ...nextCharToType,
                typedValue: key,
                isExtra: false,
            });
        }

        this.evtObserver.notify({
            evType: "add",
            currWord: wordToBeTyped,
        });

        if (config.eagerFinish) {
            if (wordToBeTyped.characters.length === 0) {
                // TODO: Handle end here...
            }
        }
    }

    /**
     *
     * Useful for time-based typing modes.
     *
     * @param str The string to add to be typed
     */
    addToString(str: string): void {
        if (this.#words.length === 0 && this.#typedWords.length === 0) {
            throw new Error("`words` and `typedWords` is empty...");
        }

        const lastWord =
            this.words.length === 0
                ? getItemAt(this.typedWords, -1)
                : getItemAt(this.words, -1);
        const lastCharacter =
            lastWord.characters.length === 0
                ? getItemAt(lastWord.typedCharacters, -1)
                : getItemAt(lastWord.characters, -1);
        const tokenized = this.#processString(str);
        const currCharIdx: Index = {
            abs: lastCharacter.origIdx.abs,
            rel: lastCharacter.origIdx.rel,
        };

        this.#originalString += tokenized.join(" ");

        for (let i = 0, l = tokenized.length; i < l; ++i) {
            const word = tokenized[i];

            this.#addWord(word, currCharIdx, i, i);
        }
    }

    /**
     *
     * **WARNING:** This does not do checks and does what it literally is named for.
     *
     * Before calling this function, take note to do checks whether we are at the last word or not.
     */
    #nextWord(): void {
        const currWord = this.#words.shift()!;
        const casted = wordToTypedWord(currWord);

        this.#typedWords.push(casted);
        this.evtObserver.notify({
            evType: "next",
            currWord: casted,
            nextWord: getItemAt(this.words, 0),
        });
    }

    /**
     *
     * Removes excess spaces
     *
     * @param str The string to be processed
     * @returns tokenized words
     */
    #processString(str: string): string[] {
        str = str.trim();

        assert(str, nonempty(string()));

        return removeWhitespacesFromSplitString(str.split(" "));
    }

    #addWord(
        word: string,
        currCharIdx: Index,
        relIdx: number,
        absIdx: number,
    ): void {
        const characters = word.split("");
        const wordObj: Word = {
            characterCount: characters.length,
            characters: [],
            typedCharacters: [],
            idx: {
                rel: relIdx,
                abs: absIdx,
            },
        };

        for (let j = 0, l = characters.length; j < l; ++j) {
            wordObj.characters.push({
                idx: {
                    rel: j,
                    abs: j,
                },
                origIdx: {
                    rel: currCharIdx.rel + j,
                    abs: currCharIdx.abs + j,
                },
                value: getItemAt(characters, j),
            });
        }

        this.#words.push(wordObj);

        currCharIdx.abs += 1;
        currCharIdx.rel += 1;
    }

    /**
     * Either returns all chars with typedValue of " " or vice versa.
     *
     * @param characters
     * @param getSkippedCharacters
     * @returns
     */
    #filterSkippedCharacters(
        characters: TypedCharacter[],
        getSkippedCharacters = true,
    ): TypedCharacter[] {
        return characters.filter((c, i) => {
            const condition = !c.isExtra && c.typedValue === "";

            return getSkippedCharacters ? condition : !condition;
        });
    }

    get words(): Word[] {
        return this.#words;
    }

    get typedWords(): TypedWord[] {
        return this.#typedWords;
    }
}

class Caret {
    protected caretElId: string;

    constructor(caretElId: string) {
        this.caretElId = caretElId;
    }

    update(ev: TypingStateEvent): void {}
}

class TypingRenderer {
    protected wordsContainerId: string;
    protected initialized: boolean;

    constructor(wordsContainerId: string) {
        this.wordsContainerId = wordsContainerId;
        this.initialized = false;
    }

    /**
     *
     * Displays the initial {@link Word}[] and {@link TypedWord}[]
     * in `wordsContainer`.
     *
     * @param words
     * @param typedWords
     * @returns
     */
    init(words: Word[], typedWords?: TypedWord[]): void {
        if (this.initialized) {
            return;
        }

        const wordsContainer = this.getWordsContainer();

        for (let i = 0, l = typedWords?.length || 0; typedWords && i < l; ++i) {
            const word = typedWords[i];
            const wordEl = document.createElement("div");

            wordEl.classList.add("word", "typed");
            this.#appendCharactersOfWord(wordEl, word);
            wordsContainer.appendChild(wordEl);
        }

        for (let i = 0, l = words.length; i < l; ++i) {
            const word = words[i];
            const wordEl = document.createElement("div");

            wordEl.classList.add("word");

            if (i === 0) {
                wordEl.classList.add("active");
            }

            this.#appendCharactersOfWord(wordEl, word);
            wordsContainer.appendChild(wordEl);
        }

        this.initialized = true;
    }

    /** Clears the display */
    reset(): void {
        if (!this.initialized) {
            return;
        }

        this.initialized = false;
        this.getWordsContainer().innerHTML = "";
    }

    /**
     *
     * Update the current displayed word based on
     * info sent by {@link TypingStateEvent}
     */
    update(ev: TypingStateEvent): void {
        const config = Settings.get();
        const wordsContainer = this.getWordsContainer();
        const currWord = ev.currWord;
        const wordEl = getItemAt(wordsContainer.children, currWord.idx.rel);

        if (!(wordEl instanceof HTMLElement)) {
            return console.error("Word element is not an HTMLElement", wordEl);
        }

        switch (ev.evType) {
            case "add":
                {
                    const lastCharTyped = getItemAt(
                        currWord.typedCharacters,
                        -1,
                    );

                    if (lastCharTyped.isExtra) {
                        const charEl = document.createElement("letter");

                        charEl.classList.add("incorrect", "extra");

                        this.#displayCharText(
                            wordEl,
                            charEl,
                            lastCharTyped,
                            true,
                            false,
                        );

                        wordEl.appendChild(charEl);

                        return;
                    }

                    const charEl = getItemAt(
                        wordEl.children,
                        lastCharTyped.idx.rel,
                    );

                    if (!(charEl instanceof HTMLElement)) {
                        return console.error(
                            "Character element is not an HTMLElement",
                            charEl,
                        );
                    }

                    const IS_CORRECT =
                        lastCharTyped.typedValue === lastCharTyped.value;

                    if (IS_CORRECT) {
                        charEl.classList.add("correct");
                    } else {
                        charEl.classList.add("incorrect");
                    }

                    this.#displayCharText(
                        wordEl,
                        charEl,
                        lastCharTyped,
                        true,
                        IS_CORRECT,
                    );
                }
                break;
            case "prev":
                {
                }
                break;
            case "del":
                {
                }
                break;
            case "next":
                {
                }
                break;
            default:
                console.error(
                    "Received invalid mode for updating typing display!",
                );
        }
    }

    getWordsContainer(): HTMLElement {
        const container = document.getElementById(this.wordsContainerId);

        if (!(container instanceof HTMLElement)) {
            throw new Error(
                `Element with id ${this.wordsContainerId} is not an HTMLElement.`,
            );
        }

        return container;
    }

    #appendCharacterToWordEl(
        wordEl: HTMLElement,
        character: Character | TypedCharacter,
    ) {
        const charEl = document.createElement("letter");
        const IS_TYPED_CHAR = isTypedCharacter(character);
        const IS_CORRECT =
            IS_TYPED_CHAR &&
            character.typedValue === character.value &&
            !character.isExtra;

        if (IS_CORRECT) {
            charEl.classList.add("correct");
        } else if (IS_TYPED_CHAR) {
            charEl.classList.add("incorrect");
        }

        if (IS_TYPED_CHAR && character.isExtra) {
            charEl.classList.add("extra");
        }

        this.#displayCharText(
            wordEl,
            charEl,
            character,
            IS_TYPED_CHAR,
            IS_CORRECT,
        );

        wordEl.appendChild(charEl);
    }

    #appendCharactersOfWord(wordEl: HTMLElement, word: Word | TypedWord): void {
        for (let i = 0, l = word.typedCharacters.length; i < l; ++i) {
            this.#appendCharacterToWordEl(wordEl, word.typedCharacters[i]);
        }

        for (let i = 0, l = word.characters.length; i < l; ++i) {
            this.#appendCharacterToWordEl(wordEl, word.characters[i]);
        }
    }

    /**
     *
     * Displays the character and if it's a {@link TypedCharacter}
     * with a typo, it's typo as well depending on {@link Settings}.
     *
     * @param charEl
     * @param character
     */
    #displayCharText(
        wordEl: HTMLElement,
        charEl: HTMLElement,
        character: Character | TypedCharacter,
        isTypedChar: boolean,
        isCorrect: boolean,
    ) {
        if (!isTypedChar || isCorrect) {
            charEl.textContent = character.value;

            return;
        }

        const settings = Settings.get();

        switch (settings.indicateTypos) {
            case "off":
                {
                    charEl.textContent = (character as TypedCharacter).value;
                }
                break;
            case "below":
                {
                    // TODO
                }
                break;
            case "replace":
                {
                    charEl.textContent = (
                        character as TypedCharacter
                    ).typedValue;
                }
                break;
            default:
                console.error(
                    `Received invalid value for Settings property of indicateTypes: ${settings.indicateTypos}`,
                );
        }
    }
}

class TypingContainer {
    #state: TypingState;
    #renderer: TypingRenderer;
    #caret: Caret;

    #keydownListener: (ev: KeyboardEvent) => void;
    #stateListener: (ev: TypingStateEvent) => void;
    #focusListener: (ev: Event) => void;

    #hasStarted: boolean;
    #isFinished: boolean;

    protected inputId: string;

    constructor(
        inputId: string,
        state: TypingState,
        renderer: TypingRenderer,
        caret: Caret,
    ) {
        this.inputId = inputId;

        this.#state = state;
        this.#renderer = renderer;
        this.#caret = caret;

        this.#keydownListener = this.#onKeyDown.bind(this);
        this.#focusListener = this.onFocus.bind(this);
        this.#stateListener = this.#onStateUpdate.bind(this);

        this.#hasStarted = false;
        this.#isFinished = false;

        const input = this.getInput();

        input.value = "";
        input.disabled = true;
    }

    start(): void {
        if (this.#hasStarted || this.#isFinished) {
            return;
        }

        this.getInput().addEventListener("keydown", this.#keydownListener);
        this.#renderer
            .getWordsContainer()
            .addEventListener("click", this.#focusListener);
        this.#state.evtObserver.subscribe(this.#stateListener);

        this.#hasStarted = true;

        this.getInput().disabled = false;
        this.#renderer.init(this.#state.words, this.#state.typedWords);

        // TODO: init renderer and caret
    }

    end(): void {
        // TODO: Observer to notify listeners
        if (!this.#hasStarted) {
            return;
        }

        const input = this.getInput();

        input.removeEventListener("keydown", this.#keydownListener);
        this.#renderer
            .getWordsContainer()
            .removeEventListener("click", this.#focusListener);
        this.#state.evtObserver.unsubscribe(this.#stateListener);
        this.#renderer.reset();

        this.#hasStarted = false;
        this.#isFinished = true;

        input.disabled = true;
    }

    getInput(): HTMLInputElement {
        const input = document.getElementById(this.inputId);

        if (!(input instanceof HTMLInputElement)) {
            throw new Error(
                `Element with id ${this.inputId} is not an HTMLInputElement.`,
            );
        }

        return input;
    }

    onFocus(ev: Event): void {
        this.getInput().focus();
    }

    #onKeyDown(ev: KeyboardEvent): void {
        switch (ev.key) {
            case "Control":
            case "Shift":
            case "Meta":
            case "Alt":
                return;

            case "ArrowDown":
            case "ArrowLeft":
            case "ArrowUp":
            case "ArrowRight":
                return ev.preventDefault();

            case "Tab":
            case "Escape":
            case "Enter":
                //TODO: quick restart
                break;

            case "Backspace":
                this.#state.backspace(ev);
                break;

            default:
                this.#state.addCharacter(ev);
        }

        console.log(this);
    }

    #onStateUpdate(ev: TypingStateEvent): void {
        this.#renderer.update(ev);
        this.#caret.update(ev);
    }
}

export {
    Caret,
    typedCharacterToCharacter,
    TypingContainer,
    TypingRenderer,
    TypingState,
    wordToTypedWord,
};
export type { Character, TypedCharacter, TypedWord, Word };

