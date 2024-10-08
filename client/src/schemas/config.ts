import {
    boolean,
    enums,
    Infer,
    literal,
    min,
    number,
    object,
    partial,
    union,
} from "superstruct";

const difficultySchema = enums(["casual", "guru", "professional"]);
const caretStyleSchema = enums([
    "off",
    "default",
    "block",
    "outline",
    "underline",
]);
const smoothCaretSchema = enums(["off", "slow", "medium", "fast"]);
const quickRestartSchema = enums(["off", "esc", "tab", "enter"]);
const confidenceModeSchema = enums(["off", "on", "max"]);
const indicateTyposSchema = enums(["off", "below", "replace"]);
const highlightModeSchema = enums([
    "off",
    "letter",
    "word",
    "next_word",
    "next_two_words",
]);
const typingSpeedUnitSchema = enums(["wpm", "cpm", "wps", "cps", "wph"]);
const stopOnErrorSchema = enums(["off", "word", "letter"]);
const minAccuracySchema = union([literal("off"), min(number(), 0)]);
const progressStyleSchema = enums(["off", "bar", "text", "mini"]);
const speedStyleSchema = enums(["off", "text", "mini"]);
const accuracyStyleSchema = enums(["off", "text", "schema"]);
const statsOpacitySchema = enums([0.25, 0.5, 0.75, 1]);
const rollerModeSchema = enums(["off", "letter", "word"]);

const configSchema = object({
    difficulty: difficultySchema,
    smoothCaret: smoothCaretSchema,
    caretStyle: caretStyleSchema,
    confidenceMode: confidenceModeSchema,
    freedomMode: boolean(),
    stopOnError: stopOnErrorSchema,
    indicateTypos: indicateTyposSchema,
    quickRestart: quickRestartSchema,
    highlightMode: highlightModeSchema,
    typingSpeedUnit: typingSpeedUnitSchema,
    showOutOfFocusWarning: boolean(),
    showCapsLockWarning: boolean(),
    hideExtraLetters: boolean(),
    strictSpace: boolean(),
    eagerFinish: boolean(),
    minAccuracy: minAccuracySchema,
    progressStyle: progressStyleSchema,
    speedStyle: speedStyleSchema,
    accuracyStyle: accuracyStyleSchema,
    statsOpacity: statsOpacitySchema,
    showAllLines: boolean(),
    smoothLineScroll: boolean(),
    rollerMode: rollerModeSchema,
});
const partialConfigSchema = partial(configSchema);

type Config = Infer<typeof configSchema>;
type PartialConfig = Infer<typeof partialConfigSchema>;

export {
    caretStyleSchema,
    confidenceModeSchema,
    configSchema,
    difficultySchema,
    highlightModeSchema,
    indicateTyposSchema,
    minAccuracySchema,
    progressStyleSchema,
    quickRestartSchema,
    rollerModeSchema,
    smoothCaretSchema,
    speedStyleSchema,
    statsOpacitySchema,
    stopOnErrorSchema,
    typingSpeedUnitSchema,
};
export type { Config, PartialConfig };
