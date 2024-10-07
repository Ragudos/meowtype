import { deepClone } from "@/lib/utils/misc";
import { Config } from "@/schemas/config";

const obj: Config = {
    smoothCaret: "medium",
    caretStyle: "block",
    confidenceMode: "on",
    indicateTypos: "off",
    quickRestart: "esc",
    highlightMode: "off",
    timerStyle: "text",
    typingSpeedUnit: "wpm",
    hideExtraLetters: false,
    showCapsLockWarning: true,
    showOutOfFocusWarning: true,
    strictSpace: false,
    eagerFinish: false,
};

export default deepClone(obj);
