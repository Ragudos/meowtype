export class Assert {
    static assert(truthy: boolean, message?: Error | string): void {
        if (truthy) {
            return;
        }

        if (!message) {
            throw new Error("Assertion failed");
        }

        if (typeof message === "string") {
            throw new Error(message);
        }

        throw message;
    }
}
