import Observer from "@/lib/state/observer";
import { getItemAt } from "@/lib/utils/array";
import { removeWhitespacesFromSplitString } from "@/lib/utils/string";
import { assert, nonempty, string } from "superstruct";
import {
    TypedCharacter,
    typedCharacterToCharacter,
    TypedWord,
    Word,
    wordToTypedWord,
} from "./typing";

/** Just a way for our renderer to know how to rerender the data. */
type DefaultTypingModeStateEvent = {
    evType: "backToPrevWord" | "nextWord" | "addChar" | "deleteChar";
};

class DefaultTypingModeState {
    readonly originalString: string;
    readonly evtObserver: Observer<DefaultTypingModeStateEvent>;

    words: Word[];
    typedWords: TypedWord[];

    isFinished: boolean;
    hasStarted: boolean;

    /**
     *
     * @param str The string to be typed
     */
    constructor(str: string) {
        str = str.trim();

        assert(str, nonempty(string()));

        const words = removeWhitespacesFromSplitString(str.split(" "));

        this.originalString = words.join(" ");
        this.evtObserver = new Observer();

        this.words = [];
        this.typedWords = [];

        this.isFinished = false;
        this.hasStarted = false;

        // Keeps track of characters' original indeces.
        let currentCharacterIdx = 0;

        for (let i = 0; i < words.length; ++i) {
            const characters = getItemAt(words, i).split("");
            const wordObj: Word = {
                characterCount: characters.length,
                characters: [],
                typedCharacters: [],
                idx: {
                    relative: i,
                    absolute: i,
                },
            };

            for (let j = 0; j < characters.length; ++j) {
                wordObj.characters.push({
                    idx: {
                        relative: j,
                        absolute: j,
                    },
                    originalIdx: {
                        relative: currentCharacterIdx + j,
                        absolute: currentCharacterIdx + j
                    },
                    value: getItemAt(characters, j),
                });
            }

            // +1 for the single whitespace in-between words
            currentCharacterIdx += characters.length + 1;
            this.words.push(wordObj);
        }
    }

    backspace(ev: KeyboardEvent): void {
        if (!this.hasStarted) {
            throw new Error("The typing mode state has not been started yet.");
        }

        const wordToBeTyped = getItemAt(this.words, 0);
        const NO_CHARACTERS_TYPED = wordToBeTyped.typedCharacters.length === 0;

        // If true, we go back to previously typed word
        if (NO_CHARACTERS_TYPED) {
            if (wordToBeTyped.idx.relative === 0) {
                return;
            }

            const latestTypedWord = getItemAt(this.typedWords, -1);

            // Don't allow the user to go back
            // to previously typed word if it's already correct.
            if (latestTypedWord.isCorrect) {
                return ev.preventDefault();
            }

            const HAS_SKIPPED_CHARS = latestTypedWord.typedCharacters.some(
                (c) => c.typedValue === " ",
            );

            const castLatestTypedWordToWord: Word = {
                idx: latestTypedWord.idx,
                characters: HAS_SKIPPED_CHARS
                    ? this.#filterSkippedCharacters(
                          latestTypedWord.typedCharacters,
                      ).map(typedCharacterToCharacter)
                    : latestTypedWord.characters,
                typedCharacters: HAS_SKIPPED_CHARS
                    ? this.#filterSkippedCharacters(
                          latestTypedWord.typedCharacters,
                          false,
                      )
                    : latestTypedWord.typedCharacters,
                characterCount: latestTypedWord.characterCount,
            };

            this.words.unshift(castLatestTypedWordToWord);
            this.typedWords.pop();

            this.evtObserver.notify({ evType: "backToPrevWord" });

            return;
        }

        const latestTypedCharacter = wordToBeTyped.typedCharacters.pop();

        if (
            latestTypedCharacter !== undefined &&
            !latestTypedCharacter.isExtra
        ) {
            wordToBeTyped.characters.unshift({
                idx: latestTypedCharacter.idx,
                originalIdx: latestTypedCharacter.originalIdx,
                value: latestTypedCharacter.value,
            });
        }

        this.evtObserver.notify({ evType: "deleteChar" });
    }

    addCharacter(ev: KeyboardEvent): void {
        const key = ev.key;
        const wordToBeTyped = getItemAt(this.words, 0);
        const GO_TO_NEXT_WORD = key === " ";

        if (GO_TO_NEXT_WORD) {
            while (wordToBeTyped.characters.length !== 0) {
                wordToBeTyped.typedCharacters.push({
                    ...wordToBeTyped.characters.shift()!,
                    isExtra: false,
                    typedValue: " ",
                });
            }

            this.typedWords.push(wordToTypedWord(wordToBeTyped));
            this.words.shift();

            this.evtObserver.notify({ evType: "nextWord" });

            return;
        }

        const nextCharToType = wordToBeTyped.characters.shift();

        // The character to be added will now be extra
        if (nextCharToType === undefined) {
            const lastTypedChar = getItemAt(wordToBeTyped.typedCharacters, -1);

            wordToBeTyped.typedCharacters.push({
                originalIdx: {
                    relative: -1,
                    absolute: -1
                },
                idx: {
                    relative: lastTypedChar.idx.relative + 1,
                    absolute: lastTypedChar.idx.absolute + 1,
                },
                value: key,
                typedValue: key,
                isExtra: true,
            });

            this.evtObserver.notify({ evType: "addChar" });

            return;
        }

        wordToBeTyped.typedCharacters.push({
            ...nextCharToType,
            typedValue: key,
            isExtra: false,
        });

        this.evtObserver.notify({ evType: "addChar" });

        // TODO: If user wants our checker to be greedy, we end right away
        // when activeWord's letters are empty after adding a letter and it's correct,
        // and it's the last word in the original string.
    }

    #filterSkippedCharacters(
        characters: TypedCharacter[],
        getSkippedCharacters: boolean = true,
    ): TypedCharacter[] {
        return characters.filter((c, i) => {
            const condition =
                !c.isExtra && c.typedValue === " " && i < characters.length;

            return getSkippedCharacters ? condition : !condition;
        });
    }
}

export default DefaultTypingModeState;
export type { DefaultTypingModeStateEvent };
