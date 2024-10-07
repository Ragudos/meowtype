import { boolean, enums, Infer, object, partial } from "superstruct";

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
const timerStyleSchema = enums(["off", "bar", "text", "mini"]);
const highlightModeSchema = enums([
    "off",
    "letter",
    "word",
    "next_word",
    "next_two_words",
]);
const typingSpeedUnitSchema = enums(["wpm", "cpm", "wps", "cps", "wph"]);
const configSchema = object({
    smoothCaret: smoothCaretSchema,
    caretStyle: caretStyleSchema,
    confidenceMode: confidenceModeSchema,
    indicateTypos: indicateTyposSchema,
    timerStyle: timerStyleSchema,
    quickRestart: quickRestartSchema,
    highlightMode: highlightModeSchema,
    typingSpeedUnit: typingSpeedUnitSchema,
    showOutOfFocusWarning: boolean(),
    showCapsLockWarning: boolean(),
    hideExtraLetters: boolean(),
    strictSpace: boolean(),
    eagerFinish: boolean(),
});
const partialConfigSchema = partial(configSchema);

type Config = Infer<typeof configSchema>;
type PartialConfig = Infer<typeof partialConfigSchema>;

export {
    caretStyleSchema,
    confidenceModeSchema,
    configSchema,
    highlightModeSchema,
    indicateTyposSchema,
    quickRestartSchema,
    smoothCaretSchema,
    timerStyleSchema,
    typingSpeedUnitSchema,
};
export type { Config, PartialConfig };
