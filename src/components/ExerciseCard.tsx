import { useEffect, useState, useRef } from "react";
import type { Exercise } from "../types/Exercise";
import { checkAnswer } from "../utils/checkAnswer";

/**
 * Component props:
 * - exercise: current exercise object (prompt, answer, choices, etc.)
 * - onNext: callback to load the next random exercise (from App.tsx)
 */
type Props = {
    exercise: Exercise;
    onNext: () => void;
};

export function ExerciseCard({ exercise, onNext }: Props) {
    /**
     * State:
     * - value: user's input OR selected choice text
     * - checked: whether user already pressed "Comprobar"
     * - isCorrect: result after checking (true/false), null before checking
     */
    const [value, setValue] = useState("");
    const [checked, setChecked] = useState(false);
    const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

    /**
     * Refs (DOM access):
     * - containerRef: main focusable container for keyboard controls
     * - inputRef: focus target for free-text exercises
     * - cardRef: optional "wow-success" CSS animation target
     * - confettiRef: canvas overlay used to draw confetti
     */
    const containerRef = useRef<HTMLDivElement | null>(null);
    const inputRef = useRef<HTMLInputElement | null>(null);
    const cardRef = useRef<HTMLDivElement | null>(null);
    const confettiRef = useRef<HTMLCanvasElement | null>(null);

    /**
     * Reset everything when exercise changes:
     * - clear answer
     * - clear validation state
     * - auto-focus (input for text mode, container for choices mode)
     */
    useEffect(() => {
        setValue("");
        setChecked(false);
        setIsCorrect(null);

        // Delay ensures DOM is ready before focusing
        const t = window.setTimeout(() => {
            if (exercise.choices?.length) {
                containerRef.current?.focus();
            } else {
                inputRef.current?.focus();
            }
        }, 0);

        return () => window.clearTimeout(t);
    }, [exercise.id, exercise.choices?.length]);

    /**
     * Draws a short confetti burst on the canvas overlay.
     * No libraries required, uses requestAnimationFrame.
     */
    function shootConfetti() {
        const canvas = confettiRef.current;
        const card = cardRef.current;

        // Guard clauses for strict TS
        if (!canvas || !card) return;

        // ✅ Non-null alias for use inside nested functions (strict TS)
        const safeCanvas = canvas;

        const rect = card.getBoundingClientRect();
        safeCanvas.width = Math.floor(rect.width);
        safeCanvas.height = Math.floor(rect.height);

        const ctx = safeCanvas.getContext("2d");
        if (!ctx) return;

        const pieces = Array.from({ length: 120 }).map(() => ({
            x: safeCanvas.width / 2,
            y: safeCanvas.height / 3,
            vx: (Math.random() - 0.5) * 10,
            vy: Math.random() * -10 - 4,
            size: Math.random() * 6 + 4,
            rot: Math.random() * Math.PI,
            vr: (Math.random() - 0.5) * 0.25,
            life: 0,
            ttl: 90 + Math.floor(Math.random() * 60),
            hue: Math.floor(Math.random() * 360),
        }));

        let frame = 0;

        function tick(context: CanvasRenderingContext2D) {
            frame++;
            context.clearRect(0, 0, safeCanvas.width, safeCanvas.height);

            for (const p of pieces) {
                p.life++;
                p.vy += 0.35;
                p.x += p.vx;
                p.y += p.vy;
                p.rot += p.vr;

                const alpha = 1 - p.life / p.ttl;
                if (alpha <= 0) continue;

                context.save();
                context.globalAlpha = alpha;
                context.translate(p.x, p.y);
                context.rotate(p.rot);

                context.fillStyle = `hsl(${p.hue}, 90%, 60%)`;
                context.fillRect(
                    -p.size / 2,
                    -p.size / 2,
                    p.size,
                    p.size * 0.65
                );

                context.restore();
            }

            if (frame < 140) requestAnimationFrame(() => tick(context));
            else context.clearRect(0, 0, safeCanvas.width, safeCanvas.height);
        }

        requestAnimationFrame(() => tick(ctx));
    }

    /**
     * Optional CSS-based "wow" success animation hook.
     * (Currently not called to keep logic unchanged.)
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    function triggerWowSuccess() {
        const card = cardRef.current;
        const container = containerRef.current;

        if (!card || !container) return;

        container.classList.remove("wow-error");
        card.classList.remove("wow-success");
        void card.offsetWidth; // force reflow to restart animation
        card.classList.add("wow-success");
    }

    /**
     * Red error pulse + shake animation
     * Triggered when the answer is incorrect
     */
    function triggerErrorPulse() {
        if (!containerRef.current) return;

        containerRef.current.classList.remove("wow-success"); // 👈 QUITA VERDE si estaba

        containerRef.current.classList.remove("wow-error");
        void containerRef.current.offsetWidth;
        containerRef.current.classList.add("wow-error");
    }

    /**
     * Checks the user's answer against exercise.answer
     * Sets checked/isCorrect and triggers confetti on success.
     */
    function handleCheck() {
        const ok = checkAnswer(value, exercise.answer);
        setIsCorrect(ok);
        setChecked(true);

        if (ok) {
            triggerWowSuccess();
            shootConfetti();
        } else {
            triggerErrorPulse();
        }
    }

    /**
     * Enter key behavior:
     * - if not checked yet: Enter = check (only if value is not empty)
     * - if already checked: Enter = next random
     */
    function handleEnter() {
        if (!checked) {
            if (value.trim()) handleCheck();
        } else {
            onNext();
        }
    }

    /**
     * Keyboard controls on the container:
     * - Enter: check / next
     * - 1..9: pick choice (multiple choice mode)
     * - ArrowUp/ArrowDown: navigate choices (multiple choice mode)
     */
    function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
        if (e.key === "Enter") {
            e.preventDefault();
            handleEnter();
            return;
        }

        if (exercise.choices?.length) {
            const n = Number(e.key);
            if (!Number.isNaN(n) && n >= 1 && n <= exercise.choices.length) {
                e.preventDefault();
                setValue(exercise.choices[n - 1]);
                return;
            }

            if (e.key === "ArrowDown" || e.key === "ArrowUp") {
                e.preventDefault();
                const len = exercise.choices.length;
                if (len === 0) return;

                const currentIndex = exercise.choices.findIndex(
                    (c) => c === value
                );
                const cur = currentIndex >= 0 ? currentIndex : 0;

                const next =
                    e.key === "ArrowDown"
                        ? (cur + 1) % len
                        : (cur - 1 + len) % len;

                setValue(exercise.choices[next]);
                return;
            }
        }
    }

    /**
     * UI render
     */
    return (
        <div
            ref={cardRef}
            style={{
                maxWidth: 700,
                margin: "0 auto",
                padding: 5,
            }}
        >
            <div
                ref={containerRef}
                tabIndex={0}
                onKeyDown={handleKeyDown}
                style={{
                    maxWidth: 700,
                    margin: "40px auto",
                    padding: 20,
                    border: "1px solid #ddd",
                    borderRadius: 12,
                    outline: "none",
                    position: "relative", // required for canvas overlay positioning
                    overflow: "hidden", // keeps confetti inside the card
                }}
            >
                {/* Canvas overlay used for confetti */}
                <canvas
                    ref={confettiRef}
                    style={{
                        position: "absolute",
                        inset: 0,
                        width: "100%",
                        height: "100%",
                        pointerEvents: "none",
                        borderRadius: 12,
                    }}
                />

                <div style={{ opacity: 0.7, marginBottom: 8 }}>
                    Tipo: <b>{exercise.type}</b>
                </div>

                <h2 style={{ marginTop: 0 }}>{exercise.prompt}</h2>

                {exercise.choices?.length ? (
                    <div style={{ display: "grid", gap: 8, marginTop: 12 }}>
                        {exercise.choices.map((c) => (
                            <button
                                key={c}
                                onClick={() => setValue(c)}
                                type="button"
                                style={{
                                    padding: 12,
                                    borderRadius: 12,
                                    border:
                                        value === c
                                            ? "2px solid #4ade80"
                                            : "1px solid #ccc",
                                    background:
                                        value === c ? "#f0fdf4" : "white",
                                    color: "#111",
                                    fontSize: 16,
                                    fontWeight: 500,
                                    textAlign: "left",
                                    cursor: "pointer",
                                }}
                            >
                                {c}
                            </button>
                        ))}

                        <div
                            style={{ opacity: 0.7, fontSize: 13, marginTop: 6 }}
                        >
                            Teclado: 1–{exercise.choices.length} para elegir,
                            ↑/↓ para mover, Enter para comprobar / siguiente.
                        </div>
                    </div>
                ) : (
                    <input
                        ref={inputRef}
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                e.preventDefault();
                                handleEnter();
                            }
                        }}
                        placeholder="Escribe tu respuesta…"
                        style={{
                            width: "90%",
                            padding: 12,
                            fontSize: 16,
                            borderRadius: 10,
                            border: "1px solid #ccc",
                            marginTop: 12,
                        }}
                    />
                )}

                <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
                    <button
                        onClick={handleCheck}
                        disabled={!value.trim()}
                        type="button"
                        style={{
                            padding: "10px 14px",
                            borderRadius: 10,
                            cursor: "pointer",
                        }}
                    >
                        Check
                    </button>

                    <button
                        onClick={onNext}
                        type="button"
                        style={{
                            padding: "10px 14px",
                            borderRadius: 10,
                            cursor: "pointer",
                        }}
                    >
                        Siguiente
                    </button>
                </div>

                {checked && (
                    <div
                        style={{
                            marginTop: 14,
                            padding: 12,
                            borderRadius: 10,
                            border: "1px solid #ccc",
                        }}
                    >
                        {isCorrect ? (
                            <div
                                style={{
                                    marginTop: 8,
                                    opacity: 0.85,
                                    padding: 10,
                                    fontSize: 20,
                                    textAlign: "center",
                                }}
                            >
                                ✅ <b>Correcto</b>
                            </div>
                        ) : (
                            <div
                                style={{
                                    marginTop: 8,
                                    opacity: 0.85,
                                    padding: 10,
                                    fontSize: 20,
                                    textAlign: "center",
                                }}
                            >
                                ❌ <b>Incorrecto</b>. Respuesta correcta:{" "}
                                <b
                                    style={{
                                        marginTop: 8,
                                        opacity: 0.85,
                                        padding: 10,
                                        fontSize: 20,
                                        textAlign: "center",
                                    }}
                                >
                                    {exercise.answer}
                                </b>
                            </div>
                        )}

                        {exercise.explanation && (
                            <div
                                style={{
                                    marginTop: 8,
                                    opacity: 0.85,
                                    padding: 10,
                                    fontSize: 20,
                                    textAlign: "center",
                                }}
                            >
                                {exercise.explanation}
                            </div>
                        )}

                        <div
                            style={{
                                marginTop: 8,
                                opacity: 0.7,
                                textAlign: "center",
                            }}
                        >
                            Presiona <b>Enter</b> para continuar.
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
