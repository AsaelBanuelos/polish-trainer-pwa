export function pickRandom<T>(items: T[]): T {
    const idx = Math.floor(Math.random() * items.length);
    return items[idx];
}
