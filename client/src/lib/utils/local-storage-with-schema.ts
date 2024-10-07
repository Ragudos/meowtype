import { object, size, string, Struct } from "superstruct";

class LocalStorageWithSchema<T = unknown, S = unknown> {
    #key: string;
    #schema: Struct<T, S>;
    
    constructor(key: string, schema: Struct<T, S>) {
        this.#key = key;
        this.#schema = schema;
    }

    getData(): T {
        const rawStoredData = window.localStorage.getItem(this.#key);

        if (!rawStoredData) {
            throw new Error(`Data with key ${this.#key} does not exist in LocalStorage.`);
        }

        let parsedData: unknown;

        if (this.#schema.TYPE === "string") {
            parsedData = rawStoredData;
        } else if (this.#schema.TYPE === "number") {
            parsedData = parseFloat(rawStoredData);
        } else {
            parsedData = JSON.parse(rawStoredData);
        }

        const [error, validatedData] = this.#schema.validate(parsedData);

        if (error) {
            throw new Error(`Mismatch of data in LocalStorage with schema of key: ${this.#key}. This is bad!`);
        }

        return validatedData;
    }
}

export default LocalStorageWithSchema;
