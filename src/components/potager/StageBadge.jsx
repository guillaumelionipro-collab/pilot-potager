import { STAGE_CONFIG } from "../../data/potager/plants";

export default function StageBadge({ stage, size = "md" }) {
  const cfg = STAGE_CONFIG[stage] || { emoji: "🌱", color: "text-gray-600", bg: "bg-gray-50" };
  const textSize = size === "sm" ? "text-xs" : "text-xs";
  const padding  = size === "lg" ? "px-3 py-1 text-sm" : "px-2 py-0.5";

  return (
    <span className={`inline-flex items-center gap-1 ${padding} rounded-full ring-1 ring-current/20 font-semibold ${cfg.color} ${cfg.bg} ${textSize}`}>
      {cfg.emoji} {stage}
    </span>
  );
}
