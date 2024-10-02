class Observer<T> {
    #subscribers: ((value: T) => void)[];

    constructor() {
        this.#subscribers = [];
    }

    /**
     *
     * @param cb
     * @returns cleanup function
     */
    subscribe(cb: (value: T) => void): () => void {
        this.#subscribers.push(cb);

        return () => {
            this.unsubscribe(cb);
        };
    }

    unsubscribe(cb: (value: T) => void): void {
        const idx = this.#subscribers.indexOf(cb);

        if (idx == -1) {
            return;
        }

        this.#subscribers.splice(idx, 1);
    }

    notify(value: T): void {
        for (let i = 0, l = this.#subscribers.length; i < l; ++i) {
            this.#subscribers[i](value);
        }
    }

    get subscribers(): ((value: T) => void)[] {
        return this.#subscribers;
    }
}

export default Observer;
