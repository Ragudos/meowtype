import { deepClone } from "@/lib/utils/misc";
import { Config } from "@/schemas/config";

const obj: Config = {
    difficulty: "casual",
    smoothCaret: "medium",
    caretStyle: "block",
    confidenceMode: "on",
    indicateTypos: "off",
    quickRestart: "esc",
    highlightMode: "off",
    typingSpeedUnit: "wpm",
    hideExtraLetters: false,
    showCapsLockWarning: true,
    showOutOfFocusWarning: true,
    strictSpace: true,
    eagerFinish: false,
    rollerMode: "off",
    minAccuracy: "off",
    progressStyle: "mini",
    speedStyle: "off",
    accuracyStyle: "off",
    statsOpacity: 1,
    smoothLineScroll: false,
    showAllLines: false,
    freedomMode: false,
    stopOnError: "off",
};

export default deepClone(obj);
