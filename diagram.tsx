"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";

// ─── Labels clockwise from just-right-of-top ─────────────────────────────────
const LABELS = [
  "International",                  // 0  — DYNAMIC quadrant
  "Physically active",              // 1
  "Social commitment",              // 2
  "Personal development",           // 3
  "Autonomy and independence",      // 4
  "Integrity",                      // 5  — PERSON quadrant
  "Financial reward",               // 6
  "Prestige",                       // 7
  "Balance work and private life",  // 8
  "Structure and routine",          // 9
  "Certitude and stability",        // 10 — BALANCE quadrant
  "Craftsmanship",                  // 11
  "Working environment",            // 12
  "Relationships at work",          // 13
  "Alliance and competition",       // 14
  "Management",                     //x 15 — WORK quadrant
  "Entrepreneurship",               // 16
  "Creativity at work",             // 17
  "Challenge",                      // 18
  "Variation",                      // 19
];

const N = LABELS.length;
const RINGS = 6;
const STEP = 360 / N;

// ─── Initial data values (0–1 scale) ─────────────────────────────────────────
// Minimum ~0.15 so the polygon never reaches the center.
const INITIAL_DATA: number[] = [
  0.28, 0.18, 0.75, 0.60, 0.85,
  0.45, 0.50, 0.55, 0.40, 0.27,
  0.18, 0.18, 0.28, 0.42, 0.50,
  0.50, 0.42, 0.55, 0.25, 0.33,
];

// ─── Layout ──────────────────────────────────────────────────────────────────
const CX = 500;
const CY = 410;
const R = 240;

function toXY(deg: number, r: number) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: CX + r * Math.cos(rad), y: CY + r * Math.sin(rad) };
}

function axisAngle(i: number) {
  return STEP * i + STEP / 2;
}

// ─── Marker shapes ──────────────────────────────────────────────────────────
type Shape = "diamond" | "square" | "triangle" | "circle";

function markerConfig(i: number): { shape: Shape; fill: string } {
  if (i < 5)  return { shape: "diamond",  fill: "#D92B2B" };
  if (i < 10) return { shape: "square",   fill: "#3B8C3B" };
  if (i < 15) return { shape: "triangle", fill: "#4A8FD4" };
  return { shape: "circle", fill: "#C832C8" };
}

function MarkerShape({ x, y, shape, fill, size }: {
  x: number; y: number; shape: Shape; fill: string; size: number;
}) {
  const s = size;
  switch (shape) {
    case "diamond":
      return (
        <polygon
          points={`${x},${y - s} ${x + s},${y} ${x},${y + s} ${x - s},${y}`}
          fill={fill}
        />
      );
    case "square":
      return (
        <rect
          x={x - s * 0.7} y={y - s * 0.7}
          width={s * 1.4} height={s * 1.4}
          fill={fill}
        />
      );
    case "triangle":
      return (
        <polygon
          points={`${x - s},${y - s * 0.5} ${x + s},${y - s * 0.5} ${x},${y + s * 0.8}`}
          fill={fill}
        />
      );
    case "circle":
      return <circle cx={x} cy={y} r={s * 0.85} fill={fill} />;
  }
}

