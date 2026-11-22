import {
  AIDifficulty,
  GameMode,
  MoveRecord,
  Player,
  RoundHistoryItem,
  RuleVariant,
  SeriesFormat,
  StarterRule,
} from '../types/game';

interface MatchSidebarProps {
  gameMode: GameMode;
  onChangeGameMode: (mode: GameMode) => void;
  aiDifficulty: AIDifficulty;
  onChangeAIDifficulty: (diff: AIDifficulty) => void;
  ruleVariant: RuleVariant;
  onChangeRuleVariant: (variant: RuleVariant) => void;
  seriesFormat: SeriesFormat;
  onChangeSeriesFormat: (series: SeriesFormat) => void;
  starterRule: StarterRule;
  onChangeStarterRule: (rule: StarterRule) => void;
  showCoordinates: boolean;
  onToggleCoordinates: () => void;
  moveLog: MoveRecord[];
  roundHistory: RoundHistoryItem[];
  playerNames: Record<Player, string>;
}

export function MatchSidebar({
  gameMode,
  onChangeGameMode,
  aiDifficulty,
  onChangeAIDifficulty,
  ruleVariant,
  onChangeRuleVariant,
  seriesFormat,
  onChangeSeriesFormat,
  starterRule,
  onChangeStarterRule,
  showCoordinates,
  onToggleCoordinates,
  moveLog,
  roundHistory,
  playerNames,
}: MatchSidebarProps) {
  const getPlayerLabel = (p: Player) => {
    if (gameMode === 'ai' && p === 'O') return 'Computer';
    return playerNames[p];
  };

  return (
    <aside className="space-y-6">
      {/* Match Setup */}
      <section
        id="rules"
        className="rounded-2xl border border-slate-200 bg-white p-5 space-y-5"
      >
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="font-display text-base font-bold text-slate-900">
            Match Setup
          </h2>
          <button
            type="button"
            onClick={onToggleCoordinates}
            className="text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 rounded px-1.5 py-0.5"
          >
            {showCoordinates ? 'Hide Grid Labels' : 'Show Grid Labels'}
          </button>
        </div>

        {/* Mode Selector */}
        <div className="space-y-2">
          <label className="block text-xs font-medium text-slate-600">
            Opponent Mode
          </label>
          <div className="grid grid-cols-2 gap-1 rounded-lg bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => onChangeGameMode('local')}
              className={`px-3 py-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                gameMode === 'local'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Local 2-Player
            </button>
            <button
              type="button"
              onClick={() => onChangeGameMode('ai')}
              className={`px-3 py-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                gameMode === 'ai'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              vs Computer
            </button>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            {gameMode === 'local'
              ? 'Pass-and-play on this device. Click any player name on the scoreboard to customize.'
              : 'Play X against a local computer opponent.'}
          </p>
        </div>

        {gameMode === 'ai' && (
          <div className="space-y-2">
            <label className="block text-xs font-medium text-slate-600">
              Computer Difficulty
            </label>
            <div className="grid grid-cols-2 gap-1 rounded-lg bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => onChangeAIDifficulty('easy')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                  aiDifficulty === 'easy'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Casual
              </button>
              <button
                type="button"
                onClick={() => onChangeAIDifficulty('unbeatable')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                  aiDifficulty === 'unbeatable'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Unbeatable
              </button>
            </div>
          </div>
        )}

        {/* Rule Variant */}
        <div className="space-y-2">
          <label className="block text-xs font-medium text-slate-600">
            Ruleset
          </label>
          <div className="grid grid-cols-2 gap-1 rounded-lg bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => onChangeRuleVariant('classic')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                ruleVariant === 'classic'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Classic 3×3
            </button>
            <button
              type="button"
              onClick={() => onChangeRuleVariant('bolt')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                ruleVariant === 'bolt'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Bolt (3-Mark)
            </button>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            {ruleVariant === 'classic'
              ? 'Standard 3-in-a-row rules. Nine squares total; full board without a line is a draw.'
              : 'Each player keeps at most 3 marks on the board. Placing a 4th removes your oldest mark—no draws.'}
          </p>
        </div>

        {/* Series & Starter */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-600">
              Series Format
            </label>
            <div className="grid grid-cols-3 gap-1 rounded-lg bg-slate-100 p-1">
              {([0, 3, 5] as SeriesFormat[]).map((fmt) => (
                <button
                  key={fmt}
                  type="button"
                  onClick={() => onChangeSeriesFormat(fmt)}
                  className={`px-2 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                    seriesFormat === fmt
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {fmt === 0 ? 'Free' : `Bo${fmt}`}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-600">
              First Turn
            </label>
            <div className="grid grid-cols-2 gap-1 rounded-lg bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => onChangeStarterRule('alternate')}
                className={`px-2 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                  starterRule === 'alternate'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Alternate
              </button>
              <button
                type="button"
                onClick={() => onChangeStarterRule('always-x')}
                className={`px-2 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                  starterRule === 'always-x'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Always X
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Move Log & Round History */}
      <section
        id="history"
        className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4"
      >
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="font-display text-base font-bold text-slate-900">
            Round Log
          </h2>
          <span className="font-mono text-xs tabular-nums text-slate-500">
            {moveLog.length} {moveLog.length === 1 ? 'move' : 'moves'}
          </span>
        </div>

        {moveLog.length === 0 ? (
          <p className="text-xs text-slate-500 py-2">
            No moves played in this round yet. Select any square or press keys 1–9.
          </p>
        ) : (
          <ol className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
            {moveLog.map((move) => (
              <li
                key={move.moveNumber}
                className="flex items-center justify-between text-xs py-1 border-b border-slate-100 last:border-b-0"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-mono tabular-nums text-slate-400 w-5 shrink-0">
                    {move.moveNumber}.
                  </span>
                  <span
                    className={`font-semibold shrink-0 ${
                      move.player === 'X' ? 'text-red-600' : 'text-blue-600'
                    }`}
                  >
                    {move.player}
                  </span>
                  <span className="truncate text-slate-700">
                    {getPlayerLabel(move.player)}
                  </span>
                </div>
                <span className="font-mono tabular-nums text-slate-600 shrink-0">
                  {move.coordinate}
                  {move.removedCellIndex !== null ? ' (rotated)' : ''}
                </span>
              </li>
            ))}
          </ol>
        )}

        {roundHistory.length > 0 && (
          <div className="pt-3 border-t border-slate-100 space-y-2">
            <h3 className="text-xs font-semibold text-slate-700">
              Completed Rounds
            </h3>
            <ul className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
              {roundHistory.map((item) => (
                <li
                  key={item.roundNumber}
                  className="flex items-center justify-between text-xs text-slate-600"
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="font-mono tabular-nums text-slate-400">
                      R{item.roundNumber}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span
                      className={
                        item.winner === 'X'
                          ? 'font-semibold text-red-700 truncate'
                          : item.winner === 'O'
                            ? 'font-semibold text-blue-700 truncate'
                            : 'font-medium text-slate-600 truncate'
                      }
                    >
                      {item.winner === 'DRAW'
                        ? 'Draw'
                        : `${getPlayerLabel(item.winner)} (${item.winner}) won`}
                    </span>
                  </div>
                  <span className="font-mono tabular-nums text-slate-400 shrink-0">
                    {item.movesCount}m · {item.variant === 'bolt' ? 'Bolt' : 'Classic'}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </aside>
  );
}
