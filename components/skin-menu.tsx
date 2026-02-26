"use client";

import { SKINS, type SkinConfig } from "@/lib/game-types";
import {
  Zap,
  Shield,
  Waves,
  Flame,
  Laugh,
  Eye,
  type LucideIcon,
} from "lucide-react";

const ICON_MAP: Record<string, LucideIcon> = {
  Zap,
  Shield,
  Waves,
  Flame,
  Laugh,
  Eye,
};

interface SkinMenuProps {
  onSelect: (key: string) => void;
}

export default function SkinMenu({ onSelect }: SkinMenuProps) {
  const skins = Object.entries(SKINS);

  return (
    <div
      className="flex min-h-screen w-full flex-col items-center justify-center p-4"
      style={{ backgroundColor: "var(--background)" }}
    >
      {/* Background grid effect */}
      <div
        className="pointer-events-none fixed inset-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0,255,204,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,204,0.03) 1px, transparent 1px)",
          backgroundSize: "20px 20px",
        }}
      />

      <div className="relative z-10 flex w-full max-w-md flex-col items-center gap-8">
        {/* Title */}
        <div className="flex flex-col items-center gap-2">
          <h1
            className="text-4xl font-bold tracking-widest"
            style={{
              color: "var(--primary)",
              textShadow: "0 0 20px var(--primary), 0 0 40px rgba(0,255,204,0.3)",
            }}
          >
            SERPENTINE
          </h1>
          <p className="text-xs uppercase tracking-[0.3em]" style={{ color: "var(--muted-foreground)" }}>
            Select Your Character
          </p>
        </div>

        {/* Skin cards */}
        <div className="flex w-full flex-col gap-3">
          {skins.map(([key, skin]) => (
            <SkinCard key={key} skinKey={key} skin={skin} onSelect={onSelect} />
          ))}
        </div>

        {/* Controls hint */}
        <div
          className="flex flex-col items-center gap-1 text-[10px] uppercase tracking-wider"
          style={{ color: "var(--muted-foreground)" }}
        >
          <span>Arrow Keys / WASD to move</span>
          <span>Space / Tap to activate skill</span>
        </div>
      </div>
    </div>
  );
}

function SkinCard({
  skinKey,
  skin,
  onSelect,
}: {
  skinKey: string;
  skin: SkinConfig;
  onSelect: (key: string) => void;
}) {
  const Icon = ICON_MAP[skin.icon] || Zap;

  return (
    <button
      onClick={() => onSelect(skinKey)}
      className="group relative flex w-full cursor-pointer items-center gap-4 overflow-hidden rounded-lg border px-4 py-3 text-left transition-all duration-200 hover:scale-[1.02]"
      style={{
        backgroundColor: "var(--card)",
        borderColor: "var(--border)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = skin.color;
        e.currentTarget.style.boxShadow = `0 0 20px ${skin.glowColor}`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--border)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      {/* Skin color indicator */}
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
        style={{
          backgroundColor: `${skin.color}15`,
          border: `1px solid ${skin.color}40`,
        }}
      >
        <Icon size={20} style={{ color: skin.color }} />
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col gap-0.5">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold" style={{ color: "var(--foreground)" }}>
            {skin.name}
          </span>
          <span
            className="rounded px-1.5 py-0.5 text-[9px] font-bold uppercase"
            style={{
              backgroundColor: `${skin.color}20`,
              color: skin.color,
            }}
          >
            {skin.skillName}
          </span>
        </div>
        <span className="text-[11px]" style={{ color: "var(--muted-foreground)" }}>
          {skin.description}
        </span>
      </div>

      {/* Arrow */}
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        className="shrink-0 opacity-30 transition-opacity group-hover:opacity-100"
        style={{ color: skin.color }}
      >
        <path
          d="M6 4L10 8L6 12"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
