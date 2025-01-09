import "@/lib/utils/logger";
import { getTransitionDuration } from "./lib/utils/misc";
import { sleep } from "./lib/utils/time";

const startTypingBtn = document.getElementById(
    "startTypingBtn",
) as HTMLButtonElement;

startTypingBtn.addEventListener("click", async () => {
    const heroSection = document.getElementById("heroSection") as HTMLElement;
    const typingScreen = document.getElementById("typingScreen") as HTMLElement;

    heroSection.classList.add("fade-out");
    // TODO: swap with a loading screen
    //await swapElements(heroSection, typingScreen);

    const d = getTransitionDuration(heroSection);

    await sleep(d);

    heroSection.classList.add("hidden");
    //
    typingScreen.classList.remove("hidden");

    await loadTypingScreen();

    // TODO: swap loading screen with typing screen
    typingScreen.classList.add("fade-in");
    const tD = getTransitionDuration(typingScreen);

    await sleep(tD);

    typingScreen.classList.remove("fade-in");
});

async function loadTypingScreen(): Promise<void> {
    // TODO: loading screen
    const wordsModule = await import("./lib/utils/words");
    const typingModule = await import("./components/typing");

    const str = wordsModule.generateString(50);
    const typingContainer = new typingModule.TypingContainer(
        "wordsInput",
        new typingModule.TypingState(str),
        new typingModule.TypingRenderer("words"),
        new typingModule.Caret("caret"),
    );

    typingContainer.start();
}
