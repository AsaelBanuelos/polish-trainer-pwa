import { useMemo, useState } from "react";
import exercisesRaw from "./data/exercises.json";
import type { Exercise } from "./types/Exercise";
import { pickRandom } from "./utils/pickRandom";
import { ExerciseCard } from "./components/ExerciseCard";

export default function App() {
    const exercises = exercisesRaw as Exercise[];

    const [current, setCurrent] = useState<Exercise>(() =>
        pickRandom(exercises)
    );

    function nextRandom() {
        // Evitar repetir el mismo si hay más de 1
        if (exercises.length <= 1) return;
        let next = pickRandom(exercises);
        while (next.id === current.id) next = pickRandom(exercises);
        setCurrent(next);
    }

    const total = useMemo(() => exercises.length, [exercises.length]);

    return (
        <div>
            <div
                style={{
                    maxWidth: 700,
                    margin: "15% auto 0",
                    padding: "0 20px",
                    opacity: 0.75,
                }}
            >
                Ejercicios cargados: <b>{total}</b>
            </div>
            <ExerciseCard exercise={current} onNext={nextRandom} />
        </div>
    );
}
