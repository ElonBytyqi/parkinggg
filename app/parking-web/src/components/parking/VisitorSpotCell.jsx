// Legacy marker implementation kept for reference; VisitorZoneCard currently renders slots directly.
// import { divIcon } from "leaflet";
// import { Marker, Popup, Tooltip } from "react-leaflet";

// export default function VisitorSpotCell({
//   spot,
//   position,
//   isSuggested = false,
//   distanceLabel = "",
//   magnify = false,
//   minimal = false,
// }) {
//   const isFree = spot.status === "FREE";
//   const label = `Vendi ${spot.number}`;
//   const markerWidth = minimal ? 24 : magnify ? 56 : 44;
//   const markerHeight = minimal ? 30 : magnify ? 72 : 56;
//   const markerFontSize = minimal ? 9 : magnify ? 16 : 12;
//   const sideLineWidth = minimal ? 1 : 2;
//   const markerShadow = isSuggested
//     ? "0 0 0 6px rgba(250,204,21,0.25), 0 10px 20px rgba(234,179,8,0.35)"
//     : magnify
//       ? "0 10px 20px rgba(15,23,42,0.35)"
//       : "0 6px 14px rgba(15,23,42,0.28)";

//   const markerIcon = divIcon({
//     className: "visitor-spot-icon",
//     html: `
//       <div style="
//         position: relative;
//         width: ${markerWidth}px;
//         height: ${markerHeight}px;
//         border-radius: 8px;
//         border: ${
//           isFree
//             ? "2px dashed #4ade80"
//             : "2px solid #64748b"
//         };
//         box-shadow: ${markerShadow};
//         display: flex;
//         flex-direction: column;
//         align-items: center;
//         justify-content: center;
//         font-size: ${markerFontSize}px;
//         font-weight: 700;
//         color: ${isFree ? "#86efac" : "#94a3b8"};
//         opacity: ${minimal ? 0.92 : 1};
//         background: #475569;
//       ">
//         <div style="
//           position: absolute;
//           left: 0;
//           top: 4px;
//           bottom: 4px;
//           width: ${sideLineWidth}px;
//           background: rgba(234,179,8,0.7);
//         "></div>
//         <div style="
//           position: absolute;
//           right: 0;
//           top: 4px;
//           bottom: 4px;
//           width: ${sideLineWidth}px;
//           background: rgba(234,179,8,0.7);
//         "></div>
//         <div>${minimal ? "" : spot.number}</div>
//         ${
//           !isFree && !minimal
//             ? `<div style="font-size:${magnify ? 16 : 13}px;line-height:1;color:#f87171;margin-top:2px;">&#128663;</div>`
//             : ""
//         }
//       </div>
//     `,
//     iconSize: [markerWidth, markerHeight],
//     iconAnchor: [markerWidth / 2, markerHeight / 2],
//   });

//   return (
//     <Marker position={position} icon={markerIcon} zIndexOffset={magnify ? 1200 : 0}>
//       <Tooltip direction="top" offset={[0, -12]}>{label}</Tooltip>
//       <Popup>
//         <div className="text-sm min-w-[140px]">
//           <p className="font-semibold text-slate-800">{label}</p>
//           {isSuggested && (
//             <p className="mt-1 text-[11px] font-semibold text-amber-600">
//               Suggested nearest free spot
//             </p>
//           )}
//           <div className="mt-2">
//             <span
//               className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
//                 isFree
//                   ? "bg-emerald-50 text-emerald-700"
//                   : "bg-rose-50 text-rose-600"
//               }`}
//             >
//               {isFree ? "E lirë" : "E zënë"}
//             </span>
//           </div>
//           {distanceLabel && (
//             <p className="mt-2 text-[11px] text-slate-500">Distance: {distanceLabel}</p>
//           )}
//           <p className="mt-2 text-[11px] text-slate-400">Visitor parking</p>
//         </div>
//       </Popup>
//     </Marker>
//   );
// }