import { useEffect, useMemo, useState } from "react";
import { divIcon } from "leaflet";
import { AlertTriangle, LocateFixed, Navigation } from "lucide-react";
import { MapContainer, Marker, Polygon, Polyline, TileLayer, useMap, useMapEvents } from "react-leaflet";
import { toggleStatus } from "../../api/parkingApi";

const schoolMapCenter = [42.641419406177526, 21.101972778158114];
const envMapCenter = [
  Number(import.meta.env.VITE_VISITOR_MAP_CENTER_LAT),
  Number(import.meta.env.VITE_VISITOR_MAP_CENTER_LNG),
];
const hasValidEnvCenter = envMapCenter.every((value) => Number.isFinite(value));
const mapZoom = Number(import.meta.env.VITE_VISITOR_MAP_ZOOM || 20);
const defaultMapStyle = "googleHybrid";
const zoneMapDefaults = {
  p1: {
    center: [42.64086, 21.10147],
    focusCenter: [42.64086, 21.10147],
    zoom: 20,
    focusZoom: 21,
  },
};

function getDynamicZoneMapDefaults(zoneNameKey) {
  const byZone = zoneMapDefaults[zoneNameKey];
  if (byZone) return byZone;
  if (hasValidEnvCenter) {
    return {
      center: envMapCenter,
      focusCenter: envMapCenter,
      zoom: mapZoom,
      focusZoom: 18,
    };
  }
  return {
    center: schoolMapCenter,
    focusCenter: schoolMapCenter,
    zoom: mapZoom,
    focusZoom: 18,
  };
}

const schoolReferenceLine = [
  [42.64099399457757, 21.101470374341126],
  [42.64083479951197, 21.100919201893042],
];
const schoolReferenceLineTwoStart = [42.640960385933084, 21.10149135813117];
const schoolReferenceLineVector = [
  schoolReferenceLine[1][0] - schoolReferenceLine[0][0],
  schoolReferenceLine[1][1] - schoolReferenceLine[0][1],
];
const schoolReferenceLineTwo = [
  schoolReferenceLineTwoStart,
  [
    schoolReferenceLineTwoStart[0] + schoolReferenceLineVector[0],
    schoolReferenceLineTwoStart[1] + schoolReferenceLineVector[1],
  ],
];
const schoolBlockOffsetVector = [
  schoolReferenceLineTwoStart[0] - schoolReferenceLine[0][0],
  schoolReferenceLineTwoStart[1] - schoolReferenceLine[0][1],
];
const schoolReferenceAreaBetweenLines = [
  schoolReferenceLine[0],
  schoolReferenceLine[1],
  schoolReferenceLineTwo[1],
  schoolReferenceLineTwo[0],
];
const schoolReferenceLineThree = [
  [42.64102551443864, 21.10157753507659],
  [42.64115945044013, 21.102028927824175],
];
const schoolReferenceLineThreeVector = [
  schoolReferenceLineThree[1][0] - schoolReferenceLineThree[0][0],
  schoolReferenceLineThree[1][1] - schoolReferenceLineThree[0][1],
];
const schoolReferenceLineFourStart = [
  schoolReferenceLineThree[0][0] + schoolBlockOffsetVector[0],
  schoolReferenceLineThree[0][1] + schoolBlockOffsetVector[1],
];
const schoolReferenceLineFour = [
  schoolReferenceLineFourStart,
  [
    schoolReferenceLineFourStart[0] + schoolReferenceLineThreeVector[0],
    schoolReferenceLineFourStart[1] + schoolReferenceLineThreeVector[1],
  ],
];
const schoolReferenceLineFive = [
  [42.64077477286685, 21.101059072231696],
  [42.64081583473613, 21.10121297535534],
];
const schoolReferenceLineSix = [
  [42.640736057365274, 21.10107980529496],
  [42.640777705858405, 21.101231316142073],
];
const schoolReferenceLineSeven = [
  [42.64067681086926, 21.101125258549082],
  [42.640720805797436, 21.1012895282044],
];
const schoolReferenceLineEight = [
  [42.64063105611096, 21.101146789037916],
  [42.64067446447221, 21.101314248395216],
];
const schoolReferenceLineNine = [
  [42.64055029778056, 21.101182872542257],
  [42.640592532998085, 21.101352724176138],
];
const schoolReferenceLineTen = [
  [42.64063683535766, 21.101333482885416],
  [42.640594941697586, 21.101163195659534],
];
const schoolReferenceLineEleven = [
  [42.640472087394275, 21.101220152184915],
  [42.6405137360641, 21.101393990946338],
];
const schoolReferenceLineTwelve = [
  [42.64042750568863, 21.101240885248224],
  [42.640467981185886, 21.101416318860657],
];
const schoolReferenceLineTenAligned = [
  schoolReferenceLineTen[1],
  schoolReferenceLineTen[0],
];
const schoolReferenceAreaBetweenLinesFour = [
  schoolReferenceLineNine[0],
  schoolReferenceLineNine[1],
  schoolReferenceLineTenAligned[1],
  schoolReferenceLineTenAligned[0],
];
const schoolReferenceAreaBetweenLinesFive = [
  schoolReferenceLineFive[0],
  schoolReferenceLineFive[1],
  schoolReferenceLineSix[1],
  schoolReferenceLineSix[0],
];
const schoolReferenceAreaBetweenLinesSix = [
  schoolReferenceLineEleven[0],
  schoolReferenceLineEleven[1],
  schoolReferenceLineTwelve[1],
  schoolReferenceLineTwelve[0],
];
const schoolReferenceAreaBetweenLinesThree = [
  schoolReferenceLineSeven[0],
  schoolReferenceLineSeven[1],
  schoolReferenceLineEight[1],
  schoolReferenceLineEight[0],
];
const schoolReferenceAreaBetweenLinesTwo = [
  schoolReferenceLineThree[0],
  schoolReferenceLineThree[1],
  schoolReferenceLineFour[1],
  schoolReferenceLineFour[0],
];
const allParkingAreaPoints = [
  ...schoolReferenceAreaBetweenLines,
  ...schoolReferenceAreaBetweenLinesTwo,
  ...schoolReferenceAreaBetweenLinesThree,
  ...schoolReferenceAreaBetweenLinesFour,
  ...schoolReferenceAreaBetweenLinesFive,
  ...schoolReferenceAreaBetweenLinesSix,
];
const overlayPadding = 0.00035;
const overlayBounds = allParkingAreaPoints.reduce(
  (acc, point) => ({
    minLat: Math.min(acc.minLat, point[0]),
    maxLat: Math.max(acc.maxLat, point[0]),
    minLng: Math.min(acc.minLng, point[1]),
    maxLng: Math.max(acc.maxLng, point[1]),
  }),
  {
    minLat: Number.POSITIVE_INFINITY,
    maxLat: Number.NEGATIVE_INFINITY,
    minLng: Number.POSITIVE_INFINITY,
    maxLng: Number.NEGATIVE_INFINITY,
  }
);
const outsideOverlayOuterRing = [
  [overlayBounds.maxLat + overlayPadding, overlayBounds.minLng - overlayPadding],
  [overlayBounds.maxLat + overlayPadding, overlayBounds.maxLng + overlayPadding],
  [overlayBounds.minLat - overlayPadding, overlayBounds.maxLng + overlayPadding],
  [overlayBounds.minLat - overlayPadding, overlayBounds.minLng - overlayPadding],
];
const outsideOverlayMask = [
  outsideOverlayOuterRing,
  schoolReferenceAreaBetweenLines,
  schoolReferenceAreaBetweenLinesTwo,
  schoolReferenceAreaBetweenLinesThree,
  schoolReferenceAreaBetweenLinesFour,
  schoolReferenceAreaBetweenLinesFive,
  schoolReferenceAreaBetweenLinesSix,
];
const parkingSlotWidthMeters = 2.5;
const parkingSlotInsetRatio = 0.08;
const reservationOptions = [
  { hours: 1, amount: 0.5, label: "1 ore (0.50€)" },
  { hours: 2, amount: 1.0, label: "2 ore (1.00€)" },
  { hours: 3, amount: 1.5, label: "3 ore (1.50€)" },
  { hours: 24, amount: 5.0, label: "24h (5.00€)" },
  { hours: 24 * 7, amount: 20.0, label: "Javor - 7 dite (20.00€)" },
  { hours: 24 * 365, amount: 70.0, label: "Banoret rezident (70.00€/vit)" },
];
const reservationStorageKey = "visitor-slot-reservations";
const lastPlateStorageKey = "visitor-last-plate";
const plateRegex = /^(0[1-7])-\d{3}-[A-Z]{2}$/;
function readStoredPlate() {
  try {
    const value = window.localStorage.getItem(lastPlateStorageKey) || "";
    return formatPlateInput(String(value));
  } catch {
    return "";
  }
}

