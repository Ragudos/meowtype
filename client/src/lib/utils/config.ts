import defaultConfig from "@/constants/default-config";
import { Config, configSchema } from "@/schemas/config";
import LocalStorageWithSchema from "./local-storage-with-schema";

class Settings {
    static #instance: null | Settings = null;
    /**
     *
     * So that we don't retrieve stuff from
     * LocalStorage everytime.
     */
    #inMemoryData: Config;
    #localStorage: LocalStorageWithSchema<Config>;

    private constructor() {
        this.#localStorage = new LocalStorageWithSchema({
            key: "meowtype__config",
            schema: configSchema,
            fallback: defaultConfig,
        });

        this.#inMemoryData = this.#localStorage.get();
    }

    static getInstance(): Settings {
        if (!Settings.#instance) {
            Settings.#instance = new Settings();
        }

        return Settings.#instance;
    }

    get(): Config {
        return this.#inMemoryData;
    }

    set(config: Config): boolean {
        return this.#localStorage.set(config);
    }
}

export default Settings.getInstance();
