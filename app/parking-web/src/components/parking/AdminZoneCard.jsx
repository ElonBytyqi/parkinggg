import { useMemo, useState } from "react";
import { Car } from "lucide-react";
import AdminSpotCell from "./AdminSpotCell";

export default function AdminZoneCard({ zone, zoneLabel, onToggle, savingId }) {
  const [bulkTargetStatus, setBulkTargetStatus] = useState(null);
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);
  const spots = zone.spots || [];
  const renderSpots = [...spots].sort((a, b) => a.number - b.number);

  const freeCount = renderSpots.filter((s) => s.status === "FREE").length;
  const totalCount = renderSpots.length;
  const actionableSpots = useMemo(
    () => renderSpots.filter((spot) => !spot.isVirtual),
    [renderSpots]
  );
  const bulkSpotsToChange = useMemo(() => {
    if (!bulkTargetStatus) return [];
    return actionableSpots.filter((spot) => spot.status !== bulkTargetStatus);
  }, [actionableSpots, bulkTargetStatus]);
  const isBulkControlDisabled = isBulkUpdating;

  const runBulkUpdate = async () => {
    if (!bulkTargetStatus || isBulkUpdating || savingId !== null) return;
    setIsBulkUpdating(true);
    try {
      for (const spot of bulkSpotsToChange) {
        await onToggle(spot.ID);
      }
      setBulkTargetStatus(null);
    } finally {
      setIsBulkUpdating(false);
    }
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-700 bg-slate-800 shadow-xl sm:rounded-3xl">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 sm:px-6 sm:py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm sm:h-11 sm:w-11">
              <span className="text-lg font-black text-blue-600 sm:text-xl">P</span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-white sm:text-xl">{zoneLabel || zone.name}</h2>
              <p className="text-white/80 text-xs">Menaxhim i zonës</p>
            </div>
          </div>

          <div className="flex w-fit items-baseline gap-1 rounded-2xl border border-white/10 bg-white/15 px-4 py-1.5 sm:py-2">
            <span className="text-xl font-bold text-green-300 sm:text-2xl">{freeCount}</span>
            <span className="text-white/40">/</span>
            <span className="text-white/70">{totalCount}</span>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={isBulkControlDisabled}
            onClick={() => {
              if (savingId !== null) return;
              setBulkTargetStatus("FREE");
            }}
            className="rounded-lg border border-emerald-300/60 bg-emerald-500/20 px-3 py-1.5 text-xs font-semibold text-emerald-100 transition hover:bg-emerald-500/30 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Krejt të lira
          </button>
          <button
            type="button"
            disabled={isBulkControlDisabled}
            onClick={() => {
              if (savingId !== null) return;
              setBulkTargetStatus("OCCUPIED");
            }}
            className="rounded-lg border border-rose-300/60 bg-rose-500/20 px-3 py-1.5 text-xs font-semibold text-rose-100 transition hover:bg-rose-500/30 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Krejt të zëna
          </button>
        </div>
      </div>

      <div className="bg-slate-700 p-2 sm:p-4">
        <div className="grid grid-cols-7 gap-1.5">
          {renderSpots.map((spot) => (
            <AdminSpotCell
              key={spot.ID}
              spot={spot}
              onToggle={onToggle}
              isSaving={savingId === spot.ID}
              disabled={Boolean(spot.isVirtual)}
            />
          ))}

          {Array.from({ length: (7 - (renderSpots.length % 7)) % 7 }).map((_, i) => (
            <div key={`empty-${i}`} className="w-11 h-14 rounded-md bg-slate-700" />
          ))}
        </div>
      </div>

      <div className="border-t border-slate-600 bg-slate-800 px-4 py-3">
        <div className="flex flex-wrap items-center justify-center gap-4 text-xs sm:gap-6">
          <span className="flex items-center gap-2 text-slate-400">
            <span className="w-6 h-4 border-2 border-dashed border-green-400 rounded bg-slate-600"></span>
            E lirë
          </span>
          <span className="flex items-center gap-2 text-slate-400">
            <span className="w-6 h-4 border-2 border-slate-500 rounded flex items-center justify-center bg-slate-600">
              <Car size={10} className="text-red-400" />
            </span>
            E zënë
          </span>
        </div>
      </div>
      {bulkTargetStatus && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-slate-950/70 p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-600 bg-slate-800 p-5 shadow-2xl">
            <h3 className="text-base font-bold text-white">Konfirmo ndryshimin masiv</h3>
            <p className="mt-2 text-sm text-slate-300">
              A je i sigurt që dëshiron ta vendosësh këtë zonë{" "}
              <span className="font-semibold text-white">{zoneLabel || zone.name}</span> si{" "}
              <span className="font-semibold text-white">
                {bulkTargetStatus === "FREE" ? "krejt të lira" : "krejt të zëna"}
              </span>
              ?
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Do të ndryshohen {bulkSpotsToChange.length} parkingje.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                disabled={isBulkUpdating}
                onClick={() => setBulkTargetStatus(null)}
                className="rounded-lg border border-slate-500 px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Anulo
              </button>
              <button
                type="button"
                disabled={isBulkUpdating}
                onClick={runBulkUpdate}
                className="rounded-lg border border-blue-400 bg-blue-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isBulkUpdating ? "Duke ruajtur..." : "Po, vazhdo"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}