export default function HealthBadge({ score, size = "md" }) {
  const color =
    score >= 90 ? "text-green-700 bg-green-50 ring-green-200" :
    score >= 75 ? "text-lime-700 bg-lime-50 ring-lime-200" :
    score >= 60 ? "text-amber-700 bg-amber-50 ring-amber-200" :
    "text-red-700 bg-red-50 ring-red-200";

  const dot =
    score >= 90 ? "bg-green-500" :
    score >= 75 ? "bg-lime-500" :
    score >= 60 ? "bg-amber-500" : "bg-red-500";

  const textSize = size === "sm" ? "text-xs" : size === "lg" ? "text-sm" : "text-xs";
  const padding  = size === "lg" ? "px-3 py-1" : "px-2 py-0.5";
  const dotSize  = size === "lg" ? "w-2 h-2" : "w-1.5 h-1.5";

  return (
    <span className={`inline-flex items-center gap-1.5 ${padding} rounded-full ring-1 font-bold ${color} ${textSize}`}>
      <span className={`${dotSize} rounded-full ${dot} flex-shrink-0`} />
      {score}/100
    </span>
  );
}
