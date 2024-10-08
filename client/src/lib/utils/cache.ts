type MemoryCacheData<T = unknown> = {
    value: T;
};

class MemoryCache<K = string, T = unknown> {
    #maxSize: number;
    #cache: Map<K, MemoryCacheData<T>>;

    constructor(maxSize = 100) {
        this.#maxSize = maxSize;
        this.#cache = new Map();
    }

    set(key: K, value: T): void {
        // We delete it first if it exists,
        // so it gets re-added to the end of the Map
        if (this.#cache.has(key)) {
            this.#cache.delete(key);
        }

        this.#cache.set(key, { value });

        if (this.#cache.size > this.#maxSize) {
            const fKey = this.#cache.keys().next().value;

            this.#cache.delete(fKey);
        }
    }

    get(key: K): undefined | T {
        if (!this.#cache.has(key)) {
            return;
        }

        const value = this.#cache.get(key)!.value;

        this.#cache.delete(key);
        this.#cache.set(key, { value });

        return value;
    }

    delete(key: K): void {
        this.#cache.delete(key);
    }

    clear(): void {
        this.#cache.clear();
    }

    size() {
        return this.#cache.size;
    }

    display() {
        console.log([...this.#cache.entries()]);
    }
}

export default MemoryCache;
