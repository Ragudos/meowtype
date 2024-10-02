/** Removes whitespaces from a split(" ") string */
function removeWhitespacesFromSplitString(str: string[]) {
    return str.filter((s) => s.trim() !== "");
}

export { removeWhitespacesFromSplitString };
