function normalize(s: string) {
    return s.trim().toLowerCase().replace(/\s+/g, " ");
}

export function checkAnswer(user: string, correct: string) {
    return normalize(user) === normalize(correct);
}
