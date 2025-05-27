export function extract(pattern: string, input: string) {
    if (pattern === "")
        return input
    const r = new RegExp(pattern, "g")
    const targets: string[] = [];
    let match;
    while ((match = r.exec(input)) !== null) {
        targets.push(match[1]);
    }

    return targets.length === 1 ? targets[0] : ""
}