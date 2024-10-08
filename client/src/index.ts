import "@/lib/utils/logger";
import { swapElements } from "./lib/utils/dom";

const startTypingBtn = document.getElementById(
    "startTypingBtn",
) as HTMLButtonElement;

startTypingBtn.addEventListener("click", async () => {
    const heroSection = document.getElementById("heroSection") as HTMLElement;
    const typingScreen = document.getElementById("typingScreen") as HTMLElement;

    await swapElements(heroSection, typingScreen);
    await loadTypingScreen();
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
