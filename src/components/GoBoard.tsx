import React, { useState } from 'react';
import { Point, StoneColor, PointState } from '../types/go';
import { BoardMatrix, pointToCoordinate } from '../engine/goRules';
import { soundManager } from '../utils/sound';

export interface BoardMarker {
  point: Point;
  label?: string;
  type?: 'circle' | 'square' | 'triangle' | 'letter' | 'territory-black' | 'territory-white';
  color?: string;
}

interface GoBoardProps {
  board: BoardMatrix;
  boardSize?: number;
  cropBounds?: { minX: number; maxX: number; minY: number; maxY: number };
  onPointClick?: (p: Point) => void;
  hoverColor?: StoneColor | null;
  lastMove?: Point | null;
  markers?: BoardMarker[];
  showCoordinates?: boolean;
  showMoveNumbers?: boolean;
  moveNumbersMap?: Map<string, number>; // key: "x,y" => moveNumber
  interactive?: boolean;
  className?: string;
}

export const GoBoard: React.FC<GoBoardProps> = ({
  board,
  boardSize = board.length,
  cropBounds,
  onPointClick,
  hoverColor = null,
  lastMove = null,
  markers = [],
  showCoordinates = true,
  showMoveNumbers = false,
  moveNumbersMap,
  interactive = true,
  className = '',
}) => {
  const [hoveredPoint, setHoveredPoint] = useState<Point | null>(null);

  const minX = cropBounds ? Math.max(0, cropBounds.minX) : 0;
  const maxX = cropBounds ? Math.min(boardSize - 1, cropBounds.maxX) : boardSize - 1;
  const minY = cropBounds ? Math.max(0, cropBounds.minY) : 0;
  const maxY = cropBounds ? Math.min(boardSize - 1, cropBounds.maxY) : boardSize - 1;

  const colsCount = maxX - minX + 1;
  const rowsCount = maxY - minY + 1;

  // Traditional star points (Hoshi)
  const getHoshiPoints = (size: number): Point[] => {
    if (size === 19) {
      return [
        { x: 3, y: 3 }, { x: 9, y: 3 }, { x: 15, y: 3 },
        { x: 3, y: 9 }, { x: 9, y: 9 }, { x: 15, y: 9 },
        { x: 3, y: 15 }, { x: 9, y: 15 }, { x: 15, y: 15 },
      ];
    } else if (size === 13) {
      return [
        { x: 3, y: 3 }, { x: 9, y: 3 }, { x: 6, y: 6 },
        { x: 3, y: 9 }, { x: 9, y: 9 },
      ];
    } else if (size === 9) {
      return [
        { x: 2, y: 2 }, { x: 6, y: 2 }, { x: 4, y: 4 },
        { x: 2, y: 6 }, { x: 6, y: 6 },
      ];
    }
    return [];
  };

  const hoshiPoints = getHoshiPoints(boardSize).filter(
    (p) => p.x >= minX && p.x <= maxX && p.y >= minY && p.y <= maxY
  );

  const markerMap = new Map<string, BoardMarker>();
  markers.forEach((m) => {
    markerMap.set(`${m.point.x},${m.point.y}`, m);
  });

  const cols = ['A','B','C','D','E','F','G','H','J','K','L','M','N','O','P','Q','R','S','T'];

  const handleCellClick = (x: number, y: number) => {
    if (!interactive || !onPointClick) return;
    soundManager.playStoneClick();
    onPointClick({ x, y });
  };

  // Dimensions
  const padding = showCoordinates ? 26 : 14;
  const cellSize = 38;
  const width = colsCount * cellSize + padding * 2;
  const height = rowsCount * cellSize + padding * 2;

  return (
    <div
      className={`relative select-none shadow-2xl rounded-xl border border-amber-900/40 p-2 sm:p-3 bg-gradient-to-br from-[#dfb074] via-[#cca064] to-[#b88c52] flex items-center justify-center max-w-full ${className}`}
      style={{
        width: '100%',
        maxWidth: `${width}px`,
        aspectRatio: `${width} / ${height}`,
      }}
    >
      {/* Wood grain overlay */}
      <div
        className="absolute inset-0 rounded-xl pointer-events-none opacity-20 mix-blend-multiply"
        style={{
          backgroundImage: `repeating-linear-gradient(45deg, #000 0, #000 1px, transparent 0, transparent 12px)`,
        }}
      />

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="relative z-10 block cursor-pointer w-full h-full"
        style={{
          width: '100%',
          height: '100%',
          maxWidth: '100%',
          maxHeight: '100%',
        }}
        onMouseLeave={() => setHoveredPoint(null)}
      >
        <defs>
          {/* Black Stone realistic gradient */}
          <radialGradient id="blackStoneGrad" cx="35%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#555558" />
            <stop offset="40%" stopColor="#222224" />
            <stop offset="100%" stopColor="#0a0a0c" />
          </radialGradient>

          {/* White Stone realistic clamshell gradient */}
          <radialGradient id="whiteStoneGrad" cx="35%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="60%" stopColor="#f7f5f0" />
            <stop offset="90%" stopColor="#e5dfd5" />
            <stop offset="100%" stopColor="#cfc8bc" />
          </radialGradient>

          {/* Stone drop shadow */}
          <filter id="stoneShadow" x="-20%" y="-20%" width="150%" height="150%">
            <feDropShadow dx="2" dy="3.5" stdDeviation="2" floodColor="#1a0f05" floodOpacity="0.55" />
          </filter>
        </defs>

        {/* Board grid lines */}
        {/* Horizontal lines */}
        {Array.from({ length: rowsCount }).map((_, rIdx) => {
          const yCoord = minY + rIdx;
          const py = padding + (rIdx + 0.5) * cellSize;
          const pxStart = padding + 0.5 * cellSize;
          const pxEnd = padding + (colsCount - 0.5) * cellSize;
          return (
            <line
              key={`h-${yCoord}`}
              x1={pxStart}
              y1={py}
              x2={pxEnd}
              y2={py}
              stroke="#432811"
              strokeWidth={yCoord === 0 || yCoord === boardSize - 1 ? 1.8 : 1.1}
            />
          );
        })}

        {/* Vertical lines */}
        {Array.from({ length: colsCount }).map((_, cIdx) => {
          const xCoord = minX + cIdx;
          const px = padding + (cIdx + 0.5) * cellSize;
          const pyStart = padding + 0.5 * cellSize;
          const pyEnd = padding + (rowsCount - 0.5) * cellSize;
          return (
            <line
              key={`v-${xCoord}`}
              x1={px}
              y1={pyStart}
              x2={px}
              y2={pyEnd}
              stroke="#432811"
              strokeWidth={xCoord === 0 || xCoord === boardSize - 1 ? 1.8 : 1.1}
            />
          );
        })}

        {/* Star points (Hoshi) */}
        {hoshiPoints.map((hp) => {
          const cx = padding + (hp.x - minX + 0.5) * cellSize;
          const cy = padding + (hp.y - minY + 0.5) * cellSize;
          return (
            <circle
              key={`hoshi-${hp.x}-${hp.y}`}
              cx={cx}
              cy={cy}
              r={3.4}
              fill="#3a200e"
            />
          );
        })}

        {/* Coordinates labels */}
        {showCoordinates && (
          <>
            {/* Top / Bottom column letters */}
            {Array.from({ length: colsCount }).map((_, cIdx) => {
              const xCoord = minX + cIdx;
              const letter = cols[xCoord] || String.fromCharCode(65 + xCoord);
              const cx = padding + (cIdx + 0.5) * cellSize;
              return (
                <g key={`col-letter-${xCoord}`}>
                  <text
                    x={cx}
                    y={padding * 0.55}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="fill-amber-950/70 font-semibold text-[11px] font-mono"
                  >
                    {letter}
                  </text>
                  <text
                    x={cx}
                    y={height - padding * 0.45}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="fill-amber-950/70 font-semibold text-[11px] font-mono"
                  >
                    {letter}
                  </text>
                </g>
              );
            })}

            {/* Left / Right row numbers */}
            {Array.from({ length: rowsCount }).map((_, rIdx) => {
              const yCoord = minY + rIdx;
              const rowNumber = boardSize - yCoord;
              const cy = padding + (rIdx + 0.5) * cellSize;
              return (
                <g key={`row-num-${yCoord}`}>
                  <text
                    x={padding * 0.45}
                    y={cy}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="fill-amber-950/70 font-semibold text-[11px] font-mono"
                  >
                    {rowNumber}
                  </text>
                  <text
                    x={width - padding * 0.45}
                    y={cy}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="fill-amber-950/70 font-semibold text-[11px] font-mono"
                  >
                    {rowNumber}
                  </text>
                </g>
              );
            })}
          </>
        )}

        {/* Interactive Cell hitboxes & Stones */}
        {Array.from({ length: rowsCount }).flatMap((_, rIdx) =>
          Array.from({ length: colsCount }).map((_, cIdx) => {
            const x = minX + cIdx;
            const y = minY + rIdx;
            const stone: PointState = board[y] ? board[y][x] : null;
            const cx = padding + (cIdx + 0.5) * cellSize;
            const cy = padding + (rIdx + 0.5) * cellSize;
            const radius = cellSize * 0.45;
            const isHovered = hoveredPoint?.x === x && hoveredPoint?.y === y;
            const isLastMove = lastMove?.x === x && lastMove?.y === y;
            const marker = markerMap.get(`${x},${y}`);
            const moveNumber = moveNumbersMap?.get(`${x},${y}`);

            return (
              <g
                key={`point-${x}-${y}`}
                onClick={() => handleCellClick(x, y)}
                onMouseEnter={() => setHoveredPoint({ x, y })}
                className="cursor-pointer"
              >
                {/* Hit target area */}
                <rect
                  x={cx - cellSize / 2}
                  y={cy - cellSize / 2}
                  width={cellSize}
                  height={cellSize}
                  fill="transparent"
                />

                {/* Stone */}
                {stone && (
                  <circle
                    cx={cx}
                    cy={cy}
                    r={radius}
                    fill={stone === 'black' ? 'url(#blackStoneGrad)' : 'url(#whiteStoneGrad)'}
                    filter="url(#stoneShadow)"
                    stroke={stone === 'white' ? '#bcaba0' : '#111'}
                    strokeWidth={0.5}
                  />
                )}

                {/* Move Number on stone */}
                {stone && showMoveNumbers && moveNumber !== undefined && (
                  <text
                    x={cx}
                    y={cy + 0.5}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill={stone === 'black' ? '#ffffff' : '#000000'}
                    fontSize={moveNumber >= 100 ? 10 : 12}
                    fontWeight="bold"
                    className="pointer-events-none select-none font-mono"
                  >
                    {moveNumber}
                  </text>
                )}

                {/* Last move marker ring */}
                {stone && isLastMove && !showMoveNumbers && (
                  <circle
                    cx={cx}
                    cy={cy}
                    r={radius * 0.42}
                    fill="none"
                    stroke={stone === 'black' ? '#ef4444' : '#dc2626'}
                    strokeWidth={2.4}
                    className="pointer-events-none animate-pulse"
                  />
                )}

                {/* Marker (Letters, territory, symbols) */}
                {marker && (
                  <g className="pointer-events-none">
                    {marker.type === 'letter' && (
                      <g>
                        <circle
                          cx={cx}
                          cy={cy}
                          r={radius * 0.75}
                          fill={marker.color || '#3b82f6'}
                          className="opacity-95 shadow"
                        />
                        <text
                          x={cx}
                          y={cy + 1}
                          textAnchor="middle"
                          dominantBaseline="central"
                          fill="#ffffff"
                          fontSize={14}
                          fontWeight="bold"
                          className="font-sans"
                        >
                          {marker.label}
                        </text>
                      </g>
                    )}
                    {marker.type === 'territory-black' && (
                      <rect
                        x={cx - 5}
                        y={cy - 5}
                        width={10}
                        height={10}
                        fill="#000000"
                        className="opacity-80"
                      />
                    )}
                    {marker.type === 'territory-white' && (
                      <rect
                        x={cx - 5}
                        y={cy - 5}
                        width={10}
                        height={10}
                        fill="#ffffff"
                        stroke="#666"
                        strokeWidth={1}
                        className="opacity-90"
                      />
                    )}
                    {marker.type === 'triangle' && (
                      <polygon
                        points={`${cx},${cy - 8} ${cx - 7},${cy + 6} ${cx + 7},${cy + 6}`}
                        fill="none"
                        stroke={stone === 'black' ? '#ffffff' : '#000000'}
                        strokeWidth={2}
                      />
                    )}
                  </g>
                )}

                {/* Hover ghost stone */}
                {!stone && isHovered && interactive && hoverColor && (
                  <circle
                    cx={cx}
                    cy={cy}
                    r={radius}
                    fill={hoverColor === 'black' ? 'rgba(20, 20, 20, 0.45)' : 'rgba(255, 255, 255, 0.55)'}
                    stroke={hoverColor === 'black' ? '#111' : '#fff'}
                    strokeWidth={1}
                    strokeDasharray="3 3"
                    className="pointer-events-none"
                  />
                )}
              </g>
            );
          })
        )}
      </svg>
    </div>
  );
};
