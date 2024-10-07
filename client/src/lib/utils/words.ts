import { words } from "@/constants/words";
import { getItemAt } from "./misc";

function generateString(amount: number): string {
    if (amount <= 0) {
        throw new RangeError("Invalid amount");
    }

    let str = "";

    while (amount > 0) {
        const rand = Math.floor(Math.random() * words.length);
        const word = getItemAt(words, rand);

        str += word;

        if (amount !== 1) {
            str += " ";
        }

        amount -= 1;
    }

    return str;
}

export { generateString };