function formatPlateInput(rawValue) {
  const cleaned = rawValue.toUpperCase().replace(/[^0-9A-Z]/g, "");
  const prefix = cleaned.slice(0, 2);
  const middle = cleaned.slice(2, 5).replace(/[^0-9]/g, "");
  const suffix = cleaned.slice(5, 7).replace(/[^A-Z]/g, "");

  let formatted = prefix;
  if (prefix.length === 2) formatted += "-";
  if (middle.length > 0) formatted += middle;
  if (middle.length === 3) formatted += "-";
  if (suffix.length > 0) formatted += suffix;
  return formatted.slice(0, 9);
}

function getPlateValidationMessage(plate) {
  const value = plate.trim();
  if (!value) return "";
  if (plateRegex.test(value)) return "";
  if (!value.startsWith("0")) return "Targa duhet te filloje me 0.";
  if (value.length >= 2) {
    const prefix = value.slice(0, 2);
    if (!/^0[1-7]$/.test(prefix)) return "Dy numrat e pare lejohen vetem nga 01 deri 07.";
  }
  return "Formati i sakte:  (01-07, pastaj 3 numra, pastaj 2 shkronja te medha).";
}

function distanceMeters(pointA, pointB) {
  const toRad = (value) => (value * Math.PI) / 180;
  const R = 6371000;
  const lat1 = toRad(pointA[0]);
  const lat2 = toRad(pointB[0]);
  const dLat = toRad(pointB[0] - pointA[0]);
  const dLng = toRad(pointB[1] - pointA[1]);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function readStoredReservations() {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(reservationStorageKey);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}



const tileOptions = {
  googleHybrid: {
    attribution: "Imagery © Google",
    url: "https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}",
  },
  googleSatellite: {
    attribution: "Imagery © Google",
    url: "https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}",
  },
  street: {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  },
};

function MapController({ center, zoom, recenterSignal }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom, { animate: true, duration: 0.5 });
  }, [map, center, zoom, recenterSignal]);
  return null;
}

function MapInteractionTracker({ enabled, onInteractionChange }) {
  useMapEvents({
    movestart: () => {
      if (enabled) onInteractionChange(true);
    },
    zoomstart: () => {
      if (enabled) onInteractionChange(true);
    },
    moveend: () => {
      if (enabled) onInteractionChange(false);
    },
    zoomend: () => {
      if (enabled) onInteractionChange(false);
    },
  });
  return null;
}