// ─── Main Component ─────────────────────────────────────────────────────────
export default function CareerValuesDiagram() {
  const [data, setData] = useState<number[]>(INITIAL_DATA);
  const [dragging, setDragging] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Convert mouse event position to SVG coordinates
  const toSVGPoint = useCallback(
    (clientX: number, clientY: number) => {
      const svg = svgRef.current;
      if (!svg) return { x: 0, y: 0 };
      const pt = svg.createSVGPoint();
      pt.x = clientX;
      pt.y = clientY;
      const ctm = svg.getScreenCTM();
      if (!ctm) return { x: 0, y: 0 };
      const svgP = pt.matrixTransform(ctm.inverse());
      return { x: svgP.x, y: svgP.y };
    },
    []
  );

  // Project mouse position onto the axis line and clamp to [0, 1]
  const projectOntoAxis = useCallback(
    (svgX: number, svgY: number, axisIndex: number): number => {
      const angle = axisAngle(axisIndex);
      const rad = ((angle - 90) * Math.PI) / 180;
      const dx = Math.cos(rad);
      const dy = Math.sin(rad);

      // Vector from center to mouse
      const mx = svgX - CX;
      const my = svgY - CY;

      // Dot product = projection along axis direction
      const proj = mx * dx + my * dy;
      const t = proj / R;
      return Math.max(0.15, Math.min(1.0, t));
    },
    []
  );

  const handlePointerDown = useCallback(
    (i: number) => (e: React.PointerEvent) => {
      e.preventDefault();
      (e.target as Element).setPointerCapture(e.pointerId);
      setDragging(i);
    },
    []
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (dragging === null) return;
      const { x, y } = toSVGPoint(e.clientX, e.clientY);
      const newVal = projectOntoAxis(x, y, dragging);
      setData((prev) => {
        const next = [...prev];
        next[dragging] = newVal;
        return next;
      });
    },
    [dragging, toSVGPoint, projectOntoAxis]
  );

  const handlePointerUp = useCallback(() => {
    setDragging(null);
  }, []);

  // Copy all current values to clipboard
  const copyToClipboard = useCallback(() => {
    const text = data
      .map((v, i) => `${v.toFixed(2)},  // ${i}  ${LABELS[i]}`)
      .join("\n");
    navigator.clipboard.writeText(`[\n${text}\n]`);
  }, [data]);

  // Compute polygon points
  const pts = data.map((v, i) => toXY(axisAngle(i), v * R));
  const poly = pts.map((p) => `${p.x},${p.y}`).join(" ");

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%", padding: 16, gap: 12 }}>
      {/* ── Coordinate display bar ─────────────────────────────── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          padding: "8px 20px",
          background: "#f5f5f5",
          borderRadius: 8,
          fontFamily: "monospace",
          fontSize: 13,
          color: "#333",
          flexWrap: "wrap",
          maxWidth: 1000,
          width: "100%",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          {dragging !== null ? (
            <>
              <span style={{ fontWeight: 700, color: "#D92B2B" }}>
                Dragging: {LABELS[dragging]}
              </span>
              <span>
                Value: <strong>{data[dragging].toFixed(2)}</strong>
              </span>
              <span>
                Ring: <strong>{(data[dragging] * RINGS).toFixed(1)}</strong> / {RINGS}
              </span>
              <span style={{ color: "#888" }}>
                ({pts[dragging].x.toFixed(0)}, {pts[dragging].y.toFixed(0)})
              </span>
            </>
          ) : (
            <span style={{ color: "#888" }}>Drag any marker along its axis to adjust</span>
          )}
        </div>
        <button
          onClick={copyToClipboard}
          style={{
            padding: "6px 14px",
            background: "#333",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
            fontSize: 12,
            fontFamily: "inherit",
            fontWeight: 600,
          }}
        >
          📋 Copy All Values
        </button>
      </div>

      {/* ── SVG Chart ──────────────────────────────────────────── */}
      <svg
        ref={svgRef}
        viewBox="0 0 1000 850"
        style={{
          maxWidth: 1000,
          width: "100%",
          fontFamily: "Arial, Helvetica, sans-serif",
          cursor: dragging !== null ? "grabbing" : "default",
          userSelect: "none",
        }}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        {/* Concentric grid rings */}
        {Array.from({ length: RINGS }, (_, i) => (
          <circle
            key={`r${i}`}
            cx={CX} cy={CY}
            r={((i + 1) / RINGS) * R}
            fill="none" stroke="#B8B8B8" strokeWidth={0.7}
          />
        ))}

        {/* Spoke lines */}
        {Array.from({ length: N }, (_, i) => {
          const end = toXY(axisAngle(i), R);
          return (
            <line
              key={`s${i}`}
              x1={CX} y1={CY} x2={end.x} y2={end.y}
              stroke="#B8B8B8" strokeWidth={0.7}
            />
          );
        })}

        {/* Bold cross-hairs at quadrant boundaries */}
        <line x1={CX} y1={CY - R - 10} x2={CX} y2={CY + R + 10} stroke="#999" strokeWidth={1.5} />
        <line x1={CX - R - 10} y1={CY} x2={CX + R + 10} y2={CY} stroke="#999" strokeWidth={1.5} />

        {/* Orange radial lines from center to each data point */}
        {pts.map((p, i) => (
          <line
            key={`rad${i}`}
            x1={CX} y1={CY}
            x2={p.x} y2={p.y}
            stroke="#F5A623"
            strokeWidth={2}
          />
        ))}

        {/* Orange data polygon connecting adjacent points */}
        <polygon
          points={poly}
          fill="rgba(245, 166, 35, 0.12)"
          stroke="#F5A623"
          strokeWidth={2.5}
          strokeLinejoin="round"
        />

        {/* Draggable markers */}
        {pts.map((p, i) => {
          const { shape, fill } = markerConfig(i);
          const isActive = dragging === i;
          return (
            <g
              key={`m${i}`}
              style={{ cursor: "grab" }}
              onPointerDown={handlePointerDown(i)}
            >
              {/* Invisible larger hit area for easier grabbing */}
              <circle
                cx={p.x} cy={p.y} r={16}
                fill="transparent"
                stroke="none"
              />
              {/* The visible marker */}
              <MarkerShape
                x={p.x} y={p.y}
                shape={shape} fill={fill}
                size={isActive ? 10 : 7}
              />
              {/* Live value tooltip while dragging */}
              {isActive && (
                <>
                  <rect
                    x={p.x + 14} y={p.y - 24}
                    width={56} height={22}
                    rx={4}
                    fill="rgba(0,0,0,0.8)"
                  />
                  <text
                    x={p.x + 42} y={p.y - 10}
                    textAnchor="middle"
                    fontSize={12}
                    fontWeight={600}
                    fill="#fff"
                    fontFamily="monospace"
                  >
                    {data[i].toFixed(2)}
                  </text>
                </>
              )}
            </g>
          );
        })}

        {/* Axis labels */}
        {LABELS.map((label, i) => {
          const angle = axisAngle(i);
          const norm = ((angle % 360) + 360) % 360;
          const pos = toXY(angle, R + 18);

          let anchor: "start" | "middle" | "end" = "middle";
          let dx = 0;
          let dy = 5;

          if (norm > 5 && norm < 175) { anchor = "start"; dx = 6; }
          else if (norm > 185 && norm < 355) { anchor = "end"; dx = -6; }

          if (norm <= 5 || norm >= 355) { anchor = "middle"; dx = 0; dy = -8; }
          if (norm >= 175 && norm <= 185) { anchor = "middle"; dx = 0; dy = 16; }

          return (
            <text
              key={`l${i}`}
              x={pos.x + dx} y={pos.y + dy}
              textAnchor={anchor}
              fontSize={13.5} fill="#333" fontWeight={400}
            >
              {label}
            </text>
          );
        })}

        {/* Quadrant labels */}
        <text x={CX} y={CY - R - 42} textAnchor="middle" fontSize={21} fontWeight={800} fill="#222">DYNAMIC</text>
        <text x={CX + R + 50} y={CY + 7} textAnchor="start" fontSize={21} fontWeight={800} fill="#222">PERSON</text>
        <text x={CX} y={CY + R + 55} textAnchor="middle" fontSize={21} fontWeight={800} fill="#222">BALANCE</text>
        <text x={CX - R - 50} y={CY + 7} textAnchor="end" fontSize={21} fontWeight={800} fill="#222">WORK</text>
      </svg>
    </div>
  );
}
