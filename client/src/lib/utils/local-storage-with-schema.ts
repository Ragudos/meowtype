import { Failure, Struct } from "superstruct";
import { deepClone } from "./misc";

type LocalStorageWithSchemaOptions<T, S> = {
    key: string;
    schema: Struct<T, S>;
    fallback: T;
    migrate?: (value: unknown, errors: Failure[], fallback: T) => T;
};

class LocalStorageWithSchema<T = unknown, S = unknown> {
    #key: string;
    #schema: Struct<T, S>;
    #fallback: T;
    #migrate?: (value: unknown, errors: Failure[], fallback: T) => T;

    constructor({
        key,
        schema,
        fallback,
        migrate,
    }: LocalStorageWithSchemaOptions<T, S>) {
        this.#key = key;
        this.#schema = schema;
        this.#fallback = fallback;
        this.#migrate = migrate;
    }

    get(): T {
        console.log("Getting config from LocalStorage");
        const rawStoredData = window.localStorage.getItem(this.#key);

        if (!rawStoredData) {
            console.log("No stored config: using fallback");
            return this.#fallback;
        }

        let parsedData: unknown;

        try {
            parsedData = JSON.parse(rawStoredData);
        } catch (e) {
            console.log(
                `Data from LocalStorage of key: ${this.#key} is not a valid JSON. Using fallback`,
                e,
            );

            return this.#fallback;
        }

        const [error, validatedData] = this.#schema.validate(parsedData);

        if (validatedData) {
            return validatedData;
        }

        let newValue = this.#fallback;

        if (this.#migrate) {
            const errors: Failure[] = [];

            for (const value of error!.failures()) {
                errors.push(value);
            }

            const migrated = this.#migrate(
                parsedData,
                errors,
                deepClone(this.#fallback),
            );

            const [migrationError, validatedMigrationData] =
                this.#schema.validate(migrated);

            if (validatedMigrationData) {
                newValue = validatedMigrationData;
            } else {
                console.error(
                    `Data from LocalStorage of key: ${this.#key} has invalid schema! This is bad!`,
                    migrationError,
                );
            }
        }

        window.localStorage.setItem(this.#key, JSON.stringify(newValue));
        console.log("Loaded new config to LocalStorage");

        return newValue;
    }

    set(data: T): boolean {
        const [error, validatedData] = this.#schema.validate(data);

        if (validatedData) {
            window.localStorage.setItem(
                this.#key,
                JSON.stringify(validatedData),
            );

            return true;
        }

        console.error(
            `Failed to set ${this.#key} in LocalStorage`,
            data,
            error,
        );

        return false;
    }
}

export default LocalStorageWithSchema;
