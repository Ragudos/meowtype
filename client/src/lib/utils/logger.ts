// Inspired from: https://github.com/monkeytypegame/monkeytype/blob/master/frontend/src/ts/utils/logger.ts

const browserLog = console.log;
const browserWarn = console.warn;
const browserError = console.error;

function consoleInfo(...t: unknown[]): void {
    browserLog(
        "%cINFO",
        "background:#4CAF50;color: #111;padding:0 5px;border-radius:10px",
        ...t,
    );
}

function consoleWarn(...t: unknown[]): void {
    browserWarn(
        "%cWARNING",
        "background:#FFC107;color: #111;padding:0 5px;border-radius:10px",
        ...t,
    );
}

function consoleError(...t: unknown[]): void {
    browserError(
        "%cERROR",
        "background:#F44336;color: #111;padding:0 5px;border-radius:10px",
        ...t,
    );
}

console.log = consoleInfo;
console.warn = consoleWarn;
console.error = consoleError;
