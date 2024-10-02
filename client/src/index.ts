import "@/lib/utils/logger";
import { getTransitionDuration } from "./lib/utils/styles";

const startTypingBtn = document.getElementById(
    "startTypingBtn",
) as HTMLButtonElement;

startTypingBtn.addEventListener("click", () => {
    const heroSection = document.getElementById("heroSection") as HTMLElement;

    heroSection.classList.add("fade-out");

    const transitionDuration = getTransitionDuration(heroSection);

    // TODO: abstract this animation debouncer or something.

    setTimeout(() => {
        heroSection.classList.add("hidden");
        heroSection.classList.remove("fade-out");

        const typingScreen = document.getElementById(
            "typingScreen",
        ) as HTMLElement;

        typingScreen.classList.remove("hidden");
        typingScreen.classList.add("fade-in");

        const transitionDuration = getTransitionDuration(typingScreen);

        setTimeout(() => {
            typingScreen.classList.remove("fade-in");

            loadTypingScreen();
        }, transitionDuration);
    }, transitionDuration);
});

async function loadTypingScreen(): Promise<void> {
    // TODO: loading screen
    const wordsModule = await import("./lib/utils/words");
    const defaultTypingModeModule = await import(
        "./components/typing-modes/default/typing"
    );

    const str = wordsModule.generateString(50);
    const typingMode = new defaultTypingModeModule.default(
        "wordsInput",
        "words",
        str,
    );

    typingMode.start();
}
