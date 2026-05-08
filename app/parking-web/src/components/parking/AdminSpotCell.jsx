import { Car } from "lucide-react";

export default function AdminSpotCell({
  spot,
  onToggle,
  isSaving,
  disabled = false,
  compact = false,
  compactMode = "row",
}) {
  const isFree = spot.status === "FREE";
  const isRowCompact = compact && compactMode === "row";
  const isColumnCompact = compact && compactMode === "column";

  const handleClick = () => {
    if (!isSaving && !disabled) onToggle(spot.ID);
  };

  return (
    <div
      onClick={handleClick}
      role="button"
      tabIndex={disabled ? -1 : 0}
      onKeyDown={(e) => e.key === "Enter" && handleClick()}
      title={`Vendi ${spot.number}`}
      className={`
        relative rounded-md
        ${isRowCompact ? "w-full h-12" : isColumnCompact ? "w-full h-6" : "w-11 h-14"}
        ${isFree
          ? "bg-slate-600 border-2 border-dashed border-green-400"
          : "bg-slate-600 border-2 border-slate-500"}
        ${isSaving ? "opacity-50 animate-pulse" : ""}
        ${disabled ? "opacity-70 cursor-not-allowed" : "cursor-pointer hover:border-yellow-400 hover:border-solid hover:scale-[1.03]"}
        transition-all duration-200
        flex flex-col items-center justify-center
      `}
    >
      <span className={`${compact ? "text-[8px]" : "text-[10px]"} font-bold leading-none ${isFree ? "text-green-300" : "text-slate-400"}`}>
        {spot.number}
      </span>

      {!isFree && (
        <Car
          size={compact ? 9 : 14}
          className={`${compact ? "text-red-400 mt-0.5" : "text-red-400 mt-0.5"}`}
        />
      )}

      <div className="absolute left-0 top-1 bottom-1 w-0.5 bg-yellow-500/60"></div>
      <div className="absolute right-0 top-1 bottom-1 w-0.5 bg-yellow-500/60"></div>
    </div>
  );
}