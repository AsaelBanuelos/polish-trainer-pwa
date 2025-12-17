export type ExerciseType =
    | "meaning"
    | "complete_sentence"
    | "declension"
    | "translate_to_es";

export type Exercise = {
    id: string;
    type: ExerciseType;
    prompt: string;
    // Si quieres multiple choice
    choices?: string[];
    // Respuesta correcta (string por ahora)
    answer: string;
    // Explicación opcional
    explanation?: string;
};
