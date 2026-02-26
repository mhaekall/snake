"use client";

import { useEffect, useRef, useCallback } from "react";
import { GameEngine } from "@/lib/game-engine";
import { DIRECTIONS, GAME_WIDTH, GAME_HEIGHT, MAX_SKILL, type GameState } from "@/lib/game-types";

interface GameCanvasProps {
  skinKey: string;
  onStateChange: (state: GameState) => void;
  onBackToMenu: () => void;
}

export default function GameCanvas({ skinKey, onStateChange, onBackToMenu }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const engine = engineRef.current;
      if (!engine) return;

      if (engine.state.phase === "gameover") {
        if (e.key === "Enter" || e.key === " ") {
          onBackToMenu();
        }
        return;
      }

      switch (e.key) {
        case "ArrowUp":
        case "w":
        case "W":
          e.preventDefault();
          engine.setDirection(DIRECTIONS.UP);
          break;
        case "ArrowDown":
        case "s":
        case "S":
          e.preventDefault();
          engine.setDirection(DIRECTIONS.DOWN);
          break;
        case "ArrowLeft":
        case "a":
        case "A":
          e.preventDefault();
          engine.setDirection(DIRECTIONS.LEFT);
          break;
        case "ArrowRight":
        case "d":
        case "D":
          e.preventDefault();
          engine.setDirection(DIRECTIONS.RIGHT);
          break;
        case " ":
          e.preventDefault();
          if (engine.state.skillValue >= MAX_SKILL) {
            engine.activateSkill();
          }
          break;
      }
    },
    [onBackToMenu]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = new GameEngine(canvas);
    engineRef.current = engine;

    engine.onStateChange = onStateChange;
    engine.startGame(skinKey);

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      engine.destroy();
    };
  }, [skinKey, onStateChange, handleKeyDown]);

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStart.current = { x: touch.clientX, y: touch.clientY };

    const engine = engineRef.current;
    if (engine) {
      if (engine.state.phase === "gameover") {
        onBackToMenu();
        return;
      }
      if (engine.state.skillValue >= MAX_SKILL) {
        engine.activateSkill();
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart.current || !engineRef.current) return;
    const touch = e.changedTouches[0];
    const dx = touch.clientX - touchStart.current.x;
    const dy = touch.clientY - touchStart.current.y;

    if (Math.abs(dx) > Math.abs(dy)) {
      if (Math.abs(dx) > 30)
        engineRef.current.setDirection(dx > 0 ? DIRECTIONS.RIGHT : DIRECTIONS.LEFT);
    } else {
      if (Math.abs(dy) > 30)
        engineRef.current.setDirection(dy > 0 ? DIRECTIONS.DOWN : DIRECTIONS.UP);
    }
    touchStart.current = null;
  };

  const handleClick = () => {
    const engine = engineRef.current;
    if (engine?.state.phase === "gameover") {
      onBackToMenu();
    }
  };

  return (
    <canvas
      ref={canvasRef}
      width={GAME_WIDTH}
      height={GAME_HEIGHT}
      className="block touch-none"
      style={{
        imageRendering: "pixelated",
        boxShadow: "0 0 40px rgba(0, 255, 204, 0.15), 0 0 80px rgba(0, 255, 204, 0.05)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius)",
      }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onClick={handleClick}
    />
  );
}
