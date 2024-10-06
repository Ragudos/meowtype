import "@/lib/utils/logger";
import { getTransitionDuration } from "./lib/utils/styles";
import { sleep } from "./lib/utils/time";

const startTypingBtn = document.getElementById(
    "startTypingBtn",
) as HTMLButtonElement;

startTypingBtn.addEventListener("click", async () => {
    const heroSection = document.getElementById("heroSection") as HTMLElement;

    heroSection.classList.add("fade-out");

    const transitionDuration = getTransitionDuration(heroSection);

    await sleep(transitionDuration);

    heroSection.classList.add("hidden");
    heroSection.classList.remove("fade-out");

    const typingScreen = document.getElementById("typingScreen") as HTMLElement;

    typingScreen.classList.remove("hidden");
    typingScreen.classList.add("fade-in");

    const typingScreenTransitionDuration = getTransitionDuration(typingScreen);

    await sleep(typingScreenTransitionDuration);

    typingScreen.classList.remove("fade-in");
    await loadTypingScreen();
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
        "caret",
        str,
    );

    typingMode.start();
}
