import { Card } from "../ui.jsx";
import { LEVELS, BADGES, computePoints, levelForPoints, buildActivityStats, unlockedBadges } from "../../utils/gamification";

export default function GardenerProgress({ cultures = [], tasks = [], harvests = [], journal = [], zones = [], history = [], aiAnalyses = 0 }) {
  const stats = buildActivityStats({ cultures, tasks, harvests, journal, zones, history, aiAnalyses });
  const points = computePoints(stats);
  const { current, next, progress } = levelForPoints(points);
  const badges = unlockedBadges(stats);
  const unlockedCount = badges.filter((b) => b.unlocked).length;

  return (
    <Card>
      <div className="flex items-center justify-between gap-3 mb-1">
        <h2 className="text-lg font-black text-garden-pine">Niveau Jardinier</h2>
        <span className="rounded-full bg-garden-moss px-3 py-1 text-xs font-black text-garden-pine">{points} pts</span>
      </div>

      <div className="mt-3 flex items-center gap-3">
        <span className="text-3xl">{current.emoji}</span>
        <div className="flex-1 min-w-0">
          <p className="font-black text-garden-pine">{current.label}</p>
          <div className="mt-1.5 h-2.5 rounded-full bg-garden-cream overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-garden-pine to-garden-leaf transition-all" style={{ width: `${progress}%` }} />
          </div>
          <p className="mt-1 text-[11px] font-semibold text-garden-leaf">
            {next ? `${progress}% vers ${next.emoji} ${next.label} (${next.minPoints} pts)` : "Niveau maximum atteint — bravo !"}
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {LEVELS.map((l) => (
          <span key={l.key}
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${
              l.key === current.key ? "bg-garden-pine text-white" : points >= l.minPoints ? "bg-garden-moss text-garden-pine" : "bg-stone-100 text-stone-400"
            }`}>
            {l.emoji} {l.label}
          </span>
        ))}
      </div>

      <p className="mt-5 mb-2 text-xs font-black uppercase tracking-wider text-garden-leaf">
        Badges débloqués · {unlockedCount}/{BADGES.length}
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {badges.map((b) => (
          <div key={b.key}
            className={`flex flex-col items-center gap-1 rounded-2xl px-2 py-3 text-center transition ${
              b.unlocked ? "bg-garden-cream" : "bg-stone-50 opacity-50 grayscale"
            }`}>
            <span className="text-2xl">{b.emoji}</span>
            <span className="text-[10px] font-bold text-garden-pine leading-tight">{b.title}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
