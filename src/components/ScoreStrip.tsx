import { useState } from 'react';
import { Pencil, Check } from 'lucide-react';
import { GameMode, Player, ScoreBoard, SeriesFormat } from '../types/game';

interface ScoreStripProps {
  scores: ScoreBoard;
  playerNames: Record<Player, string>;
  onUpdateName: (player: Player, name: string) => void;
  currentTurn: Player;
  isRoundOver: boolean;
  winner: Player | 'DRAW' | null;
  gameMode: GameMode;
  seriesFormat: SeriesFormat;
  targetWins: number | null;
}

export function ScoreStrip({
  scores,
  playerNames,
  onUpdateName,
  currentTurn,
  isRoundOver,
  winner,
  gameMode,
  seriesFormat,
  targetWins,
}: ScoreStripProps) {
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [draftName, setDraftName] = useState('');

  const startEditing = (player: Player) => {
    if (gameMode === 'ai' && player === 'O') return;
    setEditingPlayer(player);
    setDraftName(playerNames[player]);
  };

  const commitEdit = () => {
    if (editingPlayer) {
      const trimmed = draftName.trim();
      onUpdateName(
        editingPlayer,
        trimmed || (editingPlayer === 'X' ? 'Player 1' : 'Player 2')
      );
      setEditingPlayer(null);
    }
  };

  const renderPlayerCard = (player: Player) => {
    const isX = player === 'X';
    const isActiveTurn = !isRoundOver && currentTurn === player;
    const isWinner = isRoundOver && winner === player;
    const canEdit = !(gameMode === 'ai' && player === 'O');
    const displayName =
      gameMode === 'ai' && player === 'O' ? 'Computer' : playerNames[player];

    const activeBorder = isX ? 'border-red-600 bg-white' : 'border-blue-600 bg-white';
    const idleBorder = 'border-slate-200 bg-white/80';

    return (
      <div
        className={`relative rounded-xl border px-4 py-3.5 transition-colors duration-150 ${
          isActiveTurn || isWinner ? activeBorder : idleBorder
        }`}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span
              className={`font-display text-sm font-bold shrink-0 ${
                isX ? 'text-red-600' : 'text-blue-600'
              }`}
            >
              {player}
            </span>
            {editingPlayer === player ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  commitEdit();
                }}
                className="flex items-center gap-1 min-w-0"
              >
                <input
                  type="text"
                  value={draftName}
                  maxLength={16}
                  autoFocus
                  onChange={(e) => setDraftName(e.target.value)}
                  onBlur={commitEdit}
                  aria-label={`Edit ${player} name`}
                  className="w-full min-w-0 rounded border border-slate-300 bg-slate-50 px-1.5 py-0.5 text-sm font-medium text-slate-900 focus:border-slate-900 focus:outline-none"
                />
                <button
                  type="submit"
                  aria-label="Save player name"
                  className="p-1 text-slate-600 hover:text-slate-900 shrink-0"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
              </form>
            ) : (
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="truncate text-sm font-semibold text-slate-900">
                  {displayName}
                </span>
                {canEdit && (
                  <button
                    type="button"
                    onClick={() => startEditing(player)}
                    title="Rename player"
                    aria-label={`Rename ${displayName}`}
                    className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
                  >
                    <Pencil className="w-3 h-3" />
                  </button>
                )}
              </div>
            )}
          </div>

          <span className="font-mono text-2xl font-semibold tabular-nums text-slate-900 shrink-0">
            {scores[player]}
          </span>
        </div>

        <div className="mt-1.5 flex items-center justify-between text-xs text-slate-500">
          <span
            className={
              isWinner
                ? isX
                  ? 'font-semibold text-red-700'
                  : 'font-semibold text-blue-700'
                : isActiveTurn
                  ? 'font-semibold text-slate-900'
                  : 'text-slate-500'
            }
          >
            {isWinner
              ? 'Round Winner'
              : isActiveTurn
                ? 'Active Turn'
                : isRoundOver
                  ? 'Waiting'
                  : 'Next Up'}
          </span>
          {seriesFormat !== 0 && targetWins !== null && (
            <span className="font-mono tabular-nums text-slate-400">
              {scores[player]}/{targetWins}
            </span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] gap-3 items-stretch">
      {renderPlayerCard('X')}

      <div className="rounded-xl border border-slate-200 bg-white/80 px-4 py-3.5 flex sm:flex-col items-center justify-between sm:justify-center gap-1 min-w-[92px]">
        <span className="text-xs font-medium text-slate-500">Draws</span>
        <span className="font-mono text-2xl font-semibold tabular-nums text-slate-700">
          {scores.draws}
        </span>
      </div>

      {renderPlayerCard('O')}
    </div>
  );
}
