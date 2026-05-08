import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { getZones, toggleStatus } from "./api/parkingApi";
import { useAuth } from "./context/AuthContext";
import LoginModal from "./components/LoginModal";
import QRCodeDisplay from "./components/QRCodeDisplay";
import AdminZoneCard from "./components/parking/AdminZoneCard";
import VisitorZoneCard from "./components/parking/VisitorZoneCard";
import { LogOut, QrCode, RefreshCw, Sparkles, Sun, Moon } from "lucide-react";

export default function App() {
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [showLogin, setShowLogin] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [selectedVisitorZoneId, setSelectedVisitorZoneId] = useState(null);
  const [visitorTheme, setVisitorTheme] = useState(() => {
    if (typeof window === "undefined") return "dark";
    const saved = window.localStorage.getItem("visitor-theme");
    return saved === "light" ? "light" : "dark";
  });
  const [adminTheme, setAdminTheme] = useState(() => {
    if (typeof window === "undefined") return "dark";
    const saved = window.localStorage.getItem("admin-theme");
    return saved === "light" ? "light" : "dark";
  });

  const { role, logout } = useAuth();
  const isAdmin = role === "admin";
  const isVisitorLight = !isAdmin && visitorTheme === "light";
  const isAdminLight = isAdmin && adminTheme === "light";
  const isFetchingRef = useRef(false);

  const load = useCallback(async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    try {
      const data = await getZones();
      setZones(data);
    } catch (err) {
      console.warn("Failed to load zones:", err);
    } finally {
      isFetchingRef.current = false;
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (savingId === null) load();
    }, 2000);
    return () => clearInterval(interval);
  }, [load, savingId]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.has("admin")) {
      setShowLogin(true);
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);
  useEffect(() => {
    if (!zones.length) return;
    const hasSelected = zones.some((zone) => zone.ID === selectedVisitorZoneId);
    if (!hasSelected) setSelectedVisitorZoneId(zones[0].ID);
  }, [zones, selectedVisitorZoneId]);
  useEffect(() => {
    window.localStorage.setItem("visitor-theme", visitorTheme);
  }, [visitorTheme]);
  useEffect(() => {
    window.localStorage.setItem("admin-theme", adminTheme);
  }, [adminTheme]);

  const onToggle = useCallback(
    async (spotId) => {
      if (!isAdmin || savingId !== null) return;

      setZones((prevZones) =>
        prevZones.map((zone) => ({
          ...zone,
          spots: zone.spots.map((spot) =>
            spot.ID === spotId
              ? { ...spot, status: spot.status === "FREE" ? "OCCUPIED" : "FREE" }
              : spot
          ),
        }))
      );

      try {
        setSavingId(spotId);
        await toggleStatus(spotId);
      } catch (err) {
        console.error("Toggle failed:", err);
        load();
      } finally {
        setSavingId(null);
      }
    },
    [isAdmin, savingId, load]
  );

  const stats = useMemo(() => {
    const allSpots = zones.flatMap((z) => z.spots || []);
    const free = allSpots.filter((s) => s.status === "FREE").length;
    const total = allSpots.length;
    return { free, total };
  }, [zones]);
  const selectedVisitorZone = useMemo(
    () => zones.find((zone) => zone.ID === selectedVisitorZoneId) || zones[0] || null,
    [zones, selectedVisitorZoneId]
  );
  const adminZones = useMemo(() => zones, [zones]);
  const zoneLabelById = useMemo(
    () => new Map(zones.map((zone, index) => [zone.ID, `P${index + 1}`])),
    [zones]
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-cyan-50 flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-400">
          <RefreshCw className="animate-spin" size={24} />
          <span className="text-lg">Duke u ngarkuar...</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen ${
        isAdmin
          ? isAdminLight
            ? "bg-gradient-to-br from-slate-100 via-gray-100 to-zinc-100"
            : "bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950"
          : isVisitorLight
            ? "bg-gradient-to-br from-slate-50 via-white to-cyan-50"
            : "bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950"
      }`}
    >
      <div className="mx-auto w-full max-w-[1600px] p-4 sm:p-6 lg:p-8">
        <div
          className={`mb-6 rounded-[24px] border px-4 py-4 shadow-[0_12px_35px_rgba(15,23,42,0.06)] backdrop-blur-md sm:mb-8 sm:px-6 sm:py-5 ${
            isAdmin
              ? isAdminLight
                ? "border-white/70 bg-white/80"
                : "border-slate-700/80 bg-slate-900/70"
              : isVisitorLight
                ? "border-cyan-100/80 bg-white/90"
                : "border-cyan-300/25 bg-slate-900/55 shadow-[0_18px_45px_rgba(6,182,212,0.18)]"
          }`}
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
            <div className="flex items-center gap-3">
              <div>
                <h1
                  className={`text-3xl font-bold tracking-tight md:text-4xl ${
                    isAdmin
                      ? isAdminLight
                        ? "text-slate-800"
                        : "text-slate-100"
                      : isVisitorLight
                        ? "text-slate-800"
                        : "bg-gradient-to-r from-cyan-200 via-sky-200 to-emerald-200 bg-clip-text text-transparent"
                  }`}
                >
                  Parking System
                </h1>
                <p className={`mt-1 ${isAdmin ? (isAdminLight ? "text-slate-500" : "text-slate-300") : isVisitorLight ? "text-slate-500" : "text-cyan-100/80"}`}>
                  {isAdmin
                    ? "Menaxho statusin e vendeve të parkimit"
                    : "Shiko vendet e lira në kohë reale"}
                </p>
              </div>

              {isAdmin ? (
                <span
                  className={`self-start rounded-full px-3 py-1 text-sm font-medium border ${
                    isAdminLight
                      ? "bg-gradient-to-r from-teal-50 to-emerald-50 text-teal-600 border-teal-100"
                      : "bg-gradient-to-r from-cyan-500/20 to-indigo-500/20 text-cyan-100 border-cyan-300/40"
                  }`}
                >
                  Admin
                </span>
              ) : (
                <span
                  className={`self-start rounded-full px-3 py-1 text-sm font-medium flex items-center gap-1 ${
                    isVisitorLight
                      ? "border border-cyan-100 bg-gradient-to-r from-cyan-50 to-teal-50 text-cyan-700"
                      : "border border-cyan-200/35 bg-gradient-to-r from-cyan-500/20 to-emerald-400/20 text-cyan-100"
                  }`}
                >
                  <Sparkles size={14} />
                  Visitor
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div
                className={`flex items-center gap-2 rounded-2xl px-4 py-2.5 shadow-sm sm:px-5 sm:py-3 ${
                  isAdmin
                    ? isAdminLight
                      ? "border border-emerald-100 bg-gradient-to-r from-emerald-50 to-cyan-50"
                      : "border border-cyan-300/30 bg-gradient-to-r from-cyan-500/15 to-indigo-500/15"
                    : isVisitorLight
                      ? "border border-cyan-100 bg-gradient-to-r from-cyan-50 to-sky-50"
                      : "border border-cyan-300/25 bg-gradient-to-r from-cyan-500/15 to-emerald-400/15 text-cyan-50"
                }`}
              >
                <span className={`text-3xl font-bold ${isAdmin ? (isAdminLight ? "text-emerald-500" : "text-emerald-300") : isVisitorLight ? "text-emerald-500" : "text-emerald-300"}`}>{stats.free}</span>
                <span className={`${isAdmin ? (isAdminLight ? "text-slate-300" : "text-slate-400") : isVisitorLight ? "text-slate-300" : "text-cyan-100/45"} text-xl`}>/</span>
                <span className={`${isAdmin ? (isAdminLight ? "text-slate-400" : "text-slate-200") : isVisitorLight ? "text-slate-400" : "text-cyan-100/80"} text-lg`}>{stats.total}</span>
                <span className={`${isAdmin ? (isAdminLight ? "text-slate-500" : "text-slate-300") : isVisitorLight ? "text-slate-500" : "text-cyan-100/75"} ml-1 text-sm`}>të lira</span>
              </div>

              {isAdmin ? (
                <>
                  <button
                    onClick={() => setShowQR(true)}
                    className={`p-3 rounded-2xl transition border ${
                      isAdminLight
                        ? "bg-violet-50 hover:bg-violet-100 text-violet-500 border-violet-100"
                        : "bg-violet-500/20 hover:bg-violet-500/30 text-violet-200 border-violet-400/40"
                    }`}
                    title="QR Code"
                  >
                    <QrCode size={20} />
                  </button>

                  <button
                    onClick={logout}
                    className={`flex items-center gap-2 px-5 py-3 font-medium rounded-2xl transition border ${
                      isAdminLight
                        ? "bg-rose-50 hover:bg-rose-100 text-rose-500 border-rose-100"
                        : "bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border-rose-400/40"
                    }`}
                  >
                    <LogOut size={18} />
                    <span>Logout</span>
                  </button>
                </>
              ) : null}
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => setAdminTheme((prev) => (prev === "dark" ? "light" : "dark"))}
                  className={`flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-medium transition ${
                    isAdminLight
                      ? "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                      : "border border-cyan-300/30 bg-cyan-500/15 text-cyan-100 hover:bg-cyan-500/25"
                  }`}
                  title="Ndrysho temën admin"
                >
                  {isAdminLight ? <Moon size={16} /> : <Sun size={16} />}
                  {isAdminLight ? "Dark" : "Light"}
                </button>
              )}
              {!isAdmin && (
                <button
                  type="button"
                  onClick={() => setVisitorTheme((prev) => (prev === "dark" ? "light" : "dark"))}
                  className={`flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-medium transition ${
                    isVisitorLight
                      ? "border border-cyan-200 bg-white text-slate-700 hover:bg-slate-50"
                      : "border border-cyan-300/30 bg-cyan-500/15 text-cyan-100 hover:bg-cyan-500/25"
                  }`}
                  title="Ndrysho temën"
                >
                  {isVisitorLight ? <Moon size={16} /> : <Sun size={16} />}
                  {isVisitorLight ? "Dark" : "Light"}
                </button>
              )}
            </div>
          </div>
        </div>

        <div
          className={`mb-6 rounded-2xl border px-5 py-4 ${
            isAdmin
              ? isAdminLight
                ? "bg-amber-50 border-amber-100 text-amber-700"
                : "bg-amber-500/15 border-amber-400/40 text-amber-200"
              : isVisitorLight
                ? "bg-gradient-to-r from-cyan-50 to-emerald-50 border-cyan-100 text-slate-600"
                : "border-cyan-300/25 bg-gradient-to-r from-slate-900/70 to-cyan-900/40 text-cyan-100"
          }`}
        >
          <p className="text-sm md:text-base">
            {isAdmin
              ? "Kliko mbi një vend për ta ndërruar statusin."
              : "Vendet me ndriçim të gjelbër janë të lira. Të dhënat rifreskohen automatikisht çdo 2 sekonda."}
          </p>
        </div>

        {isAdmin ? (
          <div className="grid grid-cols-1 gap-6">
            {adminZones.map((zone) => (
              <AdminZoneCard
                key={zone.ID}
                zone={zone}
                zoneLabel={zoneLabelById.get(zone.ID)}
                onToggle={onToggle}
                savingId={savingId}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            <div
              className={`rounded-2xl border p-4 backdrop-blur-sm ${
                isVisitorLight
                  ? "border-cyan-100/80 bg-white/92 shadow-sm"
                  : "border-cyan-300/25 bg-slate-900/50 shadow-[0_14px_35px_rgba(2,132,199,0.18)]"
              }`}
            >
              <p className={`mb-3 text-sm font-semibold ${isVisitorLight ? "text-slate-700" : "text-cyan-100"}`}>Zgjidh Lagjen</p>
              <div className="flex flex-wrap gap-2">
                {zones.map((zone) => {
                  const selected = zone.ID === selectedVisitorZone?.ID;
                  return (
                    <button
                      key={zone.ID}
                      type="button"
                      onClick={() => setSelectedVisitorZoneId(zone.ID)}
                      className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                        selected
                          ? isVisitorLight
                            ? "border-transparent bg-gradient-to-r from-cyan-600 to-sky-500 text-white shadow"
                            : "border-cyan-200/50 bg-gradient-to-r from-cyan-500 to-indigo-500 text-white shadow-[0_8px_20px_rgba(14,165,233,0.35)]"
                          : isVisitorLight
                            ? "border-cyan-100 bg-cyan-50/50 text-slate-700 hover:bg-cyan-100/60"
                            : "border-cyan-300/25 bg-cyan-400/10 text-cyan-100 hover:bg-cyan-400/20"
                      }`}
                    >
                      {zoneLabelById.get(zone.ID) || zone.name}
                    </button>
                  );
                })}
              </div>
            </div>
            {selectedVisitorZone && (
              <VisitorZoneCard
                zone={selectedVisitorZone}
                zoneLabel={zoneLabelById.get(selectedVisitorZone.ID)}
                theme={visitorTheme}
              />
            )}
          </div>
        )}

        <div className="mt-8 text-center">
          <div
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm shadow-sm ${
              isAdmin
                ? isAdminLight
                  ? "border border-slate-200 bg-white/80 text-slate-400"
                  : "border border-cyan-300/30 bg-slate-900/60 text-cyan-100/85"
                : isVisitorLight
                  ? "border border-slate-200 bg-white/80 text-slate-400"
                  : "border border-cyan-300/30 bg-slate-900/60 text-cyan-100/85"
            }`}
          >
            <RefreshCw size={14} className="animate-spin" />
            Auto-refresh çdo 2 sekonda
          </div>
        </div>
      </div>

      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
      {showQR && <QRCodeDisplay onClose={() => setShowQR(false)} />}
    </div>
  );
}