export default function VisitorZoneCard({ zone, zoneLabel, theme = "dark" }) {
  const zoneNameKey = String(zone?.name || "").trim().toLowerCase();
  const zoneConfig = getDynamicZoneMapDefaults(zoneNameKey);
  const zoneCenter = zoneConfig.center || schoolMapCenter;
  const zoneFocusCenter = zoneConfig.focusCenter || zoneCenter;
  const zoneZoom = zoneConfig.zoom || mapZoom;
  const zoneFocusZoom = zoneConfig.focusZoom || 18;
  const [mapStyle, setMapStyle] = useState(defaultMapStyle);
  const [mapViewCenter, setMapViewCenter] = useState(zoneCenter);
  const [mapViewZoom, setMapViewZoom] = useState(zoneZoom);
  const [recenterSignal, setRecenterSignal] = useState(0);
  const [userLocation, setUserLocation] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [bookingSlot, setBookingSlot] = useState(null);
  const [bookingTab, setBookingTab] = useState("payment");
  const [selectedHours, setSelectedHours] = useState(1);
  const [plateNumber, setPlateNumber] = useState(() => readStoredPlate());
  const [plateError, setPlateError] = useState("");
  const [reservationError, setReservationError] = useState("");
  const [isSubmittingReservation, setIsSubmittingReservation] = useState(false);
  const [localReservations, setLocalReservations] = useState({});
  const [isMobile, setIsMobile] = useState(false);
  const [isInteracting, setIsInteracting] = useState(false);
  const [occupiedWarning, setOccupiedWarning] = useState(null);
  const [myCarMessage, setMyCarMessage] = useState("");
  const [nowTimestamp, setNowTimestamp] = useState(Date.now());
  const isLightTheme = theme === "light";
  const spots = zone?.spots || [];
  const freeSpots = spots.filter((s) => s.status === "FREE");
  const occupiedSpots = spots.filter((s) => s.status !== "FREE");
  const selectedTile = tileOptions[mapStyle];
  const isSatelliteStyle = mapStyle === "googleSatellite";
  const generatedSlotCount = useMemo(() => {
    const lineOneLength = distanceMeters(schoolReferenceLine[0], schoolReferenceLine[1]);
    const lineTwoLength = distanceMeters(schoolReferenceLineTwo[0], schoolReferenceLineTwo[1]);
    const usableLength = Math.min(lineOneLength, lineTwoLength);
    return Math.max(1, Math.floor(usableLength / parkingSlotWidthMeters));
  }, []);
  const generatedSlotCountTwo = useMemo(() => {
    const lineOneLength = distanceMeters(schoolReferenceLineThree[0], schoolReferenceLineThree[1]);
    const lineTwoLength = distanceMeters(schoolReferenceLineFour[0], schoolReferenceLineFour[1]);
    const usableLength = Math.min(lineOneLength, lineTwoLength);
    return Math.max(1, Math.floor(usableLength / parkingSlotWidthMeters));
  }, []);
  const generatedSlotCountThree = useMemo(() => {
    const lineOneLength = distanceMeters(schoolReferenceLineSeven[0], schoolReferenceLineSeven[1]);
    const lineTwoLength = distanceMeters(schoolReferenceLineEight[0], schoolReferenceLineEight[1]);
    const usableLength = Math.min(lineOneLength, lineTwoLength);
    return Math.max(1, Math.floor(usableLength / parkingSlotWidthMeters));
  }, []);
  const generatedSlotCountFour = useMemo(() => {
    const lineOneLength = distanceMeters(schoolReferenceLineNine[0], schoolReferenceLineNine[1]);
    const lineTwoLength = distanceMeters(
      schoolReferenceLineTenAligned[0],
      schoolReferenceLineTenAligned[1]
    );
    const usableLength = Math.min(lineOneLength, lineTwoLength);
    return Math.max(1, Math.floor(usableLength / parkingSlotWidthMeters));
  }, []);
  const generatedSlotCountFive = useMemo(() => {
    const lineOneLength = distanceMeters(schoolReferenceLineFive[0], schoolReferenceLineFive[1]);
    const lineTwoLength = distanceMeters(schoolReferenceLineSix[0], schoolReferenceLineSix[1]);
    const usableLength = Math.min(lineOneLength, lineTwoLength);
    return Math.max(1, Math.floor(usableLength / parkingSlotWidthMeters));
  }, []);
  const generatedSlotCountSix = useMemo(() => {
    const lineOneLength = distanceMeters(schoolReferenceLineEleven[0], schoolReferenceLineEleven[1]);
    const lineTwoLength = distanceMeters(schoolReferenceLineTwelve[0], schoolReferenceLineTwelve[1]);
    const usableLength = Math.min(lineOneLength, lineTwoLength);
    return Math.max(1, Math.floor(usableLength / parkingSlotWidthMeters));
  }, []);
  const selectedReservationOption = useMemo(
    () => reservationOptions.find((option) => option.hours === selectedHours) || reservationOptions[0],
    [selectedHours]
  );
  const selectedReservationAmount = selectedReservationOption.amount;
  const activeBookingReservation = bookingSlot ? localReservations[String(bookingSlot.number)] : null;
  const bookingReservationMsLeft = Math.max(0, Number(activeBookingReservation?.expiresAt || 0) - nowTimestamp);
  const bookingReservationMinutesLeft = Math.ceil(bookingReservationMsLeft / 60000);
  const bookingHasMyActiveReservation = bookingReservationMsLeft > 0;
  const plateValidationMessage = useMemo(() => getPlateValidationMessage(plateNumber), [plateNumber]);
  const isPlateValid = plateValidationMessage === "";
  const zoneSlotPolygons = useMemo(() => {
    const lerp = (a, b, t) => a + (b - a) * t;
    const pointOn = (line, t) => [
      lerp(line[0][0], line[1][0], t),
      lerp(line[0][1], line[1][1], t),
    ];
    const spotByNumber = new Map(
      spots
        .map((spot) => {
          const n = Number(spot?.number);
          return Number.isFinite(n) ? [n, spot] : null;
        })
        .filter(Boolean)
    );
    const slots = [];

    const appendSlots = (topLine, bottomLine, slotCount, startNumber) => {
      for (let i = 0; i < slotCount; i += 1) {
        const t0 = (i + parkingSlotInsetRatio) / slotCount;
        const t1 = (i + 1 - parkingSlotInsetRatio) / slotCount;
        const p1 = pointOn(topLine, t0);
        const p2 = pointOn(topLine, t1);
        const p3 = pointOn(bottomLine, t1);
        const p4 = pointOn(bottomLine, t0);
        const slotNumber = startNumber + i;
        const spot = spotByNumber.get(slotNumber);
        const reservation = localReservations[String(slotNumber)];
        const backendStatus = String(spot?.status || "FREE").toUpperCase();
        const reservationMsLeft = Number(reservation?.expiresAt || 0) - nowTimestamp;
        const hasActiveReservation = reservationMsLeft > 0;
        const isExpiringSoon =
          hasActiveReservation && reservationMsLeft <= 5 * 60 * 1000 && backendStatus !== "FREE";
        const warningPulse = isExpiringSoon ? (Math.sin(nowTimestamp / 280) + 1) / 2 : 0;
        // Backend is source of truth: if backend says FREE, show FREE even if stale local reservation exists.
        const isReserved = hasActiveReservation && backendStatus !== "FREE";
        const isFree = backendStatus === "FREE" && !isReserved;
        slots.push({
          id: spot?.ID || `virtual-${slotNumber}`,
          number: slotNumber,
          isFree,
          reservation,
          isExpiringSoon,
          warningPulse,
          points: [p1, p2, p3, p4],
          center: [
            (p1[0] + p2[0] + p3[0] + p4[0]) / 4,
            (p1[1] + p2[1] + p3[1] + p4[1]) / 4,
          ],
        });
      }
    };

    appendSlots(schoolReferenceLine, schoolReferenceLineTwo, generatedSlotCount, 1);
    appendSlots(
      schoolReferenceLineThree,
      schoolReferenceLineFour,
      generatedSlotCountTwo,
      generatedSlotCount + 1
    );
    appendSlots(
      schoolReferenceLineSeven,
      schoolReferenceLineEight,
      generatedSlotCountThree,
      generatedSlotCount + generatedSlotCountTwo + 1
    );
    appendSlots(
      schoolReferenceLineNine,
      schoolReferenceLineTenAligned,
      generatedSlotCountFour,
      generatedSlotCount + generatedSlotCountTwo + generatedSlotCountThree + 1
    );
    appendSlots(
      schoolReferenceLineFive,
      schoolReferenceLineSix,
      generatedSlotCountFive,
      generatedSlotCount +
        generatedSlotCountTwo +
        generatedSlotCountThree +
        generatedSlotCountFour +
        1
    );
    appendSlots(
      schoolReferenceLineEleven,
      schoolReferenceLineTwelve,
      generatedSlotCountSix,
      generatedSlotCount +
        generatedSlotCountTwo +
        generatedSlotCountThree +
        generatedSlotCountFour +
        generatedSlotCountFive +
        1
    );

    return slots;
  }, [
    generatedSlotCount,
    generatedSlotCountTwo,
    generatedSlotCountThree,
    generatedSlotCountFour,
    generatedSlotCountFive,
    generatedSlotCountSix,
    localReservations,
    nowTimestamp,
    spots,
  ]);
  const quickFreeSlots = useMemo(
    () => zoneSlotPolygons.filter((slot) => slot.isFree).slice(0, 8),
    [zoneSlotPolygons]
  );
  const hasAnyActiveReservation = useMemo(
    () =>
      Object.values(localReservations).some(
        (reservation) => Number(reservation?.expiresAt || 0) > nowTimestamp
      ),
    [localReservations, nowTimestamp]
  );


  useEffect(() => {
    setMapViewCenter(zoneCenter);
    setMapViewZoom(zoneZoom);
    setUserLocation(null);
    setSelectedSlot(null);
    setBookingSlot(null);
    setSelectedHours(1);
    setPlateNumber(readStoredPlate());
    setPlateError("");
    setReservationError("");
    setIsSubmittingReservation(false);
    setOccupiedWarning(null);
    setRecenterSignal((s) => s + 1);
  }, [zone?.ID, zoneCenter[0], zoneCenter[1], zoneZoom]);
  useEffect(() => {
    const zoneKey = String(zone?.ID || "");
    if (!zoneKey) return;
    const stored = readStoredReservations();
    const zoneReservations = stored[zoneKey] || {};
    const now = Date.now();
    const activeOnly = Object.fromEntries(
      Object.entries(zoneReservations).filter(([, reservation]) => reservation?.expiresAt > now)
    );
    setLocalReservations(activeOnly);
    if (Object.keys(activeOnly).length !== Object.keys(zoneReservations).length) {
      stored[zoneKey] = activeOnly;
      window.localStorage.setItem(reservationStorageKey, JSON.stringify(stored));
    }
  }, [zone?.ID]);
  useEffect(() => {
    const zoneKey = String(zone?.ID || "");
    if (!zoneKey) return;

    const releaseExpiredReservations = async () => {
      const now = Date.now();
      const expiredEntries = Object.entries(localReservations).filter(
        ([, reservation]) => reservation?.expiresAt && reservation.expiresAt <= now
      );
      if (expiredEntries.length === 0) return;

      const spotIdByNumber = new Map(
        (zone?.spots || [])
          .map((spot) => [String(spot?.number), { id: String(spot?.ID || ""), status: String(spot?.status || "") }])
      );

      const nextReservations = { ...localReservations };
      for (const [slotNumber, reservation] of expiredEntries) {
        const mappedSpot = spotIdByNumber.get(String(slotNumber));
        const slotId = String(reservation?.slotId || mappedSpot?.id || "");

        // Toggle back only when backend currently reports OCCUPIED.
        if (
          slotId &&
          !slotId.startsWith("virtual-") &&
          String(mappedSpot?.status || "").toUpperCase() === "OCCUPIED"
        ) {
          try {
            await toggleStatus(slotId);
          } catch {
            // Retry on next interval if backend call fails.
            continue;
          }
        }

        delete nextReservations[slotNumber];
      }

      setLocalReservations(nextReservations);
      const stored = readStoredReservations();
      stored[zoneKey] = nextReservations;
      window.localStorage.setItem(reservationStorageKey, JSON.stringify(stored));
    };

    releaseExpiredReservations();
    const timer = setInterval(releaseExpiredReservations, 30000);
    return () => clearInterval(timer);
  }, [localReservations, zone?.ID, zone?.spots]);
  useEffect(() => {
    const zoneKey = String(zone?.ID || "");
    if (!zoneKey) return;
    if (!localReservations || Object.keys(localReservations).length === 0) return;

    const spotStatusByNumber = new Map(
      (zone?.spots || []).map((spot) => [String(spot?.number), String(spot?.status || "").toUpperCase()])
    );

    const nextReservations = { ...localReservations };
    let changed = false;
    for (const slotNumber of Object.keys(localReservations)) {
      const reservation = localReservations[slotNumber];
      const reservationAgeMs = Date.now() - Number(reservation?.createdAt || 0);
      // Keep fresh reservations for a short grace period until backend spot status refreshes.
      const isFreshReservation = reservationAgeMs >= 0 && reservationAgeMs < 120000;
      if (spotStatusByNumber.get(String(slotNumber)) === "FREE" && !isFreshReservation) {
        delete nextReservations[slotNumber];
        changed = true;
      }
    }
    if (!changed) return;

    setLocalReservations(nextReservations);
    const stored = readStoredReservations();
    stored[zoneKey] = nextReservations;
    window.localStorage.setItem(reservationStorageKey, JSON.stringify(stored));
  }, [localReservations, zone?.ID, zone?.spots]);
  useEffect(() => {
    if (!occupiedWarning) return;
    const timer = setTimeout(() => setOccupiedWarning(null), 2600);
    return () => clearTimeout(timer);
  }, [occupiedWarning]);
  useEffect(() => {
    if (!myCarMessage) return;
    const timer = setTimeout(() => setMyCarMessage(""), 2600);
    return () => clearTimeout(timer);
  }, [myCarMessage]);
  useEffect(() => {
    const updateMobile = () => setIsMobile(window.innerWidth < 768);
    updateMobile();
    window.addEventListener("resize", updateMobile);
    return () => window.removeEventListener("resize", updateMobile);
  }, []);
  useEffect(() => {
    const timer = setInterval(() => setNowTimestamp(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  const requestUserLocation = ({ centerMap = false } = {}) => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const position = [coords.latitude, coords.longitude];
        setUserLocation(position);
        if (centerMap) {
          setMapViewCenter(position);
          setMapViewZoom(18);
          setRecenterSignal((s) => s + 1);
        }
      },
      () => {},
      {
        enableHighAccuracy: false,
        maximumAge: 30000,
        timeout: 12000,
      }
    );
  };
  const moveToMyLocation = () => {
    requestUserLocation({ centerMap: true });
  };
  const findMyCar = () => {
    const activeReservedSlots = zoneSlotPolygons
      .filter((slot) => {
        const reservation = localReservations[String(slot.number)];
        return Boolean(reservation?.expiresAt && reservation.expiresAt > Date.now());
      })
      .sort((a, b) => a.number - b.number);

    const mySlot = activeReservedSlots[0];
    if (!mySlot) {
      setMyCarMessage("Nuk u gjet asnje rezervim aktiv.");
      return;
    }

    setMyCarMessage("");
    setOccupiedWarning(null);
    setSelectedSlot(mySlot);
    setBookingSlot(mySlot);
    setBookingTab("navigation");
    setMapViewCenter(mySlot.center);
    setMapViewZoom(21);
    setRecenterSignal((s) => s + 1);
  };

  const openDirectionsToSlot = (slot) => {
    if (!slot?.center) return;

    const destinationLat = slot.center[0];
    const destinationLng = slot.center[1];
    const isIOS = /iPad|iPhone|iPod/.test(window.navigator.userAgent);

    const buildDirectionsUrl = (origin) => {
      if (isIOS) {
        const appleParams = new URLSearchParams({
          daddr: `${destinationLat},${destinationLng}`,
          dirflg: "w",
        });
        if (origin) appleParams.set("saddr", `${origin[0]},${origin[1]}`);
        return `https://maps.apple.com/?${appleParams.toString()}`;
      }
      const googleParams = new URLSearchParams({
        api: "1",
        destination: `${destinationLat},${destinationLng}`,
        travelmode: "walking",
      });
      if (origin) googleParams.set("origin", `${origin[0]},${origin[1]}`);
      return `https://www.google.com/maps/dir/?${googleParams.toString()}`;
    };

    // Open immediately on desktop to avoid popup-blockers from async geolocation callbacks.
    const initialUrl = buildDirectionsUrl(null);
    const pendingWindow = isMobile ? null : window.open(initialUrl, "_blank", "noopener,noreferrer");

    const openDirections = (origin) => {
      const url = buildDirectionsUrl(origin);
      if (isMobile) {
        // Mobile browsers often block async popups; same-tab navigation is more reliable.
        window.location.href = url;
        return;
      }
      if (pendingWindow && !pendingWindow.closed) {
        pendingWindow.location.href = url;
        return;
      }
      window.open(url, "_blank", "noopener,noreferrer");
    };

    if (!navigator.geolocation) {
      openDirections(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const origin = [coords.latitude, coords.longitude];
        setUserLocation(origin);
        openDirections(origin);
      },
      () => openDirections(null),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };
  const openGooglePin = (slot) => {
    if (!slot?.center) return;
    const url = `https://www.google.com/maps?q=${slot.center[0]},${slot.center[1]}`;
    if (isMobile) {
      window.location.href = url;
      return;
    }
    window.open(url, "_blank", "noopener,noreferrer");
  };
  const copyCoordinates = async (slot) => {
    if (!slot?.center || !navigator.clipboard) return;
    await navigator.clipboard.writeText(`${slot.center[0]},${slot.center[1]}`);
  };
  const submitReservation = async (event) => {
    event.preventDefault();
    if (!bookingSlot?.number || isSubmittingReservation) return;
    const normalizedPlate = plateNumber.trim().toUpperCase();
    if (!normalizedPlate) {
      setPlateError("Targa eshte e detyrueshme.");
      return;
    }
    if (!isPlateValid) {
      setPlateError(plateValidationMessage);
      return;
    }
    setPlateError("");
    setReservationError("");
    const zoneKey = String(zone?.ID || "");
    if (!zoneKey) return;
    const slotId = String(bookingSlot.id || "");
    if (!slotId || slotId.startsWith("virtual-")) {
      setReservationError("Ky parking nuk eshte i lidhur me backend. Shtoje si spot real ne server.");
      return;
    }

    try {
      setIsSubmittingReservation(true);
      const activeExistingReservation = localReservations[String(bookingSlot.number)];
      const hasActiveExistingReservation = Boolean(
        activeExistingReservation?.expiresAt && activeExistingReservation.expiresAt > Date.now()
      );
      const bookingSpot = spots.find((spot) => Number(spot?.number) === Number(bookingSlot.number));
      const bookingSpotStatus = String(bookingSpot?.status || "FREE").toUpperCase();

      // Only toggle when first reserving a FREE slot.
      // If user is extending an active reservation, keep backend as OCCUPIED.
      if (!hasActiveExistingReservation && bookingSpotStatus === "FREE") {
        await toggleStatus(slotId);
      }

      const baseTime = hasActiveExistingReservation
        ? Number(activeExistingReservation.expiresAt)
        : Date.now();
      const expiresAt = baseTime + selectedHours * 60 * 60 * 1000;
      const reservation = {
        slotId,
        plate: normalizedPlate,
        hours: selectedHours,
        amount: selectedReservationAmount,
        createdAt: Date.now(),
        expiresAt,
      };
      const nextReservations = {
        ...localReservations,
        [String(bookingSlot.number)]: reservation,
      };
      setLocalReservations(nextReservations);

      const stored = readStoredReservations();
      const nextStored = {
        ...stored,
        [zoneKey]: nextReservations,
      };
      window.localStorage.setItem(reservationStorageKey, JSON.stringify(nextStored));

      setBookingTab("navigation");
      setSelectedHours(1);
      setPlateNumber(normalizedPlate);
      setPlateError("");
      setReservationError("");
      setOccupiedWarning(null);
      window.localStorage.setItem(lastPlateStorageKey, normalizedPlate);
    } catch (error) {
      setReservationError("Rezervimi deshtoi ne backend. Provo perseri.");
    } finally {
      setIsSubmittingReservation(false);
    }
  };

  const userMarkerIcon = divIcon({
    className: "visitor-user-location-icon",
    html: `<div style="width:16px;height:16px;border-radius:9999px;border:3px solid white;box-shadow:0 0 0 6px rgba(59,130,246,0.2);background:#2563eb;"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });

  return (
    <div
      className={`parking-visitor-card w-full p-3 sm:rounded-3xl sm:p-4 ${
        isLightTheme
          ? "rounded-2xl border border-cyan-100/80 bg-white/95 shadow-sm"
          : "rounded-2xl border border-cyan-300/25 bg-slate-900/55 shadow-[0_18px_45px_rgba(8,145,178,0.2)] backdrop-blur-md"
      }`}
    >
      <div className={`mb-3 flex flex-col gap-2 text-sm sm:flex-row sm:items-center sm:justify-between ${isLightTheme ? "text-gray-600" : "text-cyan-100/85"}`}>
        <div className="min-w-0">
          <h2 className={`text-lg font-semibold ${isLightTheme ? "text-slate-800" : "text-cyan-50"}`}>{zoneLabel || zone?.name}</h2>
          <p className={`text-xs ${isLightTheme ? "text-slate-500" : "text-cyan-100/70"}`}>Live visitor parking map</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-medium sm:text-sm ${
              isLightTheme
                ? "bg-emerald-50 text-emerald-700"
                : "border border-emerald-300/35 bg-emerald-400/15 text-emerald-200"
            }`}
          >
            {freeSpots.length} të lira
          </span>
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-medium sm:text-sm ${
              isLightTheme
                ? "bg-rose-50 text-rose-600"
                : "border border-rose-300/35 bg-rose-400/15 text-rose-200"
            }`}
          >
            {occupiedSpots.length} të zëna
          </span>
        </div>
      </div>
      <div className="mb-2 flex items-center">
        <span
          className={`rounded-full px-3 py-1.5 text-sm font-bold tracking-wide shadow-sm ${
            isLightTheme
              ? "border border-cyan-200 bg-gradient-to-r from-cyan-50 to-sky-50 text-cyan-800"
              : "border border-cyan-300/40 bg-gradient-to-r from-cyan-500/20 to-sky-500/20 text-cyan-100"
          }`}
        >
          Selekto parkingun
        </span>
      </div>
      {hasAnyActiveReservation && (
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={findMyCar}
            className="rounded-full border border-emerald-300/70 bg-gradient-to-r from-emerald-500 to-green-500 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:from-emerald-400 hover:to-green-400"
          >
            Gjej veturen time
          </button>
        </div>
      )}
      {quickFreeSlots.length > 0 && (
        <div className="mb-3 flex flex-wrap items-center gap-2">
          {quickFreeSlots.map((slot) => (
            <button
              key={`quick-free-${slot.id}`}
              type="button"
              onClick={() => {
                setSelectedSlot(slot);
                setBookingSlot(slot);
                setBookingTab("navigation");
                setOccupiedWarning(null);
                setMapViewCenter(slot.center);
                setMapViewZoom(21);
                setRecenterSignal((s) => s + 1);
              }}
              className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                isLightTheme
                  ? "border-sky-300 bg-gradient-to-r from-sky-50 to-cyan-50 text-sky-700 hover:from-sky-100 hover:to-cyan-100"
                  : "border-sky-200/90 bg-gradient-to-r from-sky-300/45 to-cyan-300/45 text-white hover:from-sky-300/60 hover:to-cyan-300/60"
              }`}
            >
              P{slot.number}
            </button>
          ))}
        </div>
      )}

      <div
        className={`relative h-[68vh] min-h-[460px] w-full overflow-hidden rounded-2xl sm:h-[620px] ${
          isLightTheme
            ? "border border-cyan-100 bg-gradient-to-br from-cyan-50/50 to-sky-50/40"
            : "border border-cyan-300/30 bg-gradient-to-br from-slate-900/70 via-cyan-950/40 to-indigo-950/45"
        }`}
      >
        <MapContainer
          center={mapViewCenter}
          zoom={mapViewZoom}
          minZoom={18}
          maxZoom={24}
          zoomSnap={0.25}
          zoomDelta={0.5}
          preferCanvas
          attributionControl={false}
          scrollWheelZoom={!isMobile}
          className={`absolute inset-0 w-full h-full z-0 map-cursor ${isSatelliteStyle ? "satellite-soft" : ""}`}
        >
          <MapController center={mapViewCenter} zoom={mapViewZoom} recenterSignal={recenterSignal} />
          <MapInteractionTracker
            enabled={isMobile}
            onInteractionChange={setIsInteracting}
          />
          <TileLayer
            attribution={selectedTile.attribution}
            url={selectedTile.url}
            detectRetina
            maxNativeZoom={22}
            maxZoom={24}
          />
          <Polyline
            positions={schoolReferenceLine}
            pathOptions={{
              color: "#ffffff",
              weight: 4,
              opacity: 0.95,
              lineCap: "round",
            }}
          />
          <Polygon
            positions={schoolReferenceAreaBetweenLines}
            pathOptions={{
              color: "#8b5a2b",
              weight: 1.5,
              opacity: 0.9,
              fillColor: "#8b5a2b",
              fillOpacity: isSatelliteStyle ? 0.75 : 0.4,
            }}
          />
          <Polygon
            positions={schoolReferenceAreaBetweenLinesTwo}
            pathOptions={{
              color: "#8b5a2b",
              weight: 1.5,
              opacity: 0.9,
              fillColor: "#8b5a2b",
              fillOpacity: isSatelliteStyle ? 0.75 : 0.4,
            }}
          />
          <Polygon
            positions={schoolReferenceAreaBetweenLinesThree}
            pathOptions={{
              color: "#8b5a2b",
              weight: 1.5,
              opacity: 0.9,
              fillColor: "#8b5a2b",
              fillOpacity: isSatelliteStyle ? 0.75 : 0.4,
            }}
          />
          <Polygon
            positions={schoolReferenceAreaBetweenLinesFour}
            pathOptions={{
              color: "#8b5a2b",
              weight: 1.5,
              opacity: 0.9,
              fillColor: "#8b5a2b",
              fillOpacity: isSatelliteStyle ? 0.75 : 0.4,
            }}
          />
          <Polygon
            positions={schoolReferenceAreaBetweenLinesFive}
            pathOptions={{
              color: "#8b5a2b",
              weight: 1.5,
              opacity: 0.9,
              fillColor: "#8b5a2b",
              fillOpacity: isSatelliteStyle ? 0.75 : 0.4,
            }}
          />
          <Polygon
            positions={schoolReferenceAreaBetweenLinesSix}
            pathOptions={{
              color: "#8b5a2b",
              weight: 1.5,
              opacity: 0.9,
              fillColor: "#8b5a2b",
              fillOpacity: isSatelliteStyle ? 0.75 : 0.4,
            }}
          />
          {zoneSlotPolygons.map((slot) => (
            <Polygon
              key={slot.id}
              positions={slot.points}
              eventHandlers={{
                click: (event) => {
                  event.originalEvent?.stopPropagation?.();
                  const reservation = localReservations[String(slot.number)];
                  const hasActiveMyReservation = Boolean(
                    reservation?.expiresAt && reservation.expiresAt > Date.now()
                  );
                  if (!slot.isFree) {
                    if (hasActiveMyReservation) {
                      // Occupied by current user's active reservation: allow navigation panel.
                      setOccupiedWarning(null);
                      setBookingTab("navigation");
                      setBookingSlot(slot);
                      setSelectedSlot(slot);
                      return;
                    }
                    setOccupiedWarning({ number: slot.number });
                    return;
                  }
                  setOccupiedWarning(null);
                  setSelectedSlot(slot);
                  setBookingTab("payment");
                  setBookingSlot(slot);
                  setSelectedHours(1);
                  setPlateNumber(readStoredPlate());
                  setPlateError("");
                  setReservationError("");
                },
              }}
              pathOptions={{
                color: selectedSlot?.number === slot.number
                  ? "#f59e0b"
                  : slot.isExpiringSoon
                    ? "#f59e0b"
                    : slot.isFree
                      ? "#22c55e"
                      : "#dc2626",
                weight: selectedSlot?.number === slot.number || slot.isExpiringSoon ? 3 : 2,
                opacity: slot.isExpiringSoon ? 0.75 + slot.warningPulse * 0.25 : 1,
                fillOpacity: selectedSlot?.number === slot.number
                  ? isSatelliteStyle
                    ? 0.88
                    : 0.52
                  : slot.isExpiringSoon
                    ? (isSatelliteStyle ? 0.45 : 0.3) + slot.warningPulse * 0.35
                  : slot.isFree
                    ? isSatelliteStyle
                      ? 0.62
                      : 0.18
                    : isSatelliteStyle
                      ? 0.72
                      : 0.28,
                fillColor: selectedSlot?.number === slot.number
                  ? "#fbbf24"
                  : slot.isExpiringSoon
                    ? "#f59e0b"
                    : slot.isFree
                      ? "#22c55e"
                      : "#ef4444",
              }}
            />
          ))}
          {(!isMobile || !isInteracting) &&
            zoneSlotPolygons.map((slot) => (
              <Marker
                key={`slot-label-${slot.id}`}
                position={slot.center}
                icon={divIcon({
                  className: "slot-number-label",
                  html: `
                    <div style="
                      width: ${isMobile ? 18 : 20}px;
                      height: ${isMobile ? 18 : 20}px;
                      border-radius: 9999px;
                      background: ${
                        selectedSlot?.number === slot.number
                          ? "rgba(245,158,11,0.95)"
                          : "rgba(15,23,42,0.72)"
                      };
                      color: ${selectedSlot?.number === slot.number ? "#0f172a" : "white"};
                      font-size: ${isMobile ? 9 : 10}px;
                      font-weight: 700;
                      display: flex;
                      align-items: center;
                      justify-content: center;
                      box-shadow: 0 1px 4px rgba(0,0,0,0.35);
                      border: ${
                        selectedSlot?.number === slot.number
                          ? "2px solid rgba(15,23,42,0.9)"
                          : "1px solid rgba(255,255,255,0.8)"
                      };
                    ">
                      ${slot.number}
                    </div>
                  `,
                  iconSize: [isMobile ? 18 : 20, isMobile ? 18 : 20],
                  iconAnchor: [isMobile ? 9 : 10, isMobile ? 9 : 10],
                })}
                interactive={false}
                zIndexOffset={1000}
              />
            ))}
          <Polyline
            positions={schoolReferenceLineTwo}
            pathOptions={{
              color: "#ffffff",
              weight: 4,
              opacity: 0.95,
              lineCap: "round",
            }}
          />
          <Polyline
            positions={schoolReferenceLineThree}
            pathOptions={{
              color: "#ffffff",
              weight: 4,
              opacity: 0.95,
              lineCap: "round",
            }}
          />
          <Polyline
            positions={schoolReferenceLineFour}
            pathOptions={{
              color: "#ffffff",
              weight: 4,
              opacity: 0.95,
              lineCap: "round",
            }}
          />
          <Polyline
            positions={schoolReferenceLineFive}
            pathOptions={{
              color: "#ffffff",
              weight: 4,
              opacity: 0.95,
              lineCap: "round",
            }}
          />
          <Polyline
            positions={schoolReferenceLineSix}
            pathOptions={{
              color: "#ffffff",
              weight: 4,
              opacity: 0.95,
              lineCap: "round",
            }}
          />
          <Polyline
            positions={schoolReferenceLineSeven}
            pathOptions={{
              color: "#ffffff",
              weight: 4,
              opacity: 0.95,
              lineCap: "round",
            }}
          />
          <Polyline
            positions={schoolReferenceLineEight}
            pathOptions={{
              color: "#ffffff",
              weight: 4,
              opacity: 0.95,
              lineCap: "round",
            }}
          />
          <Polyline
            positions={schoolReferenceLineNine}
            pathOptions={{
              color: "#ffffff",
              weight: 4,
              opacity: 0.95,
              lineCap: "round",
            }}
          />
          <Polyline
            positions={schoolReferenceLineTen}
            pathOptions={{
              color: "#ffffff",
              weight: 4,
              opacity: 0.95,
              lineCap: "round",
            }}
          />
          <Polyline
            positions={schoolReferenceLineEleven}
            pathOptions={{
              color: "#ffffff",
              weight: 4,
              opacity: 0.95,
              lineCap: "round",
            }}
          />
          <Polyline
            positions={schoolReferenceLineTwelve}
            pathOptions={{
              color: "#ffffff",
              weight: 4,
              opacity: 0.95,
              lineCap: "round",
            }}
          />
          {userLocation && <Marker position={userLocation} icon={userMarkerIcon} />}
        </MapContainer>
        {bookingSlot && (
          <div
            className={`${isMobile ? "fixed inset-0" : "absolute inset-0"} z-[970] flex bg-slate-950/65 p-2 sm:p-3 ${
              isMobile ? "items-end justify-center" : "items-center justify-center"
            }`}
          >
            <div
              className={`w-full rounded-2xl border shadow-2xl ${
                isMobile ? "max-h-[82dvh] max-w-[96vw] p-3" : "max-w-sm p-4"
              } ${
                isLightTheme
                  ? "border-cyan-200 bg-white text-slate-800"
                  : "border-cyan-300/30 bg-slate-900 text-cyan-50"
              }`}
            >
              <div className={`${isMobile ? "max-h-[66dvh] overflow-y-auto pr-1" : ""}`}>
                <div className={`${isMobile ? "mb-2" : "mb-1"} text-sm font-semibold`}>Parking {bookingSlot.number}</div>
                <div className={`mb-3 text-xs ${isLightTheme ? "text-slate-500" : "text-cyan-100/70"}`}>
                  Menaxho pagesen dhe navigimin ne nje vend. Zgjidh kohezgjatjen e qendrimit.
                </div>
                {bookingHasMyActiveReservation && (
                  <div
                    className={`mb-3 rounded-lg border px-3 py-2 text-xs ${
                      isLightTheme
                        ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                        : "border-emerald-300/60 bg-emerald-500/15 text-emerald-100"
                    }`}
                  >
                    Rezervimi yt eshte aktiv ({bookingReservationMinutesLeft} min te mbetura).
                  </div>
                )}
                <div className="mb-3 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setBookingTab("navigation")}
                  className={`rounded-lg px-3 py-2 font-semibold ${isMobile ? "text-xs" : "text-sm"} ${
                    bookingTab === "navigation"
                      ? "bg-cyan-500 text-white"
                      : isLightTheme
                        ? "border border-slate-300 text-slate-700 hover:bg-slate-100"
                        : "border border-slate-600 text-cyan-100 hover:bg-slate-800"
                  }`}
                >
                  Navigim
                </button>
                <button
                  type="button"
                  onClick={() => setBookingTab("payment")}
                  className={`rounded-lg px-3 py-2 font-semibold ${isMobile ? "text-xs" : "text-sm"} ${
                    bookingTab === "payment"
                      ? "bg-cyan-500 text-white"
                      : isLightTheme
                        ? "border border-slate-300 text-slate-700 hover:bg-slate-100"
                        : "border border-slate-600 text-cyan-100 hover:bg-slate-800"
                  }`}
                >
                  Pagesa
                </button>
                </div>
                {bookingTab === "navigation" ? (
                  <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => openDirectionsToSlot(bookingSlot)}
                    className="w-full rounded-lg bg-gradient-to-r from-cyan-500 to-sky-500 px-3 py-2 text-sm font-semibold text-white hover:from-cyan-400 hover:to-sky-400"
                  >
                    Nis Navigimin
                  </button>
                  <button
                    type="button"
                    onClick={() => openGooglePin(bookingSlot)}
                    className="w-full rounded-lg border border-indigo-300/60 bg-gradient-to-r from-indigo-500 to-violet-500 px-3 py-2 text-sm font-semibold text-white hover:from-indigo-400 hover:to-violet-400"
                  >
                    Hap ne Google Pin
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      copyCoordinates(bookingSlot).catch(() => {});
                    }}
                    className={`w-full rounded-lg border px-3 py-2 text-sm font-semibold ${
                      isLightTheme
                        ? "border-slate-300 text-slate-700 hover:bg-slate-100"
                        : "border-slate-600 text-cyan-100 hover:bg-slate-800"
                    }`}
                  >
                    Copy Coordinates
                  </button>
                  </div>
                ) : (
                  <form onSubmit={submitReservation}>
                  <div className="reservation-options-scroll mb-3 max-h-44 overflow-y-auto pr-1">
                    <div className="grid grid-cols-1 gap-2">
                    {reservationOptions.map((option) => (
                      <label
                        key={option.hours}
                        className={`flex cursor-pointer items-center justify-between rounded-lg border px-3 py-2 text-sm ${
                          selectedHours === option.hours
                            ? "border-cyan-400 bg-cyan-500/15"
                            : isLightTheme
                              ? "border-slate-200 bg-slate-50"
                              : "border-slate-700 bg-slate-800/70"
                        }`}
                      >
                        <span>{option.label}</span>
                        <input
                          type="radio"
                          name="reservation-hours"
                          className="h-4 w-4"
                          checked={selectedHours === option.hours}
                          onChange={() => setSelectedHours(option.hours)}
                        />
                      </label>
                    ))}
                    </div>
                  </div>
                  <label className="mb-2 block text-xs font-semibold">Targa e kerres</label>
                  <input
                    type="text"
                    value={plateNumber}
                    onChange={(event) => {
                      const formatted = formatPlateInput(event.target.value);
                      setPlateNumber(formatted);
                      setPlateError(getPlateValidationMessage(formatted));
                    }}
                    placeholder="p.sh. 01-123-AB"
                    maxLength={9}
                    pattern="^(0[1-7])-[0-9]{3}-[A-Z]{2}$"
                    title="Formati i sakte:  (prefiksi 01 deri 07)"
                    className={`mb-3 w-full rounded-lg border px-3 py-2 text-sm outline-none ${
                      plateError
                        ? isLightTheme
                          ? "border-rose-400 bg-rose-50 text-slate-800"
                          : "border-rose-400 bg-rose-950/20 text-cyan-50"
                        : isLightTheme
                        ? "border-slate-300 bg-white text-slate-800"
                        : "border-slate-600 bg-slate-800 text-cyan-50"
                    }`}
                    required
                  />
                  {plateError && (
                    <div
                      className={`mb-3 rounded-lg border px-3 py-2 text-xs ${
                        isLightTheme
                          ? "border-rose-300 bg-rose-50 text-rose-700"
                          : "border-rose-300/60 bg-rose-500/15 text-rose-100"
                      }`}
                    >
                      {plateError}
                    </div>
                  )}
                  {reservationError && (
                    <div
                      className={`mb-3 rounded-lg border px-3 py-2 text-xs ${
                        isLightTheme
                          ? "border-rose-300 bg-rose-50 text-rose-700"
                          : "border-rose-300/60 bg-rose-500/15 text-rose-100"
                      }`}
                    >
                      {reservationError}
                    </div>
                  )}
                  <div
                    className={`mb-3 rounded-lg px-3 py-2 text-sm ${
                      isLightTheme ? "bg-cyan-50 text-slate-700" : "bg-cyan-500/10 text-cyan-100"
                    }`}
                  >
                    Totali per pagese: <span className="font-bold">{selectedReservationAmount.toFixed(2)}€</span>
                  </div>
                  <button
                    type="submit"
                    disabled={!isPlateValid || isSubmittingReservation}
                    className="w-full rounded-lg border border-indigo-300/60 bg-gradient-to-r from-indigo-500 to-violet-500 px-3 py-2 text-sm font-semibold text-white hover:from-indigo-400 hover:to-violet-400 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSubmittingReservation
                      ? "Duke procesuar..."
                      : bookingHasMyActiveReservation
                        ? "Zgjat & Paguaj"
                        : "Paguaj & Rezervo"}
                  </button>
                  </form>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  setBookingSlot(null);
                  setSelectedSlot(null);
                  setBookingTab("payment");
                  setPlateError("");
                  setReservationError("");
                }}
                className={`mt-3 w-full rounded-lg border px-3 py-2 text-sm font-semibold ${
                  isLightTheme
                    ? "border-slate-300 text-slate-700 hover:bg-slate-100"
                    : "border-slate-600 text-cyan-100 hover:bg-slate-800"
                }`}
              >
                Mbyll
              </button>
            </div>
          </div>
        )}
        {occupiedWarning && (
          <div
            className={`absolute left-1/2 z-[980] -translate-x-1/2 rounded-xl border px-3 py-2 shadow-xl backdrop-blur-md ${
              isLightTheme
                ? "top-2 border-rose-200 bg-white/95 text-rose-700"
                : "top-2 border-rose-300/40 bg-slate-900/90 text-rose-100"
            }`}
          >
            <div className="flex items-start gap-2">
              <AlertTriangle size={16} className="mt-0.5 text-rose-400" />
              <div>
                <div className="text-xs font-bold">Ky parking eshte i nxane</div>
                <div className={`${isMobile ? "text-[11px]" : "text-xs"} opacity-90`}>
                  Parking {occupiedWarning.number}. Ju lutem zgjidhni nje vend te lire.
                </div>
              </div>
            </div>
          </div>
        )}
        {myCarMessage && (
          <div
            className={`absolute left-1/2 z-[980] -translate-x-1/2 rounded-xl border px-3 py-2 shadow-xl backdrop-blur-md ${
              isLightTheme
                ? "top-2 border-amber-200 bg-white/95 text-amber-700"
                : "top-2 border-amber-300/40 bg-slate-900/90 text-amber-100"
            }`}
          >
            <div className={`${isMobile ? "text-[11px]" : "text-xs"} font-semibold`}>{myCarMessage}</div>
          </div>
        )}
        <div className={`absolute z-[900] ${isMobile ? "top-2 right-2" : "top-3 right-3"}`}>
          <div className="flex items-center gap-1 rounded-md border border-cyan-300/50 bg-slate-900/50 p-1">
            <button
              type="button"
              onClick={() => setMapStyle("googleHybrid")}
              className={`rounded px-2.5 py-1 text-[11px] font-semibold sm:text-xs ${
                mapStyle === "googleHybrid"
                  ? "bg-cyan-500 text-white"
                  : "text-cyan-100 hover:bg-cyan-400/20"
              }`}
            >
              Hybrid
            </button>
            <button
              type="button"
              onClick={() => setMapStyle("googleSatellite")}
              className={`rounded px-2.5 py-1 text-[11px] font-semibold sm:text-xs ${
                mapStyle === "googleSatellite"
                  ? "bg-cyan-500 text-white"
                  : "text-cyan-100 hover:bg-cyan-400/20"
              }`}
            >
              Satellite
            </button>
            <button
              type="button"
              onClick={() => setMapStyle("street")}
              className={`rounded px-2.5 py-1 text-[11px] font-semibold sm:text-xs ${
                mapStyle === "street"
                  ? "bg-cyan-500 text-white"
                  : "text-cyan-100 hover:bg-cyan-400/20"
              }`}
            >
              Street
            </button>
          </div>
        </div>

        {selectedSlot && !bookingSlot && (
          <div
            className={`absolute z-[950] rounded-xl shadow-lg backdrop-blur-md ${
              isLightTheme
                ? "border border-cyan-200 bg-white/96 text-slate-800"
                : "border border-cyan-300/30 bg-slate-900/88 text-cyan-50"
            } ${
              isMobile ? "left-2 right-2 bottom-2 px-3 py-3" : "left-3 bottom-3 max-w-[360px] px-3 py-3"
            }`}
          >
            <div className="mb-1 flex items-center justify-between gap-2">
              <div className={`text-[11px] font-semibold ${isLightTheme ? "text-amber-600" : "text-amber-300"}`}>
                Selected parking
              </div>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                  selectedSlot.isFree
                    ? isLightTheme
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-emerald-400/20 text-emerald-200"
                    : isLightTheme
                      ? "bg-rose-100 text-rose-700"
                      : "bg-rose-400/20 text-rose-200"
                }`}
              >
                {selectedSlot.isFree ? "I lire" : "I zene"}
              </span>
            </div>
            <div className={`text-sm font-semibold ${isLightTheme ? "text-slate-800" : "text-cyan-50"}`}>
              Parking {selectedSlot.number}
            </div>
            <div className={`${isMobile ? "mt-1 text-xs" : "mt-1 text-[11px]"} ${isLightTheme ? "text-slate-600" : "text-cyan-100/80"}`}>
              Lat: {selectedSlot.center[0].toFixed(6)} | Lng: {selectedSlot.center[1].toFixed(6)}
            </div>
            <div className={`${isMobile ? "mt-1 text-xs" : "mt-1 text-[11px]"} break-all ${isLightTheme ? "text-slate-500" : "text-cyan-100/60"}`}>
              Full: {selectedSlot.center[0]}, {selectedSlot.center[1]}
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => openDirectionsToSlot(selectedSlot)}
                className={`rounded-md bg-gradient-to-r from-cyan-500 to-sky-500 text-white font-semibold hover:from-cyan-400 hover:to-sky-400 ${
                  isMobile ? "min-h-10 flex-1 px-3 py-2 text-sm" : "px-2.5 py-1.5 text-xs"
                }`}
              >
                Navigate
              </button>
              <button
                type="button"
                onClick={() => openGooglePin(selectedSlot)}
                className={`rounded-md border border-indigo-300/60 bg-gradient-to-r from-indigo-500 to-violet-500 text-white hover:from-indigo-400 hover:to-violet-400 ${
                  isMobile ? "min-h-10 flex-1 px-3 py-2 text-sm" : "px-2.5 py-1.5 text-xs"
                }`}
              >
                Google Pin
              </button>
              <button
                type="button"
                onClick={() => {
                  copyCoordinates(selectedSlot).catch(() => {});
                }}
                className={`rounded-md border border-slate-400/70 bg-slate-700 text-white hover:bg-slate-600 ${
                  isMobile ? "min-h-10 flex-1 px-3 py-2 text-sm" : "px-2.5 py-1.5 text-xs"
                }`}
              >
                Copy
              </button>
              <button
                type="button"
                onClick={() => setSelectedSlot(null)}
                className={`rounded-md border border-rose-300/70 bg-gradient-to-r from-rose-500 to-pink-500 text-white hover:from-rose-400 hover:to-pink-400 ${
                  isMobile ? "min-h-10 w-full px-3 py-2 text-sm" : "px-2.5 py-1.5 text-xs"
                }`}
              >
                Close
              </button>
            </div>
          </div>
        )}

      </div>
      <style>{`
        .leaflet-container.map-cursor {
          cursor: crosshair;
        }
        .leaflet-container.map-cursor .leaflet-interactive {
          cursor: pointer;
        }
        .leaflet-container .leaflet-tile {
          filter: contrast(1.12) saturate(1.1) brightness(1.03);
        }
        .leaflet-container.satellite-soft .leaflet-tile {
          filter: grayscale(0.45) contrast(1.02) brightness(1.08);
        }
        .parking-visitor-card button {
          transition: transform 140ms ease, box-shadow 180ms ease, filter 180ms ease, background-color 180ms ease, border-color 180ms ease;
          touch-action: manipulation;
          -webkit-tap-highlight-color: transparent;
        }
        .parking-visitor-card button:hover {
          filter: saturate(1.06);
        }
        .parking-visitor-card button:active {
          transform: translateY(1px) scale(0.985);
        }
        .parking-visitor-card button:focus-visible {
          outline: 2px solid rgba(56, 189, 248, 0.75);
          outline-offset: 2px;
        }
        .parking-visitor-card button:disabled {
          transform: none;
          filter: none;
        }
        .reservation-options-scroll {
          scrollbar-width: thin;
          scrollbar-color: rgba(99, 102, 241, 0.75) rgba(15, 23, 42, 0.25);
        }
        .reservation-options-scroll::-webkit-scrollbar {
          width: 8px;
        }
        .reservation-options-scroll::-webkit-scrollbar-track {
          background: rgba(15, 23, 42, 0.22);
          border-radius: 9999px;
        }
        .reservation-options-scroll::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, rgba(99, 102, 241, 0.9), rgba(139, 92, 246, 0.88));
          border-radius: 9999px;
          border: 1px solid rgba(255, 255, 255, 0.25);
        }
        .reservation-options-scroll::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(180deg, rgba(129, 140, 248, 0.98), rgba(167, 139, 250, 0.95));
        }
      `}</style>
    </div>
  );
}