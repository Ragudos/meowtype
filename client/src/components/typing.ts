import Observer from "@/lib/state/observer";
import Config from "@/lib/utils/config";
import { getItemAt, isDevEnvironment } from "@/lib/utils/misc";
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

type TypingStateEvent = {
    evType: "prev" | "del" | "add" | "next";
};

class TypingState {
    readonly evtObserver: Observer<TypingStateEvent>;

    #originalString: string;

    protected words: Word[];
    protected typedWords: TypedWord[];

    /**
     *
     * @param str Initial value of string to be typed
     */
    constructor(str: string) {
        const tokenized = this.#processString(str);

        this.words = [];
        this.typedWords = [];
        this.#originalString = tokenized.join(" ");
        this.evtObserver = new Observer();

        let currCharIdx: Index = {
            abs: 0,
            rel: 0,
        };

        for (let i = 0, l = tokenized.length; i < l; ++i) {
            const word = tokenized[i];

            this.#addWord(word, currCharIdx, i, i);

            currCharIdx.abs += word.length + 1;
            currCharIdx.rel += word.length + 1;
        }
    }

    backspace(ev: KeyboardEvent): void {
        const config = Config.get();

        if (config.confidenceMode === "max") {
            return ev.preventDefault();
        }

        const wordToBeTyped = getItemAt(this.words, 0);

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

            const castLastTypedWordToWord: Word = {
                characterCount: lastTypedWord.characterCount,
                idx: lastTypedWord.idx,
                characters: config.strictSpace
                    ? []
                    : this.#filterSkippedCharacters(
                          lastTypedWord.typedCharacters,
                      ).map(typedCharacterToCharacter),
                typedCharacters: config.strictSpace
                    ? lastTypedWord.typedCharacters
                    : this.#filterSkippedCharacters(
                          lastTypedWord.typedCharacters,
                          false,
                      ),
            };

            this.words.unshift(castLastTypedWordToWord);
            this.typedWords.pop();
            this.evtObserver.notify({ evType: "prev" });

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

        this.evtObserver.notify({ evType: "del" });
    }

    addCharacter(ev: KeyboardEvent): void {
        if (this.words.length === 0) {
            console.error("All words have been emptied out!");
        }

        const config = Config.get();
        const key = ev.key;
        const wordToBeTyped = getItemAt(this.words, 0);

        if (key === " " && !config.strictSpace) {
            while (wordToBeTyped.characters.length !== 0) {
                wordToBeTyped.typedCharacters.push({
                    ...wordToBeTyped.characters.shift()!,
                    isExtra: false,
                    typedValue: " ",
                });
            }

            this.#nextWord();

            return;
        }

        const nextCharToType = wordToBeTyped.characters.shift();

        if (nextCharToType === undefined) {
            if (key === " ") {
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

        this.evtObserver.notify({ evType: "add" });

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
        if (this.words.length === 0 && this.typedWords.length === 0) {
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

            currCharIdx.abs += word.length + 1;
            currCharIdx.rel += word.length + 1;
        }
    }

    #nextWord(): void {
        this.typedWords.push(wordToTypedWord(this.words.shift()!));
        this.evtObserver.notify({ evType: "next" });
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

        this.words.push(wordObj);
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
            const condition =
                !c.isExtra && c.typedValue === " " && i < characters.length;

            return getSkippedCharacters ? condition : !condition;
        });
    }
}

class Caret {}

class TypingRenderer {
    protected wordsContainerId: string;

    constructor(wordsContainerId: string) {
        this.wordsContainerId = wordsContainerId;
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

    #onStateUpdate(ev: TypingStateEvent): void {}
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
