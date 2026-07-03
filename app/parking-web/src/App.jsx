import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { getZones, toggleStatus } from "./api/parkingApi";
import { useAuth } from "./context/AuthContext";
import LoginModal from "./components/LoginModal";
import QRCodeDisplay from "./components/QRCodeDisplay";
import AdminZoneCard from "./components/parking/AdminZoneCard";
import VisitorZoneCard from "./components/parking/VisitorZoneCard";
import { LogOut, QrCode, RefreshCw, Sparkles, Sun, Moon, X } from "lucide-react";
const visitorReservationStorageKey = "visitor-slot-reservations";

function readVisitorReservationsForDashboard() {
  if (typeof window === "undefined") return {};

  try {
    const raw = window.localStorage.getItem(visitorReservationStorageKey);
    if (!raw) return {};

    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function formatDashboardDuration(hours) {
  const numericHours = Number(hours || 0);

  if (numericHours >= 24 * 365) return "Rezident";
  if (numericHours === 24 * 7) return "1 jave";
  if (numericHours === 24) return "24h";
  if (numericHours > 0) return `${numericHours}h`;

  return "-";
}
function getDashboardDate(value) {
  if (!value) return null;

  const directDate = new Date(value);
  if (!Number.isNaN(directDate.getTime())) return directDate;

  const numericValue = Number(value);
  if (Number.isFinite(numericValue)) {
    const numericDate = new Date(numericValue);
    if (!Number.isNaN(numericDate.getTime())) return numericDate;
  }

  return null;
}
function formatDashboardExpiryTime(expiresAt) {
  const date = getDashboardDate(expiresAt);
  if (!date) return "-";

  return date.toLocaleTimeString("de-DE", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function formatDashboardExpiryDate(expiresAt) {
  const date = getDashboardDate(expiresAt);
  if (!date) return "-";

  return date.toLocaleDateString("de-DE");
}
export default function App() {
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [showLogin, setShowLogin] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [showVisitorDashboard, setShowVisitorDashboard] = useState(false);
  const [visitorReservationsSnapshot, setVisitorReservationsSnapshot] = useState(() =>
    readVisitorReservationsForDashboard()
  );
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

  useEffect(() => {
    const loadVisitorReservations = () => {
      setVisitorReservationsSnapshot(readVisitorReservationsForDashboard());
    };

    loadVisitorReservations();

    const interval = setInterval(loadVisitorReservations, 1000);
    return () => clearInterval(interval);
  }, []);


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
  const visitorDashboardRows = useMemo(() => {
    const now = Date.now();

    return zones
      .flatMap((zone, index) => {
        const dashboardZoneLabel = zoneLabelById.get(zone.ID) || zone.code || zone.name || `P${index + 1}`;

        return (zone.spots || [])
          .filter((spot) => {
            const status = String(spot?.status || "").toUpperCase();
            if (status !== "OCCUPIED") return false;

            const expiresAtDate = getDashboardDate(spot?.expiresAt);
            if (!expiresAtDate) return false;

            return expiresAtDate.getTime() > now;
          })
          .map((spot) => ({
            zone: dashboardZoneLabel,
            parking: spot?.number ?? "-",
            car: spot?.plate || "-",
            duration: formatDashboardDuration(spot?.reservedHours),
            expiryTime: formatDashboardExpiryTime(spot?.expiresAt),
            expiryDate: formatDashboardExpiryDate(spot?.expiresAt),
          }));
      })
      .sort((a, b) => {
        if (a.zone !== b.zone) return a.zone.localeCompare(b.zone);
        return Number(a.parking) - Number(b.parking);
      });
  }, [zones, zoneLabelById]);
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
      className={`min-h-screen ${isAdmin
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
          className={`mb-6 rounded-[24px] border px-4 py-4 shadow-[0_12px_35px_rgba(15,23,42,0.06)] backdrop-blur-md sm:mb-8 sm:px-6 sm:py-5 ${isAdmin
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
                  className={`text-3xl font-bold tracking-tight md:text-4xl ${isAdmin
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
                  className={`self-start rounded-full px-3 py-1 text-sm font-medium border ${isAdminLight
                    ? "bg-gradient-to-r from-teal-50 to-emerald-50 text-teal-600 border-teal-100"
                    : "bg-gradient-to-r from-cyan-500/20 to-indigo-500/20 text-cyan-100 border-cyan-300/40"
                    }`}
                >
                  Admin
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowVisitorDashboard(true)}
                  className={`self-start flex items-center gap-1 rounded-full border px-3 py-1 text-sm font-medium transition-all duration-200 ${isVisitorLight
                    ? "border-yellow-200 !bg-yellow-400 text-slate-900 shadow-sm hover:!bg-yellow-500"
                    : "border-yellow-300/70 !bg-yellow-400 text-slate-900 shadow-sm hover:!bg-yellow-500"
                    }`}
                  title="Hap dashboardin e rezervimeve"
                >
                  <Sparkles size={14} />
                  Visitor
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div
                className={`flex items-center gap-2 rounded-2xl px-4 py-2.5 shadow-sm sm:px-5 sm:py-3 ${isAdmin
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
                    className={`p-3 rounded-2xl transition border ${isAdminLight
                      ? "bg-violet-50 hover:bg-violet-100 text-violet-500 border-violet-100"
                      : "bg-violet-500/20 hover:bg-violet-500/30 text-violet-200 border-violet-400/40"
                      }`}
                    title="QR Code"
                  >
                    <QrCode size={20} />
                  </button>

                  <button
                    onClick={logout}
                    className={`flex items-center gap-2 px-5 py-3 font-medium rounded-2xl transition border ${isAdminLight
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
                  className={`flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-medium transition ${isAdminLight
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
                  className={`flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-medium transition ${isVisitorLight
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
          className={`mb-6 rounded-2xl border px-5 py-4 ${isAdmin
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
              className={`rounded-2xl border p-4 backdrop-blur-sm ${isVisitorLight
                ? "border-cyan-100/80 bg-white/92 shadow-sm"
                : "border-cyan-300/25 bg-slate-900/50 shadow-[0_14px_35px_rgba(2,132,199,0.18)]"
                }`}
            >
              <p className={`mb-3 text-sm font-semibold ${isVisitorLight ? "text-slate-700" : "text-cyan-100"}`}>Zgjedh Zonen</p>
              <div className="flex flex-wrap gap-2">
                {zones.map((zone) => {
                  const selected = zone.ID === selectedVisitorZone?.ID;
                  return (
                    <button
                      key={zone.ID}
                      type="button"
                      onClick={() => setSelectedVisitorZoneId(zone.ID)}
                      className={`rounded-full border px-4 py-2 text-sm font-semibold transition-all duration-200 ${selected
                        ? "border-yellow-200 !bg-yellow-400 text-slate-900 shadow-md shadow-yellow-500/30"
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
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm shadow-sm ${isAdmin
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

      {showVisitorDashboard && !isAdmin && (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-slate-950/70 p-2 sm:p-3">
          <div
            className={`flex h-[92dvh] max-h-[92dvh] w-full max-w-5xl flex-col rounded-2xl border p-3 shadow-2xl sm:h-[88vh] sm:max-h-[88vh] sm:p-4 ${isVisitorLight
              ? "border-cyan-200 bg-white text-slate-800"
              : "border-cyan-300/30 bg-slate-900 text-cyan-50"
              }`}
          >
            <div className="mb-3 flex shrink-0 items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold">Dashboard i rezervimeve</h2>
                <p className={`mt-1 text-xs ${isVisitorLight ? "text-slate-500" : "text-cyan-100/70"}`}>
                  Lista e parkingjeve të rezervuara aktualisht.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowVisitorDashboard(false)}
                className={`rounded-lg border p-2 transition ${isVisitorLight
                  ? "border-slate-200 text-slate-600 hover:bg-slate-100"
                  : "border-slate-600 text-cyan-100 hover:bg-slate-800"
                  }`}
              >
                <X size={18} />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-hidden rounded-xl border border-slate-700/30">
              <div
                className="h-full w-full overflow-auto"
                style={{
                  WebkitOverflowScrolling: "touch",
                  overscrollBehavior: "contain",
                }}
              >
                <table className="w-full min-w-[760px] border-collapse text-left text-sm">
                  <thead
                    className={`sticky top-0 z-10 ${isVisitorLight
                      ? "bg-slate-100 text-slate-700"
                      : "bg-slate-800 text-cyan-100"
                      }`}
                  >
                    <tr>
                      <th className="whitespace-nowrap px-3 py-3 font-semibold">Zona</th>
                      <th className="whitespace-nowrap px-3 py-3 font-semibold">Parkingu</th>
                      <th className="whitespace-nowrap px-3 py-3 font-semibold">Makina</th>
                      <th className="whitespace-nowrap px-3 py-3 font-semibold">Kohëzgjatja</th>
                      <th className="whitespace-nowrap px-3 py-3 font-semibold">Skadimi Ora</th>
                      <th className="whitespace-nowrap px-3 py-3 font-semibold">Skadimi data</th>
                    </tr>
                  </thead>

                  <tbody>
                    {visitorDashboardRows.length > 0 ? (
                      visitorDashboardRows.map((row, index) => (
                        <tr
                          key={`${row.zone}-${row.parking}-${row.car}-${index}`}
                          className={`border-t ${isVisitorLight
                            ? "border-slate-200 hover:bg-slate-50"
                            : "border-slate-700 hover:bg-slate-800/70"
                            }`}
                        >
                          <td className="whitespace-nowrap px-3 py-3 font-semibold">{row.zone}</td>
                          <td className="whitespace-nowrap px-3 py-3">{row.parking}</td>
                          <td className="whitespace-nowrap px-3 py-3">{row.car}</td>
                          <td className="whitespace-nowrap px-3 py-3">{row.duration}</td>
                          <td className="whitespace-nowrap px-3 py-3">{row.expiryTime}</td>
                          <td className="whitespace-nowrap px-3 py-3">{row.expiryDate}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={6}
                          className={`px-3 py-8 text-center text-sm ${isVisitorLight ? "text-slate-500" : "text-cyan-100/70"
                            }`}
                        >
                          Nuk ka rezervime aktive për momentin.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-3 flex shrink-0 justify-end">
              <button
                type="button"
                onClick={() => setShowVisitorDashboard(false)}
                className="rounded-lg border border-slate-300 !bg-slate-700 px-4 py-2 text-sm font-semibold text-white transition hover:!bg-slate-600"
              >
                Mbyll
              </button>
            </div>
          </div>
        </div>
      )}

      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
      {showQR && <QRCodeDisplay onClose={() => setShowQR(false)} />}
    </div>
  );
}