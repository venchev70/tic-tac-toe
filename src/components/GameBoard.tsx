import { useState } from 'react';
import { motion } from 'motion/react';
import { CellValue, Player, WinInfo } from '../types/game';
import { getCellCoordinate, getWinLineCoords } from '../utils/gameLogic';
import { MarkIcon } from './MarkIcon';

interface GameBoardProps {
  board: CellValue[];
  currentTurn: Player;
  winInfo: WinInfo | null;
  isDraw: boolean;
  disabled: boolean;
  vanishingCellIndex: number | null;
  lastMoveIndex: number | null;
  showCoordinates: boolean;
  onCellClick: (index: number) => void;
}

export function GameBoard({
  board,
  currentTurn,
  winInfo,
  isDraw,
  disabled,
  vanishingCellIndex,
  lastMoveIndex,
  showCoordinates,
  onCellClick,
}: GameBoardProps) {
  const [hoveredCell, setHoveredCell] = useState<number | null>(null);

  const winLineCoords = winInfo ? getWinLineCoords(winInfo.line) : null;
  const winStrokeColor = winInfo?.winner === 'X' ? '#DC2626' : '#2563EB';

  return (
    <div className="relative mx-auto w-full max-w-[440px]">
      <div
        role="grid"
        aria-label="Tic-Tac-Toe 3 by 3 board"
        className="relative grid grid-cols-3 gap-2.5 sm:gap-3 rounded-2xl border border-slate-200 bg-white p-3 sm:p-4 shadow-sm"
      >
        {board.map((cell, index) => {
          const isWinningCell = winInfo?.line.includes(index) ?? false;
          const isDimmed = Boolean(winInfo && !isWinningCell) || isDraw;
          const isVanishing = !winInfo && !isDraw && vanishingCellIndex === index;
          const isPlayable = cell === null && !disabled && !winInfo && !isDraw;
          const showGhost = isPlayable && hoveredCell === index;
          const coord = getCellCoordinate(index);
          const isLastMove = lastMoveIndex === index && !winInfo && !isDraw;

          return (
            <button
              key={index}
              type="button"
              role="gridcell"
              disabled={!isPlayable}
              onClick={() => onCellClick(index)}
              onMouseEnter={() => setHoveredCell(index)}
              onMouseLeave={() => setHoveredCell((prev) => (prev === index ? null : prev))}
              aria-label={`Square ${coord}${
                cell
                  ? `, occupied by ${cell}${isVanishing ? ', vanishes on next move' : ''}`
                  : ', empty'
              }`}
              className={`group relative aspect-square w-full min-h-[88px] rounded-xl border transition-all duration-150 flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2 ${
                isWinningCell
                  ? winInfo?.winner === 'X'
                    ? 'border-red-300 bg-red-50/70'
                    : 'border-blue-300 bg-blue-50/70'
                  : isLastMove
                    ? 'border-slate-300 bg-slate-50/90'
                    : isPlayable
                      ? 'border-slate-200 bg-slate-50/40 hover:border-slate-300 hover:bg-slate-50 cursor-pointer active:scale-[0.98]'
                      : 'border-slate-200/80 bg-slate-50/30 cursor-default'
              }`}
            >
              {showCoordinates && (
                <span className="pointer-events-none absolute top-2 left-2.5 font-mono text-[11px] font-medium text-slate-400">
                  {coord}
                </span>
              )}

              {isVanishing && (
                <span className="pointer-events-none absolute bottom-1.5 inset-x-1 text-center text-[11px] font-medium text-slate-500">
                  Next out
                </span>
              )}

              {cell ? (
                <MarkIcon
                  player={cell}
                  vanishing={isVanishing}
                  dimmed={isDimmed}
                />
              ) : showGhost ? (
                <MarkIcon player={currentTurn} ghost />
              ) : null}
            </button>
          );
        })}

        {winLineCoords && (
          <svg
            viewBox="0 0 300 300"
            aria-hidden="true"
            className="pointer-events-none absolute inset-3 sm:inset-4 h-[calc(100%-1.5rem)] w-[calc(100%-1.5rem)] sm:h-[calc(100%-2rem)] sm:w-[calc(100%-2rem)]"
          >
            <motion.line
              x1={winLineCoords.x1}
              y1={winLineCoords.y1}
              x2={winLineCoords.x2}
              y2={winLineCoords.y2}
              stroke={winStrokeColor}
              strokeWidth="8"
              strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0.4 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
            />
          </svg>
        )}
      </div>
    </div>
  );
}
