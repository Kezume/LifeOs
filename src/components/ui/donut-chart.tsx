"use client";

import React, { useState } from "react";

export interface DonutSegment {
  name: string;
  value: number;
  color: string;
  formattedValue?: string;
}

export interface DonutChartProps {
  segments: DonutSegment[];
  centerLabel?: string;
  centerSublabel?: string;
  size?: number;
  strokeWidth?: number;
  className?: string;
  showLegend?: boolean;
  legendPosition?: "bottom" | "right";
}

export function DonutChart({
  segments,
  centerLabel,
  centerSublabel,
  size = 160,
  strokeWidth = 16,
  className = "",
  showLegend = true,
  legendPosition = "right",
}: DonutChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const radius = (size - strokeWidth * 2) / 2;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;

  const validSegments = segments.filter((s) => s.value > 0);
  const total = validSegments.reduce((sum, s) => sum + s.value, 0);

  // Compute strokeDasharray and strokeDashoffset for each segment
  let accumulatedOffset = 0;
  const arcs = validSegments.map((seg, idx) => {
    const percentage = total > 0 ? seg.value / total : 0;
    const strokeDash = percentage * circumference;
    const currentOffset = accumulatedOffset;
    accumulatedOffset += strokeDash;

    return {
      ...seg,
      percentage: Math.round(percentage * 100),
      strokeDasharray: `${strokeDash} ${circumference - strokeDash}`,
      strokeDashoffset: -currentOffset,
      index: idx,
    };
  });

  const activeSegment = hoveredIdx !== null && arcs[hoveredIdx] ? arcs[hoveredIdx] : null;

  return (
    <div
      className={`flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 ${className}`}
    >
      {/* SVG Donut Visual */}
      <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="transform -rotate-90"
        >
          {/* Base Background Track Ring */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="transparent"
            stroke="var(--border)"
            strokeWidth={strokeWidth}
            className="opacity-40"
          />

          {/* Slices */}
          {arcs.map((arc) => {
            const isHovered = hoveredIdx === arc.index;
            return (
              <circle
                key={arc.name}
                cx={center}
                cy={center}
                r={radius}
                fill="transparent"
                stroke={arc.color}
                strokeWidth={isHovered ? strokeWidth + 3 : strokeWidth}
                strokeDasharray={arc.strokeDasharray}
                strokeDashoffset={arc.strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-300 cursor-pointer"
                onMouseEnter={() => setHoveredIdx(arc.index)}
                onMouseLeave={() => setHoveredIdx(null)}
              />
            );
          })}
        </svg>

        {/* Center Label Display */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-2 select-none">
          <div className="text-base sm:text-lg font-bold tracking-tight text-[var(--foreground)] tabular-nums leading-tight">
            {activeSegment ? `${activeSegment.percentage}%` : centerLabel || (total > 0 ? "100%" : "0%")}
          </div>
          {(activeSegment || centerSublabel) && (
            <div className="text-[10px] sm:text-[11px] text-[var(--foreground-muted)] truncate max-w-[85px] leading-tight mt-0.5 font-mono">
              {activeSegment ? activeSegment.name : centerSublabel}
            </div>
          )}
        </div>
      </div>

      {/* Legend */}
      {showLegend && (
        <div
          className={`flex flex-col gap-1.5 w-full ${
            legendPosition === "right" ? "sm:max-w-[300px]" : "max-w-full"
          }`}
        >
          {arcs.length === 0 ? (
            <div className="text-xs text-[var(--foreground-muted)]">Belum ada data metrik</div>
          ) : (
            arcs.map((arc) => {
              const isHovered = hoveredIdx === arc.index;
              return (
                <div
                  key={arc.name}
                  onMouseEnter={() => setHoveredIdx(arc.index)}
                  onMouseLeave={() => setHoveredIdx(null)}
                  className={`flex items-center justify-between text-xs py-1 px-2 rounded-lg transition-colors cursor-pointer ${
                    isHovered ? "bg-[var(--surface-raised)]" : "hover:bg-[var(--surface-raised)]/50"
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: arc.color }}
                    />
                    <span className="text-[var(--foreground)] truncate font-normal">
                      {arc.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0 ml-2 font-mono text-[11px]">
                    <span className="text-[var(--foreground-muted)] tabular-nums">
                      {arc.formattedValue || arc.value}
                    </span>
                    <span className="font-medium text-[var(--foreground)] tabular-nums w-8 text-right">
                      {arc.percentage}%
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
