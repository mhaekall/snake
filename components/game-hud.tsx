"use client";

import { MAX_SKILL, SKINS, type GameState } from "@/lib/game-types";

interface GameHUDProps {
  state: GameState;
}

export default function GameHUD({ state }: GameHUDProps) {
  const skin = SKINS[state.selectedSkin];
  const skillPercent = (state.skillValue / MAX_SKILL) * 100;
  const skillReady = state.skillValue >= MAX_SKILL;

  return (
    <div className="flex w-[400px] flex-col gap-3 py-3">
      {/* Score and skin info */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-0.5">
          <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>
            SCORE
          </span>
          <span
            className="text-2xl font-bold tracking-wider"
            style={{ color: "var(--primary)" }}
          >
            {state.score.toString().padStart(6, "0")}
          </span>
        </div>
        <div className="flex flex-col items-end gap-0.5">
          <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>
            HIGH
          </span>
          <span className="text-sm" style={{ color: "var(--foreground)" }}>
            {state.highScore.toString().padStart(6, "0")}
          </span>
        </div>
      </div>

      {/* Skin badge */}
      <div
        className="flex items-center justify-between rounded-md px-3 py-2"
        style={{ backgroundColor: "var(--secondary)" }}
      >
        <div className="flex items-center gap-2">
          <div
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: skin?.color, boxShadow: `0 0 8px ${skin?.glowColor}` }}
          />
          <span className="text-xs font-bold uppercase" style={{ color: "var(--foreground)" }}>
            {skin?.name}
          </span>
        </div>
        {state.combo > 1 && (
          <span
            className="text-xs font-bold"
            style={{ color: "var(--primary)" }}
          >
            x{state.combo} COMBO
          </span>
        )}
      </div>

      {/* Skill bar */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <span
            className="text-[10px] font-bold uppercase tracking-widest"
            style={{ color: skillReady ? "var(--primary)" : "var(--muted-foreground)" }}
          >
            {skin?.skillName}
          </span>
          {skillReady && (
            <span
              className="animate-pulse text-[10px] font-bold tracking-wider"
              style={{ color: "var(--primary)" }}
            >
              SPACE / TAP
            </span>
          )}
        </div>
        <div
          className="h-2.5 w-full overflow-hidden rounded-full"
          style={{ backgroundColor: "var(--muted)" }}
        >
          <div
            className="h-full rounded-full transition-all duration-200"
            style={{
              width: `${skillPercent}%`,
              backgroundColor: skillReady ? "var(--primary)" : "var(--ring)",
              boxShadow: skillReady
                ? "0 0 12px var(--primary), 0 0 24px var(--primary)"
                : "none",
            }}
          />
        </div>
      </div>
    </div>
  );
}
