"use client";

import { useState, useCallback } from "react";
import SkinMenu from "@/components/skin-menu";
import GameCanvas from "@/components/game-canvas";
import GameHUD from "@/components/game-hud";
import type { GameState } from "@/lib/game-types";

export default function GameApp() {
  const [phase, setPhase] = useState<"menu" | "playing">("menu");
  const [selectedSkin, setSelectedSkin] = useState("CLASSIC");
  const [gameState, setGameState] = useState<GameState>({
    phase: "menu",
    score: 0,
    highScore: 0,
    skillValue: 0,
    selectedSkin: "CLASSIC",
    combo: 0,
    comboTimer: 0,
  });
  const [gameKey, setGameKey] = useState(0);

  const handleSelectSkin = (key: string) => {
    setSelectedSkin(key);
    setPhase("playing");
    setGameKey((k) => k + 1);
  };

  const handleStateChange = useCallback((state: GameState) => {
    setGameState(state);
  }, []);

  const handleBackToMenu = () => {
    setPhase("menu");
  };

  if (phase === "menu") {
    return <SkinMenu onSelect={handleSelectSkin} />;
  }

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center p-4"
      style={{ backgroundColor: "var(--background)" }}
    >
      {/* Background grid */}
      <div
        className="pointer-events-none fixed inset-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0,255,204,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,204,0.02) 1px, transparent 1px)",
          backgroundSize: "20px 20px",
        }}
      />

      <div className="relative z-10 flex flex-col items-center">
        <GameHUD state={gameState} />
        <GameCanvas
          key={gameKey}
          skinKey={selectedSkin}
          onStateChange={handleStateChange}
          onBackToMenu={handleBackToMenu}
        />
        {/* Footer controls hint */}
        <div
          className="mt-3 flex gap-4 text-[10px] uppercase tracking-wider"
          style={{ color: "var(--muted-foreground)" }}
        >
          <span>WASD / Arrows</span>
          <span>Space = Skill</span>
        </div>
      </div>
    </div>
  );
}
